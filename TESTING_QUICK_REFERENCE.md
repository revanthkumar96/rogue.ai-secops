# Testing & CI/CD - Quick Reference

> One-page reference for running tests and using GitHub workflows

---

## Test Commands

### Local Testing

```bash
# Quick unit tests (no Ollama needed)
cd packages/rouge
bun run test:unit

# All tests
bun test

# Watch mode (TDD)
bun run test:watch

# Coverage report
bun run test:coverage

# Integration tests (requires Ollama)
bun run test:integration

# Specific test file
bun test src/test/agent.test.ts
```

### Prerequisites for Integration Tests

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve

# Pull test model
ollama pull llama3.2:1b
```

---

## Test Files

| File | What It Tests | Tests |
|------|---------------|-------|
| `agent.test.ts` | Agent system | ~15 |
| `skill.test.ts` | Skills system | ~20 |
| `ability.test.ts` | Abilities system | ~25 |
| `config.test.ts` | Configuration | ~15 |
| `provider.test.ts` | LLM providers | ~10 |
| `tool.test.ts` | Tool system | ~20 |
| `cli.test.ts` | CLI commands | ~25 |
| **Total** | **All systems** | **~130** |

---

## GitHub Workflows

### 1. Main CI/CD (`ci-typescript.yml`)

**Triggers**: Push to main/develop/devops, PRs
**Jobs**: 9
- Type check & lint
- Tests (Ubuntu, Windows, macOS)
- Integration tests
- Build packages
- CLI E2E tests
- Security scan
- Dependency audit

**Status**: ![CI](https://github.com/USERNAME/rouge/actions/workflows/ci-typescript.yml/badge.svg)

### 2. Web UI Tests (`test-web.yml`)

**Triggers**: Changes to `packages/web/**`
**Jobs**: 6
- Build
- Unit tests
- E2E tests (Playwright)
- Lighthouse performance
- Bundle analysis

### 3. Release (`release.yml`)

**Triggers**: Git tags `v*` or manual
**Jobs**: 8
- Create release
- Build CLI (Linux, macOS, Windows)
- Build Web UI
- Upload assets

---

## Running Workflows

### Trigger CI/CD
```bash
# Push to main
git push origin main

# Create PR
gh pr create
```

### Create Release
```bash
# Tag and push
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Or manual
gh workflow run release.yml -f version=1.0.0
```

### View Results
```bash
# List runs
gh run list

# View specific run
gh run view <run-id>

# Download artifacts
gh run download <run-id>
```

---

## Coverage

**Current**: ~85%
**Target**: > 80%

### View Coverage
```bash
# Generate report
bun run test:coverage

# Open in browser
open coverage/index.html
```

---

## Common Issues

### Tests Fail Locally
```bash
# Clean and reinstall
rm -rf node_modules
bun install
bun test
```

### Integration Tests Fail
```bash
# Start Ollama
ollama serve

# Check models
ollama list

# Pull model if missing
ollama pull llama3.2:1b
```

### Type Check Fails
```bash
# Run type check
bun run typecheck

# Fix errors in reported files
```

---

## Quick Links

- **Workflows**: `.github/workflows/`
- **Tests**: `packages/rouge/src/test/`
- **Docs**: `docs/GITHUB_WORKFLOWS.md`
- **Summary**: `docs/GITHUB_WORKFLOWS_SUMMARY.md`

---

## Test Structure

```typescript
import { describe, it, expect } from 'bun:test'

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = myFunction(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

---

## CI/CD Status

| Workflow | Status | Duration |
|----------|--------|----------|
| CI/CD | ✅ | ~10-15 min |
| Web Tests | ✅ | ~5-8 min |
| Release | 🔄 | ~20-25 min |

---

*Quick Reference Card*
*Keep This Handy!*
