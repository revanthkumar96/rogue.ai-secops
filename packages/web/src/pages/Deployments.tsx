import { Component, createSignal, For, Show, onMount } from "solid-js"
import { api, type Deployment } from "../lib/api"
import { SkeletonList } from "../components/Skeleton"

export const DeploymentsPage: Component = () => {
  const [deployments, setDeployments] = createSignal<Deployment[]>([])
  const [loading, setLoading] = createSignal(true)

  onMount(async () => {
    try {
      const response = await api.listDeployments()
      setDeployments(response.deployments)
    } catch (e) {
      console.error("Failed to load deployments:", e)
    } finally {
      setLoading(false)
    }
  })

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      validating: "badge badge-warning", deploying: "badge badge-warning",
      deployed: "badge badge-success", failed: "badge badge-danger",
      rolling_back: "badge badge-danger",
    }
    return map[status] || "badge"
  }

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <div style={{ "margin-bottom": "1.5rem" }}>
        <h1 style={{ "font-size": "1.5rem", margin: 0 }}>Deployments</h1>
        <p style={{ color: "var(--text-tertiary)", "font-size": "13px", "margin-top": "0.25rem" }}>Release history across environments</p>
      </div>

      <Show when={loading()}>
        <SkeletonList count={3} />
      </Show>

      <Show when={!loading() && deployments().length === 0}>
        <div class="card" style={{ "text-align": "center", padding: "3rem" }}>
          <div style={{ "font-size": "2rem", "margin-bottom": "0.75rem" }}>🚀</div>
          <div style={{ "font-weight": "600", "margin-bottom": "0.25rem" }}>No Deployments</div>
          <div style={{ "font-size": "13px", color: "var(--text-tertiary)" }}>
            Ask the deploy agent to create your first deployment.
          </div>
        </div>
      </Show>

      <Show when={!loading() && deployments().length > 0}>
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
          <For each={deployments()}>
            {(d) => (
              <div class="card" style={{ display: "flex", "justify-content": "space-between", "align-items": "center", padding: "0.75rem 1rem" }}>
                <div>
                  <div style={{ "font-weight": "600", "font-size": "14px" }}>
                    {d.environment} <span style={{ color: "var(--text-tertiary)", "font-weight": "400" }}>v{d.version}</span>
                  </div>
                  <div style={{ "font-size": "11px", color: "var(--text-tertiary)", "font-family": "var(--font-family-mono)" }}>{d.id.slice(0, 12)}</div>
                </div>
                <span class={statusBadge(d.status)} style={{ "text-transform": "capitalize" }}>{d.status}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
