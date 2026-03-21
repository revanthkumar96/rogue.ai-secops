"""
Configuration manager with persistence support.

Handles loading, saving, and validating ROUGE configuration.
"""

import os
from pathlib import Path
from typing import Optional

import yaml
from pydantic import BaseModel, Field


class LLMConfig(BaseModel):
    """LLM provider configuration."""

    provider: str = Field(default="ollama", description="LLM provider (ollama/groq)")
    model: str = Field(default="llama3.1:8b", description="Model name")
    ollama_url: str = Field(default="http://localhost:11434", description="Ollama base URL")
    groq_api_key: Optional[str] = Field(default=None, description="Groq API key (encrypted in file)")


class UIConfig(BaseModel):
    """UI preferences."""

    theme: str = Field(default="dark", description="UI theme")
    live_tokens: bool = Field(default=True, description="Show live token tracking")
    auto_save_chat: bool = Field(default=True, description="Auto-save chat history")


class PathsConfig(BaseModel):
    """Path configurations."""

    default_repo: str = Field(default="~/projects", description="Default repository path")
    skills_dir: str = Field(default="~/.rouge/skills", description="Custom skills directory")
    cache_dir: str = Field(default="~/.rouge/cache", description="Cache directory")
    history_dir: str = Field(default="~/.rouge/history", description="Chat history directory")


class RougeConfig(BaseModel):
    """Complete ROUGE configuration."""

    llm: LLMConfig = Field(default_factory=LLMConfig)
    ui: UIConfig = Field(default_factory=UIConfig)
    paths: PathsConfig = Field(default_factory=PathsConfig)


class ConfigManager:
    """Manage ROUGE configuration with persistence."""

    DEFAULT_CONFIG_PATH = Path.home() / ".rouge" / "config.yaml"

    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize configuration manager.

        Args:
            config_path: Path to configuration file (default: ~/.rouge/config.yaml)
        """
        self.config_path = config_path or self.DEFAULT_CONFIG_PATH
        self.config: RougeConfig = self._load_or_create()

    def _load_or_create(self) -> RougeConfig:
        """
        Load configuration from file or create default.

        Returns:
            RougeConfig instance
        """
        if self.config_path.exists():
            return self._load()
        else:
            return self._create_default()

    def _load(self) -> RougeConfig:
        """
        Load configuration from file.

        Returns:
            RougeConfig instance
        """
        with open(self.config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}

        return RougeConfig(**data)

    def _create_default(self) -> RougeConfig:
        """
        Create default configuration.

        Returns:
            RougeConfig instance with defaults
        """
        return RougeConfig()

    def save(self):
        """Save configuration to file."""
        # Ensure directory exists
        self.config_path.parent.mkdir(parents=True, exist_ok=True)

        # Convert to dict and save
        config_dict = self.config.model_dump()

        # Mask API keys in saved file for security
        if config_dict.get("llm", {}).get("groq_api_key"):
            # Only save if it's set (don't save None/empty)
            api_key = config_dict["llm"]["groq_api_key"]
            if api_key:
                # Simple obfuscation (not encryption, just to avoid plain text in file)
                config_dict["llm"]["groq_api_key"] = f"***{api_key[-4:]}"

        with open(self.config_path, "w", encoding="utf-8") as f:
            yaml.dump(config_dict, f, default_flow_style=False, sort_keys=False)

    def update_llm_config(
        self,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        ollama_url: Optional[str] = None,
        groq_api_key: Optional[str] = None,
    ):
        """
        Update LLM configuration.

        Args:
            provider: LLM provider
            model: Model name
            ollama_url: Ollama base URL
            groq_api_key: Groq API key
        """
        if provider is not None:
            self.config.llm.provider = provider
        if model is not None:
            self.config.llm.model = model
        if ollama_url is not None:
            self.config.llm.ollama_url = ollama_url
        if groq_api_key is not None:
            self.config.llm.groq_api_key = groq_api_key

        self.save()

    def get_llm_config(self) -> LLMConfig:
        """
        Get LLM configuration.

        Returns:
            LLMConfig instance
        """
        return self.config.llm

    def get_ui_config(self) -> UIConfig:
        """
        Get UI configuration.

        Returns:
            UIConfig instance
        """
        return self.config.ui

    def get_paths_config(self) -> PathsConfig:
        """
        Get paths configuration.

        Returns:
            PathsConfig instance
        """
        return self.config.paths

    def reset_to_defaults(self):
        """Reset configuration to defaults."""
        self.config = RougeConfig()
        self.save()

    def get_groq_api_key_from_env(self) -> Optional[str]:
        """
        Get Groq API key from environment or config.

        Returns:
            API key or None
        """
        # Check environment first
        env_key = os.environ.get("GROQ_API_KEY")
        if env_key:
            return env_key

        # Check config (but note it may be obfuscated)
        config_key = self.config.llm.groq_api_key
        if config_key and not config_key.startswith("***"):
            return config_key

        return None
