import { Component, createSignal, Show, For } from "solid-js"
import { api } from "../lib/api"

interface SetupProps {
  onComplete: () => void
}

export const Setup: Component<SetupProps> = (props) => {
  const [step, setStep] = createSignal(1)
  const [checking, setChecking] = createSignal(false)
  const [connected, setConnected] = createSignal(false)
  const [models, setModels] = createSignal<string[]>([])
  const [selectedModel, setSelectedModel] = createSignal("llama3.2:3b")
  const [configuring, setConfiguring] = createSignal(false)

  const checkConnection = async () => {
    setChecking(true)
    try {
      const result = await api.testAgentConnection()
      setConnected(result.connected)

      if (result.connected) {
        // Try to fetch models (this endpoint doesn't exist yet, but we'll show default)
        setModels(["llama3.2:3b", "llama3.2:1b", "llama3:8b", "llama3:70b"])
        setStep(2)
      }
    } catch (error) {
      setConnected(false)
    } finally {
      setChecking(false)
    }
  }

  const selectModel = async () => {
    setConfiguring(true)
    try {
      await api.updateConfig({
        ollama: {
          model: selectedModel(),
          url: "http://localhost:11434",
          timeout: 30000,
        },
      })
      setStep(3)
    } catch (error) {
      console.error("Failed to update config:", error)
    } finally {
      setConfiguring(false)
    }
  }

  const complete = () => {
    props.onComplete()
  }

  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        height: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      <div
        style={{
          width: "600px",
          padding: "3rem",
          background: "var(--bg-secondary)",
          "border-radius": "12px",
          border: "1px solid var(--border)",
        }}
      >
        {/* Progress Indicator */}
        <div style={{ display: "flex", gap: "1rem", "margin-bottom": "2rem" }}>
          <div
            style={{
              flex: 1,
              height: "4px",
              background: step() >= 1 ? "var(--accent)" : "var(--border)",
              "border-radius": "2px",
            }}
          />
          <div
            style={{
              flex: 1,
              height: "4px",
              background: step() >= 2 ? "var(--accent)" : "var(--border)",
              "border-radius": "2px",
            }}
          />
          <div
            style={{
              flex: 1,
              height: "4px",
              background: step() >= 3 ? "var(--accent)" : "var(--border)",
              "border-radius": "2px",
            }}
          />
        </div>

        {/* Step 1: Connection */}
        <Show when={step() === 1}>
          <h1 style={{ "margin-bottom": "1rem" }}>Welcome to Rouge! 👋</h1>
          <p style={{ color: "var(--text-secondary)", "margin-bottom": "2rem" }}>
            Let's get you set up. First, we need to check your Ollama connection.
          </p>

          <Show when={!connected()}>
            <div
              class="card"
              style={{ padding: "1.5rem", "margin-bottom": "1.5rem" }}
            >
              <h3 style={{ "margin-bottom": "0.5rem" }}>Prerequisites</h3>
              <ul style={{ "margin-left": "1.5rem", color: "var(--text-secondary)" }}>
                <li>Ollama must be running (ollama serve)</li>
                <li>At least one model pulled (ollama pull llama3.2:3b)</li>
              </ul>
            </div>
          </Show>

          <Show when={connected()}>
            <div
              class="card"
              style={{
                padding: "1.5rem",
                "margin-bottom": "1.5rem",
                background: "var(--success)",
                color: "white",
              }}
            >
              <h3 style={{ margin: 0 }}>✓ Connected to Ollama!</h3>
            </div>
          </Show>

          <button
            onClick={checkConnection}
            disabled={checking()}
            style={{ width: "100%" }}
          >
            {checking() ? "Checking..." : "Check Connection"}
          </button>
        </Show>

        {/* Step 2: Model Selection */}
        <Show when={step() === 2}>
          <h1 style={{ "margin-bottom": "1rem" }}>Select Model 🤖</h1>
          <p style={{ color: "var(--text-secondary)", "margin-bottom": "2rem" }}>
            Choose an Ollama model for Rouge to use.
          </p>

          <div style={{ "margin-bottom": "2rem" }}>
            <label
              style={{
                display: "block",
                "margin-bottom": "0.5rem",
                color: "var(--text-secondary)",
              }}
            >
              Model
            </label>
            <select
              value={selectedModel()}
              onChange={(e) => setSelectedModel(e.currentTarget.value)}
              style={{ width: "100%", padding: "0.75rem" }}
            >
              <For each={models()}>
                {(model) => <option value={model}>{model}</option>}
              </For>
            </select>
            <p
              style={{
                "margin-top": "0.5rem",
                "font-size": "12px",
                color: "var(--text-secondary)",
              }}
            >
              Recommended: llama3.2:3b for fast responses
            </p>
          </div>

          <button
            onClick={selectModel}
            disabled={configuring()}
            style={{ width: "100%" }}
          >
            {configuring() ? "Configuring..." : "Continue"}
          </button>
        </Show>

        {/* Step 3: Ready */}
        <Show when={step() === 3}>
          <h1 style={{ "margin-bottom": "1rem" }}>All Set! 🎉</h1>
          <p style={{ color: "var(--text-secondary)", "margin-bottom": "2rem" }}>
            Rouge is configured and ready to use.
          </p>

          <div
            class="card"
            style={{ padding: "1.5rem", "margin-bottom": "2rem" }}
          >
            <h3 style={{ "margin-bottom": "1rem" }}>Quick Tips</h3>
            <ul style={{ "margin-left": "1.5rem", color: "var(--text-secondary)" }}>
              <li>Navigate to Agents to execute automation tasks</li>
              <li>Create Workflows for multi-step automation</li>
              <li>Configure settings anytime in Settings</li>
              <li>
                Use CLI: <code>rouge agent run test "your task"</code>
              </li>
            </ul>
          </div>

          <button onClick={complete} style={{ width: "100%" }}>
            Start Using Rouge
          </button>
        </Show>
      </div>
    </div>
  )
}
