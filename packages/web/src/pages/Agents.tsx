import { Component, createSignal, For, Show, onMount } from "solid-js"
import { api } from "../lib/api"

export const AgentsPage: Component = () => {
  const [agents, setAgents] = createSignal<string[]>([])
  const [loading, setLoading] = createSignal(true)
  const [globalTask, setGlobalTask] = createSignal("")
  const [globalResult, setGlobalResult] = createSignal("")
  const [executing, setExecuting] = createSignal(false)
  const [selectedAgent, setSelectedAgent] = createSignal<string | null>(null)

  const loadAgents = async () => {
    try {
      const response = await api.listAgents()
      setAgents(response.agents.filter(a => a !== "router"))
    } catch (error) {
      console.error("Failed to load agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGlobalExecute = async () => {
    if (!globalTask()) return
    setExecuting(true)
    setGlobalResult("")
    try {
      const response = await api.executeAgent({
        type: "router",
        task: globalTask(),
        stream: false,
      })
      setGlobalResult(response.output)
    } catch (error: any) {
      setGlobalResult(`Error: ${error.message}`)
    } finally {
      setExecuting(false)
    }
  }

  onMount(() => {
    loadAgents()
  })

  const getAgentIcon = (name: string): string => {
    const icons: Record<string, string> = {
      test: "🧪",
      deploy: "🚀",
      monitor: "📊",
      analyze: "🔍",
      "ci-cd": "⚙️",
      security: "🔒",
      performance: "⚡",
      infrastructure: "🏗️",
      incident: "🚨",
      database: "💾",
    }
    return icons[name] || "🤖"
  }

  const getAgentDescription = (name: string): string => {
    const descriptions: Record<string, string> = {
      test: "Test generation and execution",
      deploy: "Deployment automation",
      monitor: "System monitoring and alerting",
      analyze: "Log and error analysis",
      "ci-cd": "CI/CD pipeline automation",
      security: "Security scanning and compliance",
      performance: "Performance and load testing",
      infrastructure: "Infrastructure-as-Code management",
      incident: "Incident response and troubleshooting",
      database: "Database operations and optimization",
    }
    return descriptions[name] || "DevOps automation agent"
  }

  const getAgentColor = (name: string): string => {
    const colors: Record<string, string> = {
      test: "#8b5cf6",
      deploy: "#06b6d4",
      monitor: "#3b82f6",
      analyze: "#f59e0b",
      "ci-cd": "#10b981",
      security: "#ef4444",
      performance: "#eab308",
      infrastructure: "#6366f1",
      incident: "#f97316",
      database: "#14b8a6",
    }
    return colors[name] || "#6b7280"
  }

  return (
    <div style={{ padding: "1rem 0", "max-width": "1400px", margin: "0 auto" }}>
      {/* Hero Header */}
      <div style={{ "margin-bottom": "2rem", "text-align": "center" }}>
        <div style={{
          "font-size": "clamp(2rem, 5vw, 3rem)",
          "font-weight": "900",
          "letter-spacing": "-0.04em",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "margin-bottom": "0.5rem"
        }}>
          Rouge.ai - The Fairy Tail
        </div>
        <p style={{
          color: "var(--text-tertiary)",
          "font-family": "var(--font-family-mono)",
          "font-size": "clamp(11px, 2vw, 13px)",
          "letter-spacing": "0.1em"
        }}>
          INTELLIGENCE_MATRIX: ONLINE // AGENTS_READY: {agents().length} // STATUS: OPERATIONAL
        </p>
      </div>

      {/* Main Chat Interface */}
      <div class="card" style={{
        background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
        border: "1px solid rgba(102, 126, 234, 0.3)",
        "box-shadow": "0 8px 32px rgba(102, 126, 234, 0.1)",
        "margin-bottom": "2rem",
        padding: "clamp(1rem, 3vw, 2rem)",
        "border-radius": "1rem",
        transition: "all 0.3s ease"
      }}>
        <div style={{ "margin-bottom": "1.5rem" }}>
          <div style={{ display: "flex", "align-items": "center", gap: "0.75rem", "margin-bottom": "0.5rem" }}>
            <div style={{
              "font-size": "1.5rem",
              animation: "pulse 2s ease-in-out infinite"
            }}>✨</div>
            <h2 style={{
              margin: 0,
              "font-size": "clamp(1rem, 3vw, 1.5rem)",
              "font-weight": "700",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "-webkit-background-clip": "text",
              "-webkit-text-fill-color": "transparent"
            }}>
              Ask Your Fairy Tail
            </h2>
          </div>
          <p style={{
            margin: 0,
            color: "var(--text-tertiary)",
            "font-size": "clamp(11px, 2vw, 14px)",
            "line-height": "1.5"
          }}>
            Describe your task in natural language. I'll route it to the perfect specialist agent.
          </p>
        </div>

        <div style={{ display: "flex", "flex-direction": "column", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", "flex-wrap": "wrap" }}>
            <input
              type="text"
              placeholder="e.g., 'Analyze error logs from production' or 'Deploy v2.0 to staging'"
              value={globalTask()}
              onInput={(e) => setGlobalTask(e.currentTarget.value)}
              style={{
                flex: "1 1 300px",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(102, 126, 234, 0.3)",
                padding: "clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)",
                "font-size": "clamp(14px, 2vw, 16px)",
                "border-radius": "0.75rem",
                color: "white",
                outline: "none",
                transition: "all 0.3s ease"
              }}
              disabled={executing()}
              onKeyDown={(e) => e.key === "Enter" && handleGlobalExecute()}
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.6)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.3)"}
            />
            <button
              onClick={handleGlobalExecute}
              disabled={executing() || !globalTask()}
              style={{
                background: executing() ? "#555" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 3vw, 2.5rem)",
                "font-weight": "700",
                "font-size": "clamp(12px, 2vw, 14px)",
                "letter-spacing": "0.05em",
                border: "none",
                "border-radius": "0.75rem",
                cursor: executing() ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                "white-space": "nowrap"
              }}
              onMouseEnter={(e) => !executing() && (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {executing() ? "⏳ Processing..." : "🚀 Execute"}
            </button>
          </div>

          <Show when={globalResult()}>
            <div style={{
              "margin-top": "1rem",
              padding: "clamp(1rem, 2vw, 1.5rem)",
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(102, 126, 234, 0.3)",
              "border-radius": "0.75rem",
              "font-family": "var(--font-family-mono)",
              "font-size": "clamp(11px, 2vw, 13px)",
              color: "var(--text-secondary)",
              "white-space": "pre-wrap",
              "max-height": "400px",
              "overflow": "auto",
              animation: "slideIn 0.3s ease-out"
            }}>
              <div style={{
                "margin-bottom": "0.75rem",
                display: "flex",
                "justify-content": "space-between",
                "align-items": "center",
                "padding-bottom": "0.75rem",
                "border-bottom": "1px solid rgba(102, 126, 234, 0.2)"
              }}>
                <span style={{
                  color: "#667eea",
                  "font-size": "clamp(9px, 2vw, 11px)",
                  "font-weight": "700",
                  "letter-spacing": "0.1em"
                }}>
                  ✨ FAIRY TAIL RESPONSE
                </span>
                <button
                  onClick={() => setGlobalResult("")}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(102, 126, 234, 0.3)",
                    color: "var(--text-tertiary)",
                    cursor: "pointer",
                    "font-size": "clamp(9px, 2vw, 10px)",
                    padding: "0.25rem 0.75rem",
                    "border-radius": "0.5rem",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#667eea"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.3)"}
                >
                  CLEAR
                </button>
              </div>
              {globalResult()}
            </div>
          </Show>
        </div>
      </div>

      {/* Agent Grid */}
      <div style={{ "margin-bottom": "1rem" }}>
        <h2 style={{
          margin: 0,
          "font-size": "clamp(1.25rem, 3vw, 1.75rem)",
          "font-weight": "700",
          "letter-spacing": "-0.02em",
          "margin-bottom": "1rem"
        }}>
          Specialist Agents
        </h2>
      </div>

      <Show when={loading()}>
        <div class="card" style={{ "text-align": "center", padding: "3rem" }}>
          <div style={{ "font-size": "2rem", "margin-bottom": "1rem" }}>⏳</div>
          <div style={{ color: "var(--text-tertiary)" }}>Awakening fairy tail agents...</div>
        </div>
      </Show>

      <Show when={!loading()}>
        <div style={{
          display: "grid",
          "grid-template-columns": "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
          gap: "1rem"
        }}>
          <For each={agents()}>
            {(agent) => (
              <div
                class="card agent-card"
                onClick={() => setSelectedAgent(agent)}
                style={{
                  padding: "1.25rem",
                  "border-radius": "0.75rem",
                  border: `1px solid ${selectedAgent() === agent ? getAgentColor(agent) : "var(--border-strong)"}`,
                  background: selectedAgent() === agent
                    ? `linear-gradient(135deg, ${getAgentColor(agent)}15 0%, ${getAgentColor(agent)}05 100%)`
                    : "var(--bg-secondary)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.boxShadow = `0 8px 24px ${getAgentColor(agent)}40`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                {/* Animated background gradient */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(135deg, ${getAgentColor(agent)}20 0%, transparent 100%)`,
                  opacity: selectedAgent() === agent ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  "pointer-events": "none"
                }}></div>

                <div style={{ position: "relative", "z-index": 1 }}>
                  <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-start", "margin-bottom": "0.75rem" }}>
                    <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
                      <div style={{
                        "font-size": "2rem",
                        filter: selectedAgent() === agent ? "grayscale(0)" : "grayscale(0.5)"
                      }}>
                        {getAgentIcon(agent)}
                      </div>
                      <div>
                        <h3 style={{
                          margin: 0,
                          "font-size": "clamp(0.9rem, 2vw, 1.1rem)",
                          "font-weight": "700",
                          "text-transform": "uppercase",
                          "letter-spacing": "0.05em",
                          color: selectedAgent() === agent ? getAgentColor(agent) : "white"
                        }}>
                          {agent}
                        </h3>
                        <p style={{
                          margin: "0.25rem 0 0 0",
                          "font-size": "clamp(10px, 2vw, 12px)",
                          color: "var(--text-tertiary)",
                          "line-height": "1.4"
                        }}>
                          {getAgentDescription(agent)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    "border-radius": "2rem",
                    "font-size": "clamp(9px, 2vw, 10px)",
                    "font-weight": "700",
                    "letter-spacing": "0.05em",
                    background: `${getAgentColor(agent)}20`,
                    color: getAgentColor(agent),
                    border: `1px solid ${getAgentColor(agent)}40`
                  }}>
                    ● READY
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .agent-card {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  )
}
