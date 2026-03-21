import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

/**
 * Execution log schema
 * Rouge schema implementation with snake_case columns
 */

export const execution_log = sqliteTable("execution_log", {
  id: text("id").primaryKey(),
  workflow_id: text("workflow_id"),
  agent_type: text("agent_type"), // test, deploy, monitor, analyze
  task: text("task").notNull(),
  context: text("context"), // JSON
  output: text("output"),
  success: integer("success", { mode: "boolean" }).notNull(),
  metadata: text("metadata"), // JSON
  started_at: integer("started_at").notNull(),
  completed_at: integer("completed_at"),
})

export type ExecutionLog = typeof execution_log.$inferSelect
export type ExecutionLogInsert = typeof execution_log.$inferInsert
