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
    <div class="container">
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "2rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Deployments</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Manage application deployments across environments
          </p>
        </div>
        <button>New Deployment</button>
      </div>

      <Show when={loading()}>
        <div class="card">Loading deployments...</div>
      </Show>

      <Show when={!loading() && deployments().length === 0}>
        <div class="card">
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            No deployments yet. Start your first deployment to get started.
          </p>
        </div>
      </Show>

      <Show when={!loading() && deployments().length > 0}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <For each={deployments()}>
            {(deploy) => (
              <div class="card">
                <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                  <div>
                    <h3 style={{ margin: 0, "margin-bottom": "0.25rem" }}>
                      {deploy.environment} - v{deploy.version}
                    </h3>
                    <p style={{ color: "var(--text-secondary)", "font-size": "12px", margin: 0 }}>
                      ID: {deploy.id}
                    </p>
                  </div>
                  <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
                    <span class={getStatusBadge(deploy.status)}>
                      {deploy.status}
                    </span>
                    <button>Logs</button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
