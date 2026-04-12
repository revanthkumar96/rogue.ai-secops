# Phase 2: Intelligent Quality Gates

## Objective
Transition from "running scripts" to "designing a testing strategy". The Engineer autonomously generates and executes a multi-layered testing suite to ensure the project meets production standards.

## Feature List & Satisfactions

### 1. Autonomous Test Strategy Architect
*   **Description**: Determines the optimal mix of Unit, Integration, and E2E tests based on project type.
*   **Requirements**:
    *   Minimum 80% code coverage for mission-critical paths (**SOC2**).
    *   Automatic framework detection and boilerplate generation.
*   **Component**: `TestArchitect` (located in `src/assistant/TestEngineer.ts`).

### 2. Policy-Based Quality Gates
*   **Description**: Blocks deployments if specific quality or compliance metrics are not met.
*   **Requirements**:
    *   No High/Critical vulnerabilities for production.
    *   Configurable per-environment policies (dev/staging/prod).
*   **Component**: `QualityGatekeeper` (located in `src/tools/QualityGate.ts`).

### 3. Synthetic Data Generator
*   **Description**: Creates realistic but non-PII data for integration tests.
*   **Requirements**:
    *   Compliance with **GDPR** Article 32 (Security of processing).
    *   Deterministic (seeded) output for reproducible tests.
*   **Component**: `SyntheticDataGenerator` (located in `src/tools/SyntheticDataGenerator.ts`).

## Implementation Checklist

- [x] **Test Strategy Architect**:
    - [x] Implement `TestEngineer.ts` with framework detection (jest, vitest, pytest, playwright, cypress, etc.).
    - [x] Auto-detect test layers (unit, integration, e2e, contract, performance).
    - [x] Generate framework recommendations based on primary language.
    - [x] Plan test layers with priority and coverage targets.
    - [x] Generate boilerplate configs (vitest.config.ts, example tests).
    - [x] Heuristic coverage estimation from test-to-source file ratio.
- [x] **Quality Gates**:
    - [x] Implement `QualityGate.ts` with per-environment policies.
    - [x] Coverage check against SOC2 80% target.
    - [x] Critical/High vulnerability limits (0 for prod).
    - [x] Secret detection gate (block on secrets in source).
    - [x] E2E test requirement gate (required for staging/prod).
    - [x] Contract test gate (required for prod).
    - [x] Unit test framework detection check.
    - [x] Deploy readiness verdict (canDeploy boolean).
- [x] **Synthetic Data**:
    - [x] Implement `SyntheticDataGenerator.ts` with seeded RNG.
    - [x] Generate profiles: name, email, phone, address, DOB, credit card.
    - [x] All data uses obviously fake domains/prefixes (test.niro.invalid, 0000-xxxx cards).
    - [x] SQL INSERT and JSON output formatters.
    - [x] Deterministic output for reproducible tests.
- [x] **CLI Integration**:
    - [x] `/quality` command registered in commands.ts.
    - [x] Reads Phase 0 inventory + security report from `.niro/`.
    - [x] Runs all 3 components in sequence.
    - [x] Outputs TEST_STRATEGY.json, QUALITY_GATE_REPORT.json, SYNTHETIC_TEST_DATA.json.

## Cross-Phase Connections

| From | To | Data Flow |
| :--- | :--- | :--- |
| Phase 0 `DiscoveryEngine` | Phase 2 `TestArchitect.designStrategy()` | `ProjectInventory` |
| Phase 0 `SecurityScanner` | Phase 2 `QualityGatekeeper.evaluate()` | `SecurityReport` |
| Phase 0 `/diagnose` output | Phase 2 `/quality` input | `.niro/PROJECT_INVENTORY.json`, `.niro/SECURITY_REPORT.json` |
| Phase 2 `TestArchitect` | Phase 2 `QualityGatekeeper` | `TestStrategy`, `CoverageReport` |
| Phase 1 `ComplianceGuard` | Phase 2 `QualityGatekeeper` | Shared SOC2 compliance criteria |

## Success Criteria
- [x] Test strategy designed per project type with framework detection.
- [x] Quality gates enforce coverage, vulnerability, and secret policies.
- [x] Synthetic data generated without any real PII.
- [x] Per-environment policies (dev tolerant, prod strict).

## File Manifest

| File | Description |
| :--- | :--- |
| `src/assistant/TestEngineer.ts` | Test strategy architect with framework detection |
| `src/tools/QualityGate.ts` | Policy-based deployment quality gates |
| `src/tools/SyntheticDataGenerator.ts` | GDPR-compliant synthetic test data |
| `src/commands/quality/index.ts` | Command registration |
| `src/commands/quality/quality.ts` | CLI command implementation |

[Back to Plan](../plan.md)
