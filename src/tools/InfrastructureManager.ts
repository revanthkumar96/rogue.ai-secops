/**
 * InfrastructureManager — Phase 1: Ephemeral Environment Orchestrator
 *
 * Manages the lifecycle of infrastructure environments:
 * - Create/destroy ephemeral environments with TTL
 * - Track environment state and metadata
 * - Orchestrate terraform plan/apply/destroy
 * - Isolate environments (DB, networking, secrets)
 *
 * Connects to IaCFactory (Phase 1) and ProjectInventory (Phase 0).
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { CloudProvider, EnvironmentTier, GeneratedIaC, IaCConfig } from '../coordinator/IaCFactory.js'

// ---------- Types ----------

export type EnvironmentStatus = 'pending' | 'provisioning' | 'active' | 'destroying' | 'destroyed' | 'failed'

export interface EnvironmentRecord {
  id: string
  name: string
  provider: CloudProvider
  tier: EnvironmentTier
  status: EnvironmentStatus
  createdAt: string
  expiresAt: string | null
  infraDir: string
  config: IaCConfig
  outputs: Record<string, string>
  lastError?: string
}

export interface EnvironmentCreateOptions {
  name: string
  tier: EnvironmentTier
  ttlHours?: number
  autoApply?: boolean
}

export interface TerraformResult {
  success: boolean
  output: string
  command: string
  duration: number
}

export interface EnvironmentSummary {
  total: number
  active: number
  expired: number
  failed: number
  environments: EnvironmentRecord[]
}

// ---------- Manager ----------

export class EnvironmentManager {
  private rootDir: string
  private stateDir: string
  private environments: Map<string, EnvironmentRecord> = new Map()

  constructor(rootDir: string) {
    this.rootDir = rootDir
    this.stateDir = join(rootDir, '.niro', 'environments')
    this.loadState()
  }

  /**
   * Register a new environment from generated IaC.
   */
  register(generated: GeneratedIaC, options: EnvironmentCreateOptions): EnvironmentRecord {
    const id = `${options.name}-${options.tier}-${Date.now()}`
    const now = new Date()
    const expiresAt = options.ttlHours
      ? new Date(now.getTime() + options.ttlHours * 60 * 60 * 1000).toISOString()
      : null

    const record: EnvironmentRecord = {
      id,
      name: options.name,
      provider: generated.provider,
      tier: options.tier,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt,
      infraDir: join(this.rootDir, 'infra', options.tier),
      config: generated.config,
      outputs: {},
    }

    this.environments.set(id, record)
    this.saveState()
    return record
  }

  /**
   * Run terraform init + plan for an environment.
   */
  plan(envId: string): TerraformResult {
    const env = this.getOrThrow(envId)
    const initResult = this.runTerraform(env.infraDir, 'init', ['-input=false'])
    if (!initResult.success) {
      this.updateStatus(envId, 'failed', initResult.output)
      return initResult
    }

    const planResult = this.runTerraform(env.infraDir, 'plan', [
      '-input=false',
      `-var-file=terraform.${env.tier}.tfvars`,
      '-out=tfplan',
    ])

    if (!planResult.success) {
      this.updateStatus(envId, 'failed', planResult.output)
    }

    return planResult
  }

  /**
   * Run terraform apply for an environment.
   */
  apply(envId: string): TerraformResult {
    const env = this.getOrThrow(envId)
    this.updateStatus(envId, 'provisioning')

    const result = this.runTerraform(env.infraDir, 'apply', [
      '-input=false',
      '-auto-approve',
      'tfplan',
    ])

    if (result.success) {
      this.updateStatus(envId, 'active')
      this.captureOutputs(envId)
    } else {
      this.updateStatus(envId, 'failed', result.output)
    }

    return result
  }

  /**
   * Destroy an environment's infrastructure.
   */
  destroy(envId: string): TerraformResult {
    const env = this.getOrThrow(envId)
    this.updateStatus(envId, 'destroying')

    const result = this.runTerraform(env.infraDir, 'destroy', [
      '-input=false',
      '-auto-approve',
      `-var-file=terraform.${env.tier}.tfvars`,
    ])

    if (result.success) {
      this.updateStatus(envId, 'destroyed')
    } else {
      this.updateStatus(envId, 'failed', result.output)
    }

    return result
  }

  /**
   * Find and destroy all expired environments.
   */
  cleanupExpired(): string[] {
    const destroyed: string[] = []
    const now = new Date()

    for (const [id, env] of this.environments) {
      if (
        env.status === 'active' &&
        env.expiresAt &&
        new Date(env.expiresAt) <= now
      ) {
        this.destroy(id)
        destroyed.push(id)
      }
    }

    return destroyed
  }

  /**
   * Get a summary of all environments.
   */
  summary(): EnvironmentSummary {
    const envs = Array.from(this.environments.values())
    const now = new Date()

    return {
      total: envs.length,
      active: envs.filter(e => e.status === 'active').length,
      expired: envs.filter(e =>
        e.status === 'active' && e.expiresAt && new Date(e.expiresAt) <= now
      ).length,
      failed: envs.filter(e => e.status === 'failed').length,
      environments: envs,
    }
  }

  /**
   * Get a single environment record.
   */
  get(envId: string): EnvironmentRecord | undefined {
    return this.environments.get(envId)
  }

  /**
   * List all environments.
   */
  list(): EnvironmentRecord[] {
    return Array.from(this.environments.values())
  }

  // ---------- Internal ----------

  private getOrThrow(envId: string): EnvironmentRecord {
    const env = this.environments.get(envId)
    if (!env) throw new Error(`Environment not found: ${envId}`)
    return env
  }

  private updateStatus(envId: string, status: EnvironmentStatus, error?: string): void {
    const env = this.getOrThrow(envId)
    env.status = status
    if (error) env.lastError = error
    this.saveState()
  }

  private captureOutputs(envId: string): void {
    const env = this.getOrThrow(envId)
    try {
      const result = execSync('terraform output -json', {
        cwd: env.infraDir,
        encoding: 'utf-8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      const outputs = JSON.parse(result)
      env.outputs = {}
      for (const [key, val] of Object.entries(outputs) as [string, any][]) {
        // Never store sensitive outputs in state
        if (!val.sensitive) {
          env.outputs[key] = String(val.value)
        }
      }
      this.saveState()
    } catch {
      // outputs not available — that's fine
    }
  }

  private runTerraform(cwd: string, command: string, args: string[]): TerraformResult {
    const fullCmd = `terraform ${command} ${args.join(' ')}`
    const start = Date.now()

    try {
      const output = execSync(fullCmd, {
        cwd,
        encoding: 'utf-8',
        timeout: 300000, // 5 min
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      return {
        success: true,
        output,
        command: fullCmd,
        duration: Date.now() - start,
      }
    } catch (err: any) {
      return {
        success: false,
        output: err.stderr ?? err.stdout ?? err.message ?? 'Unknown error',
        command: fullCmd,
        duration: Date.now() - start,
      }
    }
  }

  // ---------- State persistence ----------

  private loadState(): void {
    const stateFile = join(this.stateDir, 'state.json')
    if (!existsSync(stateFile)) return

    try {
      const data = JSON.parse(readFileSync(stateFile, 'utf-8'))
      if (Array.isArray(data.environments)) {
        for (const env of data.environments) {
          this.environments.set(env.id, env)
        }
      }
    } catch {
      // corrupt state — start fresh
    }
  }

  private saveState(): void {
    if (!existsSync(this.stateDir)) {
      mkdirSync(this.stateDir, { recursive: true })
    }

    const data = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      environments: Array.from(this.environments.values()),
    }

    writeFileSync(
      join(this.stateDir, 'state.json'),
      JSON.stringify(data, null, 2),
      'utf-8',
    )
  }
}
