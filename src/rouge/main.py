import asyncio
import argparse
import sys
from temporalio.client import Client
from .temporal.workflows import RougePentestWorkflow
from .config.parser import RougeSettings

async def start_workflow(args):
    settings = RougeSettings()
    client = await Client.connect(settings.temporal_address, namespace=settings.temporal_namespace)
    
    input_data = {
        "webUrl": args.url,
        "repoPath": args.repo,
        "configPath": args.config
    }
    
    print(f"Starting ROUGE workflow for {args.url}...")
    handle = await client.start_workflow(
        RougePentestWorkflow.run,
        input_data,
        id=f"rouge-{int(asyncio.get_event_loop().time())}",
        task_queue="rouge-task-queue",
    )
    
    print(f"Workflow started. ID: {handle.id}")

def main():
    parser = argparse.ArgumentParser(description="ROUGE: AI Pentester")
    subparsers = parser.add_subparsers(dest="command")
    
    start_parser = subparsers.add_parser("start", help="Start a new pentest")
    start_parser.add_argument("url", help="Target URL")
    start_parser.add_argument("repo", help="Target Repository Path")
    start_parser.add_argument("--config", help="Optional config file path", default=None)
    
    args = parser.parse_args()
    
    if args.command == "start":
        asyncio.run(start_workflow(args))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
