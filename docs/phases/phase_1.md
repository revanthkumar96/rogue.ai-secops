# Phase 1: Autonomous Infrastructure (IaC)

## Objective
Enable the Engineer to provision and manage dynamic, production-ready infrastructure using a provider-agnostic approach. This phase focuses on "Infrastructure as Code" (IaC) that is secure and scalable.

## Feature List & Satisfactions

### 1. Multicloud Terraform Generator
*   **Description**: Dynamically generates Terraform HCL for major providers (AWS, GCP, Azure) or local backends.
*   **Requirements**:
    *   Support for S3/GCS state locking.
    *   Encryption of state files at rest (**SOC2**).
*   **Component**: `IaCFactory` (located in `src/coordinator/IaCFactory.ts`).

### 2. Ephemeral Environment Orchestrator
*   **Description**: Manages the lifecycle of temporary test/preview environments.
*   **Requirements**:
    *   Automatic TTL deployment (e.g., destroy after 24h).
    *   Isolation of database instances per environment.
*   **Component**: `EnvironmentManager` (located in `src/tools/InfrastructureManager.ts`).

### 3. Secret Management & Encryption
*   **Description**: Wraps sensitive data in secure envelopes before deployment.
*   **Requirements**:
    *   AES-256-GCM encryption for local secrets.
    *   Integration stubs for cloud secret managers.
    *   Ensuring secrets are never written to disk in plaintext (**SOC2/GDPR**).
*   **Component**: `SecretVault` (located in `src/utils/SecretVault.ts`).

### 4. Data Residency & GDPR Guardrails
*   **Description**: Prohibits creation of production resources in non-GDPR compliant regions for EU data.
*   **Requirements**:
    *   Region locking logic based on compliance policies.
    *   SOC2 pre-apply checks (state encryption, DB encryption, multi-AZ).
*   **Component**: `ComplianceGuard` (located in `src/schemas/compliance.ts`).

## Implementation Checklist

- [x] **Build IaC Core**:
    - [x] Implement `IaCFactory.ts` with Terraform HCL templates for VPC, DB, and K8s.
    - [x] Support AWS (EKS, RDS, VPC modules), GCP (GKE, Cloud SQL, VPC), Azure (AKS, PostgreSQL Flex, VNet).
    - [x] Auto-detect infrastructure needs from Phase 0 `ProjectInventory`.
    - [x] State backend config with S3/GCS/AzureRM + encryption + lock tables.
    - [x] Environment-specific sizing (dev/staging/prod instance classes).
- [x] **Lifecycle Management**:
    - [x] Implement `EnvironmentManager` for environment tracking and state persistence.
    - [x] TTL-based auto-expiry (24h dev, 72h staging, no TTL prod).
    - [x] Terraform plan/apply/destroy orchestration.
    - [x] Environment state stored in `.niro/environments/state.json`.
    - [x] Capture terraform outputs (non-sensitive only).
    - [x] Cleanup expired environments via `cleanupExpired()`.
- [x] **Security Hardening**:
    - [x] Implement `SecretVault` with AES-256-GCM encryption.
    - [x] scrypt key derivation from passphrase.
    - [x] Audit trail for all secret operations (create/read/update/delete).
    - [x] Generate terraform secret references per provider (AWS SM, GCP SM, Azure KV).
    - [x] Secrets never stored in plaintext on disk.
- [x] **Provider Abstraction**:
    - [x] `ClusterSpec` schema that maps to EKS, GKE, AKS, and local Kind.
    - [x] `DatabaseConfig` maps to RDS, Cloud SQL, Azure PostgreSQL Flex.
    - [x] `NetworkConfig` maps to VPC (AWS), VPC (GCP), VNet (Azure).
- [x] **Compliance Guard**:
    - [x] `ComplianceGuard` class with GDPR EU region validation.
    - [x] SOC2 state encryption check for production.
    - [x] SOC2 database encryption check for production.
    - [x] SOC2 multi-AZ HA warning for production databases.
    - [x] Pre-deploy validation gate in `/infra` command.
- [x] **CLI Integration**:
    - [x] `/infra` command registered in commands.ts.
    - [x] Reads Phase 0 `PROJECT_INVENTORY.json` from `.niro/` (runs discovery if missing).
    - [x] Accepts provider and tier arguments: `/infra aws prod`.
    - [x] Outputs terraform files to `infra/<environment>/`.
    - [x] Prints next-step terraform commands.

## Cross-Phase Connections

| From | To | Data Flow |
| :--- | :--- | :--- |
| Phase 0 `DiscoveryEngine` | Phase 1 `IaCFactory.configFromInventory()` | `ProjectInventory` JSON |
| Phase 0 `/diagnose` output | Phase 1 `/infra` input | `.niro/PROJECT_INVENTORY.json` file |
| Phase 0 `PolicyAnalyzer` | Phase 1 `ComplianceGuard` | Both in `src/schemas/compliance.ts` |
| Phase 1 `SecretVault` | Phase 1 `IaCFactory` | `secrets.tf` references |
| Phase 1 `IaCFactory` | Phase 1 `EnvironmentManager` | `GeneratedIaC` record |

## Success Criteria
- [x] Infrastructure can be generated with a single command (`/infra aws prod`).
- [x] Staging and Production environments are logically isolated (separate VPCs, separate state).
- [x] Secrets are never leaked in logs or source code (AES-256-GCM + audit trail).
- [x] GDPR region compliance enforced for production deployments.

## File Manifest

| File | Description |
| :--- | :--- |
| `src/coordinator/IaCFactory.ts` | Terraform HCL generator for AWS/GCP/Azure/local |
| `src/tools/InfrastructureManager.ts` | Environment lifecycle orchestrator |
| `src/utils/SecretVault.ts` | AES-256-GCM secret management with audit trail |
| `src/schemas/compliance.ts` | PolicyAnalyzer (Phase 0) + ComplianceGuard (Phase 1) |
| `src/commands/infra/index.ts` | Command registration |
| `src/commands/infra/infra.ts` | CLI command implementation |

[Back to Plan](../plan.md)
