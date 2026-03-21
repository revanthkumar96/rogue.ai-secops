# Rouge Prompt Examples

> Real-world examples of using Rouge agents for DevOps tasks

## Quick Start Examples

### Test Automation

```bash
# Generate unit tests
rouge agent run test "Generate unit tests for the authentication module covering login, logout, and token refresh"

# Create E2E tests
rouge agent run test "Create Playwright E2E tests for the checkout flow including cart, payment, and order confirmation"

# Analyze test coverage
rouge agent run test "Analyze current test coverage and suggest tests for uncovered critical paths"
```

### Deployment

```bash
# Validate configuration
rouge agent run deploy "Validate the Kubernetes deployment configuration for the production environment"

# Deploy with strategy
rouge agent run deploy "Deploy version 1.5.0 to production using blue-green deployment strategy"

# Rollback
rouge agent run deploy "Rollback production deployment to the previous stable version"
```

### Monitoring

```bash
# Setup monitoring
rouge agent run monitor "Set up monitoring for API response times with alerts for p95 > 500ms"

# Analyze errors
rouge agent run monitor "Analyze error logs from the last 24 hours and identify patterns"

# Create dashboard
rouge agent run monitor "Create a Grafana dashboard configuration for microservices monitoring"
```

---

## Complete Workflows

### 1. New Feature Deployment

```bash
# Step 1: Security scan
rouge agent run security "Scan the codebase for security vulnerabilities and secrets"

# Step 2: Generate tests
rouge agent run test "Generate integration tests for the new user profile feature"

# Step 3: CI/CD setup
rouge agent run ci-cd "Create GitHub Actions workflow with lint, test, security scan, and deploy stages"

# Step 4: Deploy to staging
rouge agent run deploy "Deploy to staging environment with health checks"

# Step 5: Performance test
rouge agent run performance "Run load test on staging with 100 concurrent users for 5 minutes"

# Step 6: Deploy to production
rouge agent run deploy "Deploy to production using canary strategy with 10% traffic"

# Step 7: Monitor
rouge agent run monitor "Monitor production deployment for errors and performance issues"
```

### 2. Infrastructure Provisioning

```bash
# Step 1: Design infrastructure
rouge agent run infrastructure "Design AWS infrastructure for 3-tier web application with auto-scaling"

# Step 2: Generate Terraform
rouge agent run infrastructure "Generate Terraform code for the infrastructure design"

# Step 3: Validate
rouge agent run infrastructure "Validate Terraform configuration and check for best practices"

# Step 4: Security audit
rouge agent run security "Audit infrastructure configuration for security issues"

# Step 5: Provision
rouge agent run infrastructure "Apply Terraform configuration to provision resources"

# Step 6: Setup monitoring
rouge agent run monitor "Configure CloudWatch alarms for the new infrastructure"
```

### 3. Incident Response

```bash
# Step 1: Assess incident
rouge agent run incident "Triage SEV1 incident: API returning 500 errors for 5 minutes"

# Step 2: Analyze logs
rouge agent run analyze "Analyze application logs to identify error patterns causing 500 responses"

# Step 3: Database check
rouge agent run database "Check database for connection pool exhaustion or slow queries"

# Step 4: Infrastructure check
rouge agent run infrastructure "Verify infrastructure resources are healthy and not overloaded"

# Step 5: Generate postmortem
rouge agent run incident "Generate blameless postmortem for the API outage incident"
```

### 4. Database Migration

```bash
# Step 1: Design migration
rouge agent run database "Design zero-downtime migration to add user_preferences table"

# Step 2: Generate migration
rouge agent run database "Generate SQL migration script with rollback plan"

# Step 3: Test on staging
rouge agent run database "Execute migration on staging database and verify"

# Step 4: Performance test
rouge agent run performance "Test query performance after migration"

# Step 5: Production migration
rouge agent run database "Execute production migration with monitoring"

# Step 6: Verify
rouge agent run database "Verify data integrity after migration"
```

---

## Agent-Specific Examples

### Test Agent

```bash
# API testing
rouge agent run test "Generate REST API tests for /api/users endpoint with authentication"

# Frontend testing
rouge agent run test "Create Jest tests for React components with RTL"

# Integration testing
rouge agent run test "Generate integration tests for payment processing flow"

# Test data
rouge agent run test "Create test data factory for user and order entities"

# Coverage analysis
rouge agent run test "Analyze test coverage and identify untested edge cases"
```

### Deploy Agent

```bash
# Kubernetes deployment
rouge agent run deploy "Deploy microservices to Kubernetes with rolling update strategy"

# Docker deployment
rouge agent run deploy "Deploy Docker Compose stack with health checks"

# Serverless deployment
rouge agent run deploy "Deploy Lambda functions with CloudFormation"

# Multi-region deployment
rouge agent run deploy "Deploy to multiple AWS regions with traffic routing"

# Deployment validation
rouge agent run deploy "Validate deployment health and run smoke tests"
```

### CI/CD Agent

```bash
# GitHub Actions
rouge agent run ci-cd "Create GitHub Actions workflow for Node.js with test, build, and deploy"

# GitLab CI
rouge agent run ci-cd "Generate .gitlab-ci.yml for Python application with stages"

# Jenkins pipeline
rouge agent run ci-cd "Create Jenkins pipeline for Java microservice"

# Optimization
rouge agent run ci-cd "Optimize CI/CD pipeline to reduce build time by 50%"

# Quality gates
rouge agent run ci-cd "Implement quality gates: 80% coverage, no critical vulnerabilities"
```

### Security Agent

```bash
# Container scanning
rouge agent run security "Scan Docker image for CVEs and misconfigurations"

# Dependency audit
rouge agent run security "Audit npm dependencies for known vulnerabilities"

# SAST
rouge agent run security "Run static analysis on codebase for security issues"

# Secret detection
rouge agent run security "Scan Git history for leaked credentials and API keys"

# Compliance check
rouge agent run security "Validate infrastructure against CIS AWS Foundations Benchmark"
```

### Performance Agent

```bash
# API load test
rouge agent run performance "Load test REST API with 1000 concurrent users ramping over 5 minutes"

# Stress test
rouge agent run performance "Stress test application to find breaking point"

# Spike test
rouge agent run performance "Test how system handles sudden 10x traffic spike"

# Endurance test
rouge agent run performance "Run soak test for 24 hours under normal load"

# Benchmark
rouge agent run performance "Benchmark API response time after caching implementation"
```

### Infrastructure Agent

```bash
# AWS provisioning
rouge agent run infrastructure "Provision ECS cluster with load balancer and auto-scaling"

# Kubernetes setup
rouge agent run infrastructure "Create GKE cluster with Istio service mesh"

# Multi-cloud
rouge agent run infrastructure "Design multi-cloud architecture with AWS primary and Azure DR"

# Cost optimization
rouge agent run infrastructure "Analyze infrastructure costs and suggest optimizations"

# Disaster recovery
rouge agent run infrastructure "Implement disaster recovery with RTO < 1 hour"
```

### Monitor Agent

```bash
# Application monitoring
rouge agent run monitor "Set up Prometheus metrics for Node.js application"

# Log aggregation
rouge agent run monitor "Configure ELK stack for centralized logging"

# APM setup
rouge agent run monitor "Implement distributed tracing with Jaeger"

# Alert configuration
rouge agent run monitor "Create PagerDuty alerts for critical errors"

# Dashboard
rouge agent run monitor "Build Grafana dashboard for microservices health"
```

### Analyze Agent

```bash
# Error analysis
rouge agent run analyze "Analyze production errors from last 7 days and categorize by root cause"

# Log correlation
rouge agent run analyze "Correlate logs across 5 microservices to trace request failure"

# Performance analysis
rouge agent run analyze "Analyze slow query logs and identify optimization opportunities"

# Anomaly detection
rouge agent run analyze "Detect anomalies in application behavior from metrics"

# Trend analysis
rouge agent run analyze "Identify trends in error rates over the last month"
```

### Incident Agent

```bash
# Incident triage
rouge agent run incident "Triage SEV2: 20% of API requests failing with timeout"

# Root cause
rouge agent run incident "Investigate root cause of memory leak in production"

# Runbook execution
rouge agent run incident "Execute runbook for database connection pool recovery"

# Communication
rouge agent run incident "Draft incident status update for stakeholders"

# Postmortem
rouge agent run incident "Create postmortem: Payment service outage on 2024-03-15"
```

### Database Agent

```bash
# Schema migration
rouge agent run database "Create migration to add email_verified column with default value"

# Query optimization
rouge agent run database "Optimize query: SELECT * FROM orders WHERE user_id = ? taking 2.5s"

# Index creation
rouge agent run database "Recommend indexes for common query patterns"

# Replication setup
rouge agent run database "Configure PostgreSQL streaming replication with 2 replicas"

# Backup strategy
rouge agent run database "Design backup strategy with daily full and hourly incremental"
```

---

## Advanced Patterns

### Using Context

```bash
# Provide file context
rouge agent run test "Generate tests for auth.ts" --context auth.ts

# Provide error context
rouge agent run analyze "Diagnose error" --context error.log

# Provide config context
rouge agent run deploy "Validate deployment" --context k8s-config.yaml
```

### Streaming Output

```bash
# Stream for long-running tasks
rouge agent run performance "Run 10-minute load test" --stream

# Stream incident response
rouge agent run incident "Investigate production issue" --stream

# Stream log analysis
rouge agent run analyze "Analyze 1GB log file" --stream
```

### Chaining Commands

```bash
# Chain with shell
rouge agent run security "Scan for secrets" && \
rouge agent run test "Run security tests" && \
rouge agent run deploy "Deploy if all pass"

# Conditional execution
rouge agent run test "Run tests" || rouge agent run analyze "Analyze test failures"

# Pipeline
rouge agent run infrastructure "Generate Terraform" | \
  rouge agent run security "Review config"
```

---

## Domain-Specific Examples

### Microservices

```bash
# Service deployment
rouge agent run deploy "Deploy 10 microservices with service mesh"

# Inter-service testing
rouge agent run test "Generate integration tests for microservice communication"

# Service monitoring
rouge agent run monitor "Set up distributed tracing for microservices"

# Service incident
rouge agent run incident "Diagnose cascading failures across microservices"
```

### Kubernetes

```bash
# Cluster setup
rouge agent run infrastructure "Provision production-ready Kubernetes cluster"

# Deployment
rouge agent run deploy "Deploy Helm chart with custom values"

# Monitoring
rouge agent run monitor "Configure Prometheus Operator for K8s monitoring"

# Troubleshooting
rouge agent run incident "Diagnose pod crashloopbackoff issue"
```

### Serverless

```bash
# Lambda deployment
rouge agent run deploy "Deploy Lambda functions with API Gateway"

# Performance
rouge agent run performance "Load test serverless API endpoints"

# Monitoring
rouge agent run monitor "Set up CloudWatch Logs Insights for Lambda"

# Cost optimization
rouge agent run infrastructure "Optimize Lambda memory allocation for cost"
```

### CI/CD

```bash
# Pipeline creation
rouge agent run ci-cd "Create complete CI/CD pipeline for monorepo"

# Pipeline optimization
rouge agent run ci-cd "Reduce pipeline execution time from 30 to 10 minutes"

# Quality gates
rouge agent run ci-cd "Add automated quality gates to pipeline"

# Multi-environment
rouge agent run ci-cd "Set up pipeline for dev, staging, production deployment"
```

---

## Tips and Tricks

### 1. Be Specific with Versions

```bash
# ❌ Vague
rouge agent run infrastructure "Create Kubernetes cluster"

# ✅ Specific
rouge agent run infrastructure "Create Kubernetes 1.28 cluster on GKE with 3 nodes"
```

### 2. Include Success Criteria

```bash
# ❌ No criteria
rouge agent run performance "Test the API"

# ✅ With criteria
rouge agent run performance "Load test API to handle 10k req/s with p99 < 100ms"
```

### 3. Provide Error Details

```bash
# ❌ Generic
rouge agent run analyze "Fix the error"

# ✅ Detailed
rouge agent run analyze "Fix error: ECONNREFUSED connecting to Redis at localhost:6379"
```

### 4. Specify Environment

```bash
# ❌ Ambiguous
rouge agent run deploy "Deploy the application"

# ✅ Clear environment
rouge agent run deploy "Deploy v1.2.3 to staging environment for testing"
```

### 5. Include Constraints

```bash
# ❌ No constraints
rouge agent run infrastructure "Provision servers"

# ✅ With constraints
rouge agent run infrastructure "Provision servers with budget < $500/month"
```

---

## Troubleshooting Examples

### Connection Issues

```bash
# Test Ollama
rouge agent test

# Check service
rouge agent run monitor "Check if Ollama service is running"

# Diagnose
rouge agent run incident "Diagnose connection refused to localhost:11434"
```

### Performance Issues

```bash
# Analyze slow requests
rouge agent run performance "Identify slow API endpoints from access logs"

# Database optimization
rouge agent run database "Find and optimize slow queries"

# Infrastructure check
rouge agent run infrastructure "Check for resource constraints causing slowness"
```

### Deployment Failures

```bash
# Analyze failure
rouge agent run analyze "Analyze deployment failure logs"

# Validate config
rouge agent run deploy "Validate deployment configuration"

# Rollback
rouge agent run deploy "Rollback to last working version"
```

---

*Comprehensive Prompt Examples*
*Real-world DevOps Scenarios*
*Date: 2026-03-21*
