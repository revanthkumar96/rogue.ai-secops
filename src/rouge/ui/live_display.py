"""
Live display UI for chat mode.

Provides real-time token tracking and conversation display using Rich.
"""

from datetime import datetime
from typing import Dict, List

from rich.console import Console, Group
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from ..chat.token_tracker import TokenTracker


class LiveChatDisplay:
    """Live display for chat mode with token tracking."""

    def __init__(
        self,
        console: Console,
        provider: str,
        model: str,
        token_tracker: TokenTracker,
        max_context: int = 32768,
    ):
        """
        Initialize live chat display.

        Args:
            console: Rich console instance
            provider: LLM provider name
            model: Model name
            token_tracker: Token tracker instance
            max_context: Maximum context window size
        """
        self.console = console
        self.provider = provider
        self.model = model
        self.token_tracker = token_tracker
        self.max_context = max_context
        self.messages: List[Dict[str, str]] = []

    def add_message(self, role: str, content: str):
        """
        Add a message to the display.

        Args:
            role: Message role (user/assistant)
            content: Message content
        """
        self.messages.append(
            {
                "role": role,
                "content": content,
                "timestamp": datetime.now().isoformat(),
            }
        )

    def create_header_panel(self) -> Panel:
        """
        Create header panel with session info.

        Returns:
            Rich Panel with session information
        """
        stats = self.token_tracker.get_session_summary()
        context_pct = self.token_tracker.get_context_usage(self.max_context) * 100

        # Format cost
        cost_str = f"${stats['total_cost_usd']:.4f}" if stats["total_cost_usd"] > 0 else "Free"

        # Create status line
        status_text = Text()
        status_text.append("🤖 ROUGE Chat Mode", style="bold cyan")
        status_text.append("\n")
        status_text.append("Provider: ", style="dim")
        status_text.append(f"{self.provider}", style="cyan")
        status_text.append(" | Model: ", style="dim")
        status_text.append(f"{self.model}", style="cyan")
        status_text.append("\n")
        status_text.append("Tokens: ", style="dim")
        status_text.append(f"{stats['total_input_tokens']:,}", style="green")
        status_text.append(" input | ", style="dim")
        status_text.append(f"{stats['total_output_tokens']:,}", style="yellow")
        status_text.append(" output | ", style="dim")
        status_text.append(f"{stats['total_tokens']:,}", style="bold")
        status_text.append(" total", style="dim")
        status_text.append("\n")
        status_text.append("Cost: ", style="dim")
        status_text.append(f"{cost_str}", style="green" if stats["total_cost_usd"] == 0 else "yellow")
        status_text.append(" (session) | Context: ", style="dim")

        # Color context usage based on percentage
        if context_pct < 50:
            context_color = "green"
        elif context_pct < 80:
            context_color = "yellow"
        else:
            context_color = "red"

        status_text.append(f"{context_pct:.1f}%", style=f"bold {context_color}")
        status_text.append(" used", style="dim")

        return Panel(status_text, border_style="cyan", padding=(0, 1))

    def create_messages_display(self, max_messages: int = 10) -> Group:
        """
        Create messages display.

        Args:
            max_messages: Maximum number of recent messages to show

        Returns:
            Rich Group with message displays
        """
        displays = []

        # Show last N messages
        recent_messages = self.messages[-max_messages:] if len(self.messages) > max_messages else self.messages

        for msg in recent_messages:
            role = msg["role"]
            content = msg["content"]

            # Format role
            if role == "user":
                role_text = Text("You: ", style="bold blue")
            else:
                role_text = Text("ROUGE: ", style="bold cyan")

            # Create message text
            msg_text = Text()
            msg_text.append(role_text)
            msg_text.append(content, style="white")

            displays.append(msg_text)
            displays.append(Text())  # Empty line

        return Group(*displays)

    def create_full_display(self) -> Panel:
        """
        Create full display with header and messages.

        Returns:
            Rich Panel with complete display
        """
        header = self.create_header_panel()
        messages = self.create_messages_display()

        full_display = Group(header, Text(), messages)

        return Panel(
            full_display,
            title="[bold]ROUGE Interactive Chat[/bold]",
            border_style="cyan",
            padding=(1, 2),
        )

    def render_stats_table(self) -> Table:
        """
        Render detailed statistics table.

        Returns:
            Rich Table with statistics
        """
        stats = self.token_tracker.get_session_summary()

        table = Table(title="📊 Session Statistics", border_style="cyan", show_header=False)
        table.add_column("Metric", style="bold cyan", width=25)
        table.add_column("Value", style="white")

        table.add_row("Provider", self.provider)
        table.add_row("Model", self.model)
        table.add_row("", "")
        table.add_row("Total Messages", str(stats["message_count"]))
        table.add_row("Input Tokens", f"{stats['total_input_tokens']:,}")
        table.add_row("Output Tokens", f"{stats['total_output_tokens']:,}")
        table.add_row("Total Tokens", f"{stats['total_tokens']:,}")
        table.add_row("", "")
        table.add_row("Avg Tokens/Message", f"{stats['avg_tokens_per_message']:.1f}")
        table.add_row("Session Duration", stats["duration"])

        if stats["total_cost_usd"] > 0:
            table.add_row("Total Cost", f"${stats['total_cost_usd']:.4f}")

        context_pct = self.token_tracker.get_context_usage(self.max_context) * 100
        table.add_row("Context Used", f"{context_pct:.1f}%")

        return table

    def show_welcome(self):
        """Show welcome message."""
        welcome_text = Text()
        welcome_text.append("Welcome to ", style="white")
        welcome_text.append("ROUGE Chat Mode", style="bold cyan")
        welcome_text.append("!", style="white")
        welcome_text.append("\n\n")
        welcome_text.append("Type your questions in natural language, or use commands:\n", style="dim")
        welcome_text.append("  /help", style="cyan")
        welcome_text.append(" - Show available commands\n", style="dim")
        welcome_text.append("  ?", style="cyan")
        welcome_text.append(" - Get contextual help\n", style="dim")
        welcome_text.append("  /exit", style="cyan")
        welcome_text.append(" - Exit chat mode\n", style="dim")

        self.console.print(Panel(welcome_text, border_style="cyan", padding=(1, 2)))
        self.console.print()
