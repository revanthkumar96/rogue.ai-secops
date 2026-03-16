from unittest.mock import AsyncMock, patch

import pytest

from rouge.agents.ollama import LangGraphOllamaAgent


@pytest.mark.asyncio
async def test_agent_run_no_tools():
    # Mock ollama.AsyncClient
    with patch("rouge.agents.ollama.ollama.AsyncClient") as mock_client_class:
        mock_client = mock_client_class.return_value
        mock_client.chat = AsyncMock(
            return_value={
                "message": {
                    "role": "assistant",
                    "content": "Vulnerability found!",
                    "tool_calls": [],
                }
            }
        )

        agent = LangGraphOllamaAgent("test-agent", "llama3", "http://localhost:11434")
        result = await agent.run("Scan this site", webUrl="http://test.com")

        assert result == "Vulnerability found!"
        mock_client.chat.assert_called_once()
