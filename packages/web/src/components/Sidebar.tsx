import { Component } from "solid-js"
import { A, useLocation } from "@solidjs/router"

export const Sidebar: Component = () => {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const linkStyle = (active: boolean) => ({
    display: "block",
    padding: "0.75rem",
    "border-radius": "6px",
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    "text-decoration": "none",
    background: active ? "var(--bg-tertiary)" : "transparent",
    transition: "all 0.2s",
  })

  return (
    <aside
      style={{
        width: "250px",
        background: "var(--bg-secondary)",
        "border-right": "1px solid var(--border)",
        padding: "1rem",
      }}
    >
      <nav>
        <ul style={{ "list-style": "none", padding: 0 }}>
          <li style={{ "margin-bottom": "0.5rem" }}>
            <A href="/" style={linkStyle(isActive("/"))}>
              📊 Dashboard
            </A>
          </li>
          <li style={{ "margin-bottom": "0.5rem" }}>
            <A href="/agents" style={linkStyle(isActive("/agents"))}>
              🤖 Agents
            </A>
          </li>
          <li style={{ "margin-bottom": "0.5rem" }}>
            <A href="/workflows" style={linkStyle(isActive("/workflows"))}>
              📋 Workflows
            </A>
          </li>
          <li style={{ "margin-bottom": "0.5rem" }}>
            <a
              href="#"
              style={linkStyle(false)}
              onClick={(e) => e.preventDefault()}
            >
              🧪 Tests
            </a>
          </li>
          <li style={{ "margin-bottom": "0.5rem" }}>
            <a
              href="#"
              style={linkStyle(false)}
              onClick={(e) => e.preventDefault()}
            >
              🚀 Deployments
            </a>
          </li>
          <li style={{ "margin-bottom": "0.5rem" }}>
            <a
              href="#"
              style={linkStyle(false)}
              onClick={(e) => e.preventDefault()}
            >
              📈 Monitoring
            </a>
          </li>
          <li style={{ "margin-bottom": "0.5rem" }}>
            <A href="/settings" style={linkStyle(isActive("/settings"))}>
              ⚙️ Settings
            </A>
          </li>
        </ul>
      </nav>
    </aside>
  )
}
