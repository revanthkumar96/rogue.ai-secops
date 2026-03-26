import { Component, For } from "solid-js"

interface SkeletonProps {
  class?: string
  style?: Record<string, string>
}

export const Skeleton: Component<SkeletonProps> = (props) => (
  <div class={`skeleton ${props.class || ""}`} style={props.style} />
)

/** Skeleton stat card matching Dashboard layout */
export const SkeletonStatCard: Component = () => (
  <div class="card" style={{ display: "flex", "flex-direction": "column", gap: "0.75rem" }}>
    <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
      <div class="skeleton skeleton-text-sm" style={{ width: "60%" }} />
      <div class="skeleton skeleton-avatar" style={{ width: "28px", height: "28px" }} />
    </div>
    <div class="skeleton" style={{ height: "32px", width: "50%" }} />
    <div class="skeleton skeleton-text-sm" style={{ width: "75%" }} />
  </div>
)

/** Skeleton row for activity list */
export const SkeletonRow: Component = () => (
  <div class="card" style={{ display: "flex", "align-items": "center", gap: "0.75rem", padding: "0.75rem 1rem" }}>
    <div class="skeleton" style={{ width: "8px", height: "8px", "border-radius": "50%", "flex-shrink": "0" }} />
    <div style={{ flex: 1 }}>
      <div class="skeleton skeleton-text-sm" style={{ width: "30%", "margin-bottom": "4px" }} />
      <div class="skeleton skeleton-text" style={{ width: "90%" }} />
    </div>
    <div class="skeleton skeleton-text-sm" style={{ width: "50px" }} />
  </div>
)

/** Multiple skeleton rows */
export const SkeletonList: Component<{ count?: number }> = (props) => (
  <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
    <For each={Array(props.count || 4).fill(0)}>
      {() => <SkeletonRow />}
    </For>
  </div>
)

/** Skeleton pills for agent selector */
export const SkeletonPills: Component<{ count?: number }> = (props) => (
  <div style={{ display: "flex", gap: "0.5rem" }}>
    <For each={Array(props.count || 6).fill(0)}>
      {() => <div class="skeleton skeleton-pill" />}
    </For>
  </div>
)
