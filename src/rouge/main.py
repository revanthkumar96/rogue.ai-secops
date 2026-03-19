import argparse
import asyncio
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional

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
from .temporal.workflows import (
    CICDPipelineWorkflow,
    InfrastructureProvisioningWorkflow,
    TestAutomationWorkflow,
    UnifiedDevOpsWorkflow,
)
from .types.temporal_types import (
    CICDInput,
    InfrastructureInput,
    TestAutomationInput,
    UnifiedDevOpsInput,
)
from .utils.temporal_downloader import ensure_temporal_cli

console = Console()


class APIUsageTracker:
    """Track API usage across workflows"""

    def __init__(self):
        self.workflows: List[Dict] = []
        self.total_duration_ms = 0
        self.total_agents_run = 0

    def add_workflow(self, workflow_id: str, workflow_type: str, duration_ms: float, agents_count: int):
        """Add workflow execution metrics"""
        self.workflows.append(
            {
                "id": workflow_id,
                "type": workflow_type,
                "duration_ms": duration_ms,
                "agents_count": agents_count,
                "timestamp": datetime.now().isoformat(),
            }
        )
        self.total_duration_ms += duration_ms
        self.total_agents_run += agents_count

    def display_summary(self):
        """Display API usage summary"""
        table = Table(title="📊 API Usage Summary", border_style="cyan")
        table.add_column("Metric", style="bold cyan")
        table.add_column("Value", style="white")

        table.add_row("Total Workflows", str(len(self.workflows)))
        table.add_row("Total Agents Run", str(self.total_agents_run))
        table.add_row("Total Duration", f"{self.total_duration_ms / 1000:.2f}s")
        table.add_row(
            "Average per Workflow", f"{(self.total_duration_ms / len(self.workflows) / 1000) if self.workflows else 0:.2f}s"
        )

        console.print("\n", table, "\n")

        if self.workflows:
            # Show workflow breakdown
            workflow_table = Table(title="Workflow Breakdown", border_style="dim")
            workflow_table.add_column("Workflow Type", style="cyan")
            workflow_table.add_column("Agents", justify="right")
            workflow_table.add_column("Duration", justify="right")

            for wf in self.workflows:
                workflow_table.add_row(wf["type"], str(wf["agents_count"]), f"{wf['duration_ms'] / 1000:.2f}s")

            console.print(workflow_table, "\n")


# Global usage tracker
usage_tracker = APIUsageTracker()


def print_banner():
    banner = """
    ██████╗  ██████╗ ██╗   ██╗ ██████╗ ███████╗
    ██╔══██╗██╔═══██╗██║   ██║██╔════╝ ██╔════╝
    ██████╔╝██║   ██║██║   ██║██║  ███╗█████╗
    ██╔══██╗██║   ██║██║   ██║██║   ██║██╔══╝
    ██║  ██║╚██████╔╝╚██████╔╝╚██████╔╝███████╗
    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝
    """
    subtitle = "DevOps & Testing Automation Platform\nConvert Unstructured Projects → Deployable Applications"
    console.print(Panel(banner, subtitle=subtitle, border_style="bold cyan"))


async def fetch_available_models(base_url: str) -> List[str]:
    """Fetch available models from Ollama."""
    try:
        client = ollama.AsyncClient(host=base_url)
        response = await client.list()
        return [m["name"] for m in response["models"]]
    except Exception:
        # Fallback to defaults if Ollama is not reachable
        return ["qwen2.5:7b", "llama3.1:8b", "llama3.1:70b", "mistral:latest"]


async def select_workflow_type():
    """Let user select which workflow to run"""
    console.print("\n[bold cyan]🚀 What would you like to automate?[/bold cyan]\n")

    workflow_type = await questionary.select(
        "Select automation workflow:",
        choices=[
            questionary.Choice(
                "🧪 Test Automation - Generate comprehensive test suites (UI, API, Performance)",
                value="test",
            ),
            questionary.Choice(
                "☁️  Infrastructure Provisioning - Set up cloud infrastructure with Terraform/K8s",
                value="infra",
            ),
            questionary.Choice("🔄 CI/CD Pipeline - Create automated deployment pipelines", value="cicd"),
            questionary.Choice(
                "🎯 Unified DevOps - Complete end-to-end automation (Infra + CI/CD + Testing)", value="unified"
            ),
        ],
    ).ask_async()

    return workflow_type


async def get_test_automation_input():
    """Get input for TestAutomationWorkflow"""
    console.print("\n[bold green]🧪 Test Automation Configuration[/bold green]\n")

    target_url = await questionary.text(
        "🌐 Target application URL:",
        instruction="(e.g., http://localhost:3000)",
        validate=lambda text: (text.startswith("http://") or text.startswith("https://"))
        or "Please enter a valid URL",
    ).ask_async()

    repo_path = await questionary.path(
        "📂 Source code repository path:", default=os.getcwd(), only_directories=True
    ).ask_async()

    # Test types selection
    test_types = await questionary.checkbox(
        "What types of tests do you want to generate?",
        choices=[
            questionary.Choice("UI Tests (Playwright)", value="ui", checked=True),
            questionary.Choice("API Tests (REST/GraphQL)", value="api", checked=True),
            questionary.Choice("Performance Tests (k6)", value="performance"),
            questionary.Choice("Mobile Tests (Appium)", value="mobile"),
            questionary.Choice("Accessibility Tests (WCAG)", value="accessibility"),
            questionary.Choice("Visual Regression Tests", value="visual"),
        ],
    ).ask_async()

    framework = await questionary.select(
        "Preferred testing framework:", choices=["playwright", "selenium", "cypress"], default="playwright"
    ).ask_async()

    ci_platform = await questionary.select(
        "CI/CD platform:", choices=["github-actions", "jenkins", "gitlab-ci", "circleci"], default="github-actions"
    ).ask_async()

    return TestAutomationInput(
        target_app_url=target_url,
        source_code_path=repo_path,
        test_types=test_types,
        framework_preference=framework,
        ci_platform=ci_platform,
    )


async def get_infrastructure_input():
    """Get input for InfrastructureProvisioningWorkflow"""
    console.print("\n[bold green]☁️  Infrastructure Provisioning Configuration[/bold green]\n")

    cloud_provider = await questionary.select(
        "Cloud provider:", choices=["aws", "azure", "gcp", "on-prem"], default="aws"
    ).ask_async()

    infra_type = await questionary.select(
        "Infrastructure type:", choices=["kubernetes", "vm", "serverless", "hybrid"], default="kubernetes"
    ).ask_async()

    environment = await questionary.select(
        "Environment:", choices=["dev", "staging", "production"], default="production"
    ).ask_async()

    observability = await questionary.checkbox(
        "Observability tools:",
        choices=[
            questionary.Choice("Prometheus", value="prometheus", checked=True),
            questionary.Choice("Grafana", value="grafana", checked=True),
            questionary.Choice("ELK Stack", value="elk"),
            questionary.Choice("Datadog", value="datadog"),
        ],
    ).ask_async()

    repo_path = await questionary.path("📂 Output repository path:", default=os.getcwd(), only_directories=True).ask_async()

    return InfrastructureInput(
        cloud_provider=cloud_provider,
        infrastructure_type=infra_type,
        environment=environment,
        observability_tools=observability,
        repo_path=repo_path,
    )


async def get_cicd_input():
    """Get input for CICDPipelineWorkflow"""
    console.print("\n[bold green]🔄 CI/CD Pipeline Configuration[/bold green]\n")

    platform = await questionary.select(
        "CI/CD platform:", choices=["github-actions", "jenkins", "gitlab-ci", "circleci"], default="github-actions"
    ).ask_async()

    strategy = await questionary.select(
        "Deployment strategy:", choices=["blue-green", "canary", "rolling", "recreate"], default="blue-green"
    ).ask_async()

    repo_path = await questionary.path("📂 Source code repository path:", default=os.getcwd(), only_directories=True).ask_async()

    environments = await questionary.checkbox(
        "Target environments:",
        choices=[
            questionary.Choice("Staging", value="staging", checked=True),
            questionary.Choice("Production", value="production", checked=True),
            questionary.Choice("Development", value="development"),
        ],
    ).ask_async()

    security_scan = await questionary.confirm("Enable security scanning (Trivy, Snyk)?", default=True).ask_async()

    return CICDInput(
        platform=platform,
        deployment_strategy=strategy,
        source_code_path=repo_path,
        target_environments=environments,
        enable_security_scanning=security_scan,
        repo_path=repo_path,
    )


async def get_unified_input():
    """Get input for UnifiedDevOpsWorkflow"""
    console.print("\n[bold green]🎯 Unified DevOps Configuration[/bold green]\n")
    console.print(
        "[dim]This workflow combines Infrastructure + CI/CD + Testing for complete automation[/dim]\n"
    )

    target_url = await questionary.text(
        "🌐 Application URL:", validate=lambda text: (text.startswith("http://") or text.startswith("https://")) or "Valid URL required"
    ).ask_async()

    repo_path = await questionary.path("📂 Repository path:", default=os.getcwd(), only_directories=True).ask_async()

    cloud_provider = await questionary.select("Cloud provider:", choices=["aws", "azure", "gcp"]).ask_async()

    infra_type = await questionary.select(
        "Infrastructure:", choices=["kubernetes", "vm", "serverless"]
    ).ask_async()

    test_types = ["ui", "api", "performance"]  # Default comprehensive testing

    ci_platform = await questionary.select(
        "CI/CD platform:", choices=["github-actions", "jenkins", "gitlab-ci"]
    ).ask_async()

    deployment = await questionary.select(
        "Deployment strategy:", choices=["blue-green", "canary", "rolling"]
    ).ask_async()

    return UnifiedDevOpsInput(
        target_app_url=target_url,
        source_code_path=repo_path,
        cloud_provider=cloud_provider,
        infrastructure_type=infra_type,
        test_types=test_types,
        ci_platform=ci_platform,
        deployment_strategy=deployment,
        observability_tools=["prometheus", "grafana", "elk"],
        repo_path=repo_path,
    )


def create_log_renderable(logs: List[dict]):
    """Create a renderable list of logs for the Live UI."""
    log_group = []
    # Show last 20 logs
    for log in logs[-20:]:
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
        if len(content) > 150:
            content = content[:147] + "..."

        line = Text.assemble(
            (timestamp, "dim"),
            (f"[{log['agent']}] ", "bold blue"),
            (f"{label}: ", f"bold {color}"),
            (content, "white"),
        )
        log_group.append(line)

    if not log_group:
        return Text("Waiting for agent activity...", style="dim italic")

    return Group(*log_group)


async def monitor_workflow(handle: WorkflowHandle, workflow_type: str):
    """Monitor the workflow and display live agent logs."""
    console.print(f"\n[bold cyan]🛰️  Monitoring {workflow_type} workflow...[/bold cyan]")
    console.print("[dim]Press Ctrl+C to stop monitoring (workflow will continue in background)[/dim]\n")

    start_time = datetime.now()
    agent_count = 0

    with Live(auto_refresh=False) as live:
        try:
            while True:
                try:
                    # 1. Check workflow status
                    desc = await handle.describe()
                    status = desc.status

                    # 2. Query logs from workflow
                    logs = []
                    try:
                        logs = await handle.query("get_logs")
                        # Count unique agents
                        unique_agents = set(log.get("agent") for log in logs if log.get("agent"))
                        agent_count = len(unique_agents)
                    except Exception:
                        pass

                    # 3. Calculate elapsed time
                    elapsed = datetime.now() - start_time
                    elapsed_str = f"{int(elapsed.total_seconds())}s"

                    # 4. Update Live UI
                    table = Table.grid(expand=True)
                    table.add_row(
                        Panel(
                            create_log_renderable(logs),
                            title=f"[bold]Live Agent Activity - {workflow_type}[/bold]",
                            subtitle=f"[bold]Status: {status.name} | Agents: {agent_count} | Elapsed: {elapsed_str}[/bold]",
                            border_style="cyan",
                        )
                    )

                    live.update(table, refresh=True)

                    if status.name != "RUNNING":
                        # Record metrics
                        usage_tracker.add_workflow(
                            handle.id, workflow_type, elapsed.total_seconds() * 1000, agent_count
                        )
                        break

                    await asyncio.sleep(1)
                except KeyboardInterrupt:
                    console.print("\n[yellow]⏸️  Monitoring stopped (workflow continues in background)[/yellow]")
                    console.print(
                        f"[dim]Workflow ID: {handle.id} - Check Temporal UI for progress[/dim]"
                    )
                    return False  # Indicate monitoring was interrupted
                except Exception:
                    await asyncio.sleep(1)
        except KeyboardInterrupt:
            console.print("\n[yellow]⏸️  Monitoring stopped[/yellow]")
            return False

    elapsed = datetime.now() - start_time
    console.print("\n[bold green]✅ Workflow Completed![/bold green]")
    console.print(f"[dim]Duration: {int(elapsed.total_seconds())}s | Agents run: {agent_count}[/dim]")
    console.print(
        Panel(
            f"Workflow ID: [bold blue]{handle.id}[/bold blue]\n"
            f"Temporal UI: [bold]http://localhost:8233/namespaces/default/workflows/{handle.id}[/bold]\n"
            f"Deliverables: [bold]{handle.result()}[/bold] (once workflow completes)",
            title="📦 Workflow Results",
            border_style="green",
        )
    )
    return True  # Indicate workflow completed successfully


async def start_workflow(workflow_type: str, input_data, model: Optional[str] = None):
    """Start the selected workflow"""
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
        console.print(f"\n[bold red]❌ Error:[/bold red] Could not connect to Temporal: {e}")
        console.print("\n[bold yellow]💡 Tip:[/bold yellow] Start Temporal dev server:")
        console.print("   Run: [bold]temporal server start-dev[/bold]")
        return None

    # Select appropriate workflow
    workflow_map = {
        "test": TestAutomationWorkflow,
        "infra": InfrastructureProvisioningWorkflow,
        "cicd": CICDPipelineWorkflow,
        "unified": UnifiedDevOpsWorkflow,
    }

    workflow_class = workflow_map.get(workflow_type)
    if not workflow_class:
        console.print(f"[red]Unknown workflow type: {workflow_type}[/red]")
        return None

    with console.status(f"[bold cyan]Starting {workflow_type} workflow..."):
        try:
            handle = await client.start_workflow(
                workflow_class.run,
                input_data,
                id=f"rouge-{workflow_type}-{int(asyncio.get_event_loop().time())}",
                task_queue="rouge-task-queue",
            )
            console.print("\n[bold green]✅ Workflow started successfully![/bold green]")
            console.print(f"[bold]Workflow ID:[/bold] {handle.id}")
        except Exception as e:
            console.print(f"\n[bold red]❌ Failed to start workflow:[/bold red] {e}")
            return None

    # Monitor workflow
    completed = await monitor_workflow(handle, workflow_type)
    return handle if completed else None


async def follow_up_menu():
    """Interactive follow-up menu after workflow completion"""
    while True:
        console.print("\n[bold cyan]What would you like to do next?[/bold cyan]\n")

        action = await questionary.select(
            "Select an action:",
            choices=[
                questionary.Choice("🔄 Run another workflow", value="run_again"),
                questionary.Choice("📊 View API usage summary", value="usage"),
                questionary.Choice("💡 Ask a question / Get help", value="question"),
                questionary.Choice("🚪 Exit ROUGE", value="exit"),
            ],
        ).ask_async()

        if action == "run_again":
            return "run_again"
        elif action == "usage":
            usage_tracker.display_summary()
            continue  # Stay in menu
        elif action == "question":
            console.print(
                "\n[bold yellow]💡 Questions & Help:[/bold yellow]\n"
                "- Check deliverables in your repository's 'deliverables/' folder\n"
                "- Review generated code (tests, infrastructure, pipelines)\n"
                "- Run generated tests: pytest deliverables/ui_test_suite.py\n"
                "- Apply infrastructure: cd deliverables && terraform init && terraform plan\n"
                "- Review CI/CD config: Check .github/workflows/ for pipeline files\n"
                "\n[dim]For more details, see README.md and ARCHITECTURE.md[/dim]\n"
            )
            continue  # Stay in menu
        elif action == "exit":
            return "exit"


async def interactive_session():
    """Main interactive session loop"""
    settings = RougeSettings()

    console.print("\n[bold cyan]🚀 Initializing ROUGE...[/bold cyan]")

    # Fetch available models
    with console.status("[bold green]Fetching available models from Ollama..."):
        available_models = await fetch_available_models(settings.ollama_base_url)

    if not available_models:
        console.print("[yellow]⚠️  Warning: No models found. Using defaults.[/yellow]")
        available_models = ["qwen2.5:7b", "llama3.1:8b", "llama3.1:70b"]

    selected_model = await questionary.select(
        "🤖 Select Ollama model:", choices=available_models + ["custom"], default=available_models[0]
    ).ask_async()

    if selected_model == "custom":
        selected_model = await questionary.text("Enter custom model name:").ask_async()

    # Main workflow loop
    while True:
        try:
            # 1. Select workflow type
            workflow_type = await select_workflow_type()

            # 2. Get workflow-specific input
            if workflow_type == "test":
                input_data = await get_test_automation_input()
            elif workflow_type == "infra":
                input_data = await get_infrastructure_input()
            elif workflow_type == "cicd":
                input_data = await get_cicd_input()
            elif workflow_type == "unified":
                input_data = await get_unified_input()
            else:
                console.print("[red]Invalid workflow type[/red]")
                continue

            # 3. Show summary and confirm
            confirm = await questionary.confirm("⚡ Ready to start automation?", default=True).ask_async()
            if not confirm:
                console.print("[yellow]Cancelled. Returning to workflow selection...[/yellow]")
                continue

            # 4. Start workflow
            handle = await start_workflow(workflow_type, input_data, selected_model)

            if not handle:
                console.print("[yellow]Workflow did not complete. Try again.[/yellow]")
                continue

            # 5. Follow-up menu
            next_action = await follow_up_menu()

            if next_action == "exit":
                break
            elif next_action == "run_again":
                continue  # Loop back to workflow selection

        except KeyboardInterrupt:
            console.print("\n[yellow]Interrupted. Returning to menu...[/yellow]")
            should_exit = await questionary.confirm("Exit ROUGE?", default=False).ask_async()
            if should_exit:
                break
            continue


async def cmd_run_tests(deliverables_dir: str = "deliverables"):
    """Execute generated test suites"""
    console.print("\n[bold cyan]🧪 Executing Generated Tests[/bold cyan]\n")

    test_files = []
    for root, _, files in os.walk(deliverables_dir):
        test_files.extend([os.path.join(root, f) for f in files if f.endswith("_test.py") or f.endswith("_test_suite.py")])

    if not test_files:
        console.print(f"[yellow]No test files found in {deliverables_dir}/[/yellow]")
        return

    console.print(f"[green]Found {len(test_files)} test file(s)[/green]")
    for tf in test_files:
        console.print(f"  • {tf}")

    # Run pytest
    import subprocess
    result = subprocess.run(
        ["pytest", deliverables_dir, "-v", "--tb=short", "--color=yes"],
        capture_output=False
    )

    if result.returncode == 0:
        console.print("\n[bold green]✅ All tests passed![/bold green]")
    else:
        console.print("\n[bold red]❌ Some tests failed[/bold red]")


async def cmd_apply_infrastructure(deliverables_dir: str = "deliverables"):
    """Apply generated Terraform infrastructure"""
    console.print("\n[bold cyan]☁️  Applying Generated Infrastructure[/bold cyan]\n")

    tf_files = []
    for root, _, files in os.walk(deliverables_dir):
        tf_files.extend([os.path.join(root, f) for f in files if f.endswith(".tf")])

    if not tf_files:
        console.print(f"[yellow]No Terraform files found in {deliverables_dir}/[/yellow]")
        return

    tf_dir = os.path.dirname(tf_files[0])
    console.print(f"[green]Found Terraform code in: {tf_dir}[/green]")

    # Run terraform commands
    import subprocess

    commands = [
        (["terraform", "init"], "Initializing Terraform"),
        (["terraform", "validate"], "Validating configuration"),
        (["terraform", "plan"], "Planning infrastructure changes"),
    ]

    for cmd, desc in commands:
        console.print(f"\n[cyan]{desc}...[/cyan]")
        result = subprocess.run(cmd, cwd=tf_dir, capture_output=False)
        if result.returncode != 0:
            console.print(f"[bold red]❌ {desc} failed[/bold red]")
            return

    # Ask for confirmation before apply
    apply = await questionary.confirm(
        "⚠️  Ready to apply infrastructure changes?",
        default=False
    ).ask_async()

    if apply:
        console.print("\n[cyan]Applying infrastructure...[/cyan]")
        result = subprocess.run(["terraform", "apply", "-auto-approve"], cwd=tf_dir, capture_output=False)
        if result.returncode == 0:
            console.print("\n[bold green]✅ Infrastructure deployed successfully![/bold green]")
        else:
            console.print("\n[bold red]❌ Infrastructure deployment failed[/bold red]")
    else:
        console.print("[yellow]Cancelled infrastructure deployment[/yellow]")


async def cmd_list_workflows():
    """List all workflow executions"""
    console.print("\n[bold cyan]📋 Workflow History[/bold cyan]\n")

    if not usage_tracker.workflows:
        console.print("[yellow]No workflows executed yet[/yellow]")
        return

    table = Table(border_style="cyan")
    table.add_column("Workflow ID", style="blue")
    table.add_column("Type", style="cyan")
    table.add_column("Agents", justify="right")
    table.add_column("Duration", justify="right")
    table.add_column("Timestamp")

    for wf in usage_tracker.workflows:
        timestamp = datetime.fromisoformat(wf["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")
        table.add_row(
            wf["id"][:20] + "...",
            wf["type"],
            str(wf["agents_count"]),
            f"{wf['duration_ms'] / 1000:.2f}s",
            timestamp
        )

    console.print(table)


async def cmd_view_deliverables(deliverables_dir: str = "deliverables"):
    """View generated deliverables"""
    console.print("\n[bold cyan]📦 Generated Deliverables[/bold cyan]\n")

    if not os.path.exists(deliverables_dir):
        console.print(f"[yellow]{deliverables_dir}/ directory not found[/yellow]")
        return

    files = []
    for root, _, filenames in os.walk(deliverables_dir):
        for f in filenames:
            filepath = os.path.join(root, f)
            size = os.path.getsize(filepath)
            files.append((filepath, size))

    if not files:
        console.print(f"[yellow]No deliverables found in {deliverables_dir}/[/yellow]")
        return

    table = Table(border_style="cyan")
    table.add_column("File", style="blue")
    table.add_column("Size", justify="right", style="green")
    table.add_column("Type", style="cyan")

    for filepath, size in sorted(files):
        rel_path = os.path.relpath(filepath, deliverables_dir)
        size_kb = size / 1024

        # Determine file type
        if filepath.endswith(".py"):
            file_type = "🐍 Python"
        elif filepath.endswith(".tf"):
            file_type = "🏗️  Terraform"
        elif filepath.endswith(".yml") or filepath.endswith(".yaml"):
            file_type = "⚙️  YAML"
        elif filepath.endswith(".md"):
            file_type = "📝 Markdown"
        else:
            file_type = "📄 File"

        table.add_row(rel_path, f"{size_kb:.1f} KB", file_type)

    console.print(table)
    console.print(f"\n[dim]Total files: {len(files)}[/dim]")


async def async_main():
    ensure_temporal_cli()
    print_banner()

    parser = argparse.ArgumentParser(
        prog="rouge",
        description="ROUGE: DevOps & Testing Automation Platform",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  rouge run test                     # Generate test automation
  rouge run infra                    # Generate infrastructure
  rouge execute tests                # Run generated tests
  rouge execute terraform            # Apply generated infrastructure
  rouge list                         # List workflow history
  rouge deliverables                 # View generated files

  rouge -ollama -model qwen2.5:7b    # Use specific Ollama model
        """
    )

    # Subcommands
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # run command
    run_parser = subparsers.add_parser("run", help="Run automation workflows")
    run_parser.add_argument("workflow", choices=["test", "infra", "cicd", "unified"], help="Workflow type")
    run_parser.add_argument("--url", help="Target URL")
    run_parser.add_argument("--repo", help="Repository path", default=os.getcwd())

    # execute command
    exec_parser = subparsers.add_parser("execute", help="Execute generated code")
    exec_parser.add_argument("target", choices=["tests", "terraform", "pipeline"], help="What to execute")
    exec_parser.add_argument("--dir", default="deliverables", help="Deliverables directory")

    # list command
    subparsers.add_parser("list", help="List workflow history")

    # deliverables command
    deliv_parser = subparsers.add_parser("deliverables", help="View generated files")
    deliv_parser.add_argument("--dir", default="deliverables", help="Deliverables directory")

    # Global flags
    parser.add_argument("-ollama", action="store_true", help="Use Ollama for LLM inference")
    parser.add_argument("-model", type=str, help="Specific Ollama model name")
    parser.add_argument("--non-interactive", action="store_true", help="Run without prompts")

    args = parser.parse_args()

    # Handle model selection
    selected_model = None
    if args.ollama or args.model:
        if args.model:
            selected_model = args.model
            console.print(f"[cyan]Using Ollama model: {selected_model}[/cyan]")
        else:
            # Fetch and select model interactively
            settings = RougeSettings()
            with console.status("[bold green]Fetching available models..."):
                available_models = await fetch_available_models(settings.ollama_base_url)

            if available_models:
                selected_model = await questionary.select(
                    "Select Ollama model:", choices=available_models
                ).ask_async()

    # Route to appropriate command
    if args.command == "run":
        # Run workflow
        workflow_type = args.workflow

        if args.non_interactive:
            console.print("[yellow]Non-interactive mode coming soon. Use interactive mode.[/yellow]")
            return

        # Get input for workflow
        if workflow_type == "test":
            input_data = await get_test_automation_input()
        elif workflow_type == "infra":
            input_data = await get_infrastructure_input()
        elif workflow_type == "cicd":
            input_data = await get_cicd_input()
        elif workflow_type == "unified":
            input_data = await get_unified_input()
        else:
            console.print("[red]Invalid workflow type[/red]")
            return

        # Start workflow
        handle = await start_workflow(workflow_type, input_data, selected_model)

        if handle:
            await follow_up_menu()

    elif args.command == "execute":
        # Execute generated code
        if args.target == "tests":
            await cmd_run_tests(args.dir)
        elif args.target == "terraform":
            await cmd_apply_infrastructure(args.dir)
        elif args.target == "pipeline":
            console.print("[yellow]Pipeline execution coming soon[/yellow]")

    elif args.command == "list":
        # List workflows
        await cmd_list_workflows()

    elif args.command == "deliverables":
        # View deliverables
        await cmd_view_deliverables(args.dir)

    else:
        # No command - interactive mode
        try:
            await interactive_session()
            console.print("\n[bold green]👋 Thank you for using ROUGE![/bold green]")
            console.print("[dim]Your automated projects are ready for deployment.[/dim]\n")
            usage_tracker.display_summary()
        except KeyboardInterrupt:
            console.print("\n[yellow]Session interrupted.[/yellow]")
            sys.exit(0)


def main():
    try:
        asyncio.run(async_main())
    except KeyboardInterrupt:
        console.print("\n[yellow]Goodbye![/yellow]")
        sys.exit(0)


if __name__ == "__main__":
    main()
