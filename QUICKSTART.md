# 🚀 Quick Start Guide - Rouge.ai - The Fairy Tail

Get up and running in 60 seconds!

## Prerequisites

1. **Install Bun** (JavaScript runtime)
```bash
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1|iex"

# macOS/Linux
curl -fsSL https://bun.sh/install | bash
```

2. **Install Ollama** (Local LLM)
```bash
# Windows
# Download from: https://ollama.ai/download

# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

3. **Pull AI Model**
```bash
ollama pull llama3.2:3b
```

4. **Start Ollama** (in a separate terminal)
```bash
ollama serve
```

---

## 🎯 Choose Your Start Mode

### Mode 1: Full Mode (Recommended)
Web UI + API - Best for most users
```bash
bun run start
```

### Mode 2: Web UI Only
Same as Full Mode (for clarity)
```bash
bun run start:web
```

### Mode 3: CLI Mode
Terminal interface for automation & scripting
```bash
bun run start:cli
```

**See [START_MODES.md](./START_MODES.md) for detailed mode comparison**

---

## ✨ What Happens?

The startup script will:
1. ✅ Check if Ollama is running
2. 📦 Install dependencies (if needed)
3. 🚀 Start API Server on `http://localhost:3000`
4. 🎨 Start Web UI on `http://localhost:3001`
5. 🗄️ Run database migrations automatically

---

## 🌐 Access the Application

Once started, open your browser:

**Web UI**: http://localhost:3001

You'll see:
- ✨ Beautiful fairy tale themed interface
- 🤖 10 specialist AI agents ready to help
- 📊 Command center for orchestrating tasks

---

## 🧪 Try Your First Command

In the Web UI, type:
```
"Create a test workflow called 'Deploy Pipeline' with steps: build, test, deploy"
```

The AI will:
1. Route your request to the appropriate specialist agent
2. Create an actual workflow in the database
3. Return the workflow ID and confirmation

---

## 🛑 Stopping the System

Press `Ctrl+C` in the terminal where you ran the start script.

This will gracefully shut down:
- API Server
- Web UI
- All background processes

---

## 📁 Project Structure

```
rouge/
├── packages/
│   ├── rouge/          # Backend (API + Agents)
│   └── web/            # Frontend (SolidJS)
├── start.sh            # Linux/Mac startup script
├── start.ps1           # Windows startup script
├── scripts/start.ts    # Bun startup script
└── phases.md           # Development roadmap
```

---

## 🐛 Troubleshooting

### Ollama not running?
```bash
# Start Ollama first
ollama serve

# Then run the startup script again
bun run start
```

### Port already in use?
```bash
# Find and kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Dependencies not installing?
```bash
# Clean install
rm -rf node_modules
bun install
```

---

## 📚 Next Steps

1. **Read the phases.md** - Understand the roadmap
2. **Try different agents** - Test, Deploy, Monitor, Security, etc.
3. **Create workflows** - Automate multi-step tasks
4. **Check the docs/** - Dive deeper into capabilities

---

## 🎨 Current Features (Phase 0 Complete)

✅ 10 Specialized AI Agents
✅ Full Database CRUD Operations
✅ Beautiful Responsive UI
✅ Automatic Execution Logging
✅ Router Agent (Auto-routes tasks)
✅ Real-time Status Indicators
✅ One-Command Startup

---

## 🚀 Coming Next (Phase 1)

- 📊 Dashboard with metrics
- 📈 Charts and visualizations
- 🔔 Real-time notifications
- 💬 Enhanced chat interface
- 📝 Conversation history

See **phases.md** for the complete roadmap!

---

**Built with ❤️ using Bun, Hono, SolidJS, and Ollama**
