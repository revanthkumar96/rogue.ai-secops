/**
 * `niro infra` — Phase 1 CLI command
 *
 * Generates production-ready Infrastructure-as-Code by:
 * 1. Loading Phase 0 ProjectInventory (runs /diagnose if missing)
 * 2. Running IaCFactory to generate Terraform HCL
 * 3. Validating with ComplianceGuard (GDPR region, SOC2 encryption)
 * 4. Registering environment with InfrastructureManager
 * 5. Writing files to infra/<environment>/
 *
 * Usage: /infra [aws|gcp|azure|local] [development|staging|production]
 */

import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import type { LocalCommandCall } from '../../types/command.js'
import type { ProjectInventory } from '../../coordinator/DiscoveryEngine.js'
import { DiscoveryEngine } from '../../coordinator/DiscoveryEngine.js'
import { IaCFactory, type CloudProvider, type EnvironmentTier } from '../../coordinator/IaCFactory.js'
import { ComplianceGuard } from '../../schemas/compliance.js'
import { EnvironmentManager } from '../../tools/InfrastructureManager.js'
import { SecretVault } from '../../utils/SecretVault.js'

const VALID_PROVIDERS = new Set<CloudProvider>(['aws', 'gcp', 'azure', 'local'])
const VALID_TIERS = new Set<EnvironmentTier>(['development', 'staging', 'production'])
const TIER_ALIASES: Record<string, EnvironmentTier> = {
  dev: 'development',
  stage: 'staging',
  staging: 'staging',
  prod: 'production',
  production: 'production',
  development: 'development',
}

export const call: LocalCommandCall = async (args, _context) => {
  const parts = (args ?? '').trim().split(/\s+/).filter(Boolean)
  // Parse arguments
  let provider: CloudProvider = 'aws'
  let tier: EnvironmentTier = 'development'
  let targetDir = process.cwd()

  for (const part of parts) {
    const lower = part.toLowerCase()
    if (VALID_PROVIDERS.has(lower as CloudProvider)) {
      provider = lower as CloudProvider
    } else if (lower in TIER_ALIASES) {
      tier = TIER_ALIASES[lower]!
    } else if (existsSync(resolve(part))) {
      targetDir = resolve(part)
    }
  }

  const lines: string[] = []
  lines.push('')
  lines.push('  NiRo.ai Phase 1: Infrastructure as Code')
  lines.push('  ========================================')
  lines.push(`  Provider: ${provider} | Environment: ${tier}`)
  lines.push(`  Target: ${targetDir}`)
  lines.push('')

  // Step 1: Load or generate Phase 0 inventory
  lines.push('  [1/5] Loading project inventory...')
  let inventory: ProjectInventory

  const inventoryPath = join(targetDir, '.niro', 'PROJECT_INVENTORY.json')
  if (existsSync(inventoryPath)) {
    try {
      inventory = JSON.parse(readFileSync(inventoryPath, 'utf-8'))
      lines.push(`    -> Loaded existing inventory (${inventory.fileCount} files, ${inventory.primaryLanguage})`)
    } catch {
      lines.push('    -> Existing inventory corrupt, re-scanning...')
      const discovery = new DiscoveryEngine(targetDir)
      inventory = await discovery.scan()
    }
  } else {
    lines.push('    -> No Phase 0 inventory found, running discovery...')
    const discovery = new DiscoveryEngine(targetDir)
    inventory = await discovery.scan()
    lines.push(`    -> Scanned ${inventory.fileCount} files (${inventory.primaryLanguage}, ${inventory.projectType})`)
  }
  lines.push('')

  // Step 2: Generate IaC config from inventory
  lines.push('  [2/5] Generating infrastructure config...')
  const factory = new IaCFactory(targetDir)
  const config = factory.configFromInventory(inventory, provider, tier)

  lines.push(`    -> Project: ${config.projectName}`)
  lines.push(`    -> Region: ${config.region}`)
  lines.push(`    -> Networking: VPC ${config.networking.vpcCidr}`)
  if (config.database) {
    lines.push(`    -> Database: ${config.database.engine} (${config.database.instanceClass}, encrypted=${config.database.encrypted})`)
  } else {
    lines.push('    -> Database: none detected')
  }
  if (config.cluster) {
    lines.push(`    -> Cluster: ${config.cluster.type} (${config.cluster.nodeCount} nodes, k8s ${config.cluster.kubernetesVersion})`)
  } else {
    lines.push('    -> Cluster: not required')
  }
  lines.push(`    -> State: ${config.stateBackend.type} (encrypted=${config.stateBackend.encrypt})`)
  lines.push('')

  // Step 3: Compliance validation
  lines.push('  [3/5] Running compliance validation...')
  const guard = new ComplianceGuard({
    requireEU: tier === 'production',
  })
  const validation = guard.validateConfig(config)

  if (validation.violations.length === 0) {
    lines.push('    -> All checks passed')
  } else {
    for (const v of validation.violations) {
      const icon = v.severity === 'error' ? 'FAIL' : 'WARN'
      lines.push(`    -> [${icon}] ${v.rule}: ${v.message}`)
    }
  }

  if (!validation.allowed) {
    lines.push('')
    lines.push('  BLOCKED: Compliance violations prevent deployment.')
    lines.push('  Fix the errors above and retry.')
    lines.push('')
    return { type: 'text', value: lines.join('\n') }
  }
  lines.push('')

  // Step 4: Generate Terraform files
  lines.push('  [4/5] Generating Terraform files...')
  const generated = factory.generate(config)
  const infraDir = factory.writeToDisk(generated)

  for (const file of generated.files) {
    lines.push(`    -> ${file.path} (${file.description})`)
  }

  // Generate secret references if vault has secrets
  const vault = new SecretVault(targetDir)
  const secretRefs = vault.generateTerraformRefs(provider)
  if (!secretRefs.includes('No secrets configured')) {
    const { writeFileSync: wfs } = await import('fs')
    wfs(join(infraDir, 'secrets.tf'), secretRefs, 'utf-8')
    lines.push('    -> secrets.tf (Secret manager references)')
  }

  lines.push(`    -> Written to: ${infraDir}`)
  lines.push('')

  // Step 5: Register environment
  lines.push('  [5/5] Registering environment...')
  const envManager = new EnvironmentManager(targetDir)
  const env = envManager.register(generated, {
    name: config.projectName,
    tier,
    ttlHours: tier === 'development' ? 24 : tier === 'staging' ? 72 : undefined,
  })

  lines.push(`    -> Environment ID: ${env.id}`)
  lines.push(`    -> Status: ${env.status}`)
  if (env.expiresAt) {
    lines.push(`    -> TTL expires: ${env.expiresAt}`)
  }
  lines.push('')

  // Summary
  lines.push('  ========================================')
  lines.push('  Summary')
  lines.push('  ========================================')
  lines.push(`  Provider       : ${provider}`)
  lines.push(`  Environment    : ${tier}`)
  lines.push(`  Region         : ${config.region}`)
  lines.push(`  Files generated: ${generated.files.length}`)
  lines.push(`  Compliance     : ${validation.violations.length === 0 ? 'PASSED' : `${validation.violations.length} warning(s)`}`)
  lines.push('')
  lines.push('  Next steps:')
  lines.push(`    cd ${infraDir}`)
  lines.push('    terraform init')
  lines.push(`    terraform plan -var-file=terraform.${tier}.tfvars`)
  lines.push(`    terraform apply -var-file=terraform.${tier}.tfvars`)
  lines.push('')

  return { type: 'text', value: lines.join('\n') }
}
