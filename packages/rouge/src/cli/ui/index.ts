import { EOL } from "os"

/**
 * UI utilities for Rouge CLI
 * Rouge UI implementation
 */

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
}

export namespace UI {
  /**
   * Display Rouge logo
   */
  export function logo(): string {
    return `${colors.cyan}${colors.bold}
╦═╗╔═╗╦ ╦╔═╗╦ ╦╔═╗
╠╦╝║ ║║ ║║ ║║ ║║╣
╩╚═╚═╝╚═╝╚═╝╚═╝╚═╝
${colors.reset}${colors.gray}DevOps & Testing Automation Platform${colors.reset}
`
  }

  /**
   * Display error message
   */
  export function error(message: string): void {
    console.error(`${colors.red}${colors.bold}✖${colors.reset} ${colors.red}${message}${colors.reset}`)
  }

  /**
   * Display success message
   */
  export function success(message: string): void {
    console.log(`${colors.green}${colors.bold}✔${colors.reset} ${colors.green}${message}${colors.reset}`)
  }

  /**
   * Display info message
   */
  export function info(message: string): void {
    console.log(`${colors.blue}${colors.bold}ℹ${colors.reset} ${message}`)
  }

  /**
   * Display warning message
   */
  export function warn(message: string): void {
    console.warn(`${colors.yellow}${colors.bold}⚠${colors.reset} ${colors.yellow}${message}${colors.reset}`)
  }

  /**
   * Display debug message
   */
  export function debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(`${colors.gray}${colors.dim}[DEBUG]${colors.reset} ${colors.gray}${message}${colors.reset}`)
    }
  }

  /**
   * Display step message
   */
  export function step(message: string): void {
    console.log(`${colors.cyan}${colors.bold}→${colors.reset} ${message}`)
  }

  /**
   * Display list item
   */
  export function item(message: string): void {
    console.log(`  ${colors.dim}•${colors.reset} ${message}`)
  }

  /**
   * Display header
   */
  export function header(message: string): void {
    console.log()
    console.log(`${colors.bold}${message}${colors.reset}`)
    console.log(`${colors.dim}${"─".repeat(message.length)}${colors.reset}`)
  }

  /**
   * Display section divider
   */
  export function divider(): void {
    console.log(`${colors.dim}${"─".repeat(50)}${colors.reset}`)
  }

  /**
   * Display empty line
   */
  export function nl(): void {
    console.log()
  }

  /**
   * Format key-value pair
   */
  export function kv(key: string, value: string): void {
    console.log(`  ${colors.gray}${key}:${colors.reset} ${value}`)
  }

  /**
   * Format JSON output
   */
  export function json(data: any): void {
    console.log(JSON.stringify(data, null, 2))
  }

  /**
   * Format table header
   */
  export function tableHeader(columns: string[]): void {
    const header = columns.map(c => colors.bold + c + colors.reset).join("  ")
    console.log(header)
    console.log(colors.dim + "─".repeat(columns.join("  ").length) + colors.reset)
  }

  /**
   * Format table row
   */
  export function tableRow(cells: string[]): void {
    console.log(cells.join("  "))
  }

  /**
   * Spinner class for long-running operations
   */
  export class Spinner {
    private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    private interval: Timer | null = null
    private currentFrame = 0
    private message: string

    constructor(message: string) {
      this.message = message
    }

    start(): void {
      process.stdout.write(`${colors.cyan}${this.frames[0]}${colors.reset} ${this.message}`)

      this.interval = setInterval(() => {
        this.currentFrame = (this.currentFrame + 1) % this.frames.length
        process.stdout.write(`\r${colors.cyan}${this.frames[this.currentFrame]}${colors.reset} ${this.message}`)
      }, 80)
    }

    succeed(message?: string): void {
      this.stop()
      console.log(`${colors.green}${colors.bold}✔${colors.reset} ${colors.green}${message || this.message}${colors.reset}`)
    }

    fail(message?: string): void {
      this.stop()
      console.error(`${colors.red}${colors.bold}✖${colors.reset} ${colors.red}${message || this.message}${colors.reset}`)
    }

    update(message: string): void {
      this.message = message
    }

    stop(): void {
      if (this.interval) {
        clearInterval(this.interval)
        this.interval = null
        process.stdout.write("\r" + " ".repeat(process.stdout.columns || 80) + "\r")
      }
    }
  }

  /**
   * Create a spinner
   */
  export function spinner(message: string): Spinner {
    return new Spinner(message)
  }

  /**
   * Progress bar
   */
  export function progress(current: number, total: number, message?: string): void {
    const percent = Math.floor((current / total) * 100)
    const width = 30
    const filled = Math.floor((current / total) * width)
    const bar = "█".repeat(filled) + "░".repeat(width - filled)

    const text = message ? ` ${message}` : ""
    process.stdout.write(`\r${colors.cyan}${bar}${colors.reset} ${percent}%${text}`)

    if (current === total) {
      console.log()
    }
  }

  /**
   * Prompt user for confirmation
   */
  export async function confirm(message: string, defaultValue = false): Promise<boolean> {
    const suffix = defaultValue ? "[Y/n]" : "[y/N]"
    process.stdout.write(`${colors.yellow}?${colors.reset} ${message} ${colors.gray}${suffix}${colors.reset} `)

    // For now, return default (TODO: implement actual input)
    console.log(defaultValue ? "yes" : "no")
    return defaultValue
  }

  /**
   * Display code block
   */
  export function code(code: string, lang?: string): void {
    const lines = code.split("\n")
    console.log(`${colors.dim}┌${"─".repeat(50)}${colors.reset}`)
    lines.forEach(line => {
      console.log(`${colors.dim}│${colors.reset} ${colors.gray}${line}${colors.reset}`)
    })
    console.log(`${colors.dim}└${"─".repeat(50)}${colors.reset}`)
  }

  /**
   * Clear screen
   */
  export function clear(): void {
    console.clear()
  }
}
