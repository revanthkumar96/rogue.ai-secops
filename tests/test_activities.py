from unittest.mock import AsyncMock, patch

import pytest

from rouge.temporal.activities import run_agent_activity
from rouge.types.temporal_types import AgentActivityInput



@pytest.mark.asyncio
async def test_run_agent_activity_success():
    # Mock the AgentExecutionService or the agent itself
    with patch("rouge.temporal.activities.LangGraphOllamaAgent") as mock_agent_class:
        mock_agent = mock_agent_class.return_value
        mock_agent.run = AsyncMock(return_value="Agent Output")

        activity_input = AgentActivityInput(
            agent_name="pre-recon",
            web_url="http://test.com",
            repo_path="./repo"
        )
        result = await run_agent_activity(activity_input)

        assert result.success is True
        assert result.result == "Agent Output"
        assert result.metrics is not None
