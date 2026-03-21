import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

/**
 * Deployment schema
 * Rouge schema implementation with snake_case columns
 */

export const deployment = sqliteTable("deployment", {
  id: text("id").primaryKey(),
  environment: text("environment").notNull(),
  version: text("version").notNull(),
  status: text("status").notNull(), // validating, deploying, deployed, failed, rolling_back
  config: text("config"), // JSON
  logs: text("logs"),
  error: text("error"),
  started_at: integer("started_at").notNull(),
  completed_at: integer("completed_at"),
  rolled_back: integer("rolled_back", { mode: "boolean" }).default(false),
})

export type Deployment = typeof deployment.$inferSelect
export type DeploymentInsert = typeof deployment.$inferInsert
