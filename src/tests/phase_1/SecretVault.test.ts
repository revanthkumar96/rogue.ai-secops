import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { SecretVault } from '../../utils/SecretVault.js'
import { mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('SecretVault', () => {
  let testRoot: string

  beforeEach(() => {
    testRoot = join(tmpdir(), `niro-vault-test-${Math.random().toString(36).slice(2)}`)
    if (!existsSync(testRoot)) {
      mkdirSync(testRoot, { recursive: true })
    }
  })

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
  })

  it('should store and retrieve secrets with direct encryption', () => {
    const vault = new SecretVault(testRoot, 'test-passphrase')
    const secretKey = 'DB_PASSWORD'
    const secretValue = 'super-secret-123'

    vault.set(secretKey, secretValue)
    const retrieved = vault.get(secretKey)

    expect(retrieved).toBe(secretValue)
  })

  it('should persist secrets to disk in encrypted form', () => {
    const vault = new SecretVault(testRoot, 'test-passphrase')
    vault.set('API_KEY', 'abcdef-12345')

    // Create a new vault instance to check persistence
    const vault2 = new SecretVault(testRoot, 'test-passphrase')
    expect(vault2.get('API_KEY')).toBe('abcdef-12345')
  })

  it('should fail to decrypt with wrong passphrase', () => {
    const vault = new SecretVault(testRoot, 'pass-1')
    vault.set('KEY', 'VALUE')

    const vault2 = new SecretVault(testRoot, 'pass-2') // Different passphrase
    const retrieved = vault2.get('KEY')

    expect(retrieved).toBeNull()
  })

  it('should maintain an audit log', () => {
    const vault = new SecretVault(testRoot, 'test-passphrase')
    vault.set('K1', 'V1')
    vault.get('K1')
    vault.delete('K1')

    const audit = vault.getAuditLog()
    expect(audit.length).toBe(3)
    expect(audit[0].action).toBe('create')
    expect(audit[1].action).toBe('read')
    expect(audit[2].action).toBe('delete')
  })

  it('should generate terraform reference blocks', () => {
    const vault = new SecretVault(testRoot, 'test-passphrase')
    vault.set('db-password', 'v1', 'aws-secrets-manager')
    vault.set('api-token', 'v2', 'gcp-secret-manager')

    const awsRefs = vault.generateTerraformRefs('aws')
    expect(awsRefs).toContain('data "aws_secretsmanager_secret_version" "db_password"')
    expect(awsRefs).not.toContain('api-token')

    const gcpRefs = vault.generateTerraformRefs('gcp')
    expect(gcpRefs).toContain('data "google_secret_manager_secret_version" "api_token"')
  })
})
