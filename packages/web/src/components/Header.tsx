import { Component } from "solid-js"

interface HeaderProps {
  connected: boolean
}

export const Header: Component<HeaderProps> = (props) => {
  return (
    <header
      style={{
        background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)",
        "border-bottom": "1px solid rgba(102, 126, 234, 0.2)",
        padding: "0.75rem clamp(1rem, 3vw, 2rem)",
        display: "flex",
        "justify-content": "space-between",
        "align-items": "center",
        "backdrop-filter": "blur(20px)",
        "-webkit-backdrop-filter": "blur(20px)",
        position: "sticky",
        top: 0,
        "z-index": 100,
        height: "64px",
        "box-shadow": "0 4px 16px rgba(0, 0, 0, 0.1)"
      }}
    >
      <div style={{ display: "flex", "align-items": "center", gap: "clamp(0.5rem, 2vw, 1rem)" }}>
        {/* Logo */}
        <div style={{
          display: "flex",
          "align-items": "center",
          gap: "0.5rem",
          "font-size": "clamp(16px, 3vw, 20px)",
          "font-weight": "800"
        }}>
          <span style={{ "font-size": "clamp(20px, 4vw, 24px)" }}>✨</span>
          <span style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "-webkit-background-clip": "text",
            "-webkit-text-fill-color": "transparent",
            "letter-spacing": "-0.02em"
          }}>
            Rouge.ai
          </span>
        </div>

        {/* Breadcrumb - hide on mobile */}
        <div class="breadcrumb" style={{
          display: "flex",
          "align-items": "center",
          gap: "0.5rem",
          "font-size": "clamp(11px, 2vw, 13px)",
          "margin-left": "clamp(0.5rem, 2vw, 1rem)"
        }}>
          <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>fairy-tail</span>
          <span style={{ color: "rgba(102, 126, 234, 0.4)" }}>/</span>
          <span style={{ color: "rgba(255, 255, 255, 0.7)", "font-weight": "600" }}>command-center</span>
        </div>
      </div>

      <div style={{ display: "flex", "align-items": "center", gap: "clamp(0.75rem, 2vw, 1.5rem)" }}>
        {/* Connection Status */}
        <div style={{
          display: "flex",
          "align-items": "center",
          gap: "0.5rem",
          padding: "0.375rem clamp(0.5rem, 2vw, 0.75rem)",
          "border-radius": "2rem",
          background: props.connected
            ? "rgba(16, 185, 129, 0.1)"
            : "rgba(239, 68, 68, 0.1)",
          border: props.connected
            ? "1px solid rgba(16, 185, 129, 0.3)"
            : "1px solid rgba(239, 68, 68, 0.3)"
        }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              "border-radius": "50%",
              background: props.connected ? "#10b981" : "#ef4444",
              "box-shadow": props.connected ? "0 0 8px #10b981" : "0 0 8px #ef4444",
              animation: props.connected ? "pulse 2s ease-in-out infinite" : "none"
            }}
          />
          <span style={{
            "font-size": "clamp(10px, 2vw, 12px)",
            "font-weight": "600",
            color: props.connected ? "#10b981" : "#ef4444",
            "white-space": "nowrap"
          }}>
            {props.connected ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        {/* User Avatar */}
        <div style={{
          width: "clamp(28px, 5vw, 32px)",
          height: "clamp(28px, 5vw, 32px)",
          "border-radius": "50%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "2px solid rgba(102, 126, 234, 0.3)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "font-size": "clamp(12px, 3vw, 14px)",
          color: "white",
          "font-weight": "700",
          cursor: "pointer",
          transition: "all 0.3s ease"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          🧙
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 640px) {
          .breadcrumb {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
}
