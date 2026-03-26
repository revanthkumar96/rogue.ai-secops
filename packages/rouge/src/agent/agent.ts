import { z } from "zod"
import type { AgentType } from "@rouge/shared/types"
import { Ollama } from "../provider/ollama.js"
import { Provider, type Message } from "../provider/provider.js"
import { Log } from "../util/log.js"
import { lazy } from "../util/lazy.js"
import { Config } from "../config/config.js"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { ToolRegistry } from "../tool/registry.js"
import { DatabaseTool } from "../tool/database.js"

/**
 * Agent system for DevOps automation
 * 10 specialized agents with AI-powered reasoning
 */

const log = Log.create({ service: "agent" })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Agent execution request
export const AgentRequest = z.object({
  type: z.enum([
    "test",
    "deploy",
    "monitor",
    "analyze",
    "ci-cd",
    "security",
    "performance",
    "infrastructure",
    "incident",
    "database",
    "router",
  ]),
  task: z.string(),
  context: z.record(z.any()).optional(),
  stream: z.boolean().default(false),
})
export type AgentRequest = z.infer<typeof AgentRequest>

// Agent execution result
export const AgentResult = z.object({
  type: z.enum([
    "test",
    "deploy",
    "monitor",
    "analyze",
    "ci-cd",
    "security",
    "performance",
    "infrastructure",
    "incident",
    "database",
    "router",
  ]),
  output: z.string(),
  success: z.boolean(),
  metadata: z.record(z.any()).optional(),
})
export type AgentResult = z.infer<typeof AgentResult>

// Agent capabilities
interface AgentCapability {
  name: AgentType
  description: string
  prompt: string
  tools: string[]
  permissions: any[]
}

export namespace Agent {
  /**
   * Load agent prompt from file
   */
  async function loadPrompt(type: AgentType): Promise<string> {
    const promptPath = path.join(
      __dirname,
      "persona",
      `${type}-agent.md`
    )

    try {
      return await fs.readFile(promptPath, "utf-8")
    } catch (error) {
      log.error(`Failed to load prompt for ${type}: ${error}`)
      throw new Error(`Agent prompt not found: ${type}`)
    }
  }

  /**
   * Get agent capabilities
   */
  export async function getCapabilities(
    type: AgentType
  ): Promise<AgentCapability> {
    const prompt = await loadPrompt(type)

    const capabilities: Record<AgentType, Omit<AgentCapability, "prompt">> = {
      test: {
        name: "test",
        description: "Test generation and execution",
        tools: ["ReadFile", "ListDir", "Bash", "Grep"],
        permissions: [
          { tool: "Bash", action: "allow", pattern: "bun test|npm test" },
          { tool: "ReadFile", action: "allow" },
          { tool: "ListDir", action: "allow" },
          { tool: "Grep", action: "allow" }
        ],
      },
      deploy: {
        name: "deploy",
        description: "Deployment automation",
        tools: ["ReadFile", "ListDir", "Bash", "Grep"],
        permissions: [
          { tool: "Bash", action: "ask", pattern: "nomad|kubectl|ssh" },
          { tool: "ReadFile", action: "allow" },
          { tool: "ListDir", action: "allow" }
        ],
      },
      monitor: {
        name: "monitor",
        description: "System monitoring and alerting",
        tools: ["ReadFile", "Bash", "Grep"],
        permissions: [
          { tool: "Bash", action: "allow", pattern: "ps|top|df|du" },
          { tool: "ReadFile", action: "allow" }
        ],
      },
      analyze: {
        name: "analyze",
        description: "Log and error analysis",
        tools: ["ReadFile", "Grep"],
        permissions: [
          { tool: "ReadFile", action: "allow" },
          { tool: "Grep", action: "allow" }
        ],
      },
      "ci-cd": {
        name: "ci-cd",
        description: "CI/CD pipeline automation",
        tools: ["ReadFile", "ListDir", "Bash", "Grep"],
        permissions: [
          { tool: "*", action: "allow" }
        ],
      },
      security: {
        name: "security",
        description: "Security scanning and compliance",
        tools: ["ReadFile", "ListDir", "Bash", "Grep"],
        permissions: [
          { tool: "Bash", action: "allow", pattern: "snyk|trivy|audit" },
          { tool: "ReadFile", action: "allow" }
        ],
      },
      performance: {
        name: "performance",
        description: "Performance and load testing",
        tools: ["ReadFile", "Bash"],
        permissions: [
          { tool: "Bash", action: "allow", pattern: "k6|ab|wrk" },
          { tool: "ReadFile", action: "allow" }
        ],
      },
      infrastructure: {
        name: "infrastructure",
        description: "Infrastructure-as-Code management",
        tools: ["ReadFile", "ListDir", "Bash"],
        permissions: [
          { tool: "Bash", action: "ask", pattern: "terraform|pulse|pulumi" },
          { tool: "ReadFile", action: "allow" }
        ],
      },
      incident: {
        name: "incident",
        description: "Incident response and troubleshooting",
        tools: ["ReadFile", "Bash", "Grep"],
        permissions: [
          { tool: "*", action: "allow" }
        ],
      },
      database: {
        name: "database",
        description: "Database operations and optimization",
        tools: ["ReadFile", "Bash"],
        permissions: [
          { tool: "Bash", action: "ask", pattern: "psql|mysql|mongo" },
          { tool: "ReadFile", action: "allow" }
        ],
      },
      router: {
        name: "router",
        description: "Parent Routing Agent - Directs tasks to specialists",
        tools: [],
        permissions: [],
      },
    }

    return {
      ...capabilities[type],
      prompt,
    }
  }

  /**
   * List available agents
   */
  export function listAgents(): AgentType[] {
    return [
      "test",
      "deploy",
      "monitor",
      "analyze",
      "ci-cd",
      "security",
      "performance",
      "infrastructure",
      "incident",
      "database",
      "router",
    ]
  }

  /**
   * Determine the best specialist for a task
   */
  export async function routeAgent(task: string): Promise<AgentType> {
    try {
      const provider = await Ollama.Default()
      const specialistAgents = listAgents().filter(a => a !== "router")
      
      const prompt = `You are the ROUGE Parent Router.
Categorize the request into the most appropriate specialist:
${specialistAgents.join(", ")}

User Request: "${task}"

Respond ONLY with the agent name.`

      const response = await provider.chat({
        messages: [Provider.system(prompt)],
        stream: false,
      })
      
      const choice = response.content.trim().toLowerCase() as AgentType
      if (listAgents().includes(choice)) return choice
      return "analyze"
    } catch (e) {
      return "analyze"
    }
  }

  /**
   * Execute agent task
   */
  export async function execute(request: AgentRequest): Promise<AgentResult> {
    let agentType = request.type
    let task = request.task

    // If router, determine the actual agent
    if (agentType === "router") {
        log.info(`Routing task: ${task}`)
        agentType = await routeAgent(task)
        log.info(`Routed to specialist: ${agentType}`)
    }

    log.info(`Executing ${agentType} agent: ${task}`)

    try {
      const capability = await getCapabilities(agentType)
      const provider = await Ollama.Default()
      const config = await Config.load()
      const workspace = config.workspace || "."

      // Check if provider is available
      const available = await provider.isAvailable()
      if (!available) {
        throw new Error("Ollama provider is not available")
      }

      // Build messages
      const messages: Message[] = [
        Provider.system(`${capability.prompt}\n\nProject Environment:\nYou are working in a NodeJS/Bun monorepo.\nActive Workspace: ${workspace}\n\nUse tools to explore and act.\nAvailable Tools: ${ToolRegistry.listTools().join(", ")}\n\nIMPORTANT: To call a tool, use the following format:\nTool: ToolName\nInput: {"arg1": "val1"}\n\nYou can chain multiple thoughts and tool calls. Wait for Observation after each call.`),
        Provider.user(task),
      ]

      // Add project context (simple file list - top level only for performance)
      try {
        const files = await fs.readdir(workspace).then(f => f.slice(0, 50).filter(item => !item.includes("node_modules")).join("\n"))
        messages.push(Provider.user(`Current Project Structure at ${workspace} (Top Level):\n${files}`))
      } catch (e) {}

      // Add context if provided
      if (request.context) {
        const contextStr = JSON.stringify(request.context, null, 2)
        messages.push(
          Provider.user(`Additional context:\n${contextStr}`)
        )
      }

      let iteration = 0
      let finalOutput = ""
      
      while (iteration < 5) { // Safety limit
        const response = await provider.chat({
          messages,
          stream: false,
        })

        const content = response.content
        finalOutput += content + "\n"
        messages.push(Provider.assistant(content))

        // Basic tool parser
        const toolMatch = content.match(/Tool: (\w+)\nInput: (\{.*\})/m)
        if (toolMatch) {
          const toolName = toolMatch[1]
          const toolInput = JSON.parse(toolMatch[2])
          
          log.info(`LLM requested tool: ${toolName}`)
          const observation = await ToolRegistry.call(toolName, toolInput, capability.permissions)
          
          messages.push(Provider.user(`Observation from ${toolName}:\n${JSON.stringify(observation, null, 2)}`))
          finalOutput += `\nObservation from ${toolName}: ${JSON.stringify(observation, null, 2)}\n`
          iteration++
        } else {
          break // No more tool calls
        }
      }

      log.info(`Agent ${request.type} completed successfully after ${iteration} tool calls`)

      // Log execution to database
      try {
        await DatabaseTool.createExecutionLog({
          agent_type: agentType,
          task,
          context: request.context,
          output: finalOutput,
          success: true,
          metadata: { iterations: iteration },
          model_used: provider.model,
        })
      } catch (dbError) {
        log.warn(`Failed to log execution to database: ${dbError}`)
      }

      return {
        type: request.type,
        output: finalOutput,
        success: true,
        metadata: {
          model: provider.model, // Get model name
          iterations: iteration
        },
      }
    } catch (error: any) {
      log.error(`Agent ${request.type} failed: ${error.message}`)

      // Log execution to database (failure)
      try {
        await DatabaseTool.createExecutionLog({
          agent_type: agentType,
          task,
          context: request.context,
          output: error.message,
          success: false,
          metadata: { error: error.message },
        })
      } catch (dbError) {
        log.warn(`Failed to log execution to database: ${dbError}`)
      }

      return {
        type: request.type,
        output: error.message,
        success: false,
        metadata: {
          error: error.message,
        },
      }
    }
  }

  /**
   * Execute agent task with streaming
   */
  export async function* executeStream(
    request: AgentRequest
  ): AsyncGenerator<string> {
    log.info(`Streaming ${request.type} agent: ${request.task}`)

    try {
      const capability = await getCapabilities(request.type)
      const provider = await Ollama.Default()

      // Check if provider is available
      const available = await provider.isAvailable()
      if (!available) {
        throw new Error("Ollama provider is not available")
      }

      // Build messages
      const messages: Message[] = [
        Provider.system(capability.prompt),
        Provider.user(request.task),
      ]

      // Add context if provided
      if (request.context) {
        const contextStr = JSON.stringify(request.context, null, 2)
        messages.push(
          Provider.user(`Additional context:\n${contextStr}`)
        )
      }

      // Stream response
      for await (const chunk of provider.stream({
        messages,
        stream: true,
      })) {
        yield chunk.content
      }

      log.info(`Agent ${request.type} stream completed`)
    } catch (error: any) {
      log.error(`Agent ${request.type} stream failed: ${error.message}`)
      yield `Error: ${error.message}`
    }
  }

  /**
   * Test agent connectivity
   */
  export async function testConnection(): Promise<boolean> {
    try {
      const provider = await Ollama.Default()
      return await provider.isAvailable()
    } catch (error) {
      log.error(`Connection test failed: ${error}`)
      return false
    }
  }
}
