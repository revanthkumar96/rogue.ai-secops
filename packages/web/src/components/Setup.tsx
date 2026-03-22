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
    console.log("[Setup] Check Connection clicked")
    setChecking(true)
    try {
      console.log("[Setup] Testing agent connection...")
      const result = await api.testAgentConnection()
      console.log("[Setup] Connection result:", result)
      setConnected(result.connected)

      if (result.connected) {
        console.log("[Setup] Success! Moving to Step 2")
        setModels(["llama3.2:3b", "llama3.2:1b", "llama3:8b", "llama3:70b"])
        setStep(2)
      }
    } catch (error) {
      console.error("[Setup] Connection check failed:", error)
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
        background: "radial-gradient(circle at center, var(--bg-tertiary), var(--bg-primary))",
      }}
    >
      <div
        style={{
          width: "540px",
          padding: "3.5rem",
          background: "var(--surface)",
          "border-radius": "var(--radius-xl)",
          border: "1px solid var(--border)",
          "box-shadow": "var(--shadow-xl)",
          "backdrop-filter": "blur(12px)"
        }}
      >
        {/* Progress Indicator */}
        <div style={{ display: "flex", gap: "0.75rem", "margin-bottom": "3rem" }}>
          <div
            style={{
              flex: 1,
              height: "4px",
              background: step() >= 1 ? "var(--accent)" : "var(--border)",
              "border-radius": "4px",
              transition: "all 0.3s ease"
            }}
          />
          <div
            style={{
              flex: 1,
              height: "4px",
              background: step() >= 2 ? "var(--accent)" : "var(--border)",
              "border-radius": "4px",
              transition: "all 0.3s ease"
            }}
          />
          <div
            style={{
              flex: 1,
              height: "4px",
              background: step() >= 3 ? "var(--accent)" : "var(--border)",
              "border-radius": "4px",
              transition: "all 0.3s ease"
            }}
          />
        </div>

        {/* Step 1: Connection */}
        <Show when={step() === 1}>
          <div style={{ "text-align": "center", "margin-bottom": "2.5rem" }}>
            <h1 style={{ "margin-bottom": "0.75rem", "font-size": "2rem", "letter-spacing": "-0.04em" }}>Welcome to Rouge</h1>
            <p style={{ color: "var(--text-secondary)", "font-size": "15px", "line-height": "1.5" }}>
              Secure, automated DevOps starts here. <br/>First, let's verify your Ollama connectivity.
            </p>
          </div>

          <Show when={!connected()}>
            <div
              class="card"
              style={{ padding: "1.5rem", "margin-bottom": "2rem", background: "var(--bg-secondary)" }}
            >
              <h3 style={{ "margin-bottom": "1rem", "font-size": "0.875rem", "text-transform": "uppercase", "letter-spacing": "0.05em", color: "var(--text-tertiary)" }}>
                Requirements
              </h3>
              <ul style={{ "margin-left": "0", "list-style": "none", padding: 0, display: "flex", "flex-direction": "column", gap: "0.75rem" }}>
                <li style={{ "font-size": "14px", color: "var(--text-secondary)", display: "flex", "align-items": "center", gap: "0.5rem" }}>
                  <span style={{ color: "var(--accent)" }}>●</span> Ollama process must be active
                </li>
                <li style={{ "font-size": "14px", color: "var(--text-secondary)", display: "flex", "align-items": "center", gap: "0.5rem" }}>
                  <span style={{ color: "var(--accent)" }}>●</span> Base model (e.g., Llama 3) available
                </li>
              </ul>
            </div>
          </Show>

          <Show when={connected()}>
            <div
              class="card"
              style={{
                padding: "1.25rem",
                "margin-bottom": "2rem",
                background: "var(--success-soft)",
                border: "1px solid var(--success)",
                color: "var(--success)",
                "text-align": "center"
              }}
            >
              <h3 style={{ margin: 0, "font-size": "1rem", "font-weight": "600" }}>✓ Connection Established</h3>
            </div>
          </Show>

          <button
            onClick={checkConnection}
            disabled={checking()}
            style={{ width: "100%", padding: "0.875rem", "font-size": "15px", "font-weight": "600" }}
          >
            {checking() ? "Verifying..." : "Initialize Connection"}
          </button>
        </Show>

        {/* Step 2: Model Selection */}
        <Show when={step() === 2}>
          <div style={{ "text-align": "center", "margin-bottom": "2.5rem" }}>
            <h1 style={{ "margin-bottom": "0.75rem", "font-size": "2rem", "letter-spacing": "-0.04em" }}>Agent Brain</h1>
            <p style={{ color: "var(--text-secondary)", "font-size": "15px" }}>
              Choose the intelligence that will power your agents.
            </p>
          </div>

          <div style={{ "margin-bottom": "2.5rem" }}>
            <label
              style={{
                display: "block",
                "margin-bottom": "0.75rem",
                "font-size": "13px",
                "font-weight": "500",
                color: "var(--text-tertiary)",
                "text-transform": "uppercase",
                "letter-spacing": "0.05em"
              }}
            >
              Preferred Model
            </label>
            <select
              value={selectedModel()}
              onChange={(e) => setSelectedModel(e.currentTarget.value)}
              style={{ width: "100%", padding: "0.875rem", "border-radius": "var(--radius-md)", "font-size": "14px" }}
            >
              <For each={models()}>
                {(model) => <option value={model}>{model}</option>}
              </For>
            </select>
            <div
              style={{
                "margin-top": "1rem",
                padding: "1rem",
                background: "var(--bg-secondary)",
                "border-radius": "var(--radius-md)",
                "font-size": "12px",
                color: "var(--text-tertiary)",
                display: "flex",
                gap: "0.5rem"
              }}
            >
              <span>💡</span>
              <span><strong>Recommendation:</strong> llama3.2:3b offers the best balance of speed and reasoning for security tasks.</span>
            </div>
          </div>

          <button
            onClick={selectModel}
            disabled={configuring()}
            style={{ width: "100%", padding: "0.875rem", "font-weight": "600" }}
          >
            {configuring() ? "Applying Configuration..." : "Continue to Dashboard"}
          </button>
        </Show>

        {/* Step 3: Ready */}
        <Show when={step() === 3}>
          <div style={{ "text-align": "center", "margin-bottom": "2.5rem" }}>
            <div style={{ "font-size": "3rem", "margin-bottom": "1rem" }}>✨</div>
            <h1 style={{ "margin-bottom": "0.75rem", "font-size": "2rem", "letter-spacing": "-0.04em" }}>System Ready</h1>
            <p style={{ color: "var(--text-secondary)", "font-size": "15px" }}>
              Rouge is now fully operational and secured.
            </p>
          </div>

          <div
            class="card"
            style={{ padding: "1.5rem", "margin-bottom": "2.5rem", background: "var(--bg-secondary)" }}
          >
            <h3 style={{ "margin-bottom": "1.25rem", "font-size": "0.875rem", "text-transform": "uppercase", "letter-spacing": "0.05em", color: "var(--text-tertiary)" }}>
              Next Steps
            </h3>
            <ul style={{ "margin-left": "0", "list-style": "none", padding: 0, display: "flex", "flex-direction": "column", gap: "1rem" }}>
              <li style={{ "font-size": "13px", color: "var(--text-secondary)", display: "flex", "align-items": "start", gap: "0.75rem" }}>
                <span style={{ color: "var(--accent)" }}>01</span> 
                <span>Deploy your first <strong>Security Agent</strong> from the library.</span>
              </li>
              <li style={{ "font-size": "13px", color: "var(--text-secondary)", display: "flex", "align-items": "start", gap: "0.75rem" }}>
                <span style={{ color: "var(--accent)" }}>02</span> 
                <span>Link a project directory to enable <strong>Context Awareness</strong>.</span>
              </li>
              <li style={{ "font-size": "13px", color: "var(--text-secondary)", display: "flex", "align-items": "start", gap: "0.75rem" }}>
                <span style={{ color: "var(--accent)" }}>03</span> 
                <span>Try the CLI: <code>rouge run scan --local</code></span>
              </li>
            </ul>
          </div>

          <button onClick={complete} style={{ width: "100%", padding: "1rem", "font-weight": "700", background: "var(--accent)", color: "white" }}>
            Launch Platform
          </button>
        </Show>
      </div>
    </div>
  )
}
