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
    <div class="container">
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "2rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Tests</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Manage and execute test suites
          </p>
        </div>
        <button onClick={() => api.executeTests({})}>Run All Tests</button>
      </div>

      <Show when={loading()}>
        <div class="card">Loading tests...</div>
      </Show>

      <Show when={!loading() && tests().length === 0}>
        <div class="card">
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            No test runs yet. Run your first test suite to get started.
          </p>
        </div>
      </Show>

      <Show when={!loading() && tests().length > 0}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <For each={tests()}>
            {(test) => (
              <div class="card">
                <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                  <div>
                    <h3 style={{ margin: 0, "margin-bottom": "0.25rem" }}>
                      {test.name}
                    </h3>
                    <p style={{ color: "var(--text-secondary)", "font-size": "12px", margin: 0 }}>
                      ID: {test.id}
                    </p>
                  </div>
                  <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
                    <span class={getStatusBadge(test.status)}>
                      {test.status}
                    </span>
                    <button>View Details</button>
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
