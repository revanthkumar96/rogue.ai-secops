import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { EnvironmentManager } from '../../tools/InfrastructureManager.js'
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// Mock child_process
mock.module('child_process', () => ({
  execSync: (cmd: string) => {
    if (cmd.includes('terraform output')) {
      return JSON.stringify({
        cluster_endpoint: { value: 'https://eks.amazonaws.com', sensitive: false },
        db_password: { value: 'secret', sensitive: true }
      })
    }
    return 'Terraform success output'
  }
}))

describe('EnvironmentManager', () => {
  let testRoot: string

  beforeEach(() => {
    testRoot = join(tmpdir(), `niro-env-test-${Math.random().toString(36).slice(2)}`)
    if (!existsSync(testRoot)) {
      mkdirSync(testRoot, { recursive: true })
    }
  })

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
  })

  const mockGenerated = {
    provider: 'aws' as const,
    environment: 'development' as const,
    files: [],
    config: {
      provider: 'aws',
      region: 'us-east-1',
      environment: 'development',
      projectName: 'test',
      stateBackend: { type: 's3', encrypt: true },
      networking: { vpcCidr: '10.0.0.0/16', publicSubnets: [], privateSubnets: [], enableNat: true, enableVpn: false },
      secrets: { provider: 'aws-secrets-manager' },
      tags: {}
    } as any
  }

  it('should register a new environment', () => {
    const manager = new EnvironmentManager(testRoot)
    const env = manager.register(mockGenerated, { name: 'dev-env', tier: 'development', ttlHours: 2 })

    expect(env.name).toBe('dev-env')
    expect(env.status).toBe('pending')
    expect(env.expiresAt).not.toBeNull()
  })

  it('should run terraform lifecycle steps', () => {
    const manager = new EnvironmentManager(testRoot)
    const env = manager.register(mockGenerated, { name: 'test', tier: 'development' })

    // Simulate directory existence for infraDir
    const infraDir = join(testRoot, 'infra', 'development')
    mkdirSync(infraDir, { recursive: true })

    const planResult = manager.plan(env.id)
    expect(planResult.success).toBe(true)
    
    const applyResult = manager.apply(env.id)
    expect(applyResult.success).toBe(true)
    
    const updatedEnv = manager.get(env.id)
    expect(updatedEnv?.status).toBe('active')
    expect(updatedEnv?.outputs.cluster_endpoint).toBe('https://eks.amazonaws.com')
    expect(updatedEnv?.outputs.db_password).toBeUndefined() // sensitive
  })

  it('should cleanup expired environments', async () => {
    const manager = new EnvironmentManager(testRoot)
    
    // Register one expired environment manually by poking at internal map if needed, 
    // but we can just use register with 0 TTL if it was supported.
    // Instead, I'll register and then simulate time passing by mocking the record.
    const env = manager.register(mockGenerated, { name: 'old', tier: 'development', ttlHours: -1 })
    manager.apply(env.id) // mark as active

    const destroyed = manager.cleanupExpired()
    expect(destroyed).toContain(env.id)
    expect(manager.get(env.id)?.status).toBe('destroyed')
  })
})
