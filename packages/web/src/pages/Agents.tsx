import { Component, createSignal, For, Show, onMount } from "solid-js"
import { api } from "../lib/api"
import { Markdown } from "../components/Markdown"
import { SkeletonPills } from "../components/Skeleton"
import { toast } from "../components/Toast"

interface ToolCall {
  tool: string
  input: any
  output: string
}

interface ChatMessage {
  id: string
  role: "user" | "agent"
  content: string
  agent?: string
  timestamp: number
  streaming?: boolean
  toolCalls?: ToolCall[]
}

export const AgentsPage: Component = () => {
  const [agents, setAgents] = createSignal<string[]>([])
  const [agentsLoading, setAgentsLoading] = createSignal(true)
  const [input, setInput] = createSignal("")
  const [messages, setMessages] = createSignal<ChatMessage[]>([])
  const [executing, setExecuting] = createSignal(false)
  const [selectedAgent, setSelectedAgent] = createSignal("router")
  // Persistent session ID for this browser tab
  const sessionId = `web-${Date.now()}`
  let chatEnd: HTMLDivElement | undefined
  let inputRef: HTMLInputElement | undefined

  onMount(async () => {
    try {
      const response = await api.listAgents()
      setAgents(response.agents.filter(a => a !== "router"))
    } catch (e) {
      console.error("Failed to load agents:", e)
    } finally {
      setAgentsLoading(false)
    }
  })

  const scrollToBottom = () => {
    setTimeout(() => chatEnd?.scrollIntoView({ behavior: "smooth" }), 50)
  }

  const handleSend = async () => {
    const task = input().trim()
    if (!task || executing()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: task,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setExecuting(true)
    scrollToBottom()

    const agentMsgId = (Date.now() + 1).toString()

    try {
      // Try streaming first
      const res = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedAgent(), task, stream: true, sessionId }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      if (res.body) {
        // Add empty streaming message
        const streamMsg: ChatMessage = {
          id: agentMsgId,
          role: "agent",
          content: "",
          agent: selectedAgent(),
          timestamp: Date.now(),
          streaming: true,
        }
        setMessages(prev => [...prev, streamMsg])

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk

          // Update the streaming message in place
          setMessages(prev =>
            prev.map(m =>
              m.id === agentMsgId
                ? { ...m, content: fullContent }
                : m
            )
          )
          scrollToBottom()
        }

        // Mark streaming complete
        setMessages(prev =>
          prev.map(m =>
            m.id === agentMsgId
              ? { ...m, streaming: false }
              : m
          )
        )
        toast("success", "Agent response complete")
      } else {
        // Fallback: non-streaming
        const result = await res.json()
        const agentMsg: ChatMessage = {
          id: agentMsgId,
          role: "agent",
          content: result.output,
          agent: result.type,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, agentMsg])
        toast("success", "Agent response complete")
      }
    } catch (error: any) {
      // Fallback: try non-streaming endpoint
      try {
        const response = await api.executeAgent({
          type: selectedAgent(),
          task,
          stream: false,
          sessionId,
        })
        const agentMsg: ChatMessage = {
          id: agentMsgId,
          role: "agent",
          content: response.output,
          agent: response.type,
          timestamp: Date.now(),
          toolCalls: response.metadata?.toolCalls,
        }
        setMessages(prev => [...prev, agentMsg])
        toast("success", "Agent response complete")
      } catch (fallbackError: any) {
        const errMsg: ChatMessage = {
          id: agentMsgId,
          role: "agent",
          content: `Error: ${fallbackError.message}`,
          agent: "system",
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, errMsg])
        toast("error", `Agent failed: ${fallbackError.message}`)
      }
    } finally {
      setExecuting(false)
      scrollToBottom()
      inputRef?.focus()
    }
  }

  const agentMeta: Record<string, { icon: string; color: string; desc: string }> = {
    test:           { icon: "🧪", color: "#8b5cf6", desc: "Test generation & execution" },
    deploy:         { icon: "🚀", color: "#06b6d4", desc: "Deployment automation" },
    monitor:        { icon: "📊", color: "#3b82f6", desc: "System monitoring" },
    analyze:        { icon: "🔍", color: "#f59e0b", desc: "Log & error analysis" },
    "ci-cd":        { icon: "⚙️", color: "#10b981", desc: "CI/CD pipelines" },
    security:       { icon: "🔒", color: "#ef4444", desc: "Security scanning" },
    performance:    { icon: "⚡", color: "#eab308", desc: "Performance testing" },
    infrastructure: { icon: "🏗️", color: "#6366f1", desc: "Infrastructure-as-Code" },
    incident:       { icon: "🚨", color: "#f97316", desc: "Incident response" },
    database:       { icon: "💾", color: "#14b8a6", desc: "Database operations" },
  }

  return (
    <div style={{ display: "flex", "flex-direction": "column", height: "calc(100vh - 52px)", padding: 0 }}>
      {/* Agent selector strip */}
      <div style={{
        display: "flex",
        "align-items": "center",
        gap: "0.5rem",
        padding: "0.75rem 1.5rem",
        "border-bottom": "1px solid var(--border)",
        "overflow-x": "auto",
        "flex-shrink": 0,
      }}>
        <Show when={agentsLoading()}>
          <SkeletonPills count={8} />
        </Show>

        <Show when={!agentsLoading()}>
          <button
            onClick={() => setSelectedAgent("router")}
            style={{
              padding: "0.35rem 0.75rem",
              "border-radius": "9999px",
              "font-size": "12px",
              "font-weight": "600",
              background: selectedAgent() === "router" ? "var(--accent-soft)" : "transparent",
              color: selectedAgent() === "router" ? "var(--accent)" : "var(--text-tertiary)",
              border: selectedAgent() === "router" ? "1px solid rgba(102,126,234,0.3)" : "1px solid var(--border)",
              cursor: "pointer",
              "white-space": "nowrap",
            }}
          >
            ✨ Auto-route
          </button>

          <For each={agents()}>
            {(agent) => {
              const meta = agentMeta[agent] || { icon: "🤖", color: "#6b7280", desc: "" }
              return (
                <button
                  onClick={() => setSelectedAgent(agent)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    "border-radius": "9999px",
                    "font-size": "12px",
                    "font-weight": "600",
                    background: selectedAgent() === agent ? `${meta.color}18` : "transparent",
                    color: selectedAgent() === agent ? meta.color : "var(--text-tertiary)",
                    border: selectedAgent() === agent ? `1px solid ${meta.color}40` : "1px solid var(--border)",
                    cursor: "pointer",
                    "white-space": "nowrap",
                  }}
                >
                  {meta.icon} {agent}
                </button>
              )
            }}
          </For>
        </Show>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflow: "auto", padding: "1.5rem" }}>
        {/* Empty state */}
        <Show when={messages().length === 0}>
          <div style={{
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            "justify-content": "center",
            height: "100%",
            gap: "1rem",
            color: "var(--text-tertiary)",
          }}>
            <div style={{ "font-size": "3rem" }}>✨</div>
            <div style={{ "font-size": "1.25rem", "font-weight": "700", color: "var(--text-secondary)" }}>
              Ask Your Fairy Tail
            </div>
            <div style={{ "font-size": "13px", "max-width": "400px", "text-align": "center", "line-height": "1.6" }}>
              Describe your task in natural language. Select an agent above or use Auto-route.
            </div>
            <div style={{ display: "flex", "flex-wrap": "wrap", gap: "0.5rem", "justify-content": "center", "margin-top": "0.5rem" }}>
              <For each={["Run security scan", "Generate unit tests", "Create a deploy workflow", "Analyze error logs"]}>
                {(hint) => (
                  <button
                    onClick={() => setInput(hint)}
                    style={{
                      "font-size": "12px",
                      padding: "0.4rem 0.75rem",
                      "border-radius": "9999px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--surface)",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {hint}
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Messages */}
        <For each={messages()}>
          {(msg) => (
            <div style={{
              display: "flex",
              "justify-content": msg.role === "user" ? "flex-end" : "flex-start",
              "margin-bottom": "1rem",
              animation: "fadeIn 0.25s ease",
            }}>
              <div style={{
                "max-width": "min(85%, 750px)",
                padding: "0.75rem 1rem",
                "border-radius": msg.role === "user"
                  ? "var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)"
                  : "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)",
                background: msg.role === "user" ? "var(--accent-soft)" : "var(--surface)",
                border: msg.role === "user" ? "1px solid rgba(102,126,234,0.25)" : "1px solid var(--border)",
              }}>
                {/* Agent label */}
                <Show when={msg.role === "agent"}>
                  <div style={{
                    "font-size": "10px",
                    "font-weight": "700",
                    color: "var(--accent)",
                    "margin-bottom": "0.4rem",
                    "text-transform": "uppercase",
                    "letter-spacing": "0.05em",
                    display: "flex",
                    "align-items": "center",
                    gap: "0.4rem",
                  }}>
                    {msg.agent || "agent"}
                    <Show when={msg.streaming}>
                      <span style={{ animation: "pulse 1s ease-in-out infinite", "font-size": "8px" }}>●</span>
                    </Show>
                  </div>
                </Show>

                {/* Content */}
                <Show
                  when={msg.role === "agent"}
                  fallback={
                    <div style={{ "font-size": "13px", "line-height": "1.6" }}>
                      {msg.content}
                    </div>
                  }
                >
                  <Markdown content={msg.content} />
                </Show>

                {/* Tool calls visualization */}
                <Show when={msg.toolCalls && msg.toolCalls.length > 0}>
                  <div style={{
                    "margin-top": "0.6rem",
                    "padding-top": "0.5rem",
                    "border-top": "1px solid var(--border)",
                  }}>
                    <div style={{ "font-size": "10px", "font-weight": "700", color: "var(--text-tertiary)", "margin-bottom": "0.3rem", "letter-spacing": "0.05em" }}>
                      TOOLS USED ({msg.toolCalls!.length})
                    </div>
                    <div style={{ display: "flex", "flex-wrap": "wrap", gap: "0.3rem" }}>
                      <For each={msg.toolCalls!}>
                        {(tc) => (
                          <span style={{
                            "font-size": "10px",
                            padding: "0.15rem 0.5rem",
                            "border-radius": "9999px",
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                            "font-family": "var(--font-family-mono)",
                          }}>
                            {tc.tool}
                            <Show when={tc.tool === "ReadFile" || tc.tool === "WriteFile" || tc.tool === "EditFile"}>
                              <span style={{ color: "var(--text-tertiary)", "margin-left": "0.3rem" }}>
                                {tc.input?.path?.split(/[/\\]/).pop() || ""}
                              </span>
                            </Show>
                          </span>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>

                {/* Timestamp */}
                <div style={{ "font-size": "10px", color: "var(--text-tertiary)", "margin-top": "0.4rem", "text-align": "right" }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </For>

        {/* Thinking indicator */}
        <Show when={executing() && !messages().some(m => m.streaming)}>
          <div style={{ display: "flex", "margin-bottom": "1rem", animation: "fadeIn 0.25s ease" }}>
            <div style={{
              padding: "0.75rem 1rem",
              "border-radius": "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              "align-items": "center",
              gap: "0.5rem",
              color: "var(--text-tertiary)",
              "font-size": "13px",
            }}>
              <div class="thinking-dots">
                <span />
                <span />
                <span />
              </div>
              Thinking...
            </div>
          </div>
        </Show>

        <div ref={chatEnd} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: "0.75rem 1.5rem",
        "border-top": "1px solid var(--border)",
        background: "var(--bg-secondary)",
        "flex-shrink": 0,
      }}>
        <div style={{ display: "flex", gap: "0.5rem", "max-width": "900px", margin: "0 auto" }}>
          <input
            ref={inputRef}
            type="text"
            placeholder={`Message ${selectedAgent() === "router" ? "auto-routed agent" : selectedAgent() + " agent"}...`}
            value={input()}
            onInput={(e) => setInput(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={executing()}
            style={{ flex: 1 }}
          />
          <button
            onClick={handleSend}
            disabled={executing() || !input().trim()}
            style={{
              background: "var(--brand-gradient)",
              color: "white",
              border: "none",
              padding: "0 1.25rem",
              "border-radius": "var(--radius-md)",
              "font-weight": "700",
              "font-size": "13px",
              cursor: executing() ? "not-allowed" : "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
