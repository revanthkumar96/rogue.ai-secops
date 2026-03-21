"""
Token tracking for live usage monitoring.

Tracks token consumption per message and for entire sessions,
with cost estimation support for paid APIs.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional


@dataclass
class MessageTokens:
    """Token usage for a single message."""

    timestamp: datetime
    input_tokens: int
    output_tokens: int
    total_tokens: int
    model: str
    provider: str
    cost_usd: Optional[float] = None


@dataclass
class SessionStats:
    """Session-wide token statistics."""

    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    message_count: int = 0
    session_start: datetime = field(default_factory=datetime.now)
    messages: List[MessageTokens] = field(default_factory=list)


class TokenTracker:
    """Track token usage across a chat session."""

    # Cost per 1M tokens (as of 2024)
    PRICING = {
        "groq": {
            "llama3-8b-8192": {"input": 0.05, "output": 0.08},
            "llama3-70b-8192": {"input": 0.59, "output": 0.79},
            "mixtral-8x7b-32768": {"input": 0.24, "output": 0.24},
            "gemma-7b-it": {"input": 0.07, "output": 0.10},
            "llama-3.1-8b-instant": {"input": 0.05, "output": 0.08},
            "llama-3.1-70b-versatile": {"input": 0.59, "output": 0.79},
        },
        "ollama": {
            # Ollama is free (local), so all costs are 0
            "default": {"input": 0.0, "output": 0.0}
        },
    }

    def __init__(self):
        """Initialize token tracker."""
        self.stats = SessionStats()

    def add_message_tokens(
        self,
        input_tokens: int,
        output_tokens: int,
        model: str,
        provider: str,
    ) -> MessageTokens:
        """
        Add token usage for a message.

        Args:
            input_tokens: Input tokens consumed
            output_tokens: Output tokens generated
            model: Model name
            provider: Provider name (ollama/groq)

        Returns:
            MessageTokens record
        """
        total = input_tokens + output_tokens
        cost = self._calculate_cost(input_tokens, output_tokens, model, provider)

        message = MessageTokens(
            timestamp=datetime.now(),
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total,
            model=model,
            provider=provider,
            cost_usd=cost,
        )

        # Update session stats
        self.stats.total_input_tokens += input_tokens
        self.stats.total_output_tokens += output_tokens
        self.stats.total_tokens += total
        self.stats.total_cost_usd += cost
        self.stats.message_count += 1
        self.stats.messages.append(message)

        return message

    def _calculate_cost(
        self, input_tokens: int, output_tokens: int, model: str, provider: str
    ) -> float:
        """
        Calculate cost in USD for token usage.

        Args:
            input_tokens: Input tokens
            output_tokens: Output tokens
            model: Model name
            provider: Provider name

        Returns:
            Cost in USD
        """
        if provider not in self.PRICING:
            return 0.0

        pricing = self.PRICING[provider]

        # Get model-specific pricing or default
        if model in pricing:
            rates = pricing[model]
        elif "default" in pricing:
            rates = pricing["default"]
        else:
            return 0.0

        # Calculate cost (rates are per 1M tokens)
        input_cost = (input_tokens / 1_000_000) * rates["input"]
        output_cost = (output_tokens / 1_000_000) * rates["output"]

        return input_cost + output_cost

    def get_context_usage(self, max_context: int) -> float:
        """
        Get context window usage percentage.

        Args:
            max_context: Maximum context window size

        Returns:
            Percentage of context used (0.0-1.0)
        """
        return min(self.stats.total_tokens / max_context, 1.0)

    def get_session_summary(self) -> Dict:
        """
        Get session summary statistics.

        Returns:
            Dictionary with session stats
        """
        duration = datetime.now() - self.stats.session_start
        duration_str = f"{int(duration.total_seconds())}s"

        return {
            "total_input_tokens": self.stats.total_input_tokens,
            "total_output_tokens": self.stats.total_output_tokens,
            "total_tokens": self.stats.total_tokens,
            "total_cost_usd": self.stats.total_cost_usd,
            "message_count": self.stats.message_count,
            "duration": duration_str,
            "avg_tokens_per_message": (
                self.stats.total_tokens / self.stats.message_count
                if self.stats.message_count > 0
                else 0
            ),
        }

    def reset(self):
        """Reset session statistics."""
        self.stats = SessionStats()
