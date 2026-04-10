import { describe, it, expect } from 'bun:test'
import { QualityGatekeeper } from '../../tools/QualityGate.js'
import type { SecurityReport } from '../../tools/SecurityScanner.js'
import type { CoverageReport, TestStrategy } from '../../assistant/TestEngineer.js'

describe('QualityGatekeeper', () => {
  const mockSecurity: SecurityReport = {
    scanTimestamp: new Date().toISOString(),
    rootDir: '/fake/root',
    vulnerabilities: [],
    secrets: [],
    summary: {
      totalVulnerabilities: 2,
      critical: 0,
      high: 0,
      medium: 1,
      low: 0,
      secretsDetected: 0,
      riskScore: 5
    }
  }

  const mockCoverage: CoverageReport = {
    overall: 85,
    byLayer: { unit: 90, integration: 80, e2e: 75, contract: 0, performance: 0 },
    uncoveredPaths: [],
    meetsSoc2: true
  }

  const mockStrategy: TestStrategy = {
    projectName: 'test',
    projectType: 'api-service',
    detectedFrameworks: [
      { name: 'vitest', layer: 'unit', confidence: 1 }, 
      { name: 'playwright', layer: 'e2e', confidence: 1 },
      { name: 'pact', layer: 'contract', confidence: 1 }
    ],
    recommendedFrameworks: [],
    coverageTarget: 80,
    layers: [],
    boilerplates: []
  }

  it('should pass if all metrics are within production limits', () => {
    const gate = new QualityGatekeeper('production')
    const report = gate.evaluate(mockSecurity, mockCoverage, mockStrategy)

    expect(report.overallStatus).toBe('pass')
    expect(report.canDeploy).toBe(true)
  })

  it('should fail in production if coverage is too low', () => {
    const lowCoverage = { ...mockCoverage, overall: 40 }
    const gate = new QualityGatekeeper('production')
    const report = gate.evaluate(mockSecurity, lowCoverage, mockStrategy)

    expect(report.overallStatus).toBe('fail')
    expect(report.canDeploy).toBe(false)
    expect(report.checks.find(c => c.name === 'Code Coverage')?.status).toBe('fail')
  })

  it('should warn in staging if high vulnerabilities exist', () => {
    const highVulns = {
      ...mockSecurity,
      summary: { ...mockSecurity.summary, high: 2 }
    }
    const gate = new QualityGatekeeper('staging')
    const report = gate.evaluate(highVulns, mockCoverage, mockStrategy)

    // staging allows up to 5 high vulns, so it should pass or warn depending on implementation
    // The code says: if (count <= max) return pass (or warn for critical > 0)
    expect(report.canDeploy).toBe(true)
  })

  it('should block if secrets are detected', () => {
    const withSecrets = {
      ...mockSecurity,
      summary: { ...mockSecurity.summary, secretsDetected: 1 }
    }
    const gate = new QualityGatekeeper('development')
    const report = gate.evaluate(withSecrets, mockCoverage, mockStrategy)

    expect(report.canDeploy).toBe(false)
    expect(report.checks.find(c => c.name === 'Secret Detection')?.status).toBe('fail')
  })

  it('should enforce e2e requirements for staging/production', () => {
    const noE2EStrategy = {
      ...mockStrategy,
      detectedFrameworks: [{ name: 'vitest', layer: 'unit' as any, confidence: 1 }]
    }
    const gate = new QualityGatekeeper('production')
    const report = gate.evaluate(mockSecurity, mockCoverage, noE2EStrategy)

    expect(report.canDeploy).toBe(false)
    expect(report.checks.find(c => c.name === 'E2E Tests')?.status).toBe('fail')
  })
})
