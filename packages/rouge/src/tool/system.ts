import { z } from "zod"
import { Log } from "../util/log.js"
import { $ } from "bun"
import fs from "fs/promises"
import path from "path"

const log = Log.create({ service: "tool:system" })

export const BashInput = z.object({
  command: z.string(),
  cwd: z.string().optional(),
})
export type BashInput = z.infer<typeof BashInput>

export const ReadFileInput = z.object({
  path: z.string(),
})
export type ReadFileInput = z.infer<typeof ReadFileInput>

export const ListDirInput = z.object({
  path: z.string().default("."),
})
export type ListDirInput = z.infer<typeof ListDirInput>

export const GrepInput = z.object({
  pattern: z.string(),
  path: z.string().default("."),
  recursive: z.boolean().default(true),
})
export type GrepInput = z.infer<typeof GrepInput>

export namespace SystemTool {
  /**
   * Execute a bash command with basic parsing for security
   */
  export async function bash(input: BashInput): Promise<string> {
    log.info(`Executing bash command: ${input.command}`)
    
    // Basic parsing to identify chained commands
    const commands = input.command.split(/&&|;|\|\|/).map(c => c.trim().split(/\s+/)[0])
    log.debug(`Parsed commands: ${commands.join(", ")}`)

    try {
      const result = await (input.cwd ? $`cd ${input.cwd} && ${input.command}` : $`${input.command}`).text()
      return result
    } catch (error: any) {
      log.error(`Bash command failed: ${error.message}`)
      return `Error: ${error.message}`
    }
  }

  /**
   * Read a file
   */
  export async function readFile(input: ReadFileInput): Promise<string> {
    log.info(`Reading file: ${input.path}`)
    try {
      return await fs.readFile(input.path, "utf-8")
    } catch (error: any) {
      return `Error reading file: ${error.message}`
    }
  }

  /**
   * List directory
   */
  export async function listDir(input: ListDirInput): Promise<string[]> {
    log.info(`Listing directory: ${input.path}`)
    try {
      const entries = await fs.readdir(input.path, { withFileTypes: true })
      return entries.map(e => e.isDirectory() ? `${e.name}/` : e.name)
    } catch (error: any) {
      throw new Error(`Error listing directory: ${error.message}`)
    }
  }

  /**
   * Search for pattern
   */
  export async function grep(input: GrepInput): Promise<string> {
    log.info(`Grepping for "${input.pattern}" in ${input.path}`)
    try {
      const args = ["-n"]
      if (input.recursive) args.push("-r")
      const result = await $`grep ${args} ${input.pattern} ${input.path}`.text()
      return result
    } catch (error: any) {
      return `No matches found or grep failed: ${error.message}`
    }
  }
}
