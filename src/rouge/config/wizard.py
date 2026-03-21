"""
Interactive configuration wizard for ROUGE.

Guides users through initial setup with questionary prompts.
"""

import os
from pathlib import Path

import questionary
from rich.console import Console
from rich.panel import Panel

from ..utils.file_picker import select_directory_interactive
from .manager import ConfigManager


class ConfigWizard:
    """Interactive configuration wizard."""

    def __init__(self, console: Console):
        """
        Initialize configuration wizard.

        Args:
            console: Rich console for output
        """
        self.console = console
        self.config_manager = ConfigManager()

    async def run(self) -> ConfigManager:
        """
        Run interactive configuration wizard.

        Returns:
            Configured ConfigManager instance
        """
        self.console.print(
            Panel(
                "Welcome to ROUGE Configuration Wizard!\n\n"
                "Let's set up your DevOps automation platform.",
                title="🚀 ROUGE Setup",
                border_style="cyan",
            )
        )
        self.console.print()

        # Step 1: Choose LLM provider
        provider = await self._configure_provider()

        # Step 2: Configure provider-specific settings
        if provider == "ollama":
            await self._configure_ollama()
        elif provider == "groq":
            await self._configure_groq()

        # Step 3: UI preferences
        await self._configure_ui()

        # Step 4: Paths
        await self._configure_paths()

        # Save configuration
        self.config_manager.save()

        self.console.print()
        self.console.print(
            Panel(
                "✅ Configuration complete!\n\n"
                f"Settings saved to: {self.config_manager.config_path}\n\n"
                "You can now use ROUGE in chat mode.",
                title="Setup Complete",
                border_style="green",
            )
        )
        self.console.print()

        return self.config_manager

    async def _configure_provider(self) -> str:
        """
        Configure LLM provider.

        Returns:
            Provider name (ollama/groq)
        """
        self.console.print("[bold cyan]Step 1: Choose LLM Provider[/bold cyan]\n")

        provider = await questionary.select(
            "Select your LLM provider:",
            choices=[
                questionary.Choice("🦙 Ollama (Local, Free, Private)", value="ollama"),
                questionary.Choice("⚡ Groq (Cloud, Fast, API Key Required)", value="groq"),
            ],
            default="ollama",
        ).ask_async()

        self.config_manager.config.llm.provider = provider
        return provider

    async def _configure_ollama(self):
        """Configure Ollama settings."""
        self.console.print("\n[bold cyan]Step 2: Configure Ollama[/bold cyan]\n")

        # Base URL
        base_url = await questionary.text(
            "Ollama base URL:",
            default="http://localhost:11434",
            validate=lambda url: url.startswith("http://") or url.startswith("https://")
            or "Must start with http:// or https://",
        ).ask_async()

        self.config_manager.config.llm.ollama_url = base_url

        # Try to fetch available models
        try:
            import ollama

            client = ollama.Client(host=base_url)
            models_response = client.list()
            available_models = [m.model for m in models_response.models]

            if available_models:
                self.console.print(f"[green]Found {len(available_models)} model(s) on this machine[/green]")
                model = await questionary.select(
                    "Select default model:", choices=available_models, default=available_models[0]
                ).ask_async()
            else:
                self.console.print("[yellow]No models found. Pull a model first: ollama pull llama3.1:8b[/yellow]")
                model = await questionary.text("Enter model name:", default="llama3.1:8b").ask_async()
        except Exception as e:
            self.console.print(f"[yellow]Could not connect to Ollama: {e}[/yellow]")
            model = await questionary.text("Enter model name:", default="llama3.1:8b").ask_async()

        self.config_manager.config.llm.model = model

    async def _configure_groq(self):
        """Configure Groq settings."""
        self.console.print("\n[bold cyan]Step 2: Configure Groq[/bold cyan]\n")

        # API Key
        api_key = os.environ.get("GROQ_API_KEY")

        if api_key:
            use_env = await questionary.confirm(
                f"Use GROQ_API_KEY from environment? (ends with ...{api_key[-4:]})", default=True
            ).ask_async()

            if not use_env:
                api_key = await questionary.password(
                    "Enter Groq API key:", validate=lambda k: len(k) > 0 or "API key required"
                ).ask_async()
        else:
            api_key = await questionary.password(
                "Enter Groq API key:", validate=lambda k: len(k) > 0 or "API key required"
            ).ask_async()

        self.config_manager.config.llm.groq_api_key = api_key

        # Model selection
        model = await questionary.select(
            "Select Groq model:",
            choices=[
                questionary.Choice("mixtral-8x7b-32768 (Recommended, 32K context)", value="mixtral-8x7b-32768"),
                questionary.Choice("llama3-70b-8192 (Large, 8K context)", value="llama3-70b-8192"),
                questionary.Choice("llama3-8b-8192 (Fast, 8K context)", value="llama3-8b-8192"),
                questionary.Choice("llama-3.1-8b-instant (Fastest, 8K context)", value="llama-3.1-8b-instant"),
                questionary.Choice(
                    "llama-3.1-70b-versatile (Most capable, 8K context)", value="llama-3.1-70b-versatile"
                ),
            ],
            default="mixtral-8x7b-32768",
        ).ask_async()

        self.config_manager.config.llm.model = model

    async def _configure_ui(self):
        """Configure UI preferences."""
        self.console.print("\n[bold cyan]Step 3: UI Preferences[/bold cyan]\n")

        live_tokens = await questionary.confirm(
            "Show live token tracking during conversations?", default=True
        ).ask_async()

        auto_save = await questionary.confirm("Auto-save chat history?", default=True).ask_async()

        self.config_manager.config.ui.live_tokens = live_tokens
        self.config_manager.config.ui.auto_save_chat = auto_save

    async def _configure_paths(self):
        """Configure default paths."""
        self.console.print("\n[bold cyan]Step 4: Configure Paths[/bold cyan]\n")

        # Default repository path
        default_repo = await select_directory_interactive(
            prompt="📂 Default repository/projects directory:",
            default=str(Path.home() / "projects"),
            instruction="This is where ROUGE will look for projects by default",
        )

        self.config_manager.config.paths.default_repo = default_repo

        # Skills directory
        skills_dir = str(Path.home() / ".rouge" / "skills")
        self.config_manager.config.paths.skills_dir = skills_dir

        # Cache directory
        cache_dir = str(Path.home() / ".rouge" / "cache")
        self.config_manager.config.paths.cache_dir = cache_dir

        # History directory
        history_dir = str(Path.home() / ".rouge" / "history")
        self.config_manager.config.paths.history_dir = history_dir

        # Create directories
        Path(skills_dir).mkdir(parents=True, exist_ok=True)
        Path(cache_dir).mkdir(parents=True, exist_ok=True)
        Path(history_dir).mkdir(parents=True, exist_ok=True)

        self.console.print(
            f"\n[dim]Created directories:\n"
            f"  - Skills: {skills_dir}\n"
            f"  - Cache: {cache_dir}\n"
            f"  - History: {history_dir}[/dim]"
        )
