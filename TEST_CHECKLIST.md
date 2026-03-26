# ✅ Test Checklist - Rouge.ai

Quick tests to verify everything is working correctly.

## Pre-Flight Checks

### 1. Prerequisites
```bash
# Check Bun installed
bun --version
# Should show: 1.x.x

# Check Ollama installed
ollama --version
# Should show: ollama version x.x.x

# Start Ollama (separate terminal)
ollama serve
# Should show: Ollama is running on http://localhost:11434
```

---

## Startup Tests

### Test 1: System Starts Successfully
```bash
# Start the system
bun run start

# Expected output:
# ✨ Starting Rouge.ai - The Fairy Tail ✨
# 🔍 Checking Ollama...
# ✅ Ollama is running
# 🚀 Starting API Server (port 3000)...
# ⏳ Waiting for API to be ready...
# ✅ API Server is ready!
# 🎨 Starting Web UI (port 3001)...
# ✨ Rouge.ai - The Fairy Tail is READY! ✨
```

**Status**: [ ] PASS / [ ] FAIL

---

### Test 2: API Health Check
```bash
# In another terminal
curl http://localhost:3000/api/health

# Expected:
# {"status":"ok","timestamp":1234567890}
```

**Status**: [ ] PASS / [ ] FAIL

---

### Test 3: Web UI Loads
```bash
# Open browser: http://localhost:3001

# Expected:
# - Beautiful gradient header with "Rouge.ai"
# - Connection status shows "ONLINE" (green)
# - Agent grid displays 10 agents
# - No console errors
```

**Status**: [ ] PASS / [ ] FAIL

---

## Agent Execution Tests

### Test 4: List Agents API
```bash
curl http://localhost:3000/api/agents

# Expected:
# {"agents":["test","deploy","monitor","analyze","ci-cd","security","performance","infrastructure","incident","database","router"]}
```

**Status**: [ ] PASS / [ ] FAIL

---

### Test 5: Router Agent Execution
```bash
# In Web UI, type:
"Hello, can you help me?"

# Expected:
# - Button shows "⏳ Processing..."
# - Response appears in result box
# - No 400 error
# - Response shows agent routed the request
```

**Status**: [ ] PASS / [ ] FAIL

---

### Test 6: Create Workflow (CRUD Test)
```bash
# In Web UI, type:
"Create a deployment workflow with build, test, and deploy steps"

# Expected:
# - Agent creates workflow in database
# - Returns workflow ID
# - Success message
```

**Status**: [ ] PASS / [ ] FAIL

---

### Test 7: List Workflows
```bash
# In Web UI, type:
"Show me all workflows"

# Expected:
# - Agent queries database
# - Lists workflows (at least the one created above)
# - Shows workflow details
```

**Status**: [ ] PASS / [ ] FAIL

---

### Test 8: Get Statistics
```bash
# In Web UI, type:
"What are the workflow statistics?"

# Expected:
# - Agent uses GetWorkflowStats tool
# - Returns stats (total, by_status)
# - Shows at least 1 workflow
```

**Status**: [ ] PASS / [ ] FAIL

---

## Browser Console Tests

### Test 9: No SolidJS Warnings
```bash
# Open browser console (F12)
# Look for warnings

# Expected:
# - NO "cleanups created outside createRoot" warning
# - NO unhandled promise rejections
# - Normal Vite HMR messages OK
```

**Status**: [ ] PASS / [ ] FAIL

---

### Test 10: No 400 Errors
```bash
# Execute any agent command in Web UI
# Check Network tab in browser (F12)

# Expected:
# - POST to /api/agent/execute returns 200 (not 400)
# - Response contains agent output
```

**Status**: [ ] PASS / [ ] FAIL

---

## Shutdown Tests

### Test 11: Clean Shutdown
```bash
# Press Ctrl+C in terminal where system is running

# Expected:
# 🛑 Shutting down Rouge.ai...
# Both processes stop cleanly
# No error messages
# Terminal returns to prompt
```

**Status**: [ ] PASS / [ ] FAIL

---

### Test 12: No Hanging Processes
```bash
# After shutdown, check ports are free
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Mac/Linux:
lsof -ti:3000
lsof -ti:3001

# Expected:
# No output (ports are free)
```

**Status**: [ ] PASS / [ ] FAIL

---

## Database Tests

### Test 13: Database File Created
```bash
# Check database location
# Windows:
ls %LOCALAPPDATA%\rouge\rouge.db

# Mac/Linux:
ls ~/.local/share/rouge/rouge.db

# Expected:
# rouge.db file exists
```

**Status**: [ ] PASS / [ ] FAIL

---

### Test 14: Tables Created
```bash
# Install sqlite3 if needed
# Then check tables:
sqlite3 ~/.local/share/rouge/rouge.db ".tables"

# Expected:
# deployment  execution_log  test_result  test_run  workflow
```

**Status**: [ ] PASS / [ ] FAIL

---

## Summary

**Total Tests**: 14
**Passed**: ___
**Failed**: ___

---

## Common Issues & Solutions

### Issue: Ollama not running
```bash
# Solution: Start Ollama first
ollama serve
```

### Issue: Port 3000 already in use
```bash
# Solution: Kill the process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Issue: Dependencies not installed
```bash
# Solution: Clean install
rm -rf node_modules
bun install
```

### Issue: 400 Bad Request
```bash
# Solution: Verify fix is applied
grep -n "router" packages/rouge/src/server/routes/agent.ts

# Should show "router" in the enum
```

---

**All tests passing?** 🎉 You're ready for Phase 1!
**Some tests failing?** Check the Common Issues section above.
