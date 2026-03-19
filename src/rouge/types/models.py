from typing import Dict, List, Literal, Optional

from pydantic import BaseModel

# Agent Names as defined in Shannon
AgentName = Literal[
    "pre-recon",
    "recon",
    "injection-vuln",
    "xss-vuln",
    "auth-vuln",
    "ssrf-vuln",
    "authz-vuln",
    "injection-exploit",
    "xss-exploit",
    "auth-exploit",
    "ssrf-exploit",
    "authz-exploit",
    "report",
]

VulnType = Literal["injection", "xss", "auth", "ssrf", "authz"]


class AgentMetrics(BaseModel):
    duration_ms: float
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    cost_usd: float = 0.0
    num_turns: Optional[int] = None
    model: Optional[str] = None


class AgentDefinition(BaseModel):
    name: AgentName
    display_name: str
    prerequisites: List[AgentName]
    prompt_template: str
    deliverable_filename: str
    model_tier: Literal["small", "medium", "large"] = "medium"


class PipelineProgress(BaseModel):
    status: Literal["running", "completed", "failed"]
    current_phase: Optional[str] = None
    current_agent: Optional[AgentName] = None
    completed_agents: List[AgentName] = []
    failed_agent: Optional[AgentName] = None
    error: Optional[str] = None
    start_time: float
    elapsed_ms: float
    agent_metrics: Dict[str, AgentMetrics] = {}
    workflow_id: str
