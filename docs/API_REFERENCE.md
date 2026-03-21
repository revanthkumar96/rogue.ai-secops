# Rouge API Reference

> Complete REST API documentation for Rouge DevOps & Testing Automation Platform

## Base URL

```
http://localhost:3000
```

---

## Authentication

Currently, no authentication is required for local development.

**Planned**: API key-based authentication for remote access.

---

## Core Endpoints

### Get API Information

```http
GET /
```

**Response:**
```json
{
  "name": "Rouge API",
  "version": "0.1.0",
  "status": "ok"
}
```

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1710969600000
}
```

---

## AI Integration

### Check Ollama Status

```http
GET /ai/status
```

**Description**: Check if Ollama server is available and list installed models.

**Response:**
```json
{
  "available": true,
  "models": ["llama3.2:3b", "mistral:7b"],
  "url": "http://localhost:11434"
}
```

**Error Response:**
```json
{
  "available": false,
  "models": [],
  "error": "Connection refused"
}
```

### Generate Text

```http
POST /ai/generate
```

**Description**: Generate text using Ollama.

**Request Body:**
```json
{
  "prompt": "Analyze this error: Connection timeout",
  "system": "You are a DevOps expert",  // Optional
  "model": "llama3.2:3b"                // Optional, defaults to llama3.2:3b
}
```

**Response:**
```json
{
  "text": "This error suggests network connectivity issues..."
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Generate a Dockerfile for a Node.js app",
    "model": "llama3.2:3b"
  }'
```

---

## Workflow Management (Planned)

### Create Workflow

```http
POST /workflow
```

**Description**: Create a new automation workflow.

**Request Body:**
```json
{
  "name": "Deploy to Production",
  "description": "Automated deployment pipeline",
  "steps": [
    {
      "type": "test",
      "config": { "command": "bun test" }
    },
    {
      "type": "build",
      "config": { "command": "bun build" }
    },
    {
      "type": "deploy",
      "config": { "target": "production" }
    }
  ],
  "ai_enabled": true
}
```

**Response:**
```json
{
  "id": "wf_123abc",
  "name": "Deploy to Production",
  "status": "pending",
  "created_at": 1710969600000
}
```

### Get Workflow Status

```http
GET /workflow/:id
```

**Response:**
```json
{
  "id": "wf_123abc",
  "name": "Deploy to Production",
  "status": "running",
  "current_step": 2,
  "total_steps": 3,
  "started_at": 1710969600000,
  "steps": [
    { "name": "test", "status": "completed", "duration_ms": 1500 },
    { "name": "build", "status": "running", "duration_ms": null },
    { "name": "deploy", "status": "pending", "duration_ms": null }
  ]
}
```

### Execute Workflow

```http
POST /workflow/:id/execute
```

**Description**: Start workflow execution.

**Response:**
```json
{
  "id": "wf_123abc",
  "status": "running",
  "execution_id": "exec_456def"
}
```

---

## Testing Framework (Planned)

### Generate Test Cases

```http
POST /test/generate
```

**Description**: Generate test cases using AI.

**Request Body:**
```json
{
  "type": "api",  // "api", "ui", "integration"
  "spec": {
    "endpoint": "/api/users",
    "method": "POST",
    "description": "Create a new user"
  },
  "framework": "vitest"  // "vitest", "jest", "playwright"
}
```

**Response:**
```json
{
  "test_cases": [
    {
      "name": "should create user with valid data",
      "code": "test('should create user', async () => { ... })"
    },
    {
      "name": "should reject invalid email",
      "code": "test('should reject invalid email', async () => { ... })"
    }
  ],
  "count": 2
}
```

### Execute Tests

```http
POST /test/execute
```

**Description**: Run test suite.

**Request Body:**
```json
{
  "framework": "vitest",
  "pattern": "**/*.test.ts",
  "coverage": true
}
```

**Response:**
```json
{
  "execution_id": "test_789ghi",
  "status": "running"
}
```

### Get Test Results

```http
GET /test/:id/results
```

**Response:**
```json
{
  "id": "test_789ghi",
  "status": "completed",
  "summary": {
    "total": 45,
    "passed": 43,
    "failed": 2,
    "skipped": 0
  },
  "coverage": {
    "lines": 85.5,
    "branches": 78.2,
    "functions": 90.1
  },
  "duration_ms": 3420,
  "failures": [
    {
      "test": "should handle timeout",
      "error": "Expected 200, got 500",
      "file": "api.test.ts:45"
    }
  ]
}
```

---

## Player Management

### Create Player

```http
POST /player
```

**Description**: Create a new execution agent.

**Request Body:**
```json
{
  "name": "automation-bot",
  "class": "automation"  // "automation", "testing", "devops"
}
```

**Response:**
```json
{
  "id": "player_123",
  "name": "automation-bot",
  "class": "automation",
  "strength": 8,
  "intelligence": 5,
  "dexterity": 6,
  "constitution": 7,
  "created_at": 1710969600000
}
```

### Get Player

```http
GET /player/:id
```

**Response:**
```json
{
  "id": "player_123",
  "name": "automation-bot",
  "class": "automation",
  "level": 3,
  "experience": 1250,
  "games_played": 15,
  "games_won": 12,
  "deepest_floor": 8
}
```

### List Players

```http
GET /player
```

**Response:**
```json
[
  {
    "id": "player_123",
    "name": "automation-bot",
    "class": "automation",
    "level": 3
  },
  {
    "id": "player_456",
    "name": "test-runner",
    "class": "testing",
    "level": 5
  }
]
```

### Update Player

```http
PATCH /player/:id
```

**Request Body:**
```json
{
  "name": "automation-bot-v2",
  "level": 4
}
```

**Response:**
```json
{
  "id": "player_123",
  "name": "automation-bot-v2",
  "level": 4,
  "updated_at": 1710969600000
}
```

### Delete Player

```http
DELETE /player/:id
```

**Response:**
```json
{
  "success": true
}
```

---

## Game Session Management

### Create Game Session

```http
POST /game
```

**Description**: Create a new workflow execution session.

**Request Body:**
```json
{
  "player_id": "player_123"
}
```

**Response:**
```json
{
  "id": "game_789",
  "player_id": "player_123",
  "hp": 24,
  "max_hp": 24,
  "current_floor": 1,
  "state": "active",
  "started_at": 1710969600000
}
```

### Get Game Session

```http
GET /game/:id
```

**Response:**
```json
{
  "id": "game_789",
  "player_id": "player_123",
  "hp": 18,
  "max_hp": 24,
  "current_floor": 3,
  "deepest_floor": 3,
  "turns": 45,
  "gold": 120,
  "state": "active",
  "narrator_enabled": 1
}
```

### List Game Sessions

```http
GET /game?player_id={player_id}
```

**Query Parameters:**
- `player_id` (required): Filter by player ID

**Response:**
```json
[
  {
    "id": "game_789",
    "player_id": "player_123",
    "current_floor": 3,
    "state": "active",
    "started_at": 1710969600000
  },
  {
    "id": "game_456",
    "player_id": "player_123",
    "current_floor": 5,
    "state": "won",
    "ended_at": 1710969500000
  }
]
```

### Update Game Session

```http
PATCH /game/:id
```

**Request Body:**
```json
{
  "hp": 20,
  "current_floor": 4,
  "gold": 150
}
```

**Response:**
```json
{
  "id": "game_789",
  "hp": 20,
  "current_floor": 4,
  "gold": 150,
  "last_played_at": 1710969600000
}
```

### Delete Game Session

```http
DELETE /game/:id
```

**Response:**
```json
{
  "success": true
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "stack": "Stack trace (dev only)"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting (Planned)

- **Default**: 100 requests/minute per IP
- **AI endpoints**: 10 requests/minute per IP

---

## Examples

### Complete Workflow Example

```bash
# 1. Check system health
curl http://localhost:3000/health

# 2. Check Ollama
curl http://localhost:3000/ai/status

# 3. Create player
PLAYER=$(curl -X POST http://localhost:3000/player \
  -H "Content-Type: application/json" \
  -d '{"name":"devops-bot","class":"automation"}')

PLAYER_ID=$(echo $PLAYER | jq -r '.id')

# 4. Create game session
GAME=$(curl -X POST http://localhost:3000/game \
  -H "Content-Type: application/json" \
  -d "{\"player_id\":\"$PLAYER_ID\"}")

GAME_ID=$(echo $GAME | jq -r '.id')

# 5. Use AI to analyze logs
curl -X POST http://localhost:3000/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze: ERROR: Connection timeout after 30s",
    "system": "You are a DevOps troubleshooting expert"
  }'
```

---

## WebSocket API (Planned)

For real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws')

ws.on('workflow.status', (data) => {
  console.log('Workflow status:', data)
})

ws.on('test.result', (data) => {
  console.log('Test result:', data)
})
```

---

*API Version: 0.1.0*
*Last Updated: March 21, 2026*
