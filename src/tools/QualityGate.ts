/**
 * QualityGatekeeper — Phase 2: Policy-Based Quality Gates
 *
 * Blocks deployments if quality or compliance metrics are not met.
 * Aggregates results from test runners, security scanners, and coverage tools.
 *
 * Connects to:
 * - Phase 0: SecurityScanner (vulnerability data)
 * - Phase 2: TestArchitect (coverage data)
 * - Phase 1: ComplianceGuard (compliance policy)
 */

import type { SecurityReport } from './SecurityScanner.js'
import type { CoverageReport, TestStrategy } from '../assistant/TestEngineer.js'

// ---------- Types ----------

export type GateStatus = 'pass' | 'fail' | 'warn'

export interface GatePolicy {
  minCoverage: number
  maxCriticalVulns: number
  maxHighVulns: number
  requireE2E: boolean
  requireContractTests: boolean
  blockOnSecrets: boolean
  customChecks: CustomGateCheck[]
}

export interface CustomGateCheck {
  name: string
  command: string
  failOnNonZero: boolean
}

export interface GateCheckResult {
  name: string
  status: GateStatus
  message: string
  details?: string
}

export interface GateReport {
  timestamp: string
  environment: string
  overallStatus: GateStatus
  checks: GateCheckResult[]
  canDeploy: boolean
  summary: string
}

// ---------- Default policies ----------

const DEFAULT_POLICIES: Record<string, GatePolicy> = {
  development: {
    minCoverage: 50,
    maxCriticalVulns: 5,
    maxHighVulns: 20,
    requireE2E: false,
    requireContractTests: false,
    blockOnSecrets: true,
    customChecks: [],
  },
  staging: {
    minCoverage: 70,
    maxCriticalVulns: 0,
    maxHighVulns: 5,
    requireE2E: true,
    requireContractTests: false,
    blockOnSecrets: true,
    customChecks: [],
  },
  production: {
    minCoverage: 80,
    maxCriticalVulns: 0,
    maxHighVulns: 0,
    requireE2E: true,
    requireContractTests: true,
    blockOnSecrets: true,
    customChecks: [],
  },
}

// ---------- Gatekeeper ----------

export class QualityGatekeeper {
  private policy: GatePolicy

  constructor(environment: string, customPolicy?: Partial<GatePolicy>) {
    const base = DEFAULT_POLICIES[environment] ?? DEFAULT_POLICIES['staging']!
    this.policy = { ...base, ...customPolicy }
  }

  /**
   * Run all quality gate checks and return the report.
   */
  evaluate(
    security: SecurityReport,
    coverage: CoverageReport,
    strategy: TestStrategy,
  ): GateReport {
    const checks: GateCheckResult[] = [
      this.checkCoverage(coverage),
      this.checkCriticalVulns(security),
      this.checkHighVulns(security),
      this.checkSecrets(security),
      this.checkTestLayers(strategy),
      this.checkE2E(strategy),
      this.checkContractTests(strategy),
    ]

    const hasFailure = checks.some(c => c.status === 'fail')
    const hasWarning = checks.some(c => c.status === 'warn')
    const overallStatus: GateStatus = hasFailure ? 'fail' : hasWarning ? 'warn' : 'pass'

    const passed = checks.filter(c => c.status === 'pass').length
    const failed = checks.filter(c => c.status === 'fail').length
    const warned = checks.filter(c => c.status === 'warn').length

    return {
      timestamp: new Date().toISOString(),
      environment: this.getEnvironmentName(),
      overallStatus,
      checks,
      canDeploy: !hasFailure,
      summary: `${passed} passed, ${warned} warnings, ${failed} failed`,
    }
  }

  // --- Individual checks ---

  private checkCoverage(coverage: CoverageReport): GateCheckResult {
    const target = this.policy.minCoverage
    if (coverage.overall >= target) {
      return {
        name: 'Code Coverage',
        status: 'pass',
        message: `Coverage ${coverage.overall}% meets target ${target}%`,
      }
    }
    if (coverage.overall >= target * 0.7) {
      return {
        name: 'Code Coverage',
        status: 'warn',
        message: `Coverage ${coverage.overall}% below target ${target}% but within tolerance`,
        details: `Uncovered: ${coverage.uncoveredPaths.slice(0, 5).join(', ')}`,
      }
    }
    return {
      name: 'Code Coverage',
      status: 'fail',
      message: `Coverage ${coverage.overall}% far below target ${target}% (SOC2 CC7.2)`,
      details: `Uncovered: ${coverage.uncoveredPaths.slice(0, 10).join(', ')}`,
    }
  }

  private checkCriticalVulns(security: SecurityReport): GateCheckResult {
    const count = security.summary.critical
    const max = this.policy.maxCriticalVulns
    if (count <= max) {
      return {
        name: 'Critical Vulnerabilities',
        status: count === 0 ? 'pass' : 'warn',
        message: `${count} critical vulnerability(ies) (max: ${max})`,
      }
    }
    return {
      name: 'Critical Vulnerabilities',
      status: 'fail',
      message: `${count} critical vulnerabilities exceed limit of ${max} (SOC2 CC7.1)`,
    }
  }

  private checkHighVulns(security: SecurityReport): GateCheckResult {
    const count = security.summary.high
    const max = this.policy.maxHighVulns
    if (count <= max) {
      return {
        name: 'High Vulnerabilities',
        status: 'pass',
        message: `${count} high vulnerability(ies) (max: ${max})`,
      }
    }
    return {
      name: 'High Vulnerabilities',
      status: 'fail',
      message: `${count} high vulnerabilities exceed limit of ${max}`,
    }
  }

  private checkSecrets(security: SecurityReport): GateCheckResult {
    if (!this.policy.blockOnSecrets) {
      return { name: 'Secret Detection', status: 'pass', message: 'Secret check skipped by policy' }
    }
    if (security.summary.secretsDetected === 0) {
      return { name: 'Secret Detection', status: 'pass', message: 'No secrets detected in source' }
    }
    return {
      name: 'Secret Detection',
      status: 'fail',
      message: `${security.summary.secretsDetected} secret(s) found in source code (SOC2 CC6.1)`,
    }
  }

  private checkTestLayers(strategy: TestStrategy): GateCheckResult {
    const hasUnit = strategy.detectedFrameworks.some(f => f.layer === 'unit')
    if (hasUnit) {
      return { name: 'Unit Tests', status: 'pass', message: 'Unit test framework detected' }
    }
    return {
      name: 'Unit Tests',
      status: 'warn',
      message: 'No unit test framework detected',
      details: `Recommended: ${strategy.recommendedFrameworks.find(r => r.layer === 'unit')?.framework ?? 'vitest'}`,
    }
  }

  private checkE2E(strategy: TestStrategy): GateCheckResult {
    if (!this.policy.requireE2E) {
      return { name: 'E2E Tests', status: 'pass', message: 'E2E not required for this environment' }
    }
    const hasE2E = strategy.detectedFrameworks.some(f => f.layer === 'e2e')
    if (hasE2E) {
      return { name: 'E2E Tests', status: 'pass', message: 'E2E test framework detected' }
    }
    return {
      name: 'E2E Tests',
      status: 'fail',
      message: 'E2E tests required but no framework detected',
    }
  }

  private checkContractTests(strategy: TestStrategy): GateCheckResult {
    if (!this.policy.requireContractTests) {
      return { name: 'Contract Tests', status: 'pass', message: 'Contract tests not required' }
    }
    const hasContract = strategy.detectedFrameworks.some(f => f.layer === 'contract')
    if (hasContract) {
      return { name: 'Contract Tests', status: 'pass', message: 'Contract test framework detected' }
    }
    return {
      name: 'Contract Tests',
      status: 'warn',
      message: 'Contract tests recommended but not detected',
    }
  }

  private getEnvironmentName(): string {
    for (const [name, policy] of Object.entries(DEFAULT_POLICIES)) {
      if (policy.minCoverage === this.policy.minCoverage) return name
    }
    return 'custom'
  }
}
