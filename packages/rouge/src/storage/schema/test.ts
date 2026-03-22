import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

/**
 * Test run schema
 * Rouge schema implementation with snake_case columns
 */

export const test_run = sqliteTable("test_run", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  pattern: text("pattern"),
  status: text("status").notNull(), // pending, running, passed, failed, skipped
  total_tests: integer("total_tests").default(0),
  passed: integer("passed").default(0),
  failed: integer("failed").default(0),
  skipped: integer("skipped").default(0),
  duration_ms: integer("duration_ms"),
  coverage: text("coverage"), // JSON
  started_at: integer("started_at").notNull(),
  completed_at: integer("completed_at"),
})

export const test_result = sqliteTable("test_result", {
  id: text("id").primaryKey(),
  test_run_id: text("test_run_id").notNull(),
  name: text("name").notNull(),
  file: text("file").notNull(),
  status: text("status").notNull(), // passed, failed, skipped
  duration_ms: integer("duration_ms").notNull(),
  error: text("error"),
  stack: text("stack"),
  created_at: integer("created_at").notNull(),
})

export type TestRun = typeof test_run.$inferSelect
export type TestRunInsert = typeof test_run.$inferInsert
export type TestResult = typeof test_result.$inferSelect
export type TestResultInsert = typeof test_result.$inferInsert
