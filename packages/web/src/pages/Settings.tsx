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
    <div class="container">
      <h1>Settings</h1>
      <p style={{ color: "var(--text-secondary)", "margin-bottom": "2rem" }}>
        Configure Rouge settings
      </p>

      <Show when={loading()}>
        <div class="card">Loading configuration...</div>
      </Show>

      <Show when={!loading() && config()}>
        <div style={{ display: "grid", gap: "2rem", "max-width": "600px" }}>
          {/* Ollama Settings */}
          <div class="card">
            <h2 style={{ "margin-bottom": "1rem" }}>Ollama</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", "margin-bottom": "0.25rem" }}>
                  URL
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
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", "margin-bottom": "0.25rem" }}>
                  Model
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
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", "margin-bottom": "0.25rem" }}>
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
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          {/* Agent Settings */}
          <div class="card">
            <h2 style={{ "margin-bottom": "1rem" }}>Agents</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", "margin-bottom": "0.25rem" }}>
                  Default Agent
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
                  style={{ width: "100%" }}
                >
                  <option value="test">test</option>
                  <option value="deploy">deploy</option>
                  <option value="monitor">monitor</option>
                  <option value="analyze">analyze</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", "margin-bottom": "0.25rem" }}>
                  Max Concurrent
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
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          {/* Workflow Settings */}
          <div class="card">
            <h2 style={{ "margin-bottom": "1rem" }}>Workflows</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
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
                  />
                  Enable Parallel Execution
                </label>
              </div>
              <div>
                <label style={{ display: "block", "margin-bottom": "0.25rem" }}>
                  Timeout (seconds)
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
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", "margin-bottom": "0.25rem" }}>
                  Retries
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
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div>
            <button onClick={handleSave} disabled={saving()} style={{ width: "100%" }}>
              {saving() ? "Saving..." : "Save Configuration"}
            </button>
            <Show when={message()}>
              <p
                style={{
                  "margin-top": "0.5rem",
                  color: message().startsWith("Error")
                    ? "var(--danger)"
                    : "var(--success)",
                }}
              >
                {message()}
              </p>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  )
}
