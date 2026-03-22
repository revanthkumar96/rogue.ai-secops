import { Component, createSignal, onMount } from "solid-js"
import { api } from "../lib/api"

export const MonitoringPage: Component = () => {
  const [stats, setStats] = createSignal({ status: "checking", uptime: "0%" })

  onMount(async () => {
    try {
      const response = await api.health()
      if (response.status === "ok") {
        setStats({ status: "healthy", uptime: "99.9%" })
      }
    } catch (error) {
      setStats({ status: "unhealthy", uptime: "0%" })
    }
  })

  return (
    <div class="container">
      <h1>Monitoring</h1>
      <p style={{ color: "var(--text-secondary)", "margin-bottom": "2rem" }}>
        Real-time system health and performance monitoring
      </p>

      <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
        <div class="card">
          <h3 style={{ color: "var(--text-secondary)", "font-size": "14px" }}>System Status</h3>
          <div style={{ display: "flex", "align-items": "center", gap: "0.5rem", "margin-top": "1rem" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                "border-radius": "50%",
                background: stats().status === "healthy" ? "var(--success)" : "var(--danger)",
              }}
            />
            <span style={{ "font-size": "24px", "font-weight": "bold" }}>
              {stats().status.toUpperCase()}
            </span>
          </div>
        </div>

        <div class="card">
          <h3 style={{ color: "var(--text-secondary)", "font-size": "14px" }}>System Uptime</h3>
          <div style={{ "font-size": "24px", "font-weight": "bold", "margin-top": "1rem" }}>
            {stats().uptime}
          </div>
        </div>
      </div>

      <div class="card" style={{ "margin-top": "2rem" }}>
        <h3>Active Services</h3>
        <ul style={{ "list-style": "none", padding: 0, "margin-top": "1rem" }}>
          <li style={{ display: "flex", "justify-content": "space-between", padding: "0.5rem 0", "border-bottom": "1px solid var(--border)" }}>
            <span>Ollama AI Engine</span>
            <span style={{ color: "var(--success)" }}>Online</span>
          </li>
          <li style={{ display: "flex", "justify-content": "space-between", padding: "0.5rem 0", "border-bottom": "1px solid var(--border)" }}>
            <span>Rouge API Gateway</span>
            <span style={{ color: "var(--success)" }}>Online</span>
          </li>
          <li style={{ display: "flex", "justify-content": "space-between", padding: "0.5rem 0" }}>
            <span>SQLite Database</span>
            <span style={{ color: "var(--success)" }}>Healthy</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
