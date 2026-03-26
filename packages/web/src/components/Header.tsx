import { Component } from "solid-js"

interface HeaderProps {
  connected: boolean
  onMenuToggle: () => void
}

export const Header: Component<HeaderProps> = (props) => {
  return (
    <header style={{
      background: "var(--bg-secondary)",
      "border-bottom": "1px solid var(--border)",
      padding: "0 1rem",
      display: "flex",
      "justify-content": "space-between",
      "align-items": "center",
      height: "52px",
      "flex-shrink": 0,
    }}>
      <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
        {/* Mobile hamburger */}
        <button
          class="menu-toggle"
          onClick={() => props.onMenuToggle()}
          style={{
            display: "none",
            "align-items": "center",
            "justify-content": "center",
            background: "transparent",
            border: "none",
            color: "var(--text-primary)",
            "font-size": "1.25rem",
            padding: "0.25rem",
            cursor: "pointer",
          }}
        >
          ☰
        </button>

        <span style={{ "font-size": "13px", color: "var(--text-tertiary)" }}>
          Rouge.ai
        </span>
        <span style={{ color: "var(--border-strong)", "font-size": "12px" }}>/</span>
        <span style={{ "font-size": "13px", color: "var(--text-secondary)", "font-weight": "600" }}>
          command-center
        </span>
      </div>

      <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
        <div style={{
          display: "flex",
          "align-items": "center",
          gap: "0.4rem",
          padding: "0.25rem 0.6rem",
          "border-radius": "9999px",
          background: props.connected ? "var(--success-soft)" : "var(--danger-soft)",
          border: `1px solid ${props.connected ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
        }}>
          <div style={{
            width: "6px",
            height: "6px",
            "border-radius": "50%",
            background: props.connected ? "var(--success)" : "var(--danger)",
            "box-shadow": `0 0 6px ${props.connected ? "var(--success)" : "var(--danger)"}`,
            animation: props.connected ? "pulse 2s ease-in-out infinite" : "none",
          }} />
          <span style={{ "font-size": "11px", "font-weight": "600", color: props.connected ? "var(--success)" : "var(--danger)" }}>
            {props.connected ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </header>
  )
}
