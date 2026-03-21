import { writeFileSync, existsSync, mkdirSync } from "fs"
import path from "path"
import { Global } from "../global"

export namespace Log {
  export type Level = "DEBUG" | "INFO" | "WARN" | "ERROR"

  interface LogOptions {
    print: boolean
    dev: boolean
    level: Level
  }

  let options: LogOptions = {
    print: false,
    dev: false,
    level: "INFO",
  }

  const logFile = path.join(Global.Path.log, "rouge.log")

  export async function init(opts: LogOptions) {
    options = opts
    if (!existsSync(Global.Path.log)) {
      mkdirSync(Global.Path.log, { recursive: true })
    }
  }

  export function file(): string {
    return logFile
  }

  class Logger {
    constructor(private service: string) {}

    private log(level: Level, message: string, data?: any) {
      const levels = ["DEBUG", "INFO", "WARN", "ERROR"]
      if (levels.indexOf(level) < levels.indexOf(options.level)) return

      const entry = {
        timestamp: new Date().toISOString(),
        level,
        service: this.service,
        message,
        ...data,
      }

      const line = JSON.stringify(entry) + "\n"

      try {
        writeFileSync(logFile, line, { flag: "a" })
      } catch {}

      if (options.print || options.dev) {
        const prefix = `[${level}] [${this.service}]`
        console.error(`${prefix} ${message}`, data || "")
      }
    }

    debug(message: string, data?: any) {
      this.log("DEBUG", message, data)
    }

    info(message: string, data?: any) {
      this.log("INFO", message, data)
    }

    warn(message: string, data?: any) {
      this.log("WARN", message, data)
    }

    error(message: string, data?: any) {
      this.log("ERROR", message, data)
    }

    time(message: string, data?: any) {
      const start = Date.now()
      return {
        stop: () => {
          this.log("INFO", message, { ...data, duration_ms: Date.now() - start })
        },
      }
    }
  }

  export const Default = new Logger("default")

  export function create(opts: { service: string }): Logger {
    return new Logger(opts.service)
  }
}
