# Rouge Agent Prompts

> Comprehensive guide to all agent prompts and their usage

## Overview

Rouge provides 10 specialized agents for DevOps and testing automation. Each agent has a carefully crafted prompt defining its role, capabilities, and guidelines.

---

## Agent Types

### Core Agents

1. **test** - Test automation and generation
2. **deploy** - Deployment automation
3. **monitor** - System monitoring and alerting
4. **analyze** - Log and error analysis

### Specialized Agents

5. **ci-cd** - CI/CD pipeline automation
6. **security** - Security scanning and compliance
7. **performance** - Performance and load testing
8. **infrastructure** - Infrastructure-as-Code
9. **incident** - Incident response and troubleshooting
10. **database** - Database operations and optimization

---

## Core Agent Prompts

### 1. Test Agent

**File**: `test-agent.txt`

**Purpose**: Generate, execute, and analyze automated tests

**Capabilities**:
- Generate test cases from specifications
- Create unit, integration, and E2E tests
- Execute test suites with coverage
- Identify edge cases and gaps
- Provide test improvement recommendations

**Best For**:
- Generating test cases from API specs
- Creating test suites for new features
- Analyzing test coverage
- Suggesting test improvements

**Example Usage**:
```bash
rouge agent run test "Generate unit tests for auth module"
rouge agent run test "Create E2E tests for checkout flow"
rouge agent run test "Analyze test coverage and suggest improvements"
```

---

### 2. Deploy Agent

**File**: `deploy-agent.txt`

**Purpose**: Automate deployment workflows

**Capabilities**:
- Validate deployment configurations
- Execute deployment strategies (rolling, blue-green, canary)
- Perform health checks and smoke tests
- Rollback on failures
- Monitor deployment progress

**Best For**:
- Validating deployment configs
- Executing deployments to various environments
- Managing rollbacks
- Deployment health verification

**Example Usage**:
```bash
rouge agent run deploy "Deploy to staging environment"
rouge agent run deploy "Validate production deployment config"
rouge agent run deploy "Rollback last deployment"
```

---

### 3. Monitor Agent

**File**: `monitor-agent.txt`

**Purpose**: System monitoring and alerting

**Capabilities**:
- Monitor application and infrastructure metrics
- Analyze system logs for errors
- Detect performance degradation
- Generate alerts for critical issues
- Create monitoring dashboards

**Best For**:
- Setting up monitoring for new services
- Analyzing error patterns
- Creating alert configurations
- Performance tracking

**Example Usage**:
```bash
rouge agent run monitor "Monitor API response times"
rouge agent run monitor "Analyze error logs from last hour"
rouge agent run monitor "Set up alerts for high CPU usage"
```

---

### 4. Analyze Agent

**File**: `analyze-agent.txt`

**Purpose**: Log and error analysis

**Capabilities**:
- Parse and analyze logs
- Identify error patterns and correlations
- Root cause analysis
- Generate incident reports
- Suggest fixes and improvements

**Best For**:
- Troubleshooting production issues
- Analyzing error patterns
- Root cause analysis
- Incident postmortems

**Example Usage**:
```bash
rouge agent run analyze "Analyze application crash logs"
rouge agent run analyze "Find root cause of 500 errors"
rouge agent run analyze "Correlate errors across microservices"
```

---

## Specialized Agent Prompts

### 5. CI/CD Agent

**File**: `ci-cd-agent.txt`

**Purpose**: Continuous integration and delivery automation

**Capabilities**:
- Design CI/CD pipelines
- Configure GitHub Actions, GitLab CI, Jenkins
- Implement quality gates
- Optimize build times
- Set up deployment strategies

**Pipeline Stages**:
1. Source checkout
2. Dependencies
3. Linting
4. Unit tests
5. Integration tests
6. Security scan
7. Build artifacts
8. Deploy staging
9. Smoke tests
10. Deploy production

**Best For**:
- Creating new CI/CD pipelines
- Optimizing build performance
- Implementing quality gates
- Setting up automated deployments

**Example Usage**:
```bash
rouge agent run ci-cd "Create GitHub Actions workflow for Node.js app"
rouge agent run ci-cd "Optimize Jenkins pipeline for faster builds"
rouge agent run ci-cd "Implement canary deployment in CI/CD"
```

---

### 6. Security Agent

**File**: `security-agent.txt`

**Purpose**: Security scanning and compliance

**Capabilities**:
- Vulnerability scanning (SAST, DAST)
- Dependency vulnerability analysis
- Container security scanning
- Secret detection
- Compliance checking

**Severity Levels**:
- **Critical**: Immediate action required
- **High**: Address within 24 hours
- **Medium**: Address within 1 week
- **Low**: Address in next sprint
- **Info**: For awareness

**Best For**:
- Security audits
- Vulnerability scanning
- Compliance validation
- Secret detection

**Example Usage**:
```bash
rouge agent run security "Scan Docker image for vulnerabilities"
rouge agent run security "Audit Kubernetes cluster security"
rouge agent run security "Check for OWASP Top 10 vulnerabilities"
```

---

### 7. Performance Agent

**File**: `performance-agent.txt`

**Purpose**: Performance and load testing

**Capabilities**:
- Load and stress testing
- Performance benchmarking
- Latency analysis (p50, p95, p99)
- Resource utilization monitoring
- Capacity planning

**Testing Types**:
- **Load**: Normal expected load
- **Stress**: Beyond expected load
- **Spike**: Sudden load increases
- **Soak**: Extended duration
- **Scalability**: Performance vs load

**Best For**:
- Performance testing
- Identifying bottlenecks
- Capacity planning
- Performance regression detection

**Example Usage**:
```bash
rouge agent run performance "Load test API with 1000 concurrent users"
rouge agent run performance "Identify database bottlenecks"
rouge agent run performance "Benchmark after optimization"
```

---

### 8. Infrastructure Agent

**File**: `infrastructure-agent.txt`

**Purpose**: Infrastructure-as-Code management

**Capabilities**:
- Cloud infrastructure provisioning
- Terraform, CloudFormation, Pulumi
- Kubernetes manifests
- Docker container configuration
- Cost optimization

**Platforms**:
- AWS (EC2, ECS, Lambda, RDS, S3)
- Azure (VMs, AKS, Functions)
- GCP (Compute, GKE, Cloud Functions)
- Kubernetes (Deployments, Services)
- Docker (Containers, networking)

**Best For**:
- Infrastructure provisioning
- IaC code generation
- Architecture design
- Cost optimization

**Example Usage**:
```bash
rouge agent run infrastructure "Provision 3-tier app on AWS"
rouge agent run infrastructure "Create Kubernetes monitoring stack"
rouge agent run infrastructure "Optimize cloud costs"
```

---

### 9. Incident Agent

**File**: `incident-agent.txt`

**Purpose**: Incident response and troubleshooting

**Capabilities**:
- Incident triage
- Root cause analysis
- Log correlation
- Runbook execution
- Postmortem generation

**Severity Levels**:
- **SEV1**: Complete outage (immediate response)
- **SEV2**: Major impairment (30 min response)
- **SEV3**: Minor impairment (4 hour response)
- **SEV4**: Cosmetic (next business day)

**Best For**:
- Production incident response
- Root cause analysis
- Incident coordination
- Postmortem creation

**Example Usage**:
```bash
rouge agent run incident "Investigate 500 errors in production"
rouge agent run incident "Diagnose memory leak"
rouge agent run incident "Generate postmortem for outage"
```

---

### 10. Database Agent

**File**: `database-agent.txt`

**Purpose**: Database operations and optimization

**Capabilities**:
- Schema design and migrations
- Query optimization
- Backup and restore
- Replication setup
- Performance tuning

**Supported Databases**:
- PostgreSQL
- MySQL/MariaDB
- MongoDB
- Redis
- SQLite

**Best For**:
- Database migrations
- Query optimization
- Schema design
- Performance troubleshooting

**Example Usage**:
```bash
rouge agent run database "Create zero-downtime migration"
rouge agent run database "Optimize slow query"
rouge agent run database "Set up PostgreSQL replication"
```

---

## Prompt Structure

All prompts follow a consistent structure:

```
[Agent Title]

## Your Role
[Clear description of agent's purpose]

## Capabilities
[List of what the agent can do]

## Tools Available
[Tools the agent has access to]

## Guidelines
[Best practices and principles]

## [Domain-Specific Sections]
[Relevant information for the domain]

## Example Tasks
[Concrete examples of tasks]

[Closing principle or reminder]
```

---

## Using Agents

### Basic Usage

```bash
# List available agents
rouge agent list

# Run an agent
rouge agent run <type> "<task>"

# Stream output
rouge agent run <type> "<task>" --stream

# Test connectivity
rouge agent test
```

### Agent Selection Guide

**For Testing**:
- Creating tests → `test`
- Performance testing → `performance`
- Security testing → `security`

**For Deployment**:
- Application deployment → `deploy`
- Infrastructure provisioning → `infrastructure`
- CI/CD pipeline → `ci-cd`

**For Monitoring**:
- System monitoring → `monitor`
- Log analysis → `analyze`
- Incident response → `incident`

**For Databases**:
- Schema changes → `database`
- Query optimization → `database`

---

## Combining Agents

Agents can be used in sequence for complex workflows:

```bash
# 1. Security scan before deploy
rouge agent run security "Scan application for vulnerabilities"

# 2. Deploy to staging
rouge agent run deploy "Deploy to staging"

# 3. Run smoke tests
rouge agent run test "Execute smoke tests on staging"

# 4. Performance test
rouge agent run performance "Load test staging environment"

# 5. Deploy to production
rouge agent run deploy "Deploy to production"

# 6. Monitor deployment
rouge agent run monitor "Monitor production metrics"
```

---

## Customizing Prompts

### Modifying Existing Prompts

Edit files in `packages/rouge/src/agent/prompts/`:

```bash
vim packages/rouge/src/agent/prompts/test-agent.txt
```

### Creating New Prompts

1. Create new prompt file:
   ```
   packages/rouge/src/agent/prompts/custom-agent.txt
   ```

2. Follow the prompt structure

3. Update agent types in code

---

## Best Practices

### 1. Be Specific
```bash
# ❌ Too vague
rouge agent run test "test the API"

# ✅ Specific
rouge agent run test "Generate unit tests for /api/users endpoint with edge cases"
```

### 2. Provide Context
```bash
# ❌ Missing context
rouge agent run deploy "deploy"

# ✅ With context
rouge agent run deploy "Deploy version 1.2.3 to production using blue-green strategy"
```

### 3. Use the Right Agent
```bash
# ❌ Wrong agent
rouge agent run test "deploy to production"

# ✅ Right agent
rouge agent run deploy "deploy to production"
```

### 4. Chain for Workflows
```bash
# Security → Test → Deploy → Monitor
rouge agent run security "Scan for vulnerabilities"
rouge agent run test "Run integration tests"
rouge agent run deploy "Deploy to production"
rouge agent run monitor "Monitor for errors"
```

---

## Prompt Development Guidelines

### Writing Effective Prompts

1. **Clear Role Definition**: State what the agent does
2. **Specific Capabilities**: List concrete abilities
3. **Actionable Guidelines**: Provide best practices
4. **Domain Expertise**: Include domain knowledge
5. **Examples**: Show concrete use cases

### Testing Prompts

```bash
# Test with simple task
rouge agent run <type> "Simple task description"

# Test with complex task
rouge agent run <type> "Complex multi-step task with context"

# Test edge cases
rouge agent run <type> "Task with unusual requirements"
```

---

## Agent Prompt Matrix

| Agent | Testing | Deployment | Monitoring | Analysis | Infrastructure |
|-------|---------|------------|------------|----------|----------------|
| test | ✅ | ⚠️ | ⚠️ | ⚠️ | - |
| deploy | ⚠️ | ✅ | ⚠️ | - | ⚠️ |
| monitor | - | ⚠️ | ✅ | ✅ | ⚠️ |
| analyze | ⚠️ | - | ✅ | ✅ | - |
| ci-cd | ✅ | ✅ | ⚠️ | - | ⚠️ |
| security | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ |
| performance | ✅ | ⚠️ | ✅ | ✅ | - |
| infrastructure | - | ✅ | ⚠️ | - | ✅ |
| incident | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ |
| database | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ |

✅ Primary use case | ⚠️ Secondary use case | - Not applicable

---

## Troubleshooting

### Agent Not Responding
```bash
# Check Ollama connection
rouge agent test

# Check Ollama service
ollama serve

# Verify model is available
ollama list
```

### Unexpected Output
- Review agent prompt for clarity
- Be more specific in task description
- Try a different agent type

### Performance Issues
- Use streaming for long tasks
- Break complex tasks into steps
- Check Ollama model performance

---

*Complete Agent Prompt System*
*10 Specialized Agents for DevOps*
*Date: 2026-03-21*
