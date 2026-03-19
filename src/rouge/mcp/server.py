import asyncio
import json
import os
from typing import List

import pyotp
from mcp.server import Server
from mcp.types import TextContent, Tool

from ..tools.devops_tools import DevOpsTools
from ..tools.testing_tools import TestingTools


class RougeMcpServer:
    def __init__(self, target_dir: str):
        self.target_dir = target_dir
        self.server = Server("rouge-devops-testing")

        # Initialize tool collections
        self.testing_tools = TestingTools(target_dir)
        self.devops_tools = DevOpsTools(target_dir)

        self._setup_tools()

    def _setup_tools(self):
        @self.server.list_tools()
        async def list_tools() -> List[Tool]:
            return [
                # ============================================
                # CORE TOOLS
                # ============================================
                Tool(
                    name="save_deliverable",
                    description="Save agent output/deliverable to a file in the deliverables directory",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "filename": {"type": "string", "description": "Name of the file to save"},
                            "content": {"type": "string", "description": "Content to write to the file"},
                        },
                        "required": ["filename", "content"],
                    },
                ),
                Tool(
                    name="generate_totp",
                    description="Generate a TOTP (Time-based One-Time Password) code for 2FA testing",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "secret": {"type": "string", "description": "TOTP secret key"},
                        },
                        "required": ["secret"],
                    },
                ),
                # ============================================
                # TESTING TOOLS
                # ============================================
                Tool(
                    name="execute_playwright_script",
                    description="Execute a Playwright browser automation script for UI testing",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "script": {"type": "string", "description": "Python Playwright script to execute"},
                            "browser": {
                                "type": "string",
                                "enum": ["chromium", "firefox", "webkit"],
                                "default": "chromium",
                                "description": "Browser type to use",
                            },
                            "headless": {
                                "type": "boolean",
                                "default": True,
                                "description": "Run browser in headless mode",
                            },
                        },
                        "required": ["script"],
                    },
                ),
                Tool(
                    name="capture_screenshot",
                    description="Capture a screenshot of a webpage or specific element for visual testing",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "url": {"type": "string", "description": "URL to navigate to"},
                            "filename": {"type": "string", "description": "Output filename (e.g., 'homepage.png')"},
                            "selector": {
                                "type": "string",
                                "description": "Optional CSS selector for specific element screenshot",
                            },
                            "viewport_width": {"type": "integer", "default": 1280},
                            "viewport_height": {"type": "integer", "default": 720},
                        },
                        "required": ["url", "filename"],
                    },
                ),
                Tool(
                    name="compare_screenshots",
                    description="Compare two screenshots for visual regression testing",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "baseline": {"type": "string", "description": "Path to baseline screenshot"},
                            "current": {"type": "string", "description": "Path to current screenshot"},
                            "threshold": {
                                "type": "number",
                                "default": 0.1,
                                "description": "Difference threshold (0.0 = identical, 1.0 = completely different)",
                            },
                        },
                        "required": ["baseline", "current"],
                    },
                ),
                Tool(
                    name="run_pytest_suite",
                    description="Execute pytest test suite with coverage and parallel execution options",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "test_path": {"type": "string", "description": "Path to test file or directory"},
                            "markers": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Pytest markers to filter tests (e.g., ['unit', 'integration'])",
                            },
                            "parallel": {"type": "boolean", "default": False, "description": "Run tests in parallel"},
                            "verbose": {"type": "boolean", "default": True, "description": "Verbose output"},
                            "coverage": {"type": "boolean", "default": False, "description": "Enable coverage reporting"},
                        },
                        "required": ["test_path"],
                    },
                ),
                Tool(
                    name="run_api_test",
                    description="Execute REST API test with assertions for status code, response time, JSON validation",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "method": {
                                "type": "string",
                                "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"],
                                "description": "HTTP method",
                            },
                            "url": {"type": "string", "description": "API endpoint URL"},
                            "headers": {"type": "object", "description": "Request headers"},
                            "body": {"type": "object", "description": "Request body (for POST/PUT/PATCH)"},
                            "assertions": {
                                "type": "array",
                                "items": {"type": "object"},
                                "description": "List of assertions to validate response",
                            },
                        },
                        "required": ["method", "url"],
                    },
                ),
                Tool(
                    name="generate_test_data",
                    description="Generate realistic test data using Faker library (users, products, orders, etc.)",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "factory_type": {
                                "type": "string",
                                "enum": ["user", "product", "order"],
                                "description": "Type of data to generate",
                            },
                            "count": {"type": "integer", "default": 1, "description": "Number of records to generate"},
                            "attributes": {
                                "type": "object",
                                "description": "Override specific attributes in generated data",
                            },
                        },
                        "required": ["factory_type"],
                    },
                ),
                Tool(
                    name="run_k6_load_test",
                    description="Execute k6 performance/load test script",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "script_path": {"type": "string", "description": "Path to k6 test script (.js)"},
                            "virtual_users": {"type": "integer", "default": 10, "description": "Number of virtual users"},
                            "duration": {
                                "type": "string",
                                "default": "30s",
                                "description": "Test duration (e.g., '30s', '5m')",
                            },
                        },
                        "required": ["script_path"],
                    },
                ),
                # ============================================
                # DEVOPS INFRASTRUCTURE TOOLS
                # ============================================
                Tool(
                    name="terraform_init",
                    description="Initialize Terraform working directory",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "working_dir": {"type": "string", "description": "Directory containing Terraform configuration"},
                        },
                        "required": ["working_dir"],
                    },
                ),
                Tool(
                    name="terraform_plan",
                    description="Run Terraform plan to preview infrastructure changes",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "working_dir": {"type": "string", "description": "Directory containing Terraform configuration"},
                            "var_file": {"type": "string", "description": "Optional path to variables file"},
                        },
                        "required": ["working_dir"],
                    },
                ),
                Tool(
                    name="terraform_apply",
                    description="Apply Terraform configuration to provision infrastructure",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "working_dir": {"type": "string", "description": "Directory containing Terraform configuration"},
                            "auto_approve": {
                                "type": "boolean",
                                "default": False,
                                "description": "Skip interactive approval (use with caution!)",
                            },
                        },
                        "required": ["working_dir"],
                    },
                ),
                Tool(
                    name="kubectl_apply",
                    description="Apply Kubernetes manifest to create or update resources",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "manifest_path": {"type": "string", "description": "Path to manifest file or directory"},
                            "namespace": {"type": "string", "default": "default", "description": "Kubernetes namespace"},
                            "context": {"type": "string", "description": "Kubernetes context to use"},
                        },
                        "required": ["manifest_path"],
                    },
                ),
                Tool(
                    name="kubectl_get",
                    description="Get Kubernetes resources (pods, services, deployments, etc.)",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "resource_type": {
                                "type": "string",
                                "description": "Resource type (e.g., 'pods', 'services', 'deployments')",
                            },
                            "namespace": {"type": "string", "default": "default"},
                            "output": {
                                "type": "string",
                                "enum": ["json", "yaml", "wide"],
                                "default": "json",
                                "description": "Output format",
                            },
                            "context": {"type": "string", "description": "Kubernetes context to use"},
                        },
                        "required": ["resource_type"],
                    },
                ),
                Tool(
                    name="helm_install",
                    description="Install Helm chart to Kubernetes cluster",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "release_name": {"type": "string", "description": "Name for the Helm release"},
                            "chart": {"type": "string", "description": "Chart reference (e.g., 'bitnami/nginx')"},
                            "namespace": {"type": "string", "default": "default"},
                            "values_file": {"type": "string", "description": "Optional values file path"},
                            "create_namespace": {"type": "boolean", "default": True},
                        },
                        "required": ["release_name", "chart"],
                    },
                ),
                Tool(
                    name="docker_build",
                    description="Build Docker image from Dockerfile",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "dockerfile_path": {"type": "string", "description": "Path to Dockerfile"},
                            "tag": {"type": "string", "description": "Image tag (e.g., 'myapp:latest')"},
                            "build_args": {"type": "object", "description": "Build arguments"},
                            "context_path": {"type": "string", "default": ".", "description": "Build context path"},
                        },
                        "required": ["dockerfile_path", "tag"],
                    },
                ),
                Tool(
                    name="docker_run",
                    description="Run Docker container with port mappings, environment variables, and volumes",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "image": {"type": "string", "description": "Docker image to run"},
                            "ports": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Port mappings (e.g., ['8080:80'])",
                            },
                            "env_vars": {"type": "object", "description": "Environment variables"},
                            "volumes": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Volume mounts (e.g., ['/host:/container'])",
                            },
                            "name": {"type": "string", "description": "Container name"},
                            "detached": {"type": "boolean", "default": True, "description": "Run in detached mode"},
                        },
                        "required": ["image"],
                    },
                ),
                # ============================================
                # CI/CD TOOLS
                # ============================================
                Tool(
                    name="github_actions_create",
                    description="Create GitHub Actions workflow file",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "workflow_name": {"type": "string", "description": "Name of the workflow"},
                            "triggers": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Trigger events (e.g., ['push', 'pull_request'])",
                            },
                            "jobs": {
                                "type": "array",
                                "items": {"type": "object"},
                                "description": "List of job definitions",
                            },
                        },
                        "required": ["workflow_name", "triggers", "jobs"],
                    },
                ),
                Tool(
                    name="jenkins_create_job",
                    description="Create Jenkins job configuration (generates XML config)",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "job_name": {"type": "string", "description": "Name for the Jenkins job"},
                            "jenkinsfile_path": {"type": "string", "description": "Path to Jenkinsfile"},
                        },
                        "required": ["job_name", "jenkinsfile_path"],
                    },
                ),
                # ============================================
                # OBSERVABILITY TOOLS
                # ============================================
                Tool(
                    name="prometheus_query",
                    description="Query Prometheus metrics using PromQL",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "PromQL query"},
                            "prometheus_url": {
                                "type": "string",
                                "default": "http://localhost:9090",
                                "description": "Prometheus server URL",
                            },
                            "time_range": {
                                "type": "string",
                                "description": "Optional time range (e.g., '1h', '24h')",
                            },
                        },
                        "required": ["query"],
                    },
                ),
                Tool(
                    name="grafana_create_dashboard",
                    description="Create Grafana dashboard from JSON definition",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "dashboard_json": {"type": "object", "description": "Dashboard definition (Grafana JSON format)"},
                            "grafana_url": {
                                "type": "string",
                                "default": "http://localhost:3000",
                                "description": "Grafana server URL",
                            },
                            "api_key": {"type": "string", "description": "Grafana API key"},
                        },
                        "required": ["dashboard_json"],
                    },
                ),
                Tool(
                    name="elasticsearch_query",
                    description="Query Elasticsearch logs using Query DSL",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "index": {"type": "string", "description": "Elasticsearch index pattern"},
                            "query": {"type": "object", "description": "Elasticsearch query DSL"},
                            "es_url": {
                                "type": "string",
                                "default": "http://localhost:9200",
                                "description": "Elasticsearch URL",
                            },
                            "time_range": {
                                "type": "string",
                                "description": "Optional time range filter",
                            },
                        },
                        "required": ["index", "query"],
                    },
                ),
                # ============================================
                # CONFIGURATION & SECRETS TOOLS
                # ============================================
                Tool(
                    name="ansible_playbook_run",
                    description="Run Ansible playbook for configuration management",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "playbook_path": {"type": "string", "description": "Path to playbook YAML file"},
                            "inventory": {"type": "string", "description": "Inventory file or host list"},
                            "extra_vars": {"type": "object", "description": "Extra variables to pass to playbook"},
                            "tags": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Playbook tags to run",
                            },
                        },
                        "required": ["playbook_path", "inventory"],
                    },
                ),
                Tool(
                    name="vault_read_secret",
                    description="Read secret from HashiCorp Vault",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "Secret path (e.g., 'secret/data/myapp/db')"},
                            "vault_addr": {
                                "type": "string",
                                "default": "http://localhost:8200",
                                "description": "Vault server address",
                            },
                            "vault_token": {"type": "string", "description": "Vault authentication token"},
                        },
                        "required": ["path"],
                    },
                ),
                Tool(
                    name="vault_write_secret",
                    description="Write secret to HashiCorp Vault",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "Secret path"},
                            "data": {"type": "object", "description": "Secret data to store"},
                            "vault_addr": {
                                "type": "string",
                                "default": "http://localhost:8200",
                                "description": "Vault server address",
                            },
                            "vault_token": {"type": "string", "description": "Vault authentication token"},
                        },
                        "required": ["path", "data"],
                    },
                ),
            ]

        @self.server.call_tool()
        async def call_tool(name: str, arguments: dict) -> List[TextContent]:
            result = None

            # ============================================
            # CORE TOOLS
            # ============================================
            if name == "save_deliverable":
                filename = arguments["filename"]
                content = arguments["content"]
                save_path = os.path.join(self.target_dir, "deliverables", filename)

                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                with open(save_path, "w") as f:
                    f.write(content)

                return [TextContent(type="text", text=f"Saved deliverable to {filename}")]

            elif name == "generate_totp":
                secret = arguments["secret"]
                totp = pyotp.TOTP(secret)
                code = totp.now()
                return [TextContent(type="text", text=f"TOTP Code: {code}")]

            # ============================================
            # TESTING TOOLS
            # ============================================
            elif name == "execute_playwright_script":
                result = await self.testing_tools.execute_playwright_script(**arguments)

            elif name == "capture_screenshot":
                result = await self.testing_tools.capture_screenshot(**arguments)

            elif name == "compare_screenshots":
                result = await self.testing_tools.compare_screenshots(**arguments)

            elif name == "run_pytest_suite":
                result = await self.testing_tools.run_pytest_suite(**arguments)

            elif name == "run_api_test":
                result = await self.testing_tools.run_api_test(**arguments)

            elif name == "generate_test_data":
                result = await self.testing_tools.generate_test_data(**arguments)

            elif name == "run_k6_load_test":
                result = await self.testing_tools.run_k6_load_test(**arguments)

            # ============================================
            # DEVOPS INFRASTRUCTURE TOOLS
            # ============================================
            elif name == "terraform_init":
                result = await self.devops_tools.terraform_init(**arguments)

            elif name == "terraform_plan":
                result = await self.devops_tools.terraform_plan(**arguments)

            elif name == "terraform_apply":
                result = await self.devops_tools.terraform_apply(**arguments)

            elif name == "kubectl_apply":
                result = await self.devops_tools.kubectl_apply(**arguments)

            elif name == "kubectl_get":
                result = await self.devops_tools.kubectl_get(**arguments)

            elif name == "helm_install":
                result = await self.devops_tools.helm_install(**arguments)

            elif name == "docker_build":
                result = await self.devops_tools.docker_build(**arguments)

            elif name == "docker_run":
                result = await self.devops_tools.docker_run(**arguments)

            # ============================================
            # CI/CD TOOLS
            # ============================================
            elif name == "github_actions_create":
                result = await self.devops_tools.github_actions_create(**arguments)

            elif name == "jenkins_create_job":
                result = await self.devops_tools.jenkins_create_job(**arguments)

            # ============================================
            # OBSERVABILITY TOOLS
            # ============================================
            elif name == "prometheus_query":
                result = await self.devops_tools.prometheus_query(**arguments)

            elif name == "grafana_create_dashboard":
                result = await self.devops_tools.grafana_create_dashboard(**arguments)

            elif name == "elasticsearch_query":
                result = await self.devops_tools.elasticsearch_query(**arguments)

            # ============================================
            # CONFIGURATION & SECRETS TOOLS
            # ============================================
            elif name == "ansible_playbook_run":
                result = await self.devops_tools.ansible_playbook_run(**arguments)

            elif name == "vault_read_secret":
                result = await self.devops_tools.vault_read_secret(**arguments)

            elif name == "vault_write_secret":
                result = await self.devops_tools.vault_write_secret(**arguments)

            else:
                raise ValueError(f"Unknown tool: {name}")

            # Format result as TextContent
            if result:
                result_text = json.dumps(result, indent=2)
                return [TextContent(type="text", text=result_text)]

            return [TextContent(type="text", text="Tool executed successfully")]
