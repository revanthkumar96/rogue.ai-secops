import { Component, createSignal, For, Show, onMount } from "solid-js"
import { api, type TestRun } from "../lib/api"

export const TestsPage: Component = () => {
  const [tests, setTests] = createSignal<TestRun[]>([])
  const [loading, setLoading] = createSignal(true)

  const loadTests = async () => {
    try {
      const response = await api.listTests()
      setTests(response.tests)
    } catch (error) {
      console.error("Failed to load tests:", error)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    loadTests()
  })

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending: "badge",
      running: "badge badge-warning",
      passed: "badge badge-success",
      failed: "badge badge-danger",
    }
    return classes[status] || "badge"
  }

  return (
    <div style={{ padding: "2rem 0" }}>
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end", "margin-bottom": "2.5rem" }}>
        <div>
          <h1 style={{ "font-size": "2rem", margin: 0, "letter-spacing": "-0.04em" }}>Tests</h1>
          <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0 0" }}>
            Monitor and execute automated test suites.
          </p>
        </div>
        <button 
          onClick={() => api.executeTests({})}
          style={{ "font-size": "13px", padding: "0.5rem 1.25rem" }}
        >
          Run All Tests
        </button>
      </div>

      <Show when={loading()}>
        <div class="card" style={{ "text-align": "center", padding: "3rem" }}>
          <div style={{ color: "var(--text-tertiary)" }}>Loading test runs...</div>
        </div>
      </Show>

      <Show when={!loading() && tests().length === 0}>
        <div class="card" style={{ "text-align": "center", padding: "3rem", border: "1px dashed var(--border-strong)" }}>
          <div style={{ "font-size": "2rem", "margin-bottom": "1rem" }}>🧪</div>
          <h3 style={{ margin: 0 }}>No Test Runs</h3>
          <p style={{ color: "var(--text-tertiary)", margin: "0.5rem 0 1.5rem 0", "font-size": "14px" }}>
            Start your first test execution to see results here.
          </p>
          <button style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-strong)" }}>
            New Test Run
          </button>
        </div>
      </Show>

      <Show when={!loading() && tests().length > 0}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <For each={tests()}>
            {(test) => (
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
                    background: test.status === "failed" ? "var(--danger-soft)" : "var(--success-soft)",
                    display: "flex", "align-items": "center", "justify-content": "center", "font-size": "1.5rem"
                  }}>
                    {test.status === "failed" ? "❌" : "✅"}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, "font-size": "1.125rem" }}>
                      {test.name}
                    </h3>
                    <p style={{ color: "var(--text-tertiary)", "font-size": "13px", "margin": "0.25rem 0" }}>
                      Run ID: <code style={{ "font-family": "var(--font-family-mono)", "font-size": "11px" }}>{test.id.slice(0, 8)}</code>
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", "align-items": "center", gap: "1.5rem" }}>
                  <span class={getStatusBadge(test.status)} style={{ "text-transform": "capitalize" }}>
                    {test.status}
                  </span>
                  <button style={{ 
                    background: "var(--bg-tertiary)", 
                    color: "var(--text-primary)", 
                    border: "1px solid var(--border-strong)",
                    "font-size": "13px",
                    padding: "0.4rem 1rem"
                  }}>
                    Details
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
