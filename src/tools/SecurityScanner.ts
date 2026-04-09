/**
 * SecurityScanner — Phase 0: Dependency & Vulnerability Audit
 *
 * Integrates with:
 * - npm audit / pip-audit for dependency vulnerabilities
 * - gitleaks for secret detection
 * - Custom pattern matching for hardcoded secrets
 *
 * Satisfies SOC2 availability and security criteria.
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join, extname, relative } from 'path'

// ---------- Types ----------

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface VulnerabilityFinding {
  id: string
  source: 'npm-audit' | 'pip-audit' | 'go-vulncheck' | 'cargo-audit' | 'custom'
  package: string
  severity: Severity
  title: string
  description: string
  fixAvailable: boolean
  fixVersion?: string
  url?: string
}

export interface SecretFinding {
  source: 'gitleaks' | 'pattern-scan'
  file: string
  line: number
  ruleId: string
  description: string
  severity: Severity
  match: string // redacted version
}

export interface SecurityReport {
  scanTimestamp: string
  rootDir: string
  vulnerabilities: VulnerabilityFinding[]
  secrets: SecretFinding[]
  summary: SecuritySummary
}

export interface SecuritySummary {
  totalVulnerabilities: number
  critical: number
  high: number
  medium: number
  low: number
  secretsDetected: number
  riskScore: number // 0-100, higher = more risk
}

// ---------- Secret patterns ----------

// Patterns stored as source+flags to avoid shared global regex state issues.
// A fresh RegExp is created per test in patternScan().
const SECRET_PATTERNS: { ruleId: string; source: string; flags: string; description: string; severity: Severity }[] = [
  {
    ruleId: 'hardcoded-aws-key',
    source: '(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}',
    flags: '',
    description: 'AWS Access Key ID',
    severity: 'critical',
  },
  {
    ruleId: 'hardcoded-aws-secret',
    source: "(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\\s*[=:]\\s*['\"]?([A-Za-z0-9/+=]{40})['\"]?",
    flags: '',
    description: 'AWS Secret Access Key',
    severity: 'critical',
  },
  {
    ruleId: 'hardcoded-private-key',
    source: '-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----',
    flags: '',
    description: 'Private key in source',
    severity: 'critical',
  },
  {
    ruleId: 'hardcoded-generic-secret',
    source: "(?:password|passwd|secret|api_key|apikey|access_token|auth_token)\\s*[=:]\\s*['\"][^'\"]{8,}['\"]",
    flags: 'i',
    description: 'Generic hardcoded secret',
    severity: 'high',
  },
  {
    ruleId: 'hardcoded-github-token',
    source: 'gh[ps]_[A-Za-z0-9_]{36,}',
    flags: '',
    description: 'GitHub personal access token',
    severity: 'critical',
  },
  {
    ruleId: 'hardcoded-jwt',
    source: 'eyJ[A-Za-z0-9_-]{10,}\\.eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}',
    flags: '',
    description: 'JSON Web Token',
    severity: 'high',
  },
  {
    ruleId: 'hardcoded-connection-string',
    source: "(?:mongodb|postgres|mysql|redis)://[^\\s'\"]+:[^\\s'\"]+@[^\\s'\"]+",
    flags: 'i',
    description: 'Database connection string with credentials',
    severity: 'critical',
  },
  {
    ruleId: 'hardcoded-slack-token',
    source: 'xox[bpors]-[0-9]{10,}-[0-9]{10,}-[a-zA-Z0-9]{24,}',
    flags: '',
    description: 'Slack token',
    severity: 'high',
  },
  {
    ruleId: 'hardcoded-stripe-key',
    source: '(?:sk_live|pk_live|rk_live)_[A-Za-z0-9]{24,}',
    flags: '',
    description: 'Stripe API key',
    severity: 'critical',
  },
  {
    ruleId: 'env-file-committed',
    source: '^\\.env$',
    flags: '',
    description: '.env file in repository',
    severity: 'high',
  },
]

const SCANNABLE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.kt',
  '.rb', '.php', '.yaml', '.yml', '.json', '.toml', '.env', '.cfg',
  '.conf', '.ini', '.xml', '.sh', '.bash', '.zsh', '.properties',
])

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  'venv', '.venv', 'vendor', 'target', 'coverage',
])

// ---------- Scanner ----------

export class SecurityScanner {
  private rootDir: string

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }

  async scan(): Promise<SecurityReport> {
    const [vulnerabilities, secrets] = await Promise.all([
      this.scanVulnerabilities(),
      this.scanSecrets(),
    ])

    const summary = this.buildSummary(vulnerabilities, secrets)

    return {
      scanTimestamp: new Date().toISOString(),
      rootDir: this.rootDir,
      vulnerabilities,
      secrets,
      summary,
    }
  }

  // --- Vulnerability scanning ---

  private async scanVulnerabilities(): Promise<VulnerabilityFinding[]> {
    const findings: VulnerabilityFinding[] = []

    if (existsSync(join(this.rootDir, 'package.json'))) {
      findings.push(...this.runNpmAudit())
    }
    if (existsSync(join(this.rootDir, 'requirements.txt')) || existsSync(join(this.rootDir, 'pyproject.toml'))) {
      findings.push(...this.runPipAudit())
    }
    if (existsSync(join(this.rootDir, 'go.mod'))) {
      findings.push(...this.runGoVulncheck())
    }

    return findings
  }

  private runNpmAudit(): VulnerabilityFinding[] {
    try {
      const result = execSync('npm audit --json 2>/dev/null', {
        cwd: this.rootDir,
        encoding: 'utf-8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      return this.parseNpmAuditOutput(result)
    } catch (err: any) {
      // npm audit exits non-zero when vulnerabilities are found
      if (err.stdout) {
        return this.parseNpmAuditOutput(err.stdout)
      }
      return []
    }
  }

  private parseNpmAuditOutput(output: string): VulnerabilityFinding[] {
    try {
      const data = JSON.parse(output)
      const findings: VulnerabilityFinding[] = []

      if (data.vulnerabilities) {
        for (const [pkg, info] of Object.entries(data.vulnerabilities) as [string, any][]) {
          findings.push({
            id: `npm-${pkg}-${info.severity}`,
            source: 'npm-audit',
            package: pkg,
            severity: this.mapSeverity(info.severity),
            title: info.title ?? `Vulnerability in ${pkg}`,
            description: info.via?.[0]?.title ?? info.via?.[0] ?? 'Unknown vulnerability',
            fixAvailable: !!info.fixAvailable,
            fixVersion: typeof info.fixAvailable === 'object' ? info.fixAvailable.version : undefined,
            url: info.via?.[0]?.url,
          })
        }
      }

      return findings
    } catch {
      return []
    }
  }

  private runPipAudit(): VulnerabilityFinding[] {
    try {
      const result = execSync('pip-audit --format json 2>/dev/null', {
        cwd: this.rootDir,
        encoding: 'utf-8',
        timeout: 60000,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      const data = JSON.parse(result)
      return (data.dependencies ?? [])
        .filter((d: any) => d.vulns?.length > 0)
        .flatMap((d: any) =>
          d.vulns.map((v: any) => ({
            id: v.id ?? `pip-${d.name}`,
            source: 'pip-audit' as const,
            package: d.name,
            severity: this.mapSeverity(v.fix_versions?.length > 0 ? 'high' : 'medium'),
            title: v.id ?? `Vulnerability in ${d.name}`,
            description: v.description ?? 'Known vulnerability',
            fixAvailable: (v.fix_versions?.length ?? 0) > 0,
            fixVersion: v.fix_versions?.[0],
          }))
        )
    } catch {
      return []
    }
  }

  private runGoVulncheck(): VulnerabilityFinding[] {
    try {
      const result = execSync('govulncheck -json ./... 2>/dev/null', {
        cwd: this.rootDir,
        encoding: 'utf-8',
        timeout: 60000,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      // govulncheck JSON output is newline-delimited JSON
      const findings: VulnerabilityFinding[] = []
      for (const line of result.split('\n').filter(Boolean)) {
        try {
          const entry = JSON.parse(line)
          if (entry.vulnerability) {
            const v = entry.vulnerability
            findings.push({
              id: v.osv?.id ?? 'unknown',
              source: 'go-vulncheck',
              package: v.modules?.[0]?.path ?? 'unknown',
              severity: 'high',
              title: v.osv?.summary ?? 'Go vulnerability',
              description: v.osv?.details ?? '',
              fixAvailable: !!v.modules?.[0]?.fixedVersion,
              fixVersion: v.modules?.[0]?.fixedVersion,
            })
          }
        } catch {
          // skip malformed lines
        }
      }
      return findings
    } catch {
      return []
    }
  }

  // --- Secret scanning ---

  private async scanSecrets(): Promise<SecretFinding[]> {
    const findings: SecretFinding[] = []

    // Try gitleaks first
    findings.push(...this.runGitleaks())

    // Always run our pattern scan as a supplement
    findings.push(...this.patternScan())

    // Deduplicate by file+line
    const seen = new Set<string>()
    return findings.filter(f => {
      const key = `${f.file}:${f.line}:${f.ruleId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private runGitleaks(): SecretFinding[] {
    try {
      const result = execSync(
        'gitleaks detect --source . --report-format json --no-git 2>/dev/null',
        {
          cwd: this.rootDir,
          encoding: 'utf-8',
          timeout: 60000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      )
      const data = JSON.parse(result)
      return (Array.isArray(data) ? data : []).map((finding: any) => ({
        source: 'gitleaks' as const,
        file: finding.File ?? finding.file ?? 'unknown',
        line: finding.StartLine ?? finding.startLine ?? 0,
        ruleId: finding.RuleID ?? finding.ruleID ?? 'unknown',
        description: finding.Description ?? finding.description ?? 'Secret detected',
        severity: 'critical' as Severity,
        match: this.redact(finding.Match ?? finding.match ?? ''),
      }))
    } catch {
      // gitleaks not installed or no findings
      return []
    }
  }

  private patternScan(): SecretFinding[] {
    const findings: SecretFinding[] = []
    const files = this.walkDir(this.rootDir)

    for (const file of files) {
      const ext = extname(file)
      if (!SCANNABLE_EXTENSIONS.has(ext) && !file.endsWith('.env')) continue

      try {
        const content = readFileSync(join(this.rootDir, file), 'utf-8')
        const lines = content.split('\n')

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!
          for (const rule of SECRET_PATTERNS) {
            const re = new RegExp(rule.source, rule.flags)
            if (re.test(line)) {
              findings.push({
                source: 'pattern-scan',
                file,
                line: i + 1,
                ruleId: rule.ruleId,
                description: rule.description,
                severity: rule.severity,
                match: this.redact(line.trim()),
              })
            }
          }
        }
      } catch {
        // skip unreadable files
      }
    }

    return findings
  }

  // --- Helpers ---

  private walkDir(dir: string, depth = 0): string[] {
    if (depth > 8) return []
    const results: string[] = []
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name)) continue
        if (entry.name.startsWith('.') && entry.name !== '.env') continue
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          results.push(...this.walkDir(fullPath, depth + 1))
        } else {
          results.push(relative(this.rootDir, fullPath))
        }
      }
    } catch {
      // skip
    }
    return results
  }

  private redact(value: string): string {
    if (value.length <= 8) return '***REDACTED***'
    return value.slice(0, 4) + '***REDACTED***' + value.slice(-4)
  }

  private mapSeverity(severity: string): Severity {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'critical'
      case 'high': return 'high'
      case 'moderate':
      case 'medium': return 'medium'
      case 'low': return 'low'
      default: return 'info'
    }
  }

  private buildSummary(
    vulnerabilities: VulnerabilityFinding[],
    secrets: SecretFinding[],
  ): SecuritySummary {
    const critical = vulnerabilities.filter(v => v.severity === 'critical').length
    const high = vulnerabilities.filter(v => v.severity === 'high').length
    const medium = vulnerabilities.filter(v => v.severity === 'medium').length
    const low = vulnerabilities.filter(v => v.severity === 'low').length
    const secretsDetected = secrets.length

    // Risk score: weighted sum, capped at 100
    const riskScore = Math.min(100,
      critical * 25 + high * 15 + medium * 5 + low * 1 + secretsDetected * 20
    )

    return {
      totalVulnerabilities: vulnerabilities.length,
      critical,
      high,
      medium,
      low,
      secretsDetected,
      riskScore,
    }
  }
}
