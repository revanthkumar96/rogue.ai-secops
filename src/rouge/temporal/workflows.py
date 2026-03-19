from datetime import timedelta
from typing import List

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from ..types.temporal_types import (
        AgentActivityInput,
        CICDInput,
        InfrastructureInput,
        TestAutomationInput,
        UnifiedDevOpsInput,
    )
    from .activities import run_agent_activity


@workflow.defn(name="TestAutomationWorkflow")
class TestAutomationWorkflow:
    """End-to-end test automation pipeline for generating comprehensive test suites"""

    def __init__(self) -> None:
        self._logs: List[dict] = []
        self._test_results: List[dict] = []

    @workflow.signal
    async def add_log(self, log_entry: dict) -> None:
        workflow.logger.info(f"Signal received: {log_entry['agent']} {log_entry['type']}")
        self._logs.append(log_entry)

    @workflow.query
    def get_logs(self) -> List[dict]:
        return self._logs

    @workflow.query
    def get_test_results(self) -> List[dict]:
        return self._test_results

    @workflow.run
    async def run(self, input: TestAutomationInput) -> dict:
        import asyncio

        # Phase 1: Framework Architecture (Sequential)
        await workflow.execute_activity(
            run_agent_activity,
            AgentActivityInput(
                agent_name="framework-builder",
                web_url=input.target_app_url,
                repo_path=input.source_code_path,
                config_path=input.config_path,
            ),
            start_to_close_timeout=timedelta(hours=1),
        )

        # Parallel: Test Data Factory + Config Manager
        await asyncio.gather(
            workflow.execute_activity(
                run_agent_activity,
                AgentActivityInput(
                    agent_name="test-data-factory",
                    web_url=input.target_app_url,
                    repo_path=input.source_code_path,
                    config_path=input.config_path,
                ),
                start_to_close_timeout=timedelta(minutes=30),
            ),
            workflow.execute_activity(
                run_agent_activity,
                AgentActivityInput(
                    agent_name="test-config-manager",
                    web_url=input.target_app_url,
                    repo_path=input.source_code_path,
                    config_path=input.config_path,
                ),
                start_to_close_timeout=timedelta(minutes=30),
            ),
        )

        # Phase 2: Parallel Test Implementation based on requested test types
        test_agent_map = {
            "ui": "ui-test-scripter",
            "api": "api-test-engineer",
            "mobile": "mobile-test-engineer",
            "performance": "performance-tester",
            "accessibility": "accessibility-tester",
            "visual": "visual-regression",
        }

        test_tasks = []
        for test_type in input.test_types:
            if test_type in test_agent_map:
                test_tasks.append(
                    workflow.execute_activity(
                        run_agent_activity,
                        AgentActivityInput(
                            agent_name=test_agent_map[test_type],
                            web_url=input.target_app_url,
                            repo_path=input.source_code_path,
                            config_path=input.config_path,
                        ),
                        start_to_close_timeout=timedelta(hours=1),
                    )
                )

        await asyncio.gather(*test_tasks)

        # Phase 3: CI Integration + Reporting (Parallel)
        await asyncio.gather(
            workflow.execute_activity(
                run_agent_activity,
                AgentActivityInput(
                    agent_name="ci-integrator",
                    web_url=input.target_app_url,
                    repo_path=input.source_code_path,
                    config_path=input.config_path,
                ),
                start_to_close_timeout=timedelta(minutes=30),
            ),
            workflow.execute_activity(
                run_agent_activity,
                AgentActivityInput(
                    agent_name="test-reporter",
                    web_url=input.target_app_url,
                    repo_path=input.source_code_path,
                    config_path=input.config_path,
                ),
                start_to_close_timeout=timedelta(minutes=20),
            ),
        )

        return {
            "status": "completed",
            "test_types": input.test_types,
            "framework": input.framework_preference,
            "ci_platform": input.ci_platform,
        }


@workflow.defn(name="InfrastructureProvisioningWorkflow")
class InfrastructureProvisioningWorkflow:
    """Automated infrastructure provisioning with IaC, Kubernetes, and observability"""

    def __init__(self) -> None:
        self._logs: List[dict] = []
        self._provisioned_resources: List[dict] = []

    @workflow.signal
    async def add_log(self, log_entry: dict) -> None:
        workflow.logger.info(f"Signal received: {log_entry['agent']} {log_entry['type']}")
        self._logs.append(log_entry)

    @workflow.query
    def get_logs(self) -> List[dict]:
        return self._logs

    @workflow.query
    def get_provisioned_resources(self) -> List[dict]:
        return self._provisioned_resources

    @workflow.run
    async def run(self, input: InfrastructureInput) -> dict:
        import asyncio

        # Phase 1: Infrastructure Design
        await workflow.execute_activity(
            run_agent_activity,
            AgentActivityInput(
                agent_name="iac-engineer",
                web_url="",  # Not needed for infrastructure
                repo_path=input.repo_path,
                config_path=input.config_path,
            ),
            start_to_close_timeout=timedelta(hours=2),
        )

        # Phase 2: Parallel Infrastructure Implementation
        infra_tasks = [
            workflow.execute_activity(
                run_agent_activity,
                AgentActivityInput(
                    agent_name="container-engineer",
                    web_url="",
                    repo_path=input.repo_path,
                    config_path=input.config_path,
                ),
                start_to_close_timeout=timedelta(hours=1),
            ),
            workflow.execute_activity(
                run_agent_activity,
                AgentActivityInput(
                    agent_name="config-automator",
                    web_url="",
                    repo_path=input.repo_path,
                    config_path=input.config_path,
                ),
                start_to_close_timeout=timedelta(hours=1),
            ),
        ]

        # Add K8s orchestrator if infrastructure type is Kubernetes
        if "kubernetes" in input.infrastructure_type.lower():
            infra_tasks.append(
                workflow.execute_activity(
                    run_agent_activity,
                    AgentActivityInput(
                        agent_name="k8s-orchestrator",
                        web_url="",
                        repo_path=input.repo_path,
                        config_path=input.config_path,
                    ),
                    start_to_close_timeout=timedelta(hours=1),
                )
            )

        await asyncio.gather(*infra_tasks)

        # Phase 3: Observability Setup (Parallel)
        observability_tasks = []
        if "prometheus" in input.observability_tools or "datadog" in input.observability_tools:
            observability_tasks.append(
                workflow.execute_activity(
                    run_agent_activity,
                    AgentActivityInput(
                        agent_name="monitoring-engineer",
                        web_url="",
                        repo_path=input.repo_path,
                        config_path=input.config_path,
                    ),
                    start_to_close_timeout=timedelta(minutes=45),
                )
            )

        if "elk" in input.observability_tools or "elasticsearch" in input.observability_tools:
            observability_tasks.append(
                workflow.execute_activity(
                    run_agent_activity,
                    AgentActivityInput(
                        agent_name="log-aggregator",
                        web_url="",
                        repo_path=input.repo_path,
                        config_path=input.config_path,
                    ),
                    start_to_close_timeout=timedelta(minutes=45),
                )
            )

        if "grafana" in input.observability_tools:
            observability_tasks.append(
                workflow.execute_activity(
                    run_agent_activity,
                    AgentActivityInput(
                        agent_name="dashboard-builder",
                        web_url="",
                        repo_path=input.repo_path,
                        config_path=input.config_path,
                    ),
                    start_to_close_timeout=timedelta(minutes=30),
                )
            )

        if observability_tasks:
            await asyncio.gather(*observability_tasks)

        return {
            "status": "provisioned",
            "cloud_provider": input.cloud_provider,
            "infrastructure_type": input.infrastructure_type,
            "environment": input.environment,
        }


@workflow.defn(name="CICDPipelineWorkflow")
class CICDPipelineWorkflow:
    """CI/CD pipeline design and implementation with deployment strategies"""

    def __init__(self) -> None:
        self._logs: List[dict] = []

    @workflow.signal
    async def add_log(self, log_entry: dict) -> None:
        workflow.logger.info(f"Signal received: {log_entry['agent']} {log_entry['type']}")
        self._logs.append(log_entry)

    @workflow.query
    def get_logs(self) -> List[dict]:
        return self._logs

    @workflow.run
    async def run(self, input: CICDInput) -> dict:
        import asyncio

        # Phase 1: Pipeline Design
        await workflow.execute_activity(
            run_agent_activity,
            AgentActivityInput(
                agent_name="pipeline-architect",
                web_url="",
                repo_path=input.repo_path,
                config_path=input.config_path,
            ),
            start_to_close_timeout=timedelta(hours=1),
        )

        # Phase 2: Parallel Implementation
        cicd_tasks = [
            workflow.execute_activity(
                run_agent_activity,
                AgentActivityInput(
                    agent_name="deployment-strategist",
                    web_url="",
                    repo_path=input.repo_path,
                    config_path=input.config_path,
                ),
                start_to_close_timeout=timedelta(minutes=45),
            ),
            workflow.execute_activity(
                run_agent_activity,
                AgentActivityInput(
                    agent_name="artifact-manager",
                    web_url="",
                    repo_path=input.repo_path,
                    config_path=input.config_path,
                ),
                start_to_close_timeout=timedelta(minutes=30),
            ),
        ]

        # Add security scanner if enabled
        if input.enable_security_scanning:
            cicd_tasks.append(
                workflow.execute_activity(
                    run_agent_activity,
                    AgentActivityInput(
                        agent_name="security-scanner",
                        web_url="",
                        repo_path=input.repo_path,
                        config_path=input.config_path,
                    ),
                    start_to_close_timeout=timedelta(minutes=45),
                )
            )

        await asyncio.gather(*cicd_tasks)

        return {
            "status": "pipeline_ready",
            "platform": input.platform,
            "deployment_strategy": input.deployment_strategy,
        }


@workflow.defn(name="UnifiedDevOpsWorkflow")
class UnifiedDevOpsWorkflow:
    """Complete end-to-end DevOps automation: Infrastructure + CI/CD + Testing + Observability"""

    def __init__(self) -> None:
        self._logs: List[dict] = []

    @workflow.signal
    async def add_log(self, log_entry: dict) -> None:
        workflow.logger.info(f"Signal received: {log_entry['agent']} {log_entry['type']}")
        self._logs.append(log_entry)

    @workflow.query
    def get_logs(self) -> List[dict]:
        return self._logs

    @workflow.run
    async def run(self, input: UnifiedDevOpsInput) -> dict:
        # Sequential execution of child workflows
        # 1. Infrastructure First
        infra_result = await workflow.execute_child_workflow(
            InfrastructureProvisioningWorkflow.run,
            InfrastructureInput(
                cloud_provider=input.cloud_provider,
                infrastructure_type=input.infrastructure_type,
                environment="production",
                observability_tools=input.observability_tools,
                repo_path=input.repo_path,
                config_path=input.config_path,
            ),
            id=f"{workflow.info().workflow_id}-infrastructure",
            task_queue=workflow.info().task_queue,
        )

        # 2. CI/CD Pipeline (needs infrastructure)
        cicd_result = await workflow.execute_child_workflow(
            CICDPipelineWorkflow.run,
            CICDInput(
                platform=input.ci_platform,
                deployment_strategy=input.deployment_strategy,
                source_code_path=input.source_code_path,
                target_environments=["staging", "production"],
                enable_security_scanning=True,
                repo_path=input.repo_path,
                config_path=input.config_path,
            ),
            id=f"{workflow.info().workflow_id}-cicd",
            task_queue=workflow.info().task_queue,
        )

        # 3. Test Automation (needs CI/CD)
        test_result = await workflow.execute_child_workflow(
            TestAutomationWorkflow.run,
            TestAutomationInput(
                target_app_url=input.target_app_url,
                source_code_path=input.source_code_path,
                test_types=input.test_types,
                framework_preference="playwright",
                ci_platform=input.ci_platform,
                config_path=input.config_path,
            ),
            id=f"{workflow.info().workflow_id}-testing",
            task_queue=workflow.info().task_queue,
        )

        return {
            "status": "complete",
            "infrastructure": infra_result,
            "cicd": cicd_result,
            "testing": test_result,
        }
