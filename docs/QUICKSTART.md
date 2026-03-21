# Rouge Quickstart

> Get Rouge up and running in 5 minutes

## Setup

### 1. Install Dependencies

```bash
cd rouge
bun install
```

### 2. Start Ollama

```bash
# Terminal 1
ollama serve
```

### 3. Pull AI Model

```bash
# Terminal 2
ollama pull llama3.2:3b
```

## Test CLI

### Check Installation

```bash
cd packages/rouge

# Show version
bun dev --version

# Check status
bun dev status

# List agents
bun dev list agents
```

### Test Agent

```bash
# Simple question
bun dev agent run test "What is test-driven development?"

# Real task
bun dev agent run test "Generate unit test structure for a REST API"

# With streaming
bun dev agent run deploy "Explain blue-green deployment" --stream
```

## Test API

### Start Server

```bash
# Terminal 3 (from packages/rouge)
bun dev serve
```

### Test Endpoints

```bash
# Health check
curl http://localhost:3000/health

# List agents
curl http://localhost:3000/agent

# Execute agent
curl -X POST http://localhost:3000/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"type":"test","task":"What is unit testing?"}'
```

## Test Web UI

### Start Web Server

```bash
# Terminal 4
cd packages/web
bun install
bun dev
```

### Open Browser

Visit: http://localhost:3001

You should see:
- ✅ Rouge dashboard
- ✅ Connected status (green dot)
- ✅ 10 agents listed
- ✅ Navigation sidebar

## Run Tests

```bash
cd packages/rouge
bun test
```

Expected: All tests pass ✅

## Try All Agents

```bash
bun dev agent run test "Generate test cases"
bun dev agent run deploy "Deploy strategies"
bun dev agent run ci-cd "CI/CD best practices"
bun dev agent run security "OWASP Top 10"
bun dev agent run performance "Load testing basics"
bun dev agent run infrastructure "IaC with Terraform"
bun dev agent run incident "Incident response steps"
bun dev agent run database "Database optimization"
bun dev agent run monitor "Monitoring metrics"
bun dev agent run analyze "Log analysis techniques"
```

## Configuration

Edit `~/.config/rouge/config.json`:

```json
{
  "ollama": {
    "url": "http://localhost:11434",
    "model": "llama3.2:3b"
  },
  "agents": {
    "default": "test",
    "enabled": ["test", "deploy", "monitor", "analyze"]
  }
}
```

## What's Working

✅ **10 Agents** - All with specialized prompts
✅ **11 Skills** - Reusable DevOps operations
✅ **28 Abilities** - Fine-grained capabilities
✅ **CLI Commands** - version, status, list, agent, serve
✅ **API Server** - REST endpoints with Hono
✅ **Web Dashboard** - SolidJS UI with real-time updates
✅ **Test Suite** - Complete unit tests
✅ **Documentation** - Comprehensive guides

## Need Help?

See `TEST_GUIDE.md` for detailed testing instructions.

## Quick Commands Reference

```bash
# CLI
bun dev --version          # Show version
bun dev status             # Show status
bun dev list agents        # List agents
bun dev list skills        # List skills
bun dev agent test         # Test Ollama
bun dev agent run <type> "<task>"  # Run agent

# API
bun dev serve              # Start server
bun dev serve --port 3001  # Custom port

# Web
cd packages/web && bun dev # Start web UI

# Tests
cd packages/rouge && bun test  # Run all tests
```

---

*Ready to go!*
*Start with: `bun dev status`*
