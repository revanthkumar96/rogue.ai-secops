import { cmd } from "./cmd.js"
import { UI } from "../ui/index.js"
import { Agent } from "../../agent/agent.js"
import { Config } from "../../config/config.js"
import { Global } from "../../global/index.js"
import fs from "fs/promises"

export const StatusCommand = cmd({
  command: "status",
  describe: "show Rouge status and configuration",
  handler: async () => {
    UI.header("Rouge Status")
    UI.nl()

    // Check Ollama connectivity
    const connected = await Agent.testConnection()
    UI.kv("Ollama", connected ? "✅ Connected" : "❌ Not available")

    // Load configuration
    const config = await Config.load()
    UI.nl()
    UI.header("Configuration")
    UI.kv("Model", config.ollama.model)
    UI.kv("Ollama URL", config.ollama.url)
    UI.kv("Default Agent", config.agents.default)
    UI.kv("Enabled Agents", config.agents.enabled.join(", "))

    // Paths
    UI.nl()
    UI.header("Paths")
    UI.kv("Config", Global.Path.config)
    UI.kv("Data", Global.Path.data)
    UI.kv("Logs", Global.Path.log)
    UI.kv("Cache", Global.Path.cache)

    // Check database
    UI.nl()
    UI.header("Database")
    try {
      const dbPath = Global.Path.data + "/rouge.db"
      const stats = await fs.stat(dbPath)
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
      UI.kv("Location", dbPath)
      UI.kv("Size", `${sizeMB} MB`)
      UI.kv("Status", "✅ Exists")
    } catch {
      UI.kv("Status", "⚠️  Not initialized")
    }

    UI.nl()
  },
})
