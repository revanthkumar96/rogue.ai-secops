import { Component, createSignal, Show } from "solid-js"
import { api, type Config } from "../lib/api"

export const SettingsPage: Component = () => {
  const [config, setConfig] = createSignal<Config | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [saving, setSaving] = createSignal(false)
  const [message, setMessage] = createSignal("")

  const loadConfig = async () => {
    try {
      const data = await api.getConfig()
      setConfig(data)
    } catch (error) {
      console.error("Failed to load config:", error)
    } finally {
      setLoading(false)
    }
  }

  loadConfig()

  const handleSave = async () => {
    if (!config()) return

    setSaving(true)
    setMessage("")

    try {
      await api.updateConfig(config()!)
      setMessage("Configuration saved successfully")
      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: "2rem 0" }}>
      <div style={{ "margin-bottom": "2.5rem" }}>
        <h1 style={{ "font-size": "2rem", margin: 0, "letter-spacing": "-0.04em" }}>Settings</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0 0" }}>
          Configure your DevOps environment and agent preferences.
        </p>
      </div>

      <Show when={loading()}>
        <div class="card" style={{ "text-align": "center", padding: "3rem" }}>
          <div style={{ color: "var(--text-tertiary)" }}>Loading configuration...</div>
        </div>
      </Show>

      <Show when={!loading() && config()}>
        <div style={{ display: "grid", gap: "1.5rem", "max-width": "800px" }}>
          {/* Ollama Settings */}
          <div class="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", "align-items": "center", gap: "0.75rem", "margin-bottom": "1.5rem" }}>
              <span style={{ "font-size": "1.25rem" }}>🤖</span>
              <h2 style={{ margin: 0, "font-size": "1.125rem" }}>Ollama Configuration</h2>
            </div>
            <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "1.25rem" }}>
              <div style={{ "grid-column": "span 2" }}>
                <label style={{ display: "block", "margin-bottom": "0.5rem", "font-size": "13px", color: "var(--text-tertiary)" }}>
                  Server URL
                </label>
                <input
                  type="text"
                  value={config()!.ollama.url}
                  onInput={(e) =>
                    setConfig({
                      ...config()!,
                      ollama: {
                        ...config()!.ollama,
                        url: e.currentTarget.value,
                      },
                    })
                  }
                  style={{ width: "100%", "font-family": "var(--font-family-mono)", "font-size": "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", "margin-bottom": "0.5rem", "font-size": "13px", color: "var(--text-tertiary)" }}>
                  Active Model
                </label>
                <input
                  type="text"
                  value={config()!.ollama.model}
                  onInput={(e) =>
                    setConfig({
                      ...config()!,
                      ollama: {
                        ...config()!.ollama,
                        model: e.currentTarget.value,
                      },
                    })
                  }
                  style={{ width: "100%", "font-size": "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", "margin-bottom": "0.5rem", "font-size": "13px", color: "var(--text-tertiary)" }}>
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={config()!.ollama.timeout}
                  onInput={(e) =>
                    setConfig({
                      ...config()!,
                      ollama: {
                        ...config()!.ollama,
                        timeout: parseInt(e.currentTarget.value),
                      },
                    })
                  }
                  style={{ width: "100%", "font-size": "13px" }}
                />
              </div>
            </div>
          </div>

          {/* Agent Settings */}
          <div class="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", "align-items": "center", gap: "0.75rem", "margin-bottom": "1.5rem" }}>
              <span style={{ "font-size": "1.25rem" }}>🛠️</span>
              <h2 style={{ margin: 0, "font-size": "1.125rem" }}>Agent Orchestration</h2>
            </div>
            <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", "margin-bottom": "0.5rem", "font-size": "13px", color: "var(--text-tertiary)" }}>
                  Default Agent Type
                </label>
                <select
                  value={config()!.agents.default}
                  onChange={(e) =>
                    setConfig({
                      ...config()!,
                      agents: {
                        ...config()!.agents,
                        default: e.currentTarget.value,
                      },
                    })
                  }
                  style={{ width: "100%", "font-size": "13px" }}
                >
                  <option value="test">test</option>
                  <option value="deploy">deploy</option>
                  <option value="monitor">monitor</option>
                  <option value="analyze">analyze</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", "margin-bottom": "0.5rem", "font-size": "13px", color: "var(--text-tertiary)" }}>
                  Max Concurrent Agents
                </label>
                <input
                  type="number"
                  value={config()!.agents.maxConcurrent}
                  onInput={(e) =>
                    setConfig({
                      ...config()!,
                      agents: {
                        ...config()!.agents,
                        maxConcurrent: parseInt(e.currentTarget.value),
                      },
                    })
                  }
                  style={{ width: "100%", "font-size": "13px" }}
                />
              </div>
            </div>
          </div>

          {/* Workflow Settings */}
          <div class="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", "align-items": "center", gap: "0.75rem", "margin-bottom": "1.5rem" }}>
              <span style={{ "font-size": "1.25rem" }}>📋</span>
              <h2 style={{ margin: 0, "font-size": "1.125rem" }}>Execution Engine</h2>
            </div>
            <div style={{ display: "grid", gap: "1.25rem" }}>
              <div style={{ 
                padding: "0.75rem 1rem", 
                background: "var(--bg-secondary)", 
                "border-radius": "var(--radius-md)",
                border: "1px solid var(--border)",
                display: "flex", 
                "align-items": "center", 
                gap: "0.75rem" 
              }}>
                <input
                  type="checkbox"
                  checked={config()!.workflows.parallel}
                  onChange={(e) =>
                    setConfig({
                      ...config()!,
                      workflows: {
                        ...config()!.workflows,
                        parallel: e.currentTarget.checked,
                      },
                    })
                  }
                  style={{ width: "16px", height: "16px" }}
                />
                <span style={{ "font-size": "14px", "font-weight": "500" }}>Enable Parallel Execution</span>
              </div>
              <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", "margin-bottom": "0.5rem", "font-size": "13px", color: "var(--text-tertiary)" }}>
                    Step Timeout (sec)
                  </label>
                  <input
                    type="number"
                    value={config()!.workflows.timeout}
                    onInput={(e) =>
                      setConfig({
                        ...config()!,
                        workflows: {
                          ...config()!.workflows,
                          timeout: parseInt(e.currentTarget.value),
                        },
                      })
                    }
                    style={{ width: "100%", "font-size": "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", "margin-bottom": "0.5rem", "font-size": "13px", color: "var(--text-tertiary)" }}>
                    Max Retries
                  </label>
                  <input
                    type="number"
                    value={config()!.workflows.retries}
                    onInput={(e) =>
                      setConfig({
                        ...config()!,
                        workflows: {
                          ...config()!.workflows,
                          retries: parseInt(e.currentTarget.value),
                        },
                      })
                    }
                    style={{ width: "100%", "font-size": "13px" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: "flex", "align-items": "center", gap: "1.5rem", "margin-top": "1rem" }}>
            <button 
              onClick={handleSave} 
              disabled={saving()} 
              style={{ padding: "0.75rem 2rem", "font-weight": "600", "min-width": "200px" }}
            >
              {saving() ? "Saving..." : "Save Configuration"}
            </button>
            <Show when={message()}>
              <span
                style={{
                  "font-size": "14px",
                  "font-weight": "500",
                  color: message().startsWith("Error")
                    ? "var(--danger)"
                    : "var(--success)",
                }}
              >
                {message()}
              </span>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  )
}
