# Rouge Testing Guide

> How to test your Rouge installation

## Prerequisites

Make sure you have:
- ✅ Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- ✅ Ollama installed (`curl -fsSL https://ollama.ai/install.sh | sh`)
- ✅ Rouge dependencies installed (`bun install`)

## 1. Start Ollama

```bash
# Start Ollama service
ollama serve

# In another terminal, pull a model
ollama pull llama3.2:3b
```

## 2. Run Tests

### All Tests
```bash
cd packages/rouge
bun test
```

### Specific Test Files
```bash
# Test agent system
bun test src/test/agent.test.ts

# Test skills
bun test src/test/skill.test.ts

# Test abilities
bun test src/test/ability.test.ts

# Test config
bun test src/test/config.test.ts
```

Expected output:
```
✓ Agent System > should list all agents
✓ Agent System > should get agent capabilities
✓ Agent System > should load agent prompts
✓ Skill System > should list all skills
✓ Skill System > should get skill by ID
...
```

## 3. Test CLI Commands

### Check Version
```bash
bun run src/index.ts --version
# or
bun dev --version
```

Expected output:
```
0.1.0
```

### Check Status
```bash
bun dev status
```

Expected output:
```
Rouge Status
────────────

Ollama: ✅ Connected  (or ❌ Not available if Ollama isn't running)

Configuration
─────────────
Model: llama3.2:3b
Ollama URL: http://localhost:11434
Default Agent: test
Enabled Agents: test, deploy, monitor, analyze, ci-cd, security, performance, infrastructure, incident, database

Paths
─────
Config: /home/user/.config/rouge
Data: /home/user/.local/share/rouge
Logs: /home/user/.local/share/rouge/log
Cache: /home/user/.cache/rouge

Database
────────
Location: /home/user/.local/share/rouge/rouge.db
Status: ⚠️  Not initialized  (normal on first run)
```

### List Agents
```bash
bun dev list agents
```

Expected output:
```
Available Agents
────────────────

→ test
  • Test generation and execution

→ deploy
  • Deployment automation

→ monitor
  • System monitoring and alerting

→ analyze
  • Log and error analysis

→ ci-cd
  • CI/CD pipeline automation

→ security
  • Security scanning and compliance

→ performance
  • Performance and load testing

→ infrastructure
  • Infrastructure-as-Code management

→ incident
  • Incident response and troubleshooting

→ database
  • Database operations and optimization
```

### List Skills
```bash
bun dev list skills
```

Expected output:
```
Available Skills
────────────────

→ test:generate - Generate Tests
  • Generate test cases from specifications or existing code
  • Category: testing

→ test:execute - Execute Tests
  • Run test suites and collect results
  • Category: testing

...
```

### List Abilities
```bash
bun dev list abilities
```

Expected output shows all 28 abilities.

### Test Agent Connectivity
```bash
bun dev agent test
```

Expected output:
```
ℹ Testing Ollama connection...
✔ Ollama is available and ready
```

If Ollama isn't running:
```
ℹ Testing Ollama connection...
✖ Ollama is not available
ℹ Please start Ollama: ollama serve
```

## 4. Test Agent Execution

### Simple Test
```bash
bun dev agent run test "What is test-driven development?"
```

Expected output:
```
ℹ Running test agent...
✔ Agent completed successfully
Test-driven development (TDD) is a software development approach where...
[Agent response continues]
```

### With Streaming
```bash
bun dev agent run test "Explain unit testing" --stream
```

Output will stream in real-time.

### Test All Agents
```bash
# Test agent
bun dev agent run test "What are the benefits of automated testing?"

# Deploy agent
bun dev agent run deploy "Explain blue-green deployment strategy"

# CI/CD agent
bun dev agent run ci-cd "What is continuous integration?"

# Security agent
bun dev agent run security "Explain OWASP Top 10"

# Performance agent
bun dev agent run performance "What is load testing?"

# Infrastructure agent
bun dev agent run infrastructure "Explain Infrastructure-as-Code"

# Incident agent
bun dev agent run incident "How to respond to a production outage?"

# Database agent
bun dev agent run database "Explain database indexing"

# Monitor agent
bun dev agent run monitor "What metrics should I monitor?"

# Analyze agent
bun dev agent run analyze "How to analyze error logs?"
```

## 5. Test API Server

### Start Server
```bash
bun dev serve --port 3000
```

Expected output:
```
ℹ Starting server { port: 3000, hostname: '0.0.0.0' }
ℹ Server started { url: 'http://0.0.0.0:3000' }
```

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

Expected output:
```json
{"status":"ok","timestamp":1711065600000}
```

### Test Root Endpoint
```bash
curl http://localhost:3000/
```

Expected output:
```json
{
  "name":"Rouge API",
  "version":"0.1.0",
  "description":"DevOps & Testing Automation Platform"
}
```

### Test Agent List Endpoint
```bash
curl http://localhost:3000/agent
```

Expected output:
```json
{
  "agents":["test","deploy","monitor","analyze","ci-cd","security","performance","infrastructure","incident","database"]
}
```

### Test Agent Execution Endpoint
```bash
curl -X POST http://localhost:3000/agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "task": "What is unit testing?",
    "stream": false
  }'
```

Expected output:
```json
{
  "type":"test",
  "output":"Unit testing is...",
  "success":true,
  "metadata":{"model":"llama3.2:3b"}
}
```

### Test Config Endpoint
```bash
curl http://localhost:3000/config
```

Expected output:
```json
{
  "ollama":{"url":"http://localhost:11434","model":"llama3.2:3b","timeout":30000},
  "agents":{"default":"test","enabled":["test","deploy","monitor","analyze","ci-cd","security","performance","infrastructure","incident","database"],"maxConcurrent":5},
  "workflows":{"parallel":true,"timeout":3600,"retries":3},
  "permissions":{"deploy":"ask","test":"allow","bash":"ask"}
}
```

## 6. Test Web UI (Optional)

### Start Web Dev Server
```bash
cd packages/web
bun install
bun dev
```

Expected output:
```
VITE v6.0.11  ready in XXX ms

➜  Local:   http://localhost:3001/
➜  Network: use --host to expose
```

### Open in Browser
Visit http://localhost:3001

You should see:
- Rouge dashboard
- Connected status indicator (green if API server is running)
- List of 10 agents
- Sidebar navigation
- Stats cards

## 7. Integration Test

Run everything together:

### Terminal 1: Start Ollama
```bash
ollama serve
```

### Terminal 2: Start API Server
```bash
cd packages/rouge
bun dev serve
```

### Terminal 3: Start Web UI
```bash
cd packages/web
bun dev
```

### Terminal 4: Test Agent
```bash
cd packages/rouge
bun dev agent run test "Generate a simple test case"
```

### Check Web UI
Open http://localhost:3001 and verify:
- ✅ Connection status is green
- ✅ Dashboard shows 10 agents
- ✅ All stats are displayed

## 8. Common Issues

### Ollama Not Available
**Error**: `Ollama is not available`

**Solution**:
```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/version
```

### Port Already in Use
**Error**: `Error: EADDRINUSE: address already in use`

**Solution**:
```bash
# Use a different port
bun dev serve --port 3001
```

### Module Not Found
**Error**: `Cannot find module`

**Solution**:
```bash
# Install dependencies
bun install
```

### Database Permission Error
**Error**: `EACCES: permission denied`

**Solution**:
```bash
# Create data directory
mkdir -p ~/.local/share/rouge
chmod 755 ~/.local/share/rouge
```

## 9. Smoke Test Script

Create a file `test-rouge.sh`:

```bash
#!/bin/bash

echo "🧪 Rouge Smoke Test"
echo

# Check Ollama
echo "1. Checking Ollama..."
curl -s http://localhost:11434/api/version > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Ollama is running"
else
    echo "   ❌ Ollama is not running"
    exit 1
fi

# Check CLI
echo "2. Checking CLI..."
bun run packages/rouge/src/index.ts --version > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ CLI works"
else
    echo "   ❌ CLI failed"
    exit 1
fi

# Run tests
echo "3. Running tests..."
cd packages/rouge && bun test > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Tests passed"
else
    echo "   ❌ Tests failed"
    exit 1
fi

# Test API
echo "4. Testing API..."
cd ../..
bun run packages/rouge/src/index.ts serve &
SERVER_PID=$!
sleep 2
curl -s http://localhost:3000/health > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ API server works"
else
    echo "   ❌ API server failed"
    kill $SERVER_PID
    exit 1
fi
kill $SERVER_PID

echo
echo "✅ All tests passed!"
```

Run it:
```bash
chmod +x test-rouge.sh
./test-rouge.sh
```

## 10. Success Criteria

Your Rouge installation is working correctly if:

✅ All unit tests pass (agent, skill, ability, config)
✅ CLI commands work (version, status, list, agent)
✅ Agent connectivity test succeeds
✅ At least one agent can execute a task successfully
✅ API server starts and responds to health checks
✅ Web UI loads and shows connected status
✅ No error messages in logs

## Next Steps

Once testing is complete:

1. ✅ Configure Ollama model: `ollama pull llama3.2:3b`
2. ✅ Create config file: Edit `~/.config/rouge/config.json`
3. ✅ Try different agents with real tasks
4. ✅ Explore the web dashboard
5. ✅ Read the docs in `docs/` directory

---

*Complete Testing Guide*
*Rouge DevOps Automation Platform*
*Date: 2026-03-21*
