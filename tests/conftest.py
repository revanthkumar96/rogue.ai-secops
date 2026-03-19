"""
Shared test fixtures and configuration for ROUGE test suite
"""

import asyncio
import os
import tempfile
from pathlib import Path
from typing import AsyncGenerator, Dict, Generator
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from rouge.config.parser import RougeSettings
from rouge.session_manager import AGENTS
from rouge.temporal.activities import run_agent_activity
from rouge.temporal.workflows import (
    CICDPipelineWorkflow,
    InfrastructureProvisioningWorkflow,
    TestAutomationWorkflow,
    UnifiedDevOpsWorkflow,
)
from rouge.tools.devops_tools import DevOpsTools
from rouge.tools.testing_tools import TestingTools
from rouge.types.temporal_types import (
    CICDInput,
    InfrastructureInput,
    TestAutomationInput,
    UnifiedDevOpsInput,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def temp_dir() -> Generator[str, None, None]:
    """Create temporary directory for test outputs"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


@pytest.fixture
def mock_ollama_client():
    """Mock Ollama client for testing"""
    client = AsyncMock()
    client.list.return_value = {
        "models": [
            {"name": "qwen2.5:7b"},
            {"name": "llama3.1:8b"},
            {"name": "llama3.1:70b"},
        ]
    }
    client.chat.return_value = {"message": {"content": "Test response"}}
    return client


@pytest.fixture
def mock_langgraph_agent():
    """Mock LangGraph agent for testing"""
    agent = Mock()
    agent.invoke.return_value = {
        "messages": [{"content": "# Test deliverable\nGenerated test content"}],
        "output": "Test output",
    }
    return agent


@pytest.fixture
def rouge_settings(temp_dir: str) -> RougeSettings:
    """Create ROUGE settings for testing"""
    os.environ["OLLAMA_BASE_URL"] = "http://localhost:11434"
    os.environ["OLLAMA_SMALL_MODEL"] = "qwen2.5:7b"
    os.environ["OLLAMA_MEDIUM_MODEL"] = "llama3.1:8b"
    os.environ["OLLAMA_LARGE_MODEL"] = "llama3.1:70b"
    os.environ["TEMPORAL_ADDRESS"] = "localhost:7233"
    os.environ["TEMPORAL_NAMESPACE"] = "default"
    os.environ["TARGET_DIR"] = temp_dir

    return RougeSettings()


@pytest.fixture
def test_automation_input(temp_dir: str) -> TestAutomationInput:
    """Create test automation workflow input"""
    return TestAutomationInput(
        target_app_url="https://demo.example.com",
        source_code_path=temp_dir,
        test_types=["ui", "api", "performance"],
        framework_preference="playwright",
        ci_platform="github-actions",
        config_path=None,
    )


@pytest.fixture
def infrastructure_input(temp_dir: str) -> InfrastructureInput:
    """Create infrastructure workflow input"""
    return InfrastructureInput(
        cloud_provider="aws",
        infrastructure_type="kubernetes",
        environment="staging",
        observability_tools=["prometheus", "grafana"],
        repo_path=temp_dir,
    )


@pytest.fixture
def cicd_input(temp_dir: str) -> CICDInput:
    """Create CI/CD workflow input"""
    return CICDInput(
        platform="github-actions",
        deployment_strategy="blue-green",
        source_code_path=temp_dir,
        target_environments=["staging", "production"],
        enable_security_scanning=True,
        repo_path=temp_dir,
    )


@pytest.fixture
def unified_input(temp_dir: str) -> UnifiedDevOpsInput:
    """Create unified DevOps workflow input"""
    return UnifiedDevOpsInput(
        target_app_url="https://example.com",
        source_code_path=temp_dir,
        cloud_provider="aws",
        infrastructure_type="kubernetes",
        test_types=["ui", "api", "performance"],
        ci_platform="github-actions",
        deployment_strategy="blue-green",
        observability_tools=["prometheus", "grafana", "elk"],
        repo_path=temp_dir,
    )


@pytest.fixture
async def temporal_env() -> AsyncGenerator[WorkflowEnvironment, None]:
    """Create Temporal test environment"""
    async with await WorkflowEnvironment.start_time_skipping() as env:
        yield env


@pytest.fixture
async def temporal_worker(
    temporal_env: WorkflowEnvironment,
) -> AsyncGenerator[Worker, None]:
    """Create Temporal worker for testing"""
    worker = Worker(
        temporal_env.client,
        task_queue="test-task-queue",
        workflows=[
            TestAutomationWorkflow,
            InfrastructureProvisioningWorkflow,
            CICDPipelineWorkflow,
            UnifiedDevOpsWorkflow,
        ],
        activities=[run_agent_activity],
    )

    async with worker:
        yield worker


@pytest.fixture
def testing_tools(temp_dir: str) -> TestingTools:
    """Create TestingTools instance for testing"""
    return TestingTools(repo_path=temp_dir)


@pytest.fixture
def devops_tools(temp_dir: str) -> DevOpsTools:
    """Create DevOpsTools instance for testing"""
    return DevOpsTools(repo_path=temp_dir)


@pytest.fixture
def sample_playwright_test() -> str:
    """Sample Playwright test code"""
    return '''
import pytest
from playwright.sync_api import Page, expect

def test_login(page: Page):
    """Test login functionality"""
    page.goto("https://demo.example.com/login")
    page.fill("#username", "testuser")
    page.fill("#password", "password123")
    page.click("button[type=submit]")
    expect(page.locator(".welcome")).to_be_visible()
'''


@pytest.fixture
def sample_terraform_code() -> str:
    """Sample Terraform infrastructure code"""
    return '''
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "test-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
}

variable "aws_region" {
  default = "us-east-1"
}
'''


@pytest.fixture
def sample_github_actions_workflow() -> str:
    """Sample GitHub Actions CI/CD workflow"""
    return '''
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        run: pytest tests/ -v --cov=src

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: echo "Deploying..."
'''


@pytest.fixture
def agent_output_samples() -> Dict[str, str]:
    """Sample outputs for different agent types"""
    return {
        "framework-builder": """
# Test Framework Architecture

## Overview
Complete test automation framework using Playwright with Page Object Model.

## Components
- Page Objects
- Test Data Factories
- Configuration Management
""",
        "ui-test-scripter": """
# UI Test Suite

Complete Playwright test suite with Page Object Model pattern.

```python
class LoginPage:
    def __init__(self, page: Page):
        self.page = page
        self.username_input = page.locator("#username")

    def login(self, username: str, password: str):
        self.username_input.fill(username)
        self.page.click("button[type=submit]")
```
""",
        "iac-engineer": """
# Infrastructure as Code

Complete Terraform configuration for AWS EKS cluster.

```hcl
module "eks" {
  source = "terraform-aws-modules/eks/aws"

  cluster_name    = "my-cluster"
  cluster_version = "1.28"
}
```
""",
    }


@pytest.fixture(autouse=True)
def reset_environment():
    """Reset environment variables before each test"""
    original_env = os.environ.copy()
    yield
    os.environ.clear()
    os.environ.update(original_env)


@pytest.fixture
def mock_subprocess_run():
    """Mock subprocess.run for testing command execution"""
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = Mock(returncode=0, stdout=b"Success", stderr=b"")
        yield mock_run


@pytest.fixture
def sample_deliverables_structure(temp_dir: str) -> Dict[str, Path]:
    """Create sample deliverables directory structure"""
    deliverables_dir = Path(temp_dir) / "deliverables"
    deliverables_dir.mkdir(exist_ok=True)

    files = {
        "test_suite": deliverables_dir / "ui_test_suite.py",
        "api_tests": deliverables_dir / "api_tests.py",
        "infrastructure": deliverables_dir / "infrastructure.tf",
        "ci_pipeline": deliverables_dir / "ci_pipeline.yml",
        "README": deliverables_dir / "README.md",
    }

    for file_path in files.values():
        file_path.write_text("# Generated file\n")

    return files
