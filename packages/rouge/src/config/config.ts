import { z } from "zod"
import { Global } from "../global/index.js"
import { lazy } from "../util/lazy.js"
import path from "path"
import fs from "fs/promises"

/**
 * Rouge configuration system
 * Rouge config implementation
 */

// Ollama provider config
export const OllamaConfig = z.object({
  url: z.string().url().default("http://localhost:11434"),
  model: z.string().default("llama3.2:3b"),
  timeout: z.number().default(300000),
})
export type OllamaConfig = z.infer<typeof OllamaConfig>

// Agent configuration
export const AgentConfig = z.object({
  default: z.enum(["test", "deploy", "monitor", "analyze"]).default("test"),
  enabled: z.array(z.string()).default(["test", "deploy", "monitor", "analyze"]),
  maxConcurrent: z.number().default(5),
})
export type AgentConfig = z.infer<typeof AgentConfig>

// Workflow configuration
export const WorkflowConfig = z.object({
  parallel: z.boolean().default(true),
  timeout: z.number().default(3600),
  retries: z.number().default(3),
})
export type WorkflowConfig = z.infer<typeof WorkflowConfig>

// Permission settings
export const PermissionConfig = z.object({
  deploy: z.enum(["allow", "ask", "deny"]).default("ask"),
  test: z.enum(["allow", "ask", "deny"]).default("allow"),
  bash: z.enum(["allow", "ask", "deny"]).default("ask"),
})
export type PermissionConfig = z.infer<typeof PermissionConfig>

// Main config schema
export const RougeConfig = z.object({
  ollama: OllamaConfig.default({}),
  agents: AgentConfig.default({}),
  workflows: WorkflowConfig.default({}),
  permissions: PermissionConfig.default({}),
  workspace: z.string().optional(),
})
export type RougeConfig = z.infer<typeof RougeConfig>

export namespace Config {
  const ConfigFileName = "config.json"

  /**
   * Get the path to the config file
   */
  export function configPath(): string {
    return path.join(Global.Path.config, ConfigFileName)
  }

  /**
   * Load configuration from file or return defaults
   */
  export async function load(): Promise<RougeConfig> {
    const filePath = configPath()

    try {
      const content = await fs.readFile(filePath, "utf-8")
      const json = JSON.parse(content)
      return RougeConfig.parse(json)
    } catch (error: any) {
      // If file doesn't exist, return defaults
      if (error.code === "ENOENT") {
        return RougeConfig.parse({})
      }
      throw error
    }
  }

  /**
   * Save configuration to file
   */
  export async function save(config: RougeConfig): Promise<void> {
    const filePath = configPath()
    const content = JSON.stringify(config, null, 2)
    await fs.writeFile(filePath, content, "utf-8")
  }

  /**
   * Update specific config section
   */
  export async function update(
    section: keyof RougeConfig,
    value: any
  ): Promise<RougeConfig> {
    const config = await load()
    config[section] = value
    await save(config)
    return config
  }

  /**
   * Get a specific config section
   */
  export async function get<K extends keyof RougeConfig>(
    section: K
  ): Promise<RougeConfig[K]> {
    const config = await load()
    return config[section]
  }

  /**
   * Default config instance (lazy loaded)
   */
  export const Default = lazy(async () => {
    return await load()
  })
}
