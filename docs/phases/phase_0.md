# Phase 0: Project Diagnostics & Baseline (The Audit)

## Objective
Establish a deep understanding of the target project's current state, tech stack, and security posture. This phase transforms an "ambiguous" project into a well-defined specification for the Autonomous Engineer.

## Feature List & Satisfactions

### 1. Autonomous Tech Discovery
*   **Description**: Scans the repository to identify the primary language, framework, database, and API structures.
*   **Requirements**:
    *   Identify 95%+ of dependencies.
    *   Map architectural entry points (e.g., `main.go`, `index.js`).
*   **Component**: `DiscoveryEngine` (located in `src/coordinator/DiscoveryEngine.ts`).

### 2. Dependency & Vulnerability Audit
*   **Description**: Analyzes the dependency graph for known security vulnerabilities and outdated versions.
*   **Requirements**:
    *   Satisfy **SOC2** availability and security criteria by identifying unmaintained packages.
    *   Identify high/critical CVEs.
*   **Component**: `SecurityScanner` (located in `src/tools/SecurityScanner.ts`).

### 3. Compliance Gap Analysis (SOC2/GDPR)
*   **Description**: Performs an initial scan to find missing security headers, PII handling issues, or lack of audit logging.
*   **Requirements**:
    *   Detection of hardcoded secrets.
    *   Scanning for potential PII in database schemas or sample data (**GDPR**).
*   **Component**: `PolicyAnalyzer` (located in `src/schemas/compliance.ts`).

### 4. Project Intent & Spec Generation
*   **Description**: Infers project purpose from code and generates a standard specification.
*   **Requirements**:
    *   Generate a `DRAFT_SPEC.md` that identifies if the project is a CLI, Web App, or Service.
*   **Component**: `IntentGenerator` (located in `src/coordinator/IntentGenerator.ts`).

## Implementation Checklist

- [x] **Establish Discovery logic**:
    - [x] Implement `DiscoveryEngine.ts` to parse standard package manifests (package.json, requirements.txt, go.mod, Cargo.toml).
    - [x] Support for recursive file system mapping with depth limits and ignore patterns.
    - [x] Language detection via file extensions.
    - [x] Framework detection via dependency matching and config file presence.
    - [x] Database detection via dependency and environment variable scanning.
    - [x] Entry point detection and project type classification.
- [x] **Integrate Security Scanners**:
    - [x] Create `SecurityScanner.ts` with gitleaks integration for secret detection.
    - [x] Add support for `npm audit` output parsing.
    - [x] Add support for `pip-audit` and `govulncheck` output parsing.
    - [x] Custom regex-based secret pattern scanning (AWS keys, JWTs, connection strings, etc.).
    - [x] Risk score calculation with weighted severity scoring.
- [x] **Define Compliance Schemas**:
    - [x] Create `src/schemas/compliance.ts` with SOC2 validation rules (10 checks).
    - [x] Create GDPR validation rules (5 checks).
    - [x] PII field detection across source code.
    - [x] Compliance scoring with per-framework breakdown.
- [x] **Automated Spec Generation**:
    - [x] Architecture analysis (pattern detection, capability mapping).
    - [x] Readiness assessment with weighted factor scoring.
    - [x] Recommendation engine with priority-based sorting.
    - [x] Logic for writing `DRAFT_SPEC.md` to the `.niro/` folder.
- [x] **CLI Integration**:
    - [x] `/diagnose` command registered in commands.ts.
    - [x] Outputs PROJECT_INVENTORY.json, SECURITY_REPORT.json, COMPLIANCE_REPORT.json.
    - [x] Formatted summary output with risk and compliance labels.

## Success Criteria
- [x] Complete `PROJECT_INVENTORY.json` generated.
- [x] Compliance score (SOC2/GDPR) calculated.
- [x] Dependency graph captured in inventory.
- [x] DRAFT_SPEC.md with readiness assessment and recommendations.

## File Manifest

| File | Description |
| :--- | :--- |
| `src/coordinator/DiscoveryEngine.ts` | Tech stack discovery, dependency parsing, project classification |
| `src/tools/SecurityScanner.ts` | Vulnerability scanning and secret detection |
| `src/schemas/compliance.ts` | SOC2/GDPR compliance checks and PII scanning |
| `src/coordinator/IntentGenerator.ts` | Project spec generation and readiness assessment |
| `src/commands/diagnose/index.ts` | Command registration |
| `src/commands/diagnose/diagnose.ts` | CLI command implementation |

[Back to Plan](../plan.md)
