import { Component, createSignal, Show, onMount } from "solid-js"
import { api, type Config } from "../lib/api"
import { SkeletonList } from "../components/Skeleton"
import { toast } from "../components/Toast"

export const SettingsPage: Component = () => {
  const [config, setConfig] = createSignal<Config | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [saving, setSaving] = createSignal(false)

  onMount(async () => {
    try {
      setConfig(await api.getConfig())
    } catch (e) {
      console.error("Failed to load config:", e)
    } finally {
      setLoading(false)
    }
  })

  const handleSave = async () => {
    if (!config()) return
    setSaving(true)
    try {
      await api.updateConfig(config()!)
      toast("success", "Configuration saved")
    } catch (e: any) {
      toast("error", `Save failed: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const field = (label: string, value: string | number, onChange: (v: string) => void, opts?: { mono?: boolean; type?: string; span2?: boolean }) => (
    <div style={{ "grid-column": opts?.span2 ? "span 2" : undefined }}>
      <label style={{ display: "block", "margin-bottom": "0.4rem", "font-size": "12px", color: "var(--text-tertiary)" }}>{label}</label>
      <input
        type={opts?.type || "text"}
        value={String(value)}
        onInput={(e) => onChange(e.currentTarget.value)}
        style={{ width: "100%", "font-family": opts?.mono ? "var(--font-family-mono)" : undefined, "font-size": "13px" }}
      />
    </div>
  )

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <div style={{ "margin-bottom": "1.5rem" }}>
        <h1 style={{ "font-size": "1.5rem", margin: 0 }}>Settings</h1>
        <p style={{ color: "var(--text-tertiary)", "font-size": "13px", "margin-top": "0.25rem" }}>Configure your Rouge.ai environment</p>
      </div>

      <Show when={loading()}>
        <SkeletonList count={4} />
      </Show>

      <Show when={!loading() && config()}>
        <div style={{ display: "grid", gap: "1rem", "max-width": "700px" }}>
          {/* Ollama */}
          <div class="card">
            <h3 style={{ "font-size": "14px", margin: "0 0 1rem", display: "flex", "align-items": "center", gap: "0.5rem" }}>🤖 Ollama</h3>
            <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "1rem" }}>
              {field("Server URL", config()!.ollama.url, (v) => setConfig({ ...config()!, ollama: { ...config()!.ollama, url: v } }), { span2: true, mono: true })}
              {field("Model", config()!.ollama.model, (v) => setConfig({ ...config()!, ollama: { ...config()!.ollama, model: v } }))}
              {field("Timeout (ms)", config()!.ollama.timeout, (v) => setConfig({ ...config()!, ollama: { ...config()!.ollama, timeout: parseInt(v) || 0 } }), { type: "number" })}
            </div>
          </div>

          {/* Workspace */}
          <div class="card">
            <h3 style={{ "font-size": "14px", margin: "0 0 1rem", display: "flex", "align-items": "center", gap: "0.5rem" }}>📁 Workspace</h3>
            {field("Project Path", config()!.workspace || "", (v) => setConfig({ ...config()!, workspace: v }), { mono: true })}
            <p style={{ "font-size": "11px", color: "var(--text-tertiary)", "margin-top": "0.5rem" }}>Root directory for agent file operations</p>
          </div>

          {/* Agents */}
          <div class="card">
            <h3 style={{ "font-size": "14px", margin: "0 0 1rem", display: "flex", "align-items": "center", gap: "0.5rem" }}>🛠️ Agents</h3>
            <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "1rem" }}>
              {field("Max Concurrent", config()!.agents.maxConcurrent, (v) => setConfig({ ...config()!, agents: { ...config()!.agents, maxConcurrent: parseInt(v) || 1 } }), { type: "number" })}
            </div>
          </div>

          {/* Execution */}
          <div class="card">
            <h3 style={{ "font-size": "14px", margin: "0 0 1rem", display: "flex", "align-items": "center", gap: "0.5rem" }}>📋 Execution</h3>
            <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "1rem" }}>
              {field("Step Timeout (sec)", config()!.workflows.timeout, (v) => setConfig({ ...config()!, workflows: { ...config()!.workflows, timeout: parseInt(v) || 0 } }), { type: "number" })}
              {field("Max Retries", config()!.workflows.retries, (v) => setConfig({ ...config()!, workflows: { ...config()!.workflows, retries: parseInt(v) || 0 } }), { type: "number" })}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving()}
            style={{ background: "var(--brand-gradient)", color: "white", border: "none", padding: "0.6rem 1.5rem", "font-weight": "700", width: "fit-content" }}
          >
            {saving() ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </Show>
    </div>
  )
}
