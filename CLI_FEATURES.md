# ⌨️  Rouge.ai CLI Mode - Full Features Guide

Complete guide to using the full-featured CLI/TUI mode.

---

## 🚀 Starting CLI Mode

```bash
bun run start:cli
```

This launches the **full interactive Terminal User Interface** with all features:
- ✅ Model selection
- ✅ Workspace browser
- ✅ Agent management
- ✅ Configuration
- ✅ Command palette
- ✅ Natural language interface

---

## 🎯 The Command Palette

Press `?` or just hit Enter to open the command palette:

```
ROUGE Command Palette
────────────────────────────────────────

1. Change Model      - Currently: llama3.2:3b
2. Select Agent      - Currently: router
3. View Stats        - System dashboard
4. Test Connection   - Verify Ollama
5. View Config       - Full detail
6. List Agents       - Available builders
7. Set Workspace     - Currently: /path/to/project
8. Close Palette
```

### Quick Access

Type the number to select an option:
```bash
[router] @ Rouge > ?
# Opens palette
# Type 1-7 or navigate with arrows

# Or use shortcuts directly:
[router] @ Rouge > /1    # Change model
[router] @ Rouge > /2    # Select agent
[router] @ Rouge > /7    # Set workspace
```

---

## 📁 Workspace Browser (Feature Highlight!)

One of the **most powerful features** - visual folder navigation:

```bash
[router] @ Rouge > /7    # or select "Set Workspace" from palette

Browsing: /home/user
────────────────────────────────────────
1. .. [Go Up]
2. 📁 Documents
3. 📁 Projects
4. 📁 Code
5. ✅ SELECT CURRENT FOLDER
6. ❌ CANCEL

# Navigate through folders visually
# Select your project directory
# Configuration saved for next session!
```

**Why this matters**:
- Agents need workspace context to work on your files
- Browse visually instead of typing paths
- Persistent across sessions
- Works remotely via SSH

---

## 🤖 Agent Management

### View All Agents
```bash
[router] @ Rouge > /6    # or "List Agents" from palette

Available Agents
────────────────────────────────────────

test
  Test generation and execution

deploy
  Deployment automation

monitor
  System monitoring and alerting

# ... and 7 more agents
```

### Switch Agents

**Method 1: Command Palette**
```bash
[router] @ Rouge > /2
# Select from menu
```

**Method 2: Quick Switch**
```bash
[router] @ Rouge > @test
Selected agent: test

[test] @ Rouge > _
```

**Method 3: Switch and Execute**
```bash
[router] @ Rouge > @deploy Create deployment plan

# Switches to deploy agent and executes task immediately
```

---

## 🔧 Model Selection

Switch between your Ollama models:

```bash
[router] @ Rouge > /1

Select Model
────────────────────────────────────────
1. llama3.2:3b
2. llama3.2:1b
3. mistral:7b
4. codellama:13b

# Choose your model
# Configuration saved automatically
```

**Dynamic model loading** - fetches available models from Ollama in real-time!

---

## 📊 View Statistics

```bash
[router] @ Rouge > /3

System Status
────────────────────────────────────────
Ollama:     READY
Model:      llama3.2:3b
Workspace:  /home/user/projects/myapp
```

---

## 🔌 Test Connection

```bash
[router] @ Rouge > /4

⏳ Testing Ollama connection...
✅ Connected to Ollama
```

---

## ⚙️  View Configuration

See your complete configuration:

```bash
[router] @ Rouge > /5

Configuration
────────────────────────────────────────

Ollama
  URL:     http://localhost:11434
  Model:   llama3.2:3b
  Timeout: 30000ms

Agents
  Default:        test
  Enabled:        test, deploy, monitor, analyze
  Max Concurrent: 5

Workflows
  Parallel: Yes
  Timeout:  3600s
  Retries:  3

Permissions
  Deploy: ask
  Test:   allow
  Bash:   ask
```

---

## 💬 Natural Language Interface

The **best part** - just talk naturally!

```bash
[router] @ Rouge > Create a test workflow with 3 steps

# AI processes your request
# Routes to appropriate agent
# Executes the task
# Returns result
```

### Examples

```bash
# General questions
[router] @ Rouge > What can you do?
[router] @ Rouge > Show me all workflows
[router] @ Rouge > Help with deployment

# Specific tasks
[test] @ Rouge > Generate unit tests for authentication
[deploy] @ Rouge > Explain blue-green deployment
[monitor] @ Rouge > Check system health

# Database operations (now works!)
[router] @ Rouge > Create a workflow called "CI Pipeline"
[router] @ Rouge > List all test runs
[router] @ Rouge > Show deployment statistics
```

---

## 🎨 Prompt Customization

The prompt shows your current context:

```bash
[agent-name] @ Rouge > _
    ↑           ↑
    |           └─ Project name
    └─ Active agent
```

**Changes as you switch agents:**
```bash
[router] @ Rouge > @test
[test] @ Rouge > @deploy
[deploy] @ Rouge > _
```

---

## 🔄 Session Persistence

Your settings are remembered:
- ✅ Selected model
- ✅ Active agent
- ✅ Workspace path
- ✅ Configuration

Next time you start CLI mode, everything is ready!

---

## ⌨️  Keyboard Shortcuts Summary

| Key | Action |
|-----|--------|
| `Enter` (empty) | Open command palette |
| `?` | Open command palette |
| `/1` to `/7` | Quick palette shortcuts |
| `@agent` | Switch agent |
| `q` or `exit` | Quit |
| `Ctrl+C` | Force quit |

---

## 🆚 CLI vs Web UI

| Feature | CLI Mode | Web UI |
|---------|----------|--------|
| **Workspace Browser** | ✅ Visual TUI | ❌ Not available |
| **Model Selection** | ✅ Interactive | ⚠️ Config only |
| **Agent Switching** | ✅ Quick (@cmd) | ⚠️ Click-based |
| **Command Palette** | ✅ Full featured | ❌ Not available |
| **Config Management** | ✅ Interactive | ⚠️ Limited |
| **Works via SSH** | ✅ Yes | ❌ No |
| **Visual Charts** | ❌ No | ✅ Yes |
| **Mouse Support** | ❌ No | ✅ Yes |

**Use CLI when:**
- Working remotely (SSH)
- Terminal workflow preference
- Need workspace browsing
- Want quick model switching
- Scripting/automation

**Use Web UI when:**
- Local development
- Need visualizations
- Prefer mouse interaction
- Multiple tabs/windows

---

## 🎓 Tutorial: First Time Setup

### Step 1: Start CLI
```bash
bun run start:cli
```

### Step 2: Set Workspace
```bash
[router] @ Rouge > /7
# Navigate to your project folder
# Select it
```

### Step 3: Choose Model (optional)
```bash
[router] @ Rouge > /1
# Select your preferred model
```

### Step 4: Select Agent
```bash
[router] @ Rouge > /2
# Choose the agent you want to use
```

### Step 5: Start Working!
```bash
[test] @ Rouge > Generate tests for my authentication module
```

---

## 🐛 Troubleshooting

### Workspace not set?
```bash
[router] @ Rouge > /7
# Browse and select your project
```

### Model not working?
```bash
[router] @ Rouge > /1
# Make sure model is pulled:
# ollama pull llama3.2:3b
```

### Ollama not connected?
```bash
[router] @ Rouge > /4
# If fails, start Ollama:
# ollama serve
```

---

## 💡 Pro Tips

1. **Use workspace browser first** - Sets context for all agents
2. **@agent shortcuts** - Fastest way to switch
3. **Natural language** - Just type what you want
4. **Command palette** - Press Enter when unsure
5. **Save configs** - All settings persist

---

## 🎉 Advanced Workflows

### Quick Deploy Check
```bash
[router] @ Rouge > @deploy
[deploy] @ Rouge > Validate deployment.yaml
[deploy] @ Rouge > @test
[test] @ Rouge > Run smoke tests
```

### Database Workflow Creation
```bash
[router] @ Rouge > Create deployment workflow
# AI creates workflow in database
[router] @ Rouge > List all workflows
# Confirms creation
```

### System Health Check
```bash
[router] @ Rouge > @monitor
[monitor] @ Rouge > Check all services
[monitor] @ Rouge > @analyze
[analyze] @ Rouge > Parse error logs
```

---

**The CLI mode is a full-featured terminal interface - not just a simple prompt!** ✨
