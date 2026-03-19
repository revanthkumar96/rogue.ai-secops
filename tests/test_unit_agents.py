"""
Unit tests for ROUGE agent system
Tests agent definitions, registry, and configuration
"""

import pytest

from rouge.session_manager import AGENT_PHASE_MAP, AGENTS, get_agents_by_phase


class TestAgentRegistry:
    """Test agent registry and definitions"""

    def test_all_agents_defined(self):
        """Verify all 28 agents are defined in registry"""
        assert len(AGENTS) == 28, f"Expected 28 agents, got {len(AGENTS)}"

    def test_agent_structure(self):
        """Verify each agent has required fields"""
        required_fields = {
            "name",
            "display_name",
            "prerequisites",
            "prompt_template",
            "deliverable_filename",
            "model_tier",
        }

        for agent_name, agent_def in AGENTS.items():
            agent_dict = agent_def.__dict__
            assert required_fields.issubset(
                agent_dict.keys()
            ), f"Agent {agent_name} missing required fields"

            # Verify types
            assert isinstance(agent_def.name, str)
            assert isinstance(agent_def.display_name, str)
            assert isinstance(agent_def.prerequisites, list)
            assert isinstance(agent_def.prompt_template, str)
            assert isinstance(agent_def.deliverable_filename, str)
            assert agent_def.model_tier in ["small", "medium", "large"]

    def test_testing_agents_count(self):
        """Verify 13 testing agents are defined"""
        testing_agents = [
            "framework-builder",
            "test-data-factory",
            "test-config-manager",
            "ui-test-scripter",
            "api-test-engineer",
            "contract-tester",
            "visual-regression",
            "mobile-test-engineer",
            "performance-tester",
            "accessibility-tester",
            "ci-integrator",
            "test-reporter",
            "flakiness-analyzer",
        ]

        for agent in testing_agents:
            assert agent in AGENTS, f"Testing agent {agent} not found in registry"

    def test_devops_agents_count(self):
        """Verify 15 DevOps agents are defined"""
        devops_agents = [
            "iac-engineer",
            "k8s-orchestrator",
            "container-engineer",
            "config-automator",
            "pipeline-architect",
            "deployment-strategist",
            "artifact-manager",
            "monitoring-engineer",
            "log-aggregator",
            "dashboard-builder",
            "incident-responder",
            "chaos-engineer",
            "security-scanner",
            "compliance-auditor",
            "secrets-manager",
        ]

        for agent in devops_agents:
            assert agent in AGENTS, f"DevOps agent {agent} not found in registry"

    def test_prompt_template_paths(self):
        """Verify prompt template paths are correctly formatted"""
        for agent_name, agent_def in AGENTS.items():
            template_path = agent_def.prompt_template

            # Should be like "testing/ui-automation" or "devops/iac-design"
            parts = template_path.split("/")
            assert len(parts) == 2, f"Invalid prompt path for {agent_name}: {template_path}"
            assert parts[0] in [
                "testing",
                "devops",
            ], f"Invalid prompt category for {agent_name}: {parts[0]}"

    def test_model_tier_distribution(self):
        """Verify model tiers are properly assigned"""
        tiers = {"small": 0, "medium": 0, "large": 0}

        for agent_def in AGENTS.values():
            tiers[agent_def.model_tier] += 1

        # Ensure we have mix of model tiers
        assert tiers["small"] > 0, "No small model agents"
        assert tiers["medium"] > 0, "No medium model agents"
        assert tiers["large"] > 0, "No large model agents"


class TestAgentPhases:
    """Test agent phase mappings"""

    def test_all_agents_have_phases(self):
        """Verify all agents are mapped to phases"""
        for agent_name in AGENTS.keys():
            assert (
                agent_name in AGENT_PHASE_MAP
            ), f"Agent {agent_name} not mapped to any phase"

    def test_phase_names_valid(self):
        """Verify all phase names are valid PhaseName types"""
        valid_phases = {
            "test-architecture",
            "test-implementation",
            "test-cicd-integration",
            "test-reporting",
            "infrastructure-design",
            "infrastructure-implementation",
            "cicd-design",
            "cicd-implementation",
            "observability-setup",
            "reliability-operations",
            "security-operations",
            "unified-devops",
        }

        for agent_name, phase in AGENT_PHASE_MAP.items():
            assert (
                phase in valid_phases
            ), f"Invalid phase '{phase}' for agent {agent_name}"

    def test_get_agents_by_phase(self):
        """Test retrieving agents by phase"""
        # Test architecture phase
        arch_agents = get_agents_by_phase("test-architecture")
        assert "framework-builder" in [a.name for a in arch_agents]

        # Test implementation phase
        impl_agents = get_agents_by_phase("test-implementation")
        agent_names = [a.name for a in impl_agents]
        assert "ui-test-scripter" in agent_names
        assert "api-test-engineer" in agent_names


class TestAgentPrerequisites:
    """Test agent prerequisite chains"""

    def test_framework_builder_no_prerequisites(self):
        """framework-builder should have no prerequisites"""
        agent = AGENTS["framework-builder"]
        assert (
            len(agent.prerequisites) == 0
        ), "framework-builder should be first agent (no prereqs)"

    def test_ui_test_scripter_prerequisites(self):
        """ui-test-scripter should depend on framework-builder"""
        agent = AGENTS["ui-test-scripter"]
        assert (
            "framework-builder" in agent.prerequisites
        ), "ui-test-scripter should depend on framework-builder"

    def test_ci_integrator_prerequisites(self):
        """ci-integrator should depend on test implementation agents"""
        agent = AGENTS["ci-integrator"]
        # Should have prerequisites from test implementation phase
        assert len(agent.prerequisites) > 0, "ci-integrator should have prerequisites"

    def test_no_circular_dependencies(self):
        """Verify no circular dependencies in prerequisites"""

        def has_circular_dependency(agent_name, visited=None):
            if visited is None:
                visited = set()

            if agent_name in visited:
                return True

            visited.add(agent_name)

            agent = AGENTS.get(agent_name)
            if not agent:
                return False

            for prereq in agent.prerequisites:
                if has_circular_dependency(prereq, visited.copy()):
                    return True

            return False

        for agent_name in AGENTS.keys():
            assert not has_circular_dependency(
                agent_name
            ), f"Circular dependency detected for {agent_name}"


class TestAgentDeliverables:
    """Test agent deliverable configurations"""

    def test_unique_deliverable_filenames(self):
        """Verify each agent has unique deliverable filename"""
        filenames = set()

        for agent_name, agent_def in AGENTS.items():
            filename = agent_def.deliverable_filename
            assert (
                filename not in filenames
            ), f"Duplicate deliverable filename: {filename} for {agent_name}"
            filenames.add(filename)

    def test_deliverable_extensions(self):
        """Verify deliverable filenames have proper extensions"""
        for agent_name, agent_def in AGENTS.items():
            filename = agent_def.deliverable_filename

            # Should end with common file extensions (or be dockerfile/makefile without extension)
            valid_extensions = [".md", ".py", ".tf", ".yml", ".yaml", ".json", ".html"]
            no_extension_files = ["dockerfile", "makefile"]

            has_valid_ext = any(filename.endswith(ext) for ext in valid_extensions)
            is_special_file = filename.lower() in no_extension_files

            assert has_valid_ext or is_special_file, f"Invalid deliverable extension for {agent_name}: {filename}"


@pytest.mark.parametrize(
    "agent_name,expected_tier",
    [
        ("framework-builder", "large"),  # Complex design needs large model
        ("test-data-factory", "medium"),  # Data generation uses medium model
        ("iac-engineer", "large"),  # Infrastructure design needs large model
        ("monitoring-engineer", "medium"),  # Moderate complexity
    ],
)
def test_specific_agent_tiers(agent_name, expected_tier):
    """Test specific agents have appropriate model tiers"""
    agent = AGENTS[agent_name]
    assert (
        agent.model_tier == expected_tier
    ), f"{agent_name} should use {expected_tier} model, got {agent.model_tier}"


class TestAgentNaming:
    """Test agent naming conventions"""

    def test_agent_names_use_hyphens(self):
        """Verify agent names use hyphens, not underscores"""
        for agent_name in AGENTS.keys():
            assert "_" not in agent_name, f"Agent name {agent_name} should use hyphens"
            assert "-" in agent_name or len(agent_name.split("-")) == 1

    def test_display_names_are_readable(self):
        """Verify display names are human-readable"""
        for agent_name, agent_def in AGENTS.items():
            display_name = agent_def.display_name

            # Should contain spaces and capital letters
            assert (
                " " in display_name
            ), f"Display name for {agent_name} should contain spaces"
            assert any(
                c.isupper() for c in display_name
            ), f"Display name for {agent_name} should have capitals"


class TestAgentIntegrity:
    """Test overall agent system integrity"""

    def test_testing_phase_agents_exist(self):
        """Verify all testing phases have assigned agents"""
        testing_phases = [
            "test-architecture",
            "test-implementation",
            "test-cicd-integration",
            "test-reporting",
        ]

        for phase in testing_phases:
            agents = get_agents_by_phase(phase)
            assert (
                len(agents) > 0
            ), f"No agents assigned to testing phase: {phase}"

    def test_devops_phase_agents_exist(self):
        """Verify all DevOps phases have assigned agents"""
        devops_phases = [
            "infrastructure-design",
            "infrastructure-implementation",
            "cicd-design",
            "cicd-implementation",
            "observability-setup",
            "security-operations",
        ]

        for phase in devops_phases:
            agents = get_agents_by_phase(phase)
            assert len(agents) > 0, f"No agents assigned to DevOps phase: {phase}"

    def test_agent_count_matches_constant(self):
        """Verify agent count matches documentation"""
        # As per transformation: 13 testing + 15 DevOps = 28 total
        testing_count = sum(
            1
            for a, p in AGENT_PHASE_MAP.items()
            if p.startswith("test-")
        )
        devops_count = sum(
            1
            for a, p in AGENT_PHASE_MAP.items()
            if not p.startswith("test-") and p != "unified-devops"
        )

        assert testing_count == 13, f"Expected 13 testing agents, got {testing_count}"
        assert devops_count == 15, f"Expected 15 DevOps agents, got {devops_count}"
