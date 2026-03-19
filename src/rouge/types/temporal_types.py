from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from .models import AgentName, TestType


@dataclass
class RougePentestInput:
    web_url: str
    repo_path: str
    config_path: Optional[str] = None


@dataclass
class AgentActivityInput:
    agent_name: AgentName
    web_url: str
    repo_path: str
    config_path: Optional[str] = None


@dataclass
class AgentActivityResult:
    success: bool
    result: str
    metrics: Dict[str, Any]


@dataclass
class ExploitQueueInput:
    vuln_type: str
    repo_path: str


@dataclass
class ReportInput:
    repo_path: str


# New Workflow Inputs for Testing and DevOps


@dataclass
class TestAutomationInput:
    """Input for TestAutomationWorkflow - end-to-end test automation pipeline"""

    target_app_url: str
    source_code_path: str
    test_types: List[TestType]  # e.g., ["ui", "api", "performance"]
    framework_preference: Optional[str] = "playwright"  # "playwright", "selenium", "cypress"
    ci_platform: Optional[str] = "github-actions"  # "github-actions", "jenkins", "gitlab-ci"
    config_path: Optional[str] = None


@dataclass
class InfrastructureInput:
    """Input for InfrastructureProvisioningWorkflow - automated infrastructure provisioning"""

    cloud_provider: str  # "aws", "azure", "gcp", "on-prem"
    infrastructure_type: str  # "kubernetes", "vm", "serverless", "hybrid"
    environment: str  # "dev", "staging", "production"
    observability_tools: List[str]  # e.g., ["prometheus", "grafana", "elk"]
    repo_path: str
    config_path: Optional[str] = None


@dataclass
class CICDInput:
    """Input for CICDPipelineWorkflow - CI/CD pipeline design and implementation"""

    platform: str  # "github-actions", "jenkins", "gitlab-ci", "circleci"
    deployment_strategy: str  # "blue-green", "canary", "rolling", "recreate"
    source_code_path: str
    target_environments: List[str]  # e.g., ["staging", "production"]
    repo_path: str
    enable_security_scanning: bool = True
    config_path: Optional[str] = None


@dataclass
class UnifiedDevOpsInput:
    """Input for UnifiedDevOpsWorkflow - complete DevOps automation"""

    target_app_url: str
    source_code_path: str
    cloud_provider: str
    infrastructure_type: str
    test_types: List[TestType]
    ci_platform: str
    deployment_strategy: str
    observability_tools: List[str]
    repo_path: str
    config_path: Optional[str] = None
