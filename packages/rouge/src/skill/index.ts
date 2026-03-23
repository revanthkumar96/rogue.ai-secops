import { z } from "zod"

/**
 * Skills system for Rouge
 * Rouge skill implementation
 *
 * Skills are reusable DevOps capabilities that agents can use
 */

// Skill definition schema
export const SkillDefinition = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  inputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    required: z.boolean(),
  })).optional(),
  outputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
  })).optional(),
  examples: z.array(z.string()).optional(),
  content: z.string().optional(),
})
export type SkillDefinition = z.infer<typeof SkillDefinition>

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export namespace Skill {
  /**
   * All available skills (including those loaded from definitions)
   */
  export const definitions: Record<string, SkillDefinition> = {
    // Testing Skills
    "test:generate": {
      id: "test:generate",
      name: "Generate Tests",
      description: "Generate test cases from specifications or existing code",
      category: "testing",
      inputs: [
        {
          name: "spec",
          type: "string",
          description: "Specification or code to generate tests for",
          required: true,
        },
        {
          name: "type",
          type: "unit | integration | e2e",
          description: "Type of tests to generate",
          required: true,
        },
        {
          name: "framework",
          type: "string",
          description: "Testing framework (jest, mocha, pytest, etc.)",
          required: false,
        },
      ],
      outputs: [
        {
          name: "tests",
          type: "string",
          description: "Generated test code",
        },
      ],
      examples: [
        "Generate unit tests for authentication module",
        "Create E2E tests for checkout flow",
      ],
    },

    "test:execute": {
      id: "test:execute",
      name: "Execute Tests",
      description: "Run test suites and collect results",
      category: "testing",
      inputs: [
        {
          name: "pattern",
          type: "string",
          description: "Test file pattern to execute",
          required: false,
        },
        {
          name: "coverage",
          type: "boolean",
          description: "Collect coverage data",
          required: false,
        },
      ],
      outputs: [
        {
          name: "results",
          type: "TestResults",
          description: "Test execution results with pass/fail counts",
        },
      ],
      examples: [
        "Run all unit tests with coverage",
        "Execute integration tests matching api/*",
      ],
    },

    // Deployment Skills
    "deploy:validate": {
      id: "deploy:validate",
      name: "Validate Deployment",
      description: "Validate deployment configuration before execution",
      category: "deployment",
      inputs: [
        {
          name: "config",
          type: "object",
          description: "Deployment configuration",
          required: true,
        },
        {
          name: "environment",
          type: "string",
          description: "Target environment",
          required: true,
        },
      ],
      outputs: [
        {
          name: "valid",
          type: "boolean",
          description: "Whether configuration is valid",
        },
        {
          name: "errors",
          type: "string[]",
          description: "Validation errors",
        },
      ],
      examples: [
        "Validate Kubernetes manifests",
        "Check Docker Compose configuration",
      ],
    },

    "deploy:execute": {
      id: "deploy:execute",
      name: "Execute Deployment",
      description: "Deploy application to target environment",
      category: "deployment",
      inputs: [
        {
          name: "version",
          type: "string",
          description: "Version to deploy",
          required: true,
        },
        {
          name: "environment",
          type: "string",
          description: "Target environment",
          required: true,
        },
        {
          name: "strategy",
          type: "rolling | blue-green | canary",
          description: "Deployment strategy",
          required: false,
        },
      ],
      outputs: [
        {
          name: "status",
          type: "string",
          description: "Deployment status",
        },
        {
          name: "url",
          type: "string",
          description: "Deployed application URL",
        },
      ],
      examples: [
        "Deploy v1.2.3 to production",
        "Canary deploy to 10% of traffic",
      ],
    },

    // Monitoring Skills
    "monitor:metrics": {
      id: "monitor:metrics",
      name: "Monitor Metrics",
      description: "Collect and analyze system metrics",
      category: "monitoring",
      inputs: [
        {
          name: "service",
          type: "string",
          description: "Service to monitor",
          required: true,
        },
        {
          name: "metrics",
          type: "string[]",
          description: "Metrics to collect",
          required: true,
        },
      ],
      outputs: [
        {
          name: "data",
          type: "object",
          description: "Metric data",
        },
        {
          name: "alerts",
          type: "string[]",
          description: "Triggered alerts",
        },
      ],
      examples: [
        "Monitor API response times",
        "Track database connection pool",
      ],
    },

    "monitor:logs": {
      id: "monitor:logs",
      name: "Analyze Logs",
      description: "Read and analyze application logs",
      category: "monitoring",
      inputs: [
        {
          name: "path",
          type: "string",
          description: "Log file path",
          required: true,
        },
        {
          name: "pattern",
          type: "string",
          description: "Pattern to search for",
          required: false,
        },
      ],
      outputs: [
        {
          name: "errors",
          type: "number",
          description: "Error count",
        },
        {
          name: "warnings",
          type: "number",
          description: "Warning count",
        },
      ],
      examples: [
        "Analyze error logs from last hour",
        "Search for specific error pattern",
      ],
    },

    // Security Skills
    "security:scan": {
      id: "security:scan",
      name: "Security Scan",
      description: "Scan for security vulnerabilities",
      category: "security",
      inputs: [
        {
          name: "target",
          type: "string",
          description: "Target to scan (code, container, infrastructure)",
          required: true,
        },
        {
          name: "type",
          type: "sast | dast | container | dependency",
          description: "Type of security scan",
          required: true,
        },
      ],
      outputs: [
        {
          name: "vulnerabilities",
          type: "Vulnerability[]",
          description: "Found vulnerabilities",
        },
        {
          name: "severity",
          type: "string",
          description: "Highest severity found",
        },
      ],
      examples: [
        "Scan Docker image for CVEs",
        "Run SAST on codebase",
      ],
    },

    // Infrastructure Skills
    "infra:provision": {
      id: "infra:provision",
      name: "Provision Infrastructure",
      description: "Provision cloud infrastructure",
      category: "infrastructure",
      inputs: [
        {
          name: "provider",
          type: "aws | azure | gcp",
          description: "Cloud provider",
          required: true,
        },
        {
          name: "config",
          type: "object",
          description: "Infrastructure configuration",
          required: true,
        },
      ],
      outputs: [
        {
          name: "resources",
          type: "string[]",
          description: "Provisioned resources",
        },
        {
          name: "status",
          type: "string",
          description: "Provisioning status",
        },
      ],
      examples: [
        "Provision ECS cluster on AWS",
        "Create GKE cluster on GCP",
      ],
    },

    // Database Skills
    "database:migrate": {
      id: "database:migrate",
      name: "Database Migration",
      description: "Execute database schema migration",
      category: "database",
      inputs: [
        {
          name: "direction",
          type: "up | down",
          description: "Migration direction",
          required: true,
        },
        {
          name: "script",
          type: "string",
          description: "Migration script",
          required: true,
        },
      ],
      outputs: [
        {
          name: "success",
          type: "boolean",
          description: "Migration success",
        },
        {
          name: "changes",
          type: "string[]",
          description: "Applied changes",
        },
      ],
      examples: [
        "Run migration to add new column",
        "Rollback last migration",
      ],
    },

    "database:optimize": {
      id: "database:optimize",
      name: "Optimize Query",
      description: "Analyze and optimize database queries",
      category: "database",
      inputs: [
        {
          name: "query",
          type: "string",
          description: "SQL query to optimize",
          required: true,
        },
      ],
      outputs: [
        {
          name: "optimized",
          type: "string",
          description: "Optimized query",
        },
        {
          name: "suggestions",
          type: "string[]",
          description: "Optimization suggestions",
        },
      ],
      examples: [
        "Optimize slow SELECT query",
        "Add indexes for better performance",
      ],
    },

    // Analysis Skills
    "analyze:root-cause": {
      id: "analyze:root-cause",
      name: "Root Cause Analysis",
      description: "Perform root cause analysis on failures",
      category: "analysis",
      inputs: [
        {
          name: "logs",
          type: "string",
          description: "Log data to analyze",
          required: true,
        },
        {
          name: "context",
          type: "object",
          description: "Additional context",
          required: false,
        },
      ],
      outputs: [
        {
          name: "root_cause",
          type: "string",
          description: "Identified root cause",
        },
        {
          name: "recommendations",
          type: "string[]",
          description: "Recommended fixes",
        },
      ],
      examples: [
        "Find root cause of API failures",
        "Analyze database deadlock",
      ],
    },
  }

  /**
   * Load skills from the definitions directory
   */
  export function loadDefinitions(): void {
    const definitionsDir = path.join(__dirname, "definitions")
    if (!fs.existsSync(definitionsDir)) return

    const files = fs.readdirSync(definitionsDir)
    for (const file of files) {
      if (!file.endsWith(".md")) continue

      try {
        const filePath = path.join(definitionsDir, file)
        const content = fs.readFileSync(filePath, "utf-8")
        
        // Basic parser for frontmatter
        const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
        if (match) {
          const yaml = match[1]
          const body = match[2]
          
          const nameMatch = yaml.match(/name: (.*)/)
          const descMatch = yaml.match(/description: (.*)/)
          
          if (nameMatch && descMatch) {
            const id = path.basename(file, ".md")
            definitions[id] = {
              id,
              name: nameMatch[1].trim(),
              description: descMatch[1].trim(),
              category: "general", // Default category for MD-based skills
              content: body.trim(),
            }
          }
        } else {
            // No frontmatter, just use filename
            const id = path.basename(file, ".md")
            definitions[id] = {
                id,
                name: id.replace(/-/g, " "),
                description: `Skill for ${id}`,
                category: "general",
                content: content.trim()
            }
        }
      } catch (e) {
        console.error(`Failed to load skill from ${file}:`, e)
      }
    }
  }

  /**
   * Get skill by ID
   */
  export function get(id: string): SkillDefinition | undefined {
    return definitions[id]
  }

  /**
   * List all skills
   */
  export function list(): SkillDefinition[] {
    return Object.values(definitions)
  }

  /**
   * List skills by category
   */
  export function byCategory(category: string): SkillDefinition[] {
    return Object.values(definitions).filter(s => s.category === category)
  }

  /**
   * Search skills
   */
  export function search(query: string): SkillDefinition[] {
    const lowerQuery = query.toLowerCase()
    return Object.values(definitions).filter(
      s =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.description.toLowerCase().includes(lowerQuery)
    )
  }

  // Initialize by loading definitions
  loadDefinitions()
}
