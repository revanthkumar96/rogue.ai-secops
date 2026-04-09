/**
 * `niro diagnose` — Phase 0 CLI command
 *
 * Runs the full project diagnostics pipeline:
 * 1. DiscoveryEngine — tech stack, dependencies, entry points
 * 2. SecurityScanner — vulnerabilities, secrets
 * 3. PolicyAnalyzer — SOC2/GDPR compliance
 * 4. IntentGenerator — project spec and readiness assessment
 *
 * Outputs PROJECT_INVENTORY.json, SECURITY_REPORT.json, COMPLIANCE_REPORT.json
 * and DRAFT_SPEC.md to .niro/ directory.
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import type { LocalCommandCall } from '../../types/command.js'
import { DiscoveryEngine } from '../../coordinator/DiscoveryEngine.js'
import { SecurityScanner } from '../../tools/SecurityScanner.js'
import { PolicyAnalyzer } from '../../schemas/compliance.js'
import { IntentGenerator } from '../../coordinator/IntentGenerator.js'

export const call: LocalCommandCall = async (args, _context) => {
  const targetDir = args?.trim() ? resolve(args.trim()) : process.cwd()

  if (!existsSync(targetDir)) {
    return {
      type: 'text',
      value: `Error: Directory not found: ${targetDir}`,
    }
  }

  const outputDir = join(targetDir, '.niro')
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  const lines: string[] = []
  lines.push('')
  lines.push('  NiRo.ai Phase 0: Project Diagnostics')
  lines.push('  =====================================')
  lines.push(`  Target: ${targetDir}`)
  lines.push('')

  // Step 1: Discovery
  lines.push('  [1/4] Running tech discovery...')
  const discovery = new DiscoveryEngine(targetDir)
  const inventory = await discovery.scan()

  const inventoryPath = join(outputDir, 'PROJECT_INVENTORY.json')
  writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2), 'utf-8')
  lines.push(`    -> ${inventory.fileCount} files scanned`)
  lines.push(`    -> Language: ${inventory.primaryLanguage} (${inventory.languages.length} detected)`)
  lines.push(`    -> Type: ${inventory.projectType}`)
  lines.push(`    -> Frameworks: ${inventory.frameworks.map(f => f.name).join(', ') || 'none'}`)
  lines.push(`    -> Databases: ${inventory.databases.map(d => d.type).join(', ') || 'none'}`)
  lines.push(`    -> Entry points: ${inventory.entryPoints.length}`)
  lines.push(`    -> Package managers: ${inventory.packageManagers.join(', ') || 'none'}`)
  lines.push(`    -> Tests: ${inventory.hasTests ? 'YES' : 'NO'} | CI/CD: ${inventory.hasCICD ? 'YES' : 'NO'} | Docker: ${inventory.hasDocker ? 'YES' : 'NO'} | IaC: ${inventory.hasIaC ? 'YES' : 'NO'}`)
  lines.push(`    -> Saved: ${inventoryPath}`)
  lines.push('')

  // Step 2: Security
  lines.push('  [2/4] Running security scan...')
  const scanner = new SecurityScanner(targetDir)
  const securityReport = await scanner.scan()

  const securityPath = join(outputDir, 'SECURITY_REPORT.json')
  writeFileSync(securityPath, JSON.stringify(securityReport, null, 2), 'utf-8')
  lines.push(`    -> Vulnerabilities: ${securityReport.summary.totalVulnerabilities} (${securityReport.summary.critical} critical, ${securityReport.summary.high} high)`)
  lines.push(`    -> Secrets detected: ${securityReport.summary.secretsDetected}`)
  lines.push(`    -> Risk score: ${securityReport.summary.riskScore}/100`)
  lines.push(`    -> Saved: ${securityPath}`)
  lines.push('')

  // Step 3: Compliance
  lines.push('  [3/4] Running compliance analysis...')
  const analyzer = new PolicyAnalyzer(targetDir)
  const complianceReport = await analyzer.analyze()

  const compliancePath = join(outputDir, 'COMPLIANCE_REPORT.json')
  writeFileSync(compliancePath, JSON.stringify(complianceReport, null, 2), 'utf-8')
  lines.push(`    -> Overall: ${complianceReport.score.overall}/100`)
  lines.push(`    -> SOC2: ${complianceReport.score.soc2}/100`)
  lines.push(`    -> GDPR: ${complianceReport.score.gdpr}/100`)
  lines.push(`    -> Checks: ${complianceReport.score.passCount} pass, ${complianceReport.score.warnCount} warn, ${complianceReport.score.failCount} fail`)
  lines.push(`    -> Saved: ${compliancePath}`)
  lines.push('')

  // Step 4: Spec Generation
  lines.push('  [4/4] Generating project specification...')
  const generator = new IntentGenerator(targetDir)
  const spec = generator.generate(inventory, securityReport, complianceReport)
  const specPath = generator.writeDraftSpec(spec)

  lines.push(`    -> Project: ${spec.projectName}`)
  lines.push(`    -> Architecture: ${spec.architecture.pattern}`)
  lines.push(`    -> Readiness: ${spec.readiness.score}/100 (${spec.readiness.level})`)
  lines.push(`    -> Recommendations: ${spec.recommendations.length}`)
  lines.push(`    -> Saved: ${specPath}`)
  lines.push('')

  // Summary
  lines.push('  =====================================')
  lines.push('  Summary')
  lines.push('  =====================================')
  lines.push(`  Project Type    : ${inventory.projectType}`)
  lines.push(`  Primary Language: ${inventory.primaryLanguage}`)
  lines.push(`  Security Risk   : ${securityReport.summary.riskScore}/100 ${riskLabel(securityReport.summary.riskScore)}`)
  lines.push(`  Compliance      : ${complianceReport.score.overall}/100 ${complianceLabel(complianceReport.score.overall)}`)
  lines.push(`  Readiness       : ${spec.readiness.score}/100 (${spec.readiness.level})`)
  lines.push('')

  if (spec.recommendations.length > 0) {
    lines.push('  Top Recommendations:')
    for (const rec of spec.recommendations.slice(0, 5)) {
      const tag = `[${rec.priority.toUpperCase()}]`
      lines.push(`    ${tag} ${rec.title}`)
    }
    lines.push('')
  }

  lines.push(`  All reports saved to: ${outputDir}`)
  lines.push('')

  return {
    type: 'text',
    value: lines.join('\n'),
  }
}

function riskLabel(score: number): string {
  if (score === 0) return '(excellent)'
  if (score < 20) return '(good)'
  if (score < 50) return '(moderate)'
  if (score < 75) return '(high risk)'
  return '(critical risk)'
}

function complianceLabel(score: number): string {
  if (score >= 80) return '(strong)'
  if (score >= 60) return '(moderate)'
  if (score >= 40) return '(needs work)'
  return '(poor)'
}
