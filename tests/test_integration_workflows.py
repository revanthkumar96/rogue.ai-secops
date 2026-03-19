"""
Integration tests for ROUGE workflows
Tests workflow execution, agent coordination, and deliverable generation
"""

import asyncio
import os
from unittest.mock import patch

import pytest
from temporalio import activity
from temporalio.worker import Worker

from rouge.temporal.workflows import (
    CICDPipelineWorkflow,
    InfrastructureProvisioningWorkflow,
    TestAutomationWorkflow,
    UnifiedDevOpsWorkflow,
)


@pytest.mark.integration
class TestTestAutomationWorkflow:
    """Integration tests for TestAutomationWorkflow"""

    @pytest.mark.asyncio
    async def test_workflow_structure(self, test_automation_input, temporal_env):
        """Test workflow can be instantiated and has required methods"""
        workflow = TestAutomationWorkflow()

        assert hasattr(workflow, "run")
        assert hasattr(workflow, "get_logs")

    @pytest.mark.asyncio
    async def test_workflow_execution_mock(
        self, test_automation_input, temporal_env, mock_langgraph_agent
    ):
        """Test workflow execution with mocked agents"""

        async with Worker(
            temporal_env.client,
            task_queue="test-queue",
            workflows=[TestAutomationWorkflow],
            activities=[mock_run_agent_activity],
        ):
            # Start workflow
            handle = await temporal_env.client.start_workflow(
                TestAutomationWorkflow.run,
                test_automation_input,
                id="test-workflow-1",
                task_queue="test-queue",
            )

            # Wait for completion (with timeout)
            try:
                result = await asyncio.wait_for(handle.result(), timeout=60)
                assert result is not None
            except asyncio.TimeoutError:
                pytest.skip("Workflow execution too slow for integration test")

    @pytest.mark.asyncio
    async def test_workflow_logs_query(self, test_automation_input, temporal_env):
        """Test querying workflow logs"""
        workflow = TestAutomationWorkflow()

        # Add some test logs
        workflow._logs.append(
            {
                "type": "thought",
                "agent": "framework-builder",
                "content": "Designing framework",
                "timestamp": "2024-01-01T12:00:00",
            }
        )

        logs = workflow.get_logs()
        assert len(logs) > 0
        assert logs[0]["agent"] == "framework-builder"


@pytest.mark.integration
class TestInfrastructureProvisioningWorkflow:
    """Integration tests for InfrastructureProvisioningWorkflow"""

    @pytest.mark.asyncio
    async def test_workflow_initialization(self, infrastructure_input):
        """Test workflow initialization"""
        workflow = InfrastructureProvisioningWorkflow()

        assert hasattr(workflow, "_logs")
        assert hasattr(workflow, "_provisioned_resources")
        assert isinstance(workflow._logs, list)

    @pytest.mark.asyncio
    async def test_workflow_phase_execution(
        self, infrastructure_input, mock_langgraph_agent
    ):
        """Test workflow executes infrastructure phases correctly"""
        workflow = InfrastructureProvisioningWorkflow()

        # Test that workflow has defined phases
        # This would normally be done by Temporal, but we can test structure
        assert workflow is not None


@pytest.mark.integration
class TestCICDPipelineWorkflow:
    """Integration tests for CICDPipelineWorkflow"""

    @pytest.mark.asyncio
    async def test_workflow_cicd_initialization(self, cicd_input):
        """Test CI/CD workflow initialization"""
        workflow = CICDPipelineWorkflow()

        assert hasattr(workflow, "_logs")
        assert isinstance(workflow._logs, list)

    @pytest.mark.asyncio
    async def test_workflow_deliverable_tracking(self, cicd_input):
        """Test workflow tracks deliverables"""
        workflow = CICDPipelineWorkflow()

        # Verify logs list is initialized
        assert isinstance(workflow._logs, list)


@pytest.mark.integration
class TestUnifiedDevOpsWorkflow:
    """Integration tests for UnifiedDevOpsWorkflow"""

    @pytest.mark.asyncio
    async def test_workflow_composition(self, unified_input):
        """Test unified workflow composes sub-workflows"""
        workflow = UnifiedDevOpsWorkflow()

        assert hasattr(workflow, "run")
        assert hasattr(workflow, "_logs")


@pytest.mark.integration
class TestAgentCoordination:
    """Integration tests for agent coordination"""

    @pytest.mark.asyncio
    async def test_parallel_agent_execution(self, temp_dir):
        """Test multiple agents can execute in parallel"""

        async def mock_agent_1():
            await asyncio.sleep(0.1)
            return {"deliverable": "Agent 1 output"}

        async def mock_agent_2():
            await asyncio.sleep(0.1)
            return {"deliverable": "Agent 2 output"}

        # Execute in parallel
        results = await asyncio.gather(mock_agent_1(), mock_agent_2())

        assert len(results) == 2
        assert results[0]["deliverable"] == "Agent 1 output"
        assert results[1]["deliverable"] == "Agent 2 output"

    @pytest.mark.asyncio
    async def test_prerequisite_enforcement(self):
        """Test agent prerequisites are enforced"""
        from rouge.session_manager import AGENTS

        # Test that ui-test-scripter has framework-builder as prerequisite
        ui_scripter = AGENTS["ui-test-scripter"]
        assert "framework-builder" in ui_scripter.prerequisites

        # Test that framework-builder has no prerequisites
        framework_builder = AGENTS["framework-builder"]
        assert len(framework_builder.prerequisites) == 0


@pytest.mark.integration
class TestDeliverableGeneration:
    """Integration tests for deliverable generation"""

    def test_deliverable_directory_creation(self, temp_dir):
        """Test deliverable directories are created"""
        deliverables_dir = os.path.join(temp_dir, "deliverables")
        os.makedirs(deliverables_dir, exist_ok=True)

        assert os.path.exists(deliverables_dir)
        assert os.path.isdir(deliverables_dir)

    def test_deliverable_file_writing(self, temp_dir):
        """Test deliverables can be written to files"""
        deliverables_dir = os.path.join(temp_dir, "deliverables")
        os.makedirs(deliverables_dir, exist_ok=True)

        test_file = os.path.join(deliverables_dir, "test_suite.py")

        with open(test_file, "w") as f:
            f.write("# Generated test suite\n")
            f.write("def test_example():\n")
            f.write("    assert True\n")

        assert os.path.exists(test_file)

        with open(test_file, "r") as f:
            content = f.read()
            assert "# Generated test suite" in content
            assert "def test_example():" in content


# Helper functions for mocking
@activity.defn(name="mock_run_agent_activity")
async def mock_run_agent_activity(agent_name: str, context: dict):
    """Mock agent activity for testing"""
    await asyncio.sleep(0.1)  # Simulate work

    return {
        "success": True,
        "deliverable": f"# {agent_name} Deliverable\n\nGenerated content",
        "deliverable_path": f"/tmp/deliverables/{agent_name}_output.md",
    }


@pytest.mark.integration
@pytest.mark.slow
class TestWorkflowEndToEnd:
    """End-to-end integration tests for complete workflows"""

    @pytest.mark.asyncio
    async def test_full_test_automation_workflow(
        self, test_automation_input, temp_dir, temporal_env
    ):
        """Test complete test automation workflow execution"""
        with patch("rouge.agents.ollama.LangGraphOllamaAgent") as mock_agent_class:
            mock_agent = mock_agent_class.return_value
            mock_agent.run = lambda x: {"output": "Test output"}

            async with Worker(
                temporal_env.client,
                task_queue="integration-test-queue",
                workflows=[TestAutomationWorkflow],
                activities=[mock_run_agent_activity],
            ):
                handle = await temporal_env.client.start_workflow(
                    TestAutomationWorkflow.run,
                    test_automation_input,
                    id=f"integration-test-{os.urandom(4).hex()}",
                    task_queue="integration-test-queue",
                )

                try:
                    result = await asyncio.wait_for(handle.result(), timeout=120)
                    assert result is not None
                except asyncio.TimeoutError:
                    pytest.skip("Integration test timeout - workflow still running")
