# Testing Interactive Mode

## ✅ Implementation Complete

The interactive mode has been successfully implemented and connected to the `rouge` command.

### What Was Fixed

**File**: `packages/rouge/src/cli/cmd/run.ts`

**Change**: Updated to use the new Interactive mode:

```typescript
import { cmd } from "./cmd"
import { Interactive } from "../interactive.js"

export const RunCommand = cmd({
  command: "$0",
  describe: "start Rouge in interactive mode",
  handler: async () => {
    await Interactive.start()
  },
})
```

### Files Involved

1. **`packages/rouge/src/cli/interactive.ts`** - Interactive mode implementation
2. **`packages/rouge/src/cli/cmd/run.ts`** - Connected to interactive mode
3. **`packages/web/src/components/Setup.tsx`** - Web setup wizard
4. **`packages/web/src/App.tsx`** - Setup detection

---

## How to Test CLI Interactive Mode

### 1. Start Ollama

```bash
ollama serve
```

### 2. Pull a Model (if needed)

```bash
ollama pull llama3.2:3b
```

### 3. Run Interactive Mode

```bash
cd packages/rouge
bun dev
```

Or directly:

```bash
rouge
```

### 4. Test Each Option

**Expected Flow**:

1. **Welcome Screen**:
   - Rouge logo
   - "Welcome to Rouge DevOps Automation!"
   - Connection test runs automatically

2. **Main Menu** (6 options):
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

3. **Test Each Option**:

   **Option 1: Change Model**
   - Shows available models from Ollama
   - Select by number
   - Saves to configuration

   **Option 2: Select Agent**
   - Lists all 10 agents with descriptions
   - Select by number
   - Sets as default

   **Option 3: Execute Task**
   - Enter task description
   - Shows spinner during execution
   - Displays result

   **Option 4: Test Connection**
   - Re-tests Ollama connection
   - Shows connection status

   **Option 5: View Configuration**
   - Shows all settings
   - Ollama, Agents, Workflows, Permissions

   **Option 6: List Agents**
   - Shows all agents with descriptions

   **q: Quit**
   - Exits interactive mode

---

## How to Test Web UI Setup

### 1. Start API Server

```bash
cd packages/rouge
bun dev serve
```

### 2. Start Web UI

```bash
cd packages/web
bun dev
```

### 3. Open Browser

```
http://localhost:3001
```

### 4. Test Setup Wizard

**Expected Flow**:

1. **Step 1: Connection Check**
   - Shows "Welcome to Rouge! 👋"
   - Prerequisites listed:
     - Ollama must be running
     - At least one model pulled
   - Click "Check Connection"
   - Should show green success: "✓ Connected to Ollama!"

2. **Step 2: Model Selection**
   - Shows "Select Model 🤖"
   - Dropdown with available models
   - Default: llama3.2:3b
   - Click "Continue"

3. **Step 3: Ready**
   - Shows "All Set! 🎉"
   - Quick tips displayed
   - Click "Start Using Rouge"
   - Dashboard loads

4. **After Setup**
   - Setup is remembered
   - Next visit goes directly to Dashboard
   - Can reconfigure in Settings page

---

## Testing Scenarios

### Scenario 1: First-Time CLI User

```bash
$ rouge

# Should see:
# - Welcome message
# - Connection test
# - Main menu

# Try:
1. Select option: 1 (Change Model)
2. Choose a model from list
3. Select option: 2 (Select Agent)
4. Choose "test" agent
5. Select option: 3 (Execute Task)
6. Enter: "Generate unit tests for authentication"
7. See results
8. Press q to quit
```

### Scenario 2: First-Time Web User

```
1. Visit http://localhost:3001
2. Setup wizard appears
3. Click "Check Connection"
4. Select "llama3.2:3b"
5. Click "Continue"
6. Click "Start Using Rouge"
7. Dashboard loads
8. Navigate to Agents page
9. Execute a task
```

### Scenario 3: Returning User (CLI)

```bash
$ rouge

# Should see:
# - Configuration loaded automatically
# - Main menu ready
# - Select option 3 to execute task immediately
```

### Scenario 4: Returning User (Web)

```
1. Visit http://localhost:3001
2. Dashboard loads directly (no setup)
3. All features available
```

---

## Expected Interactive Mode Features

### ✅ Implemented Features

1. **Welcome Screen**
   - Rouge logo
   - Welcome message
   - Automatic connection test

2. **Main Menu**
   - Current settings display (model, agent, status)
   - 6 interactive options
   - Quit option

3. **Model Selection**
   - Fetches available models from Ollama
   - Lists all pulled models
   - Select by number
   - Saves to configuration

4. **Agent Selection**
   - Lists all 10 agents
   - Shows description for each
   - Select by number
   - Sets as default

5. **Task Execution**
   - Input field for task description
   - Spinner during execution
   - Result display
   - Error handling

6. **Connection Testing**
   - Tests Ollama connection
   - Shows status
   - Warns if not available

7. **Configuration Viewing**
   - Shows all settings
   - Ollama configuration
   - Agent settings
   - Workflow options
   - Permissions

8. **Agent Listing**
   - Shows all agents with descriptions
   - Helps with agent selection

---

## Troubleshooting

### CLI: "Ollama is not available"

```bash
# Start Ollama
ollama serve

# Try again
rouge
```

### CLI: "No models found"

```bash
# Pull a model
ollama pull llama3.2:3b

# Try again
rouge
```

### CLI: Interactive mode not starting

Check that run.ts was updated:

```bash
cat packages/rouge/src/cli/cmd/run.ts
```

Should contain:
```typescript
import { Interactive } from "../interactive.js"
```

### Web: Setup wizard keeps appearing

```bash
# Check config exists
cat ~/.config/rouge/config.json

# If missing, run CLI first to create it
rouge
# Select option 5 to view config (creates if missing)
# Then quit
```

### Web: Connection check fails

1. Make sure API server is running: `bun dev serve`
2. Make sure Ollama is running: `ollama serve`
3. Check API: `curl http://localhost:3000/health`

---

## Manual Testing Checklist

### CLI Interactive Mode

- [ ] Welcome screen displays correctly
- [ ] Connection test runs automatically
- [ ] Main menu shows current settings
- [ ] Option 1: Model list fetches from Ollama
- [ ] Option 1: Model selection saves to config
- [ ] Option 2: Agent list shows all 10 agents
- [ ] Option 2: Agent selection updates default
- [ ] Option 3: Task execution works with spinner
- [ ] Option 3: Results display correctly
- [ ] Option 4: Connection test re-checks Ollama
- [ ] Option 5: Configuration displays all settings
- [ ] Option 6: Agent list shows descriptions
- [ ] q: Quits cleanly

### Web UI Setup Wizard

- [ ] Setup wizard appears on first visit
- [ ] Step 1: Connection check button works
- [ ] Step 1: Success message appears when connected
- [ ] Step 2: Model dropdown shows models
- [ ] Step 2: Continue button advances to step 3
- [ ] Step 3: Quick tips display
- [ ] Step 3: Start button loads dashboard
- [ ] Setup completion persists
- [ ] Next visit skips to dashboard

### Integration

- [ ] CLI and Web use same configuration
- [ ] Changes in CLI reflect in Web
- [ ] Changes in Web reflect in CLI
- [ ] Both work with Ollama simultaneously

---

## Commands Quick Reference

```bash
# Start everything
ollama serve                          # Terminal 1
cd packages/rouge && bun dev serve    # Terminal 2
cd packages/web && bun dev            # Terminal 3
cd packages/rouge && bun dev          # Terminal 4 (CLI)

# Test CLI
rouge                                 # Interactive mode
rouge --help                          # Help
rouge status                          # System status

# Test Web
open http://localhost:3001            # Browser
```

---

## Success Criteria

Interactive mode is working correctly when:

1. ✅ `rouge` command starts interactive mode
2. ✅ Welcome screen displays
3. ✅ Connection test runs automatically
4. ✅ Main menu appears with 6 options
5. ✅ All options work as expected
6. ✅ Configuration persists between sessions
7. ✅ Web setup wizard works
8. ✅ Both CLI and Web use same config

---

## Summary

### What's New

1. **CLI Interactive Mode** (`interactive.ts`)
   - Complete menu-driven interface
   - 6 interactive options
   - Model and agent selection
   - Task execution
   - Configuration management

2. **Web Setup Wizard** (`Setup.tsx`)
   - 3-step setup flow
   - Connection testing
   - Model selection
   - Setup persistence

3. **Run Command** (`run.ts`)
   - Connected to interactive mode
   - Simple `rouge` command
   - No additional arguments needed

### Files Modified

- `packages/rouge/src/cli/cmd/run.ts` - Updated to use Interactive.start()
- `packages/rouge/src/cli/interactive.ts` - Interactive mode implementation
- `packages/web/src/components/Setup.tsx` - Setup wizard
- `packages/web/src/App.tsx` - Setup detection

### Ready to Test

Both CLI and Web interactive experiences are now complete and ready for testing!

---

*Interactive Mode Testing Guide*
*Complete Implementation*
*Date: 2026-03-21*
