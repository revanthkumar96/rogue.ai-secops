/**
 * `niro quality` — Phase 2 CLI command
 *
 * Runs the full quality gate pipeline:
 * 1. Loads Phase 0 inventory + security report
 * 2. Designs test strategy via TestArchitect
 * 3. Estimates coverage
 * 4. Runs QualityGatekeeper policy checks
 * 5. Generates synthetic test data sample
 *
 * Usage: /quality [development|staging|production]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import type { LocalCommandCall } from '../../types/command.js'
import type { ProjectInventory } from '../../coordinator/DiscoveryEngine.js'
import type { SecurityReport } from '../../tools/SecurityScanner.js'
import { DiscoveryEngine } from '../../coordinator/DiscoveryEngine.js'
import { SecurityScanner } from '../../tools/SecurityScanner.js'
import { TestArchitect } from '../../assistant/TestEngineer.js'
import { QualityGatekeeper } from '../../tools/QualityGate.js'
import { SyntheticDataGenerator } from '../../tools/SyntheticDataGenerator.js'

const TIER_ALIASES: Record<string, string> = {
  dev: 'development', development: 'development',
  stage: 'staging', staging: 'staging',
  prod: 'production', production: 'production',
}

export const call: LocalCommandCall = async (args, _context) => {
  const parts = (args ?? '').trim().split(/\s+/).filter(Boolean)
  let environment = 'staging'
  let targetDir = process.cwd()

  for (const p of parts) {
    const lower = p.toLowerCase()
    if (lower in TIER_ALIASES) {
      environment = TIER_ALIASES[lower]!
    } else if (existsSync(resolve(p))) {
      targetDir = resolve(p)
    }
  }

  const outputDir = join(targetDir, '.niro')
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

  const lines: string[] = []
  lines.push('')
  lines.push('  NiRo.ai Phase 2: Intelligent Quality Gates')
  lines.push('  ============================================')
  lines.push(`  Environment: ${environment}`)
  lines.push(`  Target: ${targetDir}`)
  lines.push('')

  // Step 1: Load or generate Phase 0 data
  lines.push('  [1/5] Loading project data...')
  let inventory: ProjectInventory
  let security: SecurityReport

  const invPath = join(outputDir, 'PROJECT_INVENTORY.json')
  const secPath = join(outputDir, 'SECURITY_REPORT.json')

  if (existsSync(invPath)) {
    inventory = JSON.parse(readFileSync(invPath, 'utf-8'))
    lines.push(`    -> Loaded inventory (${inventory.fileCount} files)`)
  } else {
    const disc = new DiscoveryEngine(targetDir)
    inventory = await disc.scan()
    writeFileSync(invPath, JSON.stringify(inventory, null, 2), 'utf-8')
    lines.push(`    -> Generated inventory (${inventory.fileCount} files)`)
  }

  if (existsSync(secPath)) {
    security = JSON.parse(readFileSync(secPath, 'utf-8'))
    lines.push(`    -> Loaded security report (risk: ${security.summary.riskScore}/100)`)
  } else {
    const scanner = new SecurityScanner(targetDir)
    security = await scanner.scan()
    writeFileSync(secPath, JSON.stringify(security, null, 2), 'utf-8')
    lines.push(`    -> Generated security report (risk: ${security.summary.riskScore}/100)`)
  }
  lines.push('')

  // Step 2: Design test strategy
  lines.push('  [2/5] Designing test strategy...')
  const architect = new TestArchitect(targetDir)
  const strategy = architect.designStrategy(inventory)

  lines.push(`    -> Detected frameworks: ${strategy.detectedFrameworks.map(f => f.name).join(', ') || 'none'}`)
  lines.push(`    -> Test layers planned: ${strategy.layers.length}`)
  for (const layer of strategy.layers) {
    lines.push(`       - ${layer.layer}: ${layer.framework} (${layer.priority}, target ${layer.coverageTarget}%)`)
  }
  if (strategy.recommendedFrameworks.length > 0) {
    lines.push('    -> Missing frameworks:')
    for (const rec of strategy.recommendedFrameworks) {
      lines.push(`       - ${rec.layer}: ${rec.framework} (${rec.installCommand})`)
    }
  }
  lines.push('')

  // Step 3: Estimate coverage
  lines.push('  [3/5] Estimating test coverage...')
  const coverage = architect.estimateCoverage(inventory)

  lines.push(`    -> Overall coverage: ${coverage.overall}%`)
  lines.push(`    -> Unit: ${coverage.byLayer.unit}% | Integration: ${coverage.byLayer.integration}% | E2E: ${coverage.byLayer.e2e}%`)
  lines.push(`    -> SOC2 compliant (>=80%): ${coverage.meetsSoc2 ? 'YES' : 'NO'}`)
  if (coverage.uncoveredPaths.length > 0) {
    lines.push(`    -> Uncovered paths (sample): ${coverage.uncoveredPaths.slice(0, 5).join(', ')}`)
  }
  lines.push('')

  // Step 4: Run quality gates
  lines.push('  [4/5] Running quality gates...')
  const gatekeeper = new QualityGatekeeper(environment)
  const gateReport = gatekeeper.evaluate(security, coverage, strategy)

  for (const check of gateReport.checks) {
    const icon = check.status === 'pass' ? 'PASS' : check.status === 'warn' ? 'WARN' : 'FAIL'
    lines.push(`    -> [${icon}] ${check.name}: ${check.message}`)
  }
  lines.push(`    -> Overall: ${gateReport.overallStatus.toUpperCase()} (${gateReport.summary})`)
  lines.push(`    -> Can deploy: ${gateReport.canDeploy ? 'YES' : 'NO'}`)
  lines.push('')

  // Step 5: Generate synthetic test data sample
  lines.push('  [5/5] Generating synthetic test data...')
  const synth = new SyntheticDataGenerator()
  const dataset = synth.generate(10)
  const synthPath = join(outputDir, 'SYNTHETIC_TEST_DATA.json')
  writeFileSync(synthPath, JSON.stringify(dataset, null, 2), 'utf-8')
  lines.push(`    -> Generated ${dataset.profiles.length} synthetic profiles (GDPR-compliant)`)
  lines.push(`    -> Saved: ${synthPath}`)
  lines.push('')

  // Save reports
  const strategyPath = join(outputDir, 'TEST_STRATEGY.json')
  writeFileSync(strategyPath, JSON.stringify(strategy, null, 2), 'utf-8')
  const gatePath = join(outputDir, 'QUALITY_GATE_REPORT.json')
  writeFileSync(gatePath, JSON.stringify(gateReport, null, 2), 'utf-8')

  // Summary
  lines.push('  ============================================')
  lines.push('  Summary')
  lines.push('  ============================================')
  lines.push(`  Environment     : ${environment}`)
  lines.push(`  Test frameworks : ${strategy.detectedFrameworks.length} detected, ${strategy.recommendedFrameworks.length} missing`)
  lines.push(`  Coverage        : ${coverage.overall}% (target: 80%)`)
  lines.push(`  Vulnerabilities : ${security.summary.critical} critical, ${security.summary.high} high`)
  lines.push(`  Secrets         : ${security.summary.secretsDetected}`)
  lines.push(`  Quality gate    : ${gateReport.overallStatus.toUpperCase()}`)
  lines.push(`  Deploy ready    : ${gateReport.canDeploy ? 'YES' : 'BLOCKED'}`)
  lines.push('')

  if (strategy.boilerplates.length > 0) {
    lines.push('  Generated boilerplates (run /quality --write to save):')
    for (const bp of strategy.boilerplates) {
      lines.push(`    - ${bp.path} (${bp.description})`)
    }
    lines.push('')
  }

  lines.push(`  Reports saved to: ${outputDir}`)
  lines.push('')

  return { type: 'text', value: lines.join('\n') }
}
