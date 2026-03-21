"""
Integration test for main entry point.

Tests that the CLI can be imported and basic components work.
"""

from pathlib import Path

import pytest


class TestMainIntegration:
    """Test main entry point integration."""

    def test_imports_succeed(self):
        """Test that all main imports work without errors."""
        # This will fail if there are any import-time errors
        import importlib

        modules = [
            "rouge.main",
            "rouge.chat",
            "rouge.chat.chat_session",
            "rouge.chat.command_parser",
            "rouge.chat.token_tracker",
            "rouge.config",
            "rouge.config.manager",
            "rouge.skills",
            "rouge.skills.loader",
            "rouge.skills.executor",
            "rouge.ui",
            "rouge.ui.live_display",
        ]
        for mod_name in modules:
            mod = importlib.import_module(mod_name)
            assert mod is not None, f"Failed to import {mod_name}"

    def test_banner_prints(self):
        """Test that banner function can be called."""
        from rouge.main import print_banner
        # Should not raise
        print_banner()

    def test_command_parser_integration(self):
        """Test command parser works end-to-end."""
        from rouge.chat.command_parser import CommandParser, CommandType

        parser = CommandParser()

        # Test various commands
        test_cases = [
            ("/help", CommandType.HELP),
            ("/stats", CommandType.STATS),
            ("/exit", CommandType.EXIT),
            ("?", CommandType.HELP_CONTEXT),
            ("How do I test?", CommandType.QUERY),
        ]

        for input_str, expected_type in test_cases:
            result = parser.parse(input_str)
            assert result.command_type == expected_type

    def test_token_tracker_integration(self):
        """Test token tracker integration."""
        from rouge.chat.token_tracker import TokenTracker

        tracker = TokenTracker()

        # Add some messages
        tracker.add_message_tokens(100, 200, "test-model", "ollama")
        tracker.add_message_tokens(150, 250, "test-model", "ollama")

        stats = tracker.get_session_summary()
        assert stats["total_tokens"] == 700
        assert stats["message_count"] == 2

    def test_config_manager_integration(self):
        """Test config manager integration."""
        from rouge.config.manager import ConfigManager

        # Use temp config
        temp_config = Path.home() / ".rouge" / "test_integration_config.yaml"

        try:
            config = ConfigManager(config_path=temp_config)

            # Should create default config
            assert config.config is not None
            assert config.config.llm.provider in ["ollama", "groq"]

            # Should be able to save
            config.save()
            assert temp_config.exists()

        finally:
            if temp_config.exists():
                temp_config.unlink()

    def test_skill_loader_integration(self):
        """Test skill loader integration."""
        import tempfile

        from rouge.skills.loader import SkillLoader

        temp_dir = Path(tempfile.mkdtemp())

        try:
            loader = SkillLoader(skills_dir=temp_dir)

            # Create a test skill
            skill_file = temp_dir / "test.md"
            skill_file.write_text("""---
name: "test-skill"
triggers: ["test"]
description: "Test skill"
---

# Test Skill

Test instructions.
""", encoding="utf-8")

            # Reload
            loader.reload_skills()

            # Should find the skill
            skill = loader.find_skill_by_name("test-skill")
            assert skill is not None
            assert skill.name == "test-skill"

        finally:
            # Cleanup
            for f in temp_dir.glob("*.md"):
                f.unlink()
            temp_dir.rmdir()

    def test_llm_provider_creation(self):
        """Test LLM provider can be created."""
        from rouge.services.llm_provider import OllamaProvider, create_provider

        # Should create Ollama provider
        provider = create_provider("ollama", "test-model")
        assert isinstance(provider, OllamaProvider)
        assert provider.model == "test-model"

    def test_groq_provider_creation(self):
        """Test Groq provider creation."""
        from rouge.services.llm_provider import GroqProvider, create_provider

        # Should create Groq provider
        provider = create_provider("groq", "mixtral-8x7b-32768", groq_api_key="test-key")
        assert isinstance(provider, GroqProvider)
        assert provider.model == "mixtral-8x7b-32768"

    def test_missing_groq_api_key_raises(self):
        """Test that creating Groq provider without API key raises."""
        from rouge.services.llm_provider import create_provider

        with pytest.raises(ValueError, match="Groq API key is required"):
            create_provider("groq", "test-model")

    def test_unknown_provider_raises(self):
        """Test that unknown provider type raises."""
        from rouge.services.llm_provider import create_provider

        with pytest.raises(ValueError, match="Unknown provider type"):
            create_provider("unknown-provider", "test-model")
