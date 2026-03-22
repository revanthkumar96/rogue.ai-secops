import type {
  IProvider,
  ChatRequest,
  ChatResponse,
  StreamChunk,
} from "./provider.js"
import { Config } from "../config/config.js"
import { lazy } from "../util/lazy.js"
import { Log } from "../util/log.js"

/**
 * Ollama provider implementation
 * Rouge provider implementation
 */

const log = Log.create({ service: "ollama" })

export class OllamaProvider implements IProvider {
  public readonly name = "Ollama"
  constructor(
    public readonly url: string,
    public readonly defaultModel: string,
    public readonly timeout: number
  ) {}

  get model(): string {
    return this.defaultModel
  }

  /**
   * Send a chat request to Ollama
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel

    log.info(`Chat request to model: ${model}`)

    const response = await fetch(`${this.url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: request.messages,
        stream: false,
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
        },
      }),
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      const error = await response.text()
      log.error(`Ollama request failed: ${error}`)
      throw new Error(`Ollama request failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.message.content,
      model: data.model,
      doneReason: data.done ? "stop" : undefined,
    }
  }

  /**
   * Stream a chat request from Ollama
   */
  async *stream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    const model = request.model || this.defaultModel

    log.info(`Stream request to model: ${model}`)

    const response = await fetch(`${this.url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: request.messages,
        stream: true,
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
        },
      }),
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      const error = await response.text()
      log.error(`Ollama stream failed: ${error}`)
      throw new Error(`Ollama stream failed: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("No response body")
    }

    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const data = JSON.parse(line)

            if (data.message?.content) {
              yield {
                content: data.message.content,
                done: data.done || false,
              }
            }

            if (data.done) {
              return
            }
          } catch (e) {
            log.error(`Failed to parse streaming response: ${e}`)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * List available models from Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.url}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`)
      }

      const data = await response.json()
      return data.models?.map((m: any) => m.name) || []
    } catch (error) {
      log.error(`Failed to list models: ${error}`)
      return []
    }
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.url}/api/version`, {
        signal: AbortSignal.timeout(3000),
      })
      return response.ok
    } catch (error) {
      log.error(`Ollama not available: ${error}`)
      return false
    }
  }
}

export namespace Ollama {
  /**
   * Default Ollama provider instance (loaded from current config)
   */
  export async function Default(): Promise<OllamaProvider> {
    const config = await Config.get("ollama")
    return new OllamaProvider(config.url, config.model, config.timeout)
  }

  /**
   * Create a new Ollama provider with custom settings
   */
  export function create(opts: {
    url?: string
    model?: string
    timeout?: number
  }): OllamaProvider {
    return new OllamaProvider(
      opts.url || "http://localhost:11434",
      opts.model || "llama3.2:3b",
      opts.timeout || 300000
    )
  }
}
