import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

/**
 * Alert schema
 * Rouge schema implementation with snake_case columns
 */

export const alert = sqliteTable("alert", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // error, warning, info
  severity: text("severity").notNull(), // critical, high, medium, low
  source: text("source").notNull(), // monitor, deploy, test
  message: text("message").notNull(),
  details: text("details"), // JSON
  resolved: integer("resolved", { mode: "boolean" }).default(false),
  resolved_at: integer("resolved_at"),
  created_at: integer("created_at").notNull(),
})

export type Alert = typeof alert.$inferSelect
export type AlertInsert = typeof alert.$inferInsert
