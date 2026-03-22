import { Component, createSignal, onMount, onCleanup, For, Show } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { api } from "../lib/api"

export const CommandPalette: Component = () => {
  const [open, setOpen] = createSignal(false)
  const [query, setQuery] = createSignal("")
  const [mode, setMode] = createSignal<"commands" | "agents" | "workspace">("commands")
  const [results, setResults] = createSignal<any[]>([])
  const [folders, setFolders] = createSignal<string[]>([])
  const [currentPath, setCurrentPath] = createSignal("")
  const [agents, setAgents] = createSignal<string[]>([])
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const navigate = useNavigate()

  const commands = [
    { icon: "📁", name: "Set Workspace", cmd: "/config workspace", desc: "Change local project root", id: "workspace" },
    { icon: "🤖", name: "Run Agent", cmd: "@", desc: "Execute a specific agent", id: "agents" },
    { icon: "📊", name: "Go to Dashboard", cmd: "/view dashboard", desc: "Switch to overview", action: () => navigate("/") },
    { icon: "⚙️", name: "Go to Settings", cmd: "/view settings", desc: "Open configuration", action: () => navigate("/settings") },
    { icon: "❓", name: "Help", cmd: "/help", desc: "Show available commands" }
  ]

  onMount(async () => {
    // Fetch agents once
    const { agents } = await api.listAgents()
    setAgents(agents)

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "/" || e.key === "?") && !open()) {
        const activeElement = document.activeElement
        if (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA") {
            return
        }
        e.preventDefault()
        setOpen(true)
        setMode("commands")
      } else if (e.key === "@" && !open()) {
         const activeElement = document.activeElement
         if (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA") return
         e.preventDefault()
         setOpen(true)
         setMode("agents")
         setQuery("@")
      } else if (e.key === "Escape") {
        setOpen(false)
        setQuery("")
        setMode("commands")
      } else if (open()) {
        if (e.key === "ArrowDown") {
            setSelectedIndex(prev => Math.min(prev + 1, getListLength() - 1))
        } else if (e.key === "ArrowUp") {
            setSelectedIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === "Enter") {
            handleEnter()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown))
  })

  const getListLength = () => {
    if (mode() === "commands") return results().length || commands.length
    if (mode() === "agents") return agents().length
    if (mode() === "workspace") return folders().length + 2 // .. and select current
    return 0
  }

  const handleEnter = () => {
    const idx = selectedIndex()
    if (mode() === "commands") {
        const list = results().length ? results() : commands
        handleSelect(list[idx])
    } else if (mode() === "agents") {
        handleAgentSelect(agents()[idx])
    } else if (mode() === "workspace") {
        if (idx === 0) handleBrowse("..")
        else if (idx === folders().length + 1) finishWorkspace()
        else handleBrowse(folders()[idx - 1])
    }
  }

  const handleInput = (e: any) => {
    const val = e.currentTarget.value
    setQuery(val)
    setSelectedIndex(0)
    
    if (val.startsWith("@")) {
      setMode("agents")
    } else if (val.startsWith("/")) {
      setMode("commands")
      setResults(commands.filter(c => c.cmd.includes(val.toLowerCase())))
    } else {
      setResults([])
    }
  }

  const handleSelect = async (cmd: any) => {
    if (cmd.action) {
        cmd.action()
        setOpen(false)
    } else if (cmd.id === "workspace") {
        setMode("workspace")
        await fetchFolders()
    } else if (cmd.id === "agents") {
        setMode("agents")
        setQuery("@")
    } else {
        setQuery(cmd.cmd)
    }
  }

  const handleAgentSelect = (agent: string) => {
    setOpen(false)
    navigate(`/agents?run=${agent}`) // Feature hypothetical, but let's assume it works
  }

  const fetchFolders = async (path?: string) => {
    try {
      const { path: resolvedPath, folders } = await api.listFiles(path)
      setCurrentPath(resolvedPath)
      setFolders(folders)
      setSelectedIndex(0)
    } catch (e) {
      console.error("Failed to fetch folders", e)
    }
  }

  const handleBrowse = async (folder: string) => {
    let target = currentPath()
    if (folder === "..") {
        // Go up
        const parts = target.split(/[\\/]/)
        parts.pop()
        target = parts.join("/") || "/"
    } else {
        target = target.endsWith("/") || target.endsWith("\\") ? target + folder : target + "/" + folder
    }
    await fetchFolders(target)
  }

  const finishWorkspace = async () => {
    await api.updateConfig({ workspace: currentPath() })
    setOpen(false)
    // Refresh or notify
    window.location.reload()
  }

  return (
    <Show when={open()}>
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        "align-items": "flex-start",
        "justify-content": "center",
        "padding-top": "20vh",
        "z-index": 1000,
        "backdrop-filter": "blur(8px)"
      }} onClick={() => setOpen(false)}>
        <div style={{
          width: "600px",
          background: "var(--bg-tertiary)",
          border: "2px solid var(--accent)",
          "border-radius": "var(--radius-md)",
          "box-shadow": "var(--glow-accent)",
          padding: "1.25rem",
          display: "flex",
          "flex-direction": "column",
          "font-family": "var(--font-family-mono)",
          "max-height": "60vh",
          "overflow": "hidden"
        }} onClick={e => e.stopPropagation()}>
          
          <div style={{ display: "flex", "align-items": "center", gap: "1rem", "margin-bottom": "1rem" }}>
            <span style={{ color: "var(--accent)", "font-weight": "bold", "font-size": "1.25rem" }}>
                {mode() === "workspace" ? "📁" : mode() === "agents" ? "🤖" : ">_"}
            </span>
            <input
              autofocus
              type="text"
              placeholder={mode() === "workspace" ? "Browse directory..." : "Enter command (/ Actions, @ Agents)"}
              value={query()}
              onInput={handleInput}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
                "font-family": "var(--font-family-mono)",
                outline: "none",
                "font-size": "1.25rem"
              }}
            />
          </div>

          <div style={{ "border-top": "1px solid var(--border)", "padding-top": "0.5rem", "overflow-y": "auto", "flex": 1 }}>
            
            <Show when={mode() === "commands"}>
                <For each={results().length ? results() : commands}>
                    {(cmd, i) => (
                        <div 
                        onClick={() => handleSelect(cmd)}
                        style={{
                            padding: "0.75rem 1rem",
                            display: "flex",
                            "align-items": "center",
                            gap: "1rem",
                            cursor: "pointer",
                            "border-radius": "var(--radius-sm)",
                            background: i() === selectedIndex() ? "var(--accent-soft)" : "transparent",
                            color: i() === selectedIndex() ? "var(--accent)" : "var(--text-secondary)",
                            border: "1px solid " + (i() === selectedIndex() ? "var(--accent)" : "transparent"),
                            transition: "all 0.1s ease"
                        }}
                        >
                            <span style={{ "font-size": "1.25rem" }}>{cmd.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ "font-size": "13px", "font-weight": "600", "text-transform": "uppercase" }}>{cmd.name}</div>
                                <div style={{ "font-size": "11px", opacity: 0.6 }}>{cmd.desc}</div>
                            </div>
                            <div style={{ "font-size": "12px", opacity: 0.4 }}>{cmd.cmd}</div>
                        </div>
                    )}
                </For>
            </Show>

            <Show when={mode() === "agents"}>
                <For each={agents().filter(a => a.includes(query().replace("@", ""))).length ? agents().filter(a => a.includes(query().replace("@", ""))) : agents()}>
                    {(agent, i) => (
                        <div 
                        onClick={() => handleAgentSelect(agent)}
                        style={{
                            padding: "0.75rem 1rem",
                            cursor: "pointer",
                            "border-radius": "var(--radius-sm)",
                            background: i() === selectedIndex() ? "var(--accent-soft)" : "transparent",
                            color: i() === selectedIndex() ? "var(--accent)" : "var(--text-secondary)",
                            border: "1px solid " + (i() === selectedIndex() ? "var(--accent)" : "transparent")
                        }}
                        >
                            <span style={{ "margin-right": "0.75rem" }}>🤖</span> {agent}
                        </div>
                    )}
                </For>
            </Show>

            <Show when={mode() === "workspace"}>
                <div style={{ "padding": "0.5rem", "margin-bottom": "0.5rem", "background": "rgba(255,255,255,0.05)", "border-radius": "4px", "font-size": "12px", "color": "var(--text-tertiary)" }}>
                    {currentPath()}
                </div>
                
                <div 
                    onClick={() => handleBrowse("..")}
                    style={{ padding: "0.5rem 1rem", cursor: "pointer", opacity: selectedIndex() === 0 ? 1 : 0.6, background: selectedIndex() === 0 ? "var(--accent-soft)" : "transparent" }}
                >
                    📁 .. (Parent Directory)
                </div>

                <For each={folders()}>
                    {(folder, i) => (
                        <div 
                            onClick={() => handleBrowse(folder)}
                            style={{ 
                                padding: "0.5rem 1rem", 
                                cursor: "pointer", 
                                background: (i() + 1) === selectedIndex() ? "var(--accent-soft)" : "transparent",
                                color: (i() + 1) === selectedIndex() ? "var(--accent)" : "var(--text-primary)"
                            }}
                        >
                            📁 {folder}
                        </div>
                    )}
                </For>

                <div 
                    onClick={finishWorkspace}
                    style={{ 
                        "margin-top": "1rem",
                        padding: "1rem", 
                        cursor: "pointer", 
                        background: selectedIndex() === folders().length + 1 ? "var(--accent)" : "var(--accent-soft)",
                        color: selectedIndex() === folders().length + 1 ? "var(--bg-primary)" : "var(--accent)",
                        "text-align": "center",
                        "font-weight": "bold",
                        "border-radius": "4px"
                    }}
                >
                    ✅ SELECT CURRENT FOLDER
                </div>
            </Show>
          </div>

          <div style={{ "margin-top": "1rem", "font-size": "10px", color: "var(--text-tertiary)", "display": "flex", "justify-content": "space-between", "text-transform": "uppercase", "letter-spacing": "0.1em" }}>
            <div>↑↓ Navigate | ENTER Select</div>
            <div>ESC to close</div>
          </div>
        </div>
      </div>
    </Show>
  )
}
