# Phase 1 - Complete Running Guide

> Comprehensive guide to running all Phase 1 components: CLI, Web UI, and API Server

## Overview

Phase 1 includes:
- ✅ **CLI Application** - Terminal-based interface with 12 commands
- ✅ **Web UI** - Browser-based dashboard (SolidJS)
- ✅ **API Server** - REST API for automation (Hono)
- ✅ **10 Agents** - Specialized DevOps agents
- ✅ **11 Skills** - Reusable operations
- ✅ **28 Abilities** - Permission system

**Note:** Desktop application is planned for Phase 2/3. Phase 1 focuses on CLI and Web.

---

## Prerequisites

### 1. Install Bun Runtime

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Verify installation
bun --version  # Should show 1.3.0 or higher
```

### 2. Install Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from: https://ollama.ai/download/windows

# Verify installation
ollama --version
```

### 3. Pull AI Model

```bash
# Start Ollama service
ollama serve

# In another terminal, pull model
ollama pull llama3.2:3b

# Verify model is available
ollama list
```

**Recommended Models:**
- `llama3.2:3b` - Fast, lightweight (2GB) - **Recommended for testing**
- `llama3.2:1b` - Ultra-fast (1GB) - Good for quick tasks
- `llama3:8b` - More capable (4.7GB) - Better responses
- `llama3:70b` - Most capable (40GB) - Production quality

### 4. Clone and Install Rouge

```bash
# Clone repository
git clone <repository-url>
cd rouge

# Install dependencies
bun install

# Verify installation
cd packages/rouge
bun dev --version
```

---

## Running CLI Application

### Basic Usage

```bash
cd packages/rouge

# Show help
bun dev --help

# Show version
bun dev --version

# Check system status
bun dev status
```

### Interactive Mode

```bash
# Start interactive mode
bun dev

# You'll see:
# 1. Welcome screen with Rouge logo
# 2. Automatic Ollama connection test
# 3. Interactive menu with 6 options
```

**Interactive Mode Features:**
1. **Change Ollama Model** - Select from available models
2. **Select Agent** - Choose from 10 agents
3. **Execute Agent Task** - Run tasks with real-time feedback
4. **Test Connection** - Verify Ollama connectivity
5. **View Configuration** - See all settings
6. **List All Agents** - Browse agent capabilities
q. **Quit** - Exit interactive mode

**Example Session:**
```bash
$ bun dev

╦═╗╔═╗╦ ╦╔═╗╦ ╦╔═╗
╠╦╝║ ║║ ║║ ║║ ║║╣
╩╚═╚═╝╚═╝╚═╝╚═╝╚═╝
DevOps & Testing Automation Platform

Interactive Mode
────────────────

ℹ Welcome to Rouge DevOps Automation!

⠋ Testing Ollama connection
✔ Connected to Ollama

──────────────────────────────────────────────────

Current Settings:
  Model: llama3.2:3b
  Agent: test
  Status: ✅ Connected

──────────────────────────────────────────────────

Options:
  • 1. Change Ollama Model
  • 2. Select Agent
  • 3. Execute Agent Task
  • 4. Test Connection
  • 5. View Configuration
  • 6. List All Agents
  • q. Quit

Select option (or 'q' to quit): 3

Execute test Agent
──────────────────

Enter task: Generate unit tests for authentication

⠋ Executing test agent
✔ Task completed

──────────────────────────────────────────────────

[Agent output displays here]

──────────────────────────────────────────────────
```

### Direct Commands

#### System Commands

```bash
# Show version
bun dev --version

# Check system status
bun dev status
# Shows: Ollama connection, config path, database status

# Show help for specific command
bun dev help agent
```

#### List Resources

```bash
# List all agents
bun dev list agents

# List all skills
bun dev list skills

# List skills by category
bun dev list skills --category testing
bun dev list skills --category deployment
bun dev list skills --category monitoring

# List all abilities
bun dev list abilities
```

#### Agent Operations

```bash
# Test agent connection
bun dev agent test

# List agents with descriptions
bun dev agent list

# Execute agent task
bun dev agent run test "Generate unit tests for user service"
bun dev agent run deploy "Explain canary deployment strategy"
bun dev agent run security "What are the OWASP Top 10 vulnerabilities?"
bun dev agent run performance "How to perform load testing?"
bun dev agent run infrastructure "Create Terraform configuration for AWS"
bun dev agent run incident "How to diagnose high memory usage?"
bun dev agent run database "Optimize slow database queries"
bun dev agent run monitor "Set up Prometheus metrics"
bun dev agent run analyze "Analyze application logs for errors"
bun dev agent run ci-cd "Design a CI/CD pipeline"

# With streaming output (shows response in real-time)
bun dev agent run test "Generate tests" --stream
```

#### Configuration

```bash
# Show current configuration
bun dev config show

# Set configuration values
bun dev config set ollama.model llama3:8b
bun dev config set agents.default deploy
```

#### Testing

```bash
# Run test suite
bun dev test

# Run specific test pattern
bun dev test agent

# Run with coverage
bun test --coverage
```

#### Server

```bash
# Start API server
bun dev serve

# Start on custom port
bun dev serve --port 4000

# Server will run at http://localhost:3000
```

### CLI Configuration

Default config location: `~/.config/rouge/config.json`

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

**Configuration Options:**

**Ollama:**
- `url` - Ollama server URL (default: http://localhost:11434)
- `model` - AI model to use (default: llama3.2:3b)
- `timeout` - Request timeout in ms (default: 30000)

**Agents:**
- `default` - Default agent for interactive mode
- `enabled` - List of enabled agents
- `maxConcurrent` - Max concurrent agent executions

**Workflows:**
- `parallel` - Enable parallel execution
- `timeout` - Workflow timeout in seconds
- `retries` - Number of retry attempts

**Permissions:**
- `deploy` - Deployment permission (allow, deny, ask)
- `test` - Testing permission (allow, deny, ask)
- `bash` - Shell command permission (allow, deny, ask)

---

## Running API Server

### Start Server

```bash
cd packages/rouge

# Start API server
bun dev serve

# Server starts at: http://localhost:3000
```

**Output:**
```
🚀 Rouge API Server
📡 Listening on http://localhost:3000
✅ Ollama connected
📦 Database initialized
```

### API Endpoints

#### Health & Status

```bash
# Health check
curl http://localhost:3000/health

# Response:
# {"status":"ok","timestamp":"2026-03-21T..."}
```

#### Agents

```bash
# List all agents
curl http://localhost:3000/agent

# Get agent capabilities
curl http://localhost:3000/agent/test

# Execute agent
curl -X POST http://localhost:3000/agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "task": "Generate unit tests for authentication",
    "stream": false
  }'

# Response:
# {
#   "success": true,
#   "output": "...",
#   "usage": {...}
# }
```

#### Configuration

```bash
# Get configuration
curl http://localhost:3000/api/config

# Update configuration
curl -X PUT http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "ollama": {
      "model": "llama3:8b"
    }
  }'
```

#### Workflows

```bash
# List workflows
curl http://localhost:3000/api/workflow

# Create workflow
curl -X POST http://localhost:3000/api/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Deploy Pipeline",
    "steps": [...]
  }'

# Execute workflow
curl -X POST http://localhost:3000/api/workflow/1/execute
```

#### Tests

```bash
# List tests
curl http://localhost:3000/api/test

# Execute tests
curl -X POST http://localhost:3000/api/test/execute \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "**/*.test.ts"
  }'
```

#### Deployments

```bash
# List deployments
curl http://localhost:3000/api/deployment

# Validate deployment
curl -X POST http://localhost:3000/api/deployment/validate \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "staging",
    "version": "1.0.0"
  }'

# Execute deployment
curl -X POST http://localhost:3000/api/deployment/execute \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "production",
    "strategy": "canary"
  }'
```

### API Server Configuration

Environment variables:
```bash
# .env file
PORT=3000
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
DATABASE_PATH=~/.config/rouge/rouge.db
LOG_LEVEL=info
```

---

## Running Web UI

### Start Web Server

```bash
# Terminal 1: Start API server (required)
cd packages/rouge
bun dev serve

# Terminal 2: Start web UI
cd packages/web
bun install  # First time only
bun dev

# Web UI starts at: http://localhost:3001
```

**Output:**
```
  VITE v5.4.11  ready in 523 ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### First-Time Setup

When you first open the web UI, you'll see a **Setup Wizard**:

#### Step 1: Connection Check

- **Title**: "Welcome to Rouge! 👋"
- **Action**: Click "Check Connection"
- **Prerequisites shown**:
  - Ollama must be running
  - At least one model pulled
  - API server must be running

#### Step 2: Model Selection

- **Title**: "Select Model 🤖"
- **Action**: Choose model from dropdown
- **Default**: llama3.2:3b (recommended)
- **Button**: "Continue"

#### Step 3: Ready

- **Title**: "All Set! 🎉"
- **Quick tips shown**:
  - Navigate to Agents page
  - Create workflows
  - Configure settings
  - Use CLI commands
- **Button**: "Start Using Rouge"

### Web UI Pages

#### Dashboard (`/`)

Main overview page showing:
- **Stats Cards**: Total agents, workflows, deployments, tests
- **Agent List**: All 10 agents with descriptions
- **Connection Status**: Real-time connection indicator
- **Quick Actions**: Links to key features

**Features:**
- Real-time stats
- Agent overview
- System health status
- Quick navigation

#### Agents Page (`/agents`)

Execute agents interactively:
- **Agent Cards**: One card per agent
- **Task Input**: Text field for task description
- **Execute Button**: Run agent with input
- **Result Display**: Shows agent output
- **Loading States**: Spinner during execution

**How to use:**
1. Select an agent card
2. Enter task description
3. Click "Execute"
4. View results in real-time

**Example:**
```
Test Agent
───────────────
Generate and execute software tests

Task: Generate unit tests for user authentication

[Execute Button]

Result:
Here are unit tests for user authentication...
```

#### Workflows Page (`/workflows`)

Manage automation workflows:
- **Workflow List**: All workflows with status
- **Status Badges**: pending, running, completed, failed
- **Create Button**: Add new workflows
- **Run Actions**: Execute workflows
- **Empty State**: Helpful message when no workflows

**Features:**
- Create workflows
- View workflow history
- Execute workflows
- Monitor status

#### Settings Page (`/settings`)

Configure Rouge:

**Ollama Settings:**
- URL (default: http://localhost:11434)
- Model selection
- Timeout configuration

**Agent Settings:**
- Default agent
- Enabled agents
- Max concurrent executions

**Workflow Settings:**
- Parallel execution toggle
- Timeout value
- Retry attempts

**Permission Settings:**
- Deploy permission (allow/deny/ask)
- Test permission (allow/deny/ask)
- Bash permission (allow/deny/ask)

**Save Button**: Persists changes to config file

### Web UI Features

**Real-Time Updates:**
- Connection status checks every 30s
- Agent execution progress
- Workflow status changes

**Responsive Design:**
- Works on desktop and tablet
- Mobile-friendly navigation
- Adaptive layouts

**Dark Theme:**
- GitHub-inspired design
- Easy on the eyes
- Professional appearance

---

## Complete Running Example

### Scenario: Execute Test Agent via All Interfaces

#### 1. Via CLI

```bash
cd packages/rouge

# Interactive mode
bun dev
# Select option 3, enter task, see result

# Direct command
bun dev agent run test "Generate unit tests for authentication"
```

#### 2. Via API

```bash
# Start server (Terminal 1)
cd packages/rouge
bun dev serve

# Execute via curl (Terminal 2)
curl -X POST http://localhost:3000/agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "task": "Generate unit tests for authentication"
  }'
```

#### 3. Via Web UI

```bash
# Start API (Terminal 1)
cd packages/rouge
bun dev serve

# Start Web UI (Terminal 2)
cd packages/web
bun dev

# Open browser
open http://localhost:3001

# Navigate to Agents page
# Select "test" agent
# Enter: "Generate unit tests for authentication"
# Click Execute
# View results
```

---

## Troubleshooting

### CLI Issues

**Problem**: `bun dev` command not found
```bash
# Solution: Make sure you're in packages/rouge
cd packages/rouge
bun dev --version
```

**Problem**: "Ollama is not available"
```bash
# Solution: Start Ollama
ollama serve

# In another terminal
ollama list  # Verify models are available
```

**Problem**: No models found
```bash
# Solution: Pull a model
ollama pull llama3.2:3b
```

### API Server Issues

**Problem**: Port 3000 already in use
```bash
# Solution: Use different port
bun dev serve --port 4000
```

**Problem**: Database error
```bash
# Solution: Remove and recreate database
rm ~/.config/rouge/rouge.db
# Restart server (will recreate DB)
bun dev serve
```

### Web UI Issues

**Problem**: Cannot connect to API
```bash
# Solution 1: Make sure API server is running
cd packages/rouge
bun dev serve

# Solution 2: Check API URL in web/src/lib/api.ts
# Should be: http://localhost:3000
```

**Problem**: Setup wizard keeps appearing
```bash
# Solution: Complete setup wizard or create config
mkdir -p ~/.config/rouge
echo '{"ollama":{"model":"llama3.2:3b","url":"http://localhost:11434","timeout":30000}}' > ~/.config/rouge/config.json
```

**Problem**: Web UI won't start
```bash
# Solution: Reinstall dependencies
cd packages/web
rm -rf node_modules
bun install
bun dev
```

---

## Testing Phase 1

### CLI Tests

```bash
cd packages/rouge

# Run all tests
bun test

# Run specific tests
bun test src/test/agent.test.ts
bun test src/test/skill.test.ts
bun test src/test/ability.test.ts
bun test src/test/config.test.ts

# With coverage
bun test --coverage
```

**Expected Output:**
```
✓ Agent system
  ✓ should list all agents
  ✓ should get agent capabilities
  ✓ should load agent prompts

✓ Skills system
  ✓ should list all skills
  ✓ should get skill by id
  ✓ should filter skills by category

✓ Abilities system
  ✓ should list all abilities
  ✓ should get ability by id
  ✓ should check agent abilities

Test Files  4 passed (4)
Tests  20 passed (20)
```

### Integration Tests

```bash
# Test all agents
for agent in test deploy monitor analyze ci-cd security performance infrastructure incident database; do
  echo "Testing $agent agent..."
  bun dev agent run $agent "What do you do?"
done

# Test all commands
bun dev --version
bun dev status
bun dev list agents
bun dev list skills
bun dev config show

# Test API endpoints
curl http://localhost:3000/health
curl http://localhost:3000/agent
curl -X POST http://localhost:3000/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"type":"test","task":"Hello"}'
```

---

## Performance Notes

### Response Times

**CLI:**
- Command execution: < 100ms
- Agent response (3b model): 2-5 seconds
- Agent response (8b model): 5-10 seconds

**API:**
- Health check: < 10ms
- List operations: < 50ms
- Agent execution: 2-10 seconds (depends on model)

**Web UI:**
- Page load: < 500ms
- Agent execution: Same as API
- Real-time updates: 30s polling interval

### Resource Usage

**Ollama (llama3.2:3b):**
- RAM: ~2-4GB
- CPU: Varies (10-80% during generation)
- Disk: ~2GB model size

**Rouge CLI:**
- RAM: ~50-100MB
- CPU: Minimal (< 5%)

**API Server:**
- RAM: ~100-200MB
- CPU: Minimal when idle

**Web UI:**
- RAM: ~100-200MB (browser)
- CPU: Minimal

---

## Next Steps

Phase 1 is complete. See:
- `PHASE_2_PLAN.md` - Workflow orchestration and automation engine
- `PHASE_3_PLAN.md` - Advanced features and desktop app

---

*Phase 1 Running Guide*
*Complete CLI, API, and Web UI*
*Date: 2026-03-21*
