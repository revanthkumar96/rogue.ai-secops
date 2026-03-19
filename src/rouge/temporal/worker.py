import asyncio
import sys
from temporalio.client import Client
from temporalio.worker import Worker
from temporalio.envconfig import ClientConfig

from ..config.parser import RougeSettings
from .activities import assemble_report, check_exploitation_queue, run_agent_activity
from .workflows import RougePentestWorkflow
from ..utils.temporal_downloader import ensure_temporal_cli


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
        print(f"❌ Error: Could not connect to Temporal service: {e}")
        print("\n💡 Tip: The Temporal server might not be running.")
        print("   Start it with: temporal server start-dev")
        sys.exit(1)

    # 2. Run Worker
    worker = Worker(
        client,
        task_queue="rouge-task-queue",
        workflows=[RougePentestWorkflow],
        activities=[run_agent_activity, check_exploitation_queue, assemble_report],
    )

    print(f"ROUGE Worker starting on {connect_config.get('target_host')}...")
    try:
        await worker.run()
    except Exception as e:
        print(f"❌ Worker crashed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_worker())
