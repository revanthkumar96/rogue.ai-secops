# Rouge - DevOps & Testing Automation Platform

> AI-powered automation for DevOps workflows and software testing using local LLMs

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.8+-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Runtime-Bun-orange.svg" alt="Bun">
  <img src="https://img.shields.io/badge/AI-Ollama-green.svg" alt="Ollama">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
</p>

## Overview

Rouge is a modern DevOps and testing automation platform that uses local LLMs (via Ollama) to provide intelligent automation for infrastructure management, test generation, deployment workflows, and system monitoring.

**Key Features:**
- 🤖 **AI-Powered Automation** - Local LLM reasoning for intelligent decisions
- 🧪 **Test Automation** - Generate and execute tests automatically
- 🚀 **Deployment Workflows** - Automated deployment pipelines
- 📊 **System Monitoring** - Log analysis and alerting
- 🔒 **Privacy-First** - All AI processing happens locally
- ⚡ **Fast & Modern** - Built on Bun and TypeScript
- 🎯 **10 Specialized Agents** - Purpose-built for DevOps tasks
- 🛠️ **11 Reusable Skills** - Composable automation operations
- 🔐 **28 Fine-Grained Abilities** - Granular permission control

## Architecture

**Modern TypeScript Monorepo:**

```
rouge/
├── packages/
│   ├── rouge/         # Main CLI & API server
│   ├── web/           # Web dashboard (SolidJS)
│   └── shared/        # Shared types and schemas
```

**Tech Stack:**
- **Runtime**: Bun 1.3+
- **Language**: TypeScript (strict mode)
- **CLI**: yargs command router
- **API**: Hono web framework
- **Database**: SQLite + Drizzle ORM
- **AI**: Ollama (local LLM server)
- **Web**: SolidJS + Vite

## Installation

### Prerequisites

```bash
# 1. Install Bun
curl -fsSL https://bun.sh/install | bash

# 2. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 3. Pull AI model
ollama pull llama3.2:3b
```

### Quick Start

```bash
# Clone repository
cd rouge

# Install dependencies
bun install

# Start interactive mode
rouge

# Or start API server
rouge serve

# Or start web UI
cd packages/web && bun dev
```

## Commands

### Interactive Mode

```bash
rouge                    # Start interactive CLI mode
```

Features:
- Model selection (choose from available Ollama models)
- Agent selection (10 specialized DevOps agents)
- Task execution with real-time feedback
- Configuration management
- Connection testing

### Core Commands

```bash
rouge --help             # Show help
rouge --version          # Show version
rouge status             # System status
rouge list agents        # List available agents
rouge list skills        # List skills
rouge serve              # Start API server
```

### Agent Management

```bash
# List all agents
rouge agent list

# Get agent capabilities
rouge agent test

# Execute agent task
rouge agent run test "Generate unit tests for authentication"
rouge agent run deploy "Explain canary deployment strategy"
rouge agent run security "Scan for OWASP vulnerabilities"
```

### Test Automation

```bash
rouge test               # Run test suite
```

### Workflow Management

```bash
rouge workflow list      # List workflows
rouge workflow create    # Create workflow
rouge workflow run <id>  # Execute workflow
```

### Deployment

```bash
rouge deploy validate    # Validate configuration
rouge deploy run         # Deploy application
```

### Configuration

```bash
rouge config show        # Show configuration
rouge config set         # Update configuration
```

## Agent System

Rouge includes **10 specialized DevOps agents**:

| Agent | Purpose | Key Capabilities |
|-------|---------|------------------|
| **test** | Test generation & execution | Unit tests, integration tests, test analysis |
| **deploy** | Deployment automation | Blue-green, canary, rolling deployments |
| **monitor** | System monitoring | Metrics, logs, alerts, dashboards |
| **analyze** | Log & error analysis | Root cause analysis, trend detection |
| **ci-cd** | Pipeline automation | Build, test, deploy pipelines |
| **security** | Security scanning | Vulnerability scanning, compliance checks |
| **performance** | Performance testing | Load testing, bottleneck analysis |
| **infrastructure** | Infrastructure management | Provisioning, configuration, IaC |
| **incident** | Incident response | Diagnosis, mitigation, postmortems |
| **database** | Database operations | Migrations, backups, optimization |

### Example Usage

```bash
# Generate unit tests
rouge agent run test "Generate tests for user authentication module"

# Analyze deployment strategy
rouge agent run deploy "Design a canary deployment for microservices"

# Security scan
rouge agent run security "Check for SQL injection vulnerabilities"

# Performance analysis
rouge agent run performance "Analyze API response times"

# Infrastructure setup
rouge agent run infrastructure "Create Kubernetes cluster configuration"
```

## Skills System

**11 Reusable Skills** across 7 categories:

### Testing
- **execute-tests**: Run test suites with coverage
- **generate-tests**: Generate test cases from code

### Deployment
- **deploy-application**: Deploy to environments
- **rollback-deployment**: Revert deployments
- **validate-config**: Validate configuration files

### Monitoring
- **check-health**: Health check endpoints
- **analyze-logs**: Parse and analyze logs
- **send-alerts**: Send monitoring alerts

### Infrastructure
- **provision-infra**: Provision cloud resources
- **configure-service**: Configure services

### Analysis
- **analyze-metrics**: Analyze system metrics

## Abilities System

**28 Fine-Grained Abilities** for permission control:

- File operations (read, write, execute)
- Network access (http, ssh, database)
- System commands (bash, docker, kubernetes)
- Cloud operations (aws, azure, gcp)
- Security scanning (vulnerability, compliance)
- And more...

Each agent has specific abilities mapped to their role.

## Use Cases

### 1. Test Automation
```bash
# Interactive mode
rouge
# Select: test agent
# Task: "Generate unit tests for user authentication"

# Or direct execution
rouge agent run test "Create integration tests for payment API"
```

### 2. Deployment Automation
```bash
# Validate deployment configuration
rouge deploy validate

# Deploy with monitoring
rouge agent run deploy "Deploy to production with health checks"
```

### 3. Infrastructure Management
```bash
# Provision infrastructure
rouge agent run infrastructure "Create AWS EKS cluster with monitoring"

# Configure Kubernetes
rouge agent run infrastructure "Set up Prometheus and Grafana"
```

### 4. Security & Compliance
```bash
# Security scan
rouge agent run security "Scan Docker images for vulnerabilities"

# Compliance check
rouge agent run security "Verify GDPR compliance for data processing"
```

### 5. Performance Optimization
```bash
# Load testing
rouge agent run performance "Generate load test for 10k concurrent users"

# Bottleneck analysis
rouge agent run performance "Identify database query bottlenecks"
```

### 6. Incident Response
```bash
# Diagnose issue
rouge agent run incident "Analyze 5xx errors in production logs"

# Root cause analysis
rouge agent run analyze "Find root cause of memory leak"
```

## Web Dashboard

Access the web UI at `http://localhost:3001`

**Features:**
- First-time setup wizard
- Agent execution interface
- Workflow management
- System configuration
- Real-time connection status

**Pages:**
- **Dashboard**: System overview and stats
- **Agents**: Execute agents with task input
- **Workflows**: Create and manage workflows
- **Settings**: Configure Ollama, agents, permissions

## Project Structure

```
rouge/
├── packages/
│   ├── rouge/              # Main package
│   │   ├── src/
│   │   │   ├── index.ts    # CLI entry point
│   │   │   ├── cli/        # CLI commands and UI
│   │   │   ├── server/     # REST API server
│   │   │   ├── agent/      # Agent system + prompts
│   │   │   ├── skill/      # Skills system
│   │   │   ├── ability/    # Abilities system
│   │   │   ├── tool/       # Tool implementations
│   │   │   ├── storage/    # Database schemas
│   │   │   ├── provider/   # LLM providers (Ollama)
│   │   │   ├── config/     # Configuration management
│   │   │   ├── test/       # Unit tests
│   │   │   └── util/       # Utilities
│   │   └── package.json
│   │
│   ├── web/                # Web dashboard
│   │   ├── src/
│   │   │   ├── components/ # UI components
│   │   │   ├── pages/      # Dashboard pages
│   │   │   ├── lib/        # API client
│   │   │   └── index.tsx   # App entry
│   │   └── package.json
│   │
│   └── shared/             # Shared types
│       ├── src/types.ts    # Zod schemas
│       └── package.json
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── INTERACTIVE_MODE.md
│   ├── QUICKSTART.md
│   ├── SETUP.md
│   ├── SKILLS_AND_ABILITIES.md
│   └── ...
│
├── bunfig.toml            # Bun configuration
├── turbo.json             # Turborepo configuration
├── package.json           # Workspace root
└── README.md              # This file
```

## Development

```bash
# Start development server (API)
cd packages/rouge
bun dev serve

# Start web UI
cd packages/web
bun dev

# Type checking
bun typecheck

# Run tests
cd packages/rouge
bun test

# Build all packages
bun build
```

## Configuration

Create `~/.config/rouge/config.json`:

```json
{
  "ollama": {
    "url": "http://localhost:11434",
    "model": "llama3.2:3b",
    "timeout": 30000
  },
  "agents": {
    "default": "test",
    "enabled": ["test", "deploy", "monitor", "analyze"],
    "maxConcurrent": 5
  },
  "workflows": {
    "parallel": true,
    "timeout": 3600,
    "retries": 3
  },
  "permissions": {
    "deploy": "ask",
    "test": "allow",
    "bash": "ask"
  }
}
```

## Testing

```bash
# Run all tests
cd packages/rouge
bun test

# Test specific module
bun test src/test/agent.test.ts

# Test with coverage
bun test --coverage
```

**Test Suites:**
- Agent system tests
- Skills system tests
- Abilities system tests
- Configuration tests

## API Reference

The REST API runs on `http://localhost:3000`

**Endpoints:**
- `GET /health` - Health check
- `GET /api/agents` - List agents
- `POST /api/agent/execute` - Execute agent
- `GET /api/config` - Get configuration
- `PUT /api/config` - Update configuration
- `GET /api/workflows` - List workflows
- `POST /api/workflow/:id/execute` - Execute workflow
- And more...

See [API_REFERENCE.md](./docs/API_REFERENCE.md) for full documentation.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and components
- [API Reference](./docs/API_REFERENCE.md) - REST API documentation
- [Interactive Mode](./docs/INTERACTIVE_MODE.md) - CLI and Web setup
- [Quick Start](./docs/QUICKSTART.md) - Get started quickly
- [Setup Guide](./docs/SETUP.md) - Installation and configuration
- [Skills & Abilities](./docs/SKILLS_AND_ABILITIES.md) - System capabilities
- [Testing Guide](./docs/TESTING_INTERACTIVE_MODE.md) - Testing instructions

## Features

### ✅ Implemented
- 10 specialized DevOps agents with detailed prompts
- 11 reusable skills across 7 categories
- 28 fine-grained abilities for permission control
- Interactive CLI mode with menu system
- Web UI with setup wizard
- REST API server
- Agent execution engine
- Configuration management
- SQLite database with Drizzle ORM
- Ollama integration
- Type-safe schemas with Zod

### 🚧 In Progress
- Workflow orchestration engine
- Real-time monitoring dashboard
- Advanced deployment strategies

### 📋 Planned
- Custom agent creation
- Plugin system
- CI/CD integration
- Team collaboration features
- Cloud deployment options

## Roadmap

### Phase 1: Foundation ✅
- [x] Project structure
- [x] CLI foundation (12 commands)
- [x] Interactive mode
- [x] Web UI (4 pages)
- [x] Agent system (10 agents)
- [x] Skills system (11 skills)
- [x] Abilities system (28 abilities)
- [x] API server
- [x] Database schema

### Phase 2: Automation Engine
- [ ] Workflow orchestration
- [ ] Test generation engine
- [ ] Deployment automation
- [ ] Log analysis engine

### Phase 3: Advanced Features
- [ ] Real-time monitoring
- [ ] Advanced dashboards
- [ ] Team collaboration
- [ ] Custom agents

### Phase 4: Enterprise
- [ ] Multi-tenancy
- [ ] RBAC
- [ ] Audit logging
- [ ] Cloud deployment

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Status

🚀 **Phase 1 Complete** - Ready for testing and feedback

---

**Built for DevOps engineers and QA teams who value local-first AI tooling.**
