from datetime import timedelta
from temporalio import workflow
from typing import List

with workflow.unsafe.imports_passed_through():
    from .activities import run_agent_activity, check_exploitation_queue, assemble_report
    from ..types.models import PipelineInput, PipelineState, AgentName

@workflow.defn
class RougePentestWorkflow:
    @workflow.run
    async def run(self, input_data: dict) -> dict:
        web_url = input_data["webUrl"]
        repo_path = input_data["repoPath"]
        
        # 1. Pre-Recon
        await workflow.execute_activity(
            run_agent_activity,
            args=["pre-recon", web_url, repo_path],
            start_to_close_timeout=timedelta(hours=1)
        )
        
        # 2. Recon
        await workflow.execute_activity(
            run_agent_activity,
            args=["recon", web_url, repo_path],
            start_to_close_timeout=timedelta(hours=1)
        )
        
        # 3-4. Vulnerability Analysis & Exploitation (5 Parallel Pipelines)
        vuln_types = ["injection", "xss", "auth", "ssrf", "authz"]
        
        async def run_pipeline(vuln_type: str):
            # Run Vuln Agent
            await workflow.execute_activity(
                run_agent_activity,
                args=[f"{vuln_type}-vuln", web_url, repo_path],
                start_to_close_timeout=timedelta(hours=1)
            )
            
            # Check if exploitation is needed
            should_exploit = await workflow.execute_activity(
                check_exploitation_queue,
                args=[vuln_type, repo_path],
                start_to_close_timeout=timedelta(minutes=5)
            )
            
            if should_exploit:
                await workflow.execute_activity(
                    run_agent_activity,
                    args=[f"{vuln_type}-exploit", web_url, repo_path],
                    start_to_close_timeout=timedelta(hours=1)
                )

        # Run all pipelines in parallel
        await workflow.wait_condition(lambda: True) # (Placeholder for actual parallel execution logic)
        import asyncio
        await asyncio.gather(*[run_pipeline(vt) for vt in vuln_types])
        
        # 5. Reporting
        await assemble_report(repo_path)
        await workflow.execute_activity(
            run_agent_activity,
            args=["report", web_url, repo_path],
            start_to_close_timeout=timedelta(hours=1)
        )
        
        return {"status": "completed"}
