import { Provider, type Message } from "../provider/provider.js"
import { Ollama } from "../provider/ollama.js"
import { Config } from "../config/config.js"
import { Log } from "../util/log.js"
import fs from "fs/promises"
import path from "path"
import { Global } from "../global/index.js"

const log = Log.create({ service: "session" })

/**
 * Session memory system for Rouge agents.
 *
 * - Holds conversation history per session ID
 * - Compacts old messages into a summary when history exceeds threshold
 * - Reads/writes a workspace-local session.md so the agent remembers
 *   what was done in this workspace across restarts
 */

interface SessionEntry {
  role: "user" | "agent"
  content: string
  agent?: string
  timestamp: number
}

interface SessionData {
  id: string
  entries: SessionEntry[]
  summary: string // compacted summary of older entries
  createdAt: number
}

const MAX_HISTORY_ENTRIES = 20  // keep last N entries un-compacted
const COMPACT_BATCH = 10       // compact this many entries at a time

// In-memory store keyed by session ID
const sessions = new Map<string, SessionData>()

export namespace Session {

  /** Get or create a session */
  export function get(id: string): SessionData {
    if (!sessions.has(id)) {
      sessions.set(id, {
        id,
        entries: [],
        summary: "",
        createdAt: Date.now(),
      })
    }
    return sessions.get(id)!
  }

  /** Add a user message */
  export function addUserMessage(id: string, content: string) {
    const session = get(id)
    session.entries.push({
      role: "user",
      content,
      timestamp: Date.now(),
    })
  }

  /** Add an agent response */
  export function addAgentMessage(id: string, content: string, agent?: string) {
    const session = get(id)
    session.entries.push({
      role: "agent",
      content,
      agent,
      timestamp: Date.now(),
    })
  }

  /**
   * Build context messages for the LLM from session history.
   * Returns a system message with the compacted summary + recent entries.
   */
  export function buildContextMessages(id: string): Message[] {
    const session = get(id)
    const msgs: Message[] = []

    // Add compacted summary if it exists
    if (session.summary) {
      msgs.push(Provider.system(
        `Previous conversation summary (what has already been discussed/done in this session):\n${session.summary}`
      ))
    }

    // Add recent entries as user/assistant messages
    for (const entry of session.entries) {
      if (entry.role === "user") {
        msgs.push(Provider.user(entry.content))
      } else {
        msgs.push(Provider.assistant(entry.content))
      }
    }

    return msgs
  }

  /**
   * Compact old entries into a summary when history gets too long.
   * Uses the LLM to summarize the old entries.
   */
  export async function compactIfNeeded(id: string): Promise<void> {
    const session = get(id)
    if (session.entries.length <= MAX_HISTORY_ENTRIES) return

    const toCompact = session.entries.slice(0, COMPACT_BATCH)
    const remaining = session.entries.slice(COMPACT_BATCH)

    log.info(`Compacting ${toCompact.length} entries for session ${id}`)

    try {
      const provider = await Ollama.Default()

      const compactText = toCompact.map(e => {
        const prefix = e.role === "user" ? "User" : `Agent(${e.agent || "?"})`
        return `${prefix}: ${e.content.substring(0, 500)}`
      }).join("\n\n")

      const existingSummary = session.summary
        ? `Previous summary:\n${session.summary}\n\nNew conversation to add:\n`
        : ""

      const response = await provider.chat({
        messages: [
          Provider.system("You are a conversation summarizer. Produce a concise bullet-point summary of what was discussed and done. Include: files created/modified, decisions made, tasks completed, errors encountered. Keep it under 300 words."),
          Provider.user(`${existingSummary}${compactText}`),
        ],
        stream: false,
      })

      session.summary = response.content
      session.entries = remaining

      log.info(`Compacted session ${id}: ${toCompact.length} entries → summary`)
    } catch (e) {
      log.error(`Failed to compact session: ${e}`)
      // Fallback: just trim old entries without LLM summary
      const fallback = toCompact.map(e => {
        const prefix = e.role === "user" ? "User asked" : "Agent did"
        return `- ${prefix}: ${e.content.substring(0, 100)}`
      }).join("\n")

      session.summary = session.summary
        ? `${session.summary}\n${fallback}`
        : fallback
      session.entries = remaining
    }
  }

  // ── session.md persistence ──

  /** Get session.md path for current workspace */
  async function sessionMdPath(): Promise<string> {
    const config = await Config.load()
    const workspace = config.workspace || process.cwd()
    return path.join(workspace, ".rouge", "session.md")
  }

  /** Read session.md from workspace — returns empty string if not found */
  export async function readSessionMd(): Promise<string> {
    try {
      const p = await sessionMdPath()
      return await fs.readFile(p, "utf-8")
    } catch {
      return ""
    }
  }

  /** Write/update session.md in workspace */
  export async function writeSessionMd(content: string): Promise<void> {
    try {
      const p = await sessionMdPath()
      await fs.mkdir(path.dirname(p), { recursive: true })
      await fs.writeFile(p, content, "utf-8")
      log.info(`Updated session.md at ${p}`)
    } catch (e) {
      log.error(`Failed to write session.md: ${e}`)
    }
  }

  /** Append a note to session.md */
  export async function appendToSessionMd(note: string): Promise<void> {
    const existing = await readSessionMd()
    const timestamp = new Date().toLocaleString()
    const updated = existing
      ? `${existing}\n\n## ${timestamp}\n${note}`
      : `# Rouge.ai Session Notes\n\n## ${timestamp}\n${note}`
    await writeSessionMd(updated)
  }

  /** Clear a session */
  export function clear(id: string) {
    sessions.delete(id)
  }
}
