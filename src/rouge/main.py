import argparse
import asyncio
import os
import sys
from datetime import datetime
from typing import List, Optional

import ollama
import questionary
from rich.console import Console, Group
from rich.live import Live
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from temporalio.client import Client, WorkflowHandle
from temporalio.envconfig import ClientConfig

from .config.parser import RougeSettings
from .temporal.workflows import RougePentestWorkflow
from .types.temporal_types import RougePentestInput
from .utils.temporal_downloader import ensure_temporal_cli

console = Console()

def print_banner():
    banner = """
    ██████╗  ██████╗ ██╗   ██╗ ██████╗ ███████╗
    ██╔══██╗██╔═══██╗██║   ██║██╔════╝ ██╔════╝
    ██████╔╝██║   ██║██║   ██║██║  ███╗█████╗
    ██╔══██╗██║   ██║██║   ██║██║   ██║██╔══╝
    ██║  ██║╚██████╔╝╚██████╔╝╚██████╔╝███████╗
    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝
    """
    console.print(Panel(banner, subtitle="Autonomous AI Pentester", border_style="bold red"))

async def fetch_available_models(base_url: str) -> List[str]:
    """Fetch available models from Ollama."""
    try:
        client = ollama.AsyncClient(host=base_url)
        response = await client.list()
        return [m["name"] for m in response["models"]]
    except Exception:
        # Fallback to defaults if Ollama is not reachable
        return ["qwen2.5:7b", "llama3.1:8b", "llama3.1:70b", "mistral:latest"]

async def get_interactive_input():
    settings = RougeSettings()

    console.print("\n[bold cyan]🚀 Initializing ROUGE Interactive Setup...[/bold cyan]")

    # 1. Fetch Models Dynamically
    with console.status("[bold green]Fetching available models from Ollama..."):
        available_models = await fetch_available_models(settings.ollama_base_url)

    if not available_models:
        console.print("[yellow]⚠️ Warning: No models found from Ollama. Using default placeholders.[/yellow]")
        available_models = ["qwen2.5:7b", "llama3.1:8b", "llama3.1:70b"]

    selected_model = await questionary.select(
        "🤖 Which model should ROUGE use for reasoning?",
        choices=available_models + ["custom"],
        default=available_models[0] if available_models else "qwen2.5:7b"
    ).ask_async()

    if selected_model == "custom":
        selected_model = await questionary.text("Enter custom model name (e.g., 'gpt-4o'):").ask_async()

    # 2. Get Target URL
    target_url = await questionary.text(
        "🌐 What is the target URL for the pentest?",
        instruction="(e.g., http://localhost:3000)",
        validate=lambda text: (text.startswith("http://") or text.startswith("https://")) or "Please enter a valid URL (http:// or https://)"
    ).ask_async()

    # 3. Get Target Repo Path
    current_dir = os.getcwd()
    repo_path = await questionary.path(
        "📂 Where is the local repository located?",
        default=current_dir,
        only_directories=True
    ).ask_async()

    # 4. Get Config Path (Optional)
    include_config = await questionary.confirm("⚙️ Do you want to use a custom rogue-config.yaml?", default=False).ask_async()
    config_path = None
    if include_config:
        config_path = await questionary.path(
            "📁 Select custom config file:",
            validate=lambda p: os.path.isfile(p) or "Please select a valid file"
        ).ask_async()

    # Summary Table
    table = Table(title="🛡️ Pentest Configuration Summary", border_style="bold red")
    table.add_column("Property", style="bold cyan")
    table.add_column("Value", style="white")
    table.add_row("Model", selected_model)
    table.add_row("Target URL", target_url)
    table.add_row("Repo Path", repo_path)
    table.add_row("Config Path", config_path or "Default (None)")

    console.print("\n", table, "\n")

    confirm = await questionary.confirm("⚡ Ready to launch the pentest?").ask_async()
    if not confirm:
        console.print("[yellow]Setup cancelled. Exiting...[/yellow]")
        sys.exit(0)

    return target_url, repo_path, config_path, selected_model

def create_log_renderable(logs: List[dict]):
    """Create a renderable list of logs for the Live UI."""
    log_group = []
    # Show last 15 logs
    for log in logs[-15:]:
        color = "green" if log["type"] == "thought" else "yellow"
        label = "🧠 THOUGHT" if log["type"] == "thought" else "🛠️ TOOL CALL"

        timestamp = ""
        if log.get("timestamp"):
            try:
                dt = datetime.fromisoformat(log["timestamp"])
                timestamp = f"[dim]{dt.strftime('%H:%M:%S')}[/dim] "
            except Exception:
                pass

        content = log["content"]
        if len(content) > 120:
            content = content[:117] + "..."

        line = Text.assemble(
            (timestamp, "dim"),
            (f"[{log['agent']}] ", "bold blue"),
            (f"{label}: ", f"bold {color}"),
            (content, "white")
        )
        log_group.append(line)
    if not log_group:
        return Text("Waiting for agent activity...", style="dim italic")

    return Group(*log_group)

async def monitor_workflow(handle: WorkflowHandle):
    """Monitor the workflow and display live agent logs."""
    console.print("\n[bold cyan]🛰️ Entering Monitoring Mode...[/bold cyan]")

    with Live(auto_refresh=False) as live:
        while True:
            try:
                # 1. Check workflow status
                desc = await handle.describe()
                status = desc.status

                # Status numeric values: 1=RUNNING, 2=COMPLETED, etc.
                # We stay in loop if status is 1 (RUNNING)

                # 2. Query logs from workflow
                logs = []
                try:
                    logs = await handle.query("get_logs")
                except Exception:
                    # Workflow might not be ready for queries yet
                    pass

                # 3. Update Live UI
                table = Table.grid(expand=True)
                table.add_row(Panel(
                    create_log_renderable(logs),
                    title=f"[bold]Live Agent Activity - {handle.id}[/bold]",
                    subtitle=f"[bold]Status: {status.name}[/bold]",
                    border_style="cyan"
                ))

                live.update(table, refresh=True)

                if status.name != "RUNNING":
                    break

                await asyncio.sleep(1)
            except Exception:
                # Don't break on transient errors, just log and continue
                # unless it's a critical failure
                await asyncio.sleep(1)

    console.print("\n[bold green]🏁 Workflow Finished![/bold green]")
    console.print(Panel(f"Final results available at: [bold blue]http://localhost:8233/namespaces/default/workflows/{handle.id}[/bold blue]", border_style="green"))

async def start_workflow(url: str, repo: str, config: Optional[str], model: Optional[str] = None):
    settings = RougeSettings()

    # Update settings temporarily if model provided
    if model:
        os.environ["OLLAMA_SMALL_MODEL"] = model
        os.environ["OLLAMA_MEDIUM_MODEL"] = model
        os.environ["OLLAMA_LARGE_MODEL"] = model

    connect_config = ClientConfig.load_client_connect_config()
    if "target_host" not in connect_config or not connect_config["target_host"]:
        connect_config["target_host"] = settings.temporal_address

    try:
        with console.status("[bold green]Connecting to Temporal..."):
            client = await Client.connect(**connect_config)
    except Exception as e:
        console.print(f"\n[bold red]❌ Error:[/bold red] Could not connect to Temporal service: {e}")
        console.print("\n[bold yellow]💡 Tip:[/bold yellow] Have you started the Temporal dev server?")
        console.print("   Run: [bold]temporal server start-dev[/bold]")
        sys.exit(1)

    input_data = RougePentestInput(
        web_url=url,
        repo_path=repo,
        config_path=config
    )

    with console.status(f"[bold cyan]Launching ROUGE workflow for {url}..."):
        try:
            handle = await client.start_workflow(
                RougePentestWorkflow.run,
                input_data,
                id=f"rouge-{int(asyncio.get_event_loop().time())}",
                task_queue="rouge-task-queue",
            )
            console.print("\n[bold green]✅ Workflow started successfully![/bold green]")
            console.print(f"[bold]Workflow ID:[/bold] {handle.id}")
        except Exception as e:
            console.print(f"\n[bold red]❌ Failed to start workflow:[/bold red] {e}")
            sys.exit(1)

    # Start monitoring mode
    await monitor_workflow(handle)

async def async_main():
    ensure_temporal_cli()
    print_banner()

    parser = argparse.ArgumentParser(description="ROUGE: AI Pentester", add_help=True)
    subparsers = parser.add_subparsers(dest="command")

    start_parser = subparsers.add_parser("start", help="Start a new pentest")
    start_parser.add_argument("url", help="Target URL", nargs='?')
    start_parser.add_argument("repo", help="Target Repository Path", nargs='?')
    start_parser.add_argument("--config", help="Optional config file path", default=None)

    args, _ = parser.parse_known_args()

    if args.command == "start" and args.url and args.repo:
        await start_workflow(args.url, args.repo, args.config)
    elif args.command == "start" or not args.command:
        # Launch Interactive Mode
        try:
            url, repo, config, model = await get_interactive_input()
            await start_workflow(url, repo, config, model)
        except KeyboardInterrupt:
            console.print("\n[yellow]Exit.[/yellow]")
            sys.exit(0)
    else:
        parser.print_help()

def main():
    try:
        asyncio.run(async_main())
    except KeyboardInterrupt:
        console.print("\n[yellow]Interrupted by user.[/yellow]")
        sys.exit(0)

if __name__ == "__main__":
    main()
