# Rouge Setup Guide

## Prerequisites

### 1. Install Bun

```bash
# Linux/macOS
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1|iex"
```

### 2. Install Ollama

```bash
# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# macOS
brew install ollama

# Windows
# Download from: https://ollama.ai/download/windows
```

### 3. Pull AI Model

```bash
# Start Ollama (keep this running)
ollama serve

# In another terminal, pull model
ollama pull llama3.2:3b    # Recommended for automation (2GB, fast)
# OR
ollama pull mistral:7b     # Better quality for complex tasks (4GB)
# OR
ollama pull qwen2.5:7b     # Alternative, good for code generation
```

---

## Installation

```bash
# Navigate to project
cd rouge

# Install all dependencies
bun install

# Generate database schema
cd packages/api
bun db:generate

# Create initial migration
bun db:migrate

# Return to root
cd ../..
```

---

## Development

### Start API Server

```bash
# From project root
bun dev

# Or with custom port
PORT=4000 bun dev
```

Expected output:
```
🎮 Rouge API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server:   http://localhost:3000
📦 Database: ~/.local/share/rouge/rouge.db
🤖 Ollama:   http://localhost:11434
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready for automation!
```

---

## Verify Installation

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":1710969600000}
```

### 2. Ollama Status

```bash
curl http://localhost:3000/ai/status
```

Expected response:
```json
{
  "available": true,
  "models": ["llama3.2:3b"],
  "url": "http://localhost:11434"
}
```

### 3. Create Automation Agent

```bash
curl -X POST http://localhost:3000/player \
  -H "Content-Type: application/json" \
  -d '{
    "name": "automation-bot",
    "class": "automation"
  }'
```

Expected response:
```json
{
  "id": "...",
  "name": "automation-bot",
  "class": "automation",
  "strength": 8,
  "intelligence": 3,
  "dexterity": 5,
  "constitution": 7,
  ...
}
```

### 4. Test AI Analysis

```bash
curl -X POST http://localhost:3000/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze this error: Connection timeout after 30s on port 5432",
    "system": "You are a DevOps troubleshooting expert"
  }'
```

Expected response:
```json
{
  "text": "This connection timeout on port 5432 suggests a PostgreSQL database connectivity issue..."
}
```

---

## Troubleshooting

### Ollama Not Available

**Symptom**: `/ai/status` returns `"available": false`

**Solution**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve

# Pull model if needed
ollama pull llama3.2:3b

# Verify model is installed
ollama list
```

### Port Already in Use

**Symptom**: `Error: EADDRINUSE: address already in use`

**Solution**:
```bash
# Check what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or use different port
PORT=4000 bun dev
```

### Database Migration Errors

**Symptom**: `table already exists` or migration errors

**Solution**:
```bash
# Delete existing database
rm ~/.local/share/rouge/rouge.db*

# Regenerate migrations
cd packages/api
rm -rf migrations/
bun db:generate
bun db:migrate
```

### TypeScript Errors

**Symptom**: Import errors or type errors

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules packages/*/node_modules
bun install

# Check types
bun typecheck
```

### Bun Not Found

**Symptom**: `command not found: bun`

**Solution**:
```bash
# Reload shell
source ~/.bashrc  # or ~/.zshrc

# Or reinstall
curl -fsSL https://bun.sh/install | bash
```

---

## Directory Structure

```
rouge/
├── packages/
│   ├── core/           # Game engine + AI (Ollama, Narrator)
│   ├── api/            # API server (Hono, Drizzle)
│   └── shared/         # Shared types
├── docs/               # Documentation
├── package.json        # Root workspace
└── turbo.json          # Task orchestration

Generated at runtime:
├── ~/.local/share/rouge/
│   └── rouge.db        # SQLite database
└── packages/api/migrations/
    └── 0000_*.sql      # Database migrations
```

---

## Environment Variables

Create `.env` in project root (optional):

```bash
# API Server
PORT=3000
HOST=localhost
CORS_ORIGIN=http://localhost:3001

# Ollama
OLLAMA_URL=http://localhost:11434

# Database
ROUGE_DB_PATH=./rouge.db
ROUGE_DATA_DIR=~/.local/share/rouge

# Development
NODE_ENV=development
LOG_LEVEL=info
```

---

## Available Scripts

```bash
# Development
bun dev              # Start API server (watch mode)
bun dev:web          # Start web UI (TODO: Phase 2)

# Building
bun build            # Build all packages

# Type Checking
bun typecheck        # Check TypeScript across all packages

# Database
bun db:generate      # Generate migrations from schema
bun db:migrate       # Apply migrations to database
bun db:studio        # Open Drizzle Studio (database GUI)

# Cleanup
bun clean            # Remove build artifacts
```

---

## Production Deployment

### Build for Production

```bash
# Build all packages
bun build

# Test production build
NODE_ENV=production bun start
```

### Systemd Service (Linux)

Create `/etc/systemd/system/rouge.service`:

```ini
[Unit]
Description=Rouge Automation Server
After=network.target

[Service]
Type=simple
User=rouge
WorkingDirectory=/opt/rouge
ExecStart=/usr/local/bin/bun start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable rouge
sudo systemctl start rouge
sudo systemctl status rouge
```

---

## Docker Deployment (Planned)

```dockerfile
FROM oven/bun:latest

WORKDIR /app
COPY . .

RUN bun install
RUN bun build

EXPOSE 3000

CMD ["bun", "start"]
```

Build and run:
```bash
docker build -t rouge .
docker run -p 3000:3000 rouge
```

---

## Next Steps

1. ✅ **Phase 1 Complete** - Foundation is ready!
2. **Phase 2** - Build automation engine
3. **Phase 3** - Add testing framework
4. **Phase 4** - Deploy to production

---

## Getting Help

- Check [Architecture](./docs/ARCHITECTURE.md) for technical details
- Check [API Reference](./docs/API_REFERENCE.md) for endpoint documentation
- Open an issue on GitHub

---

## Quick Test Script

Save as `test.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Rouge API..."
echo ""

echo "1️⃣  Health Check"
curl -s http://localhost:3000/health | jq
echo ""

echo "2️⃣  Ollama Status"
curl -s http://localhost:3000/ai/status | jq
echo ""

echo "3️⃣  Create Automation Agent"
PLAYER=$(curl -s -X POST http://localhost:3000/player \
  -H "Content-Type: application/json" \
  -d '{"name":"automation-bot","class":"automation"}')
echo "$PLAYER" | jq
PLAYER_ID=$(echo "$PLAYER" | jq -r '.id')
echo ""

echo "4️⃣  Create Workflow Session"
GAME=$(curl -s -X POST http://localhost:3000/game \
  -H "Content-Type: application/json" \
  -d "{\"player_id\":\"$PLAYER_ID\"}")
echo "$GAME" | jq
echo ""

echo "5️⃣  AI Log Analysis"
curl -s -X POST http://localhost:3000/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze: ERROR: Connection refused on port 5432",
    "system": "You are a DevOps expert"
  }' | jq
echo ""

echo "✅ All tests passed!"
```

Run: `chmod +x test.sh && ./test.sh`

---

**Ready for DevOps automation! 🚀**
