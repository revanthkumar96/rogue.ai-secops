import { Component, createSignal, For, Show, onMount } from "solid-js"
import { api, type Deployment } from "../lib/api"

export const DeploymentsPage: Component = () => {
  const [deployments, setDeployments] = createSignal<Deployment[]>([])
  const [loading, setLoading] = createSignal(true)

  const loadDeployments = async () => {
    try {
      const response = await api.listDeployments()
      setDeployments(response.deployments)
    } catch (error) {
      console.error("Failed to load deployments:", error)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    loadDeployments()
  })

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending: "badge",
      running: "badge badge-warning",
      completed: "badge badge-success",
      failed: "badge badge-danger",
    }
    return classes[status] || "badge"
  }

  return (
    <div style={{ padding: "2rem 0" }}>
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end", "margin-bottom": "2.5rem" }}>
        <div>
          <h1 style={{ "font-size": "2rem", margin: 0, "letter-spacing": "-0.04em" }}>Deployments</h1>
          <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0 0" }}>
            Track and manage application releases across environments.
          </p>
        </div>
        <button style={{ "font-size": "13px", padding: "0.5rem 1.25rem" }}>New Deployment</button>
      </div>

      <Show when={loading()}>
        <div class="card" style={{ "text-align": "center", padding: "3rem" }}>
          <div style={{ color: "var(--text-tertiary)" }}>Loading deployment history...</div>
        </div>
      </Show>

      <Show when={!loading() && deployments().length === 0}>
        <div class="card" style={{ "text-align": "center", padding: "3rem", border: "1px dashed var(--border-strong)" }}>
          <div style={{ "font-size": "2rem", "margin-bottom": "1rem" }}>🚀</div>
          <h3 style={{ margin: 0 }}>No Deployments</h3>
          <p style={{ color: "var(--text-tertiary)", margin: "0.5rem 0 1.5rem 0", "font-size": "14px" }}>
            Ready to release? Start your first deployment to production or staging.
          </p>
          <button style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-strong)" }}>
            Create Release
          </button>
        </div>
      </Show>

      <Show when={!loading() && deployments().length > 0}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <For each={deployments()}>
            {(deploy) => (
              <div class="card" style={{ 
                display: "flex", 
                "justify-content": "space-between", 
                "align-items": "center",
                padding: "1.25rem 1.5rem"
              }}>
                <div style={{ display: "flex", "align-items": "center", gap: "1.25rem" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    "border-radius": "var(--radius-lg)", 
                    background: "var(--bg-tertiary)",
                    display: "flex", "align-items": "center", "justify-content": "center", "font-size": "1.5rem"
                  }}>
                    🚀
                  </div>
                  <div>
                    <h3 style={{ margin: 0, "font-size": "1.125rem" }}>
                      {deploy.environment} <span style={{ color: "var(--text-tertiary)", "font-weight": "400" }}>v{deploy.version}</span>
                    </h3>
                    <p style={{ color: "var(--text-tertiary)", "font-size": "13px", "margin": "0.25rem 0" }}>
                      ID: <code style={{ "font-family": "var(--font-family-mono)", "font-size": "11px" }}>{deploy.id.slice(0, 8)}</code>
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", "align-items": "center", gap: "1.5rem" }}>
                  <span class={getStatusBadge(deploy.status)} style={{ "text-transform": "capitalize" }}>
                    {deploy.status}
                  </span>
                  <button style={{ 
                    background: "var(--bg-tertiary)", 
                    color: "var(--text-primary)", 
                    border: "1px solid var(--border-strong)",
                    "font-size": "13px",
                    padding: "0.4rem 1rem"
                  }}>
                    Logs
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
