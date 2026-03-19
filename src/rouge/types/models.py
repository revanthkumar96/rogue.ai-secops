from typing import Dict, List, Literal, Optional

from pydantic import BaseModel

# Testing and DevOps Agent Names
AgentName = Literal[
    # Testing Framework & Architecture
    "framework-builder",
    "test-data-factory",
    "test-config-manager",
    # Web & API Testing
    "ui-test-scripter",
    "api-test-engineer",
    "contract-tester",
    "visual-regression",
    # Specialized Testing
    "mobile-test-engineer",
    "performance-tester",
    "accessibility-tester",
    # CI/CD Integration & Reporting
    "ci-integrator",
    "test-reporter",
    "flakiness-analyzer",
    # DevOps Infrastructure
    "iac-engineer",
    "k8s-orchestrator",
    "container-engineer",
    "config-automator",
    # DevOps CI/CD Pipelines
    "pipeline-architect",
    "deployment-strategist",
    "artifact-manager",
    # DevOps Observability
    "monitoring-engineer",
    "log-aggregator",
    "dashboard-builder",
    "incident-responder",
    "chaos-engineer",
    # DevOps Security
    "security-scanner",
    "compliance-auditor",
    "secrets-manager",
]

# Phase Names for Testing and DevOps Workflows
PhaseName = Literal[
    # Testing Phases
    "test-architecture",
    "test-implementation",
    "test-cicd-integration",
    "test-reporting",
    # DevOps Infrastructure Phases
    "infrastructure-design",
    "infrastructure-implementation",
    # DevOps CI/CD Phases
    "cicd-design",
    "cicd-implementation",
    # DevOps Observability Phases
    "observability-setup",
    "reliability-operations",
    # DevOps Security Phases
    "security-operations",
]

# Test types for TestAutomationWorkflow
TestType = Literal["ui", "api", "mobile", "performance", "accessibility", "visual"]


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
    current_phase: Optional[PhaseName] = None
    current_agent: Optional[AgentName] = None
    completed_agents: List[AgentName] = []
    failed_agent: Optional[AgentName] = None
    error: Optional[str] = None
    start_time: float
    elapsed_ms: float
    agent_metrics: Dict[str, AgentMetrics] = {}
    workflow_id: str
