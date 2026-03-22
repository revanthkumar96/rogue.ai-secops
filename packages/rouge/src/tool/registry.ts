import { Log } from "../util/log.js"
import { SystemTool } from "./system.js"
import { FileTool } from "./file.js"
import { z } from "zod"

const log = Log.create({ service: "tool:registry" })

export type PermissionAction = "allow" | "deny" | "ask"

export interface PermissionRule {
  tool: string
  action: PermissionAction
  pattern?: string // For bash commands or file paths
}

export class ToolRegistry {
  private static tools = new Map<string, Function>()
  private static schemas = new Map<string, z.ZodObject<any>>()

  static {
    // Register System Tools
    this.register("Bash", SystemTool.bash, z.object({ command: z.string(), cwd: z.string().optional() }))
    this.register("ReadFile", SystemTool.readFile, z.object({ path: z.string() }))
    this.register("ListDir", SystemTool.listDir, z.object({ path: z.string().default(".") }))
    this.register("Grep", SystemTool.grep, z.object({ pattern: z.string(), path: z.string().default("."), recursive: z.boolean().default(true) }))
    this.register("EditFile", FileTool.editFile, z.object({ path: z.string(), oldString: z.string(), newString: z.string() }))
    this.register("WriteFile", FileTool.writeFile, z.object({ path: z.string(), content: z.string() }))
  }

  static register(name: string, fn: Function, schema: z.ZodObject<any>) {
    this.tools.set(name, fn)
    this.schemas.set(name, schema)
    log.info(`Registered tool: ${name}`)
  }

  static async call(name: string, input: any, permissions: PermissionRule[]): Promise<any> {
    const tool = this.tools.get(name)
    if (!tool) throw new Error(`Tool not found: ${name}`)

    // Permission Check
    const permission = this.checkPermission(name, input, permissions)
    if (permission === "deny") {
      log.warn(`Permission denied for tool ${name}`)
      return `Error: Permission denied for tool ${name}`
    }
    
    // For now, "ask" is treated as "allow" since we don't have interactive CLI here yet, 
    // but in a real app this would trigger a UI prompt.
    if (permission === "ask") {
      log.info(`Permission "ask" for tool ${name}, auto-allowing for demo`)
    }

    try {
      const schema = this.schemas.get(name)
      const validatedInput = schema ? schema.parse(input) : input
      return await tool(validatedInput)
    } catch (error: any) {
      log.error(`Tool ${name} failed: ${error.message}`)
      return `Error: ${error.message}`
    }
  }

  private static checkPermission(name: string, input: any, rules: PermissionRule[]): PermissionAction {
    // Default to deny for dangerous tools if no rules match
    const dangerousTools = ["Bash", "WriteFile", "DeleteFile"]
    let action: PermissionAction = dangerousTools.includes(name) ? "deny" : "allow"

    for (const rule of rules) {
      if (rule.tool === "*" || rule.tool === name) {
        // Pattern matching for bash
        if (name === "Bash" && rule.pattern && input.command) {
          if (new RegExp(rule.pattern).test(input.command)) {
            action = rule.action
          }
        } else {
          action = rule.action
        }
      }
    }

    return action
  }

  static listTools() {
    return Array.from(this.tools.keys())
  }

  static getToolDefinitions() {
    const defs: any[] = []
    for (const [name, schema] of this.schemas.entries()) {
      defs.push({
        name,
        description: `Execute tool ${name}`,
        parameters: schema
      })
    }
    return defs
  }
}
