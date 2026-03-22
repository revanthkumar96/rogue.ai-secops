# Rouge Architecture

> Technical architecture for DevOps & Testing Automation Platform

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [System Design](#system-design)
4. [Database Schema](#database-schema)
5. [AI Integration](#ai-integration)
6. [API Design](#api-design)
7. [Security](#security)

---

## Overview

Rouge is built as a **local-first automation platform** for DevOps and testing workflows. It follows a modern monorepo architecture with clear separation of concerns.

### Core Principles

- **Local First**: Everything runs on your machine, no cloud dependencies
- **Privacy**: All AI processing via Ollama stays local
- **Type Safe**: Strict TypeScript throughout
- **Fast**: Bun runtime for maximum performance
- **Extensible**: Plugin architecture for custom automation

---

## Tech Stack

### Runtime & Core
```
Runtime:        Bun 1.3+
Language:       TypeScript 5.8+
Package Mgr:    Bun workspace
Task Runner:    Turbo
```

### Backend
```
API Framework:  Hono
Database:       SQLite + Drizzle ORM
Validation:     Zod
AI Client:      Ollama API
```

### Frontend (Planned)
```
UI Framework:   SolidJS
Build Tool:     Vite
Styling:        TailwindCSS
```

---

## System Design

### Monorepo Structure

```
rouge/
├── packages/
│   ├── core/              # Business logic + AI integration
│   │   ├── ai/           # Ollama client
│   │   ├── automation/   # Workflow engine (TODO)
│   │   ├── testing/      # Test framework (TODO)
│   │   └── devops/       # DevOps tools (TODO)
│   │
│   ├── api/              # REST API server
│   │   ├── routes/       # HTTP endpoints
│   │   ├── storage/      # Database layer
│   │   └── middleware/   # Auth, CORS, logging
│   │
│   ├── web/              # Web dashboard (TODO)
│   ├── cli/              # CLI tool (TODO)
│   └── shared/           # Shared types
│
├── docs/                 # Documentation
└── migrations/           # Database migrations
```

### Component Diagram

```
┌─────────────────────────────────────────────────┐
│                 User Interface                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │   CLI    │  │   Web    │  │   API Client │ │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘ │
└───────┼─────────────┼────────────────┼─────────┘
        │             │                │
        └─────────────┴────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      Hono API Server      │
        │  (Port 3000, REST/JSON)   │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│  Core Engine   │         │   Data Layer    │
│                │         │                 │
│ ┌────────────┐ │         │ ┌─────────────┐ │
│ │ Automation │ │         │ │   SQLite    │ │
│ │  Workflows │ │         │ │  (Drizzle)  │ │
│ └────────────┘ │         │ └─────────────┘ │
│ ┌────────────┐ │         └─────────────────┘
│ │  Testing   │ │
│ │  Engine    │ │         ┌─────────────────┐
│ └────────────┘ │         │  Ollama Server  │
│ ┌────────────┐ │         │  (Port 11434)   │
│ │  DevOps    │ │         │                 │
│ │   Tools    │ │         │ ┌─────────────┐ │
│ └────────────┘ │         │ │ llama3.2:3b │ │
└────────┬───────┘         │ └─────────────┘ │
         │                 └─────────────────┘
         │
    ┌────▼────┐
    │ Ollama  │
    │ Client  │
    └─────────┘
```

---

## Database Schema

### Current Tables (Phase 1)

**`player`** - Workflow/job executors
```sql
id               TEXT PRIMARY KEY
name             TEXT NOT NULL
class            TEXT NOT NULL  -- "automation", "testing", "devops"
level            INTEGER DEFAULT 1
experience       INTEGER DEFAULT 0

-- Stats represent capabilities
strength         INTEGER  -- Execution power
intelligence     INTEGER  -- AI reasoning ability
dexterity        INTEGER  -- Speed/parallelism
constitution     INTEGER  -- Fault tolerance

-- Metadata
created_at       INTEGER NOT NULL
updated_at       INTEGER NOT NULL
```

**`game`** - Workflow sessions
```sql
id               TEXT PRIMARY KEY
player_id        TEXT NOT NULL
current_floor    INTEGER DEFAULT 1  -- Current workflow step
deepest_floor    INTEGER DEFAULT 1  -- Max progress
turns            INTEGER DEFAULT 0  -- Actions taken
gold             INTEGER DEFAULT 0  -- Resources used
hp               INTEGER NOT NULL   -- System health
max_hp           INTEGER NOT NULL
state            TEXT DEFAULT 'active'  -- 'active', 'completed', 'failed'
narrator_enabled INTEGER DEFAULT 1
started_at       INTEGER NOT NULL
ended_at         INTEGER
last_played_at   INTEGER NOT NULL
```

**`entity`** - Workflow tasks/jobs
```sql
id               TEXT PRIMARY KEY
game_id          TEXT NOT NULL
floor_level      INTEGER NOT NULL
x, y             INTEGER NOT NULL  -- Execution order
type             TEXT NOT NULL  -- "task", "check", "deploy"
entity_type      TEXT NOT NULL  -- Specific task type
components       TEXT NOT NULL  -- JSON task config
active           INTEGER DEFAULT 1
created_at       INTEGER NOT NULL
```

**`narrative`** - AI-generated insights/logs
```sql
id               TEXT PRIMARY KEY
game_id          TEXT NOT NULL
event_type       TEXT NOT NULL  -- "deploy", "test", "error"
context          TEXT NOT NULL  -- JSON context
narration        TEXT  -- AI-generated analysis
model_used       TEXT  -- "llama3.2:3b"
created_at       INTEGER NOT NULL
```

---

### Automation Engine
- **Fuzzy File Editing**: Implements a multi-strategy matching engine (Exact, Trimmed, Block-Anchor) to robustly modify code regardless of minor formatting drift.
- **Secure Bash Parser**: Every terminal command is pre-parsed to detect chaining (`&&`, `;`) and validated against strict permission sets.
- **LSP Feedback Loop**: Automated syntax verification (using `bun build`) triggers after edits to prevent introduction of broken code.
- **GitHub Sync**: Native integration for event-driven automation (Issue comments, PR updates) with automated commit/push lifecycle.

## AI Integration

### Ollama Client

**Location**: `packages/core/src/ai/ollama.ts`

**Features:**
- Connection testing (`isAvailable()`)
- Model management (`listModels()`, `pullModel()`)
- Text generation (`generate()`)
- Chat completion (`chat()`)
- Streaming (`stream()`)

**Usage Example:**
```typescript
import { Ollama } from "@rouge/core/ai/ollama"

// Check availability
const available = await Ollama.isAvailable()

// Generate text
const analysis = await Ollama.generate({
  model: "llama3.2:3b",
  prompt: "Analyze this error log: ...",
  system: "You are a DevOps expert",
  temperature: 0.7,
})
```

### AI Use Cases

**DevOps:**
- Log analysis and troubleshooting
- Configuration validation
- Infrastructure recommendations
- Incident response suggestions

**Testing:**
- Test case generation from requirements
- Bug report analysis
- Test result interpretation
- Coverage gap identification

**Automation:**
- Workflow optimization suggestions
- Error recovery strategies
- Resource allocation decisions
- Schedule optimization

---

## API Design

### RESTful Principles

- **Resource-based URLs**: `/player`, `/game`, `/workflow`
- **HTTP verbs**: GET, POST, PATCH, DELETE
- **JSON payloads**: All request/response in JSON
- **Status codes**: Proper HTTP status codes
- **Error handling**: Consistent error format

### Endpoint Structure

```
/                     Root API info
/health               Health check

/ai/status            Ollama availability
/ai/generate          Text generation

/player               Player CRUD
/game                 Workflow sessions
/workflow             Automation workflows (TODO)
/test                 Testing endpoints (TODO)
/deploy               Deployment endpoints (TODO)
```

### Response Format

**Success:**
```json
{
  "id": "uuid",
  "data": { ... }
}
```

**Error:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## Security

### Authentication (Planned)
- API key-based auth for remote access
- JWT tokens for web dashboard
- Rate limiting per client

### Data Protection
- SQLite file permissions (600)
- Environment-based secrets
- No plaintext credentials
- CORS protection

### AI Safety
- Local processing only (Ollama)
- No data sent to external services
- Prompt injection prevention
- Output sanitization

---

## Performance Characteristics

| Metric | Target | Current |
|--------|--------|---------|
| API Response | <10ms | ~5ms |
| DB Query | <5ms | ~2ms |
| AI Generation | 1-3s | Varies by model |
| Startup Time | <100ms | ~50ms |
| Memory Usage | <100MB | ~30MB |

---

## Deployment Models

### Local Development
```
bun dev  # Start API server
```

### Production (Self-Hosted)
```bash
bun build           # Build all packages
bun start           # Start production server
```

### Docker (Planned)
```bash
docker-compose up   # Run all services
```

---

## Future Architecture

### Phase 2: Automation Engine
- Workflow DAG execution
- Task scheduling
- Event-driven triggers
- Plugin system

### Phase 3: Testing Framework
- Test runner integration
- Result aggregation
- Coverage tracking
- Parallel execution

### Phase 4: Web Dashboard
- Real-time monitoring
- Workflow visualization
- AI chat interface
- Configuration UI

---

## Technology Decisions

### Why Monorepo?
- Shared code across packages
- Atomic commits
- Easier refactoring
- Single version management

### Why TypeScript?
- Type safety reduces bugs
- Better IDE support
- Self-documenting code
- Easy refactoring

### Why SQLite?
- Zero configuration
- Fast for local use
- Single file database
- Built into Bun

### Why Hono?
- Lightweight (no dependencies)
- Fast routing
- Type-safe
- Modern API

---

## Development Workflow

```bash
# 1. Make changes
# 2. Type check
bun typecheck

# 3. Test
bun test

# 4. Build
bun build

# 5. Deploy
bun start
```

---

*Architecture designed for DevOps and testing automation*
*Last Updated: March 21, 2026*
