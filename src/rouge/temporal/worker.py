import asyncio
import sys

from temporalio.client import Client
from temporalio.envconfig import ClientConfig
from temporalio.worker import Worker

from ..config.parser import RougeSettings
from ..utils.temporal_downloader import ensure_temporal_cli
from .activities import assemble_report, check_exploitation_queue, run_agent_activity
from .workflows import (
    CICDPipelineWorkflow,
    InfrastructureProvisioningWorkflow,
    TestAutomationWorkflow,
    UnifiedDevOpsWorkflow,
)


async def run_worker():
    ensure_temporal_cli()
    settings = RougeSettings()

    # Use envconfig to load connection options
    connect_config = ClientConfig.load_client_connect_config()

    if "target_host" not in connect_config or not connect_config["target_host"]:
        connect_config["target_host"] = settings.temporal_address

    # 1. Connect to Temporal
    try:
        print(f"Connecting to Temporal at {connect_config.get('target_host')}...")
        client = await Client.connect(**connect_config)
    except Exception as e:
        print(f"Error: Could not connect to Temporal service: {e}")
        print("\nTip: The Temporal server might not be running.")
        print("   Start it with: temporal server start-dev")
        sys.exit(1)

    # 2. Run Worker with all workflow types
    worker = Worker(
        client,
        task_queue="rouge-task-queue",
        workflows=[
            TestAutomationWorkflow,
            InfrastructureProvisioningWorkflow,
            CICDPipelineWorkflow,
            UnifiedDevOpsWorkflow,
        ],
        activities=[run_agent_activity, check_exploitation_queue, assemble_report],
    )

    print(f"ROUGE Worker starting on {connect_config.get('target_host')}...")
    print("Registered workflows: TestAutomation, InfrastructureProvisioning, CICDPipeline, UnifiedDevOps")
    try:
        await worker.run()
    except Exception as e:
        print(f"Worker crashed: {e}")
        sys.exit(1)



if __name__ == "__main__":
    asyncio.run(run_worker())
