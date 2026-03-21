import { z } from "zod"
import type { AgentType } from "@rouge/shared/types"
import { Ollama } from "../provider/ollama.js"
import { Provider, type Message } from "../provider/provider.js"
import { Log } from "../util/log.js"
import { lazy } from "../util/lazy.js"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

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
  permissions: string[]
}

export namespace Agent {
  /**
   * Load agent prompt from file
   */
  async function loadPrompt(type: AgentType): Promise<string> {
    const promptPath = path.join(
      __dirname,
      "prompts",
      `${type}-agent.txt`
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
        tools: ["ReadLog", "WriteConfig", "Bash", "Grep"],
        permissions: ["read", "write", "execute"],
      },
      deploy: {
        name: "deploy",
        description: "Deployment automation",
        tools: ["ReadLog", "WriteConfig", "Bash", "Grep"],
        permissions: ["read", "write", "execute", "deploy"],
      },
      monitor: {
        name: "monitor",
        description: "System monitoring and alerting",
        tools: ["ReadLog", "WriteConfig", "Bash", "Grep"],
        permissions: ["read", "execute"],
      },
      analyze: {
        name: "analyze",
        description: "Log and error analysis",
        tools: ["ReadLog", "Bash", "Grep"],
        permissions: ["read"],
      },
      "ci-cd": {
        name: "ci-cd",
        description: "CI/CD pipeline automation",
        tools: ["ReadLog", "WriteConfig", "Bash", "Grep"],
        permissions: ["read", "write", "execute"],
      },
      security: {
        name: "security",
        description: "Security scanning and compliance",
        tools: ["ReadLog", "WriteConfig", "Bash", "Grep"],
        permissions: ["read", "execute"],
      },
      performance: {
        name: "performance",
        description: "Performance and load testing",
        tools: ["ReadLog", "WriteConfig", "Bash", "Grep"],
        permissions: ["read", "execute"],
      },
      infrastructure: {
        name: "infrastructure",
        description: "Infrastructure-as-Code management",
        tools: ["ReadLog", "WriteConfig", "Bash", "Grep"],
        permissions: ["read", "write", "execute"],
      },
      incident: {
        name: "incident",
        description: "Incident response and troubleshooting",
        tools: ["ReadLog", "WriteConfig", "Bash", "Grep"],
        permissions: ["read", "execute"],
      },
      database: {
        name: "database",
        description: "Database operations and optimization",
        tools: ["ReadLog", "WriteConfig", "Bash", "Grep"],
        permissions: ["read", "write", "execute"],
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
    ]
  }

  /**
   * Execute agent task
   */
  export async function execute(request: AgentRequest): Promise<AgentResult> {
    log.info(`Executing ${request.type} agent: ${request.task}`)

    try {
      const capability = await getCapabilities(request.type)
      const provider = await Ollama.Default

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

      // Execute request
      const response = await provider.chat({
        messages,
        stream: false,
      })

      log.info(`Agent ${request.type} completed successfully`)

      return {
        type: request.type,
        output: response.content,
        success: true,
        metadata: {
          model: response.model,
        },
      }
    } catch (error: any) {
      log.error(`Agent ${request.type} failed: ${error.message}`)

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
      const provider = await Ollama.Default

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
      const provider = await Ollama.Default
      return await provider.isAvailable()
    } catch (error) {
      log.error(`Connection test failed: ${error}`)
      return false
    }
  }
}
