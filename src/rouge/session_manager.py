from typing import Dict

from .types.models import AgentDefinition, AgentName, PhaseName

AGENTS: Dict[AgentName, AgentDefinition] = {
    # ============================================
    # TESTING AUTOMATION AGENTS
    # ============================================
    # Testing Framework & Architecture
    "framework-builder": AgentDefinition(
        name="framework-builder",
        display_name="Test Framework Architect",
        prerequisites=[],
        prompt_template="testing/framework-design",
        deliverable_filename="framework_architecture.md",
        model_tier="large",
    ),
    "test-data-factory": AgentDefinition(
        name="test-data-factory",
        display_name="Test Data Factory Builder",
        prerequisites=["framework-builder"],
        prompt_template="testing/data-factory",
        deliverable_filename="test_data_strategy.md",
        model_tier="medium",
    ),
    "test-config-manager": AgentDefinition(
        name="test-config-manager",
        display_name="Test Configuration Manager",
        prerequisites=["framework-builder"],
        prompt_template="testing/config-management",
        deliverable_filename="test_config.md",
        model_tier="medium",
    ),
    # Web & API Testing
    "ui-test-scripter": AgentDefinition(
        name="ui-test-scripter",
        display_name="UI Test Automation Engineer",
        prerequisites=["framework-builder", "test-data-factory"],
        prompt_template="testing/ui-automation",
        deliverable_filename="ui_test_suite.py",
        model_tier="medium",
    ),
    "api-test-engineer": AgentDefinition(
        name="api-test-engineer",
        display_name="API Testing Specialist",
        prerequisites=["framework-builder"],
        prompt_template="testing/api-testing",
        deliverable_filename="api_test_suite.py",
        model_tier="medium",
    ),
    "contract-tester": AgentDefinition(
        name="contract-tester",
        display_name="Contract Testing Specialist",
        prerequisites=["api-test-engineer"],
        prompt_template="testing/contract-testing",
        deliverable_filename="contract_tests.py",
        model_tier="medium",
    ),
    "visual-regression": AgentDefinition(
        name="visual-regression",
        display_name="Visual Regression Tester",
        prerequisites=["ui-test-scripter"],
        prompt_template="testing/visual-regression",
        deliverable_filename="visual_tests.py",
        model_tier="small",
    ),
    # Specialized Testing
    "mobile-test-engineer": AgentDefinition(
        name="mobile-test-engineer",
        display_name="Mobile Automation Engineer",
        prerequisites=["framework-builder"],
        prompt_template="testing/mobile-automation",
        deliverable_filename="mobile_test_suite.py",
        model_tier="medium",
    ),
    "performance-tester": AgentDefinition(
        name="performance-tester",
        display_name="Performance Testing Engineer",
        prerequisites=["framework-builder"],
        prompt_template="testing/performance",
        deliverable_filename="performance_tests.py",
        model_tier="medium",
    ),
    "accessibility-tester": AgentDefinition(
        name="accessibility-tester",
        display_name="Accessibility Testing Specialist",
        prerequisites=["ui-test-scripter"],
        prompt_template="testing/accessibility",
        deliverable_filename="accessibility_tests.py",
        model_tier="small",
    ),
    # CI/CD Integration & Reporting
    "ci-integrator": AgentDefinition(
        name="ci-integrator",
        display_name="CI/CD Integration Engineer",
        prerequisites=["framework-builder"],
        prompt_template="testing/ci-integration",
        deliverable_filename="ci_pipeline_config.yml",
        model_tier="medium",
    ),
    "test-reporter": AgentDefinition(
        name="test-reporter",
        display_name="Test Reporting Specialist",
        prerequisites=["ui-test-scripter", "api-test-engineer"],
        prompt_template="testing/reporting",
        deliverable_filename="test_report.html",
        model_tier="small",
    ),
    "flakiness-analyzer": AgentDefinition(
        name="flakiness-analyzer",
        display_name="Test Flakiness Analyzer",
        prerequisites=["test-reporter"],
        prompt_template="testing/flakiness-analysis",
        deliverable_filename="flakiness_report.md",
        model_tier="medium",
    ),
    # ============================================
    # DEVOPS AUTOMATION AGENTS
    # ============================================
    # Infrastructure & Automation
    "iac-engineer": AgentDefinition(
        name="iac-engineer",
        display_name="Infrastructure as Code Engineer",
        prerequisites=[],
        prompt_template="devops/iac-design",
        deliverable_filename="infrastructure_code.tf",
        model_tier="large",
    ),
    "k8s-orchestrator": AgentDefinition(
        name="k8s-orchestrator",
        display_name="Kubernetes Orchestration Specialist",
        prerequisites=["iac-engineer"],
        prompt_template="devops/kubernetes",
        deliverable_filename="k8s_manifests.yaml",
        model_tier="medium",
    ),
    "container-engineer": AgentDefinition(
        name="container-engineer",
        display_name="Container Engineering Specialist",
        prerequisites=[],
        prompt_template="devops/containerization",
        deliverable_filename="dockerfile",
        model_tier="medium",
    ),
    "config-automator": AgentDefinition(
        name="config-automator",
        display_name="Configuration Automation Engineer",
        prerequisites=["iac-engineer"],
        prompt_template="devops/config-management",
        deliverable_filename="config_automation.yml",
        model_tier="medium",
    ),
    # CI/CD Pipelines
    "pipeline-architect": AgentDefinition(
        name="pipeline-architect",
        display_name="CI/CD Pipeline Architect",
        prerequisites=[],
        prompt_template="devops/pipeline-design",
        deliverable_filename="pipeline_config.yml",
        model_tier="large",
    ),
    "deployment-strategist": AgentDefinition(
        name="deployment-strategist",
        display_name="Deployment Strategy Engineer",
        prerequisites=["pipeline-architect"],
        prompt_template="devops/deployment-strategies",
        deliverable_filename="deployment_plan.md",
        model_tier="medium",
    ),
    "artifact-manager": AgentDefinition(
        name="artifact-manager",
        display_name="Artifact Management Engineer",
        prerequisites=["pipeline-architect"],
        prompt_template="devops/artifact-management",
        deliverable_filename="artifact_config.md",
        model_tier="small",
    ),
    # Observability & Reliability
    "monitoring-engineer": AgentDefinition(
        name="monitoring-engineer",
        display_name="Monitoring & Observability Engineer",
        prerequisites=[],
        prompt_template="devops/monitoring",
        deliverable_filename="monitoring_config.yml",
        model_tier="medium",
    ),
    "log-aggregator": AgentDefinition(
        name="log-aggregator",
        display_name="Log Aggregation Specialist",
        prerequisites=["monitoring-engineer"],
        prompt_template="devops/logging",
        deliverable_filename="logging_config.yml",
        model_tier="medium",
    ),
    "dashboard-builder": AgentDefinition(
        name="dashboard-builder",
        display_name="Dashboard & Visualization Engineer",
        prerequisites=["monitoring-engineer", "log-aggregator"],
        prompt_template="devops/dashboards",
        deliverable_filename="dashboards.json",
        model_tier="small",
    ),
    "incident-responder": AgentDefinition(
        name="incident-responder",
        display_name="Incident Response Coordinator",
        prerequisites=["monitoring-engineer"],
        prompt_template="devops/incident-response",
        deliverable_filename="incident_runbook.md",
        model_tier="large",
    ),
    "chaos-engineer": AgentDefinition(
        name="chaos-engineer",
        display_name="Chaos Engineering Specialist",
        prerequisites=["monitoring-engineer", "k8s-orchestrator"],
        prompt_template="devops/chaos-engineering",
        deliverable_filename="chaos_experiments.yml",
        model_tier="medium",
    ),
    # Security & Compliance
    "security-scanner": AgentDefinition(
        name="security-scanner",
        display_name="DevSecOps Security Scanner",
        prerequisites=[],
        prompt_template="devops/security-scanning",
        deliverable_filename="security_scan_report.md",
        model_tier="medium",
    ),
    "compliance-auditor": AgentDefinition(
        name="compliance-auditor",
        display_name="Compliance & Audit Engineer",
        prerequisites=["iac-engineer"],
        prompt_template="devops/compliance",
        deliverable_filename="compliance_report.md",
        model_tier="medium",
    ),
    "secrets-manager": AgentDefinition(
        name="secrets-manager",
        display_name="Secrets Management Engineer",
        prerequisites=[],
        prompt_template="devops/secrets-management",
        deliverable_filename="secrets_config.yml",
        model_tier="medium",
    ),
}

AGENT_PHASE_MAP: Dict[AgentName, PhaseName] = {
    # Testing Phases
    "framework-builder": "test-architecture",
    "test-data-factory": "test-architecture",
    "test-config-manager": "test-architecture",
    "ui-test-scripter": "test-implementation",
    "api-test-engineer": "test-implementation",
    "contract-tester": "test-implementation",
    "visual-regression": "test-implementation",
    "mobile-test-engineer": "test-implementation",
    "performance-tester": "test-implementation",
    "accessibility-tester": "test-implementation",
    "ci-integrator": "test-cicd-integration",
    "test-reporter": "test-reporting",
    "flakiness-analyzer": "test-reporting",
    # DevOps Infrastructure Phases
    "iac-engineer": "infrastructure-design",
    "k8s-orchestrator": "infrastructure-implementation",
    "container-engineer": "infrastructure-implementation",
    "config-automator": "infrastructure-implementation",
    # DevOps CI/CD Phases
    "pipeline-architect": "cicd-design",
    "deployment-strategist": "cicd-implementation",
    "artifact-manager": "cicd-implementation",
    # DevOps Observability Phases
    "monitoring-engineer": "observability-setup",
    "log-aggregator": "observability-setup",
    "dashboard-builder": "observability-setup",
    "incident-responder": "reliability-operations",
    "chaos-engineer": "reliability-operations",
    # DevOps Security Phases
    "security-scanner": "security-operations",
    "compliance-auditor": "security-operations",
    "secrets-manager": "security-operations",
}


def get_agents_by_phase(phase: PhaseName) -> list[AgentDefinition]:
    """Get all agents assigned to a specific phase"""
    from typing import List

    agents: List[AgentDefinition] = []
    for agent_name, agent_phase in AGENT_PHASE_MAP.items():
        if agent_phase == phase:
            agents.append(AGENTS[agent_name])
    return agents
