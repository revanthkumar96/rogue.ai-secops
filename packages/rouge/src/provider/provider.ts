import { z } from "zod"
import { lazy } from "../util/lazy.js"
import { Config } from "../config/config.js"

/**
 * Provider system for LLM integration
 * Rouge provider implementation
 */

// Message types
export const Message = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
})
export type Message = z.infer<typeof Message>

// Chat request
export const ChatRequest = z.object({
  messages: z.array(Message),
  model: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  stream: z.boolean().default(false),
})
export type ChatRequest = z.infer<typeof ChatRequest>

// Chat response
export const ChatResponse = z.object({
  content: z.string(),
  model: z.string(),
  doneReason: z.enum(["stop", "length", "error"]).optional(),
})
export type ChatResponse = z.infer<typeof ChatResponse>

// Streaming chunk
export const StreamChunk = z.object({
  content: z.string(),
  done: z.boolean(),
})
export type StreamChunk = z.infer<typeof StreamChunk>

/**
 * Base provider interface
 */
export interface IProvider {
  /**
   * Send a chat request
   */
  chat(request: ChatRequest): Promise<ChatResponse>

  /**
   * Send a streaming chat request
   */
  stream(request: ChatRequest): AsyncGenerator<StreamChunk>

  /**
   * List available models
   */
  listModels(): Promise<string[]>

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>
}

export namespace Provider {
  /**
   * Create a message
   */
  export function message(
    role: "system" | "user" | "assistant",
    content: string
  ): Message {
    return { role, content }
  }

  /**
   * Create a system message
   */
  export function system(content: string): Message {
    return message("system", content)
  }

  /**
   * Create a user message
   */
  export function user(content: string): Message {
    return message("user", content)
  }

  /**
   * Create an assistant message
   */
  export function assistant(content: string): Message {
    return message("assistant", content)
  }
}
