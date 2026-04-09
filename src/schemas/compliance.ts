/**
 * Compliance Schemas — Phase 0: SOC2 & GDPR Validation Rules
 *
 * PolicyAnalyzer that checks a project against:
 * - SOC2: audit trails, least-privilege, encrypted secrets, security scans
 * - GDPR: data masking, PII detection, localized data residency
 *
 * Produces a compliance score and gap analysis.
 */

import { existsSync, readFileSync, readdirSync } from 'fs'
import { join, extname, relative } from 'path'

// ---------- Types ----------

export type ComplianceFramework = 'SOC2' | 'GDPR'

export type ComplianceStatus = 'pass' | 'fail' | 'warn' | 'not-applicable'

export interface ComplianceCheck {
  id: string
  framework: ComplianceFramework
  category: string
  title: string
  description: string
  status: ComplianceStatus
  evidence: string[]
  remediation?: string
}

export interface ComplianceReport {
  scanTimestamp: string
  rootDir: string
  checks: ComplianceCheck[]
  score: ComplianceScore
}

export interface ComplianceScore {
  overall: number // 0-100
  soc2: number
  gdpr: number
  passCount: number
  failCount: number
  warnCount: number
  naCount: number
}

export interface PIIFinding {
  file: string
  line: number
  pattern: string
  fieldName: string
  confidence: number
}

// ---------- PII Patterns ----------

const PII_FIELD_PATTERNS: { pattern: RegExp; fieldName: string }[] = [
  { pattern: /(?:first_?name|last_?name|full_?name|user_?name)/gi, fieldName: 'name' },
  { pattern: /(?:email|e_?mail|email_?address)/gi, fieldName: 'email' },
  { pattern: /(?:phone|telephone|mobile|cell_?phone)/gi, fieldName: 'phone' },
  { pattern: /(?:ssn|social_?security|national_?id)/gi, fieldName: 'SSN/national ID' },
  { pattern: /(?:date_?of_?birth|dob|birth_?date|birthday)/gi, fieldName: 'date of birth' },
  { pattern: /(?:address|street|city|zip_?code|postal_?code)/gi, fieldName: 'address' },
  { pattern: /(?:credit_?card|card_?number|ccn|pan)/gi, fieldName: 'credit card' },
  { pattern: /(?:passport|driver_?license|licence)/gi, fieldName: 'government ID' },
  { pattern: /(?:ip_?address|user_?agent|device_?id)/gi, fieldName: 'device identifier' },
  { pattern: /(?:lat(?:itude)?|lon(?:gitude)?|geo_?location)/gi, fieldName: 'geolocation' },
]

const SCANNABLE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.kt',
  '.rb', '.php', '.yaml', '.yml', '.json', '.sql', '.prisma',
  '.graphql', '.gql', '.proto',
])

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '__pycache__',
  'venv', '.venv', 'vendor', 'target', 'coverage',
])

// ---------- PolicyAnalyzer ----------

export class PolicyAnalyzer {
  private rootDir: string
  private allFiles: string[] = []

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }

  async analyze(): Promise<ComplianceReport> {
    this.allFiles = this.walkDir(this.rootDir)

    const checks: ComplianceCheck[] = [
      ...this.soc2Checks(),
      ...this.gdprChecks(),
    ]

    const score = this.calculateScore(checks)

    return {
      scanTimestamp: new Date().toISOString(),
      rootDir: this.rootDir,
      checks,
      score,
    }
  }

  // ===== SOC2 Checks =====

  private soc2Checks(): ComplianceCheck[] {
    return [
      this.checkAuditLogging(),
      this.checkSecretManagement(),
      this.checkDependencySecurity(),
      this.checkAccessControl(),
      this.checkEncryptionInTransit(),
      this.checkChangeManagement(),
      this.checkSecurityHeaders(),
      this.checkErrorHandling(),
      this.checkInputValidation(),
      this.checkCICD(),
    ]
  }

  private checkAuditLogging(): ComplianceCheck {
    const evidence: string[] = []
    const loggingKeywords = ['logger', 'winston', 'pino', 'bunyan', 'log4j', 'logging', 'audit_log', 'auditLog']
    const hasLogging = this.allFiles.some(f => {
      if (!SCANNABLE_EXTENSIONS.has(extname(f))) return false
      try {
        const content = readFileSync(join(this.rootDir, f), 'utf-8')
        return loggingKeywords.some(kw => content.includes(kw))
      } catch { return false }
    })

    if (hasLogging) {
      evidence.push('Logging framework detected in source code')
    }

    const hasLogConfig = this.allFiles.some(f =>
      f.includes('log') && (f.endsWith('.json') || f.endsWith('.yaml') || f.endsWith('.yml'))
    )
    if (hasLogConfig) evidence.push('Logging configuration file found')

    return {
      id: 'SOC2-CC7.2-AUDIT',
      framework: 'SOC2',
      category: 'Audit & Monitoring',
      title: 'Audit logging implemented',
      description: 'Application should have structured audit logging for security events',
      status: hasLogging ? 'pass' : 'fail',
      evidence,
      remediation: hasLogging ? undefined : 'Add a structured logging framework (e.g., pino, winston) with audit event tracking',
    }
  }

  private checkSecretManagement(): ComplianceCheck {
    const evidence: string[] = []

    // Check for .env in gitignore
    const gitignorePath = join(this.rootDir, '.gitignore')
    let envIgnored = false
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf-8')
      envIgnored = gitignore.includes('.env')
      if (envIgnored) evidence.push('.env is in .gitignore')
    }

    // Check for hardcoded secrets in env example
    const envExample = ['.env.example', '.env.sample', '.env.template']
      .find(f => existsSync(join(this.rootDir, f)))
    if (envExample) {
      evidence.push(`Environment template found: ${envExample}`)
    }

    // Check for secret management tools
    const secretTools = ['vault', 'doppler', 'aws-secrets', 'sops', 'sealed-secrets']
    const hasSecretManager = this.allFiles.some(f =>
      secretTools.some(tool => f.toLowerCase().includes(tool))
    )
    if (hasSecretManager) evidence.push('Secret management tooling detected')

    const status = envIgnored ? (hasSecretManager ? 'pass' : 'warn') : 'fail'

    return {
      id: 'SOC2-CC6.1-SECRETS',
      framework: 'SOC2',
      category: 'Encryption & Secrets',
      title: 'Secrets are not hardcoded',
      description: 'Secrets should be managed through environment variables or a secret manager',
      status,
      evidence,
      remediation: status === 'pass' ? undefined : 'Ensure .env is gitignored and use a secret manager in production',
    }
  }

  private checkDependencySecurity(): ComplianceCheck {
    const evidence: string[] = []
    const hasLockFile = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lock', 'Pipfile.lock', 'go.sum', 'Cargo.lock']
      .some(f => existsSync(join(this.rootDir, f)))
    if (hasLockFile) evidence.push('Lock file present for reproducible builds')

    const hasRenovate = existsSync(join(this.rootDir, 'renovate.json'))
      || existsSync(join(this.rootDir, '.github', 'dependabot.yml'))
    if (hasRenovate) evidence.push('Automated dependency updates configured')

    return {
      id: 'SOC2-CC7.1-DEPS',
      framework: 'SOC2',
      category: 'Vulnerability Management',
      title: 'Dependencies are managed and auditable',
      description: 'Project should use lock files and automated dependency update tools',
      status: hasLockFile ? (hasRenovate ? 'pass' : 'warn') : 'fail',
      evidence,
      remediation: !hasLockFile ? 'Generate a lock file for reproducible builds' : 'Add Dependabot or Renovate for automated dependency updates',
    }
  }

  private checkAccessControl(): ComplianceCheck {
    const evidence: string[] = []
    const authKeywords = ['authenticate', 'authorize', 'middleware', 'rbac', 'jwt', 'oauth', 'passport']
    const hasAuth = this.allFiles.some(f => {
      if (!SCANNABLE_EXTENSIONS.has(extname(f))) return false
      try {
        const content = readFileSync(join(this.rootDir, f), 'utf-8').toLowerCase()
        return authKeywords.some(kw => content.includes(kw))
      } catch { return false }
    })

    if (hasAuth) evidence.push('Authentication/authorization patterns detected in code')

    const hasCODEOWNERS = existsSync(join(this.rootDir, 'CODEOWNERS'))
      || existsSync(join(this.rootDir, '.github', 'CODEOWNERS'))
    if (hasCODEOWNERS) evidence.push('CODEOWNERS file found for code review controls')

    return {
      id: 'SOC2-CC6.3-ACCESS',
      framework: 'SOC2',
      category: 'Access Control',
      title: 'Access control mechanisms present',
      description: 'Application should implement authentication and authorization',
      status: hasAuth ? 'pass' : 'warn',
      evidence,
      remediation: !hasAuth ? 'Implement authentication middleware and role-based access control' : undefined,
    }
  }

  private checkEncryptionInTransit(): ComplianceCheck {
    const evidence: string[] = []
    const hasHTTPS = this.allFiles.some(f => {
      if (!SCANNABLE_EXTENSIONS.has(extname(f))) return false
      try {
        const content = readFileSync(join(this.rootDir, f), 'utf-8')
        return content.includes('https://') || content.includes('TLS') || content.includes('ssl')
      } catch { return false }
    })
    if (hasHTTPS) evidence.push('HTTPS/TLS references found in code')

    return {
      id: 'SOC2-CC6.7-ENCRYPT',
      framework: 'SOC2',
      category: 'Encryption',
      title: 'Encryption in transit',
      description: 'All network communication should use TLS/HTTPS',
      status: hasHTTPS ? 'pass' : 'warn',
      evidence,
      remediation: 'Ensure all API endpoints and external connections use HTTPS/TLS',
    }
  }

  private checkChangeManagement(): ComplianceCheck {
    const evidence: string[] = []
    const hasGit = existsSync(join(this.rootDir, '.git'))
    if (hasGit) evidence.push('Git version control in use')

    const hasPRTemplate = existsSync(join(this.rootDir, '.github', 'pull_request_template.md'))
      || existsSync(join(this.rootDir, '.github', 'PULL_REQUEST_TEMPLATE.md'))
    if (hasPRTemplate) evidence.push('PR template found')

    const hasBranchProtection = this.allFiles.some(f => f.includes('branch-protection') || f.includes('ruleset'))
    if (hasBranchProtection) evidence.push('Branch protection configuration detected')

    return {
      id: 'SOC2-CC8.1-CHANGE',
      framework: 'SOC2',
      category: 'Change Management',
      title: 'Change management controls',
      description: 'Changes should be tracked through version control with review processes',
      status: hasGit ? (hasPRTemplate ? 'pass' : 'warn') : 'fail',
      evidence,
      remediation: 'Add PR templates and enable branch protection rules',
    }
  }

  private checkSecurityHeaders(): ComplianceCheck {
    const evidence: string[] = []
    const headerKeywords = ['helmet', 'cors', 'csp', 'content-security-policy', 'x-frame-options', 'hsts']
    const hasHeaders = this.allFiles.some(f => {
      if (!SCANNABLE_EXTENSIONS.has(extname(f))) return false
      try {
        const content = readFileSync(join(this.rootDir, f), 'utf-8').toLowerCase()
        return headerKeywords.some(kw => content.includes(kw))
      } catch { return false }
    })
    if (hasHeaders) evidence.push('Security headers configuration detected')

    return {
      id: 'SOC2-CC6.6-HEADERS',
      framework: 'SOC2',
      category: 'Network Security',
      title: 'Security headers configured',
      description: 'HTTP security headers should be set (CSP, HSTS, X-Frame-Options)',
      status: hasHeaders ? 'pass' : 'warn',
      evidence,
      remediation: 'Add helmet (Node.js) or equivalent security header middleware',
    }
  }

  private checkErrorHandling(): ComplianceCheck {
    const evidence: string[] = []
    const errorPatterns = ['try', 'catch', 'error', 'exception', 'handleError', 'errorHandler', 'errorBoundary']
    let errorHandlerCount = 0

    for (const f of this.allFiles) {
      if (!SCANNABLE_EXTENSIONS.has(extname(f))) continue
      try {
        const content = readFileSync(join(this.rootDir, f), 'utf-8')
        if (errorPatterns.some(p => content.includes(p))) errorHandlerCount++
      } catch { /* skip */ }
      if (errorHandlerCount >= 3) break // enough evidence
    }

    if (errorHandlerCount > 0) evidence.push(`Error handling found in ${errorHandlerCount}+ files`)

    return {
      id: 'SOC2-CC7.3-ERRORS',
      framework: 'SOC2',
      category: 'Incident Response',
      title: 'Error handling and reporting',
      description: 'Application should have proper error handling that does not leak sensitive data',
      status: errorHandlerCount >= 2 ? 'pass' : 'warn',
      evidence,
      remediation: 'Implement global error handlers that sanitize error messages before returning to clients',
    }
  }

  private checkInputValidation(): ComplianceCheck {
    const evidence: string[] = []
    const validationKeywords = ['zod', 'joi', 'yup', 'ajv', 'validator', 'sanitize', 'express-validator', 'class-validator']
    const hasValidation = this.allFiles.some(f => {
      if (!SCANNABLE_EXTENSIONS.has(extname(f))) return false
      try {
        const content = readFileSync(join(this.rootDir, f), 'utf-8')
        return validationKeywords.some(kw => content.includes(kw))
      } catch { return false }
    })
    if (hasValidation) evidence.push('Input validation library detected')

    return {
      id: 'SOC2-CC6.8-INPUT',
      framework: 'SOC2',
      category: 'Data Integrity',
      title: 'Input validation',
      description: 'User inputs should be validated and sanitized',
      status: hasValidation ? 'pass' : 'warn',
      evidence,
      remediation: 'Add input validation using zod, joi, or similar schema validation library',
    }
  }

  private checkCICD(): ComplianceCheck {
    const evidence: string[] = []
    const hasCICD = existsSync(join(this.rootDir, '.github', 'workflows'))
      || existsSync(join(this.rootDir, '.gitlab-ci.yml'))
      || existsSync(join(this.rootDir, 'Jenkinsfile'))
    if (hasCICD) evidence.push('CI/CD pipeline configuration found')

    const hasSecurityStep = this.allFiles.some(f => {
      if (!f.includes('workflow') && !f.includes('ci')) return false
      try {
        const content = readFileSync(join(this.rootDir, f), 'utf-8')
        return content.includes('security') || content.includes('audit') || content.includes('scan')
      } catch { return false }
    })
    if (hasSecurityStep) evidence.push('Security scanning step in CI pipeline')

    return {
      id: 'SOC2-CC8.1-CICD',
      framework: 'SOC2',
      category: 'Change Management',
      title: 'CI/CD pipeline with security checks',
      description: 'Automated build and deploy pipelines should include security scanning',
      status: hasCICD ? (hasSecurityStep ? 'pass' : 'warn') : 'fail',
      evidence,
      remediation: 'Set up CI/CD with automated security scanning (SAST, dependency audit)',
    }
  }

  // ===== GDPR Checks =====

  private gdprChecks(): ComplianceCheck[] {
    return [
      this.checkPIIHandling(),
      this.checkDataRetention(),
      this.checkConsentMechanisms(),
      this.checkDataMasking(),
      this.checkPrivacyPolicy(),
    ]
  }

  private checkPIIHandling(): ComplianceCheck {
    const piiFindings = this.scanForPII()
    const evidence = piiFindings.slice(0, 10).map(f =>
      `PII field "${f.fieldName}" in ${f.file}:${f.line}`
    )

    if (piiFindings.length > 10) {
      evidence.push(`...and ${piiFindings.length - 10} more PII references`)
    }

    return {
      id: 'GDPR-ART5-PII',
      framework: 'GDPR',
      category: 'Data Protection',
      title: 'PII data handling inventory',
      description: 'All personally identifiable information should be identified and properly handled',
      status: piiFindings.length === 0 ? 'pass' : 'warn',
      evidence: piiFindings.length === 0 ? ['No PII field patterns detected'] : evidence,
      remediation: piiFindings.length > 0 ? 'Review PII handling: ensure encryption at rest, access controls, and data minimization' : undefined,
    }
  }

  private checkDataRetention(): ComplianceCheck {
    const evidence: string[] = []
    const retentionKeywords = ['retention', 'ttl', 'expires', 'expiry', 'cleanup', 'purge', 'archive']
    const hasRetention = this.allFiles.some(f => {
      if (!SCANNABLE_EXTENSIONS.has(extname(f))) return false
      try {
        const content = readFileSync(join(this.rootDir, f), 'utf-8').toLowerCase()
        return retentionKeywords.some(kw => content.includes(kw))
      } catch { return false }
    })
    if (hasRetention) evidence.push('Data retention/expiry patterns found in code')

    return {
      id: 'GDPR-ART5E-RETENTION',
      framework: 'GDPR',
      category: 'Data Retention',
      title: 'Data retention policies',
      description: 'Personal data should have defined retention periods and cleanup mechanisms',
      status: hasRetention ? 'pass' : 'warn',
      evidence,
      remediation: 'Implement data retention policies with automatic cleanup for personal data',
    }
  }

  private checkConsentMechanisms(): ComplianceCheck {
    const evidence: string[] = []
    const consentKeywords = ['consent', 'opt-in', 'opt-out', 'gdpr', 'cookie', 'privacy']
    const hasConsent = this.allFiles.some(f => {
      if (!SCANNABLE_EXTENSIONS.has(extname(f))) return false
      try {
        const content = readFileSync(join(this.rootDir, f), 'utf-8').toLowerCase()
        return consentKeywords.some(kw => content.includes(kw))
      } catch { return false }
    })
    if (hasConsent) evidence.push('Consent management references found')

    return {
      id: 'GDPR-ART7-CONSENT',
      framework: 'GDPR',
      category: 'Consent',
      title: 'Consent collection mechanisms',
      description: 'User consent should be explicitly collected before processing personal data',
      status: hasConsent ? 'pass' : 'warn',
      evidence,
      remediation: 'Implement explicit consent collection with audit trail for user data processing',
    }
  }

  private checkDataMasking(): ComplianceCheck {
    const evidence: string[] = []
    const maskingKeywords = ['mask', 'redact', 'anonymize', 'pseudonymize', 'obfuscate', 'sanitize']
    const hasMasking = this.allFiles.some(f => {
      if (!SCANNABLE_EXTENSIONS.has(extname(f))) return false
      try {
        const content = readFileSync(join(this.rootDir, f), 'utf-8').toLowerCase()
        return maskingKeywords.some(kw => content.includes(kw))
      } catch { return false }
    })
    if (hasMasking) evidence.push('Data masking/redaction patterns found in code')

    // Check logging for PII masking
    const logsMaskPII = this.allFiles.some(f => {
      if (!f.includes('log')) return false
      try {
        const content = readFileSync(join(this.rootDir, f), 'utf-8').toLowerCase()
        return content.includes('redact') || content.includes('mask') || content.includes('sanitize')
      } catch { return false }
    })
    if (logsMaskPII) evidence.push('PII masking in logging detected')

    return {
      id: 'GDPR-ART25-MASKING',
      framework: 'GDPR',
      category: 'Data Protection by Design',
      title: 'Data masking and anonymization',
      description: 'PII should be masked in logs and non-production environments',
      status: hasMasking ? 'pass' : 'warn',
      evidence,
      remediation: 'Implement data masking for PII in logs, error reports, and non-production environments',
    }
  }

  private checkPrivacyPolicy(): ComplianceCheck {
    const evidence: string[] = []
    const hasPolicy = this.allFiles.some(f =>
      f.toLowerCase().includes('privacy') && (f.endsWith('.md') || f.endsWith('.html') || f.endsWith('.txt'))
    )
    if (hasPolicy) evidence.push('Privacy policy document found')

    return {
      id: 'GDPR-ART13-PRIVACY',
      framework: 'GDPR',
      category: 'Transparency',
      title: 'Privacy policy documentation',
      description: 'A privacy policy should be accessible to users',
      status: hasPolicy ? 'pass' : 'fail',
      evidence,
      remediation: 'Create a PRIVACY.md or privacy policy page describing data collection and processing',
    }
  }

  // --- PII Scanning ---

  private scanForPII(): PIIFinding[] {
    const findings: PIIFinding[] = []
    const schemaFiles = this.allFiles.filter(f => {
      const ext = extname(f)
      return SCANNABLE_EXTENSIONS.has(ext)
    })

    for (const file of schemaFiles) {
      try {
        const content = readFileSync(join(this.rootDir, file), 'utf-8')
        const lines = content.split('\n')

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!
          for (const { pattern, fieldName } of PII_FIELD_PATTERNS) {
            pattern.lastIndex = 0
            if (pattern.test(line)) {
              // Skip test files, config files, and imports
              if (file.includes('.test.') || file.includes('.spec.') || line.trim().startsWith('import')) continue
              findings.push({
                file,
                line: i + 1,
                pattern: pattern.source,
                fieldName,
                confidence: 0.7,
              })
            }
          }
        }
      } catch {
        // skip unreadable
      }
    }

    return findings
  }

  // --- Score calculation ---

  private calculateScore(checks: ComplianceCheck[]): ComplianceScore {
    const passCount = checks.filter(c => c.status === 'pass').length
    const failCount = checks.filter(c => c.status === 'fail').length
    const warnCount = checks.filter(c => c.status === 'warn').length
    const naCount = checks.filter(c => c.status === 'not-applicable').length

    const applicable = checks.length - naCount
    const overall = applicable > 0
      ? Math.round(((passCount + warnCount * 0.5) / applicable) * 100)
      : 0

    const soc2Checks = checks.filter(c => c.framework === 'SOC2')
    const gdprChecks = checks.filter(c => c.framework === 'GDPR')

    const soc2Applicable = soc2Checks.filter(c => c.status !== 'not-applicable').length
    const soc2Pass = soc2Checks.filter(c => c.status === 'pass').length
    const soc2Warn = soc2Checks.filter(c => c.status === 'warn').length
    const soc2 = soc2Applicable > 0
      ? Math.round(((soc2Pass + soc2Warn * 0.5) / soc2Applicable) * 100)
      : 0

    const gdprApplicable = gdprChecks.filter(c => c.status !== 'not-applicable').length
    const gdprPass = gdprChecks.filter(c => c.status === 'pass').length
    const gdprWarn = gdprChecks.filter(c => c.status === 'warn').length
    const gdpr = gdprApplicable > 0
      ? Math.round(((gdprPass + gdprWarn * 0.5) / gdprApplicable) * 100)
      : 0

    return { overall, soc2, gdpr, passCount, failCount, warnCount, naCount }
  }

  // --- File walking ---

  private walkDir(dir: string, depth = 0): string[] {
    if (depth > 8) return []
    const results: string[] = []
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name)) continue
        if (entry.name.startsWith('.') && entry.name !== '.github') continue
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          results.push(...this.walkDir(fullPath, depth + 1))
        } else {
          results.push(relative(this.rootDir, fullPath))
        }
      }
    } catch { /* skip */ }
    return results
  }
}

// ---------- ComplianceGuard (Phase 1) ----------

export interface RegionPolicy {
  allowedRegions: string[]
  blockedRegions: string[]
  requireEU: boolean
}

export interface GuardResult {
  allowed: boolean
  violations: GuardViolation[]
}

export interface GuardViolation {
  rule: string
  severity: 'error' | 'warning'
  message: string
  remediation: string
}

/**
 * GDPR-compliant region/provider constraint to enforce before
 * IaCFactory writes any Terraform. Imported by InfrastructureManager
 * and the /infra command to gate deployments.
 */

const GDPR_EU_REGIONS: Record<string, string[]> = {
  aws: [
    'eu-west-1', 'eu-west-2', 'eu-west-3',
    'eu-central-1', 'eu-central-2',
    'eu-north-1', 'eu-south-1', 'eu-south-2',
  ],
  gcp: [
    'europe-west1', 'europe-west2', 'europe-west3',
    'europe-west4', 'europe-west6', 'europe-west8',
    'europe-west9', 'europe-west10', 'europe-west12',
    'europe-north1', 'europe-southwest1',
    'europe-central2',
  ],
  azure: [
    'westeurope', 'northeurope', 'francecentral',
    'francesouth', 'germanywestcentral', 'germanynorth',
    'swedencentral', 'switzerlandnorth', 'switzerlandwest',
    'norwayeast', 'norwaywest', 'uksouth', 'ukwest',
    'italynorth', 'polandcentral', 'spaincentral',
  ],
}

export class ComplianceGuard {
  private policy: RegionPolicy

  constructor(policy?: Partial<RegionPolicy>) {
    this.policy = {
      allowedRegions: policy?.allowedRegions ?? [],
      blockedRegions: policy?.blockedRegions ?? [],
      requireEU: policy?.requireEU ?? false,
    }
  }

  /**
   * Validate a provider + region combination against the policy.
   */
  validateRegion(provider: string, region: string): GuardResult {
    const violations: GuardViolation[] = []

    // Check explicit block list
    if (this.policy.blockedRegions.includes(region)) {
      violations.push({
        rule: 'BLOCKED_REGION',
        severity: 'error',
        message: `Region "${region}" is explicitly blocked by policy`,
        remediation: `Choose a region from the allowed list: ${this.policy.allowedRegions.join(', ') || 'any non-blocked region'}`,
      })
    }

    // Check allowed list (if non-empty, only listed regions pass)
    if (this.policy.allowedRegions.length > 0 && !this.policy.allowedRegions.includes(region)) {
      violations.push({
        rule: 'REGION_NOT_ALLOWED',
        severity: 'error',
        message: `Region "${region}" is not in the allowed list`,
        remediation: `Use one of: ${this.policy.allowedRegions.join(', ')}`,
      })
    }

    // GDPR EU-only enforcement
    if (this.policy.requireEU) {
      const euRegions = GDPR_EU_REGIONS[provider] ?? []
      if (!euRegions.includes(region)) {
        violations.push({
          rule: 'GDPR_EU_ONLY',
          severity: 'error',
          message: `Region "${region}" is not GDPR-compliant for EU data (provider: ${provider})`,
          remediation: `Use an EU region: ${euRegions.slice(0, 5).join(', ')}...`,
        })
      }
    }

    return {
      allowed: violations.filter(v => v.severity === 'error').length === 0,
      violations,
    }
  }

  /**
   * Validate an entire IaC config before deployment.
   */
  validateConfig(config: {
    provider: string
    region: string
    environment: string
    stateBackend?: { encrypt: boolean }
    database?: { encrypted: boolean; multiAz: boolean }
  }): GuardResult {
    const violations: GuardViolation[] = []

    // Region check
    const regionResult = this.validateRegion(config.provider, config.region)
    violations.push(...regionResult.violations)

    // SOC2: state encryption
    if (config.stateBackend && !config.stateBackend.encrypt && config.environment === 'production') {
      violations.push({
        rule: 'SOC2_STATE_ENCRYPTION',
        severity: 'error',
        message: 'Terraform state must be encrypted at rest for production (SOC2 CC6.1)',
        remediation: 'Set stateBackend.encrypt = true',
      })
    }

    // SOC2: database encryption
    if (config.database && !config.database.encrypted && config.environment === 'production') {
      violations.push({
        rule: 'SOC2_DB_ENCRYPTION',
        severity: 'error',
        message: 'Database must be encrypted at rest for production (SOC2 CC6.1)',
        remediation: 'Set database.encrypted = true',
      })
    }

    // SOC2: multi-AZ for production
    if (config.database && !config.database.multiAz && config.environment === 'production') {
      violations.push({
        rule: 'SOC2_DB_HA',
        severity: 'warning',
        message: 'Production database should use multi-AZ for high availability (SOC2 CC7.1)',
        remediation: 'Set database.multiAz = true for production',
      })
    }

    return {
      allowed: violations.filter(v => v.severity === 'error').length === 0,
      violations,
    }
  }

  /**
   * Get the list of GDPR-compliant regions for a provider.
   */
  static getEURegions(provider: string): string[] {
    return GDPR_EU_REGIONS[provider] ?? []
  }
}
