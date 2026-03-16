from typing import Dict, Literal

from .types.models import AgentDefinition, AgentName

# Phase names for metrics aggregation
PhaseName = Literal["pre-recon", "recon", "vulnerability-analysis", "exploitation", "reporting"]

AGENTS: Dict[AgentName, AgentDefinition] = {
    "pre-recon": AgentDefinition(
        name="pre-recon",
        display_name="Pre-recon agent",
        prerequisites=[],
        prompt_template="pre-recon-code",
        deliverable_filename="code_analysis_deliverable.md",
        model_tier="large",
    ),
    "recon": AgentDefinition(
        name="recon",
        display_name="Recon agent",
        prerequisites=["pre-recon"],
        prompt_template="recon",
        deliverable_filename="recon_deliverable.md",
    ),
    "injection-vuln": AgentDefinition(
        name="injection-vuln",
        display_name="Injection vuln agent",
        prerequisites=["recon"],
        prompt_template="vuln-injection",
        deliverable_filename="injection_analysis_deliverable.md",
    ),
    "xss-vuln": AgentDefinition(
        name="xss-vuln",
        display_name="XSS vuln agent",
        prerequisites=["recon"],
        prompt_template="vuln-xss",
        deliverable_filename="xss_analysis_deliverable.md",
    ),
    "auth-vuln": AgentDefinition(
        name="auth-vuln",
        display_name="Auth vuln agent",
        prerequisites=["recon"],
        prompt_template="vuln-auth",
        deliverable_filename="auth_analysis_deliverable.md",
    ),
    "ssrf-vuln": AgentDefinition(
        name="ssrf-vuln",
        display_name="SSRF vuln agent",
        prerequisites=["recon"],
        prompt_template="vuln-ssrf",
        deliverable_filename="ssrf_analysis_deliverable.md",
    ),
    "authz-vuln": AgentDefinition(
        name="authz-vuln",
        display_name="Authz vuln agent",
        prerequisites=["recon"],
        prompt_template="vuln-authz",
        deliverable_filename="authz_analysis_deliverable.md",
    ),
    "injection-exploit": AgentDefinition(
        name="injection-exploit",
        display_name="Injection exploit agent",
        prerequisites=["injection-vuln"],
        prompt_template="exploit-injection",
        deliverable_filename="injection_exploitation_evidence.md",
    ),
    "xss-exploit": AgentDefinition(
        name="xss-exploit",
        display_name="XSS exploit agent",
        prerequisites=["xss-vuln"],
        prompt_template="exploit-xss",
        deliverable_filename="xss_exploitation_evidence.md",
    ),
    "auth-exploit": AgentDefinition(
        name="auth-exploit",
        display_name="Auth exploit agent",
        prerequisites=["auth-vuln"],
        prompt_template="exploit-auth",
        deliverable_filename="auth_exploitation_evidence.md",
    ),
    "ssrf-exploit": AgentDefinition(
        name="ssrf-exploit",
        display_name="SSRF exploit agent",
        prerequisites=["ssrf-vuln"],
        prompt_template="exploit-ssrf",
        deliverable_filename="ssrf_exploitation_evidence.md",
    ),
    "authz-exploit": AgentDefinition(
        name="authz-exploit",
        display_name="Authz exploit agent",
        prerequisites=["authz-vuln"],
        prompt_template="exploit-authz",
        deliverable_filename="authz_exploitation_evidence.md",
    ),
    "report": AgentDefinition(
        name="report",
        display_name="Report agent",
        prerequisites=[
            "injection-exploit",
            "xss-exploit",
            "auth-exploit",
            "ssrf-exploit",
            "authz-exploit",
        ],
        prompt_template="report-executive",
        deliverable_filename="comprehensive_security_assessment_report.md",
        model_tier="small",
    ),
}

AGENT_PHASE_MAP: Dict[AgentName, PhaseName] = {
    "pre-recon": "pre-recon",
    "recon": "recon",
    "injection-vuln": "vulnerability-analysis",
    "xss-vuln": "vulnerability-analysis",
    "auth-vuln": "vulnerability-analysis",
    "authz-vuln": "vulnerability-analysis",
    "ssrf-vuln": "vulnerability-analysis",
    "injection-exploit": "exploitation",
    "xss-exploit": "exploitation",
    "auth-exploit": "exploitation",
    "authz-exploit": "exploitation",
    "ssrf-exploit": "exploitation",
    "report": "reporting",
}
