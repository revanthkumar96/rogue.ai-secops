import { Component, createSignal, onMount, For, Show } from "solid-js"
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

  onMount(async () => {
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
          {statCard("Workflows", stats()!.workflows.total, "📋", "var(--accent)", Object.entries(stats()!.workflows.by_status).map(([k,v]) => `${v} ${k}`).join(", ") || "None yet")}
          {statCard("Test Runs", stats()!.tests.total_runs, "🧪", "#8b5cf6",
            stats()!.tests.total_runs > 0
              ? `${stats()!.tests.total_passed} passed, ${stats()!.tests.total_failed} failed`
              : "No tests yet"
          )}
          {statCard("Deployments", stats()!.deployments.total, "🚀", "#06b6d4", stats()!.deployments.total > 0 ? `${stats()!.deployments.total} total` : "No deployments yet")}
        </div>

        {/* Recent Activity */}
        <div style={{ display: "grid", "grid-template-columns": "1fr", gap: "1.5rem" }}>
          <div>
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
          </div>
        </div>
      </Show>
    </div>
  )
}
