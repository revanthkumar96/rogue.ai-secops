import { Component, createSignal, For, Show } from "solid-js"
import { api, type Workflow } from "../lib/api"

export const WorkflowsPage: Component = () => {
  const [workflows, setWorkflows] = createSignal<Workflow[]>([])
  const [loading, setLoading] = createSignal(true)

  const loadWorkflows = async () => {
    try {
      const response = await api.listWorkflows()
      setWorkflows(response.workflows)
    } catch (error) {
      console.error("Failed to load workflows:", error)
    } finally {
      setLoading(false)
    }
  }

  loadWorkflows()

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
          <h1 style={{ margin: 0 }}>Workflows</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Manage automation workflows
          </p>
        </div>
        <button>Create Workflow</button>
      </div>

      <Show when={loading()}>
        <div class="card">Loading workflows...</div>
      </Show>

      <Show when={!loading() && workflows().length === 0}>
        <div class="card">
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            No workflows yet. Create your first workflow to get started.
          </p>
        </div>
      </Show>

      <Show when={!loading() && workflows().length > 0}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <For each={workflows()}>
            {(workflow) => (
              <div class="card">
                <div style={{ display: "flex", "justify-content": "space-between", "align-items": "start" }}>
                  <div>
                    <h3 style={{ margin: 0, "margin-bottom": "0.25rem" }}>
                      {workflow.name}
                    </h3>
                    <p style={{ color: "var(--text-secondary)", margin: 0, "margin-bottom": "0.5rem" }}>
                      {workflow.description || "No description"}
                    </p>
                    <p style={{ color: "var(--text-secondary)", "font-size": "12px", margin: 0 }}>
                      {workflow.steps.length} steps
                    </p>
                  </div>
                  <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
                    <span class={getStatusBadge(workflow.status)}>
                      {workflow.status}
                    </span>
                    <button>Run</button>
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
