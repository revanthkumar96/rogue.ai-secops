import { Component, createSignal, onMount, For, Show } from "solid-js"
import { api } from "../lib/api"

interface Agent {
  name: string
  status: string
}

export const Dashboard: Component = () => {
  const [agents, setAgents] = createSignal<Agent[]>([])
  const [loading, setLoading] = createSignal(true)

  const [globalTask, setGlobalTask] = createSignal("")
  const [globalResult, setGlobalResult] = createSignal("")
  const [executing, setExecuting] = createSignal(false)

  onMount(async () => {
    try {
      const response = await fetch("/api/agent")
      const data = await response.json()
      setAgents(data.agents.filter((name: string) => name !== "router").map((name: string) => ({ name, status: "ready" })))
    } catch (error) {
      console.error("Failed to fetch agents:", error)
    } finally {
      setLoading(false)
    }
  })

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

  return (
    <div style={{ padding: "1rem 0" }}>
      <div style={{ "margin-bottom": "2.5rem", display: "flex", "align-items": "baseline", gap: "1rem" }}>
        <h1 style={{ "font-size": "1.75rem", margin: 0 }}>Terminal Overview</h1>
        <span style={{ color: "var(--accent)", "font-size": "12px", "font-family": "var(--font-family-mono)", opacity: 0.6 }}>SYSTEM_READY: ONLINE</span>
      </div>

      {/* Embedded Global Command Center */}
      <div class="card" style={{ 
        "background": "linear-gradient(145deg, var(--bg-tertiary), #0a0a0a)", 
        "border": "1px solid var(--accent-soft)",
        "box-shadow": "var(--glow-accent-soft)",
        "margin-bottom": "2.5rem",
        padding: "1.5rem"
      }}>
        <div style={{ display: "flex", gap: "1rem", "align-items": "center" }}>
            <div style={{ flex: 1 }}>
                <input
                    type="text"
                    placeholder="Broadcast task to Parent Intelligence..."
                    value={globalTask()}
                    onInput={(e) => setGlobalTask(e.currentTarget.value)}
                    style={{ 
                        width: "100%",
                        background: "rgba(0,0,0,0.3)", 
                        border: "1px solid var(--border-strong)",
                        padding: "0.875rem 1.25rem",
                        "font-size": "15px",
                        "border-radius": "var(--radius-md)"
                    }}
                    disabled={executing()}
                    onKeyDown={(e) => e.key === "Enter" && handleGlobalExecute()}
                />
            </div>
            <button 
                onClick={handleGlobalExecute} 
                disabled={executing() || !globalTask()}
                style={{ 
                    background: "var(--accent)", 
                    color: "var(--bg-primary)",
                    padding: "0.875rem 1.5rem",
                    "font-weight": "800",
                    "font-size": "13px"
                }}
            >
                {executing() ? "Routing..." : "Transmit"}
            </button>
        </div>

        <Show when={globalResult()}>
            <div style={{ 
                "margin-top": "1.5rem",
                padding: "1.25rem",
                background: "#050505",
                border: "1px solid var(--border-strong)",
                "border-radius": "var(--radius-md)",
                "font-family": "var(--font-family-mono)",
                "font-size": "12px",
                color: "var(--text-secondary)",
                "white-space": "pre-wrap",
                "max-height": "300px",
                "overflow": "auto"
            }}>
                <div style={{ "margin-bottom": "0.5rem", display: "flex", "justify-content": "space-between" }}>
                    <span style={{ color: "var(--accent)", "font-size": "10px" }}>TRANSMISSION_RESULT</span>
                    <button onClick={() => setGlobalResult("")} style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", cursor: "pointer", "font-size": "10px" }}>CLOSE</button>
                </div>
                {globalResult()}
            </div>
        </Show>
      </div>

      <div style={{ 
        display: "grid", 
        "grid-template-columns": "repeat(auto-fit, minmax(240px, 1fr))", 
        gap: "1.25rem", 
        "margin-bottom": "3rem" 
      }}>
        <div class="card" style={{ display: "flex", "flex-direction": "column", gap: "1rem" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
            <span style={{ "font-size": "0.875rem", "font-weight": "500", color: "var(--text-tertiary)" }}>Total Agents</span>
            <span style={{ "font-size": "1.25rem" }}>🤖</span>
          </div>
          <div style={{ "font-size": "2.5rem", "font-weight": "700", "letter-spacing": "-0.05em" }}>
            {loading() ? "..." : agents().length}
          </div>
          <div style={{ "font-size": "12px", color: "var(--success)", "font-weight": "500" }}>
            ↑ 2 new today
          </div>
        </div>

        <div class="card" style={{ display: "flex", "flex-direction": "column", gap: "1rem" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
            <span style={{ "font-size": "0.875rem", "font-weight": "500", color: "var(--text-tertiary)" }}>Active Workflows</span>
            <span style={{ "font-size": "1.25rem" }}>📋</span>
          </div>
          <div style={{ "font-size": "2.5rem", "font-weight": "700", "letter-spacing": "-0.05em" }}>0</div>
          <div style={{ "font-size": "12px", color: "var(--text-tertiary)" }}>No active tasks</div>
        </div>

        <div class="card" style={{ display: "flex", "flex-direction": "column", gap: "1rem" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
            <span style={{ "font-size": "0.875rem", "font-weight": "500", color: "var(--text-tertiary)" }}>Deployments</span>
            <span style={{ "font-size": "1.25rem" }}>🚀</span>
          </div>
          <div style={{ "font-size": "2.5rem", "font-weight": "700", "letter-spacing": "-0.05em" }}>0</div>
          <div style={{ "font-size": "12px", color: "var(--text-tertiary)" }}>All systems stable</div>
        </div>

        <div class="card" style={{ display: "flex", "flex-direction": "column", gap: "1rem" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
            <span style={{ "font-size": "0.875rem", "font-weight": "500", color: "var(--text-tertiary)" }}>Test Success</span>
            <span style={{ "font-size": "1.25rem" }}>🧪</span>
          </div>
          <div style={{ "font-size": "2.5rem", "font-weight": "700", "letter-spacing": "-0.05em" }}>-</div>
          <div style={{ "font-size": "12px", color: "var(--text-tertiary)" }}>Pending execution</div>
        </div>
      </div>

      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end", "margin-bottom": "1.5rem" }}>
        <h2 style={{ margin: 0, "font-size": "1.5rem", "letter-spacing": "-0.03em" }}>Recent Agents</h2>
        <button style={{ 
          background: "transparent", 
          color: "var(--accent)", 
          border: "1px solid var(--accent-soft)", 
          "font-size": "12px" 
        }}>
          View All
        </button>
      </div>

      {loading() ? (
        <div class="card" style={{ "text-align": "center", padding: "3rem" }}>
          <div style={{ color: "var(--text-tertiary)" }}>Synchronizing agents...</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <For each={agents()}>
            {(agent) => (
              <div class="card" style={{ 
                display: "flex", 
                "justify-content": "space-between", 
                "align-items": "center",
                padding: "1rem 1.5rem"
              }}>
                <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    "border-radius": "var(--radius-md)", 
                    background: "var(--bg-tertiary)",
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    "font-size": "1.25rem"
                  }}>
                    🤖
                  </div>
                  <div>
                    <h3 style={{ margin: 0, "font-size": "1rem" }}>
                      {agent.name}
                    </h3>
                    <p style={{ margin: 0, color: "var(--text-tertiary)", "font-size": "13px" }}>
                      System Automation Utility
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
                  <span class="badge badge-success" style={{ "text-transform": "capitalize" }}>
                    {agent.status}
                  </span>
                  <div style={{ color: "var(--border-strong)" }}>⋮</div>
                </div>
              </div>
            )}
          </For>
        </div>
      )}
    </div>
  )
}
