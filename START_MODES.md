# 🚀 Rouge.ai - Start Modes

Three different ways to run Rouge.ai based on your needs.

---

## 📋 Quick Reference

```bash
# Full Mode - Web UI + API
bun run start

# Web UI Only - Browser interface + API
bun run start:web

# CLI Mode - Terminal interface + API
bun run start:cli
```

---

## 🌐 Mode 1: Full Mode (Recommended)

**Command**: `bun run start`

**What it starts**:
- ✅ API Server (port 3000)
- ✅ Web UI (port 3001)

**Best for**:
- Most users
- Visual interface
- Drag-and-drop workflows
- Real-time monitoring
- Dashboard views

**Access**:
```
Web UI: http://localhost:3001
API:    http://localhost:3000
```

**Example Usage**:
1. Run `bun run start`
2. Open browser to http://localhost:3001
3. Type commands in the chat interface
4. View agent responses in beautiful UI

---

## 🎨 Mode 2: Web UI Mode

**Command**: `bun run start:web`

**What it starts**:
- ✅ API Server (port 3000) - Background
- ✅ Web UI (port 3001) - Foreground

**Best for**:
- Same as Full Mode
- Alias for clarity

**Access**:
```
Web UI: http://localhost:3001
API:    http://localhost:3000
```

**Difference from Full Mode**:
- None! It's the same, just a different script name for clarity

---

## ⌨️  Mode 3: CLI Mode (Full Interactive TUI)

**Command**: `bun run start:cli`

**What it starts**:
- ⌨️  Full-featured Terminal User Interface (TUI)
- 🎨 Rich interactive menus
- 🔧 Configuration management
- 📁 Workspace browser

**Best for**:
- Terminal lovers
- Full control from CLI
- SSH sessions
- No GUI environments
- Power users

**Features**:

### 🎯 Command Palette (Type `?` or press Enter)
- Change Model - Switch between Ollama models
- Select Agent - Choose which agent to talk to
- View Stats - System dashboard
- Test Connection - Verify Ollama
- View Config - See full configuration
- List Agents - Show all available agents
- Set Workspace - Browse and select project folder

### 📁 Workspace Browser
- Visual folder navigation
- Select any project directory
- Remembers your workspace
- Works across sessions

### 🤖 Agent Selection
- Choose your active agent (test, deploy, monitor, etc.)
- See agent capabilities
- Switch agents anytime with `@` command

### ⌨️  Quick Commands
```bash
# Open command palette
[router] @ Rouge > ?
or just press Enter

# Switch agent quickly
[router] @ Rouge > @test

# Ask your question
[test] @ Rouge > Generate unit tests for authentication

# Shortcuts
[router] @ Rouge > /1    # Change model
[router] @ Rouge > /2    # Select agent
[router] @ Rouge > /7    # Set workspace
```

### 🎨 Natural Language
Just type your question naturally:
```bash
[router] @ Rouge > Create a deployment workflow
[router] @ Rouge > Show me test statistics
[router] @ Rouge > Help with database optimization
```

### Available Interactive Commands

At the `[agent] @ Rouge >` prompt:

| Command | Description |
|---------|-------------|
| `?` or Enter | Open command palette |
| `@agent-name` | Switch to specific agent |
| `@agent-name task` | Switch and execute |
| `/1` to `/7` | Quick shortcuts (see palette) |
| `q` or `exit` | Exit interactive mode |
| Any text | Natural language query |

### Command Palette Options

| Option | Shortcut | Description |
|--------|----------|-------------|
| Change Model | `/1` | Select from available Ollama models |
| Select Agent | `/2` | Choose active agent |
| View Stats | `/3` | System dashboard |
| Test Connection | `/4` | Check Ollama status |
| View Config | `/5` | Full configuration |
| List Agents | `/6` | Show all agents |
| Set Workspace | `/7` | Browse and select folder |

---

## 🔄 Switching Modes

You can switch between modes by stopping one and starting another:

```bash
# Stop current mode
Ctrl+C

# Start different mode
bun run start:cli    # or start:web or start
```

---

## 📊 Comparison Table

| Feature | Full Mode | Web UI Mode | CLI Mode |
|---------|-----------|-------------|----------|
| **API Server** | ✅ | ✅ | ✅ |
| **Web Interface** | ✅ | ✅ | ❌ |
| **CLI Commands** | ✅ | ✅ | ✅ |
| **Visual Dashboard** | ✅ | ✅ | ❌ |
| **Terminal Only** | ❌ | ❌ | ✅ |
| **Port 3000** | ✅ | ✅ | ✅ |
| **Port 3001** | ✅ | ✅ | ❌ |
| **Best for** | General use | General use | Automation |

---

## 🎯 Which Mode Should I Use?

### Use **Full Mode** (`bun run start`) if:
- ✅ You want the full experience
- ✅ You prefer visual interfaces
- ✅ You're new to Rouge.ai
- ✅ You want to see real-time updates

### Use **CLI Mode** (`bun run start:cli`) if:
- ✅ You love terminals
- ✅ You're writing automation scripts
- ✅ You're on a headless server (no GUI)
- ✅ You're in a CI/CD pipeline
- ✅ You want minimal resource usage

---

## 🔧 Advanced: Custom Ports

### Change API Port
```bash
# Full/Web Mode
cd packages/rouge
bun run dev serve --port 4000

# Then in another terminal
cd packages/web
bun run dev --port 3001
```

### Change Web UI Port
```bash
cd packages/web
bun run dev --port 8080
```

---

## 🐛 Troubleshooting

### CLI commands not working?
Make sure the API server is running (it starts automatically in CLI mode).

### Port already in use?
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
cd packages/rouge
bun run dev serve --port 4000
```

### Want to run API only?
```bash
cd packages/rouge
bun run dev serve
```

### Want to run Web UI only (with external API)?
```bash
# Set API URL
export VITE_API_URL=http://your-api-server:3000

cd packages/web
bun run dev
```

---

## 📝 Examples

### Example 1: Development Workflow
```bash
# Terminal 1: Start full mode
bun run start

# Browser: http://localhost:3001
# Use Web UI for development
```

### Example 2: CI/CD Pipeline
```bash
# Start CLI mode in background
bun run start:cli &

# Wait for API
sleep 5

# Run CLI commands
rouge agent run test "Run all tests"
rouge workflow run deploy-production

# Cleanup
pkill -f "bun.*serve"
```

### Example 3: Remote Server
```bash
# SSH into server
ssh user@server

# Start CLI mode
cd rouge
bun run start:cli

# Interactive TUI appears with full features
[router] @ Rouge > /7          # Set workspace
# Browse folders visually...
# Select project

[router] @ Rouge > @monitor    # Switch to monitor agent
[monitor] @ Rouge > Check system health

# Use command palette
[monitor] @ Rouge > ?
# Select options from menu...
```

---

## 🎉 Quick Start

**First time user?** Use Full Mode:
```bash
bun run start
```

**Power user?** Use CLI Mode:
```bash
bun run start:cli
```

**Want both?** Use Full Mode (includes both UI and CLI access)!

---

**All modes are production-ready and fully functional!** ✨
