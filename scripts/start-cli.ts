#!/usr/bin/env bun

/**
 * Rouge.ai - The Fairy Tail
 * Start Full-Featured Interactive CLI Mode
 * This uses the built-in interactive mode with all features
 */

import { sleep } from "bun"

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  purple: "\x1b[35m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
}

const log = {
  info: (msg: string) => console.log(`${colors.blue}${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}${msg}${colors.reset}`),
  magic: (msg: string) => console.log(`${colors.purple}${msg}${colors.reset}`),
}

console.log(`${colors.purple}⌨️  Starting Rouge.ai Interactive CLI Mode${colors.reset}\n`)

// Check if Ollama is running
log.info("🔍 Checking Ollama...")
try {
  const response = await fetch("http://localhost:11434/api/tags", {
    signal: AbortSignal.timeout(2000),
  })
  if (response.ok) {
    log.success("✅ Ollama is running")
  }
} catch {
  log.warning("⚠️  Ollama is not running. Please start it with:")
  log.warning("   ollama serve")
  log.warning("\nContinuing anyway...\n")
}

console.log("\n" + colors.green + "════════════════════════════════════════" + colors.reset)
console.log(colors.purple + "⌨️  Launching Full-Featured Interactive Mode" + colors.reset)
console.log(colors.green + "════════════════════════════════════════" + colors.reset)
console.log("")
log.info("Starting Rouge CLI with all features...")
log.info("✨ Model selection")
log.info("✨ Workspace browser")
log.info("✨ Agent selection")
log.info("✨ Command palette")
log.info("✨ Configuration management")
console.log("")

await sleep(1000)

// Launch the full interactive CLI using the existing rouge CLI
const proc = Bun.spawn(["bun", "run", "dev"], {
  cwd: "packages/rouge",
  stdio: ["inherit", "inherit", "inherit"],
  env: {
    ...process.env,
  }
})

// Handle cleanup on exit
process.on("SIGINT", () => {
  console.log("\n" + colors.blue + "🛑 Shutting down..." + colors.reset)
  proc.kill()
  process.exit(0)
})

process.on("SIGTERM", () => {
  proc.kill()
  process.exit(0)
})

// Wait for the process
await proc.exited
