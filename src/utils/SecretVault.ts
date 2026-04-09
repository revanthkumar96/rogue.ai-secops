/**
 * SecretVault — Phase 1: Secret Management & Encryption Layer
 *
 * Wraps sensitive data in secure envelopes before deployment.
 * - AES-256-GCM encryption for local secrets
 * - Integration stubs for AWS Secrets Manager, GCP Secret Manager, Azure Key Vault
 * - Ensures secrets never written to disk in plaintext (SOC2/GDPR)
 * - Audit trail for all secret operations
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { CloudProvider } from '../coordinator/IaCFactory.js'

// ---------- Types ----------

export type SecretProviderType = 'local-encrypted' | 'aws-secrets-manager' | 'gcp-secret-manager' | 'azure-keyvault'

export interface SecretEntry {
  key: string
  provider: SecretProviderType
  createdAt: string
  updatedAt: string
  version: number
  metadata: Record<string, string>
}

export interface SecretAuditEntry {
  timestamp: string
  action: 'create' | 'read' | 'update' | 'delete' | 'rotate'
  key: string
  provider: SecretProviderType
  success: boolean
  error?: string
}

export interface VaultSummary {
  totalSecrets: number
  providers: Record<SecretProviderType, number>
  auditEntries: number
  lastActivity: string | null
}

interface EncryptedPayload {
  iv: string
  tag: string
  data: string
  salt: string
  algo: 'aes-256-gcm'
}

interface VaultState {
  version: number
  secrets: Record<string, { entry: SecretEntry; encrypted: EncryptedPayload }>
  audit: SecretAuditEntry[]
}

// ---------- Vault ----------

export class SecretVault {
  private rootDir: string
  private vaultDir: string
  private state: VaultState
  private masterKey: Buffer

  constructor(rootDir: string, passphrase?: string) {
    this.rootDir = rootDir
    this.vaultDir = join(rootDir, '.niro', 'vault')
    this.masterKey = this.deriveMasterKey(passphrase ?? 'niro-default-dev-key')
    this.state = this.loadState()
  }

  /**
   * Store a secret with encryption.
   */
  set(key: string, value: string, provider: SecretProviderType = 'local-encrypted', metadata: Record<string, string> = {}): void {
    const now = new Date().toISOString()
    const existing = this.state.secrets[key]

    const encrypted = this.encrypt(value)

    this.state.secrets[key] = {
      entry: {
        key,
        provider,
        createdAt: existing?.entry.createdAt ?? now,
        updatedAt: now,
        version: (existing?.entry.version ?? 0) + 1,
        metadata,
      },
      encrypted,
    }

    this.audit(existing ? 'update' : 'create', key, provider, true)
    this.saveState()
  }

  /**
   * Retrieve and decrypt a secret.
   */
  get(key: string): string | null {
    const record = this.state.secrets[key]
    if (!record) {
      this.audit('read', key, 'local-encrypted', false, 'Secret not found')
      return null
    }

    try {
      const value = this.decrypt(record.encrypted)
      this.audit('read', key, record.entry.provider, true)
      return value
    } catch (err: any) {
      this.audit('read', key, record.entry.provider, false, err.message)
      return null
    }
  }

  /**
   * Delete a secret.
   */
  delete(key: string): boolean {
    if (!this.state.secrets[key]) return false
    const provider = this.state.secrets[key]!.entry.provider
    delete this.state.secrets[key]
    this.audit('delete', key, provider, true)
    this.saveState()
    return true
  }

  /**
   * List all secret entries (without values).
   */
  list(): SecretEntry[] {
    return Object.values(this.state.secrets).map(s => s.entry)
  }

  /**
   * Check if a secret exists.
   */
  has(key: string): boolean {
    return key in this.state.secrets
  }

  /**
   * Generate terraform-compatible secret references for a cloud provider.
   */
  generateTerraformRefs(provider: CloudProvider): string {
    const secrets = this.list().filter(s => {
      if (provider === 'aws') return s.provider === 'aws-secrets-manager'
      if (provider === 'gcp') return s.provider === 'gcp-secret-manager'
      if (provider === 'azure') return s.provider === 'azure-keyvault'
      return s.provider === 'local-encrypted'
    })

    if (secrets.length === 0) return '# No secrets configured for this provider\n'

    const lines: string[] = []
    lines.push(`# Secret references for ${provider} — managed by NiRo.ai SecretVault`)
    lines.push('# WARNING: Never commit actual secret values to source control')
    lines.push('')

    for (const secret of secrets) {
      const tfKey = secret.key.replace(/[^a-zA-Z0-9_]/g, '_')
      switch (provider) {
        case 'aws':
          lines.push(`data "aws_secretsmanager_secret_version" "${tfKey}" {`)
          lines.push(`  secret_id = "${secret.key}"`)
          lines.push('}')
          break
        case 'gcp':
          lines.push(`data "google_secret_manager_secret_version" "${tfKey}" {`)
          lines.push(`  secret = "${secret.key}"`)
          lines.push('}')
          break
        case 'azure':
          lines.push(`data "azurerm_key_vault_secret" "${tfKey}" {`)
          lines.push(`  name         = "${secret.key}"`)
          lines.push('  key_vault_id = azurerm_key_vault.main.id')
          lines.push('}')
          break
      }
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Get vault summary.
   */
  summary(): VaultSummary {
    const entries = Object.values(this.state.secrets)
    const providers: Record<SecretProviderType, number> = {
      'local-encrypted': 0,
      'aws-secrets-manager': 0,
      'gcp-secret-manager': 0,
      'azure-keyvault': 0,
    }

    for (const { entry } of entries) {
      providers[entry.provider] = (providers[entry.provider] ?? 0) + 1
    }

    return {
      totalSecrets: entries.length,
      providers,
      auditEntries: this.state.audit.length,
      lastActivity: this.state.audit.length > 0
        ? this.state.audit[this.state.audit.length - 1]!.timestamp
        : null,
    }
  }

  /**
   * Get audit log.
   */
  getAuditLog(): SecretAuditEntry[] {
    return [...this.state.audit]
  }

  // ---------- Encryption ----------

  private encrypt(plaintext: string): EncryptedPayload {
    const salt = randomBytes(16)
    const key = scryptSync(this.masterKey, salt, 32)
    const iv = randomBytes(12)

    const cipher = createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()])
    const tag = cipher.getAuthTag()

    return {
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      data: encrypted.toString('hex'),
      salt: salt.toString('hex'),
      algo: 'aes-256-gcm',
    }
  }

  private decrypt(payload: EncryptedPayload): string {
    const salt = Buffer.from(payload.salt, 'hex')
    const key = scryptSync(this.masterKey, salt, 32)
    const iv = Buffer.from(payload.iv, 'hex')
    const tag = Buffer.from(payload.tag, 'hex')
    const data = Buffer.from(payload.data, 'hex')

    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return decipher.update(data).toString('utf-8') + decipher.final('utf-8')
  }

  private deriveMasterKey(passphrase: string): Buffer {
    return scryptSync(passphrase, 'niro-vault-salt-v1', 32)
  }

  // ---------- Audit ----------

  private audit(
    action: SecretAuditEntry['action'],
    key: string,
    provider: SecretProviderType,
    success: boolean,
    error?: string,
  ): void {
    this.state.audit.push({
      timestamp: new Date().toISOString(),
      action,
      key,
      provider,
      success,
      error,
    })

    // Keep last 1000 audit entries
    if (this.state.audit.length > 1000) {
      this.state.audit = this.state.audit.slice(-1000)
    }
  }

  // ---------- State persistence ----------

  private loadState(): VaultState {
    const stateFile = join(this.vaultDir, 'vault.json')
    if (!existsSync(stateFile)) {
      return { version: 1, secrets: {}, audit: [] }
    }
    try {
      return JSON.parse(readFileSync(stateFile, 'utf-8'))
    } catch {
      return { version: 1, secrets: {}, audit: [] }
    }
  }

  private saveState(): void {
    if (!existsSync(this.vaultDir)) {
      mkdirSync(this.vaultDir, { recursive: true })
    }
    writeFileSync(
      join(this.vaultDir, 'vault.json'),
      JSON.stringify(this.state, null, 2),
      'utf-8',
    )
  }
}
