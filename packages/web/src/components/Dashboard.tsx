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
    <div class="container">
      <h1>Dashboard</h1>

      <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", "margin-bottom": "2rem" }}>
        <div class="card">
          <h3 style={{ "font-size": "14px", color: "var(--text-secondary)", "margin-bottom": "0.5rem" }}>
            Total Agents
          </h3>
          <div style={{ "font-size": "32px", "font-weight": "bold" }}>
            {loading() ? "..." : agents().length}
          </div>
        </div>

        <div class="card">
          <h3 style={{ "font-size": "14px", color: "var(--text-secondary)", "margin-bottom": "0.5rem" }}>
            Workflows
          </h3>
          <div style={{ "font-size": "32px", "font-weight": "bold" }}>0</div>
        </div>

        <div class="card">
          <h3 style={{ "font-size": "14px", color: "var(--text-secondary)", "margin-bottom": "0.5rem" }}>
            Deployments
          </h3>
          <div style={{ "font-size": "32px", "font-weight": "bold" }}>0</div>
        </div>

        <div class="card">
          <h3 style={{ "font-size": "14px", color: "var(--text-secondary)", "margin-bottom": "0.5rem" }}>
            Test Runs
          </h3>
          <div style={{ "font-size": "32px", "font-weight": "bold" }}>0</div>
        </div>
      </div>

      <h2 style={{ "margin-bottom": "1rem" }}>Agents</h2>
      {loading() ? (
        <div class="card">Loading agents...</div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          <For each={agents()}>
            {(agent) => (
              <div class="card">
                <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                  <div>
                    <h3 style={{ margin: 0, "margin-bottom": "0.25rem" }}>
                      {agent.name}
                    </h3>
                    <p style={{ margin: 0, color: "var(--text-secondary)", "font-size": "14px" }}>
                      DevOps automation agent
                    </p>
                  </div>
                  <span class="badge badge-success">{agent.status}</span>
                </div>
              </div>
            )}
          </For>
        </div>
      )}
    </div>
  )
}
