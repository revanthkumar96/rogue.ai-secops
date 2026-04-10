import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { IntentGenerator } from '../../coordinator/IntentGenerator.js'
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import type { ProjectInventory } from '../../coordinator/DiscoveryEngine.js'
import type { SecurityReport } from '../../tools/SecurityScanner.js'
import type { ComplianceReport } from '../../schemas/compliance.js'

describe('IntentGenerator', () => {
  let testRoot: string

  beforeEach(() => {
    testRoot = join(tmpdir(), `niro-intent-test-${Math.random().toString(36).slice(2)}`)
    if (!existsSync(testRoot)) {
      mkdirSync(testRoot, { recursive: true })
    }
  })

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
  })

  const mockInventory: ProjectInventory = {
    scanTimestamp: new Date().toISOString(),
    rootDir: '/fake/root',
    languages: [{ language: 'typescript', fileCount: 10, percentage: 100 }],
    primaryLanguage: 'typescript',
    frameworks: [{ name: 'express', confidence: 1, evidence: [] }],
    databases: [{ type: 'postgresql', confidence: 1, evidence: [] }],
    dependencies: [{ name: 'express', version: '^4.18.2', type: 'production' }],
    entryPoints: [{ path: 'src/index.ts', type: 'main' }],
    projectType: 'api-service',
    fileCount: 10,
    directoryStructure: ['src'],
    packageManagers: ['npm'],
    hasTests: true,
    hasCICD: true,
    hasDocker: true,
    hasIaC: false
  }

  const mockSecurity: SecurityReport = {
    scanTimestamp: new Date().toISOString(),
    rootDir: '/fake/root',
    vulnerabilities: [],
    secrets: [],
    summary: {
      totalVulnerabilities: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      secretsDetected: 0,
      riskScore: 0
    }
  }

  const mockCompliance: ComplianceReport = {
    scanTimestamp: new Date().toISOString(),
    rootDir: '/fake/root',
    checks: [],
    score: {
      overall: 80,
      soc2: 80,
      gdpr: 80,
      passCount: 10,
      failCount: 0,
      warnCount: 2,
      naCount: 0
    }
  }

  it('should infer project name from package.json', () => {
    writeFileSync(join(testRoot, 'package.json'), JSON.stringify({ name: 'my-awesome-api' }))
    const generator = new IntentGenerator(testRoot)
    const spec = generator.generate(mockInventory)

    expect(spec.projectName).toBe('my-awesome-api')
  })

  it('should analyze architecture correctly', () => {
    const generator = new IntentGenerator(testRoot)
    const spec = generator.generate(mockInventory)

    expect(spec.architecture.pattern).toBe('API Service')
    expect(spec.architecture.hasAPI).toBe(true)
    expect(spec.architecture.hasDatabase).toBe(true)
  })

  it('should assess readiness correctly', () => {
    const generator = new IntentGenerator(testRoot)
    const spec = generator.generate(mockInventory, mockSecurity, mockCompliance)

    expect(spec.readiness.score).toBeGreaterThan(70)
    expect(spec.readiness.level).toBe('production-ready')
  })

  it('should generate recommendations', () => {
    const inventoryNoIaC = { ...mockInventory, hasIaC: false }
    const generator = new IntentGenerator(testRoot)
    const spec = generator.generate(inventoryNoIaC)

    const recTitles = spec.recommendations.map(r => r.title)
    expect(recTitles).toContain('Add Infrastructure as Code')
  })

  it('should write DRAFT_SPEC.md', () => {
    const generator = new IntentGenerator(testRoot)
    const spec = generator.generate(mockInventory)
    const specPath = generator.writeDraftSpec(spec)

    expect(existsSync(specPath)).toBe(true)
    const content = readFileSync(specPath, 'utf-8')
    expect(content).toContain('# Project Specification')
    expect(content).toContain('API Service')
  })
})
