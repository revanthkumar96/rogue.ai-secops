# Master Plan: Autonomous Deployment & Testing Engineer

## Overview
This document outlines the strategic roadmap for evolving NiRo.ai from a DevOps assistant into a fully autonomous **Deployment and Testing Engineer**. The objective is to enable the system to take small, ambiguous projects and "shape" them into production-ready repositories that satisfy high standards of security (SOC2), privacy (GDPR), and operational excellence.

## Core Philosophy
- **Autonomy over Assistance**: The system should proactively identify needs rather than waiting for user prompts.
- **Provider Agnostic**: Support for all major cloud providers and local-first infrastructure (Ollama, local k8s, etc.).
- **Security First**: SOC2 and GDPR compliance by default in all generated pipelines and infrastructure.
- **Project Shaping**: The ability to analyze ambiguous codebases and refactor them for production readiness.

## Evolution Roadmap

| Phase | Title | Status | CLI Command | Focus |
| :--- | :--- | :--- | :--- | :--- |
| [Phase 0](phases/phase_0.md) | **Project Diagnostics & Baseline** | DONE | `/diagnose` | Full audit, tech discovery, and security baseline. |
| [Phase 1](phases/phase_1.md) | **Autonomous Infrastructure (IaC)** | DONE | `/infra` | Dynamic environment provisioning and cloud-native setup. |
| [Phase 2](phases/phase_2.md) | **Intelligent Quality Gates** | DONE | `/quality` | Autonomous test strategy design and multi-layer verification. |
| [Phase 3](phases/phase_3.md) | **Production-Grade CI/CD** | TODO | `/pipeline` | Complex deployment patterns (Blue/Green, Canary) and compliance. |
| [Phase 4](phases/phase_4.md) | **Observability & Self-Healing** | TODO | `/observe` | AI-driven incident response and automated rollbacks. |
| [Phase 5](phases/phase_5.md) | **The Autonomous Engineer Persona** | TODO | `/engineer` | Full persona integration and end-to-end project ownership. |
| [Phase 6](phases/phase_6.md) | **Knowledge Management & Documentation Intelligence** | TODO | `/wiki` | Persistent knowledge accumulation and intelligent documentation. |

## Architecture

                          NiRo.ai — Autonomous Engineer
    =====================================================================

    Phase 0: /diagnose                Phase 1: /infra
    +------------------------+        +---------------------------+
    | DiscoveryEngine        |------->| IaCFactory                |
    |   Language, framework, |        |   Terraform HCL for      |
    |   deps, entry points   |        |   AWS / GCP / Azure       |
    +------------------------+        +---------------------------+
    | SecurityScanner        |------->| ComplianceGuard           |
    |   npm audit, gitleaks, |        |   GDPR region locking,    |
    |   pattern matching     |        |   SOC2 pre-deploy checks  |
    +------------------------+        +---------------------------+
    | PolicyAnalyzer         |        | EnvironmentManager        |
    |   SOC2/GDPR compliance |        |   TTL, lifecycle,         |
    |   15 checks, scoring   |        |   plan / apply / destroy  |
    +------------------------+        +---------------------------+
    | IntentGenerator        |        | SecretVault               |
    |   Project spec, ready- |        |   AES-256-GCM, audit log, |
    |   ness, recommendations|        |   cloud provider refs     |
    +------------------------+        +---------------------------+

    Phase 2: /quality
    +---------------------------+
    | TestArchitect             |
    |   Strategy design,        |
    |   framework detection,    |
    |   coverage estimation     |
    +---------------------------+
    | QualityGatekeeper         |
    |   Per-env policies,       |
    |   deploy readiness gate,  |
    |   vuln + secret checks    |
    +---------------------------+
    | SyntheticDataGenerator    |
    |   GDPR-safe test data,    |
    |   seeded RNG, SQL/JSON    |
    +---------------------------+

    Phase 6: /wiki
    +---------------------------+
    | WikiEngine               |
    |   Three-layer knowledge,  |
    |   persistent accumulation,  |
    |   cross-reference maintenance|
    +---------------------------+
    | KnowledgeIngestor        |
    |   Source processing,      |
    |   entity extraction,      |
    |   incremental updates     |
    +---------------------------+
    | WikiQueryEngine          |
    |   Intelligent search,      |
    |   synthesis with citations, |
    |   multi-format answers    |
    +---------------------------+

    Data Flow:
    .niro/PROJECT_INVENTORY.json ─> Phase 1, Phase 2, Phase 6
    .niro/SECURITY_REPORT.json   ─> Phase 2 QualityGatekeeper, Phase 6
    .niro/COMPLIANCE_REPORT.json ─> Phase 1 ComplianceGuard, Phase 6
    .niro/DRAFT_SPEC.md          ─> Human review, Phase 6
    infra/<env>/*.tf             ─> Terraform apply, Phase 6 documentation
    .niro/TEST_STRATEGY.json     ─> CI pipeline, Phase 6 knowledge
    .niro/QUALITY_GATE_REPORT.json -> Deploy/block decision, Phase 6
    .niro/wiki/                 ─> Persistent knowledge base
    .niro/WIKI_STATE.json      ─> Wiki state and statistics

## Component Registry

| Component | File | Phase | Purpose |
| :--- | :--- | :--- | :--- |
| DiscoveryEngine | `src/coordinator/DiscoveryEngine.ts` | 0 | Tech stack scanning |
| SecurityScanner | `src/tools/SecurityScanner.ts` | 0 | Vulnerability + secret detection |
| PolicyAnalyzer | `src/schemas/compliance.ts` | 0 | SOC2/GDPR compliance checks |
| IntentGenerator | `src/coordinator/IntentGenerator.ts` | 0 | Project spec generation |
| IaCFactory | `src/coordinator/IaCFactory.ts` | 1 | Terraform HCL generator |
| EnvironmentManager | `src/tools/InfrastructureManager.ts` | 1 | Environment lifecycle |
| SecretVault | `src/utils/SecretVault.ts` | 1 | Encrypted secret management |
| ComplianceGuard | `src/schemas/compliance.ts` | 1 | GDPR region + SOC2 gate |
| TestArchitect | `src/assistant/TestEngineer.ts` | 2 | Test strategy design |
| QualityGatekeeper | `src/tools/QualityGate.ts` | 2 | Deployment quality gates |
| SyntheticDataGenerator | `src/tools/SyntheticDataGenerator.ts` | 2 | GDPR-safe test data |
| WikiEngine | `src/coordinator/WikiEngine.ts` | 6 | Knowledge management coordinator |
| KnowledgeIngestor | `src/assistant/KnowledgeIngestor.ts` | 6 | Source processing and ingestion |
| WikiQueryEngine | `src/tools/WikiQueryEngine.ts` | 6 | Intelligent search and synthesis |
| WikiComplianceGuard | `src/schemas/wiki-compliance.ts` | 6 | Wiki compliance and security |

## CLI Commands

| Command | Phase | Description |
| :--- | :--- | :--- |
| `/diagnose [path]` | 0 | Full project audit: tech stack, security, compliance, spec |
| `/infra [aws\|gcp\|azure] [dev\|staging\|prod]` | 1 | Generate Terraform IaC with compliance validation |
| `/quality [dev\|staging\|prod]` | 2 | Test strategy, coverage analysis, quality gate check |
| `/wiki <subcommand>` | 6 | Knowledge management: ingest, query, lint, status, integrate |

## Compliance Standard (V1)
All phases are designed to uphold:
1. **SOC2**: Audit trails, least-privilege IAM, encrypted secrets, automated security scans, 80% coverage gates.
2. **GDPR**: Data masking in logs, PII detection in source/infra, localized data residency support, synthetic test data.

---
*Last Updated: April 2026*
