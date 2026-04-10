/**
 * DiscoveryEngine — Phase 0: Autonomous Tech Discovery
 *
 * Scans a target repository to identify:
 * - Primary language and framework
 * - Database and API structures
 * - Dependency graph
 * - Architectural entry points
 * - Project type classification
 */

import { existsSync, readdirSync, readFileSync } from 'fs'
import { join, basename, extname, relative } from 'path'

// ---------- Types ----------

export interface DependencyInfo {
  name: string
  version: string
  type: 'production' | 'development' | 'peer'
}

export interface EntryPoint {
  path: string
  type: 'main' | 'binary' | 'server' | 'cli' | 'test' | 'config'
}

export interface FrameworkDetection {
  name: string
  confidence: number // 0-1
  evidence: string[]
}

export interface DatabaseDetection {
  type: string
  confidence: number
  evidence: string[]
}

export interface ProjectInventory {
  scanTimestamp: string
  rootDir: string
  languages: LanguageBreakdown[]
  primaryLanguage: string
  frameworks: FrameworkDetection[]
  databases: DatabaseDetection[]
  dependencies: DependencyInfo[]
  entryPoints: EntryPoint[]
  projectType: 'cli' | 'web-app' | 'api-service' | 'library' | 'monorepo' | 'unknown'
  fileCount: number
  directoryStructure: string[]
  packageManagers: string[]
  hasTests: boolean
  hasCICD: boolean
  hasDocker: boolean
  hasIaC: boolean
}

export interface LanguageBreakdown {
  language: string
  fileCount: number
  percentage: number
}

// ---------- Constants ----------

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin',
  '.rb': 'ruby',
  '.php': 'php',
  '.dart': 'dart',
  '.swift': 'swift',
  '.cs': 'csharp',
  '.cpp': 'cpp',
  '.c': 'c',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.sh': 'shell',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.json': 'json',
  '.toml': 'toml',
  '.tf': 'terraform',
  '.hcl': 'terraform',
}

const FRAMEWORK_SIGNATURES: Record<string, { files: string[]; deps: string[] }> = {
  'react': { files: [], deps: ['react', 'react-dom'] },
  'next.js': { files: ['next.config.js', 'next.config.mjs', 'next.config.ts'], deps: ['next'] },
  'express': { files: [], deps: ['express'] },
  'fastify': { files: [], deps: ['fastify'] },
  'nestjs': { files: [], deps: ['@nestjs/core'] },
  'django': { files: ['manage.py'], deps: ['django'] },
  'flask': { files: [], deps: ['flask', 'Flask'] },
  'fastapi': { files: [], deps: ['fastapi'] },
  'spring-boot': { files: [], deps: ['spring-boot-starter'] },
  'rails': { files: ['config/routes.rb'], deps: ['rails'] },
  'gin': { files: [], deps: ['github.com/gin-gonic/gin'] },
  'actix': { files: [], deps: ['actix-web'] },
  'vue': { files: [], deps: ['vue'] },
  'angular': { files: ['angular.json'], deps: ['@angular/core'] },
  'svelte': { files: [], deps: ['svelte'] },
  'terraform': { files: ['main.tf', 'variables.tf'], deps: [] },
  'ansible': { files: ['playbook.yml', 'ansible.cfg'], deps: [] },
  'kubernetes': { files: [], deps: [] }, // detected via yaml content
}

const DATABASE_SIGNATURES: Record<string, { deps: string[]; envVars: string[]; files: string[] }> = {
  'postgresql': {
    deps: ['pg', 'psycopg2', 'pgx', 'sqlalchemy', 'prisma', 'typeorm'],
    envVars: ['DATABASE_URL', 'POSTGRES_', 'PG_'],
    files: [],
  },
  'mysql': {
    deps: ['mysql', 'mysql2', 'pymysql'],
    envVars: ['MYSQL_'],
    files: [],
  },
  'mongodb': {
    deps: ['mongoose', 'mongodb', 'pymongo', 'motor'],
    envVars: ['MONGO_', 'MONGODB_'],
    files: [],
  },
  'redis': {
    deps: ['redis', 'ioredis', 'aioredis'],
    envVars: ['REDIS_'],
    files: [],
  },
  'sqlite': {
    deps: ['sqlite3', 'better-sqlite3', 'sqlcipher'],
    envVars: [],
    files: ['*.sqlite', '*.db'],
  },
  'dynamodb': {
    deps: ['@aws-sdk/client-dynamodb', 'boto3'],
    envVars: ['DYNAMODB_'],
    files: [],
  },
}

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  'venv', '.venv', 'vendor', 'target', '.idea', '.vscode',
  'coverage', '.nyc_output', '.cache', '.turbo', '.parcel-cache',
])

// ---------- Engine ----------

export class DiscoveryEngine {
  private rootDir: string
  private allFiles: string[] = []
  private depNames: Set<string> = new Set()

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }

  async scan(): Promise<ProjectInventory> {
    this.allFiles = this.walkDir(this.rootDir)
    const dependencies = this.parseDependencies()
    this.depNames = new Set(dependencies.map(d => d.name))

    const languages = this.detectLanguages()
    const primaryLanguage = languages[0]?.language ?? 'unknown'
    const frameworks = this.detectFrameworks()
    const databases = this.detectDatabases()
    const entryPoints = this.findEntryPoints()
    const projectType = this.classifyProjectType(entryPoints, frameworks)
    const packageManagers = this.detectPackageManagers()
    const directoryStructure = this.getTopLevelDirs()

    return {
      scanTimestamp: new Date().toISOString(),
      rootDir: this.rootDir,
      languages,
      primaryLanguage,
      frameworks,
      databases,
      dependencies,
      entryPoints,
      projectType,
      fileCount: this.allFiles.length,
      directoryStructure,
      packageManagers,
      hasTests: this.hasTests(),
      hasCICD: this.hasCICD(),
      hasDocker: this.hasDocker(),
      hasIaC: this.hasIaC(),
    }
  }

  // --- File walking ---

  private walkDir(dir: string, depth = 0): string[] {
    if (depth > 10) return []
    const results: string[] = []
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name)) continue
        if (entry.name.startsWith('.') && entry.name !== '.github') continue
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          results.push(...this.walkDir(fullPath, depth + 1))
        } else if (entry.isFile()) {
          results.push(relative(this.rootDir, fullPath))
        }
      }
    } catch {
      // permission denied or similar
    }
    return results
  }

  // --- Language detection ---

  private detectLanguages(): LanguageBreakdown[] {
    const counts: Record<string, number> = {}
    for (const file of this.allFiles) {
      const ext = extname(file)
      const lang = EXTENSION_TO_LANGUAGE[ext]
      if (lang) {
        counts[lang] = (counts[lang] ?? 0) + 1
      }
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    return Object.entries(counts)
      .map(([language, fileCount]) => ({
        language,
        fileCount,
        percentage: Math.round((fileCount / total) * 100),
      }))
      .sort((a, b) => b.fileCount - a.fileCount || a.language.localeCompare(b.language))
  }

  // --- Dependency parsing ---

  private parseDependencies(): DependencyInfo[] {
    const deps: DependencyInfo[] = []
    const pkgPath = join(this.rootDir, 'package.json')
    if (existsSync(pkgPath)) {
      deps.push(...this.parsePackageJson(pkgPath))
    }
    const reqPath = join(this.rootDir, 'requirements.txt')
    if (existsSync(reqPath)) {
      deps.push(...this.parseRequirementsTxt(reqPath))
    }
    const goModPath = join(this.rootDir, 'go.mod')
    if (existsSync(goModPath)) {
      deps.push(...this.parseGoMod(goModPath))
    }
    const cargoPath = join(this.rootDir, 'Cargo.toml')
    if (existsSync(cargoPath)) {
      deps.push(...this.parseCargoToml(cargoPath))
    }
    return deps
  }

  private parsePackageJson(filePath: string): DependencyInfo[] {
    try {
      const pkg = JSON.parse(readFileSync(filePath, 'utf-8'))
      const deps: DependencyInfo[] = []
      for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
        deps.push({ name, version: String(version), type: 'production' })
      }
      for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
        deps.push({ name, version: String(version), type: 'development' })
      }
      for (const [name, version] of Object.entries(pkg.peerDependencies ?? {})) {
        deps.push({ name, version: String(version), type: 'peer' })
      }
      return deps
    } catch {
      return []
    }
  }

  private parseRequirementsTxt(filePath: string): DependencyInfo[] {
    try {
      const lines = readFileSync(filePath, 'utf-8').split('\n')
      const deps: DependencyInfo[] = []
      for (const raw of lines) {
        const l = raw.trim()
        if (!l || l.startsWith('#')) continue
        const match = l.match(/^([a-zA-Z0-9_.-]+)\s*([><=!~]+\s*[\d.]+)?/)
        if (match) {
          deps.push({ name: match[1]!, version: match[2]?.trim() ?? '*', type: 'production' })
        }
      }
      return deps
    } catch {
      return []
    }
  }

  private parseGoMod(filePath: string): DependencyInfo[] {
    try {
      const content = readFileSync(filePath, 'utf-8')
      const deps: DependencyInfo[] = []
      const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/g)
      if (requireBlock) {
        for (const block of requireBlock) {
          const lines = block.split('\n').slice(1, -1)
          for (const line of lines) {
            const match = line.trim().match(/^(\S+)\s+(\S+)/)
            if (match) {
              deps.push({ name: match[1]!, version: match[2]!, type: 'production' })
            }
          }
        }
      }
      return deps
    } catch {
      return []
    }
  }

  private parseCargoToml(filePath: string): DependencyInfo[] {
    try {
      const content = readFileSync(filePath, 'utf-8')
      const deps: DependencyInfo[] = []
      const depSection = content.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/)
      if (depSection) {
        const lines = depSection[1]!.split('\n')
        for (const line of lines) {
          const match = line.trim().match(/^(\w[\w-]*)\s*=\s*"([^"]+)"/)
          if (match) {
            deps.push({ name: match[1]!, version: match[2]!, type: 'production' })
          }
        }
      }
      return deps
    } catch {
      return []
    }
  }

  // --- Framework detection ---

  private detectFrameworks(): FrameworkDetection[] {
    const detections: FrameworkDetection[] = []
    const fileSet = new Set(this.allFiles.map(f => f.replace(/\\/g, '/')))

    for (const [name, sig] of Object.entries(FRAMEWORK_SIGNATURES)) {
      const evidence: string[] = []
      let score = 0

      for (const file of sig.files) {
        if (fileSet.has(file) || this.allFiles.some(f => f.endsWith(file))) {
          evidence.push(`Found config file: ${file}`)
          score += 0.5
        }
      }

      for (const dep of sig.deps) {
        if (this.depNames.has(dep)) {
          evidence.push(`Dependency found: ${dep}`)
          score += 0.5
        }
      }

      if (evidence.length > 0) {
        detections.push({
          name,
          confidence: Math.min(score, 1),
          evidence,
        })
      }
    }

    return detections.sort((a, b) => b.confidence - a.confidence)
  }

  // --- Database detection ---

  private detectDatabases(): DatabaseDetection[] {
    const detections: DatabaseDetection[] = []

    // Check for .env files to scan for DB env vars
    const envContent = this.readEnvFiles()

    for (const [dbType, sig] of Object.entries(DATABASE_SIGNATURES)) {
      const evidence: string[] = []
      let score = 0

      for (const dep of sig.deps) {
        if (this.depNames.has(dep)) {
          evidence.push(`Dependency: ${dep}`)
          score += 0.4
        }
      }

      for (const prefix of sig.envVars) {
        if (envContent.some(line => line.startsWith(prefix))) {
          evidence.push(`Environment variable with prefix: ${prefix}`)
          score += 0.3
        }
      }

      if (evidence.length > 0) {
        detections.push({
          type: dbType,
          confidence: Math.min(score, 1),
          evidence,
        })
      }
    }

    return detections.sort((a, b) => b.confidence - a.confidence)
  }

  private readEnvFiles(): string[] {
    const lines: string[] = []
    const envFiles = ['.env', '.env.example', '.env.sample', '.env.template']
    for (const envFile of envFiles) {
      const envPath = join(this.rootDir, envFile)
      if (existsSync(envPath)) {
        try {
          lines.push(...readFileSync(envPath, 'utf-8').split('\n'))
        } catch {
          // skip unreadable
        }
      }
    }
    return lines
  }

  // --- Entry point detection ---

  private findEntryPoints(): EntryPoint[] {
    const entries: EntryPoint[] = []
    const mainPatterns = [
      'src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.tsx',
      'index.ts', 'index.js', 'main.go', 'cmd/main.go',
      'src/main.rs', 'src/lib.rs', 'app.py', 'main.py', 'manage.py',
      'src/app.ts', 'src/server.ts', 'server.js', 'server.ts',
    ]
    const fileSet = new Set(this.allFiles.map(f => f.replace(/\\/g, '/')))

    for (const pattern of mainPatterns) {
      if (fileSet.has(pattern)) {
        const type = pattern.includes('server') ? 'server'
          : pattern.includes('cli') ? 'cli'
          : 'main'
        entries.push({ path: pattern, type })
      }
    }

    // Check bin entries from package.json
    const pkgPath = join(this.rootDir, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.bin) {
          for (const [, binPath] of Object.entries(pkg.bin)) {
            entries.push({ path: String(binPath), type: 'binary' })
          }
        }
        if (pkg.main) {
          entries.push({ path: pkg.main, type: 'main' })
        }
      } catch {
        // skip
      }
    }

    // Detect test directories
    const testDirs = ['test', 'tests', '__tests__', 'spec']
    for (const td of testDirs) {
      if (this.allFiles.some(f => f.startsWith(td + '/') || f.startsWith(td + '\\'))) {
        entries.push({ path: td + '/', type: 'test' })
      }
    }

    return entries
  }

  // --- Project type classification ---

  private classifyProjectType(
    entryPoints: EntryPoint[],
    frameworks: FrameworkDetection[],
  ): ProjectInventory['projectType'] {
    const frameworkNames = new Set(frameworks.map(f => f.name))
    const hasServer = entryPoints.some(e => e.type === 'server')
    const hasBin = entryPoints.some(e => e.type === 'binary' || e.type === 'cli')
    const hasWebFramework = frameworkNames.has('react') || frameworkNames.has('vue')
      || frameworkNames.has('angular') || frameworkNames.has('svelte')
      || frameworkNames.has('next.js')
    const hasApiFramework = frameworkNames.has('express') || frameworkNames.has('fastify')
      || frameworkNames.has('nestjs') || frameworkNames.has('django')
      || frameworkNames.has('flask') || frameworkNames.has('fastapi')
      || frameworkNames.has('gin') || frameworkNames.has('spring-boot')

    // Check for monorepo markers
    const hasWorkspaces = existsSync(join(this.rootDir, 'lerna.json'))
      || existsSync(join(this.rootDir, 'pnpm-workspace.yaml'))
      || existsSync(join(this.rootDir, 'turbo.json'))
    if (hasWorkspaces) return 'monorepo'

    if (hasWebFramework && hasApiFramework) return 'web-app'
    if (hasWebFramework) return 'web-app'
    if (hasApiFramework || hasServer) return 'api-service'
    if (hasBin) return 'cli'

    // Check for library markers
    const pkgPath = join(this.rootDir, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.main || pkg.exports || pkg.types) return 'library'
      } catch {
        // skip
      }
    }

    return 'unknown'
  }

  // --- Utility detections ---

  private detectPackageManagers(): string[] {
    const managers: string[] = []
    const checks: [string, string][] = [
      ['package-lock.json', 'npm'],
      ['yarn.lock', 'yarn'],
      ['pnpm-lock.yaml', 'pnpm'],
      ['bun.lock', 'bun'],
      ['bun.lockb', 'bun'],
      ['Pipfile.lock', 'pipenv'],
      ['poetry.lock', 'poetry'],
      ['go.sum', 'go modules'],
      ['Cargo.lock', 'cargo'],
      ['Gemfile.lock', 'bundler'],
      ['composer.lock', 'composer'],
    ]
    for (const [file, manager] of checks) {
      if (existsSync(join(this.rootDir, file))) {
        managers.push(manager)
      }
    }
    return managers
  }

  private hasTests(): boolean {
    const testPatterns = ['.test.', '.spec.', '_test.go', '_test.py', 'test_']
    return this.allFiles.some(f => testPatterns.some(p => f.includes(p)))
  }

  private hasCICD(): boolean {
    return existsSync(join(this.rootDir, '.github', 'workflows'))
      || existsSync(join(this.rootDir, '.gitlab-ci.yml'))
      || existsSync(join(this.rootDir, 'Jenkinsfile'))
      || existsSync(join(this.rootDir, '.circleci'))
      || existsSync(join(this.rootDir, 'azure-pipelines.yml'))
      || existsSync(join(this.rootDir, 'bitbucket-pipelines.yml'))
  }

  private hasDocker(): boolean {
    return existsSync(join(this.rootDir, 'Dockerfile'))
      || existsSync(join(this.rootDir, 'docker-compose.yml'))
      || existsSync(join(this.rootDir, 'docker-compose.yaml'))
      || this.allFiles.some(f => basename(f) === 'Dockerfile')
  }

  private hasIaC(): boolean {
    return this.allFiles.some(f => f.endsWith('.tf'))
      || existsSync(join(this.rootDir, 'ansible.cfg'))
      || existsSync(join(this.rootDir, 'pulumi.yaml'))
      || this.allFiles.some(f => f.includes('k8s/') || f.includes('kubernetes/'))
      || this.allFiles.some(f => f.endsWith('.helm'))
  }

  private getTopLevelDirs(): string[] {
    try {
      return readdirSync(this.rootDir, { withFileTypes: true })
        .filter(e => e.isDirectory() && !IGNORED_DIRS.has(e.name) && !e.name.startsWith('.'))
        .map(e => e.name)
        .sort()
    } catch {
      return []
    }
  }
}
