import { Component, createSignal, onMount, ParentComponent, Show } from "solid-js"
import { Header } from "./components/Header"
import { Sidebar } from "./components/Sidebar"
import { Setup } from "./components/Setup"

export const App: ParentComponent = (props) => {
  const [connected, setConnected] = createSignal(false)
  const [setupComplete, setSetupComplete] = createSignal(false)
  const [checkingSetup, setCheckingSetup] = createSignal(true)

  onMount(async () => {
    // Check if setup is needed
    try {
      const healthResponse = await fetch("/api/health")
      setConnected(healthResponse.ok)

      if (healthResponse.ok) {
        // Check if Ollama is configured
        try {
          const configResponse = await fetch("/api/config")
          const config = await configResponse.json()

          // Check if we have a valid config
          if (config.ollama?.model) {
            setSetupComplete(true)
          }
        } catch {
          setSetupComplete(false)
        }
      }
    } catch {
      setConnected(false)
    } finally {
      setCheckingSetup(false)
    }

    // Check connection every 30 seconds
    setInterval(async () => {
      try {
        const response = await fetch("/api/health")
        setConnected(response.ok)
      } catch {
        setConnected(false)
      }
    }, 30000)
  })

  const handleSetupComplete = () => {
    setSetupComplete(true)
  }

  // Show loading during initial check
  if (checkingSetup()) {
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
        <div style={{ "text-align": "center" }}>
          <h2>Loading Rouge...</h2>
        </div>
      </div>
    )
  }

  // Show setup if not complete
  if (!setupComplete()) {
    return <Setup onComplete={handleSetupComplete} />
  }

  // Show main app
  return (
    <div style={{ display: "flex", "flex-direction": "column", height: "100vh" }}>
      <Header connected={connected()} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: "auto" }}>
          {props.children}
        </main>
      </div>
    </div>
  )
}
