# ROUGE: Autonomous AI Pentester

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-blue.svg" alt="Python Version">
  <img src="https://img.shields.io/badge/LLM-Ollama-orange.svg" alt="LLM Provider">
  <img src="https://img.shields.io/badge/Orchestration-Temporal-red.svg" alt="Orchestration">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</p>

ROUGE is a Python-native, autonomous penetration testing framework designed to discover and exploit web vulnerabilities. It combines **Temporal's** durable workflow orchestration with **LangGraph's** agentic reasoning to provide a robust, end-to-end security assessment pipeline.

## 🚀 Key Features

- **Local AI Reasoning**: Powered by **Ollama** using local models like Llama 3 for complete privacy.
- **Agentic Loop**: Uses **LangGraph** for sophisticated "Reason-Act" cycles with tool-use capabilities.
- **Durable Orchestration**: Built on the **Temporal Python SDK**, ensuring fault-tolerant and parallel execution.
- **MCP Integration**: Uses the **Model Context Protocol** to provide agents with system tools like filesystem access and TOTP generation.
- **Browser Automation**: Integrated with **Playwright** for dynamic analysis of modern web applications.

## 🛠️ Quick Start

### 1. Prerequisites

- Python 3.12+
- [uv](https://astral.sh/uv/) for package management.
- [Ollama](https://ollama.com/) running locally.
- [Temporal Server](https://docs.temporal.io/dev-guide/python/foundations#run-a-temporal-service) (local or cloud).

### 2. Installation

```bash
uv sync
uv run playwright install
```

### 3. Usage

Start the Temporal worker:
```bash
uv run -m rouge.temporal.worker
```

Launch a pentest:
```bash
uv run rouge start URL=https://example.com REPO=./repos/my-repo
```

## 🏗️ Architecture

Refer to [ARCHITECTURE.md](ARCHITECTURE.md) for a deep dive into how ROUGE works.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for local development setup and guidelines.

## 🛡️ License

ROUGE is released under the [MIT License](LICENSE).
