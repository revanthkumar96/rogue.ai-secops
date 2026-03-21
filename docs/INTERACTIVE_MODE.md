# Rouge Interactive Mode

> Single command to start Rouge with setup and execution

## Overview

Rouge now has a complete interactive mode that provides:
- ✅ Ollama connection testing
- ✅ Model selection
- ✅ Agent selection
- ✅ Interactive task execution
- ✅ Configuration management

## CLI Interactive Mode

### Start Interactive Mode

```bash
# Just run rouge
rouge

# Or explicitly
rouge run
```

### Features

**Main Menu**:
```
Current Settings:
  Model: llama3.2:3b
  Agent: test
  Status: ✅ Connected

Options:
  1. Change Ollama Model
  2. Select Agent
  3. Execute Agent Task
  4. Test Connection
  5. View Configuration
  6. List All Agents
  q. Quit
```

### Workflow

1. **Connection Test**
   - Automatically tests Ollama connection on start
   - Shows connection status
   - Warns if Ollama is not available

2. **Model Selection** (Option 1)
   - Fetches available models from Ollama
   - Lists all pulled models
   - Select by number
   - Saves to configuration

3. **Agent Selection** (Option 2)
   - Lists all 10 agents
   - Shows description for each
   - Select by number
   - Sets as default for execution

4. **Task Execution** (Option 3)
   - Enter task description
   - Executes with selected agent
   - Shows spinner during execution
   - Displays result

5. **View Configuration** (Option 5)
   - Shows all settings
   - Ollama configuration
   - Agent settings
   - Workflow options
   - Permissions

6. **List Agents** (Option 6)
   - Shows all agents with descriptions
   - Helps with agent selection

### Usage Example

```bash
$ rouge

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

Enter task: Generate unit tests for user authentication

⠋ Executing test agent
✔ Task completed

──────────────────────────────────────────────────

To generate unit tests for user authentication, consider...
[Agent response continues]

──────────────────────────────────────────────────
```

## Web UI Setup Flow

### First-Time Setup

When you open the web UI for the first time, you'll see a setup wizard:

#### Step 1: Connection Check
- **Title**: "Welcome to Rouge! 👋"
- **Action**: Check Ollama connection
- **Button**: "Check Connection"
- **Prerequisites shown**:
  - Ollama must be running
  - At least one model pulled

#### Step 2: Model Selection
- **Title**: "Select Model 🤖"
- **Dropdown**: Choose from available models
- **Default**: llama3.2:3b (recommended)
- **Button**: "Continue"

#### Step 3: Ready
- **Title**: "All Set! 🎉"
- **Quick tips** shown:
  - Navigate to Agents
  - Create Workflows
  - Configure settings
  - Use CLI
- **Button**: "Start Using Rouge"

### After Setup

Once setup is complete:
- ✅ Setup is remembered
- ✅ Goes directly to Dashboard
- ✅ Can reconfigure in Settings page
- ✅ Connection status always visible

## Features Comparison

### CLI Interactive Mode

**Pros**:
- Terminal-based workflow
- Quick keyboard navigation
- No browser needed
- Scriptable

**Best For**:
- Developers comfortable with CLI
- Server environments
- Automation scripts
- Quick one-off tasks

### Web UI Setup

**Pros**:
- Visual interface
- Mouse-friendly
- Multi-page navigation
- Better for complex workflows

**Best For**:
- New users
- Visual preference
- Long-running sessions
- Team collaboration

## Command Comparison

| Action | CLI Command | Web UI |
|--------|-------------|--------|
| Start | `rouge` | Visit http://localhost:3001 |
| Setup | Interactive menu | Setup wizard |
| Change Model | Option 1 | Settings page |
| Select Agent | Option 2 | Agents page |
| Execute Task | Option 3 | Agents page → Execute |
| View Config | Option 5 | Settings page |
| List Agents | Option 6 | Agents page |

## Configuration

Both modes use the same configuration:

**Location**: `~/.config/rouge/config.json`

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
  }
}
```

Changes in CLI interactive mode are saved to this file and reflected in Web UI (and vice versa).

## Testing

### Test CLI Interactive Mode

```bash
# Start interactive mode
rouge

# Test each option:
# 1. Try changing model
# 2. Select different agent
# 3. Execute a task
# 4. View configuration
# 5. List all agents
# q. Quit
```

### Test Web UI Setup

```bash
# Terminal 1: Start API
cd packages/rouge
bun dev serve

# Terminal 2: Start Web UI
cd packages/web
bun dev

# Browser: Test setup flow
# 1. Visit http://localhost:3001
# 2. Click "Check Connection"
# 3. Select a model
# 4. Click "Continue"
# 5. Click "Start Using Rouge"
# 6. Verify dashboard loads
```

## Troubleshooting

### CLI: "Ollama is not available"

**Solution**:
```bash
# Start Ollama
ollama serve

# Pull a model if needed
ollama pull llama3.2:3b

# Try again
rouge
```

### CLI: "No models found"

**Solution**:
```bash
# Pull at least one model
ollama pull llama3.2:3b

# Restart interactive mode
rouge
```

### Web: Setup wizard keeps appearing

**Solution**:
```bash
# Check if config exists
cat ~/.config/rouge/config.json

# If missing, create it:
mkdir -p ~/.config/rouge
echo '{"ollama":{"model":"llama3.2:3b","url":"http://localhost:11434","timeout":30000}}' > ~/.config/rouge/config.json
```

### Web: Connection check fails

**Solution**:
1. Make sure API server is running: `bun dev serve`
2. Make sure Ollama is running: `ollama serve`
3. Check API is accessible: `curl http://localhost:3000/health`

## Advanced Usage

### CLI Scripting

You can script the interactive mode:

```bash
# Example: Auto-execute task
echo -e "3\nGenerate unit tests\nq\n" | rouge
```

### Web UI: Skip Setup

To skip setup wizard, ensure config exists:

```bash
# Create initial config
rouge config show  # CLI creates config if missing
```

## Complete Workflow Examples

### Example 1: First-Time User (CLI)

```bash
$ rouge
# 1. Connection test runs automatically
# 2. Select option: 1 (Change Model)
# 3. Choose model from list
# 4. Select option: 2 (Select Agent)
# 5. Choose "test" agent
# 6. Select option: 3 (Execute Task)
# 7. Enter: "Generate unit tests for authentication"
# 8. See results
# 9. Press q to quit
```

### Example 2: First-Time User (Web)

```
1. Open http://localhost:3001
2. Setup wizard appears
3. Click "Check Connection"
4. See success: "✓ Connected to Ollama!"
5. Select "llama3.2:3b" from dropdown
6. Click "Continue"
7. Read quick tips
8. Click "Start Using Rouge"
9. Dashboard loads
10. Navigate to "Agents"
11. Try executing a task
```

### Example 3: Returning User (CLI)

```bash
$ rouge
# Configuration loaded automatically
# Select option: 3 (Execute Task)
# Enter task
# See results
# Press q
```

### Example 4: Returning User (Web)

```
1. Open http://localhost:3001
2. Dashboard loads directly (no setup)
3. Navigate to desired page
4. Use features
```

## Implementation Details

### CLI Interactive Mode

**File**: `packages/rouge/src/cli/interactive.ts`

**Features**:
- Readline-based input
- State management
- Menu system
- Spinner integration
- Error handling
- Configuration persistence

**State**:
```typescript
interface InteractiveState {
  config: Config
  selectedAgent: AgentType
  connected: boolean
}
```

### Web UI Setup

**File**: `packages/web/src/components/Setup.tsx`

**Features**:
- 3-step wizard
- Progress indicator
- Connection testing
- Model selection
- Local storage for setup state

**Steps**:
1. Connection check
2. Model selection
3. Completion

## Summary

### CLI Interactive Mode ✅

- Single `rouge` command
- Terminal-based UI
- 6 interactive options
- Model selection
- Agent execution
- Configuration viewing

### Web UI Setup ✅

- First-time setup wizard
- 3-step process
- Visual interface
- Model selection
- Quick tips
- Setup persistence

Both modes provide complete functionality for getting started with Rouge!

---

*Interactive Mode Complete*
*Single Command Experience*
*Date: 2026-03-21*
