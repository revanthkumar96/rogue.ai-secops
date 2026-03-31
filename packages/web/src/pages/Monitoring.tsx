import { Component, createSignal, onMount, onCleanup, Show } from "solid-js"
import { api } from "../lib/api"
import { SkeletonStatCard } from "../components/Skeleton"

export const MonitoringPage: Component = () => {
  const [ollamaOk, setOllamaOk] = createSignal(false)
  const [apiOk, setApiOk] = createSignal(false)
  const [dbOk, setDbOk] = createSignal(false)
  const [loading, setLoading] = createSignal(true)
  const [execCount, setExecCount] = createSignal(0)

  const check = async () => {
    try {
      const health = await api.health()
      setApiOk(health.status === "ok")
    } catch { setApiOk(false) }

    try {
      const conn = await api.testAgentConnection()
      setOllamaOk(conn.connected)
    } catch { setOllamaOk(false) }

    try {
      const stats = await fetch("/api/stats").then(r => r.json())
      setDbOk(true)
      setExecCount(stats.executions?.total || 0)
    } catch { setDbOk(false) }

    setLoading(false)
  }

  onMount(() => {
    check()
    const interval = setInterval(check, 10000)
    onCleanup(() => clearInterval(interval))
  })

  const svc = (name: string, ok: () => boolean) => (
    <div style={{
      display: "flex", "justify-content": "space-between", "align-items": "center",
      padding: "0.6rem 0.75rem", background: "var(--bg-primary)", "border-radius": "var(--radius-md)", border: "1px solid var(--border)",
    }}>
      <span style={{ "font-size": "13px", "font-weight": "500" }}>{name}</span>
      <span class={ok() ? "badge badge-success" : "badge badge-danger"}>{ok() ? "Online" : "Offline"}</span>
    </div>
  )

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <div style={{ "margin-bottom": "1.5rem" }}>
        <h1 style={{ "font-size": "1.5rem", margin: 0 }}>Monitoring</h1>
        <p style={{ color: "var(--text-tertiary)", "font-size": "13px", "margin-top": "0.25rem" }}>Live service health (auto-refreshes every 10s)</p>
      </div>

      <Show when={loading()}>
        <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </Show>

      <Show when={!loading()}>
        <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", "margin-bottom": "1.5rem" }}>
          <div class="card" style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
            <div style={{ "font-size": "12px", color: "var(--text-tertiary)" }}>System Status</div>
            <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
              <div style={{
                width: "10px", height: "10px", "border-radius": "50%",
                background: ollamaOk() && apiOk() ? "var(--success)" : "var(--danger)",
                "box-shadow": `0 0 6px ${ollamaOk() && apiOk() ? "var(--success)" : "var(--danger)"}`,
                animation: "pulse 2s ease-in-out infinite",
              }} />
              <span style={{ "font-size": "1.5rem", "font-weight": "800" }}>
                {ollamaOk() && apiOk() ? "HEALTHY" : "DEGRADED"}
              </span>
            </div>
          </div>
          <div class="card" style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
            <div style={{ "font-size": "12px", color: "var(--text-tertiary)" }}>Total Executions</div>
            <div style={{ "font-size": "1.5rem", "font-weight": "800" }}>{execCount()}</div>
          </div>
        </div>

        <h2 style={{ "font-size": "1rem", "margin-bottom": "0.75rem" }}>Services</h2>
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.4rem" }}>
          {svc("Ollama AI Engine", ollamaOk)}
          {svc("Rouge API Gateway", apiOk)}
          {svc("SQLite Database", dbOk)}
        </div>
      </Show>
    </div>
  )
}
