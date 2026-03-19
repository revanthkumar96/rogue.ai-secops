from dataclasses import dataclass
from typing import Any, Dict, Optional

from .models import AgentName


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
