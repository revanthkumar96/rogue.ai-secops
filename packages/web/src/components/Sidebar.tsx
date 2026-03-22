import { Component } from "solid-js"
import { A, useLocation } from "@solidjs/router"

export const Sidebar: Component = () => {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const linkStyle = (active: boolean) => ({
    display: "flex",
    "align-items": "center",
    padding: "0.625rem 0.75rem",
    "border-radius": "var(--radius-md)",
    color: active ? "var(--accent)" : "var(--text-secondary)",
    "text-decoration": "none",
    background: active ? "var(--accent-soft)" : "transparent",
    "font-size": "14px",
    "font-weight": active ? "600" : "500",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    border: active ? "1px solid var(--accent)" : "1px solid transparent",
  })

  return (
    <aside
      style={{
        width: "260px",
        background: "var(--bg-secondary)",
        "border-right": "1px solid var(--border)",
        display: "flex",
        "flex-direction": "column",
        height: "100vh",
        position: "sticky",
        top: 0
      }}
    >
      <div style={{ padding: "1.5rem", "margin-bottom": "1rem" }}>
        <h2 style={{ 
          "font-size": "1.25rem", 
          margin: 0, 
          color: "var(--accent)",
          "letter-spacing": "-0.03em",
          display: "flex",
          "align-items": "center",
          gap: "0.5rem"
        }}>
          <span style={{ "font-size": "1.5rem" }}>🛡️</span> ROUGE
        </h2>
        <div style={{ "font-size": "11px", color: "var(--text-tertiary)", "margin-top": "0.25rem", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>
          DevOps Security Platform
        </div>
      </div>

      <nav style={{ flex: 1, padding: "0 0.75rem" }}>
        <ul style={{ "list-style": "none", padding: 0 }}>
          <li style={{ "margin-bottom": "0.25rem" }}>
            <A href="/" style={linkStyle(isActive("/"))}>
              <span style={{ "margin-right": "0.75rem" }}>📊</span> Dashboard
            </A>
          </li>
          <li style={{ "margin-bottom": "0.25rem" }}>
            <A href="/agents" style={linkStyle(isActive("/agents"))}>
              <span style={{ "margin-right": "0.75rem" }}>🤖</span> Agents
            </A>
          </li>
          <li style={{ "margin-bottom": "0.25rem" }}>
            <A href="/workflows" style={linkStyle(isActive("/workflows"))}>
              <span style={{ "margin-right": "0.75rem" }}>📋</span> Workflows
            </A>
          </li>
          <li style={{ "margin-bottom": "1.5rem", "margin-top": "1.5rem" }}>
            <div style={{ "font-size": "11px", color: "var(--text-tertiary)", "padding-left": "0.75rem", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>
              Operations
            </div>
          </li>
          <li style={{ "margin-bottom": "0.25rem" }}>
            <A href="/tests" style={linkStyle(isActive("/tests"))}>
              <span style={{ "margin-right": "0.75rem" }}>🧪</span> Tests
            </A>
          </li>
          <li style={{ "margin-bottom": "0.25rem" }}>
            <A href="/deployments" style={linkStyle(isActive("/deployments"))}>
              <span style={{ "margin-right": "0.75rem" }}>🚀</span> Deployments
            </A>
          </li>
          <li style={{ "margin-bottom": "0.25rem" }}>
            <A href="/monitoring" style={linkStyle(isActive("/monitoring"))}>
              <span style={{ "margin-right": "0.75rem" }}>📈</span> Monitoring
            </A>
          </li>
        </ul>
      </nav>

      <div style={{ padding: "1rem", "border-top": "1px solid var(--border)" }}>
        <A href="/settings" style={linkStyle(isActive("/settings"))}>
          <span style={{ "margin-right": "0.75rem" }}>⚙️</span> Settings
        </A>
      </div>
    </aside>
  )
}
