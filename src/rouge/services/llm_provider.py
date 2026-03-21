"""
LLM Provider Abstraction for ROUGE.

Supports multiple LLM providers (Ollama, Groq) with a unified interface.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

import tiktoken


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    def __init__(self, model: str):
        """
        Initialize LLM provider.

        Args:
            model: Model name/identifier
        """
        self.model = model

    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send chat completion request.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters

        Returns:
            Response dictionary with 'content', 'usage', and metadata
        """
        pass

    @abstractmethod
    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text.

        Args:
            text: Text to count tokens for

        Returns:
            Number of tokens
        """
        pass

    def count_messages_tokens(self, messages: List[Dict[str, str]]) -> int:
        """
        Count total tokens in a list of messages.

        Args:
            messages: List of message dictionaries

        Returns:
            Total token count
        """
        total = 0
        for msg in messages:
            # Count role overhead (approximately 4 tokens per message)
            total += 4
            # Count content tokens
            total += self.count_tokens(msg.get("content", ""))
        return total


class OllamaProvider(LLMProvider):
    """Ollama LLM provider."""

    def __init__(self, model: str, base_url: str = "http://localhost:11434"):
        """
        Initialize Ollama provider.

        Args:
            model: Ollama model name (e.g., 'llama3.1:8b')
            base_url: Ollama server URL
        """
        super().__init__(model)
        self.base_url = base_url
        self._client = None

    @property
    def client(self):
        """Lazy-load Ollama client."""
        if self._client is None:
            import ollama
            self._client = ollama.AsyncClient(host=self.base_url)
        return self._client

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send chat completion request to Ollama.

        Args:
            messages: List of message dictionaries
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Ollama parameters

        Returns:
            Response dictionary
        """
        options = {
            "temperature": temperature,
        }
        if max_tokens:
            options["num_predict"] = max_tokens

        # Merge additional options
        options.update(kwargs.get("options", {}))

        response = await self.client.chat(
            model=self.model,
            messages=messages,
            options=options,
        )

        # Extract response content
        content = response.get("message", {}).get("content", "")

        # Calculate token usage (Ollama doesn't provide exact counts)
        input_tokens = self.count_messages_tokens(messages)
        output_tokens = self.count_tokens(content)

        return {
            "content": content,
            "usage": {
                "prompt_tokens": input_tokens,
                "completion_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
            },
            "model": self.model,
            "provider": "ollama",
        }

    def count_tokens(self, text: str) -> int:
        """
        Count tokens using approximate tokenizer.

        Ollama doesn't expose tokenizer, so we approximate using cl100k_base.

        Args:
            text: Text to count tokens for

        Returns:
            Approximate token count
        """
        try:
            encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(text))
        except Exception:
            # Fallback: rough estimate (1 token ≈ 4 characters)
            return len(text) // 4


class GroqProvider(LLMProvider):
    """Groq LLM provider."""

    def __init__(self, model: str, api_key: str):
        """
        Initialize Groq provider.

        Args:
            model: Groq model name (e.g., 'mixtral-8x7b-32768')
            api_key: Groq API key
        """
        super().__init__(model)
        self.api_key = api_key
        self._client = None

    @property
    def client(self):
        """Lazy-load Groq client."""
        if self._client is None:
            from groq import AsyncGroq
            self._client = AsyncGroq(api_key=self.api_key)
        return self._client

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send chat completion request to Groq.

        Args:
            messages: List of message dictionaries
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Groq parameters

        Returns:
            Response dictionary
        """
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )

        # Extract response content
        content = response.choices[0].message.content

        # Extract token usage (Groq provides exact counts)
        usage = response.usage

        return {
            "content": content,
            "usage": {
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens,
            },
            "model": self.model,
            "provider": "groq",
        }

    def count_tokens(self, text: str) -> int:
        """
        Count tokens using tiktoken.

        Groq uses similar tokenization to OpenAI models.

        Args:
            text: Text to count tokens for

        Returns:
            Token count
        """
        try:
            encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(text))
        except Exception:
            # Fallback: rough estimate
            return len(text) // 4


def create_provider(
    provider_type: str,
    model: str,
    ollama_base_url: Optional[str] = None,
    groq_api_key: Optional[str] = None,
) -> LLMProvider:
    """
    Factory function to create LLM provider.

    Args:
        provider_type: Provider type ('ollama' or 'groq')
        model: Model name
        ollama_base_url: Ollama server URL (for Ollama provider)
        groq_api_key: Groq API key (for Groq provider)

    Returns:
        LLMProvider instance

    Raises:
        ValueError: If provider type is unknown or required credentials are missing
    """
    if provider_type == "ollama":
        base_url = ollama_base_url or "http://localhost:11434"
        return OllamaProvider(model=model, base_url=base_url)

    elif provider_type == "groq":
        if not groq_api_key:
            raise ValueError("Groq API key is required for Groq provider")
        return GroqProvider(model=model, api_key=groq_api_key)

    else:
        raise ValueError(f"Unknown provider type: {provider_type}")


# Available Groq models (as of 2024)
GROQ_MODELS = [
    "llama3-8b-8192",           # Fast, 8B params, 8K context
    "llama3-70b-8192",          # Large, 70B params, 8K context
    "mixtral-8x7b-32768",       # MoE, 32K context
    "gemma-7b-it",              # Google Gemma, 7B params
    "llama-3.1-8b-instant",     # Llama 3.1, instant mode
    "llama-3.1-70b-versatile",  # Llama 3.1, versatile mode
]
