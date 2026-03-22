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
    <div class="card">
      <h3 style={{ margin: 0, "margin-bottom": "0.5rem" }}>{props.name}</h3>
      <p style={{ color: "var(--text-secondary)", "margin-bottom": "1rem" }}>
        {props.description}
      </p>

      <div style={{ display: "flex", gap: "0.5rem", "margin-bottom": "1rem" }}>
        <input
          type="text"
          placeholder="Enter task..."
          value={task()}
          onInput={(e) => setTask(e.currentTarget.value)}
          style={{ flex: 1 }}
          disabled={executing()}
        />
        <button onClick={handleExecute} disabled={executing() || !task()}>
          {executing() ? "Running..." : "Execute"}
        </button>
      </div>

      <Show when={result()}>
        <div
          style={{
            padding: "1rem",
            background: "var(--bg-tertiary)",
            "border-radius": "6px",
            "white-space": "pre-wrap",
            "max-height": "200px",
            overflow: "auto",
          }}
        >
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
    <div class="container">
      <h1>Agents</h1>
      <p style={{ color: "var(--text-secondary)", "margin-bottom": "2rem" }}>
        Execute automation agents for DevOps tasks
      </p>

      <Show when={loading()}>
        <div class="card">Loading agents...</div>
      </Show>

      <Show when={!loading()}>
        <div style={{ display: "grid", gap: "1rem" }}>
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
