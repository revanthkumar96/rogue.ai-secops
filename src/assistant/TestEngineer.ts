/**
 * TestArchitect — Phase 2: Autonomous Test Strategy Design
 *
 * Analyzes a project (via Phase 0 ProjectInventory) and designs an optimal
 * testing strategy: unit, integration, E2E mix. Detects existing test
 * frameworks and generates boilerplate for missing test layers.
 *
 * Connects to Phase 0 DiscoveryEngine for project analysis.
 */

import { existsSync, readFileSync, readdirSync } from 'fs'
import { join, extname, relative } from 'path'
import type { ProjectInventory } from '../coordinator/DiscoveryEngine.js'

// ---------- Types ----------

export type TestLayer = 'unit' | 'integration' | 'e2e' | 'contract' | 'performance'

export interface TestFrameworkDetection {
  name: string
  layer: TestLayer
  configFile?: string
  confidence: number
}

export interface TestStrategy {
  projectName: string
  projectType: string
  detectedFrameworks: TestFrameworkDetection[]
  recommendedFrameworks: FrameworkRecommendation[]
  coverageTarget: number
  layers: TestLayerPlan[]
  boilerplates: GeneratedBoilerplate[]
}

export interface TestLayerPlan {
  layer: TestLayer
  priority: 'critical' | 'high' | 'medium' | 'low'
  description: string
  coverageTarget: number
  estimatedFiles: number
  framework: string
}

export interface FrameworkRecommendation {
  layer: TestLayer
  framework: string
  reason: string
  installCommand: string
}

export interface GeneratedBoilerplate {
  path: string
  content: string
  layer: TestLayer
  description: string
}

export interface CoverageReport {
  overall: number
  byLayer: Record<TestLayer, number>
  uncoveredPaths: string[]
  meetsSoc2: boolean
}

// ---------- Framework signatures ----------

const FRAMEWORK_SIGNATURES: Record<string, { layer: TestLayer; configs: string[]; deps: string[] }> = {
  jest: { layer: 'unit', configs: ['jest.config.js', 'jest.config.ts', 'jest.config.mjs'], deps: ['jest', '@jest/core'] },
  vitest: { layer: 'unit', configs: ['vitest.config.ts', 'vitest.config.js'], deps: ['vitest'] },
  mocha: { layer: 'unit', configs: ['.mocharc.yml', '.mocharc.json'], deps: ['mocha'] },
  pytest: { layer: 'unit', configs: ['pytest.ini', 'pyproject.toml', 'conftest.py'], deps: ['pytest'] },
  'go-test': { layer: 'unit', configs: [], deps: [] },
  'bun-test': { layer: 'unit', configs: [], deps: [] },
  cypress: { layer: 'e2e', configs: ['cypress.config.ts', 'cypress.config.js', 'cypress.json'], deps: ['cypress'] },
  playwright: { layer: 'e2e', configs: ['playwright.config.ts', 'playwright.config.js'], deps: ['@playwright/test'] },
  supertest: { layer: 'integration', configs: [], deps: ['supertest'] },
  pact: { layer: 'contract', configs: [], deps: ['@pact-foundation/pact'] },
  k6: { layer: 'performance', configs: [], deps: ['k6'] },
}

const LANGUAGE_FRAMEWORK_MAP: Record<string, Record<TestLayer, string>> = {
  typescript: { unit: 'vitest', integration: 'supertest', e2e: 'playwright', contract: 'pact', performance: 'k6' },
  javascript: { unit: 'jest', integration: 'supertest', e2e: 'playwright', contract: 'pact', performance: 'k6' },
  python: { unit: 'pytest', integration: 'pytest', e2e: 'playwright', contract: 'pact', performance: 'locust' },
  go: { unit: 'go-test', integration: 'go-test', e2e: 'playwright', contract: 'pact', performance: 'k6' },
  rust: { unit: 'cargo-test', integration: 'cargo-test', e2e: 'playwright', contract: 'pact', performance: 'k6' },
  java: { unit: 'junit', integration: 'junit', e2e: 'playwright', contract: 'pact', performance: 'gatling' },
}

// ---------- TestArchitect ----------

export class TestArchitect {
  private rootDir: string

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }

  /**
   * Design a complete test strategy from a Phase 0 inventory.
   */
  designStrategy(inventory: ProjectInventory): TestStrategy {
    const detected = this.detectFrameworks(inventory)
    const recommended = this.recommendFrameworks(inventory, detected)
    const layers = this.planLayers(inventory, detected)
    const boilerplates = this.generateBoilerplates(inventory, recommended, detected)

    return {
      projectName: inventory.rootDir.split(/[/\\]/).pop() ?? 'project',
      projectType: inventory.projectType,
      detectedFrameworks: detected,
      recommendedFrameworks: recommended,
      coverageTarget: 80,
      layers,
      boilerplates,
    }
  }

  /**
   * Analyze existing test coverage (heuristic — counts test files vs source files).
   */
  estimateCoverage(inventory: ProjectInventory): CoverageReport {
    const sourceExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'])
    const allFiles = this.walkDir(this.rootDir)
    const sourceFiles = allFiles.filter(f => sourceExts.has(extname(f)) && !this.isTestFile(f))
    const testFiles = allFiles.filter(f => this.isTestFile(f))

    const ratio = sourceFiles.length > 0 ? Math.round((testFiles.length / sourceFiles.length) * 100) : 0
    const overall = Math.min(ratio, 100)

    const unitTests = testFiles.filter(f => f.includes('.test.') || f.includes('.spec.') || f.includes('_test.')).length
    const e2eTests = testFiles.filter(f => f.includes('e2e') || f.includes('cypress') || f.includes('playwright')).length
    const integrationTests = testFiles.filter(f => f.includes('integration') || f.includes('.int.')).length

    const total = Math.max(testFiles.length, 1)
    const uncovered = sourceFiles
      .filter(f => !testFiles.some(t => t.replace(/\.test\.|\.spec\.|_test\./, '.').includes(f.replace(extname(f), ''))))
      .slice(0, 20)

    return {
      overall,
      byLayer: {
        unit: Math.round((unitTests / total) * overall),
        integration: Math.round((integrationTests / total) * overall),
        e2e: Math.round((e2eTests / total) * overall),
        contract: 0,
        performance: 0,
      },
      uncoveredPaths: uncovered,
      meetsSoc2: overall >= 80,
    }
  }

  // --- Detection ---

  private detectFrameworks(inventory: ProjectInventory): TestFrameworkDetection[] {
    const detected: TestFrameworkDetection[] = []
    const depNames = new Set(inventory.dependencies.map(d => d.name))
    const allFiles = this.walkDir(this.rootDir)
    const fileSet = new Set(allFiles)

    for (const [name, sig] of Object.entries(FRAMEWORK_SIGNATURES)) {
      let confidence = 0
      let configFile: string | undefined

      for (const cfg of sig.configs) {
        if (fileSet.has(cfg) || allFiles.some(f => f.endsWith(cfg))) {
          confidence += 0.5
          configFile = cfg
        }
      }

      for (const dep of sig.deps) {
        if (depNames.has(dep)) confidence += 0.5
      }

      // Special: Go test files
      if (name === 'go-test' && inventory.primaryLanguage === 'go') {
        if (allFiles.some(f => f.endsWith('_test.go'))) confidence = 1
      }

      // Special: Bun test
      if (name === 'bun-test' && depNames.has('@types/bun')) {
        if (allFiles.some(f => f.includes('.test.ts'))) confidence = 0.8
      }

      if (confidence > 0) {
        detected.push({ name, layer: sig.layer, configFile, confidence: Math.min(confidence, 1) })
      }
    }

    return detected.sort((a, b) => b.confidence - a.confidence)
  }

  // --- Recommendations ---

  private recommendFrameworks(
    inventory: ProjectInventory,
    detected: TestFrameworkDetection[],
  ): FrameworkRecommendation[] {
    const recs: FrameworkRecommendation[] = []
    const detectedLayers = new Set(detected.map(d => d.layer))
    const langMap = LANGUAGE_FRAMEWORK_MAP[inventory.primaryLanguage] ?? LANGUAGE_FRAMEWORK_MAP['typescript']!

    const layerPriority: TestLayer[] = ['unit', 'integration', 'e2e']

    for (const layer of layerPriority) {
      if (!detectedLayers.has(layer)) {
        const framework = langMap[layer] ?? 'vitest'
        recs.push({
          layer,
          framework,
          reason: `No ${layer} testing framework detected`,
          installCommand: this.getInstallCommand(framework, inventory),
        })
      }
    }

    return recs
  }

  private getInstallCommand(framework: string, inventory: ProjectInventory): string {
    const pm = inventory.packageManagers[0] ?? 'npm'
    const install = pm === 'bun' ? 'bun add -d' : pm === 'yarn' ? 'yarn add -D' : pm === 'pnpm' ? 'pnpm add -D' : 'npm install --save-dev'

    const packages: Record<string, string> = {
      vitest: 'vitest @vitest/coverage-v8',
      jest: 'jest @types/jest ts-jest',
      playwright: '@playwright/test',
      cypress: 'cypress',
      supertest: 'supertest @types/supertest',
      pytest: 'pip install pytest pytest-cov',
      pact: '@pact-foundation/pact',
    }

    if (framework === 'pytest') return packages['pytest']!
    return `${install} ${packages[framework] ?? framework}`
  }

  // --- Layer planning ---

  private planLayers(
    inventory: ProjectInventory,
    detected: TestFrameworkDetection[],
  ): TestLayerPlan[] {
    const layers: TestLayerPlan[] = []
    const isAPI = inventory.projectType === 'api-service'
    const isWeb = inventory.projectType === 'web-app'
    const isCLI = inventory.projectType === 'cli'
    const detectedMap = new Map(detected.map(d => [d.layer, d.name]))

    layers.push({
      layer: 'unit',
      priority: 'critical',
      description: 'Unit tests for individual functions, classes, and modules',
      coverageTarget: 80,
      estimatedFiles: Math.max(Math.floor(inventory.fileCount * 0.3), 5),
      framework: detectedMap.get('unit') ?? 'vitest',
    })

    if (isAPI || isWeb) {
      layers.push({
        layer: 'integration',
        priority: 'high',
        description: 'Integration tests for API endpoints and service interactions',
        coverageTarget: 60,
        estimatedFiles: Math.max(Math.floor(inventory.fileCount * 0.1), 3),
        framework: detectedMap.get('integration') ?? 'supertest',
      })
    }

    if (isWeb || isAPI) {
      layers.push({
        layer: 'e2e',
        priority: isWeb ? 'high' : 'medium',
        description: 'End-to-end tests for critical user flows',
        coverageTarget: 40,
        estimatedFiles: Math.max(Math.floor(inventory.fileCount * 0.05), 2),
        framework: detectedMap.get('e2e') ?? 'playwright',
      })
    }

    if (isAPI) {
      layers.push({
        layer: 'contract',
        priority: 'medium',
        description: 'Contract tests for API schema validation',
        coverageTarget: 100,
        estimatedFiles: Math.max(Math.floor(inventory.entryPoints.length), 1),
        framework: detectedMap.get('contract') ?? 'pact',
      })
    }

    return layers
  }

  // --- Boilerplate generation ---

  private generateBoilerplates(
    inventory: ProjectInventory,
    recommendations: FrameworkRecommendation[],
    detected: TestFrameworkDetection[],
  ): GeneratedBoilerplate[] {
    const boilerplates: GeneratedBoilerplate[] = []
    const lang = inventory.primaryLanguage

    for (const rec of recommendations) {
      if (rec.layer === 'unit' && (lang === 'typescript' || lang === 'javascript')) {
        boilerplates.push({
          path: rec.framework === 'vitest' ? 'vitest.config.ts' : 'jest.config.ts',
          content: this.vitestConfig(),
          layer: 'unit',
          description: `${rec.framework} configuration`,
        })
        boilerplates.push({
          path: 'src/__tests__/example.test.ts',
          content: this.exampleUnitTest(rec.framework),
          layer: 'unit',
          description: 'Example unit test',
        })
      }

      if (rec.layer === 'e2e') {
        boilerplates.push({
          path: 'e2e/example.spec.ts',
          content: this.exampleE2ETest(),
          layer: 'e2e',
          description: 'Example Playwright E2E test',
        })
      }
    }

    return boilerplates
  }

  private vitestConfig(): string {
    return [
      "import { defineConfig } from 'vitest/config'",
      '',
      'export default defineConfig({',
      '  test: {',
      "    globals: true,",
      "    environment: 'node',",
      '    coverage: {',
      "      provider: 'v8',",
      "      reporter: ['text', 'lcov', 'html'],",
      '      thresholds: {',
      '        branches: 80,',
      '        functions: 80,',
      '        lines: 80,',
      '        statements: 80,',
      '      },',
      '    },',
      '  },',
      '})',
      '',
    ].join('\n')
  }

  private exampleUnitTest(framework: string): string {
    return [
      `// Example ${framework} unit test — generated by NiRo.ai Phase 2`,
      "import { describe, it, expect } from 'vitest'",
      '',
      "describe('example', () => {",
      "  it('should pass a basic assertion', () => {",
      '    expect(1 + 1).toBe(2)',
      '  })',
      '',
      "  it('should handle async operations', async () => {",
      '    const result = await Promise.resolve(42)',
      '    expect(result).toBe(42)',
      '  })',
      '})',
      '',
    ].join('\n')
  }

  private exampleE2ETest(): string {
    return [
      '// Example Playwright E2E test — generated by NiRo.ai Phase 2',
      "import { test, expect } from '@playwright/test'",
      '',
      "test('homepage loads', async ({ page }) => {",
      "  await page.goto('/')",
      "  await expect(page).toHaveTitle(/.+/)",
      '})',
      '',
    ].join('\n')
  }

  // --- Helpers ---

  private isTestFile(f: string): boolean {
    return f.includes('.test.') || f.includes('.spec.') || f.includes('_test.')
      || f.includes('__tests__') || f.includes('e2e/') || f.includes('tests/')
  }

  private walkDir(dir: string, depth = 0): string[] {
    if (depth > 8) return []
    const ignored = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '__pycache__', 'venv', '.venv'])
    const results: string[] = []
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (ignored.has(entry.name) || (entry.name.startsWith('.') && entry.name !== '.github')) continue
        const full = join(dir, entry.name)
        if (entry.isDirectory()) results.push(...this.walkDir(full, depth + 1))
        else results.push(relative(this.rootDir, full))
      }
    } catch { /* skip */ }
    return results
  }
}
