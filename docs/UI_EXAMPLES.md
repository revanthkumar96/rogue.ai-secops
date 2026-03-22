# Rouge UI Examples

> Rouge-style UI system for Rouge CLI

## Overview

Rouge now has a complete UI system matching Rouge's style with colors, spinners, progress bars, and formatted output.

---

## Basic Messages

### Success
```typescript
UI.success("Deployment completed successfully")
```
Output: `✔ Deployment completed successfully` (green)

### Error
```typescript
UI.error("Failed to connect to Ollama")
```
Output: `✖ Failed to connect to Ollama` (red)

### Warning
```typescript
UI.warn("Configuration file not found, using defaults")
```
Output: `⚠ Configuration file not found, using defaults` (yellow)

### Info
```typescript
UI.info("Starting API server on port 3000")
```
Output: `ℹ Starting API server on port 3000` (blue)

---

## Headers and Formatting

### Header
```typescript
UI.header("Test Results")
```
Output:
```
Test Results
────────────
```

### Divider
```typescript
UI.divider()
```
Output: `──────────────────────────────────────────────────`

### Step Indicator
```typescript
UI.step("Validating deployment configuration")
UI.step("Deploying to production")
UI.step("Running health checks")
```
Output:
```
→ Validating deployment configuration
→ Deploying to production
→ Running health checks
```

### List Items
```typescript
UI.item("Test suite: auth")
UI.item("Test suite: api")
UI.item("Test suite: database")
```
Output:
```
  • Test suite: auth
  • Test suite: api
  • Test suite: database
```

---

## Spinners

### Basic Spinner
```typescript
const spinner = UI.spinner("Deploying application")
spinner.start()

// ... do work ...

spinner.succeed("Deployment complete!")
// or
spinner.fail("Deployment failed!")
```

Output (animated):
```
⠋ Deploying application
⠙ Deploying application
⠹ Deploying application
...
✔ Deployment complete!
```

### Update Spinner Message
```typescript
const spinner = UI.spinner("Starting deployment")
spinner.start()

// Update message during operation
spinner.update("Uploading artifacts")
await uploadArtifacts()

spinner.update("Running migrations")
await runMigrations()

spinner.succeed("Deployment complete!")
```

---

## Progress Bars

### Basic Progress
```typescript
const total = 100
for (let i = 0; i <= total; i++) {
  UI.progress(i, total)
  await sleep(50)
}
```

Output:
```
████████████████████████████░░ 80%
```

### Progress with Message
```typescript
const files = ["auth.ts", "api.ts", "db.ts"]
files.forEach((file, i) => {
  UI.progress(i + 1, files.length, `Processing ${file}`)
})
```

Output:
```
████████████████████████████░░ 67% Processing db.ts
```

---

## Tables

### Simple Table
```typescript
UI.tableHeader(["Name", "Status", "Duration"])
UI.tableRow(["auth-test", "passed", "1.2s"])
UI.tableRow(["api-test", "passed", "0.8s"])
UI.tableRow(["db-test", "failed", "2.1s"])
```

Output:
```
Name         Status   Duration
──────────────────────────────
auth-test    passed   1.2s
api-test     passed   0.8s
db-test      failed   2.1s
```

### Agent List Table
```typescript
UI.header("Available Agents")
UI.nl()
UI.tableHeader(["Agent", "Description"])
UI.tableRow(["test", "Test automation"])
UI.tableRow(["deploy", "Deployment automation"])
UI.tableRow(["monitor", "System monitoring"])
UI.tableRow(["analyze", "Log analysis"])
```

---

## Key-Value Pairs

```typescript
UI.header("Configuration")
UI.kv("Model", "llama3.2:3b")
UI.kv("Provider", "Ollama")
UI.kv("URL", "http://localhost:11434")
UI.kv("Timeout", "30s")
```

Output:
```
Configuration
─────────────
  Model: llama3.2:3b
  Provider: Ollama
  URL: http://localhost:11434
  Timeout: 30s
```

---

## JSON Output

```typescript
UI.json({
  status: "deployed",
  environment: "production",
  version: "1.2.3",
  deployed_at: Date.now()
})
```

Output:
```json
{
  "status": "deployed",
  "environment": "production",
  "version": "1.2.3",
  "deployed_at": 1711065600000
}
```

---

## Code Blocks

```typescript
UI.code(`
function deploy() {
  console.log("Deploying...")
}
`, "typescript")
```

Output:
```
┌──────────────────────────────────────────────────
│ function deploy() {
│   console.log("Deploying...")
│ }
└──────────────────────────────────────────────────
```

---

## Complete Example: Deploy Workflow

```typescript
import { UI } from "./cli/ui"

async function deployWorkflow() {
  // Logo
  console.log(UI.logo())

  // Header
  UI.header("Deployment Workflow")
  UI.nl()

  // Configuration
  UI.step("Loading configuration")
  UI.kv("Environment", "production")
  UI.kv("Version", "1.2.3")
  UI.nl()

  // Validation
  const validateSpinner = UI.spinner("Validating deployment configuration")
  validateSpinner.start()
  await validateConfig()
  validateSpinner.succeed("Configuration validated")

  // Build
  const buildSpinner = UI.spinner("Building application")
  buildSpinner.start()
  await buildApp()
  buildSpinner.succeed("Application built")

  // Deploy
  UI.nl()
  UI.step("Deploying application")

  const steps = ["Upload", "Migrate", "Restart", "Health Check"]
  for (let i = 0; i < steps.length; i++) {
    UI.progress(i + 1, steps.length, steps[i])
    await performStep(steps[i])
  }

  // Results
  UI.nl()
  UI.header("Deployment Summary")
  UI.tableHeader(["Service", "Status", "URL"])
  UI.tableRow(["API", "✔ healthy", "https://api.example.com"])
  UI.tableRow(["Web", "✔ healthy", "https://example.com"])

  UI.nl()
  UI.success("Deployment completed successfully!")
}
```

Output:
```
╦═╗╔═╗╦ ╦╔═╗╦ ╦╔═╗
╠╦╝║ ║║ ║║ ║║ ║║╣
╩╚═╚═╝╚═╝╚═╝╚═╝╚═╝
DevOps & Testing Automation Platform

Deployment Workflow
──────────────────

→ Loading configuration
  Environment: production
  Version: 1.2.3

✔ Configuration validated
✔ Application built

→ Deploying application
████████████████████████████████████ 100% Health Check

Deployment Summary
──────────────────
Service  Status      URL
────────────────────────────────────────────
API      ✔ healthy   https://api.example.com
Web      ✔ healthy   https://example.com

✔ Deployment completed successfully!
```

---

## Error Handling Example

```typescript
async function deployWithErrors() {
  const spinner = UI.spinner("Deploying to production")
  spinner.start()

  try {
    await deploy()
    spinner.succeed("Deployment complete!")
  } catch (error) {
    spinner.fail("Deployment failed!")
    UI.nl()
    UI.error(error.message)
    UI.nl()

    UI.header("Troubleshooting")
    UI.item("Check Ollama is running: ollama serve")
    UI.item("Verify configuration: rouge config show")
    UI.item("Check logs: tail -f ~/.local/share/rouge/log/rouge.log")
  }
}
```

Output (on error):
```
✖ Deployment failed!

✖ Connection refused: http://localhost:11434

Troubleshooting
───────────────
  • Check Ollama is running: ollama serve
  • Verify configuration: rouge config show
  • Check logs: tail -f ~/.local/share/rouge/log/rouge.log
```

---

## Debug Mode

Set `DEBUG=1` to see debug messages:

```typescript
UI.debug("Loading configuration from ~/.config/rouge/config.json")
UI.debug("Database path: ~/.local/share/rouge/rouge.db")
UI.debug("Agent prompt: test-agent.txt")
```

Output (only when DEBUG=1):
```
[DEBUG] Loading configuration from ~/.config/rouge/config.json
[DEBUG] Database path: ~/.local/share/rouge/rouge.db
[DEBUG] Agent prompt: test-agent.txt
```

---

## Color Reference

The UI system uses ANSI color codes:

- **Red**: Errors, failures
- **Green**: Success, completion
- **Yellow**: Warnings, prompts
- **Blue**: Info, general messages
- **Cyan**: Steps, actions, spinners
- **Gray**: Debug, secondary text
- **Bold**: Headers, emphasis
- **Dim**: Borders, less important text

---

## Best Practices

1. **Use spinners for operations > 1 second**
   ```typescript
   const spinner = UI.spinner("Loading data")
   spinner.start()
   await loadData()
   spinner.succeed()
   ```

2. **Use progress bars for multi-step operations**
   ```typescript
   steps.forEach((step, i) => {
     UI.progress(i + 1, steps.length, step)
   })
   ```

3. **Structure output with headers and dividers**
   ```typescript
   UI.header("Results")
   // ... content ...
   UI.divider()
   ```

4. **Use key-value for configuration display**
   ```typescript
   UI.kv("Setting", "Value")
   ```

5. **Use tables for structured data**
   ```typescript
   UI.tableHeader(["Col1", "Col2"])
   UI.tableRow(["A", "B"])
   ```

6. **Always provide context with errors**
   ```typescript
   UI.error("Operation failed")
   UI.nl()
   UI.step("Try these solutions:")
   UI.item("Solution 1")
   UI.item("Solution 2")
   ```

---

## Complete UI API

```typescript
// Messages
UI.error(msg)       // Red error
UI.success(msg)     // Green success
UI.info(msg)        // Blue info
UI.warn(msg)        // Yellow warning
UI.debug(msg)       // Gray debug
UI.step(msg)        // Cyan step
UI.item(msg)        // List item

// Formatting
UI.header(msg)      // Bold header
UI.divider()        // Line separator
UI.nl()            // Empty line
UI.kv(key, val)    // Key-value
UI.json(data)      // Pretty JSON
UI.code(code)      // Code block

// Tables
UI.tableHeader([])  // Table header
UI.tableRow([])    // Table row

// Interactive
UI.spinner(msg)    // Spinner instance
UI.progress(n, t)  // Progress bar
UI.confirm(msg)    // Confirmation

// Utility
UI.clear()         // Clear screen
UI.logo()          // Rouge logo
```

---

*Rouge-Style UI System*
*Full color and formatting support*
*Date: 2026-03-21*
