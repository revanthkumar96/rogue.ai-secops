from temporalio import activity
from typing import Dict, Any
from ..session_manager import AGENTS
from ..config.parser import RougeSettings, load_config
from ..agents.ollama import LangGraphOllamaAgent
from ..types.models import AgentName, AgentMetrics

# Shared settings instance
settings = RougeSettings()

@activity.defn
async def run_agent_activity(agent_name: str, web_url: str, repo_path: str, config_path: str = None) -> Dict[str, Any]:
    # 1. Load agent definition
    agent_def = AGENTS.get(agent_name)
    if not agent_def:
        raise ValueError(f"Unknown agent: {agent_name}")
    
    # 2. Resolve model name based on tier
    model_name = getattr(settings, f"ollama_{agent_def.model_tier}_model")
    
    # 3. Initialize agent
    agent = LangGraphOllamaAgent(
        name=agent_name,
        model_name=model_name,
        base_url=settings.ollama_base_url
    )
    
    # 4. Load prompt (Simplified: just using the template name for now)
    # In a real implementation, we'd use PromptManager to load from prompts/ folder
    prompt = f"Perform {agent_def.display_name} for {web_url} in repository {repo_path}"
    
    # 5. Run agent
    # activity.heartbeat("Agent running...")
    result = await agent.run(prompt)
    
    # 6. Return metrics and result
    return {
        "success": True,
        "result": result,
        "metrics": {
            "duration_ms": 0.0, # Will be timed
            "model": model_name,
            "cost_usd": 0.0
        }
    }

@activity.defn
async def check_exploitation_queue(vuln_type: str, repo_path: str) -> bool:
    # Logic to check if any vulnerabilities were found
    return True

@activity.defn
async def assemble_report(repo_path: str) -> str:
    # Logic to assemble deliverables into one report
    return "Final Report Content"
