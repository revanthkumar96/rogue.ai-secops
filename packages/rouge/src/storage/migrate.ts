import { DB } from "./db.js"
import { workflow } from "./schema/workflow.js"
import { test_run, test_result } from "./schema/test.js"
import { deployment } from "./schema/deployment.js"
import { execution_log } from "./schema/execution.js"
import { Log } from "../util/log.js"
import Database from "bun:sqlite"

const log = Log.create({ service: "db:migrate" })

/**
 * Database migration utility
 * Creates all tables if they don't exist
 */

export async function migrate() {
  log.info("Running database migrations...")

  const dbPath = DB.Path
  const sqlite = new Database(dbPath)

  try {
    // Create workflow table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workflow (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        steps TEXT NOT NULL,
        status TEXT NOT NULL,
        ai_enabled INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)
    log.info("✓ Created workflow table")

    // Create test_run table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS test_run (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pattern TEXT,
        status TEXT NOT NULL,
        total_tests INTEGER DEFAULT 0,
        passed INTEGER DEFAULT 0,
        failed INTEGER DEFAULT 0,
        skipped INTEGER DEFAULT 0,
        duration_ms INTEGER,
        coverage TEXT,
        started_at INTEGER NOT NULL,
        completed_at INTEGER
      )
    `)
    log.info("✓ Created test_run table")

    // Create test_result table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS test_result (
        id TEXT PRIMARY KEY,
        test_run_id TEXT NOT NULL,
        name TEXT NOT NULL,
        file TEXT NOT NULL,
        status TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        error TEXT,
        stack TEXT,
        created_at INTEGER NOT NULL
      )
    `)
    log.info("✓ Created test_result table")

    // Create deployment table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS deployment (
        id TEXT PRIMARY KEY,
        environment TEXT NOT NULL,
        version TEXT NOT NULL,
        status TEXT NOT NULL,
        config TEXT,
        logs TEXT,
        error TEXT,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        rolled_back INTEGER DEFAULT 0
      )
    `)
    log.info("✓ Created deployment table")

    // Create execution_log table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS execution_log (
        id TEXT PRIMARY KEY,
        workflow_id TEXT,
        agent_type TEXT,
        task TEXT NOT NULL,
        context TEXT,
        output TEXT,
        success INTEGER NOT NULL,
        metadata TEXT,
        model_used TEXT,
        started_at INTEGER NOT NULL,
        completed_at INTEGER
      )
    `)
    log.info("✓ Created execution_log table")

    // Create indexes for better query performance
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_workflow_status ON workflow(status)`)
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_workflow_created ON workflow(created_at)`)
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_test_run_status ON test_run(status)`)
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_test_run_started ON test_run(started_at)`)
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_deployment_env ON deployment(environment)`)
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_deployment_status ON deployment(status)`)
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_execution_agent ON execution_log(agent_type)`)
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_execution_workflow ON execution_log(workflow_id)`)
    log.info("✓ Created indexes")

    log.info("✅ Database migration completed successfully")
  } catch (error) {
    log.error(`Migration failed: ${error}`)
    throw error
  } finally {
    sqlite.close()
  }
}

// Run migration if this file is executed directly
if (import.meta.main) {
  await migrate()
}
