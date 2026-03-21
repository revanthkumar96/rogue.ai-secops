"""
LangGraph LLM Agent with multi-provider support.

Supports Ollama, Groq, and other LLM providers through abstraction.
"""

import asyncio
from typing import Annotated, Any, Dict, List, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode

from ..services.llm_provider import LLMProvider, OllamaProvider


# Define the state for our agent graph
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], lambda x, y: x + y]
    agent_name: str
    target_url: str
    repo_path: str


class LangGraphLLMAgent:
    """
    LangGraph agent with multi-provider LLM support.

    Supports Ollama and Groq providers through abstraction layer.
    """

    def __init__(
        self,
        name: str,
        provider: LLMProvider,
        tools: List[Any] = [],
        log_callback=None,
        token_callback=None
    ):
        """
        Initialize LangGraph LLM agent.

        Args:
            name: Agent name
            provider: LLM provider instance
            tools: List of LangChain tools
            log_callback: Callback for logging thoughts/actions
            token_callback: Callback for tracking token usage
        """
        self.name = name
        self.provider = provider
        self.log_callback = log_callback
        self.token_callback = token_callback

        # Tools are defined as LangChain tools
        self.tools = tools
        self.tools_map = {t.name: t for t in tools}
        self.tool_node = ToolNode(tools) if tools else None

        # Convert tools to provider format
        if isinstance(provider, OllamaProvider):
            self.provider_tools = self._convert_to_ollama_tools(tools)
        else:
            # Groq and other OpenAI-compatible providers
            self.provider_tools = self._convert_to_openai_tools(tools)

        self.graph = self._build_graph()

    def _convert_to_ollama_tools(self, tools: List[Any]) -> List[Dict[str, Any]]:
        """Convert LangChain tools to Ollama format."""
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

    def _convert_to_openai_tools(self, tools: List[Any]) -> List[Dict[str, Any]]:
        """Convert LangChain tools to OpenAI/Groq format."""
        openai_tools = []
        for t in tools:
            openai_tools.append(
                {
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description,
                        "parameters": t.args_schema.schema() if hasattr(t, "args_schema") else {},
                    },
                }
            )
        return openai_tools

    def _build_graph(self):
        """Build LangGraph workflow."""
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

    def _convert_messages_to_dict(self, messages: List[BaseMessage]) -> List[Dict[str, Any]]:
        """Convert LangChain messages to dictionary format for providers."""
        dict_msgs = []
        for m in messages:
            if isinstance(m, HumanMessage):
                dict_msgs.append({"role": "user", "content": m.content})
            elif isinstance(m, AIMessage):
                msg = {"role": "assistant", "content": m.content}
                if m.tool_calls:
                    # Include tool calls in message
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
                dict_msgs.append(msg)
            elif isinstance(m, ToolMessage):
                dict_msgs.append({"role": "tool", "content": m.content})
        return dict_msgs

    async def _call_model(self, state: AgentState):
        """Call LLM model through provider abstraction."""
        messages = self._convert_messages_to_dict(state["messages"])

        # For Ollama provider, use native client with tools
        if isinstance(self.provider, OllamaProvider):
            response = await self.provider.client.chat(
                model=self.provider.model,
                messages=messages,
                tools=self.provider_tools if self.provider_tools else None,
            )
            message = response["message"]
            msg_content = message.get("content", "")
            provider_tool_calls = message.get("tool_calls", []) or []

            # Track token usage
            if self.token_callback:
                input_tokens = self.provider.count_messages_tokens(messages)
                output_tokens = self.provider.count_tokens(msg_content)
                await self.token_callback(self.name, input_tokens, output_tokens)

        else:
            # For Groq and other OpenAI-compatible providers
            from groq import AsyncGroq

            # Use Groq SDK directly for tool calling support
            if hasattr(self.provider, 'client') and isinstance(self.provider.client, AsyncGroq):
                response_obj = await self.provider.client.chat.completions.create(
                    model=self.provider.model,
                    messages=messages,
                    tools=self.provider_tools if self.provider_tools else None,
                    tool_choice="auto" if self.provider_tools else None,
                )

                msg_content = response_obj.choices[0].message.content or ""

                # Extract tool calls from response
                provider_tool_calls = []
                if response_obj.choices[0].message.tool_calls:
                    for tc in response_obj.choices[0].message.tool_calls:
                        provider_tool_calls.append({
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            }
                        })

                # Track token usage
                if self.token_callback:
                    usage = response_obj.usage
                    await self.token_callback(
                        self.name,
                        usage.prompt_tokens,
                        usage.completion_tokens
                    )
            else:
                # Fallback to provider abstraction (no tool calling)
                response = await self.provider.chat(messages=messages)
                msg_content = response["content"]
                provider_tool_calls = []

                # Track token usage from provider response
                if self.token_callback:
                    usage = response.get("usage", {})
                    input_tokens = usage.get("prompt_tokens", 0)
                    output_tokens = usage.get("completion_tokens", 0)
                    await self.token_callback(self.name, input_tokens, output_tokens)

        # Log thoughts
        if msg_content:
            print(f"[{self.name}] Thinking: {msg_content[:150]}...")
            if self.log_callback:
                await self.log_callback(self.name, "thought", msg_content)

        # Convert tool calls back to LangChain format
        tool_calls = []
        for tc in provider_tool_calls:
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
        """Determine if agent should continue with tool calls."""
        last_message = state["messages"][-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "continue"
        return "end"

    async def run(self, prompt: str, **kwargs) -> str:
        """
        Run agent with given prompt.

        Args:
            prompt: User prompt/query
            **kwargs: Additional context (webUrl, repoPath, etc.)

        Returns:
            Agent response as string
        """
        initial_state = {
            "messages": [HumanMessage(content=prompt)],
            "agent_name": self.name,
            "target_url": kwargs.get("webUrl", ""),
            "repo_path": kwargs.get("repoPath", ""),
        }
        final_state = await self.graph.ainvoke(initial_state)
        return final_state["messages"][-1].content


# Backward compatibility alias
LangGraphOllamaAgent = LangGraphLLMAgent
