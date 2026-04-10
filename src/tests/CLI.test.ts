import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { call as diagnoseCall } from '../commands/diagnose/diagnose.js'
import { call as infraCall } from '../commands/infra/infra.js'
import { call as qualityCall } from '../commands/quality/quality.js'
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('CLI E2E: /diagnose', () => {
  let testRoot: string

  beforeEach(() => {
    testRoot = join(tmpdir(), `niro-cli-test-${Math.random().toString(36).slice(2)}`)
    if (!existsSync(testRoot)) {
      mkdirSync(testRoot, { recursive: true })
    }
  })

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
  })

  it('should run full diagnostics and generate reports', async () => {
    // Create a dummy project
    writeFileSync(join(testRoot, 'package.json'), JSON.stringify({ name: 'test-project', dependencies: { 'express': '*' } }))
    writeFileSync(join(testRoot, 'server.ts'), 'import express from "express"')
    writeFileSync(join(testRoot, 'utils.ts'), 'export const a = 1')
    writeFileSync(join(testRoot, '.gitignore'), '.env')

    const result = await diagnoseCall(testRoot, {} as any)

    if (result.type !== 'text') {
      throw new Error(`Expected text result, got ${result.type}`)
    }

    expect(result.type).toBe('text')
    expect(result.value).toContain('NiRo.ai Phase 0: Project Diagnostics')
    expect(result.value).toContain('Language: typescript')
    expect(result.value).toContain('Type: api-service')

    // Verify files were generated in .niro/
    const niroDir = join(testRoot, '.niro')
    expect(existsSync(join(niroDir, 'PROJECT_INVENTORY.json'))).toBe(true)
    expect(existsSync(join(niroDir, 'SECURITY_REPORT.json'))).toBe(true)
    expect(existsSync(join(niroDir, 'COMPLIANCE_REPORT.json'))).toBe(true)
    expect(existsSync(join(niroDir, 'DRAFT_SPEC.md'))).toBe(true)

    const inventory = JSON.parse(readFileSync(join(niroDir, 'PROJECT_INVENTORY.json'), 'utf-8'))
    expect(inventory.projectType).toBe('api-service')

    const spec = readFileSync(join(niroDir, 'DRAFT_SPEC.md'), 'utf-8')
    expect(spec).toContain('# Project Specification: test-project')
  })

  it('should generate IaC via /infra command', async () => {
    // 1. Prepare inventory (mock Phase 0 output)
    const niroDir = join(testRoot, '.niro')
    mkdirSync(niroDir, { recursive: true })
    const mockInventory = {
      fileCount: 5,
      primaryLanguage: 'typescript',
      projectType: 'api-service',
      databases: [{ type: 'postgresql' }],
      frameworks: [{ name: 'express' }],
      entryPoints: [],
      dependencies: [],
      languages: [],
      packageManagers: [],
      hasTests: true,
      hasCICD: false,
      hasDocker: true,
      hasIaC: false,
      rootDir: testRoot,
      scanTimestamp: new Date().toISOString()
    }
    writeFileSync(join(niroDir, 'PROJECT_INVENTORY.json'), JSON.stringify(mockInventory))

    // 2. Call /infra
    const result = await infraCall(`${testRoot} aws development`, {} as any)

    if (result.type !== 'text') {
      throw new Error(`Expected text result, got ${result.type}`)
    }

    expect(result.value).toContain('NiRo.ai Phase 1: Infrastructure as Code')
    expect(result.value).toContain('Provider: aws | Environment: development')

    // 3. Verify files on disk
    const infraDir = join(testRoot, 'infra', 'development')
    expect(existsSync(join(infraDir, 'main.tf'))).toBe(true)
    expect(existsSync(join(infraDir, 'database.tf'))).toBe(true)
    expect(existsSync(join(infraDir, 'terraform.development.tfvars'))).toBe(true)

    // 4. Verify environment registration
    const envState = join(testRoot, '.niro', 'environments', 'state.json')
    expect(existsSync(envState)).toBe(true)
    const state = JSON.parse(readFileSync(envState, 'utf-8'))
    expect(state.environments.length).toBe(1)
    expect(state.environments[0].tier).toBe('development')
  })

  it('should run quality gates via /quality command', async () => {
    // 1. Prepare data (mock Phase 0 & 1 outputs)
    const niroDir = join(testRoot, '.niro')
    mkdirSync(niroDir, { recursive: true })
    
    const mockInventory = { rootDir: testRoot, fileCount: 10, primaryLanguage: 'typescript', projectType: 'web-app', entryPoints: [], frameworks: [], databases: [], dependencies: [], languages: [], packageManagers: [], hasTests: false, hasCICD: false, hasDocker: false, hasIaC: false, scanTimestamp: new Date().toISOString() }
    const mockSecurity = { summary: { totalVulnerabilities: 0, critical: 0, high: 0, medium: 0, low: 0, secretsDetected: 0, riskScore: 0 }, vulnerabilities: [], secrets: [], timestamp: new Date().toISOString(), scanDuration: 0 }
    
    writeFileSync(join(niroDir, 'PROJECT_INVENTORY.json'), JSON.stringify(mockInventory))
    writeFileSync(join(niroDir, 'SECURITY_REPORT.json'), JSON.stringify(mockSecurity))

    // 2. Call /quality
    const result = await qualityCall(`${testRoot} production`, {} as any)

    if (result.type !== 'text') {
      throw new Error(`Expected text result, got ${result.type}`)
    }

    expect(result.value).toContain('NiRo.ai Phase 2: Intelligent Quality Gates')
    expect(result.value).toContain('Environment: production')

    // 3. Verify reports generated
    expect(existsSync(join(niroDir, 'TEST_STRATEGY.json'))).toBe(true)
    expect(existsSync(join(niroDir, 'QUALITY_GATE_REPORT.json'))).toBe(true)
    expect(existsSync(join(niroDir, 'SYNTHETIC_TEST_DATA.json'))).toBe(true)

    // 4. Verify synthetic data content
    const synthData = JSON.parse(readFileSync(join(niroDir, 'SYNTHETIC_TEST_DATA.json'), 'utf-8'))
    expect(synthData.profiles.length).toBe(10)
    expect(synthData.metadata.gdprCompliant).toBe(true)
  })
})
