import { z } from "zod"
import type { AgentType } from "@rouge/shared/types"

/**
 * Abilities system for Rouge
 * Rouge ability implementation
 *
 * Abilities define what each agent can do
 */

// Ability definition schema
export const AbilityDefinition = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  agents: z.array(z.string()),
  permissions: z.array(z.string()),
  tools: z.array(z.string()),
  skills: z.array(z.string()),
})
export type AbilityDefinition = z.infer<typeof AbilityDefinition>

export namespace Ability {
  /**
   * All available abilities
   */
  export const definitions: Record<string, AbilityDefinition> = {
    // Testing Abilities
    "test-generation": {
      id: "test-generation",
      name: "Test Generation",
      description: "Generate test cases from specifications",
      agents: ["test"],
      permissions: ["read", "write"],
      tools: ["ReadLog", "WriteConfig", "Grep"],
      skills: ["test:generate"],
    },

    "test-execution": {
      id: "test-execution",
      name: "Test Execution",
      description: "Execute test suites and collect results",
      agents: ["test"],
      permissions: ["read", "execute"],
      tools: ["Bash", "ReadLog"],
      skills: ["test:execute"],
    },

    "test-analysis": {
      id: "test-analysis",
      name: "Test Analysis",
      description: "Analyze test results and coverage",
      agents: ["test", "analyze"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: [],
    },

    // Deployment Abilities
    "deployment-validation": {
      id: "deployment-validation",
      name: "Deployment Validation",
      description: "Validate deployment configurations",
      agents: ["deploy"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: ["deploy:validate"],
    },

    "deployment-execution": {
      id: "deployment-execution",
      name: "Deployment Execution",
      description: "Execute deployments to various environments",
      agents: ["deploy"],
      permissions: ["read", "write", "execute", "deploy"],
      tools: ["Bash", "ReadLog", "WriteConfig"],
      skills: ["deploy:execute"],
    },

    "deployment-rollback": {
      id: "deployment-rollback",
      name: "Deployment Rollback",
      description: "Rollback failed deployments",
      agents: ["deploy"],
      permissions: ["read", "execute", "deploy"],
      tools: ["Bash", "ReadLog"],
      skills: [],
    },

    // Monitoring Abilities
    "metrics-collection": {
      id: "metrics-collection",
      name: "Metrics Collection",
      description: "Collect and analyze system metrics",
      agents: ["monitor"],
      permissions: ["read", "execute"],
      tools: ["Bash", "ReadLog"],
      skills: ["monitor:metrics"],
    },

    "log-monitoring": {
      id: "log-monitoring",
      name: "Log Monitoring",
      description: "Monitor and analyze application logs",
      agents: ["monitor", "analyze"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: ["monitor:logs"],
    },

    "alerting": {
      id: "alerting",
      name: "Alerting",
      description: "Create and manage alerts",
      agents: ["monitor"],
      permissions: ["read", "write"],
      tools: ["WriteConfig"],
      skills: [],
    },

    // Security Abilities
    "vulnerability-scanning": {
      id: "vulnerability-scanning",
      name: "Vulnerability Scanning",
      description: "Scan for security vulnerabilities",
      agents: ["security"],
      permissions: ["read", "execute"],
      tools: ["Bash", "ReadLog", "Grep"],
      skills: ["security:scan"],
    },

    "compliance-checking": {
      id: "compliance-checking",
      name: "Compliance Checking",
      description: "Check compliance with security standards",
      agents: ["security"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: [],
    },

    "secret-detection": {
      id: "secret-detection",
      name: "Secret Detection",
      description: "Detect exposed secrets in code",
      agents: ["security"],
      permissions: ["read"],
      tools: ["Grep", "ReadLog"],
      skills: [],
    },

    // Infrastructure Abilities
    "infrastructure-provisioning": {
      id: "infrastructure-provisioning",
      name: "Infrastructure Provisioning",
      description: "Provision cloud infrastructure",
      agents: ["infrastructure"],
      permissions: ["read", "write", "execute"],
      tools: ["Bash", "WriteConfig", "ReadLog"],
      skills: ["infra:provision"],
    },

    "infrastructure-configuration": {
      id: "infrastructure-configuration",
      name: "Infrastructure Configuration",
      description: "Configure infrastructure resources",
      agents: ["infrastructure"],
      permissions: ["read", "write"],
      tools: ["WriteConfig", "ReadLog"],
      skills: [],
    },

    "infrastructure-validation": {
      id: "infrastructure-validation",
      name: "Infrastructure Validation",
      description: "Validate infrastructure configurations",
      agents: ["infrastructure"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: [],
    },

    // Database Abilities
    "schema-migration": {
      id: "schema-migration",
      name: "Schema Migration",
      description: "Execute database schema migrations",
      agents: ["database"],
      permissions: ["read", "write", "execute"],
      tools: ["Bash", "WriteConfig", "ReadLog"],
      skills: ["database:migrate"],
    },

    "query-optimization": {
      id: "query-optimization",
      name: "Query Optimization",
      description: "Optimize database queries",
      agents: ["database"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: ["database:optimize"],
    },

    "backup-restore": {
      id: "backup-restore",
      name: "Backup & Restore",
      description: "Backup and restore database data",
      agents: ["database"],
      permissions: ["read", "execute"],
      tools: ["Bash", "ReadLog"],
      skills: [],
    },

    // Analysis Abilities
    "root-cause-analysis": {
      id: "root-cause-analysis",
      name: "Root Cause Analysis",
      description: "Analyze failures to find root causes",
      agents: ["analyze", "incident"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: ["analyze:root-cause"],
    },

    "log-correlation": {
      id: "log-correlation",
      name: "Log Correlation",
      description: "Correlate logs across services",
      agents: ["analyze", "incident"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: [],
    },

    "pattern-detection": {
      id: "pattern-detection",
      name: "Pattern Detection",
      description: "Detect patterns in logs and metrics",
      agents: ["analyze", "monitor"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: [],
    },

    // CI/CD Abilities
    "pipeline-design": {
      id: "pipeline-design",
      name: "Pipeline Design",
      description: "Design CI/CD pipelines",
      agents: ["ci-cd"],
      permissions: ["read", "write"],
      tools: ["WriteConfig"],
      skills: [],
    },

    "pipeline-optimization": {
      id: "pipeline-optimization",
      name: "Pipeline Optimization",
      description: "Optimize CI/CD pipeline performance",
      agents: ["ci-cd"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: [],
    },

    "quality-gates": {
      id: "quality-gates",
      name: "Quality Gates",
      description: "Implement automated quality gates",
      agents: ["ci-cd"],
      permissions: ["read", "write"],
      tools: ["WriteConfig"],
      skills: [],
    },

    // Performance Abilities
    "load-testing": {
      id: "load-testing",
      name: "Load Testing",
      description: "Execute load and stress tests",
      agents: ["performance"],
      permissions: ["read", "execute"],
      tools: ["Bash", "ReadLog"],
      skills: [],
    },

    "performance-analysis": {
      id: "performance-analysis",
      name: "Performance Analysis",
      description: "Analyze application performance",
      agents: ["performance", "analyze"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: [],
    },

    "capacity-planning": {
      id: "capacity-planning",
      name: "Capacity Planning",
      description: "Plan capacity based on performance data",
      agents: ["performance", "infrastructure"],
      permissions: ["read"],
      tools: ["ReadLog"],
      skills: [],
    },

    // Incident Abilities
    "incident-triage": {
      id: "incident-triage",
      name: "Incident Triage",
      description: "Triage and assess incidents",
      agents: ["incident"],
      permissions: ["read"],
      tools: ["ReadLog", "Grep"],
      skills: [],
    },

    "incident-response": {
      id: "incident-response",
      name: "Incident Response",
      description: "Respond to and mitigate incidents",
      agents: ["incident"],
      permissions: ["read", "execute"],
      tools: ["Bash", "ReadLog"],
      skills: [],
    },

    "postmortem-generation": {
      id: "postmortem-generation",
      name: "Postmortem Generation",
      description: "Generate incident postmortems",
      agents: ["incident"],
      permissions: ["read", "write"],
      tools: ["WriteConfig", "ReadLog"],
      skills: [],
    },
  }

  /**
   * Get ability by ID
   */
  export function get(id: string): AbilityDefinition | undefined {
    return definitions[id]
  }

  /**
   * List all abilities
   */
  export function list(): AbilityDefinition[] {
    return Object.values(definitions)
  }

  /**
   * Get abilities for an agent
   */
  export function forAgent(agentType: AgentType): AbilityDefinition[] {
    return Object.values(definitions).filter(a => a.agents.includes(agentType))
  }

  /**
   * Check if agent has ability
   */
  export function hasAbility(agentType: AgentType, abilityId: string): boolean {
    const ability = definitions[abilityId]
    return ability ? ability.agents.includes(agentType) : false
  }

  /**
   * Get required permissions for ability
   */
  export function getPermissions(abilityId: string): string[] {
    const ability = definitions[abilityId]
    return ability ? ability.permissions : []
  }

  /**
   * Get required tools for ability
   */
  export function getTools(abilityId: string): string[] {
    const ability = definitions[abilityId]
    return ability ? ability.tools : []
  }

  /**
   * Get required skills for ability
   */
  export function getSkills(abilityId: string): string[] {
    const ability = definitions[abilityId]
    return ability ? ability.skills : []
  }
}
