import urllib.request
import zipfile
from pathlib import Path

from rich.console import Console

console = Console()

TEMPORAL_VERSION = "1.6.1"
TEMPORAL_DIR = Path("temporal_cli")
TEMPORAL_EXE = TEMPORAL_DIR / "temporal.exe"
TEMPORAL_ZIP = Path("temporal_cli.zip")
DOWNLOAD_URL = f"https://github.com/temporalio/cli/releases/download/v{TEMPORAL_VERSION}/temporal_cli_{TEMPORAL_VERSION}_windows_amd64.zip"


def ensure_temporal_cli():
    """Ensure the Temporal CLI is present in the project directory."""
    if TEMPORAL_EXE.exists():
        return

    console.print(f"[bold cyan]📦 Temporal CLI missing. Setting up version {TEMPORAL_VERSION}...[/bold cyan]")

    try:
        # 1. Download
        if not TEMPORAL_ZIP.exists():
            console.print(f"  [blue]Downloading from {DOWNLOAD_URL}...[/blue]")
            urllib.request.urlretrieve(DOWNLOAD_URL, TEMPORAL_ZIP)
            console.print("  [green]Download complete.[/green]")

        # 2. Extract
        console.print(f"  [blue]Extracting to {TEMPORAL_DIR}...[/blue]")
        TEMPORAL_DIR.mkdir(exist_ok=True)
        with zipfile.ZipFile(TEMPORAL_ZIP, 'r') as zip_ref:
            zip_ref.extractall(TEMPORAL_DIR)

        console.print("  [green]Extraction complete.[/green]")

        # 3. Cleanup zip
        if TEMPORAL_ZIP.exists():
            TEMPORAL_ZIP.unlink()
            console.print("  [dim]Cleaned up zip file.[/dim]")

        console.print("[bold green]✅ Temporal CLI is ready![/bold green]\n")

    except Exception as e:
        console.print(f"[bold red]❌ Failed to set up Temporal CLI: {e}[/bold red]")
        console.print("[yellow]Please download it manually from https://github.com/temporalio/cli/releases[/yellow]")
        # We don't exit here to allow the app to try connecting if it's already running elsewhere
