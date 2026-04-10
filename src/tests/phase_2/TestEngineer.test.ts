import { describe, it, expect } from 'bun:test'
import { TestArchitect } from '../../assistant/TestEngineer.js'
import type { ProjectInventory } from '../../coordinator/DiscoveryEngine.js'

describe('TestArchitect (TestEngineer)', () => {
  const mockInventory: ProjectInventory = {
    scanTimestamp: new Date().toISOString(),
    rootDir: '/fake/root/my-app',
    languages: [{ language: 'typescript', fileCount: 10, percentage: 80 }, { language: 'json', fileCount: 2, percentage: 20 }],
    primaryLanguage: 'typescript',
    frameworks: [{ name: 'react', confidence: 1, evidence: [] }],
    databases: [{ type: 'mongodb', confidence: 1, evidence: [] }],
    dependencies: [{ name: 'react', version: '*', type: 'production' }],
    entryPoints: [{ path: 'src/main.tsx', type: 'main' }],
    projectType: 'web-app',
    fileCount: 12,
    directoryStructure: ['src', 'public'],
    packageManagers: ['npm'],
    hasTests: false,
    hasCICD: false,
    hasDocker: false,
    hasIaC: false
  }

  it('should design a test strategy for a web app', () => {
    const architect = new TestArchitect('/fake/root/my-app')
    const strategy = architect.designStrategy(mockInventory)

    expect(strategy.projectName).toBe('my-app')
    expect(strategy.projectType).toBe('web-app')
    expect(strategy.recommendedFrameworks.length).toBeGreaterThan(0)
    
    // Web app should recommend Vitest and Playwright
    const recNames = strategy.recommendedFrameworks.map(r => r.framework)
    expect(recNames).toContain('vitest')
    expect(recNames).toContain('playwright')
  })

  it('should recommend contract testing for API services', () => {
    const apiInventory = { ...mockInventory, projectType: 'api-service' as const }
    const architect = new TestArchitect('/fake/root/my-app')
    const strategy = architect.designStrategy(apiInventory)

    const layers = strategy.layers.map(l => l.layer)
    expect(layers).toContain('contract')
    expect(strategy.layers.find(l => l.layer === 'contract')?.framework).toBe('pact')
  })

  it('should estimate coverage requirements correctly', () => {
    const architect = new TestArchitect('/fake/root/my-app')
    const strategy = architect.designStrategy(mockInventory)

    expect(strategy.coverageTarget).toBe(80) // Default for most
  })

  it('should generate a summary report', () => {
    const architect = new TestArchitect('/fake/root/my-app')
    const strategy = architect.designStrategy(mockInventory)
    const coverage = architect.estimateCoverage(mockInventory)

    expect(coverage.overall).toBeDefined()
    expect(coverage.meetsSoc2).toBeDefined()
  })
})
