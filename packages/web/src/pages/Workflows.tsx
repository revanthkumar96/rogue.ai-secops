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
    <div style={{ padding: "2rem 0" }}>
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end", "margin-bottom": "2.5rem" }}>
        <div>
          <h1 style={{ "font-size": "2rem", margin: 0, "letter-spacing": "-0.04em" }}>Workflows</h1>
          <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0 0" }}>
            Automate complex multi-agent security operations.
          </p>
        </div>
        <button style={{ "font-size": "13px", padding: "0.5rem 1.25rem" }}>+ Create Workflow</button>
      </div>

      <Show when={loading()}>
        <div class="card" style={{ "text-align": "center", padding: "3rem" }}>
          <div style={{ color: "var(--text-tertiary)" }}>Loading workflows...</div>
        </div>
      </Show>

      <Show when={!loading() && workflows().length === 0}>
        <div class="card" style={{ "text-align": "center", padding: "3rem", border: "1px dashed var(--border-strong)" }}>
          <div style={{ "font-size": "2rem", "margin-bottom": "1rem" }}>📋</div>
          <h3 style={{ margin: 0 }}>No Workflows Found</h3>
          <p style={{ color: "var(--text-tertiary)", margin: "0.5rem 0 1.5rem 0", "font-size": "14px" }}>
            Create your first multi-agent workflow to automate your security pipeline.
          </p>
          <button style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-strong)" }}>
            Get Started
          </button>
        </div>
      </Show>

      <Show when={!loading() && workflows().length > 0}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <For each={workflows()}>
            {(workflow) => (
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
                    background: "var(--accent-soft)",
                    display: "flex", "align-items": "center", "justify-content": "center", "font-size": "1.5rem"
                  }}>
                    📋
                  </div>
                  <div>
                    <h3 style={{ margin: 0, "font-size": "1.125rem" }}>
                      {workflow.name}
                    </h3>
                    <p style={{ color: "var(--text-tertiary)", "font-size": "13px", "margin": "0.25rem 0" }}>
                      {workflow.description || "Automated multi-step procedure"}
                    </p>
                    <div style={{ display: "flex", gap: "1rem", "margin-top": "0.5rem" }}>
                      <span style={{ "font-size": "11px", color: "var(--text-tertiary)", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>
                        {workflow.steps.length} Actions
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", "align-items": "center", gap: "1.5rem" }}>
                  <span class={getStatusBadge(workflow.status)} style={{ "text-transform": "capitalize" }}>
                    {workflow.status}
                  </span>
                  <button style={{ 
                    background: "var(--bg-tertiary)", 
                    color: "var(--text-primary)", 
                    border: "1px solid var(--border-strong)",
                    "font-size": "13px",
                    padding: "0.4rem 1rem"
                  }}>
                    Run Workflow
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
