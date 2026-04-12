# Component Specifications - Phase 6 LLM Wiki Integration

## Overview

This document provides detailed specifications for all components required to implement Phase 6: Knowledge Management & Documentation Intelligence. Each component includes interfaces, implementation requirements, and integration points.

## Core Components

### 1. WikiEngine

#### File Location
`src/coordinator/WikiEngine.ts`

#### Purpose
Central coordinator for all wiki operations, managing the three-layer architecture (Raw Sources → Wiki Pages → Schema Configuration).

#### Interface Definition
```typescript
export interface WikiEngine {
  // Core Operations
  ingestSource(sourcePath: string): Promise<WikiUpdateResult>
  query(question: string): Promise<WikiAnswer>
  lintWiki(): Promise<WikiHealthReport>
  maintainWiki(): Promise<void>
  getWikiStats(): Promise<WikiStats>
  
  // Configuration
  updateSchema(schema: WikiSchema): Promise<void>
  getSchema(): Promise<WikiSchema>
  
  // Lifecycle
  initialize(): Promise<void>
  shutdown(): Promise<void>
}

export interface WikiUpdateResult {
  pagesCreated: number
  pagesUpdated: number
  crossReferencesAdded: number
  contradictionsFound: number
  processingTime: number
  warnings: string[]
}

export interface WikiAnswer {
  answer: string
  citations: Citation[]
  relatedPages: string[]
  confidence: number
  answerFormat: 'markdown' | 'table' | 'slides' | 'json'
  metadata: {
    queryId: string
    timestamp: string
    processingTime: number
    sourcesUsed: number
  }
}

export interface WikiHealthReport {
  overallHealth: number // 0-100
  issues: WikiIssue[]
  statistics: {
    totalPages: number
    orphanedPages: number
    contradictions: number
    stalePages: number
    lastUpdated: string
  }
  recommendations: string[]
}

export interface WikiStats {
  totalPages: number
  totalSources: number
  totalEntities: number
  totalConcepts: number
  healthScore: number
  lastActivity: string
  growthRate: number
  categoryBreakdown: Record<string, number>
}
```

#### Implementation Requirements
- **Thread Safety**: All operations must be thread-safe for concurrent access
- **Performance**: Query response time < 2 seconds for wikis with < 10,000 pages
- **Scalability**: Support up to 100,000 pages without performance degradation
- **Reliability**: 99.9% uptime with automatic recovery from corruption

#### Integration Points
- **DiscoveryEngine**: Auto-ingest project inventory
- **SecurityScanner**: Process security findings
- **PolicyAnalyzer**: Maintain compliance knowledge
- **IaCFactory**: Document infrastructure patterns
- **TestArchitect**: Accumulate test strategies

### 2. KnowledgeIngestor

#### File Location
`src/assistant/KnowledgeIngestor.ts`

#### Purpose
Processes raw sources and updates wiki incrementally, maintaining consistency across all knowledge domains.

#### Interface Definition
```typescript
export interface KnowledgeIngestor {
  processSource(source: Source): Promise<IngestResult>
  processBatch(sources: Source[]): Promise<BatchIngestResult>
  updateCrossReferences(changes: WikiChange[]): Promise<void>
  maintainIndex(): Promise<void>
  categorizeContent(content: string): Promise<Category[]>
  extractEntities(content: string): Promise<Entity[]>
  identifyConcepts(content: string): Promise<Concept[]>
}

export interface Source {
  path: string
  type: 'document' | 'code' | 'log' | 'meeting' | 'article' | 'paper'
  timestamp: string
  metadata: {
    author?: string
    title?: string
    tags?: string[]
    language?: string
    size: number
  }
}

export interface IngestResult {
  entitiesExtracted: Entity[]
  conceptsIdentified: Concept[]
  pagesGenerated: string[]
  crossReferences: CrossReference[]
  summaries: Summary[]
  processingTime: number
  warnings: string[]
}

export interface Entity {
  id: string
  name: string
  type: 'person' | 'organization' | 'technology' | 'concept' | 'location' | 'date'
  mentions: EntityMention[]
  attributes: Record<string, any>
  confidence: number
}

export interface Concept {
  id: string
  name: string
  definition: string
  category: string
  relatedConcepts: string[]
  examples: string[]
  confidence: number
}

export interface CrossReference {
  fromPage: string
  toPage: string
  type: 'entity' | 'concept' | 'related' | 'contradiction'
  strength: number
  context: string
}

export interface Summary {
  sourcePath: string
  summary: string
  keyPoints: string[]
  category: string
  confidence: number
}
```

#### Implementation Requirements
- **Multi-format Support**: Process markdown, PDF, DOCX, TXT, JSON
- **Entity Recognition**: 95% accuracy on common entity types
- **Concept Extraction**: Identify and categorize key concepts
- **Cross-reference Generation**: Automatic linking between related content
- **Incremental Updates**: Only process changed content

#### Integration Points
- **File System**: Monitor raw sources directory for changes
- **LLM Integration**: Use LLM for entity and concept extraction
- **WikiEngine**: Update wiki pages and index
- **ComplianceGuard**: Validate content before ingestion

### 3. WikiQueryEngine

#### File Location
`src/tools/WikiQueryEngine.ts`

#### Purpose
Provides intelligent search and synthesis capabilities with citation support for all accumulated knowledge.

#### Interface Definition
```typescript
export interface WikiQueryEngine {
  search(query: string): Promise<RelevantPages[]>
  synthesizeAnswer(pages: RelevantPages[]): Promise<WikiAnswer>
  generateCitations(answer: WikiAnswer): Promise<Citation[]>
  rankResults(results: SearchResult[]): Promise<RankedResult[]>
  findRelatedPages(pageIds: string[]): Promise<RelatedPage[]>
  getSuggestions(query: string): Promise<QuerySuggestion[]>
}

export interface RelevantPages {
  pageId: string
  path: string
  title: string
  snippet: string
  relevanceScore: number
  lastModified: string
  category: string
}

export interface Citation {
  source: string
  pageId: string
  snippet: string
  confidence: number
  timestamp: string
}

export interface SearchResult {
  pageId: string
  title: string
  content: string
  score: number
  matchType: 'exact' | 'partial' | 'semantic'
}

export interface RankedResult extends SearchResult {
  rank: number
  rankScore: number
  explanation: string
}

export interface RelatedPage {
  pageId: string
  title: string
  relationship: 'similar' | 'referenced' | 'follows' | 'contradicts'
  strength: number
}

export interface QuerySuggestion {
  suggestion: string
  type: 'correction' | 'expansion' | 'related'
  confidence: number
}
```

#### Implementation Requirements
- **Search Performance**: Sub-second response for common queries
- **Semantic Search**: Understand context and intent, not just keywords
- **Multi-modal Search**: Support text, entity, and concept-based queries
- **Answer Synthesis**: Generate coherent answers from multiple sources
- **Citation Accuracy**: Proper attribution and source tracking

#### Integration Points
- **WikiEngine**: Access wiki pages and index
- **LLM Integration**: Use LLM for semantic understanding
- **Index System**: Fast retrieval of relevant content
- **Citation System**: Track and format citations

### 4. WikiComplianceGuard

#### File Location
`src/schemas/wiki-compliance.ts`

#### Purpose
Ensures all knowledge management activities maintain SOC2 and GDPR compliance.

#### Interface Definition
```typescript
export interface WikiComplianceGuard {
  validateIngestion(source: Source): Promise<ComplianceResult>
  validateQuery(query: string): Promise<ComplianceResult>
  validateContent(content: string): Promise<ComplianceResult>
  logOperation(operation: string, details: any): Promise<void>
  generateAuditReport(timeRange: TimeRange): Promise<AuditReport>
  enforceRetentionPolicy(): Promise<RetentionResult>
}

export interface ComplianceResult {
  compliant: boolean
  issues: ComplianceIssue[]
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  processingTime: number
}

export interface ComplianceIssue {
  type: 'pii-detected' | 'access-violation' | 'retention-policy' | 'encryption-required' | 'audit-trail'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  location?: string
  remediation?: string
}

export interface AuditReport {
  timeRange: TimeRange
  totalOperations: number
  operationsByType: Record<string, number>
  complianceViolations: ComplianceIssue[]
  riskTrends: RiskTrend[]
  recommendations: string[]
}

export interface TimeRange {
  start: string
  end: string
}

export interface RiskTrend {
  date: string
  riskScore: number
  issueTypes: string[]
}

export interface RetentionResult {
  itemsDeleted: number
  itemsArchived: number
  spaceFreed: number
  errors: string[]
}
```

#### Implementation Requirements
- **PII Detection**: Identify and redact personal information
- **Access Control**: Role-based permissions for sensitive content
- **Audit Trails**: Immutable logging of all operations
- **Data Retention**: Automatic cleanup based on policies
- **Encryption**: Encrypt sensitive wiki content

#### Integration Points
- **KnowledgeIngestor**: Validate sources before processing
- **WikiQueryEngine**: Check query compliance
- **WikiEngine**: Enforce policies on operations
- **File System**: Secure storage and access control

## Data Types

### Wiki Pages
```typescript
export interface WikiPage {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  entities: string[]
  concepts: string[]
  crossReferences: string[]
  metadata: {
    created: string
    modified: string
    author: string
    version: number
    sources: string[]
  }
  frontmatter: Record<string, any>
}
```

### Index Structure
```typescript
export interface WikiIndex {
  pages: IndexEntry[]
  categories: CategoryIndex[]
  entities: EntityIndex[]
  concepts: ConceptIndex[]
  searchIndex: SearchIndex
  metadata: {
    version: string
    lastUpdated: string
    totalPages: number
    totalSize: number
  }
}

export interface IndexEntry {
  pageId: string
  title: string
  path: string
  category: string
  tags: string[]
  snippet: string
  lastModified: string
  size: number
}
```

## Configuration

### Wiki Schema
```typescript
export interface WikiSchema {
  version: string
  conventions: {
    naming: NamingConvention
    categorization: CategorizationScheme
    crossReferences: CrossReferenceRules
    formatting: FormattingRules
  }
  policies: {
    retention: RetentionPolicy
    access: AccessPolicy
    pii: PIIPolicy
    encryption: EncryptionPolicy
  }
  integrations: {
    phases: PhaseIntegration[]
    llm: LLMConfiguration
    storage: StorageConfiguration
  }
}
```

## Error Handling

### Error Types
```typescript
export enum WikiErrorType {
  SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
  INDEX_CORRUPT = 'INDEX_CORRUPT',
  LLM_ERROR = 'LLM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface WikiError {
  type: WikiErrorType
  message: string
  details?: any
  timestamp: string
  stack?: string
  recoverable: boolean
}
```

## Performance Requirements

### Response Times
- **Source Ingestion**: < 10 seconds per MB of content
- **Query Processing**: < 2 seconds for typical queries
- **Index Updates**: < 5 seconds for incremental updates
- **Health Checks**: < 30 seconds for full wiki analysis

### Scalability
- **Pages**: Support up to 100,000 pages
- **Sources**: Support up to 10,000 source documents
- **Concurrent Users**: Support up to 50 simultaneous queries
- **Storage**: Efficient storage with < 2GB for 50,000 pages

### Reliability
- **Uptime**: 99.9% availability
- **Data Integrity**: Automatic corruption detection and recovery
- **Backup**: Automatic backup creation and restoration
- **Recovery**: Graceful degradation and automatic recovery

## Security Requirements

### Data Protection
- **Encryption**: AES-256 encryption for sensitive content
- **Access Control**: Role-based permissions
- **Audit Logging**: Immutable audit trails
- **PII Protection**: Automatic detection and redaction

### Compliance
- **SOC2**: Full compliance with security and availability criteria
- **GDPR**: Data protection and privacy compliance
- **Data Retention**: Configurable retention policies
- **Right to be Forgotten**: Complete data removal capabilities

This specification provides the foundation for implementing a robust, scalable, and compliant knowledge management system that integrates seamlessly with the existing NiRo.ai architecture.
