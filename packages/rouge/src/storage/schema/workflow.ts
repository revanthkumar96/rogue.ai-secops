import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

/**
 * Workflow schema
 * Rouge schema implementation with snake_case columns
 */

export const workflow = sqliteTable("workflow", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  steps: text("steps").notNull(), // JSON
  status: text("status").notNull(), // pending, running, completed, failed
  ai_enabled: integer("ai_enabled", { mode: "boolean" }).default(true),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
})

export type Workflow = typeof workflow.$inferSelect
export type WorkflowInsert = typeof workflow.$inferInsert
