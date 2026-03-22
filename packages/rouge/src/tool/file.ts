import { z } from "zod"
import { Log } from "../util/log.js"
import fs from "fs/promises"
import path from "path"

import { $ } from "bun"

const log = Log.create({ service: "tool:file" })

export const EditFileInput = z.object({
  path: z.string(),
  oldString: z.string(),
  newString: z.string(),
})
export type EditFileInput = z.infer<typeof EditFileInput>

export const WriteFileInput = z.object({
  path: z.string(),
  content: z.string(),
})
export type WriteFileInput = z.infer<typeof WriteFileInput>

export namespace FileTool {
  /**
   * Write content to a file
   */
  export async function writeFile(input: WriteFileInput): Promise<string> {
    log.info(`Writing file: ${input.path}`)
    try {
      await fs.mkdir(path.dirname(input.path), { recursive: true })
      await fs.writeFile(input.path, input.content, "utf-8")
      return `Successfully wrote to ${input.path}`
    } catch (error: any) {
      log.error(`Write failed: ${error.message}`)
      return `Error: ${error.message}`
    }
  }

  /**
   * Edit a file using fuzzy string replacement
   */
  export async function editFile(input: EditFileInput): Promise<string> {
    log.info(`Editing file: ${input.path}`)
    try {
      const content = await fs.readFile(input.path, "utf-8")
      const updatedContent = replaceFuzzy(content, input.oldString, input.newString)

      if (content === updatedContent) {
        return `Error: Could not find exact match for replacement in ${input.path}`
      }

      await fs.writeFile(input.path, updatedContent, "utf-8")

      // Basic diagnostic check (if it's a TS/JS file)
      if (input.path.endsWith(".ts") || input.path.endsWith(".tsx") || input.path.endsWith(".js")) {
        try {
          // A simple 'bun build' on the file to check for syntax errors
          await $`bun build ${input.path} --no-bundle --outdir /tmp`.quiet()
          return `Successfully updated ${input.path} and verified syntax.`
        } catch (error: any) {
          log.warn(`Syntax check failed after edit: ${error.message}`)
          return `Successfully updated ${input.path}, but a potential syntax error was detected: ${error.message}. Please verify the changes.`
        }
      }

      return `Successfully updated ${input.path}`
    } catch (error: any) {
      log.error(`Edit failed: ${error.message}`)
      return `Error: ${error.message}`
    }
  }
}

/**
 * Robust fuzzy matching for text replacement
 */
function replaceFuzzy(content: string, oldString: string, newString: string): string {
  // 1. Exact match
  if (content.includes(oldString)) {
    return content.replace(oldString, newString)
  }

  // 2. Line-by-line trimmed match
  const lines = content.split(/\r?\n/)
  const oldLines = oldString.split(/\r?\n/).map(l => l.trim())
  
  if (oldLines.length === 0) return content

  for (let i = 0; i <= lines.length - oldLines.length; i++) {
    let match = true
    for (let j = 0; j < oldLines.length; j++) {
      if (lines[i + j].trim() !== oldLines[j]) {
        match = false
        break
      }
    }

    if (match) {
      // Reconstruct the block with original indentation preserved where possible
      const head = lines.slice(0, i)
      const tail = lines.slice(i + oldLines.length)
      return [...head, newString, ...tail].join("\n")
    }
  }

  // 3. Fallback: return original content if no match found
  return content
}
