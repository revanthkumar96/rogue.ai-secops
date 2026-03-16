import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from .activities import run_agent_activity, check_exploitation_queue, assemble_report
from .workflows import RougePentestWorkflow
from ..config.parser import RougeSettings

async def run_worker():
    settings = RougeSettings()
    
    # 1. Connect to Temporal
    client = await Client.connect(settings.temporal_address, namespace=settings.temporal_namespace)
    
    # 2. Run Worker
    worker = Worker(
        client,
        task_queue="rouge-task-queue",
        workflows=[RougePentestWorkflow],
        activities=[run_agent_activity, check_exploitation_queue, assemble_report],
    )
    
    # Standard logger setup would go here
    print(f"ROUGE Worker starting on {settings.temporal_address}...")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(run_worker())
