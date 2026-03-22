import { Component, createSignal, onMount, For } from "solid-js"

interface Agent {
  name: string
  status: string
}

export const Dashboard: Component = () => {
  const [agents, setAgents] = createSignal<Agent[]>([])
  const [loading, setLoading] = createSignal(true)

  onMount(async () => {
    try {
      const response = await fetch("/api/agent")
      const data = await response.json()
      setAgents(data.agents.map((name: string) => ({ name, status: "ready" })))
    } catch (error) {
      console.error("Failed to fetch agents:", error)
    } finally {
      setLoading(false)
    }
  })

  return (
    <div style={{ padding: "2rem 0" }}>
      <div style={{ "margin-bottom": "2.5rem" }}>
        <h1 style={{ "font-size": "2rem", margin: 0, "letter-spacing": "-0.04em" }}>Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0 0" }}>
          Overview of your DevOps infrastructure and agent activity.
        </p>
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
