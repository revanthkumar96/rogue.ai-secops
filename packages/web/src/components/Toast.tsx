import { Component, createSignal, For } from "solid-js"

export interface ToastItem {
  id: string
  type: "success" | "error" | "info"
  message: string
}

const [toasts, setToasts] = createSignal<ToastItem[]>([])

export function toast(type: ToastItem["type"], message: string) {
  const id = Date.now().toString()
  setToasts(prev => [...prev, { id, type, message }])
  setTimeout(() => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, 4000)
}

const icons: Record<string, string> = {
  success: "✔",
  error: "✖",
  info: "ℹ",
}

const borderColors: Record<string, string> = {
  success: "var(--success)",
  error: "var(--danger)",
  info: "var(--accent)",
}

export const ToastContainer: Component = () => {
  return (
    <div style={{
      position: "fixed",
      top: "60px",
      right: "1rem",
      "z-index": 9999,
      display: "flex",
      "flex-direction": "column",
      gap: "0.5rem",
      "pointer-events": "none",
    }}>
      <For each={toasts()}>
        {(t) => (
          <div style={{
            padding: "0.6rem 1rem",
            background: "var(--bg-secondary)",
            border: `1px solid ${borderColors[t.type]}`,
            "border-left": `3px solid ${borderColors[t.type]}`,
            "border-radius": "var(--radius-md)",
            color: "var(--text-primary)",
            "font-size": "13px",
            "min-width": "250px",
            "max-width": "400px",
            "box-shadow": "var(--shadow-lg)",
            animation: "fadeIn 0.25s ease",
            "pointer-events": "auto",
            display: "flex",
            "align-items": "center",
            gap: "0.5rem",
          }}>
            <span style={{ color: borderColors[t.type], "font-weight": "700" }}>
              {icons[t.type]}
            </span>
            {t.message}
          </div>
        )}
      </For>
    </div>
  )
}
