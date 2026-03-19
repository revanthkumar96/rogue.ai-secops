from temporalio import activity

from ..agents.ollama import LangGraphOllamaAgent
from ..config.parser import RougeSettings
from ..session_manager import AGENTS
from ..types.temporal_types import (
    AgentActivityInput,
    AgentActivityResult,
    ExploitQueueInput,
    ReportInput,
)

# Shared settings instance
settings = RougeSettings()


@activity.defn(name="run_agent_activity")
async def run_agent_activity(input: AgentActivityInput) -> AgentActivityResult:
    # 1. Load agent definition
    agent_def = AGENTS.get(input.agent_name)
    if not agent_def:
        raise ValueError(f"Unknown agent: {input.agent_name}")

    # 2. Resolve model name based on tier
    model_name = getattr(settings, f"ollama_{agent_def.model_tier}_model")

    # 3. Initialize agent with log callback that signals back to the workflow
    async def log_callback(agent_name, log_type, content):
        try:
            # We use external client to signal the workflow from the activity
            # In a production environment, we might use a dedicated logging service
            # but for Temporal local dev, signaling the parent workflow is effective.
            handle = activity.get_external_workflow_handle(activity.info().workflow_id)
            await handle.signal("add_log", {
                "agent": agent_name,
                "type": log_type,
                "content": content,
                "timestamp": activity.info().scheduled_time.isoformat() if activity.info().scheduled_time else ""
            })
        except Exception as e:
            activity.logger.error(f"Failed to signal log: {e}")

    agent = LangGraphOllamaAgent(
        name=input.agent_name,
        model_name=model_name,
        base_url=settings.ollama_base_url,
        log_callback=log_callback
    )

    # 4. Load prompt
    prompt = f"Perform {agent_def.display_name} for {input.web_url} in repository {input.repo_path}"

    # 5. Run agent
    result = await agent.run(prompt)

    # 6. Return typed result
    return AgentActivityResult(
        success=True,
        result=result,
        metrics={
            "duration_ms": 0.0,
            "model": model_name,
            "cost_usd": 0.0,
        },
    )


@activity.defn(name="check_exploitation_queue")
async def check_exploitation_queue(input: ExploitQueueInput) -> bool:
    # Logic to check if any vulnerabilities were found
    return True


@activity.defn(name="assemble_report")
async def assemble_report(input: ReportInput) -> str:
    # Logic to assemble deliverables into one report
    return "Final Report Content"
