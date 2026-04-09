/**
 * IntentGenerator — Phase 0: Project Intent & Spec Generation
 *
 * Infers project purpose from code analysis and generates a DRAFT_SPEC.md
 * in the .niro/ folder. Classifies projects as CLI, Web App, API Service,
 * Library, or Monorepo and produces a structured specification.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { ProjectInventory } from './DiscoveryEngine.js'
import type { SecurityReport } from '../tools/SecurityScanner.js'
import type { ComplianceReport } from '../schemas/compliance.js'

// ---------- Types ----------

export interface ProjectSpec {
  projectName: string
  projectType: string
  description: string
  primaryLanguage: string
  frameworks: string[]
  databases: string[]
  entryPoints: string[]
  architecture: ArchitectureAnalysis
  readiness: ReadinessAssessment
  recommendations: Recommendation[]
}

export interface ArchitectureAnalysis {
  pattern: string // e.g., "MVC", "Layered", "Microservice", "Monolith"
  hasAPI: boolean
  hasUI: boolean
  hasWorkers: boolean
  hasDatabase: boolean
  hasCaching: boolean
  hasMessageQueue: boolean
}

export interface ReadinessAssessment {
  score: number // 0-100
  level: 'prototype' | 'development' | 'staging' | 'production-ready'
  factors: ReadinessFactor[]
}

export interface ReadinessFactor {
  name: string
  present: boolean
  weight: number
  description: string
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  effort: 'small' | 'medium' | 'large'
}

// ---------- IntentGenerator ----------

export class IntentGenerator {
  private rootDir: string

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }

  generate(
    inventory: ProjectInventory,
    security?: SecurityReport,
    compliance?: ComplianceReport,
  ): ProjectSpec {
    const projectName = this.inferProjectName()
    const architecture = this.analyzeArchitecture(inventory)
    const readiness = this.assessReadiness(inventory, security, compliance)
    const recommendations = this.generateRecommendations(inventory, security, compliance, readiness)

    return {
      projectName,
      projectType: inventory.projectType,
      description: this.generateDescription(inventory, architecture),
      primaryLanguage: inventory.primaryLanguage,
      frameworks: inventory.frameworks.map(f => f.name),
      databases: inventory.databases.map(d => d.type),
      entryPoints: inventory.entryPoints.map(e => e.path),
      architecture,
      readiness,
      recommendations,
    }
  }

  writeDraftSpec(spec: ProjectSpec): string {
    const niroDir = join(this.rootDir, '.niro')
    if (!existsSync(niroDir)) {
      mkdirSync(niroDir, { recursive: true })
    }

    const content = this.renderSpecMarkdown(spec)
    const specPath = join(niroDir, 'DRAFT_SPEC.md')
    writeFileSync(specPath, content, 'utf-8')
    return specPath
  }

  // --- Project name inference ---

  private inferProjectName(): string {
    const pkgPath = join(this.rootDir, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.name) return pkg.name.replace(/^@[^/]+\//, '')
      } catch { /* skip */ }
    }

    const goModPath = join(this.rootDir, 'go.mod')
    if (existsSync(goModPath)) {
      try {
        const content = readFileSync(goModPath, 'utf-8')
        const match = content.match(/^module\s+(\S+)/m)
        if (match) return match[1]!.split('/').pop()!
      } catch { /* skip */ }
    }

    const cargoPath = join(this.rootDir, 'Cargo.toml')
    if (existsSync(cargoPath)) {
      try {
        const content = readFileSync(cargoPath, 'utf-8')
        const match = content.match(/name\s*=\s*"([^"]+)"/)
        if (match) return match[1]!
      } catch { /* skip */ }
    }

    // Fall back to directory name
    return this.rootDir.split(/[/\\]/).pop() ?? 'unknown-project'
  }

  // --- Architecture analysis ---

  private analyzeArchitecture(inventory: ProjectInventory): ArchitectureAnalysis {
    const frameworkNames = new Set(inventory.frameworks.map(f => f.name))
    const depNames = new Set(inventory.dependencies.map(d => d.name))

    const hasAPI = frameworkNames.has('express') || frameworkNames.has('fastify')
      || frameworkNames.has('nestjs') || frameworkNames.has('flask')
      || frameworkNames.has('fastapi') || frameworkNames.has('django')
      || frameworkNames.has('gin') || frameworkNames.has('spring-boot')
      || frameworkNames.has('rails')

    const hasUI = frameworkNames.has('react') || frameworkNames.has('vue')
      || frameworkNames.has('angular') || frameworkNames.has('svelte')
      || frameworkNames.has('next.js')

    const hasDatabase = inventory.databases.length > 0

    const hasCaching = depNames.has('redis') || depNames.has('ioredis')
      || depNames.has('memcached') || depNames.has('node-cache')

    const hasMessageQueue = depNames.has('amqplib') || depNames.has('bull')
      || depNames.has('bullmq') || depNames.has('kafkajs')
      || depNames.has('sqs-consumer')

    const hasWorkers = hasMessageQueue
      || inventory.entryPoints.some(e => e.path.includes('worker'))

    let pattern = 'Unknown'
    if (inventory.projectType === 'monorepo') pattern = 'Monorepo'
    else if (hasUI && hasAPI) pattern = 'Full-Stack (MVC/Layered)'
    else if (hasAPI && hasMessageQueue) pattern = 'Event-Driven Service'
    else if (hasAPI) pattern = 'API Service'
    else if (hasUI) pattern = 'SPA'
    else if (inventory.projectType === 'cli') pattern = 'CLI Application'
    else if (inventory.projectType === 'library') pattern = 'Library/Package'

    return { pattern, hasAPI, hasUI, hasWorkers, hasDatabase, hasCaching, hasMessageQueue }
  }

  // --- Readiness assessment ---

  private assessReadiness(
    inventory: ProjectInventory,
    security?: SecurityReport,
    compliance?: ComplianceReport,
  ): ReadinessAssessment {
    const factors: ReadinessFactor[] = [
      {
        name: 'Tests',
        present: inventory.hasTests,
        weight: 15,
        description: inventory.hasTests ? 'Test suite detected' : 'No tests found',
      },
      {
        name: 'CI/CD',
        present: inventory.hasCICD,
        weight: 15,
        description: inventory.hasCICD ? 'CI/CD pipeline configured' : 'No CI/CD pipeline',
      },
      {
        name: 'Docker',
        present: inventory.hasDocker,
        weight: 10,
        description: inventory.hasDocker ? 'Docker containerization present' : 'No Docker configuration',
      },
      {
        name: 'Lock file',
        present: inventory.packageManagers.length > 0,
        weight: 5,
        description: inventory.packageManagers.length > 0 ? 'Dependency lock file present' : 'No lock file',
      },
      {
        name: 'Security posture',
        present: (security?.summary.riskScore ?? 100) < 30,
        weight: 20,
        description: security
          ? `Risk score: ${security.summary.riskScore}/100`
          : 'Security scan not run',
      },
      {
        name: 'Compliance',
        present: (compliance?.score.overall ?? 0) >= 60,
        weight: 15,
        description: compliance
          ? `Compliance score: ${compliance.score.overall}/100`
          : 'Compliance scan not run',
      },
      {
        name: 'Documentation',
        present: existsSync(join(this.rootDir, 'README.md')),
        weight: 5,
        description: existsSync(join(this.rootDir, 'README.md')) ? 'README.md exists' : 'No README',
      },
      {
        name: 'IaC',
        present: inventory.hasIaC,
        weight: 10,
        description: inventory.hasIaC ? 'Infrastructure as Code present' : 'No IaC configuration',
      },
      {
        name: 'Entry points',
        present: inventory.entryPoints.length > 0,
        weight: 5,
        description: `${inventory.entryPoints.length} entry point(s) found`,
      },
    ]

    const score = factors.reduce((acc, f) => acc + (f.present ? f.weight : 0), 0)

    let level: ReadinessAssessment['level']
    if (score >= 80) level = 'production-ready'
    else if (score >= 55) level = 'staging'
    else if (score >= 30) level = 'development'
    else level = 'prototype'

    return { score, level, factors }
  }

  // --- Recommendations ---

  private generateRecommendations(
    inventory: ProjectInventory,
    security?: SecurityReport,
    compliance?: ComplianceReport,
    readiness?: ReadinessAssessment,
  ): Recommendation[] {
    const recs: Recommendation[] = []

    if (!inventory.hasTests) {
      recs.push({
        priority: 'critical',
        category: 'Testing',
        title: 'Add test suite',
        description: 'No tests detected. Add unit and integration tests to ensure reliability.',
        effort: 'large',
      })
    }

    if (!inventory.hasCICD) {
      recs.push({
        priority: 'critical',
        category: 'CI/CD',
        title: 'Set up CI/CD pipeline',
        description: 'No CI/CD pipeline found. Add GitHub Actions or equivalent for automated builds and deploys.',
        effort: 'medium',
      })
    }

    if (!inventory.hasDocker) {
      recs.push({
        priority: 'high',
        category: 'Containerization',
        title: 'Add Dockerfile',
        description: 'No Docker configuration found. Containerize the application for consistent deployments.',
        effort: 'small',
      })
    }

    if (security && security.summary.secretsDetected > 0) {
      recs.push({
        priority: 'critical',
        category: 'Security',
        title: 'Remove hardcoded secrets',
        description: `${security.summary.secretsDetected} secret(s) detected in source code. Move to environment variables or a secret manager.`,
        effort: 'small',
      })
    }

    if (security && security.summary.critical > 0) {
      recs.push({
        priority: 'critical',
        category: 'Security',
        title: 'Fix critical vulnerabilities',
        description: `${security.summary.critical} critical vulnerability(ies) found. Update affected packages immediately.`,
        effort: 'small',
      })
    }

    if (compliance && compliance.score.overall < 50) {
      recs.push({
        priority: 'high',
        category: 'Compliance',
        title: 'Improve compliance posture',
        description: `Compliance score is ${compliance.score.overall}/100. Address failing SOC2 and GDPR checks.`,
        effort: 'large',
      })
    }

    if (!inventory.hasIaC && inventory.projectType !== 'library') {
      recs.push({
        priority: 'medium',
        category: 'Infrastructure',
        title: 'Add Infrastructure as Code',
        description: 'No IaC found. Add Terraform, Pulumi, or Kubernetes manifests for reproducible infrastructure.',
        effort: 'large',
      })
    }

    if (inventory.packageManagers.length === 0) {
      recs.push({
        priority: 'medium',
        category: 'Dependencies',
        title: 'Generate lock file',
        description: 'No dependency lock file found. Generate one for reproducible builds.',
        effort: 'small',
      })
    }

    return recs.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    })
  }

  // --- Description generation ---

  private generateDescription(inventory: ProjectInventory, arch: ArchitectureAnalysis): string {
    const parts: string[] = []
    parts.push(`A ${inventory.projectType.replace('-', ' ')} project`)
    parts.push(`written primarily in ${inventory.primaryLanguage}`)

    if (inventory.frameworks.length > 0) {
      const top = inventory.frameworks.slice(0, 3).map(f => f.name)
      parts.push(`using ${top.join(', ')}`)
    }

    parts.push(`with a ${arch.pattern.toLowerCase()} architecture`)

    if (inventory.databases.length > 0) {
      parts.push(`backed by ${inventory.databases.map(d => d.type).join(', ')}`)
    }

    return parts.join(' ') + '.'
  }

  // --- Markdown rendering ---

  private renderSpecMarkdown(spec: ProjectSpec): string {
    const lines: string[] = []

    lines.push(`# Project Specification: ${spec.projectName}`)
    lines.push('')
    lines.push(`> Auto-generated by NiRo.ai Phase 0 Diagnostics`)
    lines.push(`> Generated: ${new Date().toISOString()}`)
    lines.push('')

    lines.push('## Overview')
    lines.push('')
    lines.push(`- **Type**: ${spec.projectType}`)
    lines.push(`- **Language**: ${spec.primaryLanguage}`)
    lines.push(`- **Frameworks**: ${spec.frameworks.join(', ') || 'None detected'}`)
    lines.push(`- **Databases**: ${spec.databases.join(', ') || 'None detected'}`)
    lines.push(`- **Architecture**: ${spec.architecture.pattern}`)
    lines.push('')
    lines.push(spec.description)
    lines.push('')

    lines.push('## Architecture')
    lines.push('')
    lines.push(`| Capability | Status |`)
    lines.push(`| :--- | :--- |`)
    lines.push(`| API Layer | ${spec.architecture.hasAPI ? 'Yes' : 'No'} |`)
    lines.push(`| UI Layer | ${spec.architecture.hasUI ? 'Yes' : 'No'} |`)
    lines.push(`| Database | ${spec.architecture.hasDatabase ? 'Yes' : 'No'} |`)
    lines.push(`| Caching | ${spec.architecture.hasCaching ? 'Yes' : 'No'} |`)
    lines.push(`| Message Queue | ${spec.architecture.hasMessageQueue ? 'Yes' : 'No'} |`)
    lines.push(`| Workers | ${spec.architecture.hasWorkers ? 'Yes' : 'No'} |`)
    lines.push('')

    lines.push('## Entry Points')
    lines.push('')
    for (const ep of spec.entryPoints) {
      lines.push(`- \`${ep}\``)
    }
    lines.push('')

    lines.push('## Readiness Assessment')
    lines.push('')
    lines.push(`**Score**: ${spec.readiness.score}/100 (**${spec.readiness.level}**)`)
    lines.push('')
    lines.push(`| Factor | Status | Weight |`)
    lines.push(`| :--- | :--- | :--- |`)
    for (const f of spec.readiness.factors) {
      lines.push(`| ${f.name} | ${f.present ? 'PASS' : 'MISSING'} | ${f.weight}% |`)
    }
    lines.push('')

    if (spec.recommendations.length > 0) {
      lines.push('## Recommendations')
      lines.push('')
      for (const rec of spec.recommendations) {
        const icon = rec.priority === 'critical' ? '[CRITICAL]'
          : rec.priority === 'high' ? '[HIGH]'
          : rec.priority === 'medium' ? '[MEDIUM]'
          : '[LOW]'
        lines.push(`### ${icon} ${rec.title}`)
        lines.push('')
        lines.push(`- **Category**: ${rec.category}`)
        lines.push(`- **Effort**: ${rec.effort}`)
        lines.push(`- ${rec.description}`)
        lines.push('')
      }
    }

    lines.push('---')
    lines.push('*Generated by NiRo.ai Autonomous Deployment & Testing Engineer*')
    lines.push('')

    return lines.join('\n')
  }
}
