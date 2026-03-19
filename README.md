# ROUGE: DevOps & Testing Automation Platform

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-blue.svg" alt="Python Version">
  <img src="https://img.shields.io/badge/LLM-Ollama-orange.svg" alt="LLM Provider">
  <img src="https://img.shields.io/badge/Orchestration-Temporal-red.svg" alt="Orchestration">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</p>

ROUGE is an AI-powered DevOps and Testing Automation platform that combines intelligent agents with durable workflow orchestration to automate testing, infrastructure provisioning, CI/CD pipelines, and observability setup. It uses **Temporal** for fault-tolerant orchestration and **LangGraph** for agentic reasoning, all powered by local **Ollama** models for complete privacy.

## 🚀 Key Features

- **Intelligent Test Generation**: AI agents write comprehensive Playwright UI tests, REST API tests, mobile tests, and performance tests
- **Infrastructure as Code**: Automated Terraform/Pulumi generation for AWS, Azure, GCP, and Kubernetes
- **CI/CD Pipeline Creation**: Auto-generate GitHub Actions, Jenkins, and GitLab CI pipelines with quality gates
- **Observability Setup**: Configure Prometheus, Grafana, and ELK stack monitoring automatically
- **Local AI Reasoning**: Powered by **Ollama** using local models like Llama 3 for complete privacy
- **Durable Orchestration**: Built on **Temporal Python SDK**, ensuring fault-tolerant and parallel execution
- **Agentic Loop**: Uses **LangGraph** for sophisticated "Reason-Act" cycles with tool-use capabilities
- **MCP Integration**: Uses the **Model Context Protocol** to provide agents with testing, DevOps, and infrastructure tools

## 🎯 Use Cases

- **QA Teams**: Generate comprehensive test suites in minutes instead of days
- **DevOps Engineers**: Automate infrastructure provisioning and configuration
- **Platform Teams**: Set up observability stacks and monitoring dashboards
- **Security Teams**: Integrate security scanning and compliance checks into CI/CD pipelines
- **Development Teams**: Create test automation frameworks and CI/CD pipelines for new projects

## 🛠️ Quick Start

### 1. Prerequisites

- Python 3.12+
- [uv](https://astral.sh/uv/) for package management
- [Ollama](https://ollama.com/) running locally with a suitable model (e.g., `llama3.1:8b`)
- [Temporal Server](https://docs.temporal.io/dev-guide/python/foundations#run-a-temporal-service) (local or cloud)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/rouge.git
cd rouge

# Install dependencies
uv sync

# Install Playwright browsers
uv run playwright install
```

### 3. Start Temporal Worker

```bash
# Start the Temporal worker (in a separate terminal)
uv run -m rouge.temporal.worker
```

### 4. Usage Examples

#### Testing Automation

Generate a complete test suite with UI, API, and performance tests:

```bash
uv run rouge test \
  --app https://myapp.com \
  --types ui,api,performance \
  --framework playwright \
  --ci github-actions
```

#### Infrastructure Provisioning

Provision a Kubernetes cluster on AWS with monitoring:

```bash
uv run rouge infra \
  --provider aws \
  --type kubernetes \
  --env production \
  --observability prometheus,grafana,elk
```

#### CI/CD Pipeline Creation

Create a CI/CD pipeline with blue/green deployment:

```bash
uv run rouge cicd \
  --platform github-actions \
  --strategy blue-green \
  --enable-security-scan
```

#### Unified DevOps Workflow

Run a complete end-to-end DevOps automation:

```bash
uv run rouge unified \
  --app https://myapp.com \
  --provider aws \
  --infra kubernetes \
  --tests ui,api,performance \
  --ci github-actions \
  --deployment canary
```

## 🏗️ Architecture

ROUGE uses a multi-layered architecture:

1. **Orchestration Layer (Temporal)**: Manages durable workflows with fault tolerance
2. **Reasoning Layer (LangGraph)**: Powers intelligent agents with tool-use capabilities
3. **Tooling Layer (MCP)**: Provides agents with testing, DevOps, and infrastructure tools
4. **Agent Layer**: 28 specialized agents for testing, infrastructure, CI/CD, and observability

### Workflow Types

- **TestAutomationWorkflow**: End-to-end test automation pipeline
- **InfrastructureProvisioningWorkflow**: Automated infrastructure setup
- **CICDPipelineWorkflow**: CI/CD pipeline design and implementation
- **UnifiedDevOpsWorkflow**: Complete DevOps automation

Refer to [ARCHITECTURE.md](ARCHITECTURE.md) for a deep dive into how ROUGE works.

## 📋 Available Agents

### Testing Agents (13)
- **Framework & Architecture**: framework-builder, test-data-factory, test-config-manager
- **Web & API Testing**: ui-test-scripter, api-test-engineer, contract-tester, visual-regression
- **Specialized Testing**: mobile-test-engineer, performance-tester, accessibility-tester
- **CI/CD Integration**: ci-integrator, test-reporter, flakiness-analyzer

### DevOps Agents (15)
- **Infrastructure**: iac-engineer, k8s-orchestrator, container-engineer, config-automator
- **CI/CD Pipelines**: pipeline-architect, deployment-strategist, artifact-manager
- **Observability**: monitoring-engineer, log-aggregator, dashboard-builder, incident-responder, chaos-engineer
- **Security**: security-scanner, compliance-auditor, secrets-manager

## 🧪 Testing Infrastructure

ROUGE includes comprehensive testing capabilities:

- **UI Testing**: Playwright/Selenium browser automation with cross-browser support
- **API Testing**: REST/GraphQL validation, contract testing with Pact
- **Mobile Testing**: Appium integration for iOS and Android
- **Performance Testing**: k6 and JMeter load testing scripts
- **Accessibility Testing**: WCAG compliance with axe-core
- **Visual Regression**: Pixel-perfect validation with Applitools

## ⚙️ DevOps Capabilities

ROUGE automates DevOps workflows:

- **Infrastructure as Code**: Terraform, Pulumi, CloudFormation generation
- **Container Orchestration**: Kubernetes manifests, Helm charts, Docker optimization
- **CI/CD Pipelines**: GitHub Actions, Jenkins, GitLab CI configuration
- **Deployment Strategies**: Blue/green, canary, rolling updates, automated rollbacks
- **Observability**: Prometheus metrics, Grafana dashboards, ELK stack setup
- **Security**: Vulnerability scanning, compliance as code, secrets management

## 📚 Documentation

- [Architecture Overview](ARCHITECTURE.md) - System design and components
- [Contributing Guide](CONTRIBUTING.md) - Development setup and guidelines
- [User Guide](docs/guides/testing-automation.md) - Step-by-step tutorials

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Local development setup
- Code style guidelines
- Testing requirements
- Pull request process

## 🛡️ License

ROUGE is released under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Temporal](https://temporal.io/) for durable workflow orchestration
- Powered by [LangGraph](https://github.com/langchain-ai/langgraph) for agentic AI
- Uses [Ollama](https://ollama.com/) for local LLM inference
- Integrates [Playwright](https://playwright.dev/) for browser automation
- Implements [MCP](https://modelcontextprotocol.io/) for tool integration
