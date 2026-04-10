import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { PolicyAnalyzer, ComplianceGuard } from '../../schemas/compliance.js'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('PolicyAnalyzer', () => {
  let testRoot: string

  beforeEach(() => {
    testRoot = join(tmpdir(), `niro-compliance-test-${Math.random().toString(36).slice(2)}`)
    if (!existsSync(testRoot)) {
      mkdirSync(testRoot, { recursive: true })
    }
  })

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
  })

  it('should detect audit logging', async () => {
    writeFileSync(join(testRoot, 'app.ts'), 'const logger = winston.createLogger({})')
    const analyzer = new PolicyAnalyzer(testRoot)
    const report = await analyzer.analyze()

    const check = report.checks.find(c => c.id === 'SOC2-CC7.2-AUDIT')
    expect(check?.status).toBe('pass')
    expect(check?.evidence).toContain('Logging framework detected in source code')
  })

  it('should fail secret management if .env is not ignored', async () => {
    writeFileSync(join(testRoot, '.env'), 'KEY=VAL')
    // No .gitignore
    const analyzer = new PolicyAnalyzer(testRoot)
    const report = await analyzer.analyze()

    const check = report.checks.find(c => c.id === 'SOC2-CC6.1-SECRETS')
    expect(check?.status).toBe('fail')
  })

  it('should pass secret management if .env is ignored', async () => {
    writeFileSync(join(testRoot, '.env'), 'KEY=VAL')
    writeFileSync(join(testRoot, '.gitignore'), '.env')
    const analyzer = new PolicyAnalyzer(testRoot)
    const report = await analyzer.analyze()

    const check = report.checks.find(c => c.id === 'SOC2-CC6.1-SECRETS')
    expect(check?.status).toBe('warn') // warn because no secret manager tool detected
    expect(check?.evidence).toContain('.env is in .gitignore')
  })

  it('should detect PII fields', async () => {
    writeFileSync(join(testRoot, 'user.ts'), 'const userData = { email: "test@example.com", phoneNumber: "123456" }')
    const analyzer = new PolicyAnalyzer(testRoot)
    const report = await analyzer.analyze()

    const check = report.checks.find(c => c.id === 'GDPR-ART5-PII')
    expect(check?.status).toBe('warn')
    expect(check?.evidence.some(e => e.includes('email'))).toBe(true)
  })

  it('should calculate scores correctly', async () => {
    // Empty project should have low scores
    const analyzer = new PolicyAnalyzer(testRoot)
    const report = await analyzer.analyze()

    expect(report.score.overall).toBeLessThan(50)
    expect(report.score.failCount).toBeGreaterThan(0)
  })
})

describe('ComplianceGuard', () => {
  it('should validate regions correctly', () => {
    const guard = new ComplianceGuard({ requireEU: true })
    
    // AWS EU region
    const result1 = guard.validateRegion('aws', 'eu-west-1')
    expect(result1.allowed).toBe(true)

    // AWS non-EU region
    const result2 = guard.validateRegion('aws', 'us-east-1')
    expect(result2.allowed).toBe(false)
    expect(result2.violations[0].rule).toBe('GDPR_EU_ONLY')
  })

  it('should enforce SOC2 production rules', () => {
    const guard = new ComplianceGuard()
    
    const config = {
      provider: 'aws',
      region: 'us-east-1',
      environment: 'production',
      stateBackend: { encrypt: false },
      database: { encrypted: false, multiAz: false }
    }

    const result = guard.validateConfig(config)
    expect(result.allowed).toBe(false)
    const ruleIds = result.violations.map(v => v.rule)
    expect(ruleIds).toContain('SOC2_STATE_ENCRYPTION')
    expect(ruleIds).toContain('SOC2_DB_ENCRYPTION')
  })

  it('should pass if all production rules are met', () => {
    const guard = new ComplianceGuard()
    
    const config = {
      provider: 'aws',
      region: 'us-east-1',
      environment: 'production',
      stateBackend: { encrypt: true },
      database: { encrypted: true, multiAz: true }
    }

    const result = guard.validateConfig(config)
    expect(result.allowed).toBe(true)
    expect(result.violations.length).toBe(0)
  })
})
