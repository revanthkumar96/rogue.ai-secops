# NiRo.ai Development Guide - Phase 6 LLM Wiki Integration

## Overview

This guide provides comprehensive instructions for implementing Phase 6: Knowledge Management & Documentation Intelligence. It transforms NiRo.ai from a deployment automation tool into a self-improving autonomous engineer that accumulates and maintains knowledge across all project interactions.

## Prerequisites

### Existing System Knowledge
- **Phases 0-5**: Fully implemented with diagnostic, infrastructure, quality gates, CI/CD, observability, and autonomous engineer persona
- **CLI Architecture**: `/diagnose`, `/infra`, `/quality` commands implemented
- **TUI Framework**: Ink-based UI with theme system ready
- **Compliance**: SOC2 and GDPR frameworks established

### Development Environment
```bash
# Required dependencies
npm install @types/node typescript
npm install react ink
npm install fs-extra glob
npm install commander yargs
```

## Architecture Overview

### Three-Layer Knowledge System

```
Raw Sources (Immutable)
    ↓
Wiki Pages (LLM-Generated)
    ↓
Schema Configuration (Rules)
```

### Component Integration Points

```
Phase 0: Discovery → Wiki Ingestion
Phase 1: Infrastructure → Knowledge Documentation
Phase 2: Quality → Pattern Accumulation
Phase 3: CI/CD → Strategy Documentation
Phase 4: Observability → Insight Collection
Phase 5: Autonomous Engineer → Decision Learning
```

## Implementation Steps

### Step 1: Core WikiEngine Implementation

#### File: `src/coordinator/WikiEngine.ts`

```typescript
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { KnowledgeIngestor } from '../assistant/KnowledgeIngestor.js'
import { WikiQueryEngine } from '../tools/WikiQueryEngine.js'
import { WikiComplianceGuard } from '../schemas/wiki-compliance.js'

export interface WikiEngine {
  ingestSource(sourcePath: string): Promise<WikiUpdateResult>
  query(question: string): Promise<WikiAnswer>
  lintWiki(): Promise<WikiHealthReport>
  maintainWiki(): Promise<void>
  getWikiStats(): Promise<WikiStats>
}

export class WikiEngineImpl implements WikiEngine {
  private rootDir: string
  private wikiDir: string
  private rawDir: string
  private ingestor: KnowledgeIngestor
  private queryEngine: WikiQueryEngine
  private complianceGuard: WikiComplianceGuard

  constructor(rootDir: string) {
    this.rootDir = rootDir
    this.wikiDir = join(rootDir, '.niro', 'wiki')
    this.rawDir = join(this.wikiDir, 'raw')
    this.ensureDirectories()
    
    this.ingestor = new KnowledgeIngestor(this.wikiDir)
    this.queryEngine = new WikiQueryEngine(this.wikiDir)
    this.complianceGuard = new WikiComplianceGuard()
  }

  private ensureDirectories(): void {
    [this.wikiDir, this.rawDir, join(this.wikiDir, 'wiki'), join(this.wikiDir, 'assets')].forEach(dir => {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    })
  }

  async ingestSource(sourcePath: string): Promise<WikiUpdateResult> {
    // Implementation details...
  }

  async query(question: string): Promise<WikiAnswer> {
    // Implementation details...
  }

  async lintWiki(): Promise<WikiHealthReport> {
    // Implementation details...
  }

  async maintainWiki(): Promise<void> {
    // Implementation details...
  }

  async getWikiStats(): Promise<WikiStats> {
    // Implementation details...
  }
}
```

### Step 2: KnowledgeIngestor Implementation

#### File: `src/assistant/KnowledgeIngestor.ts`

```typescript
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { Source, Entity, Concept, IngestResult } from '../types/wiki.js'

export class KnowledgeIngestor {
  private wikiDir: string

  constructor(wikiDir: string) {
    this.wikiDir = wikiDir
  }

  async processSource(source: Source): Promise<IngestResult> {
    const content = readFileSync(source.path, 'utf-8')
    
    // Extract entities and concepts
    const entities = this.extractEntities(content)
    const concepts = this.identifyConcepts(content)
    
    // Generate wiki pages
    const pagesGenerated = await this.generatePages(source, entities, concepts)
    
    // Update cross-references
    const crossReferences = this.generateCrossReferences(entities, concepts)
    
    // Update index
    await this.updateIndex(source, pagesGenerated)
    
    // Log activity
    await this.logActivity('ingest', source.path, pagesGenerated)
    
    return {
      entitiesExtracted: entities,
      conceptsIdentified: concepts,
      pagesGenerated,
      crossReferences
    }
  }

  private extractEntities(content: string): Entity[] {
    // Entity extraction logic...
  }

  private identifyConcepts(content: string): Concept[] {
    // Concept identification logic...
  }

  private async generatePages(source: Source, entities: Entity[], concepts: Concept[]): Promise<string[]> {
    // Page generation logic...
  }

  private generateCrossReferences(entities: Entity[], concepts: Concept[]): CrossReference[] {
    // Cross-reference generation logic...
  }

  private async updateIndex(source: Source, pages: string[]): Promise<void> {
    // Index update logic...
  }

  private async logActivity(action: string, target: string, result: any): Promise<void> {
    // Activity logging logic...
  }
}
```

### Step 3: WikiQueryEngine Implementation

#### File: `src/tools/WikiQueryEngine.ts`

```typescript
import { readFileSync } from 'fs'
import { join } from 'path'
import type { WikiAnswer, RelevantPages, Citation } from '../types/wiki.js'

export class WikiQueryEngine {
  private wikiDir: string
  private indexPath: string

  constructor(wikiDir: string) {
    this.wikiDir = wikiDir
    this.indexPath = join(wikiDir, 'index.md')
  }

  async search(query: string): Promise<RelevantPages[]> {
    const index = this.loadIndex()
    const relevantPages = this.findRelevantPages(query, index)
    return this.rankResults(relevantPages, query)
  }

  async synthesizeAnswer(pages: RelevantPages[]): Promise<WikiAnswer> {
    const context = pages.map(p => readFileSync(p.path, 'utf-8')).join('\n\n')
    
    // LLM synthesis logic here
    const answer = await this.synthesizeWithLLM(query, context)
    const citations = this.generateCitations(pages)
    const relatedPages = this.findRelatedPages(pages)
    
    return {
      answer,
      citations,
      relatedPages,
      confidence: this.calculateConfidence(pages, answer)
    }
  }

  private loadIndex(): WikiIndex {
    const indexContent = readFileSync(this.indexPath, 'utf-8')
    return this.parseIndex(indexContent)
  }

  private findRelevantPages(query: string, index: WikiIndex): RelevantPages[] {
    // Search logic...
  }

  private rankResults(pages: RelevantPages[], query: string): RelevantPages[] {
    // Ranking logic...
  }

  private async synthesizeWithLLM(query: string, context: string): Promise<string> {
    // LLM integration logic...
  }

  private generateCitations(pages: RelevantPages[]): Citation[] {
    // Citation generation logic...
  }

  private findRelatedPages(pages: RelevantPages[]): string[] {
    // Related page finding logic...
  }

  private calculateConfidence(pages: RelevantPages[], answer: string): number {
    // Confidence calculation logic...
  }
}
```

### Step 4: CLI Command Implementation

#### File: `src/commands/wiki/wiki.ts`

```typescript
import { Command } from 'commander'
import { WikiEngine } from '../../coordinator/WikiEngine.js'
import type { LocalCommandCall } from '../../types/command.js'

export const wikiCommand = new Command('wiki')
  .description('LLM Wiki - Knowledge Management & Documentation Intelligence')

// Ingest command
wikiCommand
  .command('ingest')
  .description('Ingest sources into knowledge base')
  .argument('[source]', 'Source file or directory to ingest')
  .action(async (source) => {
    const wiki = new WikiEngine(process.cwd())
    const result = await wiki.ingestSource(source || process.cwd())
    console.log(`Ingested: ${result.pagesCreated} pages created, ${result.pagesUpdated} updated`)
  })

// Query command
wikiCommand
  .command('query')
  .description('Query accumulated knowledge')
  .argument('<question>', 'Question to ask')
  .action(async (question) => {
    const wiki = new WikiEngine(process.cwd())
    const answer = await wiki.query(question)
    console.log(`Answer: ${answer.answer}`)
    console.log(`Citations: ${answer.citations.map(c => c.source).join(', ')}`)
  })

// Lint command
wikiCommand
  .command('lint')
  .description('Health-check wiki for maintenance')
  .action(async () => {
    const wiki = new WikiEngine(process.cwd())
    const report = await wiki.lintWiki()
    console.log(`Health: ${report.issues.length} issues found`)
    report.issues.forEach(issue => console.log(`- ${issue.type}: ${issue.message}`))
  })

// Status command
wikiCommand
  .command('status')
  .description('Display wiki statistics and health')
  .action(async () => {
    const wiki = new WikiEngine(process.cwd())
    const stats = await wiki.getWikiStats()
    console.log(`Wiki Stats: ${stats.totalPages} pages, ${stats.totalSources} sources`)
    console.log(`Health: ${stats.healthScore}/100`)
  })
```

### Step 5: Integration with Existing Phases

#### Phase 0 Integration
```typescript
// In DiscoveryEngine.ts
import { WikiEngine } from './WikiEngine.js'

export class DiscoveryEngine {
  private wikiEngine?: WikiEngine

  constructor(rootDir: string) {
    this.rootDir = rootDir
    this.wikiEngine = new WikiEngine(rootDir)
  }

  async scan(): Promise<ProjectInventory> {
    const inventory = await this.performScan()
    
    // Auto-ingest discovery results into wiki
    if (this.wikiEngine) {
      await this.wikiEngine.ingestSource({
        path: join(this.rootDir, '.niro', 'PROJECT_INVENTORY.json'),
        type: 'discovery-result',
        timestamp: new Date().toISOString()
      })
    }
    
    return inventory
  }
}
```

### Step 6: Compliance Implementation

#### File: `src/schemas/wiki-compliance.ts`

```typescript
import { writeFileSync } from 'fs'
import { join } from 'path'

export class WikiComplianceGuard {
  private auditLog: string[] = []

  async validateIngestion(source: Source): Promise<ComplianceResult> {
    const issues: ComplianceIssue[] = []
    
    // PII detection
    const piiDetected = await this.detectPII(source)
    if (piiDetected.length > 0) {
      issues.push({
        type: 'pii-detected',
        severity: 'high',
        message: `PII detected: ${piiDetected.join(', ')}`
      })
    }
    
    // Access control check
    const accessValid = await this.validateAccess(source)
    if (!accessValid) {
      issues.push({
        type: 'access-violation',
        severity: 'medium',
        message: 'Insufficient permissions for source'
      })
    }
    
    return {
      compliant: issues.length === 0,
      issues,
      recommendations: this.generateRecommendations(issues)
    }
  }

  async logOperation(operation: string, details: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      details,
      user: process.env.USER || 'system',
      signature: await this.generateSignature(operation, details)
    }
    
    this.auditLog.push(JSON.stringify(logEntry))
    await this.persistAuditLog()
  }

  private async detectPII(source: Source): Promise<string[]> {
    // PII detection patterns...
  }

  private async validateAccess(source: Source): Promise<boolean> {
    // Access validation logic...
  }

  private generateRecommendations(issues: ComplianceIssue[]): string[] {
    // Recommendation generation logic...
  }

  private async generateSignature(operation: string, details: any): Promise<string> {
    // Digital signature logic...
  }

  private async persistAuditLog(): Promise<void> {
    const logPath = join(process.cwd(), '.niro', 'wiki', 'audit.log')
    writeFileSync(logPath, this.auditLog.join('\n'), 'utf-8')
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/wiki/WikiEngine.test.ts
import { WikiEngine } from '../../src/coordinator/WikiEngine.js'

describe('WikiEngine', () => {
  test('should ingest source and create pages', async () => {
    const wiki = new WikiEngine('./test-data')
    const result = await wiki.ingestSource('./test-data/sample.md')
    expect(result.pagesCreated).toBeGreaterThan(0)
  })

  test('should query wiki and return answer with citations', async () => {
    const wiki = new WikiEngine('./test-data')
    const answer = await wiki.query('What is the architecture?')
    expect(answer.citations.length).toBeGreaterThan(0)
  })
})
```

### Integration Tests
```typescript
// tests/integration/wiki-integration.test.ts
describe('Wiki Integration', () => {
  test('should integrate with DiscoveryEngine', async () => {
    const discovery = new DiscoveryEngine('./test-project')
    const inventory = await discovery.scan()
    expect(inventory).toBeDefined()
  })
})
```

## Deployment Considerations

### Environment Variables
```bash
# Wiki Configuration
WIKI_ROOT_DIR=/path/to/.niro/wiki
WIKI_MAX_SOURCES=1000
WIKI_RETENTION_DAYS=365

# Compliance Settings
WIKI_ENABLE_PII_DETECTION=true
WIKI_ACCESS_CONTROL_LEVEL=standard
WIKI_AUDIT_RETENTION_DAYS=2555
```

### Performance Optimization
- **Index Caching**: Cache parsed index in memory
- **Lazy Loading**: Load wiki pages on demand
- **Background Maintenance**: Run maintenance tasks in background
- **Compression**: Compress historical wiki data

## Troubleshooting

### Common Issues
1. **Wiki Not Found**: Ensure `.niro/wiki` directory exists
2. **Permission Denied**: Check file permissions on wiki directory
3. **Memory Issues**: Limit source size for ingestion
4. **Slow Queries**: Optimize index and caching

### Debug Mode
```bash
# Enable debug logging
DEBUG=wiki:* niro wiki query "test question"
```

## Next Steps

1. Implement core WikiEngine class
2. Create KnowledgeIngestor with entity extraction
3. Build WikiQueryEngine with intelligent search
4. Add CLI commands for wiki operations
5. Integrate with existing phase components
6. Implement compliance and security layers
7. Add comprehensive testing
8. Deploy with monitoring and observability

This guide provides the foundation for implementing a complete knowledge management system that transforms NiRo.ai into a truly autonomous, learning engineering platform.
