from datetime import timedelta
from typing import List

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from ..types.temporal_types import (
        AgentActivityInput,
        ExploitQueueInput,
        ReportInput,
        RougePentestInput,
    )
    from .activities import assemble_report, check_exploitation_queue, run_agent_activity


@workflow.defn(name="RougePentestWorkflow")
class RougePentestWorkflow:
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
    async def run(self, input: RougePentestInput) -> dict:
        # 1. Pre-Recon
        await workflow.execute_activity(
            run_agent_activity,
            AgentActivityInput(
                agent_name="pre-recon",
                web_url=input.web_url,
                repo_path=input.repo_path,
                config_path=input.config_path,
            ),
            start_to_close_timeout=timedelta(hours=1),
        )

        # 2. Recon
        await workflow.execute_activity(
            run_agent_activity,
            AgentActivityInput(
                agent_name="recon",
                web_url=input.web_url,
                repo_path=input.repo_path,
                config_path=input.config_path,
            ),
            start_to_close_timeout=timedelta(hours=1),
        )

        # 3-4. Vulnerability Analysis & Exploitation (5 Parallel Pipelines)
        vuln_types = ["injection", "xss", "auth", "ssrf", "authz"]

        async def run_pipeline(vuln_type: str):
            # Run Vuln Agent
            await workflow.execute_activity(
                run_agent_activity,
                AgentActivityInput(
                    agent_name=f"{vuln_type}-vuln",
                    web_url=input.web_url,
                    repo_path=input.repo_path,
                    config_path=input.config_path,
                ),
                start_to_close_timeout=timedelta(hours=1),
            )

            # Check if exploitation is needed
            should_exploit = await workflow.execute_activity(
                check_exploitation_queue,
                ExploitQueueInput(vuln_type=vuln_type, repo_path=input.repo_path),
                start_to_close_timeout=timedelta(minutes=5),
            )

            if should_exploit:
                await workflow.execute_activity(
                    run_agent_activity,
                    AgentActivityInput(
                        agent_name=f"{vuln_type}-exploit",
                        web_url=input.web_url,
                        repo_path=input.repo_path,
                        config_path=input.config_path,
                    ),
                    start_to_close_timeout=timedelta(hours=1),
                )

        # Run all pipelines in parallel using Temporal-safe pattern
        import asyncio

        await asyncio.gather(*[run_pipeline(vt) for vt in vuln_types])

        # 5. Reporting
        await workflow.execute_activity(
            assemble_report,
            ReportInput(repo_path=input.repo_path),
            start_to_close_timeout=timedelta(minutes=10),
        )

        await workflow.execute_activity(
            run_agent_activity,
            AgentActivityInput(
                agent_name="report",
                web_url=input.web_url,
                repo_path=input.repo_path,
                config_path=input.config_path,
            ),
            start_to_close_timeout=timedelta(hours=1),
        )

        return {"status": "completed"}
