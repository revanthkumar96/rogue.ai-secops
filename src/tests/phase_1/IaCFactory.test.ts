import { describe, it, expect } from 'bun:test'
import { IaCFactory } from '../../coordinator/IaCFactory.js'
import type { ProjectInventory } from '../../coordinator/DiscoveryEngine.js'

describe('IaCFactory', () => {
  const mockInventory: ProjectInventory = {
    scanTimestamp: new Date().toISOString(),
    rootDir: '/fake/root/my-project',
    languages: [{ language: 'typescript', fileCount: 10, percentage: 100 }],
    primaryLanguage: 'typescript',
    frameworks: [{ name: 'express', confidence: 1, evidence: [] }],
    databases: [{ type: 'postgresql', confidence: 1, evidence: [] }],
    dependencies: [{ name: 'express', version: '*', type: 'production' }],
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

  it('should generate AWS production config correctly', () => {
    const factory = new IaCFactory('/fake/root')
    const config = factory.configFromInventory(mockInventory, 'aws', 'production')

    expect(config.provider).toBe('aws')
    expect(config.environment).toBe('production')
    expect(config.projectName).toBe('my-project')
    expect(config.database?.multiAz).toBe(true)
    expect(config.cluster?.nodeCount).toBe(3)
    expect(config.stateBackend.type).toBe('s3')
  })

  it('should generate GCP development config correctly', () => {
    const factory = new IaCFactory('/fake/root')
    const config = factory.configFromInventory(mockInventory, 'gcp', 'development')

    expect(config.provider).toBe('gcp')
    expect(config.environment).toBe('development')
    expect(config.database?.multiAz).toBe(false)
    expect(config.cluster?.nodeCount).toBe(1)
    expect(config.stateBackend.type).toBe('gcs')
  })

  it('should render HCL files without errors', () => {
    const factory = new IaCFactory('/fake/root')
    const config = factory.configFromInventory(mockInventory, 'aws', 'development')
    const generated = factory.generate(config)

    expect(generated.files.length).toBeGreaterThan(5)
    const mainTf = generated.files.find(f => f.path === 'main.tf')?.content
    expect(mainTf).toContain('provider "aws"')
    
    const dbTf = generated.files.find(f => f.path === 'database.tf')?.content
    expect(dbTf).toContain('module "database"')
  })

  it('should sanitize project names', () => {
    const factory = new IaCFactory('/fake/root')
    const weirdInventory = { ...mockInventory, rootDir: '/fake/root/My Awesome! Project @123' }
    const config = factory.configFromInventory(weirdInventory, 'aws', 'development')

    expect(config.projectName).toBe('my-awesome-project-123')
  })
})
