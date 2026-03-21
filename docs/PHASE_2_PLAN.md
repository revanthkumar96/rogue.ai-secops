# Phase 2 - Automation Engine & Workflow Orchestration

> Detailed implementation plan for advanced automation features

## Overview

Phase 2 transforms Rouge from a simple agent executor into a powerful automation engine with:
- **Workflow Orchestration** - Multi-step automation pipelines
- **Test Generation Engine** - AI-powered test creation
- **Deployment Automation** - Full deployment lifecycle management
- **Log Analysis Engine** - Intelligent log parsing and insights
- **Real-Time Monitoring** - Live system metrics and alerts
- **Event System** - Pub/sub for workflow events

**Timeline**: 8-12 weeks
**Complexity**: High
**Dependencies**: Phase 1 complete

---

## Architecture Changes

### New Components

```
rouge/
├── packages/
│   ├── rouge/
│   │   ├── src/
│   │   │   ├── workflow/           # NEW - Workflow engine
│   │   │   │   ├── engine.ts       # Orchestration engine
│   │   │   │   ├── executor.ts     # Step executor
│   │   │   │   ├── scheduler.ts    # Job scheduler
│   │   │   │   └── state.ts        # State machine
│   │   │   │
│   │   │   ├── test-gen/           # NEW - Test generator
│   │   │   │   ├── analyzer.ts     # Code analysis
│   │   │   │   ├── generator.ts    # Test generation
│   │   │   │   ├── templates/      # Test templates
│   │   │   │   └── frameworks/     # Framework adapters
│   │   │   │
│   │   │   ├── deploy/             # NEW - Deployment engine
│   │   │   │   ├── strategies/     # Deployment strategies
│   │   │   │   ├── health.ts       # Health checks
│   │   │   │   ├── rollback.ts     # Rollback logic
│   │   │   │   └── hooks.ts        # Pre/post deploy hooks
│   │   │   │
│   │   │   ├── log-analyzer/       # NEW - Log analysis
│   │   │   │   ├── parser.ts       # Log parsing
│   │   │   │   ├── aggregator.ts   # Metric aggregation
│   │   │   │   ├── patterns.ts     # Pattern detection
│   │   │   │   └── insights.ts     # AI insights
│   │   │   │
│   │   │   ├── monitor/            # NEW - Real-time monitoring
│   │   │   │   ├── collector.ts    # Metric collection
│   │   │   │   ├── dashboard.ts    # Dashboard data
│   │   │   │   ├── alerts.ts       # Alert engine
│   │   │   │   └── websocket.ts    # Real-time updates
│   │   │   │
│   │   │   └── events/             # NEW - Event system
│   │   │       ├── emitter.ts      # Event emitter
│   │   │       ├── bus.ts          # Event bus
│   │   │       └── handlers/       # Event handlers
│   │   │
│   │   └── package.json
│   │
│   └── web/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Workflows.tsx    # ENHANCED
│       │   │   ├── WorkflowBuilder.tsx  # NEW
│       │   │   ├── TestGeneration.tsx   # NEW
│       │   │   ├── Deployments.tsx      # NEW
│       │   │   ├── Monitoring.tsx       # NEW
│       │   │   └── LogAnalyzer.tsx      # NEW
│       │   │
│       │   └── components/
│       │       ├── workflow/        # NEW - Workflow components
│       │       ├── test-gen/        # NEW - Test gen components
│       │       └── monitor/         # NEW - Monitor components
│       │
│       └── package.json
```

---

## Feature 1: Workflow Orchestration

### Overview

Enable users to create, schedule, and execute multi-step automation workflows with conditional logic, parallel execution, and error handling.

### Key Features

1. **Workflow Definition**
   - YAML-based workflow syntax
   - Visual workflow builder (drag-and-drop)
   - Conditional execution (if/else)
   - Parallel execution
   - Loop constructs
   - Error handling and retries

2. **Workflow Execution**
   - Step-by-step execution
   - State persistence
   - Pause/resume capability
   - Rollback on failure
   - Execution history

3. **Scheduling**
   - Cron-based scheduling
   - Event-triggered workflows
   - Manual execution
   - Webhook triggers

### Implementation

#### 1. Workflow Schema

```typescript
// packages/rouge/src/workflow/schema.ts

export const WorkflowDefinition = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),

  triggers: z.array(z.object({
    type: z.enum(['manual', 'schedule', 'webhook', 'event']),
    config: z.record(z.any()),
  })),

  variables: z.record(z.any()).optional(),

  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['agent', 'tool', 'script', 'http', 'conditional']),

    // For agent steps
    agent: z.string().optional(),
    task: z.string().optional(),

    // For tool steps
    tool: z.string().optional(),
    params: z.record(z.any()).optional(),

    // For conditional steps
    condition: z.string().optional(),
    then: z.array(z.any()).optional(),
    else: z.array(z.any()).optional(),

    // Common properties
    dependsOn: z.array(z.string()).optional(),
    timeout: z.number().optional(),
    retries: z.number().optional(),
    continueOnError: z.boolean().optional(),
  })),

  onSuccess: z.array(z.any()).optional(),
  onFailure: z.array(z.any()).optional(),
})

export type WorkflowDefinition = z.infer<typeof WorkflowDefinition>
```

#### 2. Workflow Engine

```typescript
// packages/rouge/src/workflow/engine.ts

import { WorkflowDefinition } from "./schema.js"
import { Agent } from "../agent/agent.js"
import { Tool } from "../tool/index.js"

export class WorkflowEngine {
  private state: Map<string, WorkflowState> = new Map()

  async execute(workflow: WorkflowDefinition): Promise<WorkflowResult> {
    const execution = await this.createExecution(workflow)

    try {
      // Execute steps
      for (const step of workflow.steps) {
        await this.executeStep(execution, step)
      }

      // On success hooks
      if (workflow.onSuccess) {
        await this.executeHooks(execution, workflow.onSuccess)
      }

      return {
        status: 'completed',
        executionId: execution.id,
        results: execution.results,
      }
    } catch (error) {
      // On failure hooks
      if (workflow.onFailure) {
        await this.executeHooks(execution, workflow.onFailure)
      }

      throw error
    }
  }

  private async executeStep(
    execution: WorkflowExecution,
    step: WorkflowStep
  ): Promise<void> {
    // Check dependencies
    if (step.dependsOn) {
      await this.waitForDependencies(execution, step.dependsOn)
    }

    // Execute based on type
    switch (step.type) {
      case 'agent':
        return this.executeAgentStep(execution, step)
      case 'tool':
        return this.executeToolStep(execution, step)
      case 'script':
        return this.executeScriptStep(execution, step)
      case 'http':
        return this.executeHttpStep(execution, step)
      case 'conditional':
        return this.executeConditionalStep(execution, step)
    }
  }

  private async executeAgentStep(
    execution: WorkflowExecution,
    step: WorkflowStep
  ): Promise<void> {
    const result = await Agent.execute({
      type: step.agent!,
      task: this.interpolate(step.task!, execution.variables),
      stream: false,
    })

    execution.results[step.id] = result
    execution.variables[step.id] = result.output
  }

  // ... more methods
}
```

#### 3. Example Workflow

```yaml
# workflows/test-and-deploy.yaml

name: Test and Deploy Pipeline
version: 1.0.0
description: Run tests and deploy if passing

triggers:
  - type: webhook
    config:
      path: /webhook/deploy

variables:
  environment: staging
  version: ${git.tag}

steps:
  # Step 1: Run tests
  - id: run_tests
    name: Execute Test Suite
    type: agent
    agent: test
    task: "Run all unit and integration tests"
    timeout: 300000
    retries: 2

  # Step 2: Build application
  - id: build
    name: Build Application
    type: tool
    tool: build
    params:
      target: production
      minify: true
    dependsOn:
      - run_tests

  # Step 3: Security scan
  - id: security_scan
    name: Security Scan
    type: agent
    agent: security
    task: "Scan for vulnerabilities in dependencies"
    dependsOn:
      - build

  # Step 4: Conditional deployment
  - id: deploy_check
    name: Deploy Decision
    type: conditional
    condition: "${run_tests.success} && ${security_scan.passed}"
    then:
      - id: deploy
        name: Deploy to ${environment}
        type: agent
        agent: deploy
        task: "Deploy version ${version} to ${environment}"
        timeout: 600000
    else:
      - id: notify_failure
        name: Notify Failure
        type: http
        params:
          url: https://slack.com/webhook
          method: POST
          body:
            message: "Deployment failed: Tests or security scan failed"

onSuccess:
  - type: http
    url: https://slack.com/webhook
    body:
      message: "✅ Deployment successful: ${version} to ${environment}"

onFailure:
  - type: http
    url: https://slack.com/webhook
    body:
      message: "❌ Deployment failed: ${error.message}"
```

#### 4. CLI Commands

```bash
# List workflows
rouge workflow list

# Create workflow from file
rouge workflow create ./workflows/test-and-deploy.yaml

# Execute workflow
rouge workflow run test-and-deploy

# Execute with variables
rouge workflow run test-and-deploy \
  --var environment=production \
  --var version=v1.2.3

# View workflow status
rouge workflow status abc123

# View execution logs
rouge workflow logs abc123

# Pause execution
rouge workflow pause abc123

# Resume execution
rouge workflow resume abc123

# Cancel execution
rouge workflow cancel abc123
```

#### 5. Web UI - Workflow Builder

Visual drag-and-drop workflow builder:
- Node-based editor
- Step types: Agent, Tool, Script, HTTP, Conditional
- Connection lines showing dependencies
- Real-time validation
- Preview mode
- Export to YAML

---

## Feature 2: Test Generation Engine

### Overview

AI-powered test case generation from source code, API specs, and user stories.

### Key Features

1. **Multi-Framework Support**
   - Jest/Vitest (JavaScript/TypeScript)
   - pytest (Python)
   - JUnit (Java)
   - Go testing
   - RSpec (Ruby)

2. **Test Types**
   - Unit tests
   - Integration tests
   - E2E tests
   - API tests
   - Load tests

3. **Smart Generation**
   - Code analysis for test coverage
   - Edge case detection
   - Mock generation
   - Fixture creation
   - Test data generation

### Implementation

#### 1. Test Generator

```typescript
// packages/rouge/src/test-gen/generator.ts

export class TestGenerator {
  async generateFromFile(
    filePath: string,
    options: GenerateOptions
  ): Promise<GeneratedTest[]> {
    // 1. Analyze source code
    const analysis = await this.analyzeCode(filePath)

    // 2. Generate test cases using AI
    const testCases = await this.generateTestCases(analysis, options)

    // 3. Create test files
    const tests = await this.createTestFiles(testCases, options)

    return tests
  }

  async generateFromAPI(
    specPath: string,
    options: GenerateOptions
  ): Promise<GeneratedTest[]> {
    // 1. Parse OpenAPI/Swagger spec
    const spec = await this.parseAPISpec(specPath)

    // 2. Generate API test cases
    const testCases = await this.generateAPITests(spec, options)

    // 3. Create test files
    const tests = await this.createTestFiles(testCases, options)

    return tests
  }

  private async analyzeCode(filePath: string): Promise<CodeAnalysis> {
    // Parse AST
    // Extract functions, classes, methods
    // Identify dependencies
    // Detect patterns
  }

  private async generateTestCases(
    analysis: CodeAnalysis,
    options: GenerateOptions
  ): Promise<TestCase[]> {
    // Use AI agent to generate test cases
    const result = await Agent.execute({
      type: 'test',
      task: this.buildTestGenerationPrompt(analysis, options),
      stream: false,
    })

    // Parse AI response into test cases
    return this.parseTestCases(result.output)
  }
}
```

#### 2. CLI Commands

```bash
# Generate tests from source file
rouge test generate src/auth.ts

# Generate with specific framework
rouge test generate src/auth.ts --framework jest

# Generate specific test type
rouge test generate src/auth.ts --type unit,integration

# Generate from API spec
rouge test generate-api openapi.yaml

# Generate with coverage target
rouge test generate src/ --coverage 80

# Dry run (preview without writing)
rouge test generate src/auth.ts --dry-run
```

#### 3. Example Generated Test

Input file: `src/auth.ts`
```typescript
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function hashPassword(password: string): string {
  // Hash implementation
}
```

Generated: `src/auth.test.ts`
```typescript
import { describe, it, expect } from 'vitest'
import { validateEmail, hashPassword } from './auth'

describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true)
  })

  it('should return false for email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false)
  })

  it('should return false for email without domain', () => {
    expect(validateEmail('user@')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(validateEmail('')).toBe(false)
  })

  it('should return false for email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe(false)
  })
})

describe('hashPassword', () => {
  it('should return hashed password', () => {
    const hashed = hashPassword('password123')
    expect(hashed).toBeDefined()
    expect(hashed).not.toBe('password123')
  })

  it('should produce consistent hash for same input', () => {
    const hash1 = hashPassword('password123')
    const hash2 = hashPassword('password123')
    expect(hash1).toBe(hash2)
  })

  it('should produce different hash for different input', () => {
    const hash1 = hashPassword('password123')
    const hash2 = hashPassword('password456')
    expect(hash1).not.toBe(hash2)
  })
})
```

---

## Feature 3: Deployment Automation

### Overview

Complete deployment lifecycle management with multiple strategies, health checks, and automatic rollback.

### Key Features

1. **Deployment Strategies**
   - Rolling deployment
   - Blue-green deployment
   - Canary deployment
   - A/B testing
   - Feature flags

2. **Health Monitoring**
   - Pre-deployment checks
   - Post-deployment validation
   - Continuous health monitoring
   - Automatic rollback on failure

3. **Integrations**
   - Kubernetes
   - Docker Swarm
   - AWS ECS/EKS
   - Azure Container Instances
   - Google Cloud Run

### Implementation

#### 1. Deployment Strategies

```typescript
// packages/rouge/src/deploy/strategies/rolling.ts

export class RollingDeployment implements DeploymentStrategy {
  async execute(config: DeploymentConfig): Promise<DeploymentResult> {
    const { replicas, healthCheck, rollbackOnFailure } = config

    // Deploy in batches
    const batchSize = Math.ceil(replicas * 0.25) // 25% at a time

    for (let i = 0; i < replicas; i += batchSize) {
      const batch = Math.min(batchSize, replicas - i)

      // Deploy batch
      await this.deployBatch(config, batch)

      // Health check
      const healthy = await this.checkHealth(config, healthCheck)

      if (!healthy && rollbackOnFailure) {
        await this.rollback(config)
        throw new Error('Deployment failed health check')
      }

      // Wait before next batch
      await this.wait(config.batchInterval || 30000)
    }

    return {
      status: 'completed',
      replicas: replicas,
      strategy: 'rolling',
    }
  }
}
```

```typescript
// packages/rouge/src/deploy/strategies/blue-green.ts

export class BlueGreenDeployment implements DeploymentStrategy {
  async execute(config: DeploymentConfig): Promise<DeploymentResult> {
    // Deploy to green environment
    await this.deployGreen(config)

    // Health check green
    const healthy = await this.checkHealth(config, config.healthCheck)

    if (!healthy) {
      await this.teardownGreen(config)
      throw new Error('Green deployment failed health check')
    }

    // Switch traffic to green
    await this.switchTraffic(config, 'green')

    // Monitor for issues
    await this.monitorPostSwitch(config, 300000) // 5 min

    // Teardown blue
    await this.teardownBlue(config)

    return {
      status: 'completed',
      environment: 'green',
      strategy: 'blue-green',
    }
  }
}
```

#### 2. CLI Commands

```bash
# Validate deployment configuration
rouge deploy validate deployment.yaml

# Execute deployment
rouge deploy run deployment.yaml

# Deploy with specific strategy
rouge deploy run deployment.yaml --strategy canary

# Deploy to environment
rouge deploy run deployment.yaml --env production

# Monitor deployment
rouge deploy status abc123

# Rollback deployment
rouge deploy rollback abc123

# View deployment history
rouge deploy history
```

#### 3. Example Deployment Config

```yaml
# deployment.yaml

name: Production Deployment
version: v1.2.3
environment: production

strategy: canary

replicas: 10

canary:
  percentage: 10
  interval: 300000  # 5 minutes
  successCriteria:
    errorRate: 0.01
    responseTime: 500
  steps:
    - 10%
    - 25%
    - 50%
    - 100%

healthCheck:
  endpoint: /health
  interval: 10000
  timeout: 5000
  healthyThreshold: 2
  unhealthyThreshold: 3

rollback:
  enabled: true
  onFailure: true
  preserveLogs: true

notifications:
  slack:
    webhook: https://hooks.slack.com/...
    events:
      - deployment.started
      - deployment.completed
      - deployment.failed

hooks:
  preDeploy:
    - script: ./scripts/backup-db.sh
    - agent: database
      task: "Create database backup"

  postDeploy:
    - script: ./scripts/smoke-tests.sh
    - agent: test
      task: "Run smoke tests"
```

---

## Feature 4: Log Analysis Engine

### Overview

Intelligent log parsing, pattern detection, and AI-powered insights from application and system logs.

### Key Features

1. **Log Parsing**
   - Multiple log formats (JSON, plaintext, syslog)
   - Automatic pattern detection
   - Timestamp normalization
   - Multi-line log support

2. **Analysis**
   - Error aggregation
   - Trend detection
   - Anomaly detection
   - Correlation analysis

3. **AI Insights**
   - Root cause analysis
   - Similar issue detection
   - Remediation suggestions
   - Impact assessment

### Implementation

```typescript
// packages/rouge/src/log-analyzer/analyzer.ts

export class LogAnalyzer {
  async analyze(logFile: string, options: AnalysisOptions): Promise<AnalysisResult> {
    // 1. Parse logs
    const logs = await this.parseLogs(logFile, options.format)

    // 2. Aggregate errors
    const errors = this.aggregateErrors(logs)

    // 3. Detect patterns
    const patterns = this.detectPatterns(logs)

    // 4. AI analysis
    const insights = await this.generateInsights(errors, patterns)

    return {
      summary: {
        totalLogs: logs.length,
        errorCount: errors.length,
        warningCount: logs.filter(l => l.level === 'warn').length,
      },
      errors,
      patterns,
      insights,
    }
  }

  private async generateInsights(
    errors: LogError[],
    patterns: LogPattern[]
  ): Promise<Insight[]> {
    const result = await Agent.execute({
      type: 'analyze',
      task: this.buildAnalysisPrompt(errors, patterns),
      stream: false,
    })

    return this.parseInsights(result.output)
  }
}
```

#### CLI Commands

```bash
# Analyze log file
rouge logs analyze app.log

# Analyze with specific format
rouge logs analyze app.log --format json

# Analyze last N lines
rouge logs analyze app.log --tail 1000

# Watch logs in real-time
rouge logs watch app.log

# Filter by level
rouge logs analyze app.log --level error,warn

# Export analysis
rouge logs analyze app.log --output report.html
```

---

## Feature 5: Real-Time Monitoring

### Overview

Live system metrics, dashboards, and alerting.

### Key Features

1. **Metrics Collection**
   - System metrics (CPU, memory, disk)
   - Application metrics (requests, errors, latency)
   - Custom metrics
   - Multiple exporters (Prometheus, StatsD)

2. **Dashboards**
   - Real-time graphs
   - Customizable layouts
   - Multiple data sources
   - Historical data

3. **Alerting**
   - Threshold-based alerts
   - Anomaly detection
   - Multiple channels (email, Slack, PagerDuty)
   - Alert aggregation

### Implementation

```typescript
// packages/rouge/src/monitor/collector.ts

export class MetricCollector {
  private websocket: WebSocketServer

  async start() {
    // Start collecting metrics
    setInterval(() => this.collectSystemMetrics(), 5000)
    setInterval(() => this.collectAppMetrics(), 10000)

    // Start WebSocket server for real-time updates
    this.websocket = new WebSocketServer({ port: 3002 })
    this.websocket.on('connection', this.handleConnection)
  }

  private async collectSystemMetrics() {
    const metrics = {
      cpu: await this.getCPUUsage(),
      memory: await this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
      network: await this.getNetworkStats(),
    }

    await this.storeMetrics('system', metrics)
    this.broadcastMetrics('system', metrics)
  }

  private broadcastMetrics(type: string, metrics: any) {
    this.websocket.clients.forEach(client => {
      client.send(JSON.stringify({ type, metrics }))
    })
  }
}
```

---

## Database Schema Updates

```typescript
// packages/rouge/src/storage/schema/workflow.ts

export const workflow_executions = sqliteTable("workflow_executions", {
  id: text("id").primaryKey(),
  workflow_id: text("workflow_id").notNull(),
  status: text("status").notNull(), // running, completed, failed, cancelled
  started_at: integer("started_at").notNull(),
  completed_at: integer("completed_at"),
  error: text("error"),
  results: text("results"), // JSON
  created_at: integer("created_at").notNull(),
})

export const workflow_steps = sqliteTable("workflow_steps", {
  id: text("id").primaryKey(),
  execution_id: text("execution_id").notNull(),
  step_id: text("step_id").notNull(),
  status: text("status").notNull(),
  started_at: integer("started_at").notNull(),
  completed_at: integer("completed_at"),
  output: text("output"),
  error: text("error"),
})

export const test_runs = sqliteTable("test_runs", {
  id: text("id").primaryKey(),
  suite: text("suite").notNull(),
  status: text("status").notNull(),
  total_tests: integer("total_tests").notNull(),
  passed: integer("passed").notNull(),
  failed: integer("failed").notNull(),
  skipped: integer("skipped").notNull(),
  duration: integer("duration").notNull(),
  coverage: real("coverage"),
  created_at: integer("created_at").notNull(),
})

export const metrics = sqliteTable("metrics", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // system, application, custom
  name: text("name").notNull(),
  value: real("value").notNull(),
  timestamp: integer("timestamp").notNull(),
  tags: text("tags"), // JSON
})
```

---

## Testing Strategy

### Unit Tests
- Workflow engine logic
- Test generation algorithms
- Deployment strategies
- Log parsing

### Integration Tests
- End-to-end workflow execution
- Test generation from real files
- Deployment to test environment
- Log analysis pipeline

### Performance Tests
- Large workflow execution
- Concurrent deployments
- High-volume log processing
- Real-time metric streaming

---

## Deployment Plan

### Week 1-2: Workflow Engine
- Implement workflow schema
- Build execution engine
- Add scheduling
- CLI commands

### Week 3-4: Test Generation
- Code analyzer
- Test generator
- Framework adapters
- CLI integration

### Week 5-6: Deployment Automation
- Strategy implementations
- Health checks
- Rollback logic
- CLI commands

### Week 7-8: Log Analysis
- Log parser
- Pattern detection
- AI insights
- CLI commands

### Week 9-10: Real-Time Monitoring
- Metric collector
- WebSocket server
- Dashboard updates
- Alert system

### Week 11-12: Integration & Polish
- Integration testing
- Documentation
- Performance optimization
- Bug fixes

---

## Success Criteria

### Functional
- ✅ Execute multi-step workflows
- ✅ Generate tests from code
- ✅ Deploy with multiple strategies
- ✅ Analyze logs with AI insights
- ✅ Monitor systems in real-time

### Performance
- ✅ Workflow execution < 5s overhead
- ✅ Test generation < 30s per file
- ✅ Deployment strategy < 10s decision
- ✅ Log analysis < 1s per 1000 lines
- ✅ Metric collection < 100ms

### Quality
- ✅ > 80% test coverage
- ✅ < 5% error rate
- ✅ Zero data loss
- ✅ Comprehensive documentation

---

*Phase 2 Implementation Plan*
*Automation Engine & Workflow Orchestration*
*Date: 2026-03-21*
