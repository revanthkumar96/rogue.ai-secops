# ROUGE: DevOps & Testing Automation Platform

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-blue.svg" alt="Python Version">
  <img src="https://img.shields.io/badge/LLM-Ollama-orange.svg" alt="LLM Provider">
  <img src="https://img.shields.io/badge/Orchestration-Temporal-red.svg" alt="Orchestration">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</p>

ROUGE is an AI-powered DevOps and Testing Automation platform that combines intelligent agents with durable workflow orchestration to automate testing, infrastructure provisioning, CI/CD pipelines, and observability setup. It uses **Temporal** for fault-tolerant orchestration and **LangGraph** for agentic reasoning, all powered by local **Ollama** models for complete privacy.

## Key Features

- **Intelligent Test Generation**: AI agents write comprehensive Playwright UI tests, REST API tests, mobile tests, and performance tests
- **Infrastructure as Code**: Automated Terraform/Pulumi generation for AWS, Azure, GCP, and Kubernetes
- **CI/CD Pipeline Creation**: Auto-generate GitHub Actions, Jenkins, and GitLab CI pipelines with quality gates
- **Observability Setup**: Configure Prometheus, Grafana, and ELK stack monitoring automatically
- **Local AI Reasoning**: Powered by **Ollama** using local models (Llama 3, Qwen 2.5, Mistral) for complete privacy
- **Durable Orchestration**: Built on **Temporal Python SDK**, ensuring fault-tolerant and parallel execution
- **Agentic Loop**: Uses **LangGraph** for sophisticated "Reason-Act" cycles with tool-use capabilities
- **MCP Integration**: Uses the **Model Context Protocol** to provide agents with testing, DevOps, and infrastructure tools

## Prerequisites

- Python 3.12+
- [uv](https://astral.sh/uv/) for package management
- [Ollama](https://ollama.com/) running locally with a model pulled
- [Temporal CLI](https://github.com/temporalio/cli) for workflow orchestration

## Installation

### 1. Install uv (Python package manager)

```bash
# macOS / Linux / WSL
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Install Ollama

#### macOS

```bash
brew install ollama
```

#### Linux / WSL

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Windows

Download the installer from [ollama.com/download](https://ollama.com/download/windows) and run it.

#### Pull a model

```bash
# Start Ollama (if not already running)
ollama serve

# Pull a model (in another terminal)
ollama pull llama3.1:8b        # 4.7 GB - good balance of speed and quality
ollama pull qwen2.5:7b         # 4.7 GB - strong coding model
ollama pull llama3.1:70b       # 40 GB  - best quality, needs 48GB+ RAM

# Verify
ollama list
```

### 3. Clone and install ROUGE

```bash
git clone https://github.com/yourusername/rouge.git
cd rouge

# Install all dependencies (runtime + dev)
uv sync

# Install Playwright browsers (required for UI test generation)
uv run playwright install
```

## CLI Reference

All usage goes through the `rouge` CLI. The entry point is defined in `pyproject.toml` as `rouge = "rouge.main:main"`.

### Starting ROUGE

```bash
# Interactive mode (guided prompts for workflow selection, model, and inputs)
uv run rouge

# Specify Ollama model directly
uv run rouge -ollama -model llama3.1:8b

# Use -ollama flag to interactively pick from available models
uv run rouge -ollama
```

### Commands

#### `run` - Run Automation Workflows

Starts a Temporal workflow to generate deliverables (test suites, Terraform code, CI/CD pipelines).

```bash
# Generate test automation (UI, API, performance tests)
uv run rouge run test

# Generate cloud infrastructure (Terraform, Kubernetes)
uv run rouge run infra

# Generate CI/CD pipeline configuration
uv run rouge run cicd

# Run all three together (infrastructure + CI/CD + testing)
uv run rouge run unified

# Combine with model selection
uv run rouge -ollama -model qwen2.5:7b run test
uv run rouge -model llama3.1:70b run infra
```

Each `run` command launches an interactive prompt that asks for workflow-specific configuration:

| Workflow | Prompts |
|----------|---------|
| `test` | Target URL, repo path, test types (UI/API/perf/mobile/a11y/visual), framework (playwright/selenium/cypress), CI platform |
| `infra` | Cloud provider (aws/azure/gcp), infra type (kubernetes/vm/serverless), environment (dev/staging/prod), observability tools |
| `cicd` | CI platform (github-actions/jenkins/gitlab-ci), deployment strategy (blue-green/canary/rolling), environments, security scanning |
| `unified` | All of the above combined into one workflow |

#### `execute` - Execute Generated Code

Runs the deliverables that ROUGE generated.

```bash
# Run generated test suites with pytest
uv run rouge execute tests

# Run Terraform init/validate/plan/apply on generated infrastructure
uv run rouge execute terraform

# Specify a custom deliverables directory
uv run rouge execute tests --dir my-output/
uv run rouge execute terraform --dir my-output/
```

#### `list` - View Workflow History

```bash
# Show all workflows executed in the current session
uv run rouge list
```

Displays a table with workflow ID, type, agent count, duration, and timestamp.

#### `deliverables` - View Generated Files

```bash
# List all generated files with sizes and types
uv run rouge deliverables

# List files from a custom directory
uv run rouge deliverables --dir my-output/
```

### Global Flags

| Flag | Description |
|------|-------------|
| `-ollama` | Use Ollama for LLM inference (prompts for model selection if `-model` is not provided) |
| `-model <name>` | Specify an Ollama model directly (e.g., `llama3.1:8b`, `qwen2.5:7b`, `mistral:latest`) |
| `--non-interactive` | Run without interactive prompts (planned) |

## Configuration

ROUGE reads configuration from environment variables or a `.env` file in the project root.

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_SMALL_MODEL` | `llama3.1:8b` | Model for lightweight agents |
| `OLLAMA_MEDIUM_MODEL` | `llama3.1:8b` | Model for mid-complexity agents |
| `OLLAMA_LARGE_MODEL` | `llama3.1:70b` | Model for complex reasoning agents |
| `TEMPORAL_ADDRESS` | `localhost:7233` | Temporal server gRPC address |
| `TEMPORAL_NAMESPACE` | `default` | Temporal namespace |
| `ROUGE_DOCKER` | `false` | Whether running inside Docker |

Example `.env` file:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_SMALL_MODEL=qwen2.5:7b
OLLAMA_MEDIUM_MODEL=llama3.1:8b
OLLAMA_LARGE_MODEL=llama3.1:70b
TEMPORAL_ADDRESS=localhost:7233
```

## Setting Up Temporal

ROUGE uses Temporal for durable workflow orchestration. You need two things running:
1. A **Temporal server** (handles scheduling, retries, state)
2. The **ROUGE worker** (executes the actual workflow logic)

### Step 1: Install the Temporal CLI

Download the binary for your platform from [GitHub Releases](https://github.com/temporalio/cli/releases) or use the methods below.

#### macOS

```bash
# Homebrew (recommended)
brew install temporal

# Or download directly (Apple Silicon)
curl -L -o temporal.tar.gz "https://temporal.download/cli/archive/latest?platform=darwin&arch=arm64"
tar xzf temporal.tar.gz
sudo mv temporal /usr/local/bin/
rm temporal.tar.gz

# Intel Mac: use arch=amd64 instead of arch=arm64
```

#### Linux

```bash
# Download and install
curl -L -o temporal.tar.gz "https://temporal.download/cli/archive/latest?platform=linux&arch=amd64"
tar xzf temporal.tar.gz
sudo mv temporal /usr/local/bin/
rm temporal.tar.gz

# Or install to user directory (no sudo)
mkdir -p ~/.local/bin
mv temporal ~/.local/bin/
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### WSL (Windows Subsystem for Linux)

```bash
# Same as Linux - download the Linux binary
curl -L -o temporal.tar.gz "https://temporal.download/cli/archive/latest?platform=linux&arch=amd64"
tar xzf temporal.tar.gz
sudo mv temporal /usr/local/bin/
rm temporal.tar.gz
```

#### Windows (PowerShell)

```powershell
# Download the Windows binary
Invoke-WebRequest -Uri "https://temporal.download/cli/archive/latest?platform=windows&arch=amd64" -OutFile temporal.zip

# Extract to a folder
Expand-Archive temporal.zip -DestinationPath "$env:LOCALAPPDATA\temporal"
Remove-Item temporal.zip

# Add to PATH (current session)
$env:PATH += ";$env:LOCALAPPDATA\temporal"

# Add to PATH permanently (run once)
[Environment]::SetEnvironmentVariable("Path", $env:PATH + ";$env:LOCALAPPDATA\temporal", "User")
```

Alternatively, ROUGE includes an auto-downloader (`src/rouge/utils/temporal_downloader.py`) that downloads the Temporal CLI for Windows automatically on first run.

#### Verify installation

```bash
temporal --version
# Expected output: temporal version 1.x.x
```

### Step 2: Start the Temporal Dev Server

Open a **dedicated terminal** (this process stays running):

```bash
temporal server start-dev
```

This starts:
- gRPC server on `localhost:7233` (used by the worker and CLI)
- Web UI on `http://localhost:8233` (monitor workflows in your browser)

Options:

```bash
# Use a specific port
temporal server start-dev --port 7233

# Use a specific namespace
temporal server start-dev --namespace rouge

# Persist data across restarts (SQLite)
temporal server start-dev --db-filename temporal.db
```

### Step 3: Start the ROUGE Worker

Open a **second terminal**:

```bash
uv run -m rouge.temporal.worker
```

Expected output:

```
Connecting to Temporal at localhost:7233...
ROUGE Worker starting on localhost:7233...
Registered workflows: TestAutomation, InfrastructureProvisioning, CICDPipeline, UnifiedDevOps
```

The worker registers all four workflow types and listens on the `rouge-task-queue`.

### Step 4: Run ROUGE

Open a **third terminal** and launch the CLI:

```bash
uv run rouge -ollama -model llama3.1:8b
```

### Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `ConnectionRefused localhost:7233` | Temporal server not running | Run `temporal server start-dev` in a separate terminal |
| `temporal: command not found` | CLI not installed or not in PATH | Install using the instructions above for your OS |
| `Failed client connect` | Wrong address or firewall | Check `TEMPORAL_ADDRESS` in `.env` matches the server |
| Worker starts but workflows hang | Ollama not running | Start Ollama: `ollama serve` and pull a model: `ollama pull llama3.1:8b` |

### Terminal Layout

You need three terminals running simultaneously:

```
Terminal 1: temporal server start-dev          # Temporal server
Terminal 2: uv run -m rouge.temporal.worker    # ROUGE worker
Terminal 3: uv run rouge -ollama -model ...    # ROUGE CLI
```

## Architecture

ROUGE uses a multi-layered architecture:

```
+------------------------------------------------------+
|                    CLI (main.py)                      |
|  argparse commands: run | execute | list | deliverables|
+------------------------------------------------------+
         |                    |
         v                    v
+------------------+  +------------------+
|   Temporal       |  |   MCP Server     |
|   Workflows      |  |   (tools)        |
+------------------+  +------------------+
         |                    |
         v                    v
+------------------+  +------------------+
|   LangGraph      |  |  TestingTools    |
|   Agents (28)    |  |  DevOpsTools     |
+------------------+  +------------------+
         |
         v
+------------------+
|   Ollama (LLM)   |
+------------------+
```

1. **CLI Layer** (`main.py`): Parses commands, collects user input, starts workflows
2. **Orchestration Layer** (Temporal): Manages durable workflows with fault tolerance, retries, and parallel execution
3. **Reasoning Layer** (LangGraph): Powers intelligent agents with "Reason-Act" loops and tool-use
4. **Tooling Layer** (MCP + Tools): Provides agents with `TestingTools` and `DevOpsTools` for real operations
5. **Agent Layer**: 28 specialized agents organized into phases with dependency ordering

### Workflow Types

| Workflow | Class | Agents | Description |
|----------|-------|--------|-------------|
| `test` | `TestAutomationWorkflow` | 13 | End-to-end test automation pipeline |
| `infra` | `InfrastructureProvisioningWorkflow` | 8 | Infrastructure provisioning with IaC |
| `cicd` | `CICDPipelineWorkflow` | 7 | CI/CD pipeline design and deployment |
| `unified` | `UnifiedDevOpsWorkflow` | 28 | Complete DevOps automation (all three combined) |

Refer to [ARCHITECTURE.md](ARCHITECTURE.md) for a deep dive.

## Available Agents

### Testing Agents (13)

| Agent | Model Tier | Description |
|-------|-----------|-------------|
| `framework-builder` | large | Test framework architecture and scaffolding |
| `test-data-factory` | medium | Test data generation with Faker factories |
| `test-config-manager` | small | Test configuration and environment management |
| `ui-test-scripter` | large | Playwright/Selenium UI test generation |
| `api-test-engineer` | large | REST/GraphQL API test generation |
| `contract-tester` | medium | Consumer-driven contract testing (Pact) |
| `visual-regression` | medium | Visual regression testing with screenshots |
| `mobile-test-engineer` | large | Appium mobile test generation (iOS/Android) |
| `performance-tester` | large | k6/JMeter load and performance tests |
| `accessibility-tester` | medium | WCAG compliance testing with axe-core |
| `ci-integrator` | medium | CI/CD pipeline integration for test suites |
| `test-reporter` | medium | Test report generation (HTML, JUnit XML) |
| `flakiness-analyzer` | medium | Detect and fix flaky tests |

### DevOps Agents (15)

| Agent | Model Tier | Description |
|-------|-----------|-------------|
| `iac-engineer` | large | Terraform/Pulumi infrastructure code generation |
| `k8s-orchestrator` | large | Kubernetes manifests and Helm charts |
| `container-engineer` | medium | Dockerfile optimization and multi-stage builds |
| `config-automator` | medium | Ansible playbooks and configuration management |
| `pipeline-architect` | large | CI/CD pipeline design (GitHub Actions, Jenkins) |
| `deployment-strategist` | large | Blue/green, canary, and rolling deployments |
| `artifact-manager` | small | Container registry and artifact management |
| `monitoring-engineer` | medium | Prometheus metrics and alerting rules |
| `log-aggregator` | medium | ELK stack and log pipeline configuration |
| `dashboard-builder` | medium | Grafana dashboard generation |
| `incident-responder` | medium | Incident response runbooks and automation |
| `chaos-engineer` | medium | Chaos engineering experiments |
| `security-scanner` | medium | Vulnerability scanning and SAST/DAST |
| `compliance-auditor` | medium | Compliance-as-code and policy enforcement |
| `secrets-manager` | small | HashiCorp Vault and secrets rotation |

## MCP Tools

ROUGE agents use two tool classes via the Model Context Protocol:

### TestingTools

| Method | Description |
|--------|-------------|
| `execute_playwright_script()` | Run Playwright browser automation scripts |
| `run_pytest_suite()` | Execute pytest test suites with coverage |
| `run_api_test()` | Send HTTP requests and validate responses |
| `generate_test_data()` | Generate realistic test data with Faker |
| `compare_screenshots()` | Visual regression comparison |
| `run_lighthouse_audit()` | Performance and accessibility auditing |
| `run_contract_test()` | Consumer-driven contract testing |

### DevOpsTools

| Method | Description |
|--------|-------------|
| `terraform_init/plan/apply()` | Terraform lifecycle management |
| `kubectl_apply/get()` | Kubernetes resource management |
| `helm_install()` | Helm chart deployment |
| `docker_build/run()` | Docker image build and container execution |
| `github_actions_create()` | GitHub Actions workflow generation |
| `jenkins_create_job()` | Jenkins job configuration |
| `prometheus_query()` | PromQL metric queries |
| `grafana_create_dashboard()` | Grafana dashboard provisioning |
| `elasticsearch_query()` | ELK stack log queries |
| `ansible_playbook_run()` | Ansible playbook execution |
| `vault_read/write_secret()` | HashiCorp Vault secret management |

## Testing

ROUGE has a comprehensive test suite covering unit, integration, and end-to-end tests.

### Running Tests

```bash
# Run all tests
uv run pytest

# Run unit tests only
uv run pytest tests/test_unit_agents.py tests/test_unit_tools.py -v

# Run integration tests
uv run pytest tests/test_integration_workflows.py -v

# Run E2E tests
uv run pytest tests/test_e2e_full_automation.py -v

# Run with coverage report
uv run pytest --cov=src/rouge --cov-report=html --cov-report=term-missing

# Run tests in parallel
uv run pytest -n auto
```

### Test Structure

```
tests/
  conftest.py                      # Shared fixtures (temp dirs, mocks, tool instances)
  test_unit_agents.py              # 24 tests - agent registry, phases, prerequisites, naming
  test_unit_tools.py               # 14 tests - TestingTools and DevOpsTools methods
  test_integration_workflows.py    # 12 tests - Temporal workflow structure and execution
  test_e2e_full_automation.py      # 19 tests - full automation pipeline validation
  test_activities.py               #  1 test  - Temporal activity execution
  test_agent_logic.py              #  1 test  - agent reasoning logic
  test_config_parser.py            #  2 tests - configuration parsing
  test_prompt_manager.py           #  2 tests - prompt template loading
```

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/tests.yml`) runs on every push and PR:

| Job | Description |
|-----|-------------|
| `test` | Unit tests on Ubuntu, Windows, and macOS with Python 3.12 |
| `integration-test` | Integration and E2E tests on Ubuntu |
| `build-check` | Package build validation with `uv build` and `twine check` |
| `security-scan` | Dependency audit with `safety` and SAST with `bandit` |
| `all-tests-passed` | Gate job ensuring all required checks pass |

### Linting

```bash
# Run linting
uv run ruff check .

# Auto-fix linting errors
uv run ruff check . --fix

# Type checking
uv run mypy src/rouge --ignore-missing-imports
```

## Project Structure

```
rouge/
  src/rouge/
    main.py                        # CLI entry point (argparse, interactive mode)
    session_manager.py             # Agent registry (28 agents, phases, prerequisites)
    config/
      parser.py                    # RougeSettings (pydantic-settings, .env support)
    agents/
      ollama.py                    # LangGraphOllamaAgent (LangGraph + Ollama)
    temporal/
      workflows.py                 # 4 Temporal workflow definitions
      activities.py                # Temporal activity functions
      worker.py                    # Temporal worker registration
    tools/
      testing_tools.py             # TestingTools (Playwright, pytest, API, Faker)
      devops_tools.py              # DevOpsTools (Terraform, K8s, Docker, CI/CD)
    mcp/
      server.py                    # MCP server exposing tools to agents
      utils.py                     # MCP utilities
    types/
      models.py                    # AgentDefinition, PhaseName types
      temporal_types.py            # Workflow input/output dataclasses
    services/
      agent_execution.py           # Agent execution service
      git_manager.py               # Git operations
      prompt_manager.py            # Prompt template loading
    utils/
      temporal_downloader.py       # Temporal CLI auto-download
  prompts/
    testing/                       # 13 prompt templates for testing agents
    devops/                        # 15 prompt templates for DevOps agents
    shared/                        # Shared context files
  tests/                           # Unit, integration, and E2E tests
  .github/workflows/tests.yml     # CI/CD pipeline
  pyproject.toml                   # Dependencies and tool config
```

## License

ROUGE is released under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Temporal](https://temporal.io/) for durable workflow orchestration
- Powered by [LangGraph](https://github.com/langchain-ai/langgraph) for agentic AI
- Uses [Ollama](https://ollama.com/) for local LLM inference
- Integrates [Playwright](https://playwright.dev/) for browser automation
- Implements [MCP](https://modelcontextprotocol.io/) for tool integration
