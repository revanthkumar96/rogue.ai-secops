import { Component } from "solid-js"

interface HeaderProps {
  connected: boolean
}

export const Header: Component<HeaderProps> = (props) => {
  return (
    <header
      style={{
        background: "rgba(5, 5, 5, 0.8)",
        "border-bottom": "1px solid var(--border-strong)",
        padding: "0.75rem 2rem",
        display: "flex",
        "justify-content": "space-between",
        "align-items": "center",
        "backdrop-filter": "blur(12px)",
        "-webkit-backdrop-filter": "blur(12px)",
        position: "sticky",
        top: 0,
        "z-index": 100,
        height: "64px"
      }}
    >
      <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
        {/* Simple breadcrumb or breadcrumb-like title */}
        <div style={{ display: "flex", "align-items": "center", gap: "0.5rem", "font-size": "14px" }}>
          <span style={{ color: "var(--text-tertiary)" }}>Console</span>
          <span style={{ color: "var(--border-strong)" }}>/</span>
          <span style={{ color: "var(--text-primary)", "font-weight": "600" }}>Dashboard</span>
        </div>
      </div>
      
      <div style={{ display: "flex", "align-items": "center", gap: "1.5rem" }}>
        <div style={{ 
          display: "flex", 
          "align-items": "center", 
          gap: "0.5rem",
          padding: "0.375rem 0.75rem",
          "border-radius": "var(--radius-md)",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)"
        }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              "border-radius": "50%",
              background: props.connected ? "var(--success)" : "var(--danger)",
              "box-shadow": props.connected ? "0 0 8px var(--success)" : "none"
            }}
          />
          <span style={{ "font-size": "12px", "font-weight": "500", color: "var(--text-secondary)" }}>
            {props.connected ? "System Online" : "System Offline"}
          </span>
        </div>
        
        <div style={{ 
          width: "32px", 
          height: "32px", 
          "border-radius": "50%", 
          background: "var(--accent-soft)",
          border: "1px solid var(--accent)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "font-size": "14px",
          color: "var(--accent)",
          "font-weight": "600"
        }}>
          S
        </div>
      </div>
    </header>
  )
}
