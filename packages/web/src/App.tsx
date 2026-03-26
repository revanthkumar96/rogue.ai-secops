import { createSignal, onMount, onCleanup, ParentComponent, Show } from "solid-js"
import { Header } from "./components/Header"
import { Sidebar } from "./components/Sidebar"
import { Setup } from "./components/Setup"
import { ToastContainer } from "./components/Toast"

export const App: ParentComponent = (props) => {
  const [connected, setConnected] = createSignal(false)
  const [setupComplete, setSetupComplete] = createSignal(false)
  const [checkingSetup, setCheckingSetup] = createSignal(true)
  const [sidebarOpen, setSidebarOpen] = createSignal(false)

  onMount(async () => {
    const timeout = setTimeout(() => setCheckingSetup(false), 5000)

    try {
      const healthResponse = await fetch("/api/health")
      setConnected(healthResponse.ok)

      if (healthResponse.ok) {
        try {
          const configResponse = await fetch("/api/config")
          const config = await configResponse.json()
          if (config.ollama?.model) setSetupComplete(true)
        } catch { setSetupComplete(false) }
      }
    } catch { setConnected(false) }
    finally {
      clearTimeout(timeout)
      setCheckingSetup(false)
    }

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch("/api/health")
        setConnected(response.ok)
      } catch { setConnected(false) }
    }, 30000)

    onCleanup(() => clearInterval(intervalId))
  })

  return (
    <Show
      when={!checkingSetup()}
      fallback={
        <div style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          height: "100vh",
          background: "var(--bg-primary)",
          "flex-direction": "column",
          gap: "1rem",
        }}>
          <div style={{ "font-size": "2rem", animation: "pulse 1.5s ease-in-out infinite" }}>✨</div>
          <div style={{ color: "var(--text-tertiary)", "font-size": "14px" }}>Loading Rouge.ai...</div>
        </div>
      }
    >
      <Show
        when={setupComplete()}
        fallback={<Setup onComplete={() => setSetupComplete(true)} />}
      >
        <div style={{
          display: "flex",
          "flex-direction": "column",
          height: "100vh",
          width: "100%",
          background: "var(--bg-primary)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Ambient background */}
          <div class="ambient-bg" />

          <ToastContainer />
          <Header
            connected={connected()}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen())}
          />
          <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative", "z-index": 1 }}>
            <Sidebar open={sidebarOpen()} onClose={() => setSidebarOpen(false)} />
            <main style={{ flex: 1, overflow: "auto" }}>
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
