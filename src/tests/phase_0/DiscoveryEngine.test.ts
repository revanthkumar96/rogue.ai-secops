import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { DiscoveryEngine } from '../../coordinator/DiscoveryEngine.js'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('DiscoveryEngine', () => {
  let testRoot: string

  beforeEach(() => {
    testRoot = join(tmpdir(), `niro-tech-discovery-test-${Math.random().toString(36).slice(2)}`)
    if (!existsSync(testRoot)) {
      mkdirSync(testRoot, { recursive: true })
    }
  })

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
  })

  it('should detect languages correctly', async () => {
    writeFileSync(join(testRoot, 'main.ts'), 'console.log("hello")')
    writeFileSync(join(testRoot, 'core.ts'), 'console.log("world")')
    writeFileSync(join(testRoot, 'utils.py'), 'print("hello")')
    writeFileSync(join(testRoot, 'README.md'), '# Test')

    const engine = new DiscoveryEngine(testRoot)
    const inventory = await engine.scan()

    expect(inventory.primaryLanguage).toBe('typescript')
    expect(inventory.languages).toContainEqual(expect.objectContaining({ language: 'typescript' }))
    expect(inventory.languages).toContainEqual(expect.objectContaining({ language: 'python' }))
  })

  it('should parse dependencies from package.json', async () => {
    const pkg = {
      dependencies: {
        'express': '^4.18.2',
        'react': '^18.2.0'
      },
      devDependencies: {
        'typescript': '^5.0.0'
      }
    }
    writeFileSync(join(testRoot, 'package.json'), JSON.stringify(pkg))

    const engine = new DiscoveryEngine(testRoot)
    const inventory = await engine.scan()

    const depNames = inventory.dependencies.map(d => d.name)
    expect(depNames).toContain('express')
    expect(depNames).toContain('react')
    expect(depNames).toContain('typescript')
  })

  it('should detect frameworks correctly', async () => {
    const pkg = {
      dependencies: {
        'next': '^14.0.0'
      }
    }
    writeFileSync(join(testRoot, 'package.json'), JSON.stringify(pkg))
    writeFileSync(join(testRoot, 'next.config.js'), 'module.exports = {}')

    const engine = new DiscoveryEngine(testRoot)
    const inventory = await engine.scan()

    const frameworkNames = inventory.frameworks.map(f => f.name)
    expect(frameworkNames).toContain('next.js')
  })

  it('should detect databases correctly', async () => {
    writeFileSync(join(testRoot, '.env'), 'DATABASE_URL=postgres://localhost:5432/mydb')
    const pkg = {
      dependencies: {
        'pg': '^8.11.0'
      }
    }
    writeFileSync(join(testRoot, 'package.json'), JSON.stringify(pkg))

    const engine = new DiscoveryEngine(testRoot)
    const inventory = await engine.scan()

    const dbTypes = inventory.databases.map(d => d.type)
    expect(dbTypes).toContain('postgresql')
  })

  it('should classify project type correctly', async () => {
    // API Service detection
    const pkg = {
      dependencies: {
        'express': '^4.18.2'
      }
    }
    writeFileSync(join(testRoot, 'package.json'), JSON.stringify(pkg))
    writeFileSync(join(testRoot, 'server.ts'), '// server entry')

    const engine = new DiscoveryEngine(testRoot)
    const inventory = await engine.scan()

    expect(inventory.projectType).toBe('api-service')
  })

  it('should find entry points', async () => {
    writeFileSync(join(testRoot, 'index.ts'), '// entry')
    const pkg = {
      bin: {
        'my-cli': './bin/cli.js'
      }
    }
    writeFileSync(join(testRoot, 'package.json'), JSON.stringify(pkg))
    mkdirSync(join(testRoot, 'bin'))
    writeFileSync(join(testRoot, 'bin', 'cli.js'), '// cli entry')

    const engine = new DiscoveryEngine(testRoot)
    const inventory = await engine.scan()

    const entryPaths = inventory.entryPoints.map(e => e.path.replace(/\\/g, '/'))
    expect(entryPaths).toContain('index.ts')
    expect(entryPaths).toContain('./bin/cli.js')
  })

  it('should detect package managers', async () => {
    writeFileSync(join(testRoot, 'bun.lockb'), '')
    const engine = new DiscoveryEngine(testRoot)
    const inventory = await engine.scan()

    expect(inventory.packageManagers).toContain('bun')
  })
})
