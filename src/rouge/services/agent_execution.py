import time
from typing import Optional, Dict, Any
from .prompt_manager import PromptManager
from ..agents.ollama import LangGraphOllamaAgent
from ..session_manager import AGENTS
from ..types.models import AgentName, AgentMetrics
from .git_manager import GitManager
from ..mcp.server import RougeMcpServer
from ..mcp.utils import mcp_to_langchain_tools

class AgentExecutionService:
    def __init__(self, prompt_manager: PromptManager, git_manager: GitManager, ollama_url: str):
        self.prompt_manager = prompt_manager
        self.git_manager = git_manager
        self.ollama_url = ollama_url
    
    async def execute(self, agent_name: AgentName, web_url: str, repo_path: str, config: Optional[Any] = None) -> Dict[str, Any]:
        agent_def = AGENTS[agent_name]
        
        # 1. Prepare Git Checkpoint
        self.git_manager.create_checkpoint(repo_path, agent_name)
        
        # 2. Setup MCP Server and Tools for this execution
        mcp_server = RougeMcpServer(repo_path)
        tools = mcp_to_langchain_tools(mcp_server)
        
        # 3. Load Prompt
        prompt = self.prompt_manager.load_prompt(
            agent_def.prompt_template,
            {"web_url": web_url, "repo_path": repo_path},
            config
        )
        
        # 4. Initialize LangGraph Agent
        # Picking model based on tier
        model_name = "llama3.1:8b" # Simplified for now
        agent = LangGraphOllamaAgent(agent_name, model_name, self.ollama_url, tools=tools)
        
        # 5. Run Agent
        start_time = time.time()
        result = await agent.run(prompt, webUrl=web_url, repoPath=repo_path)
        duration = (time.time() - start_time) * 1000
        
        # 6. Success Validation & Committing
        self.git_manager.commit_success(repo_path, agent_name)
        
        return {
            "success": True,
            "result": result,
            "metrics": AgentMetrics(
                duration_ms=duration,
                model=model_name,
                cost_usd=0.0,
                num_turns=1
            )
        }
