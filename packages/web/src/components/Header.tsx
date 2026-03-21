import { Component } from "solid-js"

interface HeaderProps {
  connected: boolean
}

export const Header: Component<HeaderProps> = (props) => {
  return (
    <header
      style={{
        background: "var(--bg-secondary)",
        "border-bottom": "1px solid var(--border)",
        padding: "1rem 2rem",
        display: "flex",
        "justify-content": "space-between",
        "align-items": "center",
      }}
    >
      <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
        <h1 style={{ margin: 0, "font-size": "24px" }}>Rouge</h1>
        <span style={{ color: "var(--text-secondary)", "font-size": "14px" }}>
          DevOps & Testing Automation
        </span>
      </div>
      <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
        <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              "border-radius": "50%",
              background: props.connected ? "var(--success)" : "var(--danger)",
            }}
          />
          <span style={{ "font-size": "14px", color: "var(--text-secondary)" }}>
            {props.connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </header>
  )
}
