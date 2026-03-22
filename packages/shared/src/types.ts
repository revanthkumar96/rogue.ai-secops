import { z } from "zod"

/**
 * Shared types for Rouge
 * Zod schemas for type-safe validation
 */

// Agent types
export const AgentType = z.enum([
  "test",
  "deploy",
  "monitor",
  "analyze",
  "ci-cd",
  "security",
  "performance",
  "infrastructure",
  "incident",
  "database",
  "router",
])
export type AgentType = z.infer<typeof AgentType>

// Workflow status
export const WorkflowStatus = z.enum(["pending", "running", "completed", "failed"])
export type WorkflowStatus = z.infer<typeof WorkflowStatus>

// Test status
export const TestStatus = z.enum(["pending", "running", "passed", "failed", "skipped"])
export type TestStatus = z.infer<typeof TestStatus>

// Deployment status
export const DeployStatus = z.enum(["validating", "deploying", "deployed", "failed", "rolling_back"])
export type DeployStatus = z.infer<typeof DeployStatus>

// Workflow step
export const WorkflowStep = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: WorkflowStatus,
  config: z.record(z.any()),
  started_at: z.number().optional(),
  completed_at: z.number().optional(),
})
export type WorkflowStep = z.infer<typeof WorkflowStep>

// Workflow definition
export const Workflow = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(WorkflowStep),
  status: WorkflowStatus,
  ai_enabled: z.boolean().default(true),
  created_at: z.number(),
  updated_at: z.number(),
})
export type Workflow = z.infer<typeof Workflow>

// Test result
export const TestResult = z.object({
  id: z.string(),
  name: z.string(),
  status: TestStatus,
  duration_ms: z.number(),
  error: z.string().optional(),
  file: z.string(),
})
export type TestResult = z.infer<typeof TestResult>

// Deployment
export const Deployment = z.object({
  id: z.string(),
  environment: z.string(),
  version: z.string(),
  status: DeployStatus,
  started_at: z.number(),
  completed_at: z.number().optional(),
})
export type Deployment = z.infer<typeof Deployment>
