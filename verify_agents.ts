import { Agent } from "./packages/rouge/src/agent/agent.js"
import { Log } from "./packages/rouge/src/util/log.js"

const log = Log.create({ service: "test:agent" })

async function runTest() {
  log.info("Starting Agent Verification Test...")
  
  const request = {
    type: "test" as const,
    task: "Explore the project structure and tell me what the main entry point is.",
    stream: false
  }

  try {
    const result = await Agent.execute(request)
    console.log("\n--- AGENT OUTPUT ---")
    console.log(result.output)
    console.log("--- END OUTPUT ---\n")
    
    if (result.success) {
      log.info(`Test passed with ${result.metadata?.iterations} iterations`)
    } else {
      log.error("Test failed: " + result.output)
    }
  } catch (error) {
    log.error("Execution error: " + error)
  }
}

runTest()
