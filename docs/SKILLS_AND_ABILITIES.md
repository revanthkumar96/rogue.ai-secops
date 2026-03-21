# Rouge Skills and Abilities

> Comprehensive guide to the skills and abilities system

## Overview

Rouge uses a **Skills and Abilities** system to define reusable DevOps capabilities and agent permissions.

- **Skills**: Reusable DevOps operations (test generation, deployment, monitoring)
- **Abilities**: What each agent can do (combining skills, tools, and permissions)

---

## Architecture

```
Agent
  └─ Has Abilities
       ├─ Requires Permissions
       ├─ Uses Tools
       └─ Executes Skills
```

### Example Flow

```
test agent
  └─ Has "test-generation" ability
       ├─ Requires: read, write permissions
       ├─ Uses: ReadLog, WriteConfig, Grep tools
       └─ Executes: test:generate skill
```

---

## Skills

Skills are atomic, reusable DevOps operations.

### Skill Categories

1. **Testing** - Test generation and execution
2. **Deployment** - Deployment operations
3. **Monitoring** - Metrics and log monitoring
4. **Security** - Security scanning and compliance
5. **Infrastructure** - Infrastructure provisioning
6. **Database** - Database operations
7. **Analysis** - Log and error analysis

### Skill Definition Structure

```typescript
{
  id: "test:generate",
  name: "Generate Tests",
  description: "Generate test cases from specifications",
  category: "testing",
  inputs: [
    {
      name: "spec",
      type: "string",
      description: "Specification to test",
      required: true
    }
  ],
  outputs: [
    {
      name: "tests",
      type: "string",
      description: "Generated test code"
    }
  ],
  examples: [
    "Generate unit tests for auth module"
  ]
}
```

---

## Available Skills

### Testing Skills

#### `test:generate`
Generate test cases from specifications or code.

**Inputs**:
- `spec` (string, required): Specification or code
- `type` (string, required): unit | integration | e2e
- `framework` (string, optional): Testing framework

**Outputs**:
- `tests` (string): Generated test code

**Examples**:
```bash
rouge skill test:generate --spec auth.ts --type unit
```

#### `test:execute`
Run test suites and collect results.

**Inputs**:
- `pattern` (string, optional): Test file pattern
- `coverage` (boolean, optional): Collect coverage

**Outputs**:
- `results` (TestResults): Execution results

**Examples**:
```bash
rouge skill test:execute --pattern "**/*.test.ts" --coverage
```

### Deployment Skills

#### `deploy:validate`
Validate deployment configuration.

**Inputs**:
- `config` (object, required): Deployment config
- `environment` (string, required): Target environment

**Outputs**:
- `valid` (boolean): Is configuration valid
- `errors` (string[]): Validation errors

#### `deploy:execute`
Deploy application to environment.

**Inputs**:
- `version` (string, required): Version to deploy
- `environment` (string, required): Target environment
- `strategy` (string, optional): Deployment strategy

**Outputs**:
- `status` (string): Deployment status
- `url` (string): Deployed URL

### Monitoring Skills

#### `monitor:metrics`
Collect and analyze system metrics.

**Inputs**:
- `service` (string, required): Service to monitor
- `metrics` (string[], required): Metrics to collect

**Outputs**:
- `data` (object): Metric data
- `alerts` (string[]): Triggered alerts

#### `monitor:logs`
Read and analyze logs.

**Inputs**:
- `path` (string, required): Log file path
- `pattern` (string, optional): Search pattern

**Outputs**:
- `errors` (number): Error count
- `warnings` (number): Warning count

### Security Skills

#### `security:scan`
Scan for security vulnerabilities.

**Inputs**:
- `target` (string, required): Target to scan
- `type` (string, required): sast | dast | container | dependency

**Outputs**:
- `vulnerabilities` (Vulnerability[]): Found issues
- `severity` (string): Highest severity

### Infrastructure Skills

#### `infra:provision`
Provision cloud infrastructure.

**Inputs**:
- `provider` (string, required): aws | azure | gcp
- `config` (object, required): Infrastructure config

**Outputs**:
- `resources` (string[]): Provisioned resources
- `status` (string): Provisioning status

### Database Skills

#### `database:migrate`
Execute database migration.

**Inputs**:
- `direction` (string, required): up | down
- `script` (string, required): Migration script

**Outputs**:
- `success` (boolean): Migration success
- `changes` (string[]): Applied changes

#### `database:optimize`
Optimize database queries.

**Inputs**:
- `query` (string, required): Query to optimize

**Outputs**:
- `optimized` (string): Optimized query
- `suggestions` (string[]): Suggestions

### Analysis Skills

#### `analyze:root-cause`
Perform root cause analysis.

**Inputs**:
- `logs` (string, required): Log data
- `context` (object, optional): Additional context

**Outputs**:
- `root_cause` (string): Identified cause
- `recommendations` (string[]): Recommended fixes

---

## Abilities

Abilities define what agents can do by combining skills, tools, and permissions.

### Ability Categories

Abilities are organized by function:
- Testing abilities
- Deployment abilities
- Monitoring abilities
- Security abilities
- Infrastructure abilities
- Database abilities
- Analysis abilities
- CI/CD abilities
- Performance abilities
- Incident abilities

### Ability Definition Structure

```typescript
{
  id: "test-generation",
  name: "Test Generation",
  description: "Generate test cases from specifications",
  agents: ["test"],
  permissions: ["read", "write"],
  tools: ["ReadLog", "WriteConfig", "Grep"],
  skills: ["test:generate"]
}
```

---

## Available Abilities

### Testing Abilities

#### `test-generation`
Generate test cases from specifications.

**Agents**: test
**Permissions**: read, write
**Tools**: ReadLog, WriteConfig, Grep
**Skills**: test:generate

#### `test-execution`
Execute test suites.

**Agents**: test
**Permissions**: read, execute
**Tools**: Bash, ReadLog
**Skills**: test:execute

#### `test-analysis`
Analyze test results and coverage.

**Agents**: test, analyze
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: -

### Deployment Abilities

#### `deployment-validation`
Validate deployment configurations.

**Agents**: deploy
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: deploy:validate

#### `deployment-execution`
Execute deployments.

**Agents**: deploy
**Permissions**: read, write, execute, deploy
**Tools**: Bash, ReadLog, WriteConfig
**Skills**: deploy:execute

#### `deployment-rollback`
Rollback failed deployments.

**Agents**: deploy
**Permissions**: read, execute, deploy
**Tools**: Bash, ReadLog
**Skills**: -

### Monitoring Abilities

#### `metrics-collection`
Collect system metrics.

**Agents**: monitor
**Permissions**: read, execute
**Tools**: Bash, ReadLog
**Skills**: monitor:metrics

#### `log-monitoring`
Monitor application logs.

**Agents**: monitor, analyze
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: monitor:logs

#### `alerting`
Create and manage alerts.

**Agents**: monitor
**Permissions**: read, write
**Tools**: WriteConfig
**Skills**: -

### Security Abilities

#### `vulnerability-scanning`
Scan for vulnerabilities.

**Agents**: security
**Permissions**: read, execute
**Tools**: Bash, ReadLog, Grep
**Skills**: security:scan

#### `compliance-checking`
Check compliance.

**Agents**: security
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: -

#### `secret-detection`
Detect exposed secrets.

**Agents**: security
**Permissions**: read
**Tools**: Grep, ReadLog
**Skills**: -

### Infrastructure Abilities

#### `infrastructure-provisioning`
Provision infrastructure.

**Agents**: infrastructure
**Permissions**: read, write, execute
**Tools**: Bash, WriteConfig, ReadLog
**Skills**: infra:provision

#### `infrastructure-configuration`
Configure infrastructure.

**Agents**: infrastructure
**Permissions**: read, write
**Tools**: WriteConfig, ReadLog
**Skills**: -

#### `infrastructure-validation`
Validate infrastructure.

**Agents**: infrastructure
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: -

### Database Abilities

#### `schema-migration`
Execute schema migrations.

**Agents**: database
**Permissions**: read, write, execute
**Tools**: Bash, WriteConfig, ReadLog
**Skills**: database:migrate

#### `query-optimization`
Optimize queries.

**Agents**: database
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: database:optimize

#### `backup-restore`
Backup and restore.

**Agents**: database
**Permissions**: read, execute
**Tools**: Bash, ReadLog
**Skills**: -

### Analysis Abilities

#### `root-cause-analysis`
Find root causes.

**Agents**: analyze, incident
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: analyze:root-cause

#### `log-correlation`
Correlate logs.

**Agents**: analyze, incident
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: -

#### `pattern-detection`
Detect patterns.

**Agents**: analyze, monitor
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: -

### CI/CD Abilities

#### `pipeline-design`
Design CI/CD pipelines.

**Agents**: ci-cd
**Permissions**: read, write
**Tools**: WriteConfig
**Skills**: -

#### `pipeline-optimization`
Optimize pipelines.

**Agents**: ci-cd
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: -

#### `quality-gates`
Implement quality gates.

**Agents**: ci-cd
**Permissions**: read, write
**Tools**: WriteConfig
**Skills**: -

### Performance Abilities

#### `load-testing`
Execute load tests.

**Agents**: performance
**Permissions**: read, execute
**Tools**: Bash, ReadLog
**Skills**: -

#### `performance-analysis`
Analyze performance.

**Agents**: performance, analyze
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: -

#### `capacity-planning`
Plan capacity.

**Agents**: performance, infrastructure
**Permissions**: read
**Tools**: ReadLog
**Skills**: -

### Incident Abilities

#### `incident-triage`
Triage incidents.

**Agents**: incident
**Permissions**: read
**Tools**: ReadLog, Grep
**Skills**: -

#### `incident-response`
Respond to incidents.

**Agents**: incident
**Permissions**: read, execute
**Tools**: Bash, ReadLog
**Skills**: -

#### `postmortem-generation`
Generate postmortems.

**Agents**: incident
**Permissions**: read, write
**Tools**: WriteConfig, ReadLog
**Skills**: -

---

## Agent Ability Matrix

| Agent | Abilities Count | Primary Abilities |
|-------|----------------|-------------------|
| test | 3 | test-generation, test-execution, test-analysis |
| deploy | 3 | deployment-validation, deployment-execution, deployment-rollback |
| monitor | 4 | metrics-collection, log-monitoring, alerting, pattern-detection |
| analyze | 4 | test-analysis, log-monitoring, root-cause-analysis, log-correlation |
| security | 3 | vulnerability-scanning, compliance-checking, secret-detection |
| infrastructure | 4 | infrastructure-provisioning, infrastructure-configuration, infrastructure-validation, capacity-planning |
| database | 3 | schema-migration, query-optimization, backup-restore |
| ci-cd | 3 | pipeline-design, pipeline-optimization, quality-gates |
| performance | 3 | load-testing, performance-analysis, capacity-planning |
| incident | 4 | incident-triage, incident-response, postmortem-generation, root-cause-analysis |

---

## Using Skills and Abilities

### Query Skills

```typescript
import { Skill } from "./skill"

// Get all skills
const allSkills = Skill.list()

// Get skill by ID
const testGen = Skill.get("test:generate")

// Search skills
const testSkills = Skill.search("test")

// Get by category
const deploySkills = Skill.byCategory("deployment")
```

### Query Abilities

```typescript
import { Ability } from "./ability"

// Get all abilities
const allAbilities = Ability.list()

// Get abilities for agent
const testAbilities = Ability.forAgent("test")

// Check if agent has ability
const canGenerate = Ability.hasAbility("test", "test-generation")

// Get required permissions
const perms = Ability.getPermissions("deployment-execution")
```

### Permission Checking

```typescript
// Check if agent has required permissions
function canExecute(agent: AgentType, abilityId: string): boolean {
  const required = Ability.getPermissions(abilityId)
  const agentPerms = getAgentPermissions(agent)

  return required.every(p => agentPerms.includes(p))
}
```

---

## Extending the System

### Adding New Skills

1. Define skill in `skill/index.ts`:

```typescript
"custom:skill": {
  id: "custom:skill",
  name: "Custom Skill",
  description: "Custom operation",
  category: "testing",
  inputs: [...],
  outputs: [...],
  examples: [...]
}
```

2. Implement skill logic in appropriate tool

### Adding New Abilities

1. Define ability in `ability/index.ts`:

```typescript
"custom-ability": {
  id: "custom-ability",
  name: "Custom Ability",
  description: "Custom agent capability",
  agents: ["test"],
  permissions: ["read"],
  tools: ["ReadLog"],
  skills: ["custom:skill"]
}
```

2. Update agent prompts if needed

---

## Best Practices

### Skill Design

1. **Single Responsibility**: One skill = one operation
2. **Clear Inputs/Outputs**: Well-defined interfaces
3. **Reusability**: Usable across multiple agents
4. **Examples**: Provide usage examples

### Ability Design

1. **Minimal Permissions**: Least privilege principle
2. **Clear Boundaries**: Well-defined scope
3. **Tool Requirements**: Only necessary tools
4. **Agent Alignment**: Match agent expertise

### Permission Management

1. **Read**: View data (logs, configs)
2. **Write**: Modify data (configs, files)
3. **Execute**: Run commands (deployments, tests)
4. **Deploy**: Production deployments

---

## Security Considerations

### Permission Levels

- **read**: Low risk, view-only
- **write**: Medium risk, can modify configs
- **execute**: High risk, can run commands
- **deploy**: Critical risk, production changes

### Ability Restrictions

```typescript
// Restrict dangerous abilities
const restrictedAbilities = [
  "deployment-execution",
  "infrastructure-provisioning",
  "schema-migration"
]

// Require explicit confirmation
if (restrictedAbilities.includes(abilityId)) {
  await confirmWithUser()
}
```

---

## Future Enhancements

### Planned Features

1. **Dynamic Skills**: Load skills from plugins
2. **Skill Composition**: Combine skills into workflows
3. **Ability Policies**: Fine-grained access control
4. **Skill Marketplace**: Share custom skills
5. **Ability Learning**: AI-driven ability discovery

---

*Complete Skills and Abilities System*
*Reusable DevOps Capabilities*
*Date: 2026-03-21*
