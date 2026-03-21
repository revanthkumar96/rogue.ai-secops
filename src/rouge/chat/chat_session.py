"""
Chat session management for ROUGE.

Manages conversation state, history, and interaction flow.
"""

from datetime import datetime
from pathlib import Path
from typing import List, Optional

from rich.console import Console

from ..services.llm_provider import LLMProvider
from .command_parser import CommandParser
from .token_tracker import TokenTracker


class ChatSession:
    """Manage a chat session with conversation history and context."""

    def __init__(
        self,
        provider: LLMProvider,
        console: Console,
        history_dir: Optional[Path] = None,
    ):
        """
        Initialize chat session.

        Args:
            provider: LLM provider instance
            console: Rich console for output
            history_dir: Directory to save chat history (optional)
        """
        self.provider = provider
        self.console = console
        self.history_dir = history_dir or Path.home() / ".rouge" / "history"
        self.history_dir.mkdir(parents=True, exist_ok=True)

        self.command_parser = CommandParser()
        self.token_tracker = TokenTracker()

        self.conversation_history: List[dict] = []
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.max_context_tokens = self._get_max_context()

    def _get_max_context(self) -> int:
        """
        Get maximum context window size for current model.

        Returns:
            Maximum context tokens
        """
        model = self.provider.model.lower()

        # Context window sizes for common models
        context_sizes = {
            "mixtral-8x7b-32768": 32768,
            "llama3-70b-8192": 8192,
            "llama3-8b-8192": 8192,
            "llama-3.1-8b-instant": 8192,
            "llama-3.1-70b-versatile": 8192,
            "gemma-7b-it": 8192,
        }

        # Check for exact match or partial match
        for model_name, context_size in context_sizes.items():
            if model_name in model:
                return context_size

        # Default to 8K for Ollama models
        return 8192

    def add_message(self, role: str, content: str):
        """
        Add message to conversation history.

        Args:
            role: Message role (user/assistant/system)
            content: Message content
        """
        self.conversation_history.append(
            {
                "role": role,
                "content": content,
                "timestamp": datetime.now().isoformat(),
            }
        )

    async def process_query(self, query: str) -> str:
        """
        Process natural language query.

        Args:
            query: User's natural language query

        Returns:
            Assistant response
        """
        # Add user message to history
        self.add_message("user", query)

        # Prepare messages for LLM
        messages = [{"role": msg["role"], "content": msg["content"]} for msg in self.conversation_history]

        # Call LLM
        response = await self.provider.chat(messages=messages)

        # Extract response content and usage
        content = response.get("content", "")
        usage = response.get("usage", {})

        # Track tokens
        self.token_tracker.add_message_tokens(
            input_tokens=usage.get("prompt_tokens", 0),
            output_tokens=usage.get("completion_tokens", 0),
            model=self.provider.model,
            provider=response.get("provider", "unknown"),
        )

        # Add assistant response to history
        self.add_message("assistant", content)

        return content

    def get_context_summary(self) -> dict:
        """
        Get summary of current context usage.

        Returns:
            Dictionary with context statistics
        """
        total_tokens = self.token_tracker.stats.total_tokens
        context_pct = (total_tokens / self.max_context_tokens) * 100

        return {
            "total_tokens": total_tokens,
            "max_tokens": self.max_context_tokens,
            "context_percentage": context_pct,
            "needs_summarization": context_pct > 80,
        }

    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history.clear()
        self.token_tracker.reset()
        self.console.print("[yellow]Conversation history cleared.[/yellow]")

    async def save_history(self):
        """Save conversation history to file."""
        filename = f"chat_{self.session_id}.md"
        filepath = self.history_dir / filename

        with open(filepath, "w", encoding="utf-8") as f:
            f.write("# ROUGE Chat Session\n\n")
            f.write(f"**Session ID**: {self.session_id}\n")
            f.write(f"**Provider**: {self.provider.model}\n")
            f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("---\n\n")

            for msg in self.conversation_history:
                role = msg["role"].capitalize()
                content = msg["content"]
                timestamp = msg.get("timestamp", "")

                f.write(f"## {role}\n")
                if timestamp:
                    f.write(f"*{timestamp}*\n\n")
                f.write(f"{content}\n\n")
                f.write("---\n\n")

            # Add session stats
            stats = self.token_tracker.get_session_summary()
            f.write("## Session Statistics\n\n")
            f.write(f"- Total Messages: {stats['message_count']}\n")
            f.write(f"- Total Tokens: {stats['total_tokens']:,}\n")
            f.write(f"- Input Tokens: {stats['total_input_tokens']:,}\n")
            f.write(f"- Output Tokens: {stats['total_output_tokens']:,}\n")
            if stats["total_cost_usd"] > 0:
                f.write(f"- Total Cost: ${stats['total_cost_usd']:.4f}\n")
            f.write(f"- Duration: {stats['duration']}\n")

        self.console.print(f"[green]Chat history saved to: {filepath}[/green]")

    def get_stats_summary(self) -> dict:
        """
        Get detailed session statistics.

        Returns:
            Dictionary with session statistics
        """
        return self.token_tracker.get_session_summary()
