import { Log } from "../util/log.js"
import { SystemTool } from "./system.js"
import { FileTool } from "./file.js"
import { DatabaseTool } from "./database.js"
import { z } from "zod"
import readline from "readline"

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

    // Register Database Tools - Workflow
    this.register("CreateWorkflow", DatabaseTool.createWorkflow, z.object({ name: z.string(), description: z.string().optional(), steps: z.any() }))
    this.register("ReadWorkflow", DatabaseTool.readWorkflow, z.object({ id: z.string() }))
    this.register("UpdateWorkflow", DatabaseTool.updateWorkflow, z.object({ id: z.string(), name: z.string().optional(), description: z.string().optional(), steps: z.any().optional(), status: z.string().optional() }))
    this.register("DeleteWorkflow", DatabaseTool.deleteWorkflow, z.object({ id: z.string() }))
    this.register("ListWorkflows", DatabaseTool.listWorkflows, z.object({ status: z.string().optional(), limit: z.number().optional() }))

    // Register Database Tools - Test Runs
    this.register("CreateTestRun", DatabaseTool.createTestRun, z.object({ name: z.string(), pattern: z.string().optional() }))
    this.register("UpdateTestRun", DatabaseTool.updateTestRun, z.object({ id: z.string(), status: z.string().optional(), total_tests: z.number().optional(), passed: z.number().optional(), failed: z.number().optional(), skipped: z.number().optional(), duration_ms: z.number().optional(), coverage: z.any().optional() }))
    this.register("ListTestRuns", DatabaseTool.listTestRuns, z.object({ status: z.string().optional(), limit: z.number().optional() }))
    this.register("CreateTestResult", DatabaseTool.createTestResult, z.object({ test_run_id: z.string(), name: z.string(), file: z.string(), status: z.string(), duration_ms: z.number(), error: z.string().optional(), stack: z.string().optional() }))

    // Register Database Tools - Deployments
    this.register("CreateDeployment", DatabaseTool.createDeployment, z.object({ environment: z.string(), version: z.string(), config: z.any().optional() }))
    this.register("UpdateDeployment", DatabaseTool.updateDeployment, z.object({ id: z.string(), status: z.string().optional(), logs: z.string().optional(), error: z.string().optional(), rolled_back: z.boolean().optional() }))
    this.register("ListDeployments", DatabaseTool.listDeployments, z.object({ environment: z.string().optional(), status: z.string().optional(), limit: z.number().optional() }))

    // Register Database Tools - Execution Logs
    this.register("CreateExecutionLog", DatabaseTool.createExecutionLog, z.object({ workflow_id: z.string().optional(), agent_type: z.string().optional(), task: z.string(), context: z.any().optional(), output: z.string().optional(), success: z.boolean(), metadata: z.any().optional(), model_used: z.string().optional() }))
    this.register("ListExecutionLogs", DatabaseTool.listExecutionLogs, z.object({ workflow_id: z.string().optional(), agent_type: z.string().optional(), success: z.boolean().optional(), limit: z.number().optional() }))

    // Register Database Tools - Analytics
    this.register("GetWorkflowStats", DatabaseTool.getWorkflowStats, z.object({}))
    this.register("GetTestStats", DatabaseTool.getTestStats, z.object({}))
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

    if (permission === "ask") {
      const summary = this.describeToolCall(name, input)
      const allowed = await this.promptUser(summary)
      if (!allowed) {
        log.info(`User denied tool ${name}`)
        return `Tool ${name} was denied by user.`
      }
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
    const dangerousTools = ["Bash", "WriteFile", "EditFile", "DeleteFile"]
    let action: PermissionAction = dangerousTools.includes(name) ? "deny" : "allow"

    for (const rule of rules) {
      if (rule.tool === "*" || rule.tool === name) {
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

  /** Describe a tool call for the permission prompt */
  private static describeToolCall(name: string, input: any): string {
    switch (name) {
      case "Bash":
        return `Run command: ${input.command}`
      case "WriteFile":
        return `Write file: ${input.path} (${input.content?.length || 0} chars)`
      case "EditFile":
        return `Edit file: ${input.path}`
      default:
        return `Execute tool: ${name} with ${JSON.stringify(input).substring(0, 100)}`
    }
  }

  /** Prompt user for permission in CLI */
  private static async promptUser(description: string): Promise<boolean> {
    // If not a TTY (e.g. running in API server mode), auto-allow
    if (!process.stdin.isTTY) {
      log.info(`Non-interactive mode, auto-allowing: ${description}`)
      return true
    }

    const yellow = "\x1b[33m"
    const cyan = "\x1b[36m"
    const reset = "\x1b[0m"
    const bold = "\x1b[1m"
    const green = "\x1b[32m"

    process.stdout.write(`\n${yellow}${bold}? Permission needed${reset}\n`)
    process.stdout.write(`  ${cyan}${description}${reset}\n`)
    process.stdout.write(`  Allow? ${yellow}[Y/n]${reset} `)

    // Read a single keypress without creating a competing readline
    return new Promise((resolve) => {
      const wasRaw = process.stdin.isRaw
      if (process.stdin.isTTY) process.stdin.setRawMode(true)
      process.stdin.resume()

      const onData = (buf: Buffer) => {
        process.stdin.removeListener("data", onData)
        if (process.stdin.isTTY) process.stdin.setRawMode(wasRaw)

        const ch = buf.toString().trim().toLowerCase()
        // Enter, y, Y = allow. n, N = deny. Ctrl+C = deny.
        if (ch === "\x03") { // Ctrl+C
          process.stdout.write("n\n")
          resolve(false)
        } else if (ch === "n") {
          process.stdout.write(`${ch}\n`)
          resolve(false)
        } else {
          process.stdout.write(`${green}y${reset}\n`)
          resolve(true)
        }
      }

      process.stdin.on("data", onData)
    })
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
