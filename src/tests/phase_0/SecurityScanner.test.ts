import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { SecurityScanner } from '../../tools/SecurityScanner.js'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import * as cp from 'child_process'

const fromB64 = (s: string) => Buffer.from(s, 'base64').toString()
const FAKE_AWS_KEY = fromB64('QUtJQTEyMzQ1Njc4OTAxMjM0NTY=')
const FAKE_SLACK_TOKEN = fromB64('eG94Yi0xMjM0NTY3ODkwLTEyMzQ1Njc4OTAtYWJjZGVmMTIzNDU2Nzg5MGFiY2RlZjEyMzQ=')
const FAKE_GITHUB_TOKEN = fromB64('Z2hwXzEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3ODkwYWJjZGVmMTIzNA==')

// Mock child_process
mock.module('child_process', () => ({
  execSync: (cmd: string) => {
    if (cmd.includes('npm audit')) {
      return JSON.stringify({
        vulnerabilities: {
          'lodash': {
            severity: 'high',
            title: 'Prototype Pollution',
            via: [{ title: 'Prototype Pollution', url: 'https://nodesecurity.io/advisories/1065' }],
            fixAvailable: { version: '4.17.21' }
          }
        }
      })
    }
    if (cmd.includes('gitleaks')) {
      return '[]'
    }
    return ''
  }
}))

describe('SecurityScanner', () => {
  let testRoot: string

  beforeEach(() => {
    testRoot = join(tmpdir(), `niro-security-test-${Math.random().toString(36).slice(2)}`)
    if (!existsSync(testRoot)) {
      mkdirSync(testRoot, { recursive: true })
    }
  })

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
  })

  it('should detect hardcoded secrets via pattern scan', async () => {
    const secretFile = join(testRoot, 'secrets.ts')
    writeFileSync(secretFile, `
      const AWS_KEY = "${FAKE_AWS_KEY}"
      const STACK_TOKEN = "${FAKE_SLACK_TOKEN}"
    `)

    const scanner = new SecurityScanner(testRoot)
    const report = await scanner.scan()

    expect(report.summary.secretsDetected).toBeGreaterThanOrEqual(2)
    const ruleIds = report.secrets.map(s => s.ruleId)
    expect(ruleIds).toContain('hardcoded-aws-key')
    expect(ruleIds).toContain('hardcoded-slack-token')
  })

  it('should parse npm audit vulnerabilities', async () => {
    writeFileSync(join(testRoot, 'package.json'), '{}')

    const scanner = new SecurityScanner(testRoot)
    const report = await scanner.scan()

    expect(report.vulnerabilities.length).toBeGreaterThan(0)
    const lodashVuln = report.vulnerabilities.find(v => v.package === 'lodash')
    expect(lodashVuln).toBeDefined()
    expect(lodashVuln?.severity).toBe('high')
    expect(lodashVuln?.fixVersion).toBe('4.17.21')
  })

  it('should calculate risk score correctly', async () => {
    // 1 high vuln (15), 1 secret (20) = 35
    writeFileSync(join(testRoot, 'package.json'), '{}')
    writeFileSync(join(testRoot, 'test.py'), `aws_key = "${FAKE_AWS_KEY}"`)

    const scanner = new SecurityScanner(testRoot)
    const report = await scanner.scan()

    // Depending on if gitleaks mock returns anything, but pattern scan will find 1 secret
    expect(report.summary.riskScore).toBeGreaterThanOrEqual(35)
  })

  it('should redact secrets in the report', async () => {
    writeFileSync(join(testRoot, 'test.ts'), `const TOKEN = "${FAKE_GITHUB_TOKEN}"`)

    const scanner = new SecurityScanner(testRoot)
    const report = await scanner.scan()

    const match = report.secrets.find(s => s.ruleId === 'hardcoded-github-token')?.match
    expect(match).toContain('***REDACTED***')
    expect(match).not.toContain('ghp_1234567890abcdef')
  })
})
