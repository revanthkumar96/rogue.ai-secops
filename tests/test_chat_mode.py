"""
Unit tests for chat mode functionality.

Tests command parsing, token tracking, and configuration management.
"""

from pathlib import Path

import pytest

from rouge.chat.command_parser import CommandParser, CommandType
from rouge.chat.token_tracker import TokenTracker
from rouge.config.manager import ConfigManager


class TestCommandParser:
    """Test command parser functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.parser = CommandParser()

    def test_parse_help_command(self):
        """Test parsing /help command."""
        result = self.parser.parse("/help")
        assert result.command_type == CommandType.HELP
        assert result.command == "help"
        assert result.args == []

    def test_parse_stats_command(self):
        """Test parsing /stats command."""
        result = self.parser.parse("/stats")
        assert result.command_type == CommandType.STATS
        assert result.command == "stats"

    def test_parse_skill_command_with_args(self):
        """Test parsing /skill with arguments."""
        result = self.parser.parse("/skill list")
        assert result.command_type == CommandType.SKILL
        assert result.command == "skill"
        assert result.args == ["list"]

    def test_parse_skill_add_command(self):
        """Test parsing /skill add with path."""
        result = self.parser.parse("/skill add /path/to/skill.md")
        assert result.command_type == CommandType.SKILL
        assert result.args == ["add", "/path/to/skill.md"]

    def test_parse_exit_command(self):
        """Test parsing /exit command."""
        result = self.parser.parse("/exit")
        assert result.command_type == CommandType.EXIT

    def test_parse_quit_command(self):
        """Test parsing /quit command."""
        result = self.parser.parse("/quit")
        assert result.command_type == CommandType.QUIT

    def test_parse_help_context(self):
        """Test parsing ? for contextual help."""
        result = self.parser.parse("?")
        assert result.command_type == CommandType.HELP_CONTEXT
        assert result.args == []

    def test_parse_help_context_with_topic(self):
        """Test parsing ? with topic."""
        result = self.parser.parse("? skills")
        assert result.command_type == CommandType.HELP_CONTEXT
        assert result.args == ["skills"]

    def test_parse_natural_language_query(self):
        """Test parsing natural language as query."""
        result = self.parser.parse("How do I add tests?")
        assert result.command_type == CommandType.QUERY
        assert result.raw_input == "How do I add tests?"

    def test_parse_empty_input(self):
        """Test parsing empty input."""
        result = self.parser.parse("")
        assert result.command_type == CommandType.QUERY

    def test_parse_unknown_command(self):
        """Test parsing unknown command treats as query."""
        result = self.parser.parse("/unknown-cmd")
        assert result.command_type == CommandType.QUERY

    def test_get_command_help(self):
        """Test getting command help documentation."""
        help_dict = CommandParser.get_command_help()
        assert "/help" in help_dict
        assert "/stats" in help_dict
        assert "/exit or /quit" in help_dict
        assert "?" in help_dict


class TestTokenTracker:
    """Test token tracking functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.tracker = TokenTracker()

    def test_initial_stats(self):
        """Test initial statistics are zero."""
        stats = self.tracker.get_session_summary()
        assert stats["total_tokens"] == 0
        assert stats["total_input_tokens"] == 0
        assert stats["total_output_tokens"] == 0
        assert stats["message_count"] == 0

    def test_add_message_tokens_ollama(self):
        """Test adding message tokens for Ollama (free)."""
        msg = self.tracker.add_message_tokens(
            input_tokens=100,
            output_tokens=200,
            model="llama3.1:8b",
            provider="ollama",
        )

        assert msg.input_tokens == 100
        assert msg.output_tokens == 200
        assert msg.total_tokens == 300
        assert msg.cost_usd == 0.0  # Ollama is free

    def test_add_message_tokens_groq(self):
        """Test adding message tokens for Groq (paid)."""
        msg = self.tracker.add_message_tokens(
            input_tokens=100,
            output_tokens=200,
            model="mixtral-8x7b-32768",
            provider="groq",
        )

        assert msg.input_tokens == 100
        assert msg.output_tokens == 200
        assert msg.total_tokens == 300
        assert msg.cost_usd > 0  # Groq has cost

    def test_session_stats_accumulation(self):
        """Test session statistics accumulate correctly."""
        self.tracker.add_message_tokens(100, 200, "model", "ollama")
        self.tracker.add_message_tokens(150, 250, "model", "ollama")

        stats = self.tracker.get_session_summary()
        assert stats["total_input_tokens"] == 250
        assert stats["total_output_tokens"] == 450
        assert stats["total_tokens"] == 700
        assert stats["message_count"] == 2

    def test_context_usage(self):
        """Test context usage calculation."""
        self.tracker.add_message_tokens(1000, 2000, "model", "ollama")

        # 3000 tokens with max 8192 context
        usage = self.tracker.get_context_usage(8192)
        assert 0.35 < usage < 0.40  # Approximately 36.6%

    def test_context_usage_exceeds_max(self):
        """Test context usage caps at 100%."""
        self.tracker.add_message_tokens(10000, 5000, "model", "ollama")

        usage = self.tracker.get_context_usage(8192)
        assert usage == 1.0  # Capped at 100%

    def test_reset(self):
        """Test resetting statistics."""
        self.tracker.add_message_tokens(100, 200, "model", "ollama")
        self.tracker.reset()

        stats = self.tracker.get_session_summary()
        assert stats["total_tokens"] == 0
        assert stats["message_count"] == 0

    def test_groq_pricing_calculation(self):
        """Test Groq pricing calculation for different models."""
        # Test llama3-8b-8192 (cheapest)
        msg1 = self.tracker.add_message_tokens(
            1_000_000, 1_000_000, "llama3-8b-8192", "groq"
        )
        assert msg1.cost_usd == pytest.approx(0.13, rel=0.01)  # $0.05 + $0.08

        # Reset for next test
        self.tracker.reset()

        # Test llama3-70b-8192 (expensive)
        msg2 = self.tracker.add_message_tokens(
            1_000_000, 1_000_000, "llama3-70b-8192", "groq"
        )
        assert msg2.cost_usd == pytest.approx(1.38, rel=0.01)  # $0.59 + $0.79


class TestConfigManager:
    """Test configuration manager."""

    def setup_method(self):
        """Set up test fixtures."""
        # Use temporary config path for testing
        self.test_config_path = Path.home() / ".rouge" / "test_config.yaml"
        self.config_manager = ConfigManager(config_path=self.test_config_path)

    def teardown_method(self):
        """Clean up test config file."""
        if self.test_config_path.exists():
            self.test_config_path.unlink()

    def test_default_config_creation(self):
        """Test default configuration is created."""
        assert self.config_manager.config is not None
        assert self.config_manager.config.llm.provider in ["ollama", "groq"]

    def test_save_and_load_config(self):
        """Test saving and loading configuration."""
        self.config_manager.config.llm.provider = "groq"
        self.config_manager.config.llm.model = "mixtral-8x7b-32768"
        self.config_manager.save()

        # Reload
        new_manager = ConfigManager(config_path=self.test_config_path)
        assert new_manager.config.llm.provider == "groq"
        assert new_manager.config.llm.model == "mixtral-8x7b-32768"

    def test_update_llm_config(self):
        """Test updating LLM configuration."""
        self.config_manager.update_llm_config(
            provider="groq",
            model="llama3-70b-8192",
        )

        assert self.config_manager.config.llm.provider == "groq"
        assert self.config_manager.config.llm.model == "llama3-70b-8192"

    def test_get_llm_config(self):
        """Test getting LLM configuration."""
        llm_config = self.config_manager.get_llm_config()
        assert llm_config.provider is not None
        assert llm_config.model is not None

    def test_get_ui_config(self):
        """Test getting UI configuration."""
        ui_config = self.config_manager.get_ui_config()
        assert isinstance(ui_config.live_tokens, bool)
        assert isinstance(ui_config.auto_save_chat, bool)

    def test_get_paths_config(self):
        """Test getting paths configuration."""
        paths_config = self.config_manager.get_paths_config()
        assert paths_config.skills_dir is not None
        assert paths_config.cache_dir is not None
        assert paths_config.history_dir is not None

    def test_reset_to_defaults(self):
        """Test resetting configuration to defaults."""
        self.config_manager.config.llm.provider = "groq"
        self.config_manager.config.llm.model = "custom-model"
        self.config_manager.reset_to_defaults()

        # Should be back to defaults
        assert self.config_manager.config.llm.provider == "ollama"
        assert self.config_manager.config.llm.model == "llama3.1:8b"

    def test_api_key_obfuscation_on_save(self):
        """Test API key is obfuscated when saved."""
        api_key = "gsk_test123456789"
        self.config_manager.config.llm.groq_api_key = api_key
        self.config_manager.save()

        # Read the file directly
        with open(self.test_config_path, "r") as f:
            content = f.read()
            # Should not contain full API key
            assert "gsk_test123456789" not in content
            # Should contain obfuscated version
            assert "***" in content
