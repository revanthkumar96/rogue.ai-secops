import { Component, createSignal, For, Show, onMount } from "solid-js"
import { api, type Workflow } from "../lib/api"
import { SkeletonList } from "../components/Skeleton"

export const WorkflowsPage: Component = () => {
  const [workflows, setWorkflows] = createSignal<Workflow[]>([])
  const [loading, setLoading] = createSignal(true)

  onMount(async () => {
    try {
      const response = await api.listWorkflows()
      setWorkflows(response.workflows)
    } catch (e) {
      console.error("Failed to load workflows:", e)
    } finally {
      setLoading(false)
    }
  })

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: "badge", running: "badge badge-warning", completed: "badge badge-success", failed: "badge badge-danger" }
    return map[status] || "badge"
  }

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "1.5rem" }}>
        <div>
          <h1 style={{ "font-size": "1.5rem", margin: 0 }}>Workflows</h1>
          <p style={{ color: "var(--text-tertiary)", "font-size": "13px", "margin-top": "0.25rem" }}>Multi-step automation pipelines</p>
        </div>
      </div>

      <Show when={loading()}>
        <SkeletonList count={3} />
      </Show>

      <Show when={!loading() && workflows().length === 0}>
        <div class="card" style={{ "text-align": "center", padding: "3rem" }}>
          <div style={{ "font-size": "2rem", "margin-bottom": "0.75rem" }}>📋</div>
          <div style={{ "font-weight": "600", "margin-bottom": "0.25rem" }}>No Workflows Yet</div>
          <div style={{ "font-size": "13px", color: "var(--text-tertiary)" }}>
            Ask an agent to create a workflow, or use the CLI.
          </div>
        </div>
      </Show>

      <Show when={!loading() && workflows().length > 0}>
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
          <For each={workflows()}>
            {(wf) => (
              <div class="card" style={{ display: "flex", "justify-content": "space-between", "align-items": "center", padding: "0.75rem 1rem" }}>
                <div style={{ "min-width": 0 }}>
                  <div style={{ "font-weight": "600", "font-size": "14px" }}>{wf.name}</div>
                  <div style={{ "font-size": "12px", color: "var(--text-tertiary)" }}>{wf.description || `${wf.steps?.length || 0} steps`}</div>
                </div>
                <span class={statusBadge(wf.status)} style={{ "text-transform": "capitalize" }}>{wf.status}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
