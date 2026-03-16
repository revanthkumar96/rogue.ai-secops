import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from rouge.temporal.activities import run_agent_activity

@pytest.mark.asyncio
async def test_run_agent_activity_success():
    # Mock the AgentExecutionService or the agent itself
    with patch("rouge.temporal.activities.LangGraphOllamaAgent") as mock_agent_class:
        mock_agent = mock_agent_class.return_value
        mock_agent.run = AsyncMock(return_value="Agent Output")
        
        result = await run_agent_activity("pre-recon", "http://test.com", "./repo")
        
        assert result["success"] is True
        assert result["result"] == "Agent Output"
        assert "metrics" in result
