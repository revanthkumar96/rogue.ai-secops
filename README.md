# NiRo.ai 🌸

NiRo.ai is an AI-powered DevOps and testing automation platform.
**Rouge-Secops to NiRo.ai**

Built for DevOps engineers and QA teams, NiRo.ai leverages multiple LLM providers to automate testing workflows, CI/CD operations, infrastructure management, and deployment orchestration.

[![PR Checks](https://github.com/revanthkumar96/rogue.ai-secops/actions/workflows/pr-checks.yml/badge.svg?branch=main)](https://github.com/revanthkumar96/rogue.ai-secops/actions/workflows/pr-checks.yml)
[![Release](https://img.shields.io/github/v/tag/revanthkumar96/rogue.ai-secops?label=release&color=0ea5e9)](https://github.com/revanthkumar96/rogue.ai-secops/tags)
[![Discussions](https://img.shields.io/badge/discussions-open-7c3aed)](https://github.com/revanthkumar96/rogue.ai-secops/discussions)
[![Security Policy](https://img.shields.io/badge/security-policy-0f766e)](SECURITY.md)
[![License](https://img.shields.io/badge/license-MIT-2563eb)](LICENSE)

[Quick Start](#quick-start) | [Setup Guides](#setup-guides) | [Providers](#supported-providers) | [Source Build](#source-build-and-local-development) | [VS Code Extension](#vs-code-extension) | [Community](#community)

## Why NiRo.ai

NiRo.ai orchestrates parallel intelligence across your infrastructure to accomplish complex tasks simultaneously.

- **DevOps-First Design**: Purpose-built for CI/CD pipelines, infrastructure automation, and deployment workflows
- **Testing Orchestration**: Automated test generation, execution, and analysis across multiple frameworks
- **Multi-Provider Support**: Works with OpenAI, Gemini, GitHub Models, Ollama, and other LLM providers
- **Infrastructure as Code**: Manage Terraform, Ansible, Kubernetes configs with AI assistance
- **Monitoring & Observability**: Automated log analysis, alert management, and incident response
- **Terminal-First Workflow**: Bash tools, file operations, agents, tasks, and MCP integration

## Quick Start

### Install

```bash
npm install -g @niro-ai/niro
```

If the install later reports `ripgrep not found`, install ripgrep system-wide and confirm `rg --version` works in the same terminal before starting NiRo.ai.

### Start

```bash
niro
```

Inside NiRo.ai:

- run `/provider` for guided provider setup and saved profiles
- run `/onboard-github` for GitHub Models onboarding

### Fastest OpenAI setup

macOS / Linux:

```bash
export NIRO_USE_OPENAI=1
export OPENAI_API_KEY=sk-your-key-here
export OPENAI_MODEL=gpt-4o

niro
```

Windows PowerShell:

```powershell
$env:NIRO_USE_OPENAI="1"
$env:OPENAI_API_KEY="sk-your-key-here"
$env:OPENAI_MODEL="gpt-4o"

niro
```

### Fastest local Ollama setup

macOS / Linux:

```bash
export NIRO_USE_OPENAI=1
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_MODEL=qwen2.5-coder:7b

niro
```

Windows PowerShell:

```powershell
$env:NIRO_USE_OPENAI="1"
$env:OPENAI_BASE_URL="http://localhost:11434/v1"
$env:OPENAI_MODEL="qwen2.5-coder:7b"

niro
```

## Setup Guides

Beginner-friendly guides:

- [Non-Technical Setup](docs/non-technical-setup.md)
- [Windows Quick Start](docs/quick-start-windows.md)
- [macOS / Linux Quick Start](docs/quick-start-mac-linux.md)

Advanced and source-build guides:

- [Advanced Setup](docs/advanced-setup.md)
- [Android Install](ANDROID_INSTALL.md)

## Supported Providers

| Provider | Setup Path | Notes |
| --- | --- | --- |
| OpenAI-compatible | `/provider` or env vars | Works with OpenAI, OpenRouter, DeepSeek, Groq, Mistral, LM Studio, and other compatible `/v1` servers |
| Gemini | `/provider` or env vars | Supports API key, access token, or local ADC workflow on current `main` |
| GitHub Models | `/onboard-github` | Interactive onboarding with saved credentials |
| Codex | `/provider` | Uses existing Codex credentials when available |
| Ollama | `/provider` or env vars | Local inference with no API key |
| Atomic Chat | advanced setup | Local Apple Silicon backend |
| Bedrock / Vertex / Foundry | env vars | Additional provider integrations for supported environments |

## DevOps & Testing Features

- **CI/CD Automation**: GitHub Actions, GitLab CI, Jenkins pipeline generation and troubleshooting
- **Test Orchestration**: Generate, execute, and analyze tests across Jest, Pytest, JUnit, and more
- **Infrastructure Management**: Terraform, Ansible, Kubernetes manifest generation and validation
- **Deployment Automation**: Docker, Kubernetes, cloud platform deployments with rollback support
- **Log Analysis**: Automated parsing and troubleshooting of application and system logs
- **Monitoring Integration**: Alert analysis, incident response automation, and performance optimization
- **Security Scanning**: Automated vulnerability detection and compliance checks
- **Streaming responses**: Real-time output for long-running operations
- **Provider profiles**: Multi-provider support with saved `.niro-profile.json` configurations

## Provider Notes

NiRo.ai supports multiple LLM providers optimized for DevOps and testing workflows.

- Different providers excel at different tasks (code analysis, log parsing, test generation)
- Tool quality depends heavily on the selected model
- Smaller local models may struggle with complex infrastructure configurations
- Some providers impose output limits that NiRo.ai adapts to automatically

For best DevOps results, use models with strong tool/function calling support and code understanding capabilities.

## Agent Routing

NiRo.ai can route different DevOps agents to different models through settings-based routing. This is useful for cost optimization or assigning specialized models to specific tasks.

Add to `~/.niro/settings.json`:

```json
{
  "agentModels": {
    "deepseek-chat": {
      "base_url": "https://api.deepseek.com/v1",
      "api_key": "sk-your-key"
    },
    "gpt-4o": {
      "base_url": "https://api.openai.com/v1",
      "api_key": "sk-your-key"
    }
  },
  "agentRouting": {
    "test-generation": "gpt-4o",
    "log-analysis": "deepseek-chat",
    "ci-cd-orchestration": "gpt-4o",
    "infrastructure-as-code": "deepseek-chat",
    "deployment-automation": "gpt-4o",
    "default": "gpt-4o"
  }
}
```

When no routing match is found, the global provider remains the fallback.

> **Note:** `api_key` values in `settings.json` are stored in plaintext. Keep this file private and do not commit it to version control.

## Documentation and Knowledge Search

NiRo.ai includes web search capabilities for DevOps documentation, troubleshooting guides, and API references.

By default, `WebSearch` works using DuckDuckGo for searching documentation, Stack Overflow, and vendor docs.

> **Note:** DuckDuckGo fallback may be rate-limited. For production DevOps workflows, configure Firecrawl for reliable documentation access.

`WebFetch` retrieves documentation, changelog files, and configuration examples from URLs.

Set a [Firecrawl](https://firecrawl.dev) API key if you want Firecrawl-powered search/fetch behavior:

```bash
export FIRECRAWL_API_KEY=your-key-here
```

With Firecrawl enabled:

- `WebSearch` can use Firecrawl's search API while DuckDuckGo remains the default free path for non-Claude models
- `WebFetch` uses Firecrawl's scrape endpoint instead of raw HTTP, handling JS-rendered pages correctly

Free tier at [firecrawl.dev](https://firecrawl.dev) includes 500 credits. The key is optional.

---

## Headless gRPC Server for CI/CD Integration

NiRo.ai can be run as a headless gRPC service, allowing integration into CI/CD pipelines, deployment systems, and custom DevOps dashboards. The server uses bidirectional streaming for real-time operation feedback and approval workflows.

### 1. Start the gRPC Server

Start the core engine as a gRPC service on `localhost:50051`:

```bash
npm run dev:grpc
```

#### Configuration

| Variable | Default | Description |
|-----------|-------------|------------------------------------------------|
| `GRPC_PORT` | `50051` | Port the gRPC server listens on |
| `GRPC_HOST` | `localhost` | Bind address. Use `0.0.0.0` to expose on all interfaces (not recommended without authentication) |

### 2. Run the Test CLI Client

We provide a lightweight CLI client that communicates exclusively over gRPC. It acts just like the main interactive CLI, rendering colors, streaming tokens, and prompting you for tool permissions (y/n) via the gRPC `action_required` event.

In a separate terminal, run:

```bash
npm run dev:grpc:cli
```

*Note: The gRPC definitions are located in `src/proto/niro.proto`. You can use this file to generate clients in Python, Go, Rust, or any other language for custom DevOps integrations.*

---

## Source Build And Local Development

```bash
bun install
bun run build
node dist/cli.mjs
```

Helpful commands:

- `bun run dev`
- `bun test`
- `bun run test:coverage`
- `bun run security:pr-scan -- --base origin/main`
- `bun run smoke`
- `bun run doctor:runtime`
- `bun run verify:privacy`
- focused `bun test ...` runs for the areas you touch

## Testing And Coverage

NiRo.ai uses Bun's built-in test runner for unit tests.

Run the full unit suite:

```bash
bun test
```

Generate unit test coverage:

```bash
bun run test:coverage
```

Open the visual coverage report:

```bash
open coverage/index.html
```

If you already have `coverage/lcov.info` and only want to rebuild the UI:

```bash
bun run test:coverage:ui
```

Use focused test runs when you only touch one area:

- `bun run test:provider`
- `bun run test:provider-recommendation`
- `bun test path/to/file.test.ts`

Recommended contributor validation before opening a PR:

- `bun run build`
- `bun run smoke`
- `bun run test:coverage` for broader unit coverage when your change affects shared runtime or provider logic
- focused `bun test ...` runs for the files and flows you changed

Coverage output is written to `coverage/lcov.info`, and NiRo.ai also generates a git-activity-style heatmap at `coverage/index.html`.
## Repository Structure

- `src/` - core CLI/runtime for DevOps automation
- `scripts/` - build, verification, and deployment scripts
- `docs/` - setup guides, DevOps workflows, and testing documentation
- `python/` - Python-based testing and automation helpers
- `vscode-extension/niro-vscode/` - VS Code extension for DevOps workflows
- `.github/` - CI/CD workflows and automation templates
- `bin/` - CLI launcher entrypoints

## VS Code Extension

The repo includes a VS Code extension in [`vscode-extension/niro-vscode`](vscode-extension/niro-vscode) for NiRo.ai DevOps workflow integration, test runner UI, and deployment management.

## Security

If you believe you found a security issue, see [SECURITY.md](SECURITY.md).

## Community

- Use [GitHub Discussions](https://github.com/Gitlawb/openclaude/discussions) for DevOps workflows, automation ideas, and community conversation
- Use [GitHub Issues](https://github.com/Gitlawb/openclaude/issues) for bugs, feature requests, and testing improvements

## Contributing

Contributions are welcome.

For larger changes, open an issue first so the scope is clear before implementation. Helpful validation commands include:

- `bun run build`
- `bun run test:coverage`
- `bun run smoke`
- focused `bun test ...` runs for touched areas

## Disclaimer

NiRo.ai is an independent DevOps automation project.

This project originated from open-source AI agent frameworks and has been specialized for DevOps and testing operations. See [LICENSE](LICENSE) for details.

## License

See [LICENSE](LICENSE).
