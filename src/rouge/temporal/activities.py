import os
import time
from pathlib import Path
from typing import Optional

from temporalio import activity
from temporalio.client import Client

from ..agents.ollama import LangGraphOllamaAgent
from ..config.parser import RougeSettings
from ..services.prompt_manager import PromptManager
from ..session_manager import AGENTS
from ..tools.agent_tools import create_agent_tools
from ..types.temporal_types import (
    AgentActivityInput,
    AgentActivityResult,
    ExploitQueueInput,
    ReportInput,
)

# Shared settings instance
settings = RougeSettings()

# Temporal client for signaling workflows from activities
_temporal_client: Optional[Client] = None

# Prompt manager for loading Jinja2 templates
_prompt_manager: Optional[PromptManager] = None


def set_temporal_client(client: Client) -> None:
    """Set the Temporal client for use in activities (called by worker on startup)."""
    global _temporal_client
    _temporal_client = client


def _get_prompt_manager() -> PromptManager:
    """Lazily initialize the prompt manager."""
    global _prompt_manager
    if _prompt_manager is None:
        # Find prompts directory relative to the package root
        package_root = Path(__file__).parent.parent.parent.parent
        prompts_dir = package_root / "prompts"
        _prompt_manager = PromptManager(str(prompts_dir))
    return _prompt_manager


def _build_autonomous_prompt(agent_def, input: AgentActivityInput) -> str:
    """Build a prompt that instructs the agent to ACT autonomously using tools.

    Tries to load the Jinja2 template first; falls back to a structured
    autonomous prompt if the template is missing.
    """
    # Try loading the Jinja2 prompt template
    template_prompt = ""
    try:
        pm = _get_prompt_manager()
        template_prompt = pm.load_prompt(
            agent_def.prompt_template,
            variables={
                "WEB_URL": input.web_url or "N/A",
                "REPO_PATH": input.repo_path or "N/A",
                "FRAMEWORK_PREFERENCE": "playwright",
                "CI_PLATFORM": "github-actions",
            },
        )
    except Exception as e:
        activity.logger.warning(f"Could not load prompt template '{agent_def.prompt_template}': {e}")

    # Build the autonomous execution prefix
    autonomous_prefix = f"""You are an AUTONOMOUS software agent. You MUST use your tools to take action — do NOT just give suggestions or instructions.

TARGET REPOSITORY: {input.repo_path}
TARGET APPLICATION: {input.web_url or 'N/A'}
YOUR ROLE: {agent_def.display_name}
DELIVERABLE FILE: {agent_def.deliverable_filename}

CRITICAL RULES:
1. You MUST use the `list_directory` tool first to understand the project structure.
2. You MUST use the `read_file` tool to read existing files (package.json, config files, source code).
3. You MUST use the `write_file` tool to CREATE actual files in the repository — test files, config files, scripts, etc.
4. You MUST use the `run_command` tool to install dependencies (npm install, pip install) and verify your work.
5. You MUST use the `save_deliverable` tool to save your final deliverable as '{agent_def.deliverable_filename}'.
6. NEVER just print instructions or suggestions. You have tools — USE THEM to do the work.

WORKFLOW:
Step 1: Explore — list_directory(".") to see the project structure
Step 2: Understand — read_file on key files (package.json, index.html, etc.)
Step 3: Create — write_file to generate test suites, configs, CI pipelines, etc.
Step 4: Install — run_command to install any needed packages
Step 5: Deliver — save_deliverable with the final output artifact
"""

    if template_prompt:
        return autonomous_prefix + "\n\n--- DETAILED INSTRUCTIONS ---\n\n" + template_prompt
    else:
        return autonomous_prefix + f"\n\nPerform your role as {agent_def.display_name} by creating all necessary files in the repository."


@activity.defn(name="run_agent_activity")
async def run_agent_activity(input: AgentActivityInput) -> AgentActivityResult:
    start_time = time.time()

    # 1. Load agent definition
    agent_def = AGENTS.get(input.agent_name)
    if not agent_def:
        raise ValueError(f"Unknown agent: {input.agent_name}")

    # 2. Resolve model name based on tier
    model_name = getattr(settings, f"ollama_{agent_def.model_tier}_model")

    # 3. Create tools scoped to the target repository
    repo_path = input.repo_path or "."
    deliverables_dir = os.path.join(repo_path, "deliverables")
    tools = create_agent_tools(repo_path, deliverables_dir)

    # 4. Initialize agent with log callback that signals back to the workflow
    async def log_callback(agent_name, log_type, content):
        try:
            if _temporal_client is None:
                activity.logger.warning("No Temporal client set, skipping log signal")
                return
            info = activity.info()
            handle = _temporal_client.get_workflow_handle(info.workflow_id)
            await handle.signal("add_log", {
                "agent": agent_name,
                "type": log_type,
                "content": content,
                "timestamp": info.scheduled_time.isoformat() if info.scheduled_time else ""
            })
        except Exception as e:
            activity.logger.error(f"Failed to signal log: {e}")

    agent = LangGraphOllamaAgent(
        name=input.agent_name,
        model_name=model_name,
        base_url=settings.ollama_base_url,
        tools=tools,
        log_callback=log_callback,
    )

    # 5. Build autonomous prompt (template + action instructions)
    prompt = _build_autonomous_prompt(agent_def, input)

    # 6. Run agent
    result = await agent.run(prompt)

    duration_ms = (time.time() - start_time) * 1000

    # 7. Return typed result
    return AgentActivityResult(
        success=True,
        result=result,
        metrics={
            "duration_ms": duration_ms,
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
