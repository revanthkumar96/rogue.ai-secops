"""
Unit tests for ROUGE MCP tools
Tests TestingTools and DevOpsTools functionality
"""

import json
import os
from pathlib import Path
from unittest.mock import Mock, mock_open, patch

import pytest

from rouge.tools.devops_tools import DevOpsTools
from rouge.tools.testing_tools import TestingTools


class TestTestingTools:
    """Unit tests for TestingTools class"""

    def test_init(self, temp_dir):
        """Test TestingTools initialization"""
        tools = TestingTools(repo_path=temp_dir)
        assert tools.repo_path == Path(temp_dir)
        assert tools.deliverables_path.exists()

    @pytest.mark.asyncio
    async def test_execute_playwright_script_success(self, testing_tools, temp_dir):
        """Test Playwright script execution (mocked)"""
        script = """
        from playwright.async_api import async_playwright
        """

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=0, stdout="Success", stderr="")

            result = await testing_tools.execute_playwright_script(script, headless=True)

            assert result["success"] is True
            assert "stdout" in result or "output" in result

    @pytest.mark.asyncio
    async def test_run_pytest_suite(self, testing_tools, temp_dir):
        """Test pytest suite execution"""
        # Create a test file
        test_file = os.path.join(temp_dir, "test_sample.py")
        with open(test_file, "w") as f:
            f.write("""
import pytest

def test_example():
    assert 1 + 1 == 2
""")

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=0, stdout="1 passed")

            result = await testing_tools.run_pytest_suite(temp_dir, markers=None, parallel=False)

            assert result["success"] is True
            assert "stdout" in result

    @pytest.mark.asyncio
    async def test_run_api_test_success(self, testing_tools):
        """Test API testing"""
        method = "GET"
        url = "https://api.example.com/users"
        headers = {"Authorization": "Bearer token"}

        # Mock the requests module at import time
        import sys
        mock_requests = Mock()
        mock_requests.exceptions = Mock()
        mock_requests.exceptions.Timeout = Exception

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"users": []}
        mock_response.text = '{"users": []}'
        mock_response.headers = {}
        mock_requests.request.return_value = mock_response

        original_requests = sys.modules.get('requests')
        sys.modules['requests'] = mock_requests

        try:
            result = await testing_tools.run_api_test(method, url, headers=headers)

            assert result["success"] is True
            assert "response" in result
            assert result["response"]["status_code"] == 200
        finally:
            if original_requests:
                sys.modules['requests'] = original_requests
            else:
                sys.modules.pop('requests', None)

    @pytest.mark.asyncio
    async def test_generate_test_data(self, testing_tools):
        """Test data generation with Faker"""
        factory_type = "user"
        count = 5

        result = await testing_tools.generate_test_data(factory_type, count=count)

        assert result["success"] is True
        assert result["factory_type"] == "user"
        assert result["count"] == 5
        assert len(result["data"]) == 5
        for record in result["data"]:
            assert "name" in record
            assert "email" in record
            assert "username" in record


class TestDevOpsTools:
    """Unit tests for DevOpsTools class"""

    def test_init(self, temp_dir):
        """Test DevOpsTools initialization"""
        tools = DevOpsTools(repo_path=temp_dir)
        assert tools.repo_path == Path(temp_dir)
        assert tools.deliverables_path.exists()

    @pytest.mark.asyncio
    async def test_terraform_init_success(self, devops_tools, temp_dir):
        """Test Terraform initialization"""
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=0, stdout="Terraform initialized", stderr="")

            result = await devops_tools.terraform_init(temp_dir)

            assert result["success"] is True
            assert "stdout" in result

    @pytest.mark.asyncio
    async def test_terraform_plan(self, devops_tools, temp_dir):
        """Test Terraform plan"""
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=0, stdout="Plan: 5 to add", stderr="")

            result = await devops_tools.terraform_plan(temp_dir)

            assert result["success"] is True
            assert "stdout" in result

    @pytest.mark.asyncio
    async def test_terraform_apply(self, devops_tools, temp_dir):
        """Test Terraform apply"""
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=0, stdout="Apply complete!")

            result = await devops_tools.terraform_apply(temp_dir, auto_approve=True)

            assert result["success"] is True
            mock_run.assert_called_once()
            assert "-auto-approve" in mock_run.call_args[0][0]

    @pytest.mark.asyncio
    async def test_kubectl_apply(self, devops_tools, temp_dir):
        """Test kubectl apply"""
        manifest_path = os.path.join(temp_dir, "deployment.yml")

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=0, stdout="deployment.apps/myapp created", stderr="")

            result = await devops_tools.kubectl_apply(manifest_path, namespace="default")

            assert result["success"] is True
            assert "stdout" in result

    @pytest.mark.asyncio
    async def test_docker_build(self, devops_tools, temp_dir):
        """Test Docker build"""
        # Create Dockerfile
        dockerfile_path = os.path.join(temp_dir, "Dockerfile")
        with open(dockerfile_path, "w") as f:
            f.write("FROM python:3.11\n")

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=0, stdout="Successfully built", stderr="")

            result = await devops_tools.docker_build(
                dockerfile_path=dockerfile_path,
                tag="myapp:latest",
                context_path=temp_dir
            )

            assert result["success"] is True
            assert result["image_tag"] == "myapp:latest"

    @pytest.mark.asyncio
    async def test_prometheus_query(self, devops_tools):
        """Test Prometheus query"""
        query = "up{job='api-server'}"

        with patch("requests.get") as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "status": "success",
                "data": {"resultType": "vector", "result": []},
            }
            mock_get.return_value = mock_response

            result = await devops_tools.prometheus_query(
                query, prometheus_url="http://localhost:9090"
            )

            assert result["success"] is True
            assert "data" in result


class TestToolErrorHandling:
    """Test error handling in tools"""

    @pytest.mark.asyncio
    async def test_testing_tools_network_error(self, testing_tools):
        """Test handling of network errors in API testing"""
        import sys

        # Create a proper mock with exceptions attribute
        mock_requests = Mock()
        mock_requests.exceptions = Mock()
        mock_requests.exceptions.Timeout = Exception  # Use Exception as the base class
        mock_requests.request.side_effect = Exception("Network error")

        original_requests = sys.modules.get('requests')
        sys.modules['requests'] = mock_requests

        try:
            result = await testing_tools.run_api_test("GET", "https://example.com")

            assert result["success"] is False
            assert "error" in result
        finally:
            if original_requests:
                sys.modules['requests'] = original_requests
            else:
                sys.modules.pop('requests', None)

    @pytest.mark.asyncio
    async def test_devops_tools_command_not_found(self, devops_tools, temp_dir):
        """Test handling of missing commands"""
        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = FileNotFoundError("terraform not found")

            result = await devops_tools.terraform_init(temp_dir)

            assert result["success"] is False
            assert "error" in result
