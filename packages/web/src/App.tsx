import { createSignal, onMount, ParentComponent, Show } from "solid-js"
import { Header } from "./components/Header"
import { Sidebar } from "./components/Sidebar"
import { Setup } from "./components/Setup"

export const App: ParentComponent = (props) => {
  const [connected, setConnected] = createSignal(false)
  const [setupComplete, setSetupComplete] = createSignal(false)
  const [checkingSetup, setCheckingSetup] = createSignal(true)

  onMount(async () => {
    console.log("[App] Starting initial setup check...")
    
    // Safety timeout to ensure we don't stay in loading state forever
    const timeout = setTimeout(() => {
      console.warn("[App] Setup check timed out!")
      setCheckingSetup(false)
    }, 5000)

    // Check if setup is needed
    try {
      console.log("[App] Fetching /api/health...")
      const healthResponse = await fetch("/api/health")
      console.log("[App] Health response:", healthResponse.status)
      setConnected(healthResponse.ok)

      if (healthResponse.ok) {
        // Check if Ollama is configured
        try {
          console.log("[App] Fetching /api/config...")
          const configResponse = await fetch("/api/config")
          const config = await configResponse.json()
          console.log("[App] Config received:", config)

          // Check if we have a valid config
          if (config.ollama?.model) {
            setSetupComplete(true)
          }
        } catch (e) {
          console.error("[App] Config check failed:", e)
          setSetupComplete(false)
        }
      }
    } catch (e) {
      console.error("[App] Health check failed:", e)
      setConnected(false)
    } finally {
      clearTimeout(timeout)
      console.log("[App] Setup check complete.")
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

  // Show main app
  return (
    <Show
      when={!checkingSetup()}
      fallback={
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
      }
    >
      <Show
        when={setupComplete()}
        fallback={<Setup onComplete={handleSetupComplete} />}
      >
        <div style={{ 
          display: "flex", 
          "flex-direction": "column", 
          height: "100vh",
          background: "radial-gradient(circle at top right, var(--bg-secondary), var(--bg-primary))"
        }}>
          <Header connected={connected()} />
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <Sidebar />
            <main style={{ 
              flex: 1, 
              overflow: "auto",
              padding: "0" 
            }}>
              <div class="container">
                {props.children}
              </div>
            </main>
          </div>
        </div>
      </Show>
    </Show>
  )
}
