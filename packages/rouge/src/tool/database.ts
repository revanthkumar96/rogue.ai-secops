import { DB } from "../storage/db.js"
import { workflow, type WorkflowInsert } from "../storage/schema/workflow.js"
import { test_run, test_result, type TestRunInsert, type TestResultInsert } from "../storage/schema/test.js"
import { deployment, type DeploymentInsert } from "../storage/schema/deployment.js"
import { execution_log, type ExecutionLogInsert } from "../storage/schema/execution.js"
import { eq, desc, and, or, like } from "drizzle-orm"
import { Log } from "../util/log.js"

const log = Log.create({ service: "tool:database" })

/**
 * Database CRUD Tools for Agent System
 * Enables agents to create, read, update, delete data
 */

export namespace DatabaseTool {
  /**
   * Generate unique ID
   */
  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  // ==================== WORKFLOW OPERATIONS ====================

  export async function createWorkflow(data: {
    name: string
    description?: string
    steps: any // Will be JSON stringified
  }): Promise<{ id: string; success: boolean; message: string }> {
    try {
      const db = DB.client()
      const id = generateId()
      const now = Date.now()

      const insert: WorkflowInsert = {
        id,
        name: data.name,
        description: data.description,
        steps: JSON.stringify(data.steps),
        status: "pending",
        ai_enabled: true,
        created_at: now,
        updated_at: now,
      }

      await db.insert(workflow).values(insert)

      log.info(`Created workflow: ${id}`)
      return { id, success: true, message: `Workflow created with ID: ${id}` }
    } catch (error: any) {
      log.error(`Failed to create workflow: ${error.message}`)
      return { id: "", success: false, message: `Error: ${error.message}` }
    }
  }

  export async function readWorkflow(data: { id: string }): Promise<any> {
    try {
      const db = DB.client()
      const result = await db.select().from(workflow).where(eq(workflow.id, data.id))

      if (result.length === 0) {
        return { success: false, message: `Workflow not found: ${data.id}` }
      }

      const wf = result[0]
      return {
        success: true,
        data: {
          ...wf,
          steps: JSON.parse(wf.steps),
        },
      }
    } catch (error: any) {
      log.error(`Failed to read workflow: ${error.message}`)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  export async function updateWorkflow(data: {
    id: string
    name?: string
    description?: string
    steps?: any
    status?: string
  }): Promise<{ success: boolean; message: string }> {
    try {
      const db = DB.client()

      const updates: any = {
        updated_at: Date.now(),
      }

      if (data.name) updates.name = data.name
      if (data.description !== undefined) updates.description = data.description
      if (data.steps) updates.steps = JSON.stringify(data.steps)
      if (data.status) updates.status = data.status

      await db.update(workflow).set(updates).where(eq(workflow.id, data.id))

      log.info(`Updated workflow: ${data.id}`)
      return { success: true, message: `Workflow updated: ${data.id}` }
    } catch (error: any) {
      log.error(`Failed to update workflow: ${error.message}`)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  export async function deleteWorkflow(data: { id: string }): Promise<{ success: boolean; message: string }> {
    try {
      const db = DB.client()
      await db.delete(workflow).where(eq(workflow.id, data.id))

      log.info(`Deleted workflow: ${data.id}`)
      return { success: true, message: `Workflow deleted: ${data.id}` }
    } catch (error: any) {
      log.error(`Failed to delete workflow: ${error.message}`)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  export async function listWorkflows(data: {
    status?: string
    limit?: number
  }): Promise<any> {
    try {
      const db = DB.client()
      let query = db.select().from(workflow).orderBy(desc(workflow.created_at))

      if (data.status) {
        query = query.where(eq(workflow.status, data.status)) as any
      }

      if (data.limit) {
        query = query.limit(data.limit) as any
      }

      const results = await query

      return {
        success: true,
        count: results.length,
        workflows: results.map((wf) => ({
          ...wf,
          steps: JSON.parse(wf.steps),
        })),
      }
    } catch (error: any) {
      log.error(`Failed to list workflows: ${error.message}`)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  // ==================== TEST RUN OPERATIONS ====================

  export async function createTestRun(data: {
    name: string
    pattern?: string
  }): Promise<{ id: string; success: boolean; message: string }> {
    try {
      const db = DB.client()
      const id = generateId()
      const now = Date.now()

      const insert: TestRunInsert = {
        id,
        name: data.name,
        pattern: data.pattern,
        status: "pending",
        started_at: now,
      }

      await db.insert(test_run).values(insert)

      log.info(`Created test run: ${id}`)
      return { id, success: true, message: `Test run created with ID: ${id}` }
    } catch (error: any) {
      log.error(`Failed to create test run: ${error.message}`)
      return { id: "", success: false, message: `Error: ${error.message}` }
    }
  }

  export async function updateTestRun(data: {
    id: string
    status?: string
    total_tests?: number
    passed?: number
    failed?: number
    skipped?: number
    duration_ms?: number
    coverage?: any
  }): Promise<{ success: boolean; message: string }> {
    try {
      const db = DB.client()

      const updates: any = {}

      if (data.status) updates.status = data.status
      if (data.total_tests !== undefined) updates.total_tests = data.total_tests
      if (data.passed !== undefined) updates.passed = data.passed
      if (data.failed !== undefined) updates.failed = data.failed
      if (data.skipped !== undefined) updates.skipped = data.skipped
      if (data.duration_ms !== undefined) updates.duration_ms = data.duration_ms
      if (data.coverage) updates.coverage = JSON.stringify(data.coverage)

      if (data.status === "passed" || data.status === "failed") {
        updates.completed_at = Date.now()
      }

      await db.update(test_run).set(updates).where(eq(test_run.id, data.id))

      log.info(`Updated test run: ${data.id}`)
      return { success: true, message: `Test run updated: ${data.id}` }
    } catch (error: any) {
      log.error(`Failed to update test run: ${error.message}`)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  export async function listTestRuns(data: {
    status?: string
    limit?: number
  }): Promise<any> {
    try {
      const db = DB.client()
      let query = db.select().from(test_run).orderBy(desc(test_run.started_at))

      if (data.status) {
        query = query.where(eq(test_run.status, data.status)) as any
      }

      if (data.limit) {
        query = query.limit(data.limit) as any
      }

      const results = await query

      return {
        success: true,
        count: results.length,
        test_runs: results.map((tr) => ({
          ...tr,
          coverage: tr.coverage ? JSON.parse(tr.coverage) : null,
        })),
      }
    } catch (error: any) {
      log.error(`Failed to list test runs: ${error.message}`)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  export async function createTestResult(data: {
    test_run_id: string
    name: string
    file: string
    status: string
    duration_ms: number
    error?: string
    stack?: string
  }): Promise<{ id: string; success: boolean; message: string }> {
    try {
      const db = DB.client()
      const id = generateId()

      const insert: TestResultInsert = {
        id,
        test_run_id: data.test_run_id,
        name: data.name,
        file: data.file,
        status: data.status,
        duration_ms: data.duration_ms,
        error: data.error,
        stack: data.stack,
        created_at: Date.now(),
      }

      await db.insert(test_result).values(insert)

      log.info(`Created test result: ${id}`)
      return { id, success: true, message: `Test result created with ID: ${id}` }
    } catch (error: any) {
      log.error(`Failed to create test result: ${error.message}`)
      return { id: "", success: false, message: `Error: ${error.message}` }
    }
  }

  // ==================== DEPLOYMENT OPERATIONS ====================

  export async function createDeployment(data: {
    environment: string
    version: string
    config?: any
  }): Promise<{ id: string; success: boolean; message: string }> {
    try {
      const db = DB.client()
      const id = generateId()

      const insert: DeploymentInsert = {
        id,
        environment: data.environment,
        version: data.version,
        status: "validating",
        config: data.config ? JSON.stringify(data.config) : undefined,
        started_at: Date.now(),
      }

      await db.insert(deployment).values(insert)

      log.info(`Created deployment: ${id}`)
      return { id, success: true, message: `Deployment created with ID: ${id}` }
    } catch (error: any) {
      log.error(`Failed to create deployment: ${error.message}`)
      return { id: "", success: false, message: `Error: ${error.message}` }
    }
  }

  export async function updateDeployment(data: {
    id: string
    status?: string
    logs?: string
    error?: string
    rolled_back?: boolean
  }): Promise<{ success: boolean; message: string }> {
    try {
      const db = DB.client()

      const updates: any = {}

      if (data.status) updates.status = data.status
      if (data.logs) updates.logs = data.logs
      if (data.error) updates.error = data.error
      if (data.rolled_back !== undefined) updates.rolled_back = data.rolled_back

      if (data.status === "deployed" || data.status === "failed") {
        updates.completed_at = Date.now()
      }

      await db.update(deployment).set(updates).where(eq(deployment.id, data.id))

      log.info(`Updated deployment: ${data.id}`)
      return { success: true, message: `Deployment updated: ${data.id}` }
    } catch (error: any) {
      log.error(`Failed to update deployment: ${error.message}`)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  export async function listDeployments(data: {
    environment?: string
    status?: string
    limit?: number
  }): Promise<any> {
    try {
      const db = DB.client()
      let query = db.select().from(deployment).orderBy(desc(deployment.started_at))

      const conditions = []
      if (data.environment) {
        conditions.push(eq(deployment.environment, data.environment))
      }
      if (data.status) {
        conditions.push(eq(deployment.status, data.status))
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any
      }

      if (data.limit) {
        query = query.limit(data.limit) as any
      }

      const results = await query

      return {
        success: true,
        count: results.length,
        deployments: results.map((d) => ({
          ...d,
          config: d.config ? JSON.parse(d.config) : null,
        })),
      }
    } catch (error: any) {
      log.error(`Failed to list deployments: ${error.message}`)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  // ==================== EXECUTION LOG OPERATIONS ====================

  export async function createExecutionLog(data: {
    workflow_id?: string
    agent_type?: string
    task: string
    context?: any
    output?: string
    success: boolean
    metadata?: any
    model_used?: string
  }): Promise<{ id: string; success: boolean; message: string }> {
    try {
      const db = DB.client()
      const id = generateId()
      const now = Date.now()

      const insert: ExecutionLogInsert = {
        id,
        workflow_id: data.workflow_id,
        agent_type: data.agent_type,
        task: data.task,
        context: data.context ? JSON.stringify(data.context) : undefined,
        output: data.output,
        success: data.success,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        model_used: data.model_used,
        started_at: now,
        completed_at: now,
      }

      await db.insert(execution_log).values(insert)

      log.info(`Created execution log: ${id}`)
      return { id, success: true, message: `Execution log created with ID: ${id}` }
    } catch (error: any) {
      log.error(`Failed to create execution log: ${error.message}`)
      return { id: "", success: false, message: `Error: ${error.message}` }
    }
  }

  export async function listExecutionLogs(data: {
    workflow_id?: string
    agent_type?: string
    success?: boolean
    limit?: number
  }): Promise<any> {
    try {
      const db = DB.client()
      let query = db.select().from(execution_log).orderBy(desc(execution_log.started_at))

      const conditions = []
      if (data.workflow_id) {
        conditions.push(eq(execution_log.workflow_id, data.workflow_id))
      }
      if (data.agent_type) {
        conditions.push(eq(execution_log.agent_type, data.agent_type))
      }
      if (data.success !== undefined) {
        conditions.push(eq(execution_log.success, data.success))
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any
      }

      if (data.limit) {
        query = query.limit(data.limit) as any
      }

      const results = await query

      return {
        success: true,
        count: results.length,
        logs: results.map((log) => ({
          ...log,
          context: log.context ? JSON.parse(log.context) : null,
          metadata: log.metadata ? JSON.parse(log.metadata) : null,
        })),
      }
    } catch (error: any) {
      log.error(`Failed to list execution logs: ${error.message}`)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  // ==================== ANALYTICS & QUERIES ====================

  export async function getWorkflowStats(): Promise<any> {
    try {
      const db = DB.client()
      const workflows = await db.select().from(workflow)

      const stats = {
        total: workflows.length,
        by_status: {} as Record<string, number>,
      }

      workflows.forEach((wf) => {
        stats.by_status[wf.status] = (stats.by_status[wf.status] || 0) + 1
      })

      return {
        success: true,
        stats,
      }
    } catch (error: any) {
      log.error(`Failed to get workflow stats: ${error.message}`)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  export async function getTestStats(): Promise<any> {
    try {
      const db = DB.client()
      const runs = await db.select().from(test_run)

      const stats = {
        total_runs: runs.length,
        total_tests: runs.reduce((sum, r) => sum + (r.total_tests || 0), 0),
        total_passed: runs.reduce((sum, r) => sum + (r.passed || 0), 0),
        total_failed: runs.reduce((sum, r) => sum + (r.failed || 0), 0),
        by_status: {} as Record<string, number>,
      }

      runs.forEach((run) => {
        stats.by_status[run.status] = (stats.by_status[run.status] || 0) + 1
      })

      return {
        success: true,
        stats,
      }
    } catch (error: any) {
      log.error(`Failed to get test stats: ${error.message}`)
      return { success: false, message: `Error: ${error.message}` }
    }
  }
}
