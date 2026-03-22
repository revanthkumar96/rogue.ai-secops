import { Component, createSignal, For, Show, onMount } from "solid-js"
import { api } from "../lib/api"

export const AgentsPage: Component = () => {
  const [agents, setAgents] = createSignal<string[]>([])
  const [loading, setLoading] = createSignal(true)
  const [globalTask, setGlobalTask] = createSignal("")
  const [globalResult, setGlobalResult] = createSignal("")
  const [executing, setExecuting] = createSignal(false)

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

  return (
    <div style={{ padding: "2rem 0" }}>
      <div style={{ "margin-bottom": "3rem" }}>
        <h1 style={{ "font-size": "2.25rem", margin: 0, "letter-spacing": "-0.04em", "font-weight": "800" }}>Command Center</h1>
        <p style={{ color: "var(--text-tertiary)", margin: "0.5rem 0 0 0", "font-family": "var(--font-family-mono)", "font-size": "13px" }}>
            CENTRAL_INTELLIGENCE: ACTIVE // PROJECT_RESOURCES: ONLINE
        </p>
      </div>

      {/* Global Unified Chat */}
      <div class="card" style={{ 
        "background": "linear-gradient(145deg, var(--bg-tertiary), #0a0a0a)", 
        "border": "1px solid var(--accent-soft)",
        "box-shadow": "var(--glow-accent-soft)",
        "margin-bottom": "3rem",
        padding: "2rem"
      }}>
        <div style={{ "margin-bottom": "1.5rem" }}>
            <h2 style={{ margin: 0, "font-size": "1.25rem", color: "var(--accent)" }}>Parent Intelligence</h2>
            <p style={{ margin: "0.25rem 0 0 0", color: "var(--text-tertiary)", "font-size": "13px" }}>
                Ask anything. I will route your request to the appropriate specialist squad.
            </p>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
            <input
                type="text"
                placeholder="Ex: 'Run security scan on current workspace' or 'Find memory leaks in tests'"
                value={globalTask()}
                onInput={(e) => setGlobalTask(e.currentTarget.value)}
                style={{ 
                    flex: 1, 
                    background: "rgba(0,0,0,0.3)", 
                    border: "1px solid var(--border-strong)",
                    padding: "1rem 1.5rem",
                    "font-size": "16px",
                    "border-radius": "var(--radius-md)"
                }}
                disabled={executing()}
                onKeyDown={(e) => e.key === "Enter" && handleGlobalExecute()}
            />
            <button 
                onClick={handleGlobalExecute} 
                disabled={executing() || !globalTask()}
                style={{ 
                    background: "var(--accent)", 
                    color: "var(--bg-primary)",
                    padding: "0 2rem",
                    "font-weight": "800",
                    "text-transform": "uppercase",
                    "letter-spacing": "0.1em"
                }}
            >
                {executing() ? "Routing..." : "Transmit"}
            </button>
        </div>

        <Show when={globalResult()}>
            <div style={{ 
                "margin-top": "2rem",
                padding: "1.5rem",
                background: "#050505",
                border: "1px solid var(--border-strong)",
                "border-radius": "var(--radius-md)",
                "font-family": "var(--font-family-mono)",
                "font-size": "13px",
                color: "var(--text-secondary)",
                "white-space": "pre-wrap",
                "max-height": "400px",
                "overflow": "auto"
            }}>
                <div style={{ "margin-bottom": "0.75rem", display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                    <span style={{ color: "var(--accent)", "font-size": "10px", "text-transform": "uppercase" }}>Uplink Transmission Result</span>
                    <button onClick={() => setGlobalResult("")} style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", cursor: "pointer", "font-size": "10px" }}>CLEAR</button>
                </div>
                {globalResult()}
            </div>
        </Show>
      </div>

      <div style={{ "margin-bottom": "1.5rem", display: "flex", "align-items": "center", gap: "1rem" }}>
          <h2 style={{ margin: 0, "font-size": "1.5rem", "letter-spacing": "-0.03em" }}>Specialist Squad</h2>
          <div style={{ flex: 1, height: "1px", background: "var(--border-strong)" }}></div>
      </div>

      <Show when={loading()}>
        <div class="card" style={{ "text-align": "center", padding: "3rem" }}>
          <div style={{ color: "var(--text-tertiary)" }}>Loading agent registry...</div>
        </div>
      </Show>

      <Show when={!loading()}>
        <div style={{ 
          display: "grid", 
          "grid-template-columns": "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "1.25rem" 
        }}>
          <For each={agents()}>
            {(agent) => (
              <div class="card" style={{ 
                padding: "1.25rem",
                display: "flex",
                "justify-content": "space-between",
                "align-items": "center",
                opacity: 0.8
              }}>
                <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
                    <div style={{ "font-size": "1.25rem" }}>🤖</div>
                    <div>
                        <h3 style={{ margin: 0, "font-size": "0.95rem", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>{agent}</h3>
                        <p style={{ margin: 0, "font-size": "11px", color: "var(--text-tertiary)" }}>{getAgentDescription(agent)}</p>
                    </div>
                </div>
                <div class="badge badge-success" style={{ "font-size": "9px" }}>READY</div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
