from typing import Annotated, Any, Dict, List, TypedDict

import ollama
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode


# Define the state for our agent graph
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], lambda x, y: x + y]
    agent_name: str
    target_url: str
    repo_path: str


class LangGraphOllamaAgent:
    def __init__(self, name: str, model_name: str, base_url: str, tools: List[Any] = [], log_callback=None):
        self.name = name
        self.model_name = model_name
        self.base_url = base_url
        self.client = ollama.AsyncClient(host=base_url)
        self.log_callback = log_callback

        # Tools are defined as LangChain tools, we need to convert them to Ollama format
        self.ollama_tools = self._convert_to_ollama_tools(tools)
        self.tools_map = {t.name: t for t in tools}
        self.tool_node = ToolNode(tools) if tools else None
        self.graph = self._build_graph()

    def _convert_to_ollama_tools(self, tools: List[Any]) -> List[Dict[str, Any]]:
        ollama_tools = []
        for t in tools:
            ollama_tools.append(
                {
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description,
                        "parameters": t.args_schema.schema() if hasattr(t, "args_schema") else {},
                    },
                }
            )
        return ollama_tools

    def _build_graph(self):
        workflow = StateGraph(AgentState)

        workflow.add_node("agent", self._call_model)
        if self.tool_node:
            workflow.add_node("tools", self.tool_node)

        workflow.add_edge(START, "agent")

        if self.tool_node:
            workflow.add_conditional_edges(
                "agent",
                self._should_continue,
                {
                    "continue": "tools",
                    "end": END,
                },
            )
            workflow.add_edge("tools", "agent")
        else:
            workflow.add_edge("agent", END)

        return workflow.compile()

    def _convert_messages_to_ollama(self, messages: List[BaseMessage]) -> List[Dict[str, Any]]:
        ollama_msgs = []
        for m in messages:
            if isinstance(m, HumanMessage):
                ollama_msgs.append({"role": "user", "content": m.content})
            elif isinstance(m, AIMessage):
                msg = {"role": "assistant", "content": m.content}
                if m.tool_calls:
                    # Convert LangChain tool calls to Ollama format
                    msg["tool_calls"] = [
                        {
                            "type": "function",
                            "function": {
                                "name": tc["name"],
                                "arguments": tc["args"],
                            },
                        }
                        for tc in m.tool_calls
                    ]
                ollama_msgs.append(msg)
            elif isinstance(m, ToolMessage):
                ollama_msgs.append({"role": "tool", "content": m.content})
        return ollama_msgs

    async def _call_model(self, state: AgentState):
        messages = self._convert_messages_to_ollama(state["messages"])

        response = await self.client.chat(
            model=self.model_name,
            messages=messages,
            tools=self.ollama_tools if self.ollama_tools else None,
        )

        message = response["message"]
        msg_content = message.get("content", "")
        ollama_tool_calls = message.get("tool_calls", []) or []

        if msg_content:
            print(f"[{self.name}] Thinking: {msg_content[:150]}...")
            if self.log_callback:
                await self.log_callback(self.name, "thought", msg_content)

        # Convert back to LangChain-style messages for the graph state
        tool_calls = []
        for tc in ollama_tool_calls:
            # Handle potential different response structures from Ollama models
            fn = tc.get("function")
            if fn:
                name = fn["name"]
                args = fn["arguments"]
                print(f"[{self.name}] Calling Tool: {name}({args})")
                if self.log_callback:
                    await self.log_callback(self.name, "tool", f"{name}({args})")
                tool_calls.append(
                    {
                        "name": name,
                        "args": args,
                        "id": f"call_{int(asyncio.get_event_loop().time())}",
                    }
                )

        ai_msg = AIMessage(content=msg_content, tool_calls=tool_calls)
        return {"messages": [ai_msg]}

    def _should_continue(self, state: AgentState):
        last_message = state["messages"][-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "continue"
        return "end"

    async def run(self, prompt: str, **kwargs) -> str:
        initial_state = {
            "messages": [HumanMessage(content=prompt)],
            "agent_name": self.name,
            "target_url": kwargs.get("webUrl", ""),
            "repo_path": kwargs.get("repoPath", ""),
        }
        final_state = await self.graph.ainvoke(initial_state)
        return final_state["messages"][-1].content
