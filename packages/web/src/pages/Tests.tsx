import { Component, createSignal, For, Show, onMount } from "solid-js"
import { api, type TestRun } from "../lib/api"
import { SkeletonList } from "../components/Skeleton"

export const TestsPage: Component = () => {
  const [tests, setTests] = createSignal<TestRun[]>([])
  const [loading, setLoading] = createSignal(true)

  onMount(async () => {
    try {
      const response = await api.listTests()
      setTests(response.tests)
    } catch (e) {
      console.error("Failed to load tests:", e)
    } finally {
      setLoading(false)
    }
  })

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: "badge", running: "badge badge-warning", passed: "badge badge-success", failed: "badge badge-danger" }
    return map[status] || "badge"
  }

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <div style={{ "margin-bottom": "1.5rem" }}>
        <h1 style={{ "font-size": "1.5rem", margin: 0 }}>Tests</h1>
        <p style={{ color: "var(--text-tertiary)", "font-size": "13px", "margin-top": "0.25rem" }}>Automated test runs and results</p>
      </div>

      <Show when={loading()}>
        <SkeletonList count={3} />
      </Show>

      <Show when={!loading() && tests().length === 0}>
        <div class="card" style={{ "text-align": "center", padding: "3rem" }}>
          <div style={{ "font-size": "2rem", "margin-bottom": "0.75rem" }}>🧪</div>
          <div style={{ "font-weight": "600", "margin-bottom": "0.25rem" }}>No Test Runs</div>
          <div style={{ "font-size": "13px", color: "var(--text-tertiary)" }}>
            Ask the test agent to generate and run tests for your project.
          </div>
        </div>
      </Show>

      <Show when={!loading() && tests().length > 0}>
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
          <For each={tests()}>
            {(t) => (
              <div class="card" style={{ display: "flex", "justify-content": "space-between", "align-items": "center", padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", "align-items": "center", gap: "0.75rem", "min-width": 0 }}>
                  <span style={{ "font-size": "1.25rem" }}>{t.status === "failed" ? "❌" : t.status === "passed" ? "✅" : "⏳"}</span>
                  <div>
                    <div style={{ "font-weight": "600", "font-size": "14px" }}>{t.name}</div>
                    <div style={{ "font-size": "11px", color: "var(--text-tertiary)", "font-family": "var(--font-family-mono)" }}>{t.id.slice(0, 12)}</div>
                  </div>
                </div>
                <span class={statusBadge(t.status)} style={{ "text-transform": "capitalize" }}>{t.status}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
