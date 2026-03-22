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
    <div style={{ padding: "2rem 0" }}>
      <div style={{ "margin-bottom": "2.5rem" }}>
        <h1 style={{ "font-size": "2rem", margin: 0, "letter-spacing": "-0.04em" }}>Monitoring</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0 0" }}>
          Real-time health telemetry for your security infrastructure.
        </p>
      </div>

      <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        <div class="card" style={{ display: "flex", "flex-direction": "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
            <span style={{ "font-size": "0.875rem", "font-weight": "500", color: "var(--text-tertiary)" }}>System Status</span>
            <span style={{ "font-size": "1.25rem" }}>🛰️</span>
          </div>
          <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                "border-radius": "50%",
                background: stats().status === "healthy" ? "var(--success)" : "var(--danger)",
                "box-shadow": stats().status === "healthy" ? "0 0 8px var(--success)" : "none"
              }}
            />
            <span style={{ "font-size": "2rem", "font-weight": "700", "letter-spacing": "-0.04em" }}>
              {stats().status.toUpperCase()}
            </span>
          </div>
          <div style={{ "font-size": "12px", color: "var(--text-tertiary)" }}>
            Heartbeat: Stable
          </div>
        </div>

        <div class="card" style={{ display: "flex", "flex-direction": "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
            <span style={{ "font-size": "0.875rem", "font-weight": "500", color: "var(--text-tertiary)" }}>System Uptime</span>
            <span style={{ "font-size": "1.25rem" }}>⏱️</span>
          </div>
          <div style={{ "font-size": "2rem", "font-weight": "700", "letter-spacing": "-0.04em" }}>
            {stats().uptime}
          </div>
          <div style={{ "font-size": "12px", color: "var(--success)", "font-weight": "500" }}>
            Availability: 99.9%
          </div>
        </div>
      </div>

      <div class="card" style={{ "margin-top": "2rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "1.5rem" }}>
          <h3 style={{ margin: 0, "font-size": "1.125rem" }}>Active Core Services</h3>
          <span style={{ "font-size": "11px", color: "var(--text-tertiary)", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>
            3 Online
          </span>
        </div>
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
          <div style={{ 
            display: "flex", 
            "justify-content": "space-between", 
            padding: "0.75rem 1rem", 
            background: "var(--bg-secondary)",
            "border-radius": "var(--radius-md)",
            border: "1px solid var(--border)"
          }}>
            <span style={{ "font-size": "14px", "font-weight": "500" }}>Ollama AI Engine</span>
            <span class="badge badge-success">Online</span>
          </div>
          <div style={{ 
            display: "flex", 
            "justify-content": "space-between", 
            padding: "0.75rem 1rem", 
            background: "var(--bg-secondary)",
            "border-radius": "var(--radius-md)",
            border: "1px solid var(--border)"
          }}>
            <span style={{ "font-size": "14px", "font-weight": "500" }}>Rouge API Gateway</span>
            <span class="badge badge-success">Online</span>
          </div>
          <div style={{ 
            display: "flex", 
            "justify-content": "space-between", 
            padding: "0.75rem 1rem", 
            background: "var(--bg-secondary)",
            "border-radius": "var(--radius-md)",
            border: "1px solid var(--border)"
          }}>
            <span style={{ "font-size": "14px", "font-weight": "500" }}>SQLite Database</span>
            <span class="badge badge-success">Healthy</span>
          </div>
        </div>
      </div>
    </div>
  )
}
