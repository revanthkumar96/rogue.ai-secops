import readline from "readline"
import fs from "fs/promises"
import path from "path"
import { UI } from "./ui/index.js"
import { Agent } from "../agent/agent.js"
import { Config } from "../config/config.js"
import { Ollama } from "../provider/ollama.js"
import type { AgentType } from "@rouge/shared/types"

/**
 * Interactive mode for Rouge
 * Single command UI for model selection and agent execution
 */

interface InteractiveState {
  config: Awaited<ReturnType<typeof Config.load>>
  selectedAgent: AgentType
  connected: boolean
}

export namespace Interactive {
  let rl: readline.Interface
  let state: InteractiveState

  export async function start() {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    // Load configuration
    state = {
      config: await Config.load(),
      selectedAgent: "router",
      connected: false,
    }

    // Show welcome & Init
    await showWelcome()

    // Main loop
    await mainLoop()
  }

  async function showWelcome() {
    UI.clear()
    console.log(UI.logo())
    
    const bootSteps = [
      "Initializing Neural Core",
      "Mounting Agent Protocols",
      "Indexing Workspace Environment",
      "Establishing Secure Ollama Uplink"
    ]

    for (const step of bootSteps) {
      await new Promise(r => setTimeout(r, 100))
      UI.step(`${step}...`)
    }

    UI.nl()
    await testConnection()
    UI.nl()
    UI.info("ROUGE OS v1.0.0 is online and awaiting transmission.")
    UI.nl()
    UI.divider()
  }

  async function testConnection() {
    const spinner = UI.spinner("Testing Ollama connection")
    spinner.start()

    try {
      state.connected = await Agent.testConnection()
      if (state.connected) {
        spinner.succeed("Connected to Ollama")
      } else {
        spinner.fail("Ollama is not available")
        UI.nl()
        UI.warn("Please start Ollama: ollama serve")
        UI.nl()
      }
    } catch (error) {
      spinner.fail("Connection failed")
      state.connected = false
    }
  }

  async function mainLoop() {
    while (true) {
      UI.nl()
      const input = await prompt(`[${state.selectedAgent}] @ Rouge > `)

      if (input === null || input === "q" || input === "quit" || input === "exit") {
        UI.nl()
        UI.success("Goodbye!")
        UI.nl()
        rl.close()
        process.exit(0)
      }

      const trimmedInput = input.trim()
      if (trimmedInput.startsWith("/") || trimmedInput.startsWith("@") || trimmedInput === "?" || trimmedInput === "") {
        await handleSlashCommand(trimmedInput)
      } else {
        // Natural language task for the selected agent
        await executeTask(trimmedInput)
      }
    }
  }

  async function handleSlashCommand(input: string) {
    if (input === "?" || input === "/" || input === "/help" || input === "") {
        const choice = await UI.select([
            { label: `Change Model      - Currently: ${state.config.ollama.model}`, value: "1" },
            { label: `Select Agent      - Currently: ${state.selectedAgent}`, value: "2" },
            { label: "View Stats        - System dashboard", value: "3" },
            { label: "Test Connection   - Verify Ollama", value: "4" },
            { label: "View Config       - Full detail", value: "5" },
            { label: "List Agents       - Available builders", value: "6" },
            { label: `Set Workspace     - Currently: ${state.config.workspace || "CWD"}`, value: "7" },
            { label: "Close Palette", value: "q" }
        ], "ROUGE Command Palette")

        if (choice && choice !== "q") {
            await handleChoice(choice)
        }
        return
    }

    if (input === "@") {
        const agents = Agent.listAgents()
        const choice = await UI.select(
            agents.map(a => ({ label: a, value: a })),
            "Select Agent"
        )
        if (choice) {
            state.selectedAgent = choice as AgentType
            UI.success(`Selected agent: ${state.selectedAgent}`)
        }
        return
    }

    // Handle number shortcuts if they start with /
    const shortcut = input.startsWith("/") ? input.substring(1) : input
    if (["1", "2", "3", "4", "5", "6", "7"].includes(shortcut)) {
        await handleChoice(shortcut)
        return
    }

    if (input.startsWith("/config workspace ")) {
      const workspace = input.replace("/config workspace ", "").trim()
      state.config.workspace = workspace
      await Config.save(state.config)
      UI.success(`Workspace updated to: ${workspace}`)
      return
    }

    if (input.startsWith("@") || input.startsWith("/agent ")) {
        const parts = input.startsWith("@") 
            ? input.substring(1).split(" ") 
            : input.replace("/agent ", "").split(" ")
        
        const agentName = parts[0] as AgentType
        const task = parts.slice(1).join(" ")

        if (!Agent.listAgents().includes(agentName)) {
            UI.error(`Unknown agent: ${agentName}`)
            return
        }

        if (!task) {
            UI.info(`Selected agent: ${agentName}. Now enter your task.`)
            state.selectedAgent = agentName
            return
        }

        // Execute directly
        await executeTask(task, agentName)
        return
    }

    UI.warn(`Unknown command: ${input}. Type ? for help.`)
  }

  async function handleChoice(choice: string) {
    switch (choice) {
      case "1":
        await changeModel()
        break
      case "2":
        await selectAgent()
        break
      case "3":
        // Show status/stats
        UI.nl()
        UI.header("System Status")
        UI.kv("Ollama", state.connected ? "READY" : "OFFLINE")
        UI.kv("Model", state.config.ollama.model)
        UI.kv("Workspace", state.config.workspace || "Not set")
        UI.nl()
        break
      case "4":
        await testConnection()
        break
      case "5":
        await viewConfig()
        break
      case "6":
        await listAgents()
        break
      case "7":
        await setWorkspace()
        break
      default:
        UI.warn("Invalid option")
    }
  }

  async function setWorkspace() {
    UI.nl()
    UI.header("Set Project Workspace")
    UI.nl()
    UI.info("Current Workspace: " + (state.config.workspace || "Not set"))
    UI.nl()

    const startDir = state.config.workspace || process.cwd()
    const selected = await browseFiles(startDir)

    if (selected) {
      state.config.workspace = selected
      await Config.save(state.config)
      UI.success(`Workspace set to: ${selected}`)
    } else {
      UI.info("No changes made to workspace.")
    }
  }

  async function browseFiles(startPath: string): Promise<string | null> {
    let currentPath = path.resolve(startPath)
    
    while (true) {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true })
        const folders = entries.filter(e => e.isDirectory() && !e.name.startsWith(".")).map(e => e.name).sort()
        
        const items = [
            { label: ".. [Go Up]", value: "up" },
            ...folders.map(f => ({ label: `📁 ${f}`, value: f })),
            { label: "✅ SELECT CURRENT FOLDER", value: "select" },
            { label: "❌ CANCEL", value: "cancel" }
        ]

        const choice = await UI.select(items, `Browsing: ${currentPath}`)
        
        if (!choice || choice === "cancel") return null
        if (choice === "select") return currentPath
        if (choice === "up") {
          currentPath = path.dirname(currentPath)
          continue
        }

        currentPath = path.join(currentPath, choice)
      } catch (err: any) {
        UI.error(`Access failed: ${err.message}`)
        return null
      }
    }
  }

  async function changeModel() {
    const spinner = UI.spinner("Fetching available models")
    spinner.start()

    try {
      const provider = await Ollama.Default()
      const models = await provider.listModels()
      spinner.succeed(`Found ${models.length} models`)

      if (models.length === 0) {
        UI.warn("No models found. Pull a model first")
        return
      }

      const choice = await UI.select(
        models.map(m => ({ label: m, value: m })),
        "Select Model"
      )

      if (choice) {
        state.config.ollama.model = choice
        await Config.save(state.config)
        UI.success(`Model changed to: ${choice}`)
      }
    } catch (error: any) {
      spinner.fail("Failed to fetch models")
      UI.error(error.message)
    }
  }

  async function selectAgent() {
    const agents = Agent.listAgents()
    const choice = await UI.select(
        agents.map(a => ({ label: a, value: a })),
        "Select Agent"
    )

    if (choice) {
      state.selectedAgent = choice as AgentType
      const capability = await Agent.getCapabilities(state.selectedAgent)
      UI.success(`Agent selected: ${state.selectedAgent}`)
      UI.info(capability.description)
    }
  }

  async function executeTask(taskInput?: string, agentOverride?: AgentType) {
    if (!state.connected) {
      UI.error("Not connected to Ollama. Please start Ollama first.")
      return
    }

    const agentName = agentOverride || state.selectedAgent
    const task = taskInput || await prompt("Enter task: ")

    if (!task || !task.trim()) {
      UI.warn("Task cannot be empty")
      return
    }

    UI.nl()
    const spinner = UI.spinner(`Executing ${agentName} agent`)
    spinner.start()

    try {
      const result = await Agent.execute({
        type: agentName,
        task,
        stream: false,
      })

      if (result.success) {
        spinner.succeed("Task completed")
        UI.nl()
        UI.divider()
        UI.nl()
        console.log(result.output)
        UI.nl()
        UI.divider()
      } else {
        spinner.fail("Task failed")
        UI.nl()
        UI.error(result.output)
      }
    } catch (error: any) {
      spinner.fail("Execution failed")
      UI.nl()
      UI.error(error.message)
    }
  }

  async function viewConfig() {
    UI.nl()
    UI.header("Configuration")
    UI.nl()

    UI.step("Ollama")
    UI.kv("URL", state.config.ollama.url)
    UI.kv("Model", state.config.ollama.model)
    UI.kv("Timeout", `${state.config.ollama.timeout}ms`)
    UI.nl()

    UI.step("Agents")
    UI.kv("Default", state.config.agents.default)
    UI.kv("Enabled", state.config.agents.enabled.join(", "))
    UI.kv("Max Concurrent", state.config.agents.maxConcurrent.toString())
    UI.nl()

    UI.step("Workflows")
    UI.kv("Parallel", state.config.workflows.parallel ? "Yes" : "No")
    UI.kv("Timeout", `${state.config.workflows.timeout}s`)
    UI.kv("Retries", state.config.workflows.retries.toString())
    UI.nl()

    UI.step("Permissions")
    UI.kv("Deploy", state.config.permissions.deploy)
    UI.kv("Test", state.config.permissions.test)
    UI.kv("Bash", state.config.permissions.bash)
  }

  async function listAgents() {
    UI.nl()
    UI.header("Available Agents")
    UI.nl()

    const agents = Agent.listAgents()

    for (const agent of agents) {
      const capability = await Agent.getCapabilities(agent)
      UI.step(capability.name)
      UI.item(capability.description)
      UI.nl()
    }
  }

  function prompt(question: string): Promise<string | null> {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer)
      })
      rl.on("close", () => resolve(null))
    })
  }
}
