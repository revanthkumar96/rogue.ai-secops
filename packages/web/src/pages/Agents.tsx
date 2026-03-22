import { Component, createSignal, For, Show, onMount } from "solid-js"
import { api } from "../lib/api"

interface AgentCardProps {
  name: string
  description: string
}

const AgentCard: Component<AgentCardProps> = (props) => {
  const [executing, setExecuting] = createSignal(false)
  const [task, setTask] = createSignal("")
  const [result, setResult] = createSignal("")

  const handleExecute = async () => {
    if (!task()) return

    setExecuting(true)
    setResult("")

    try {
      const response = await api.executeAgent({
        type: props.name,
        task: task(),
        stream: false,
      })

      setResult(response.output)
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div class="card" style={{ display: "flex", "flex-direction": "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-start" }}>
        <div>
          <h3 style={{ margin: 0, "font-size": "1.125rem", "letter-spacing": "-0.02em" }}>{props.name}</h3>
          <p style={{ color: "var(--text-tertiary)", "font-size": "13px", "margin-top": "0.25rem" }}>
            {props.description}
          </p>
        </div>
        <div style={{ 
          width: "32px", 
          height: "32px", 
          "border-radius": "var(--radius-md)", 
          background: "var(--bg-tertiary)",
          display: "flex", "align-items": "center", "justify-content": "center", "font-size": "1rem"
        }}>
          🤖
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="What should this agent do?"
          value={task()}
          onInput={(e) => setTask(e.currentTarget.value)}
          style={{ flex: 1, "font-size": "13px" }}
          disabled={executing()}
        />
        <button 
          onClick={handleExecute} 
          disabled={executing() || !task()}
          style={{ "white-space": "nowrap", "font-size": "13px", padding: "0 1.25rem" }}
        >
          {executing() ? "Running..." : "Run"}
        </button>
      </div>

      <Show when={result()}>
        <div
          style={{
            padding: "1rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            "border-radius": "var(--radius-md)",
            "white-space": "pre-wrap",
            "max-height": "250px",
            overflow: "auto",
            "font-family": "var(--font-family-mono)",
            "font-size": "12px",
            color: "var(--text-secondary)"
          }}
        >
          <div style={{ "margin-bottom": "0.5rem", color: "var(--text-tertiary)", "font-size": "10px", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>
            Execution Result
          </div>
          {result()}
        </div>
      </Show>
    </div>
  )
}

export const AgentsPage: Component = () => {
  const [agents, setAgents] = createSignal<string[]>([])
  const [loading, setLoading] = createSignal(true)

  const loadAgents = async () => {
    try {
      const response = await api.listAgents()
      setAgents(response.agents)
    } catch (error) {
      console.error("Failed to load agents:", error)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    loadAgents()
  })

  const getAgentDescription = (name: string): string => {
    const descriptions: Record<string, string> = {
      test: "Test generation and execution",
      deploy: "Deployment automation",
      monitor: "System monitoring and alerting",
      analyze: "Log and error analysis",
      "ci-cd": "CI/CD pipeline automation",
      security: "Security scanning and compliance",
      performance: "Performance and load testing",
      infrastructure: "Infrastructure-as-Code management",
      incident: "Incident response and troubleshooting",
      database: "Database operations and optimization",
    }
    return descriptions[name] || "DevOps automation agent"
  }

  return (
    <div style={{ padding: "2rem 0" }}>
      <div style={{ "margin-bottom": "2.5rem" }}>
        <h1 style={{ "font-size": "2rem", margin: 0, "letter-spacing": "-0.04em" }}>Agents</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0 0" }}>
          Execute and manage specialized DevOps automation agents.
        </p>
      </div>

      <Show when={loading()}>
        <div class="card" style={{ "text-align": "center", padding: "3rem" }}>
          <div style={{ color: "var(--text-tertiary)" }}>Loading agent registry...</div>
        </div>
      </Show>

      <Show when={!loading()}>
        <div style={{ 
          display: "grid", 
          "grid-template-columns": "repeat(auto-fit, minmax(380px, 1fr))", 
          gap: "1.25rem" 
        }}>
          <For each={agents()}>
            {(agent) => (
              <AgentCard name={agent} description={getAgentDescription(agent)} />
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
