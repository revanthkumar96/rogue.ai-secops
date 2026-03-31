import { Component, createSignal, onMount, onCleanup, For, Show } from "solid-js"
import { api } from "../lib/api"
import { SkeletonStatCard, SkeletonList } from "./Skeleton"

interface Stats {
  workflows: { total: number; by_status: Record<string, number> }
  tests: { total_runs: number; total_passed: number; total_failed: number; by_status: Record<string, number> }
  deployments: { total: number; recent: any[] }
  executions: { total: number; recent: any[] }
}

export const Dashboard: Component = () => {
  const [stats, setStats] = createSignal<Stats | null>(null)
  const [agentCount, setAgentCount] = createSignal(0)
  const [loading, setLoading] = createSignal(true)

  const loadStats = async () => {
    try {
      const [statsRes, agentsRes] = await Promise.all([
        fetch("/api/stats").then(r => r.json()),
        api.listAgents(),
      ])
      setStats(statsRes)
      setAgentCount(agentsRes.agents.filter((a: string) => a !== "router").length)
    } catch (e) {
      console.error("Failed to load stats:", e)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    loadStats()
    // Auto-refresh every 15s
    const interval = setInterval(loadStats, 15000)
    onCleanup(() => clearInterval(interval))
  })

  const statCard = (label: string, value: string | number, icon: string, color: string, sub?: string) => (
    <div class="card" style={{ display: "flex", "flex-direction": "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
        <span style={{ "font-size": "12px", "font-weight": "500", color: "var(--text-tertiary)" }}>{label}</span>
        <span style={{ "font-size": "1.25rem" }}>{icon}</span>
      </div>
      <div style={{ "font-size": "2rem", "font-weight": "800", "letter-spacing": "-0.04em", color }}>{value}</div>
      <Show when={sub}>
        <div style={{ "font-size": "11px", color: "var(--text-tertiary)" }}>{sub}</div>
      </Show>
    </div>
  )

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return "just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  /** CSS-only horizontal bar chart */
  const BarChart: Component<{ data: Record<string, number>; colors?: Record<string, string> }> = (props) => {
    const total = () => Object.values(props.data).reduce((a, b) => a + b, 0) || 1
    const defaultColors: Record<string, string> = {
      pending: "var(--text-tertiary)",
      running: "var(--warning)",
      completed: "var(--success)",
      failed: "var(--danger)",
      passed: "var(--success)",
      skipped: "var(--text-tertiary)",
    }
    return (
      <div>
        <div style={{ display: "flex", height: "8px", "border-radius": "4px", overflow: "hidden", background: "var(--bg-primary)", "margin-bottom": "0.5rem" }}>
          <For each={Object.entries(props.data)}>
            {([key, val]) => (
              <div style={{
                width: `${(val / total()) * 100}%`,
                background: (props.colors || defaultColors)[key] || "var(--accent)",
                transition: "width 0.5s ease",
              }} />
            )}
          </For>
        </div>
        <div style={{ display: "flex", "flex-wrap": "wrap", gap: "0.75rem" }}>
          <For each={Object.entries(props.data)}>
            {([key, val]) => (
              <div style={{ display: "flex", "align-items": "center", gap: "0.3rem", "font-size": "11px" }}>
                <div style={{
                  width: "8px", height: "8px", "border-radius": "2px",
                  background: (props.colors || defaultColors)[key] || "var(--accent)",
                }} />
                <span style={{ color: "var(--text-tertiary)" }}>{key}</span>
                <span style={{ "font-weight": "600", color: "var(--text-secondary)" }}>{val}</span>
              </div>
            )}
          </For>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <div style={{ "margin-bottom": "1.5rem" }}>
        <h1 style={{ "font-size": "1.5rem", margin: 0 }}>Dashboard</h1>
        <p style={{ color: "var(--text-tertiary)", "font-size": "13px", "margin-top": "0.25rem" }}>
          System overview and recent activity
        </p>
      </div>

      <Show when={loading()}>
        <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", "margin-bottom": "2rem" }}>
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div class="skeleton skeleton-title" />
        <SkeletonList count={4} />
      </Show>

      <Show when={!loading() && stats()}>
        {/* Stat cards */}
        <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", "margin-bottom": "2rem" }}>
          {statCard("Agents Ready", agentCount(), "🤖", "var(--text-primary)", `${agentCount()} specialists online`)}
          {statCard("Workflows", stats()!.workflows.total, "📋", "var(--accent)",
            Object.entries(stats()!.workflows.by_status).map(([k,v]) => `${v} ${k}`).join(", ") || "None yet"
          )}
          {statCard("Executions", stats()!.executions.total, "⚡", "#f59e0b",
            stats()!.executions.total > 0 ? `${stats()!.executions.recent.filter((e: any) => e.success).length} recent successes` : "No executions yet"
          )}
          {statCard("Deployments", stats()!.deployments.total, "🚀", "#06b6d4",
            stats()!.deployments.total > 0 ? `${stats()!.deployments.total} total` : "No deployments yet"
          )}
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", "margin-bottom": "2rem" }}>
          <Show when={Object.keys(stats()!.workflows.by_status).length > 0}>
            <div class="card">
              <h3 style={{ "font-size": "13px", margin: "0 0 0.75rem", color: "var(--text-secondary)" }}>Workflow Status</h3>
              <BarChart data={stats()!.workflows.by_status} />
            </div>
          </Show>
          <Show when={stats()!.executions.total > 0}>
            <div class="card">
              <h3 style={{ "font-size": "13px", margin: "0 0 0.75rem", color: "var(--text-secondary)" }}>Execution Results</h3>
              <BarChart data={{
                success: stats()!.executions.recent.filter((e: any) => e.success).length,
                failed: stats()!.executions.recent.filter((e: any) => !e.success).length,
              }} colors={{ success: "var(--success)", failed: "var(--danger)" }} />
            </div>
          </Show>
        </div>

        {/* Recent Activity */}
        <h2 style={{ "font-size": "1rem", "margin-bottom": "0.75rem" }}>Recent Executions</h2>
        <Show
          when={stats()!.executions.recent.length > 0}
          fallback={
            <div class="card" style={{ "text-align": "center", padding: "2rem", color: "var(--text-tertiary)", "font-size": "13px" }}>
              No executions yet. Head to <a href="/agents" style={{ color: "var(--accent)" }}>Agents</a> to run your first task.
            </div>
          }
        >
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
            <For each={stats()!.executions.recent}>
              {(exec) => (
                <div class="card" style={{
                  display: "flex",
                  "justify-content": "space-between",
                  "align-items": "center",
                  padding: "0.75rem 1rem",
                }}>
                  <div style={{ display: "flex", "align-items": "center", gap: "0.75rem", "min-width": 0 }}>
                    <div style={{
                      width: "8px", height: "8px", "border-radius": "50%", "flex-shrink": 0,
                      background: exec.success ? "var(--success)" : "var(--danger)",
                    }} />
                    <div style={{ "min-width": 0 }}>
                      <div style={{ "font-size": "12px", "font-weight": "600", color: "var(--text-secondary)", "text-transform": "uppercase" }}>
                        {exec.agent_type || "unknown"}
                      </div>
                      <div style={{ "font-size": "12px", color: "var(--text-tertiary)", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                        {exec.task}
                      </div>
                    </div>
                  </div>
                  <span style={{ "font-size": "11px", color: "var(--text-tertiary)", "white-space": "nowrap", "margin-left": "1rem" }}>
                    {timeAgo(exec.started_at)}
                  </span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  )
}
