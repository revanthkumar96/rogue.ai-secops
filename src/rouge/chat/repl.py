"""
Interactive REPL for ROUGE chat mode.

Provides a command-line interface for natural language interaction.
"""

from pathlib import Path

import questionary
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel

from ..config.manager import ConfigManager
from ..services.llm_provider import LLMProvider, create_provider
from ..skills.executor import SkillExecutor
from ..skills.loader import SkillLoader
from ..ui.live_display import LiveChatDisplay
from .chat_session import ChatSession
from .command_parser import CommandParser, CommandType
from .router import QueryIntent, QueryRouter


class ChatREPL:
    """Interactive Read-Eval-Print Loop for chat mode."""

    def __init__(self, config_manager: ConfigManager, console: Console):
        """
        Initialize chat REPL.

        Args:
            config_manager: Configuration manager
            console: Rich console
        """
        self.config_manager = config_manager
        self.console = console

        # Initialize components
        llm_config = config_manager.get_llm_config()
        self.provider = self._create_provider(llm_config)

        self.chat_session = ChatSession(
            provider=self.provider,
            console=console,
            history_dir=Path(config_manager.get_paths_config().history_dir).expanduser(),
        )

        self.command_parser = CommandParser()
        self.query_router = QueryRouter(provider=self.provider)

        # Skills
        skills_dir = Path(config_manager.get_paths_config().skills_dir).expanduser()
        self.skill_loader = SkillLoader(skills_dir=skills_dir)
        self.skill_executor = SkillExecutor(skill_loader=self.skill_loader, provider=self.provider)

        # UI
        self.display = LiveChatDisplay(
            console=console,
            provider=llm_config.provider,
            model=llm_config.model,
            token_tracker=self.chat_session.token_tracker,
            max_context=self.chat_session.max_context_tokens,
        )

    def _create_provider(self, llm_config) -> LLMProvider:
        """
        Create LLM provider from config.

        Args:
            llm_config: LLM configuration

        Returns:
            LLM provider instance
        """
        if llm_config.provider == "groq":
            api_key = self.config_manager.get_groq_api_key_from_env()
            if not api_key:
                raise ValueError("Groq API key not found in environment or config")

            return create_provider(
                provider_type="groq",
                model=llm_config.model,
                groq_api_key=api_key,
            )
        else:
            return create_provider(
                provider_type="ollama",
                model=llm_config.model,
                ollama_base_url=llm_config.ollama_url,
            )

    async def run(self):
        """Run the interactive chat REPL."""
        # Show welcome
        self.display.show_welcome()

        # Main loop
        while True:
            try:
                # Get user input
                user_input = await questionary.text(
                    "",
                    qmark="›",
                    style=questionary.Style([("qmark", "fg:cyan bold")]),
                ).ask_async()

                if not user_input or user_input.strip() == "":
                    continue

                # Parse input
                parsed = self.command_parser.parse(user_input)

                # Handle command or query
                if parsed.command_type == CommandType.EXIT or parsed.command_type == CommandType.QUIT:
                    await self._handle_exit()
                    break
                elif parsed.command_type == CommandType.QUERY:
                    await self._handle_query(parsed.raw_input)
                else:
                    await self._handle_command(parsed)

            except KeyboardInterrupt:
                self.console.print("\n[yellow]Use /exit or /quit to exit[/yellow]")
                continue
            except Exception as e:
                self.console.print(f"\n[red]Error: {e}[/red]")
                continue

    async def _handle_query(self, query: str):
        """
        Handle natural language query.

        Args:
            query: User query
        """
        # Show user message
        self.display.add_message("user", query)

        # Check for skill trigger
        skill = self.skill_loader.find_skill_by_trigger(query)
        if skill:
            self.console.print(f"\n[cyan]🎯 Detected skill: {skill.name}[/cyan]")
            response = await self.skill_executor.execute_skill(skill, query)
        else:
            # Route query
            intent = self.query_router.route_query(query)

            if intent == QueryIntent.GENERAL_QUESTION:
                # General Q&A
                response = await self.chat_session.process_query(query)
            else:
                # Workflow-related query
                response = await self._handle_workflow_query(query, intent)

        # Show assistant response
        self.display.add_message("assistant", response)
        self.console.print()
        self.console.print(Markdown(response))
        self.console.print()

        # Show token stats
        self._show_token_update()

    async def _handle_workflow_query(self, query: str, intent: QueryIntent) -> str:
        """
        Handle workflow-related query.

        Args:
            query: User query
            intent: Detected intent

        Returns:
            Response string
        """
        # For now, provide guidance on how to run workflows
        # In future, can integrate with workflow execution

        workflow_map = {
            QueryIntent.TEST_AUTOMATION: "test automation",
            QueryIntent.INFRASTRUCTURE: "infrastructure provisioning",
            QueryIntent.CICD_PIPELINE: "CI/CD pipeline",
            QueryIntent.UNIFIED_DEVOPS: "unified DevOps",
        }

        workflow_name = workflow_map.get(intent, "automation")

        response = f"""I can help you with {workflow_name}!

To run this workflow interactively, you can:

1. Exit chat mode with `/exit`
2. Run the workflow command from the main menu

Or, I can guide you through the setup here. What would you like to know?"""

        return response

    async def _handle_command(self, parsed):
        """
        Handle special command.

        Args:
            parsed: ParsedCommand instance
        """
        cmd_type = parsed.command_type

        if cmd_type == CommandType.HELP:
            self._show_help()
        elif cmd_type == CommandType.HELP_CONTEXT:
            self._show_contextual_help(parsed.args)
        elif cmd_type == CommandType.CLEAR:
            self.chat_session.clear_history()
            self.display.messages.clear()
        elif cmd_type == CommandType.STATS:
            self._show_stats()
        elif cmd_type == CommandType.CONFIG:
            self._show_config()
        elif cmd_type == CommandType.SKILL:
            await self._handle_skill_command(parsed.args)
        elif cmd_type == CommandType.HISTORY:
            self._show_history()
        elif cmd_type == CommandType.EXPORT:
            await self._export_chat()
        elif cmd_type == CommandType.RESET:
            await self._reset_session()
        else:
            self.console.print(f"[yellow]Unknown command: {parsed.command}[/yellow]")

    def _show_help(self):
        """Show help message."""
        help_dict = self.command_parser.get_command_help()

        help_text = "**Available Commands:**\n\n"
        for cmd, desc in help_dict.items():
            help_text += f"- `{cmd}` - {desc}\n"

        self.console.print()
        self.console.print(Panel(Markdown(help_text), title="Help", border_style="cyan"))
        self.console.print()

    def _show_contextual_help(self, args: list):
        """Show contextual help."""
        if not args:
            self._show_help()
            return

        topic = " ".join(args)
        self.console.print(f"\n[cyan]Help for: {topic}[/cyan]\n")
        self.console.print("[dim]Contextual help system coming soon![/dim]\n")

    def _show_stats(self):
        """Show detailed statistics."""
        self.console.print()
        table = self.display.render_stats_table()
        self.console.print(table)
        self.console.print()

    def _show_token_update(self):
        """Show token usage update."""
        stats = self.chat_session.token_tracker.get_session_summary()
        context_pct = self.chat_session.token_tracker.get_context_usage(
            self.chat_session.max_context_tokens
        ) * 100

        # Compact token update
        self.console.print(
            f"[dim]Tokens: {stats['total_tokens']:,} | Context: {context_pct:.1f}%[/dim]"
        )

    def _show_config(self):
        """Show current configuration."""
        llm_config = self.config_manager.get_llm_config()

        config_text = f"""**Current Configuration:**

- **Provider**: {llm_config.provider}
- **Model**: {llm_config.model}
- **Config File**: `{self.config_manager.config_path}`

Use `rouge --reset-config` to reconfigure."""

        self.console.print()
        self.console.print(Panel(Markdown(config_text), title="Configuration", border_style="cyan"))
        self.console.print()

    async def _handle_skill_command(self, args: list):
        """Handle skill command."""
        if not args:
            # List skills
            self._list_skills()
            return

        subcommand = args[0]

        if subcommand == "list":
            self._list_skills()
        elif subcommand == "add" and len(args) > 1:
            await self._add_skill(args[1])
        elif subcommand == "remove" and len(args) > 1:
            self._remove_skill(args[1])
        else:
            # Invoke skill by name
            skill_name = subcommand
            await self._invoke_skill(skill_name)

    def _list_skills(self):
        """List available skills."""
        skills = self.skill_loader.list_skills()

        if not skills:
            self.console.print("\n[yellow]No custom skills found.[/yellow]")
            self.console.print(f"[dim]Add skills to: {self.skill_loader.skills_dir}[/dim]\n")
            return

        self.console.print(f"\n[bold cyan]Available Skills ({len(skills)}):[/bold cyan]\n")

        for skill in skills:
            self.console.print(f"• [bold]{skill.name}[/bold]")
            self.console.print(f"  {skill.description}")
            self.console.print(f"  [dim]Triggers: {', '.join(skill.triggers)}[/dim]\n")

    async def _add_skill(self, skill_path: str):
        """Add skill from file."""
        try:
            path = Path(skill_path).expanduser()
            skill = self.skill_loader.add_skill(path)
            self.console.print(f"\n[green]✓ Added skill: {skill.name}[/green]\n")
        except Exception as e:
            self.console.print(f"\n[red]Failed to add skill: {e}[/red]\n")

    def _remove_skill(self, skill_name: str):
        """Remove skill."""
        if self.skill_loader.remove_skill(skill_name):
            self.console.print(f"\n[green]✓ Removed skill: {skill_name}[/green]\n")
        else:
            self.console.print(f"\n[yellow]Skill not found: {skill_name}[/yellow]\n")

    async def _invoke_skill(self, skill_name: str):
        """Invoke skill by name."""
        skill = self.skill_loader.find_skill_by_name(skill_name)

        if not skill:
            self.console.print(f"\n[red]Skill not found: {skill_name}[/red]\n")
            return

        # Get user query for skill
        query = await questionary.text(f"Query for {skill_name}:").ask_async()

        if not query:
            return

        self.console.print(f"\n[cyan]Executing skill: {skill.name}...[/cyan]\n")

        response = await self.skill_executor.execute_skill(skill, query)

        self.console.print(Markdown(response))
        self.console.print()

    def _show_history(self):
        """Show conversation history."""
        if not self.chat_session.conversation_history:
            self.console.print("\n[yellow]No conversation history yet.[/yellow]\n")
            return

        self.console.print("\n[bold cyan]Conversation History:[/bold cyan]\n")

        for msg in self.chat_session.conversation_history:
            role = msg["role"].capitalize()
            content = msg["content"]
            timestamp = msg.get("timestamp", "")

            self.console.print(f"**{role}** [dim]({timestamp})[/dim]")
            self.console.print(content[:200] + "..." if len(content) > 200 else content)
            self.console.print()

    async def _export_chat(self):
        """Export chat to markdown."""
        await self.chat_session.save_history()

    async def _reset_session(self):
        """Reset session."""
        confirm = await questionary.confirm("Reset session and clear all history?", default=False).ask_async()

        if confirm:
            self.chat_session.clear_history()
            self.display.messages.clear()
            self.console.print("\n[green]✓ Session reset[/green]\n")

    async def _handle_exit(self):
        """Handle exit command."""
        # Auto-save if enabled
        ui_config = self.config_manager.get_ui_config()
        if ui_config.auto_save_chat and self.chat_session.conversation_history:
            await self.chat_session.save_history()

        # Show final stats
        self.console.print()
        self._show_stats()

        self.console.print("[bold cyan]Thanks for using ROUGE! Goodbye![/bold cyan]\n")
