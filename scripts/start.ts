#!/usr/bin/env bun

/**
 * Rouge.ai - The Fairy Tail
 * Single command startup script (Bun version)
 */

import { spawn } from "bun"
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

console.log(`${colors.purple}✨ Starting Rouge.ai - The Fairy Tail (Full Mode) ✨${colors.reset}\n`)
console.log(`${colors.blue}Mode:${colors.reset} Web UI + API Server`)
console.log("")

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

// Check if dependencies are installed
const hasNodeModules = await Bun.file("node_modules").exists()
if (!hasNodeModules) {
  log.info("📦 Installing dependencies...")
  await Bun.spawn(["bun", "install"], { stdio: ["inherit", "inherit", "inherit"] }).exited
}

// Start backend server
log.success("🚀 Starting API Server (port 3000)...")
const backend = Bun.spawn(["bun", "run", "dev", "serve", "--port", "3000"], {
  cwd: "packages/rouge",
  stdio: ["inherit", "pipe", "pipe"],
})

// Wait for backend to be ready
log.info("⏳ Waiting for API to be ready...")
let apiReady = false
for (let i = 0; i < 30; i++) {
  try {
    const response = await fetch("http://localhost:3000/api/health", {
      signal: AbortSignal.timeout(1000),
    })
    if (response.ok) {
      log.success("✅ API Server is ready!")
      apiReady = true
      break
    }
  } catch {
    // Ignore errors
  }
  await sleep(1000)
}

if (!apiReady) {
  log.error("❌ API Server failed to start")
  backend.kill()
  process.exit(1)
}

// Start frontend dev server
log.magic("🎨 Starting Web UI (port 3001)...")
const frontend = Bun.spawn(["bun", "run", "dev", "--port", "3001"], {
  cwd: "packages/web",
  stdio: ["inherit", "pipe", "pipe"],
})

// Wait a bit for frontend to start
await sleep(3000)

console.log("\n" + colors.green + "════════════════════════════════════════" + colors.reset)
console.log(colors.purple + "✨ Full Mode - Ready! ✨" + colors.reset)
console.log(colors.green + "════════════════════════════════════════" + colors.reset)
console.log("")
console.log(`${colors.blue}📡 API Server:${colors.reset}  http://localhost:3000`)
console.log(`${colors.purple}🌐 Web UI:${colors.reset}      http://localhost:3001`)
console.log("")
log.warning("Press Ctrl+C to stop all services")
console.log("")

// Handle cleanup on exit
process.on("SIGINT", () => {
  console.log("\n" + colors.blue + "🛑 Shutting down Rouge.ai..." + colors.reset)
  backend.kill()
  frontend.kill()
  process.exit(0)
})

process.on("SIGTERM", () => {
  backend.kill()
  frontend.kill()
  process.exit(0)
})

// Keep script running
await Promise.all([backend.exited, frontend.exited])
