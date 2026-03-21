# Rouge Restructure Status

> Following Rouge architecture for DevOps & Testing Automation

## 🎯 Goal

Rebuild Rouge using **Rouge's exact patterns and structure**, but focused on **DevOps automation and testing** instead of general software development.

---

## ✅ Completed

### Project Structure

```
rouge/
├── package.json                     ✅ Workspace catalog (workspace style)
├── bunfig.toml                      ✅ Bun configuration
├── tsconfig.json                    ✅ TypeScript base config
├── turbo.json                       ✅ Task orchestration
│
└── packages/
    └── rouge/                       ✅ Main package (main CLI)
        ├── package.json             ✅ Package config
        └── src/
            ├── index.ts             ✅ CLI entry (yargs router)
            ├── installation/        ✅ Version & environment
            ├── global/              ✅ XDG paths
            ├── util/                ✅ Log, filesystem, lazy
            ├── cli/
            │   ├── ui/              ✅ UI helpers
            │   └── cmd/             ✅ CLI commands
            │       ├── run.ts       ✅ Main command
            │       ├── serve.ts     ✅ API server
            │       ├── test.ts      ✅ Test execution
            │       ├── workflow.ts  ✅ Workflow mgmt
            │       ├── config.ts    ✅ Config mgmt
            │       └── agent.ts     ✅ Agent mgmt
            ├── server/
            │   └── server.ts        ✅ Hono app
            └── storage/
                └── db.ts            ✅ Database client
```

---

## 🚧 In Progress / TODO

### Following Rouge Pattern

| Component | Rouge | Rouge | Status |
|-----------|----------|-------|--------|
| **CLI Entry** | `index.ts` with yargs | ✅ Created | Complete |
| **Commands** | `cli/cmd/*` | ✅ Created | Basic structure |
| **Server** | `server/server.ts` | ✅ Created | Needs routes |
| **Database** | `storage/db.ts` | ✅ Created | Needs schemas |
| **Agent System** | `agent/agent.ts` | ⏳ TODO | Not started |
| **Config** | `config/config.ts` | ⏳ TODO | Not started |
| **Provider** | `provider/provider.ts` | ⏳ TODO | Ollama client |
| **Tool System** | `tool/*` | ⏳ TODO | DevOps tools |
| **Routes** | `server/routes/*` | ⏳ TODO | API endpoints |
| **Schemas** | `storage/schema/*` | ⏳ TODO | DB tables |

---

## 📋 Detailed TODO List

### 1. Core Infrastructure

- [x] Project structure
- [x] CLI entry point
- [x] Command system
- [x] Logging system
- [x] Global paths (XDG)
- [x] Server foundation
- [x] Database client

### 2. Agent System (Rouge architecture/src/agent/)

```typescript
packages/rouge/src/agent/
├── agent.ts              # Agent definitions
├── test-agent.txt        # Test execution agent prompt
├── deploy-agent.txt      # Deployment agent prompt
└── monitor-agent.txt     # Monitoring agent prompt
```

**Agents:**
- `test`: Test generation & execution
- `deploy`: Deployment automation
- `monitor`: System monitoring
- `analyze`: Log/error analysis

### 3. Provider System (Rouge architecture/src/provider/)

```typescript
packages/rouge/src/provider/
├── provider.ts           # Provider abstraction
├── ollama.ts             # Ollama integration
└── schema.ts             # Provider types
```

### 4. Tool System (Rouge architecture/src/tool/)

```typescript
packages/rouge/src/tool/
├── test/
│   ├── generate.ts       # Generate test cases
│   ├── execute.ts        # Run tests
│   └── analyze.ts        # Analyze results
├── deploy/
│   ├── validate.ts       # Validate config
│   ├── deploy.ts         # Deploy application
│   └── rollback.ts       # Rollback deployment
├── monitor/
│   ├── logs.ts           # Log analysis
│   ├── metrics.ts        # Metrics collection
│   └── alerts.ts         # Alert management
└── infra/
    ├── provision.ts      # Provision infrastructure
    ├── configure.ts      # Configure services
    └── validate.ts       # Validate infrastructure
```

### 5. Config System (Rouge architecture/src/config/)

```typescript
packages/rouge/src/config/
├── config.ts             # Config management
├── paths.ts              # Path resolution
└── schema.ts             # Config types
```

### 6. Database Schemas (Rouge architecture/src/storage/schema/)

```typescript
packages/rouge/src/storage/schema/
├── workflow.sql.ts       # Workflow definitions
├── execution.sql.ts      # Execution history
├── test.sql.ts           # Test runs
├── deployment.sql.ts     # Deployments
└── agent.sql.ts          # Agent state
```

### 7. API Routes (Rouge architecture/src/server/routes/)

```typescript
packages/rouge/src/server/routes/
├── workflow.ts           # Workflow CRUD
├── test.ts               # Test management
├── deploy.ts             # Deployment ops
├── agent.ts              # Agent management
├── config.ts             # Config endpoints
└── health.ts             # Health checks
```

### 8. Web UI (Rouge architecture packages/app/)

```typescript
packages/web/
├── src/
│   ├── App.tsx           # Root component
│   ├── components/
│   │   ├── Workflow.tsx  # Workflow UI
│   │   ├── Test.tsx      # Test UI
│   │   └── Deploy.tsx    # Deploy UI
│   └── lib/
│       └── api.ts        # API client
└── vite.config.ts
```

### 9. SDK (Rouge architecture packages/sdk/)

```typescript
packages/sdk/
└── src/
    ├── client.ts         # API client
    ├── types.ts          # TypeScript types
    └── workflows.ts      # Workflow helpers
```

### 10. Shared Package (Rouge architecture packages/shared/)

```typescript
packages/shared/
└── src/
    ├── types.ts          # Shared types
    ├── schemas.ts        # Zod schemas
    └── constants.ts      # Constants
```

---

## 🎨 Rouge Patterns to Adopt

### 1. Namespace Organization

```typescript
// ✅ Use namespaces for logical grouping
export namespace Agent {
  export const Info = z.object({...})
  export type Info = z.infer<typeof Info>
  export function list() {...}
}
```

### 2. Lazy Initialization

```typescript
// ✅ Use lazy() for expensive operations
export const Default = lazy(() => createApp({}))
```

### 3. Zod-First Schemas

```typescript
// ✅ Define with Zod, infer types
export const Config = z.object({...})
export type Config = z.infer<typeof Config>
```

### 4. Snake_case DB Columns

```typescript
// ✅ No column mapping needed
const workflow = sqliteTable("workflow", {
  workflow_id: text("workflow_id"),
  created_at: integer("created_at"),
})
```

### 5. Command Pattern

```typescript
// ✅ Use cmd() helper
export const TestCommand = cmd({
  command: "test [pattern]",
  describe: "run tests",
  builder: (yargs) => {...},
  handler: async (args) => {...},
})
```

### 6. Logging Pattern

```typescript
// ✅ Create service-specific loggers
const log = Log.create({ service: "test" })
log.info("running tests", { count: 5 })
```

### 7. Error Handling

```typescript
// ✅ Named errors with Zod
export const TestError = NamedError.create(
  "TestError",
  z.object({ message: z.string() })
)
```

---

## 📦 Package Structure

Following Rouge's package layout:

### packages/rouge (Main Package)
- CLI commands
- API server
- Agent system
- Tool implementations
- Database layer

### packages/web (Dashboard)
- SolidJS web UI
- Real-time updates
- Workflow visualization

### packages/sdk (TypeScript SDK)
- API client
- Type definitions
- Helper functions

### packages/shared (Shared Code)
- Types
- Schemas
- Constants

---

## 🔄 Migration Strategy

### Phase 1: Core Infrastructure ✅
- [x] Project structure
- [x] CLI foundation
- [x] Basic commands
- [x] Server setup
- [x] Database client

### Phase 2: Agent System (Next)
- [ ] Agent definitions
- [ ] Prompt templates
- [ ] Tool implementations
- [ ] Ollama integration

### Phase 3: Tool System
- [ ] Test tools
- [ ] Deploy tools
- [ ] Monitor tools
- [ ] Infrastructure tools

### Phase 4: API & Routes
- [ ] Workflow routes
- [ ] Test routes
- [ ] Deploy routes
- [ ] Agent routes

### Phase 5: Web UI
- [ ] Dashboard
- [ ] Workflow UI
- [ ] Test results UI
- [ ] Deploy UI

### Phase 6: SDK & Docs
- [ ] TypeScript SDK
- [ ] API documentation
- [ ] Examples
- [ ] Guides

---

## 🎯 Focus Areas for DevOps/Testing

### Test Automation
- Generate test cases from specs
- Execute test suites
- Analyze test results
- Track coverage

### Deployment Automation
- Validate configurations
- Deploy applications
- Manage rollbacks
- Monitor deployments

### Infrastructure Management
- Provision resources
- Configure services
- Validate setups
- Monitor health

### Log Analysis
- Parse log files
- Identify errors
- Suggest fixes
- Generate reports

---

## 📝 Commands to Implement

Rouge pattern but for DevOps/Testing:

```bash
# Core commands
rouge                          # Interactive mode (main CLI)
rouge serve                    # Start API server ✅
rouge --version                # Show version ✅

# Test commands
rouge test [pattern]           # Run tests ✅ (stub)
rouge test generate            # Generate tests
rouge test analyze             # Analyze results

# Workflow commands
rouge workflow list            # List workflows ✅ (stub)
rouge workflow create          # Create workflow
rouge workflow run <id>        # Run workflow
rouge workflow status <id>     # Check status

# Deploy commands
rouge deploy validate          # Validate config
rouge deploy run               # Deploy
rouge deploy rollback          # Rollback
rouge deploy status            # Check status

# Agent commands
rouge agent list               # List agents ✅ (stub)
rouge agent run <name>         # Run agent
rouge agent status             # Agent status

# Config commands
rouge config show              # Show config ✅ (stub)
rouge config set <key> <value> # Set config
```

---

## 🚀 Next Steps

1. **Implement Agent System**
   - Create agent definitions
   - Add prompt templates
   - Integrate Ollama

2. **Build Tool System**
   - Test generation
   - Deploy automation
   - Log analysis

3. **Add API Routes**
   - Workflow endpoints
   - Test endpoints
   - Deploy endpoints

4. **Create Database Schemas**
   - Workflow tables
   - Execution history
   - Test results

5. **Build Web UI**
   - Dashboard
   - Workflow view
   - Test results

---

## 📊 Progress

- **Structure**: 80% complete
- **CLI**: 60% complete
- **Server**: 40% complete
- **Agent System**: 0% complete
- **Tool System**: 0% complete
- **Routes**: 10% complete
- **Database**: 30% complete
- **Web UI**: 0% complete
- **SDK**: 0% complete

**Overall**: ~25% complete

---

## ✅ Ready to Use Now

```bash
# Install dependencies
bun install

# Check CLI
bun dev --help

# Start server
bun dev serve

# Test commands (stubs)
bun dev test
bun dev workflow list
bun dev agent list
```

---

*Restructure based on Rouge architecture*
*Focus: DevOps & Testing Automation*
*Date: March 21, 2026*
