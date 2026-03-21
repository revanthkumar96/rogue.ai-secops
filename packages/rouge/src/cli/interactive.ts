import readline from "readline"
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
      selectedAgent: (await Config.get("agents")).default as AgentType,
      connected: false,
    }

    // Show welcome
    showWelcome()

    // Test connection
    await testConnection()

    // Main loop
    await mainLoop()
  }

  function showWelcome() {
    console.clear()
    UI.nl()
    console.log(UI.logo())
    UI.nl()
    UI.header("Interactive Mode")
    UI.nl()
    UI.info("Welcome to Rouge DevOps Automation!")
    UI.nl()
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
      showMenu()
      UI.nl()

      const choice = await prompt("Select option (or 'q' to quit): ")

      if (choice === "q" || choice === "quit") {
        UI.nl()
        UI.success("Goodbye!")
        UI.nl()
        rl.close()
        process.exit(0)
      }

      await handleChoice(choice)
    }
  }

  function showMenu() {
    UI.divider()
    UI.nl()
    UI.info("Current Settings:")
    UI.kv("Model", state.config.ollama.model)
    UI.kv("Agent", state.selectedAgent)
    UI.kv("Status", state.connected ? "✅ Connected" : "❌ Disconnected")
    UI.nl()
    UI.divider()
    UI.nl()

    UI.info("Options:")
    UI.item("1. Change Ollama Model")
    UI.item("2. Select Agent")
    UI.item("3. Execute Agent Task")
    UI.item("4. Test Connection")
    UI.item("5. View Configuration")
    UI.item("6. List All Agents")
    UI.item("q. Quit")
    UI.nl()
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
        await executeTask()
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
      default:
        UI.warn("Invalid option")
    }
  }

  async function changeModel() {
    UI.nl()
    UI.header("Change Ollama Model")
    UI.nl()

    // Get available models
    const spinner = UI.spinner("Fetching available models")
    spinner.start()

    try {
      const provider = await Ollama.Default
      const models = await provider.listModels()
      spinner.succeed(`Found ${models.length} models`)

      if (models.length === 0) {
        UI.warn("No models found. Pull a model first:")
        UI.item("ollama pull llama3.2:3b")
        return
      }

      UI.nl()
      UI.info("Available models:")
      models.forEach((model, i) => {
        UI.item(`${i + 1}. ${model}`)
      })
      UI.nl()

      const choice = await prompt("Select model number (or Enter to keep current): ")

      if (choice.trim() === "") {
        UI.info("Keeping current model")
        return
      }

      const index = parseInt(choice) - 1
      if (index >= 0 && index < models.length) {
        state.config.ollama.model = models[index]
        await Config.save(state.config)
        UI.success(`Model changed to: ${models[index]}`)
      } else {
        UI.warn("Invalid selection")
      }
    } catch (error: any) {
      spinner.fail("Failed to fetch models")
      UI.error(error.message)
    }
  }

  async function selectAgent() {
    UI.nl()
    UI.header("Select Agent")
    UI.nl()

    const agents = Agent.listAgents()

    agents.forEach((agent, i) => {
      UI.item(`${i + 1}. ${agent}`)
    })
    UI.nl()

    const choice = await prompt("Select agent number: ")
    const index = parseInt(choice) - 1

    if (index >= 0 && index < agents.length) {
      state.selectedAgent = agents[index]
      const capability = await Agent.getCapabilities(state.selectedAgent)
      UI.success(`Agent selected: ${state.selectedAgent}`)
      UI.info(capability.description)
    } else {
      UI.warn("Invalid selection")
    }
  }

  async function executeTask() {
    if (!state.connected) {
      UI.error("Not connected to Ollama. Please start Ollama first.")
      return
    }

    UI.nl()
    UI.header(`Execute ${state.selectedAgent} Agent`)
    UI.nl()

    const task = await prompt("Enter task: ")

    if (!task.trim()) {
      UI.warn("Task cannot be empty")
      return
    }

    UI.nl()
    const spinner = UI.spinner(`Executing ${state.selectedAgent} agent`)
    spinner.start()

    try {
      const result = await Agent.execute({
        type: state.selectedAgent,
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

  function prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer)
      })
    })
  }
}
