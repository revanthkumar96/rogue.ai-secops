# NiRo.ai DevOps Automation Playbook 🌸

This playbook is a practical guide to run NiRo.ai for DevOps and testing operations with local or cloud LLM providers.

## 1. What You Have

- A DevOps automation CLI that handles CI/CD, testing, infrastructure management, and deployment operations.
- Multi-provider LLM support with profile management (`profile:init` and `dev:profile`).
- Runtime health checks (`doctor:runtime`) and diagnostic reporting (`doctor:report`).
- Parallel task execution inspired by Nico Robin's Hana Hana no Mi abilities.

## 2. Daily Start (Fast Path)

Run this in your project root:

```powershell
bun run dev:profile
```

For quick switches:

```powershell
# low latency preset
bun run dev:fast

# better coding quality preset
bun run dev:code
```

If everything is healthy, NiRo.ai starts directly.

## 3. One-Time Setup (If Needed)

### 3.1 Initialize a local profile

```powershell
bun run profile:init -- --provider ollama --model llama3.1:8b
```

Or let NiRo.ai recommend the best local model for your DevOps tasks:

```powershell
bun run profile:init -- --provider ollama --goal coding
```

Preview recommendations before saving:

```powershell
bun run profile:recommend -- --goal coding --benchmark
```

### 3.2 Confirm profile file

```powershell
Get-Content .\.niro-profile.json
```

### 3.3 Validate environment

```powershell
bun run doctor:runtime
```

## 4. Health and Diagnostics

### 4.1 Human-readable checks

```powershell
bun run doctor:runtime
```

### 4.2 JSON diagnostics (automation/logging)

```powershell
bun run doctor:runtime:json
```

### 4.3 Persist runtime report

```powershell
bun run doctor:report
```

Report output:

- `reports/doctor-runtime.json`

### 4.4 Hardening checks

```powershell
# practical checks (smoke + runtime doctor)
bun run hardening:check

# strict checks (includes typecheck)
bun run hardening:strict
```

## 5. Provider Modes

## 5.1 Local mode (Ollama)

```powershell
bun run profile:init -- --provider ollama --model llama3.1:8b
bun run dev:profile
```

Expected behavior:

- No API key required.
- `OPENAI_BASE_URL` should be `http://localhost:11434/v1`.

## 5.2 OpenAI mode

```powershell
bun run profile:init -- --provider openai --api-key sk-... --model gpt-4o
bun run dev:profile
```

Expected behavior:

- Real API key required.
- Placeholder values fail fast.

## 6. Troubleshooting Matrix

## 6.1 `Script not found "dev"`

Cause:

- You ran command in the wrong folder.

Fix:

```powershell
cd C:\path\to\niro
bun run dev:profile
```

## 6.2 `ollama: term not recognized`

Cause:

- Ollama not installed or PATH not loaded in this terminal.

Fix:

- Install Ollama from https://ollama.com/download/windows or `winget install Ollama.Ollama`.
- Open a new terminal and run:

```powershell
ollama --version
```

## 6.3 `Provider reachability failed` for localhost

Cause:

- Ollama service not running.

Fix:

```powershell
ollama serve
```

Then, in another terminal:

```powershell
bun run doctor:runtime
```

## 6.4 `Missing key for non-local provider URL`

Cause:

- `OPENAI_BASE_URL` points to remote endpoint without key.

Fix:

- Re-initialize profile for ollama:

```powershell
bun run profile:init -- --provider ollama --model llama3.1:8b
```

Or pick a local Ollama profile automatically by goal:

```powershell
bun run profile:init -- --provider ollama --goal balanced
```

## 6.5 Placeholder key (`SUA_CHAVE`) error

Cause:

- Placeholder was used instead of real key.

Fix:

- For OpenAI: use a real key.
- For Ollama: no key needed; keep localhost base URL.

## 7. Recommended Local Models

- Fast/general: `llama3.1:8b`
- Better coding quality (if hardware supports): `qwen2.5-coder:14b`
- Low-resource fallback: smaller instruct model

Switch model quickly:

```powershell
bun run profile:init -- --provider ollama --model qwen2.5-coder:14b
bun run dev:profile
```

Preset shortcuts already configured:

```powershell
bun run profile:fast   # llama3.2:3b
bun run profile:code   # qwen2.5-coder:7b
```

Goal-based local auto-selection:

```powershell
bun run profile:init -- --provider ollama --goal latency
bun run profile:init -- --provider ollama --goal balanced
bun run profile:init -- --provider ollama --goal coding
```

`profile:auto` is a best-available provider picker, not a local-only command. Use `--provider ollama` when you want to stay on a local model.

## 8. DevOps & Testing Prompts (Copy/Paste)

## 8.1 CI/CD Pipeline Generation

- "Generate a GitHub Actions workflow for testing and deploying a Node.js application to AWS ECS."
- "Create a GitLab CI pipeline with security scanning, testing, and multi-stage deployment."

## 8.2 Test Automation

- "Generate integration tests for this REST API using Jest and Supertest."
- "Create end-to-end tests for the user authentication flow using Playwright."
- "Analyze test coverage and suggest missing test cases for critical paths."

## 8.3 Infrastructure as Code

- "Generate Terraform configurations for a three-tier AWS architecture with RDS, ECS, and ALB."
- "Create Kubernetes manifests for deploying this microservice with auto-scaling and health checks."
- "Review this Ansible playbook for security issues and best practices."

## 8.4 Deployment Automation

- "Create a zero-downtime deployment script for this Docker application on Kubernetes."
- "Generate rollback procedures for the production deployment pipeline."

## 8.5 Log Analysis & Troubleshooting

- "Analyze these application logs and identify the root cause of the 500 errors."
- "Parse this error stack trace and suggest fixes with test cases."

## 8.6 Monitoring & Alerts

- "Generate Prometheus alerting rules for high memory usage and database connection failures."
- "Create a runbook for responding to production incidents based on these alerts."

## 9. Safe DevOps Practices

- Run `doctor:runtime` before debugging provider issues.
- Prefer `dev:profile` over manual env edits.
- Keep `.niro-profile.json` local (already gitignored).
- Use `doctor:report` for diagnostics and CI/CD troubleshooting.
- Always review generated infrastructure code before applying to production.
- Test deployment scripts in staging environments first.

## 10. Quick Recovery Checklist

When something breaks, run in order:

```powershell
bun run doctor:runtime
bun run doctor:report
bun run smoke
```

If answers are very slow, check processor mode:

```powershell
ollama ps
```

If `PROCESSOR` shows `CPU`, your setup is valid but latency will be higher for large models.

If local model mode is failing:

```powershell
ollama --version
ollama serve
bun run doctor:runtime
bun run dev:profile
```

## 11. Command Reference

```powershell
# profile
bun run profile:init -- --provider ollama --model llama3.1:8b
bun run profile:init -- --provider openai --api-key sk-... --model gpt-4o

# launch
bun run dev:profile
bun run dev:ollama
bun run dev:openai

# diagnostics
bun run doctor:runtime
bun run doctor:runtime:json
bun run doctor:report

# quality
bun run smoke
bun run hardening:check
bun run hardening:strict
```

## 12. Success Criteria

Your NiRo.ai setup is healthy when:

- `bun run doctor:runtime` passes provider and reachability checks.
- `bun run dev:profile` opens the CLI normally.
- Model shown in the UI matches your selected profile model.
- You can generate and execute DevOps automation tasks successfully.
