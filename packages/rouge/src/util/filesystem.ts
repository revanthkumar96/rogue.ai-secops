import fs from "fs/promises"
import { existsSync } from "fs"

export namespace Filesystem {
  export async function ensureDir(path: string): Promise<void> {
    if (!existsSync(path)) {
      await fs.mkdir(path, { recursive: true })
    }
  }

  export async function exists(path: string): Promise<boolean> {
    try {
      await fs.access(path)
      return true
    } catch {
      return false
    }
  }

  export async function readText(path: string): Promise<string> {
    return fs.readFile(path, "utf-8")
  }

  export async function write(path: string, content: string): Promise<void> {
    await fs.writeFile(path, content, "utf-8")
  }
}
