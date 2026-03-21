"""
Command parser for chat mode.

Parses special character commands and natural language queries.
"""

import re
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional


class CommandType(Enum):
    """Types of commands in chat mode."""

    # System commands (/)
    HELP = "help"
    CLEAR = "clear"
    STATS = "stats"
    CONFIG = "config"
    SKILL = "skill"
    HISTORY = "history"
    EXPORT = "export"
    RESET = "reset"
    EXIT = "exit"
    QUIT = "quit"

    # Natural language query
    QUERY = "query"

    # Contextual help (?)
    HELP_CONTEXT = "help_context"


@dataclass
class ParsedCommand:
    """Parsed command with arguments."""

    command_type: CommandType
    raw_input: str
    command: Optional[str] = None
    args: List[str] = None
    kwargs: dict = None

    def __post_init__(self):
        if self.args is None:
            self.args = []
        if self.kwargs is None:
            self.kwargs = {}


class CommandParser:
    """Parse user input into commands or queries."""

    # Command patterns
    COMMAND_PATTERN = re.compile(r"^/(\w+)\s*(.*)")
    HELP_PATTERN = re.compile(r"^\?\s*(.*)")

    def __init__(self):
        """Initialize command parser."""
        pass

    def parse(self, user_input: str) -> ParsedCommand:
        """
        Parse user input into command or query.

        Args:
            user_input: Raw user input string

        Returns:
            ParsedCommand object
        """
        user_input = user_input.strip()

        # Check for empty input
        if not user_input:
            return ParsedCommand(
                command_type=CommandType.QUERY,
                raw_input=user_input,
            )

        # Check for / commands
        if user_input.startswith("/"):
            return self._parse_command(user_input)

        # Check for ? help
        if user_input.startswith("?"):
            return self._parse_help(user_input)

        # Natural language query
        return ParsedCommand(
            command_type=CommandType.QUERY,
            raw_input=user_input,
        )

    def _parse_command(self, user_input: str) -> ParsedCommand:
        """
        Parse / command.

        Args:
            user_input: User input starting with /

        Returns:
            ParsedCommand object
        """
        match = self.COMMAND_PATTERN.match(user_input)
        if not match:
            # Malformed command, treat as query
            return ParsedCommand(
                command_type=CommandType.QUERY,
                raw_input=user_input,
            )

        command = match.group(1).lower()
        args_str = match.group(2).strip()

        # Parse arguments
        args = []
        kwargs = {}
        if args_str:
            # Simple space-separated args for now
            # TODO: Support key=value kwargs
            args = args_str.split()

        # Map command string to CommandType
        try:
            command_type = CommandType(command)
        except ValueError:
            # Unknown command, treat as query
            return ParsedCommand(
                command_type=CommandType.QUERY,
                raw_input=user_input,
            )

        return ParsedCommand(
            command_type=command_type,
            raw_input=user_input,
            command=command,
            args=args,
            kwargs=kwargs,
        )

    def _parse_help(self, user_input: str) -> ParsedCommand:
        """
        Parse ? help command.

        Args:
            user_input: User input starting with ?

        Returns:
            ParsedCommand object
        """
        match = self.HELP_PATTERN.match(user_input)
        if not match:
            return ParsedCommand(
                command_type=CommandType.HELP_CONTEXT,
                raw_input=user_input,
                args=[],
            )

        context = match.group(1).strip()
        args = [context] if context else []

        return ParsedCommand(
            command_type=CommandType.HELP_CONTEXT,
            raw_input=user_input,
            args=args,
        )

    @staticmethod
    def get_command_help() -> dict:
        """
        Get help documentation for all commands.

        Returns:
            Dictionary mapping command names to help text
        """
        return {
            "/help": "Show this help message",
            "/clear": "Clear conversation history",
            "/stats": "Show detailed token usage statistics",
            "/config": "View or modify configuration",
            "/skill <name>": "Invoke a specific skill",
            "/history": "Show conversation history",
            "/export": "Export chat to markdown",
            "/reset": "Reset session and clear history",
            "/exit or /quit": "Exit chat mode",
            "?": "Show contextual help",
            "? <topic>": "Get help about a specific topic",
        }
