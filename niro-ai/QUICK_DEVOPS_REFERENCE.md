# NiRo.ai Quick DevOps Reference 🌸

Quick copy-paste prompts for common DevOps tasks.

## CI/CD Pipelines 🔧

### GitHub Actions
```
"Generate GitHub Actions workflow with:
- Lint and format checks
- Unit and integration tests
- Security scanning (Snyk)
- Docker build and push to ECR
- Deploy to EKS staging on PR, production on main merge
- Slack notifications"
```

### GitLab CI
```
"Create GitLab CI pipeline with stages:
- build: compile and test
- security: SAST and dependency scanning
- deploy-staging: auto deploy to staging
- deploy-prod: manual approval for production"
```

### Jenkins Pipeline
```
"Generate Jenkinsfile for:
- Parallel test execution across 4 agents
- SonarQube code quality gate
- Docker build with layer caching
- Helm deployment to Kubernetes
- Automated rollback on deployment failure"
```

## Testing 🧪

### Unit Tests
```
"Generate unit tests for [function/class] covering:
- Happy path scenarios
- Edge cases and boundary conditions
- Error handling
- Mocking external dependencies
Target 90%+ code coverage"
```

### Integration Tests
```
"Create integration tests for [API endpoint]:
- Request validation
- Authentication and authorization
- Database interactions
- Error responses (400, 401, 403, 404, 500)
- Performance assertions (response time < 200ms)"
```

### E2E Tests
```
"Build Playwright E2E tests for [user flow]:
- Setup test data and user accounts
- Navigate through [step 1, 2, 3]
- Assert UI states and success messages
- Cleanup test data after execution
- Include failure scenario testing"
```

### Load Tests
```
"Generate k6 load test script:
- Ramp up to 1000 virtual users over 2 minutes
- Sustain load for 10 minutes
- Target endpoints: [list APIs]
- Assert p95 latency < 500ms, error rate < 1%"
```

## Infrastructure as Code 🏗️

### AWS with Terraform
```
"Generate Terraform for AWS:
- VPC with public/private subnets in 3 AZs
- RDS PostgreSQL multi-AZ with automated backups
- ECS Fargate cluster with application load balancer
- S3 bucket for static assets with CloudFront CDN
- CloudWatch alarms for CPU, memory, and disk
- All resources tagged for cost allocation"
```

### Kubernetes
```
"Create Kubernetes manifests for [app-name]:
- Deployment with 3 replicas, rolling update strategy
- Service (ClusterIP) and Ingress with TLS
- ConfigMap for environment variables
- Secret for database credentials
- HorizontalPodAutoscaler (50% CPU threshold)
- PodDisruptionBudget for high availability"
```

### Ansible
```
"Build Ansible playbook to:
- Install and configure Nginx with SSL (Let's Encrypt)
- Setup UFW firewall (allow 22, 80, 443)
- Install Node.js 20.x and PM2
- Deploy application from Git repository
- Setup logrotate for application logs
- Configure monitoring agent (Node Exporter)"
```

## Deployment 🚀

### Docker
```
"Create multi-stage Dockerfile for [language/framework]:
- Stage 1: Build with dependencies
- Stage 2: Production with minimal base image
- Non-root user
- Health check endpoint
- Optimized layer caching"
```

### Kubernetes Deployment Strategies
```
"Implement blue-green deployment for [app]:
- Two identical environments (blue and green)
- Route traffic using Service selector
- Automated smoke tests after deployment
- Quick rollback by switching Service selector
- Cleanup old environment after validation"
```

### Zero-Downtime Deployment
```
"Create deployment script with:
- Pre-deployment health check
- Rolling update (25% at a time)
- Post-deployment smoke tests
- Automated rollback if error rate > 1%
- Database migration handling
- Slack notifications at each stage"
```

## Monitoring & Alerts 🔍

### Prometheus Alerts
```
"Generate Prometheus alerting rules:
- HighMemoryUsage: memory > 85% for 5 minutes
- HighCPUUsage: CPU > 80% for 10 minutes
- DatabaseConnectionPoolExhausted: connections > 90%
- HighErrorRate: error rate > 5% for 5 minutes
- DiskSpaceLow: disk usage > 80%
- PodCrashLooping: container restarts > 3 in 10 minutes"
```

### Grafana Dashboards
```
"Create Grafana dashboard showing:
- Request rate (requests/sec)
- Error rate (%)
- Response time (p50, p95, p99)
- Database query latency
- Memory and CPU usage per pod
- Active connections
Time range: Last 6 hours, auto-refresh every 30s"
```

### Incident Runbook
```
"Generate runbook for [incident type]:
1. Detection: Alert triggers and symptoms
2. Investigation: Commands to run, logs to check
3. Mitigation: Immediate actions to reduce impact
4. Resolution: Steps to fix root cause
5. Prevention: Long-term improvements
Include rollback procedures and escalation contacts"
```

## Log Analysis 📊

### Error Investigation
```
"Analyze these logs and:
1. Identify all error messages and warnings
2. Extract timestamps and frequency
3. Find root cause based on stack traces
4. Suggest immediate fixes with code examples
5. Recommend preventive measures"
```

### Performance Analysis
```
"Parse these logs to identify:
- Slow queries (> 1 second)
- High memory allocations
- Bottlenecks in request flow
- Resource contention issues
Generate optimization recommendations"
```

## Security 🔒

### Security Scanning
```
"Add to CI/CD pipeline:
- SAST: SonarQube for code vulnerabilities
- Dependency scanning: Snyk for package vulnerabilities
- Container scanning: Trivy for Docker image vulnerabilities
- DAST: OWASP ZAP for runtime security testing
Fail build if critical or high severity issues found"
```

### IAM Policies
```
"Generate AWS IAM policy following least privilege:
- Service: [service name]
- Actions needed: [list actions]
- Resources: [specific ARNs]
- Conditions: [MFA, IP restrictions, etc.]
Include policy validation and testing steps"
```

## Performance Optimization ⚡

### Database Optimization
```
"Optimize this database query:
[paste query]

Provide:
- Execution plan analysis
- Required indexes
- Query rewrite suggestions
- Before/after performance comparison
- Impact on write operations"
```

### Application Performance
```
"Review this [language] code for performance:
[paste code]

Identify:
- N+1 queries
- Memory leaks
- Inefficient algorithms
- Missing caching opportunities
Provide optimized version with benchmarks"
```

## Quick Commands

### Start NiRo.ai
```bash
niro
```

### With specific provider
```bash
export NIRO_USE_OPENAI=1
export OPENAI_MODEL=gpt-4o
niro
```

### Check health
```bash
bun run doctor:runtime
```

### Run with profile
```bash
bun run dev:profile
```

## Themed Terminology

Use these terms for better context:

- **"Sprout"** → Create/Deploy
- **"Bloom"** → Successfully deploy
- **"Multiple hands"** → Run in parallel
- **"Archives"** → Logs/Documentation
- **"Knowledge check"** → Run tests
- **"Manifest"** → Apply infrastructure changes

## Example Multi-Step Workflow

```
🌸 "I need to deploy a Node.js API to production. Please:

1. Review the code for security vulnerabilities
2. Generate comprehensive tests (unit + integration)
3. Create a GitHub Actions CI/CD pipeline
4. Generate Terraform for AWS infrastructure (ECS + RDS + ALB)
5. Create Kubernetes manifests with autoscaling
6. Setup Prometheus alerts for errors and latency
7. Generate deployment runbook with rollback procedures

Use staging environment first, production on approval."
```

## Getting Help

- `/help` - List available commands
- `PLAYBOOK.md` - Detailed DevOps playbook
- `DEVOPS_FEATURES.md` - Full feature documentation
- `BRANDING.md` - Themed terminology guide

---

**Remember:** Like Nico Robin's Hana Hana no Mi, NiRo.ai can sprout multiple hands to work on your infrastructure in parallel! 🌸
