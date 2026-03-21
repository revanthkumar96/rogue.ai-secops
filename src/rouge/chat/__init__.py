"""
Chat mode infrastructure for ROUGE.

Provides interactive chat sessions with natural language understanding,
command parsing, and live token tracking.
"""

from .chat_session import ChatSession
from .command_parser import CommandParser, CommandType
from .repl import ChatREPL
from .router import QueryIntent, QueryRouter
from .token_tracker import TokenTracker

__all__ = [
    "ChatSession",
    "CommandParser",
    "CommandType",
    "TokenTracker",
    "QueryRouter",
    "QueryIntent",
    "ChatREPL",
]
