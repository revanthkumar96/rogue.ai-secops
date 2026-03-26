import { Component } from "solid-js"
import { A, useLocation } from "@solidjs/router"

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export const Sidebar: Component<SidebarProps> = (props) => {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const linkStyle = (active: boolean): Record<string, string> => ({
    display: "flex",
    "align-items": "center",
    gap: "0.75rem",
    padding: "0.6rem 0.75rem",
    "border-radius": "var(--radius-md)",
    color: active ? "var(--accent)" : "var(--text-secondary)",
    "text-decoration": "none",
    background: active ? "var(--accent-soft)" : "transparent",
    "font-size": "13px",
    "font-weight": active ? "600" : "500",
    transition: "all 0.15s ease",
    border: active ? "1px solid rgba(102,126,234,0.3)" : "1px solid transparent",
  })

  const link = (path: string, icon: string, label: string) => (
    <li>
      <A href={path} style={linkStyle(isActive(path))} onClick={() => props.onClose()}>
        <span style={{ "font-size": "1rem", width: "20px", "text-align": "center" }}>{icon}</span>
        {label}
      </A>
    </li>
  )

  return (
    <>
      {/* Overlay for mobile */}
      <div
        class="sidebar-overlay"
        style={{
          display: props.open ? "block" : "none",
          position: "fixed",
          inset: "0",
          background: "rgba(0,0,0,0.6)",
          "z-index": 199,
        }}
        onClick={() => props.onClose()}
      />

      <aside
        class={`sidebar ${props.open ? "open" : ""}`}
        style={{
          width: "var(--sidebar-width)",
          background: "var(--bg-secondary)",
          "border-right": "1px solid var(--border)",
          display: "flex",
          "flex-direction": "column",
          "flex-shrink": 0,
          overflow: "hidden",
        }}
      >
        {/* Brand */}
        <div style={{ padding: "1.25rem 1rem 1rem" }}>
          <div style={{
            display: "flex",
            "align-items": "center",
            gap: "0.5rem",
            "font-size": "1.1rem",
            "font-weight": "800",
          }}>
            <span>✨</span>
            <span style={{
              background: "var(--brand-gradient)",
              "-webkit-background-clip": "text",
              "-webkit-text-fill-color": "transparent",
            }}>Rouge.ai</span>
          </div>
          <div style={{ "font-size": "10px", color: "var(--text-tertiary)", "margin-top": "2px", "letter-spacing": "0.05em" }}>
            The Fairy Tail
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 0.5rem", "overflow-y": "auto" }}>
          <ul style={{ "list-style": "none", display: "flex", "flex-direction": "column", gap: "2px" }}>
            {link("/", "📊", "Dashboard")}
            {link("/agents", "🤖", "Agents")}
            {link("/workflows", "📋", "Workflows")}
          </ul>

          <div style={{ "font-size": "10px", color: "var(--text-tertiary)", padding: "1rem 0.75rem 0.5rem", "letter-spacing": "0.08em", "text-transform": "uppercase" }}>
            Operations
          </div>

          <ul style={{ "list-style": "none", display: "flex", "flex-direction": "column", gap: "2px" }}>
            {link("/tests", "🧪", "Tests")}
            {link("/deployments", "🚀", "Deployments")}
            {link("/monitoring", "📈", "Monitoring")}
          </ul>
        </nav>

        {/* Footer */}
        <div style={{ padding: "0.5rem", "border-top": "1px solid var(--border)" }}>
          <ul style={{ "list-style": "none" }}>
            {link("/settings", "⚙️", "Settings")}
          </ul>
        </div>
      </aside>
    </>
  )
}
