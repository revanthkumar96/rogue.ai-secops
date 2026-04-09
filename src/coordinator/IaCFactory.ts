/**
 * IaCFactory — Phase 1: Multicloud Terraform Generator
 *
 * Generates production-ready Terraform HCL from a ProjectInventory (Phase 0).
 * Supports AWS, GCP, Azure, and local backends with:
 * - S3/GCS state locking
 * - Encrypted state at rest (SOC2)
 * - VPC, database, K8s cluster modules
 * - Provider-agnostic ClusterSpec abstraction
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { ProjectInventory } from './DiscoveryEngine.js'

// ---------- Types ----------

export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'local'

export type EnvironmentTier = 'development' | 'staging' | 'production'

export interface IaCConfig {
  provider: CloudProvider
  region: string
  environment: EnvironmentTier
  projectName: string
  stateBackend: StateBackendConfig
  networking: NetworkConfig
  database?: DatabaseConfig
  cluster?: ClusterSpec
  secrets: SecretConfig
  tags: Record<string, string>
}

export interface StateBackendConfig {
  type: 'local' | 's3' | 'gcs' | 'azurerm'
  bucket?: string
  key?: string
  region?: string
  encrypt: boolean
  lockTable?: string
}

export interface NetworkConfig {
  vpcCidr: string
  publicSubnets: string[]
  privateSubnets: string[]
  enableNat: boolean
  enableVpn: boolean
}

export interface DatabaseConfig {
  engine: 'postgresql' | 'mysql' | 'mongodb' | 'redis'
  version: string
  instanceClass: string
  storageGb: number
  multiAz: boolean
  encrypted: boolean
  backupRetentionDays: number
}

export interface ClusterSpec {
  type: 'eks' | 'gke' | 'aks' | 'kind'
  nodeCount: number
  nodeSize: string
  kubernetesVersion: string
  enableAutoscaling: boolean
  minNodes: number
  maxNodes: number
}

export interface SecretConfig {
  provider: 'aws-secrets-manager' | 'gcp-secret-manager' | 'azure-keyvault' | 'local-encrypted'
  kmsKeyId?: string
}

export interface GeneratedIaC {
  provider: CloudProvider
  environment: EnvironmentTier
  files: GeneratedFile[]
  config: IaCConfig
}

export interface GeneratedFile {
  path: string
  content: string
  description: string
}

// ---------- Region mappings ----------

const DEFAULT_REGIONS: Record<CloudProvider, string> = {
  aws: 'us-east-1',
  gcp: 'us-central1',
  azure: 'eastus',
  local: 'local',
}

const DB_ENGINE_VERSIONS: Record<string, Record<CloudProvider, string>> = {
  postgresql: { aws: '15.4', gcp: 'POSTGRES_15', azure: '15', local: '15' },
  mysql: { aws: '8.0', gcp: 'MYSQL_8_0', azure: '8.0', local: '8.0' },
  mongodb: { aws: '7.0', gcp: '7.0', azure: '7.0', local: '7.0' },
  redis: { aws: '7.0', gcp: 'REDIS_7_0', azure: '6', local: '7.0' },
}

const INSTANCE_SIZES: Record<EnvironmentTier, Record<CloudProvider, string>> = {
  development: { aws: 'db.t3.micro', gcp: 'db-f1-micro', azure: 'B_Standard_B1s', local: 'default' },
  staging: { aws: 'db.t3.small', gcp: 'db-g1-small', azure: 'GP_Standard_D2ds_v4', local: 'default' },
  production: { aws: 'db.r6g.large', gcp: 'db-custom-2-7680', azure: 'GP_Standard_D4ds_v4', local: 'default' },
}

// ---------- Factory ----------

export class IaCFactory {
  private rootDir: string

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }

  /**
   * Generate IaC config from a Phase 0 ProjectInventory.
   * Auto-detects database needs, cluster requirements, and sizing.
   */
  configFromInventory(
    inventory: ProjectInventory,
    provider: CloudProvider,
    environment: EnvironmentTier,
  ): IaCConfig {
    const projectName = this.sanitizeName(
      inventory.rootDir.split(/[/\\]/).pop() ?? 'project'
    )
    const region = DEFAULT_REGIONS[provider]

    const dbEngine = inventory.databases[0]?.type as DatabaseConfig['engine'] | undefined
    const database: DatabaseConfig | undefined = dbEngine
      ? {
          engine: dbEngine,
          version: DB_ENGINE_VERSIONS[dbEngine]?.[provider] ?? '15',
          instanceClass: INSTANCE_SIZES[environment][provider],
          storageGb: environment === 'production' ? 100 : 20,
          multiAz: environment === 'production',
          encrypted: true,
          backupRetentionDays: environment === 'production' ? 30 : 7,
        }
      : undefined

    const needsCluster = inventory.hasDocker
      || inventory.projectType === 'api-service'
      || inventory.projectType === 'web-app'

    const cluster: ClusterSpec | undefined = needsCluster
      ? {
          type: provider === 'aws' ? 'eks'
            : provider === 'gcp' ? 'gke'
            : provider === 'azure' ? 'aks'
            : 'kind',
          nodeCount: environment === 'production' ? 3 : 1,
          nodeSize: environment === 'production' ? 'large' : 'small',
          kubernetesVersion: '1.29',
          enableAutoscaling: environment === 'production',
          minNodes: environment === 'production' ? 2 : 1,
          maxNodes: environment === 'production' ? 10 : 3,
        }
      : undefined

    return {
      provider,
      region,
      environment,
      projectName,
      stateBackend: this.defaultStateBackend(provider, projectName, environment),
      networking: this.defaultNetworking(environment),
      database,
      cluster,
      secrets: this.defaultSecretConfig(provider),
      tags: {
        project: projectName,
        environment,
        managed_by: 'niro-ai',
        created_at: new Date().toISOString().split('T')[0]!,
      },
    }
  }

  /**
   * Generate Terraform files from a config.
   */
  generate(config: IaCConfig): GeneratedIaC {
    const files: GeneratedFile[] = []

    files.push({
      path: 'main.tf',
      content: this.renderMain(config),
      description: 'Provider configuration and Terraform settings',
    })

    files.push({
      path: 'variables.tf',
      content: this.renderVariables(config),
      description: 'Input variable declarations',
    })

    files.push({
      path: 'outputs.tf',
      content: this.renderOutputs(config),
      description: 'Output values',
    })

    files.push({
      path: 'backend.tf',
      content: this.renderBackend(config),
      description: 'State backend configuration',
    })

    if (config.networking) {
      files.push({
        path: 'networking.tf',
        content: this.renderNetworking(config),
        description: 'VPC and networking resources',
      })
    }

    if (config.database) {
      files.push({
        path: 'database.tf',
        content: this.renderDatabase(config),
        description: 'Database resources',
      })
    }

    if (config.cluster) {
      files.push({
        path: 'cluster.tf',
        content: this.renderCluster(config),
        description: 'Kubernetes cluster resources',
      })
    }

    files.push({
      path: `terraform.${config.environment}.tfvars`,
      content: this.renderTfvars(config),
      description: `Variable values for ${config.environment}`,
    })

    return {
      provider: config.provider,
      environment: config.environment,
      files,
      config,
    }
  }

  /**
   * Write generated files to disk under <rootDir>/infra/<environment>/
   */
  writeToDisk(generated: GeneratedIaC): string {
    const infraDir = join(this.rootDir, 'infra', generated.environment)
    if (!existsSync(infraDir)) {
      mkdirSync(infraDir, { recursive: true })
    }

    for (const file of generated.files) {
      writeFileSync(join(infraDir, file.path), file.content, 'utf-8')
    }

    return infraDir
  }

  // ---------- Defaults ----------

  private defaultStateBackend(
    provider: CloudProvider,
    projectName: string,
    environment: EnvironmentTier,
  ): StateBackendConfig {
    switch (provider) {
      case 'aws':
        return {
          type: 's3',
          bucket: `${projectName}-terraform-state`,
          key: `${environment}/terraform.tfstate`,
          region: 'us-east-1',
          encrypt: true,
          lockTable: `${projectName}-terraform-locks`,
        }
      case 'gcp':
        return {
          type: 'gcs',
          bucket: `${projectName}-terraform-state`,
          key: `${environment}/terraform.tfstate`,
          encrypt: true,
        }
      case 'azure':
        return {
          type: 'azurerm',
          bucket: `${projectName}tfstate`,
          key: `${environment}.tfstate`,
          encrypt: true,
        }
      default:
        return { type: 'local', encrypt: false }
    }
  }

  private defaultNetworking(environment: EnvironmentTier): NetworkConfig {
    const isProd = environment === 'production'
    return {
      vpcCidr: isProd ? '10.0.0.0/16' : '10.1.0.0/16',
      publicSubnets: isProd
        ? ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']
        : ['10.1.1.0/24'],
      privateSubnets: isProd
        ? ['10.0.10.0/24', '10.0.20.0/24', '10.0.30.0/24']
        : ['10.1.10.0/24'],
      enableNat: true,
      enableVpn: isProd,
    }
  }

  private defaultSecretConfig(provider: CloudProvider): SecretConfig {
    switch (provider) {
      case 'aws': return { provider: 'aws-secrets-manager' }
      case 'gcp': return { provider: 'gcp-secret-manager' }
      case 'azure': return { provider: 'azure-keyvault' }
      default: return { provider: 'local-encrypted' }
    }
  }

  // ---------- HCL Renderers ----------

  private renderMain(config: IaCConfig): string {
    const lines: string[] = []
    lines.push('# Auto-generated by NiRo.ai Phase 1 — IaCFactory')
    lines.push(`# Provider: ${config.provider} | Environment: ${config.environment}`)
    lines.push('')
    lines.push('terraform {')
    lines.push('  required_version = ">= 1.5.0"')
    lines.push('  required_providers {')

    switch (config.provider) {
      case 'aws':
        lines.push('    aws = {')
        lines.push('      source  = "hashicorp/aws"')
        lines.push('      version = "~> 5.0"')
        lines.push('    }')
        break
      case 'gcp':
        lines.push('    google = {')
        lines.push('      source  = "hashicorp/google"')
        lines.push('      version = "~> 5.0"')
        lines.push('    }')
        break
      case 'azure':
        lines.push('    azurerm = {')
        lines.push('      source  = "hashicorp/azurerm"')
        lines.push('      version = "~> 3.0"')
        lines.push('    }')
        break
    }

    lines.push('  }')
    lines.push('}')
    lines.push('')

    switch (config.provider) {
      case 'aws':
        lines.push('provider "aws" {')
        lines.push(`  region = var.region`)
        lines.push('')
        lines.push('  default_tags {')
        lines.push('    tags = var.tags')
        lines.push('  }')
        lines.push('}')
        break
      case 'gcp':
        lines.push('provider "google" {')
        lines.push('  project = var.project_id')
        lines.push('  region  = var.region')
        lines.push('}')
        break
      case 'azure':
        lines.push('provider "azurerm" {')
        lines.push('  features {}')
        lines.push('}')
        break
    }

    lines.push('')
    return lines.join('\n')
  }

  private renderBackend(config: IaCConfig): string {
    const sb = config.stateBackend
    const lines: string[] = []
    lines.push('# State backend — encrypted at rest (SOC2 CC6.1)')
    lines.push('')
    lines.push('terraform {')

    switch (sb.type) {
      case 's3':
        lines.push('  backend "s3" {')
        lines.push(`    bucket         = "${sb.bucket}"`)
        lines.push(`    key            = "${sb.key}"`)
        lines.push(`    region         = "${sb.region}"`)
        lines.push(`    encrypt        = ${sb.encrypt}`)
        if (sb.lockTable) {
          lines.push(`    dynamodb_table = "${sb.lockTable}"`)
        }
        lines.push('  }')
        break
      case 'gcs':
        lines.push('  backend "gcs" {')
        lines.push(`    bucket = "${sb.bucket}"`)
        lines.push(`    prefix = "${sb.key}"`)
        lines.push('  }')
        break
      case 'azurerm':
        lines.push('  backend "azurerm" {')
        lines.push(`    storage_account_name = "${sb.bucket}"`)
        lines.push(`    container_name       = "tfstate"`)
        lines.push(`    key                  = "${sb.key}"`)
        lines.push('  }')
        break
      default:
        lines.push('  # Local backend — not recommended for production')
        break
    }

    lines.push('}')
    lines.push('')
    return lines.join('\n')
  }

  private renderVariables(config: IaCConfig): string {
    const lines: string[] = []
    lines.push('variable "region" {')
    lines.push('  type        = string')
    lines.push(`  default     = "${config.region}"`)
    lines.push('  description = "Cloud provider region"')
    lines.push('}')
    lines.push('')
    lines.push('variable "environment" {')
    lines.push('  type        = string')
    lines.push(`  default     = "${config.environment}"`)
    lines.push('  description = "Deployment environment tier"')
    lines.push('}')
    lines.push('')
    lines.push('variable "project_name" {')
    lines.push('  type        = string')
    lines.push(`  default     = "${config.projectName}"`)
    lines.push('  description = "Project name used for resource naming"')
    lines.push('}')
    lines.push('')

    if (config.provider === 'gcp') {
      lines.push('variable "project_id" {')
      lines.push('  type        = string')
      lines.push('  description = "GCP project ID"')
      lines.push('}')
      lines.push('')
    }

    lines.push('variable "tags" {')
    lines.push('  type        = map(string)')
    lines.push('  default     = {')
    for (const [k, v] of Object.entries(config.tags)) {
      lines.push(`    ${k} = "${v}"`)
    }
    lines.push('  }')
    lines.push('  description = "Resource tags"')
    lines.push('}')
    lines.push('')
    return lines.join('\n')
  }

  private renderOutputs(config: IaCConfig): string {
    const lines: string[] = []
    lines.push('output "environment" {')
    lines.push('  value       = var.environment')
    lines.push('  description = "Current environment tier"')
    lines.push('}')
    lines.push('')

    if (config.cluster) {
      lines.push('output "cluster_endpoint" {')
      lines.push('  value       = module.cluster.endpoint')
      lines.push('  description = "Kubernetes cluster API endpoint"')
      lines.push('  sensitive   = true')
      lines.push('}')
      lines.push('')
    }

    if (config.database) {
      lines.push('output "database_endpoint" {')
      lines.push('  value       = module.database.endpoint')
      lines.push('  description = "Database connection endpoint"')
      lines.push('  sensitive   = true')
      lines.push('}')
      lines.push('')
    }

    return lines.join('\n')
  }

  private renderNetworking(config: IaCConfig): string {
    const net = config.networking
    const lines: string[] = []

    if (config.provider === 'aws') {
      lines.push('# VPC and networking — isolated network boundary (SOC2 CC6.6)')
      lines.push('')
      lines.push('module "vpc" {')
      lines.push('  source  = "terraform-aws-modules/vpc/aws"')
      lines.push('  version = "~> 5.0"')
      lines.push('')
      lines.push(`  name = "\${var.project_name}-\${var.environment}-vpc"`)
      lines.push(`  cidr = "${net.vpcCidr}"`)
      lines.push('')
      lines.push(`  azs             = ["\${var.region}a", "\${var.region}b", "\${var.region}c"]`)
      lines.push(`  public_subnets  = ${JSON.stringify(net.publicSubnets)}`)
      lines.push(`  private_subnets = ${JSON.stringify(net.privateSubnets)}`)
      lines.push('')
      lines.push(`  enable_nat_gateway   = ${net.enableNat}`)
      lines.push(`  single_nat_gateway   = ${config.environment !== 'production'}`)
      lines.push(`  enable_vpn_gateway   = ${net.enableVpn}`)
      lines.push(`  enable_dns_hostnames = true`)
      lines.push(`  enable_dns_support   = true`)
      lines.push('')
      lines.push('  tags = var.tags')
      lines.push('}')
    } else if (config.provider === 'gcp') {
      lines.push('resource "google_compute_network" "vpc" {')
      lines.push(`  name                    = "\${var.project_name}-\${var.environment}-vpc"`)
      lines.push('  auto_create_subnetworks = false')
      lines.push('}')
      lines.push('')
      lines.push('resource "google_compute_subnetwork" "private" {')
      lines.push(`  name          = "\${var.project_name}-\${var.environment}-private"`)
      lines.push(`  ip_cidr_range = "${net.privateSubnets[0]}"`)
      lines.push('  network       = google_compute_network.vpc.id')
      lines.push('  region        = var.region')
      lines.push('}')
    } else if (config.provider === 'azure') {
      lines.push('resource "azurerm_resource_group" "main" {')
      lines.push(`  name     = "\${var.project_name}-\${var.environment}-rg"`)
      lines.push('  location = var.region')
      lines.push('  tags     = var.tags')
      lines.push('}')
      lines.push('')
      lines.push('resource "azurerm_virtual_network" "main" {')
      lines.push(`  name                = "\${var.project_name}-\${var.environment}-vnet"`)
      lines.push(`  address_space       = ["${net.vpcCidr}"]`)
      lines.push('  location            = azurerm_resource_group.main.location')
      lines.push('  resource_group_name = azurerm_resource_group.main.name')
      lines.push('  tags                = var.tags')
      lines.push('}')
    }

    lines.push('')
    return lines.join('\n')
  }

  private renderDatabase(config: IaCConfig): string {
    const db = config.database!
    const lines: string[] = []

    lines.push('# Database — encrypted at rest, automated backups (SOC2 CC6.1, CC7.1)')
    lines.push('')

    if (config.provider === 'aws') {
      lines.push('module "database" {')
      lines.push('  source  = "terraform-aws-modules/rds/aws"')
      lines.push('  version = "~> 6.0"')
      lines.push('')
      lines.push(`  identifier = "\${var.project_name}-\${var.environment}-db"`)
      lines.push(`  engine         = "${db.engine === 'postgresql' ? 'postgres' : db.engine}"`)
      lines.push(`  engine_version = "${db.version}"`)
      lines.push(`  instance_class = "${db.instanceClass}"`)
      lines.push(`  allocated_storage = ${db.storageGb}`)
      lines.push('')
      lines.push(`  multi_az            = ${db.multiAz}`)
      lines.push(`  storage_encrypted   = ${db.encrypted}`)
      lines.push(`  deletion_protection = ${config.environment === 'production'}`)
      lines.push(`  backup_retention_period = ${db.backupRetentionDays}`)
      lines.push('')
      lines.push('  db_subnet_group_name   = module.vpc.database_subnet_group_name')
      lines.push('  vpc_security_group_ids = [module.vpc.default_security_group_id]')
      lines.push('')
      lines.push('  # Credentials stored in Secrets Manager (SOC2)')
      lines.push('  manage_master_user_password = true')
      lines.push('')
      lines.push('  tags = var.tags')
      lines.push('}')
    } else if (config.provider === 'gcp') {
      lines.push('resource "google_sql_database_instance" "main" {')
      lines.push(`  name             = "\${var.project_name}-\${var.environment}-db"`)
      lines.push(`  database_version = "${db.version}"`)
      lines.push('  region           = var.region')
      lines.push('')
      lines.push('  settings {')
      lines.push(`    tier = "${db.instanceClass}"`)
      lines.push('    ip_configuration {')
      lines.push('      ipv4_enabled    = false')
      lines.push('      private_network = google_compute_network.vpc.id')
      lines.push('    }')
      lines.push('    backup_configuration {')
      lines.push('      enabled = true')
      lines.push(`      backup_retention_settings {`)
      lines.push(`        retained_backups = ${db.backupRetentionDays}`)
      lines.push(`      }`)
      lines.push('    }')
      lines.push('  }')
      lines.push('')
      lines.push(`  deletion_protection = ${config.environment === 'production'}`)
      lines.push('}')
    } else if (config.provider === 'azure') {
      lines.push('resource "azurerm_postgresql_flexible_server" "main" {')
      lines.push(`  name                = "\${var.project_name}-\${var.environment}-db"`)
      lines.push('  resource_group_name = azurerm_resource_group.main.name')
      lines.push('  location            = azurerm_resource_group.main.location')
      lines.push(`  sku_name            = "${db.instanceClass}"`)
      lines.push(`  storage_mb          = ${db.storageGb * 1024}`)
      lines.push(`  version             = "${db.version}"`)
      lines.push('  tags                = var.tags')
      lines.push('}')
    }

    lines.push('')
    return lines.join('\n')
  }

  private renderCluster(config: IaCConfig): string {
    const cl = config.cluster!
    const lines: string[] = []

    lines.push('# Kubernetes cluster — isolated workload boundary (SOC2 CC6.3)')
    lines.push('')

    if (config.provider === 'aws') {
      lines.push('module "cluster" {')
      lines.push('  source  = "terraform-aws-modules/eks/aws"')
      lines.push('  version = "~> 20.0"')
      lines.push('')
      lines.push(`  cluster_name    = "\${var.project_name}-\${var.environment}"`)
      lines.push(`  cluster_version = "${cl.kubernetesVersion}"`)
      lines.push('')
      lines.push('  vpc_id     = module.vpc.vpc_id')
      lines.push('  subnet_ids = module.vpc.private_subnets')
      lines.push('')
      lines.push('  eks_managed_node_groups = {')
      lines.push('    default = {')
      lines.push(`      desired_size = ${cl.nodeCount}`)
      lines.push(`      min_size     = ${cl.minNodes}`)
      lines.push(`      max_size     = ${cl.maxNodes}`)
      lines.push(`      instance_types = ["${cl.nodeSize === 'large' ? 't3.large' : 't3.medium'}"]`)
      lines.push('    }')
      lines.push('  }')
      lines.push('')
      lines.push('  # Encrypt secrets at rest (SOC2)')
      lines.push('  cluster_encryption_config = {')
      lines.push('    resources = ["secrets"]')
      lines.push('  }')
      lines.push('')
      lines.push('  tags = var.tags')
      lines.push('}')
    } else if (config.provider === 'gcp') {
      lines.push('resource "google_container_cluster" "primary" {')
      lines.push(`  name     = "\${var.project_name}-\${var.environment}"`)
      lines.push('  location = var.region')
      lines.push('')
      lines.push('  network    = google_compute_network.vpc.name')
      lines.push('  subnetwork = google_compute_subnetwork.private.name')
      lines.push('')
      lines.push('  initial_node_count       = 1')
      lines.push('  remove_default_node_pool = true')
      lines.push('}')
      lines.push('')
      lines.push('resource "google_container_node_pool" "primary" {')
      lines.push(`  name       = "\${var.project_name}-\${var.environment}-pool"`)
      lines.push('  cluster    = google_container_cluster.primary.name')
      lines.push('  location   = var.region')
      lines.push(`  node_count = ${cl.nodeCount}`)
      lines.push('')
      if (cl.enableAutoscaling) {
        lines.push('  autoscaling {')
        lines.push(`    min_node_count = ${cl.minNodes}`)
        lines.push(`    max_node_count = ${cl.maxNodes}`)
        lines.push('  }')
        lines.push('')
      }
      lines.push('  node_config {')
      lines.push(`    machine_type = "${cl.nodeSize === 'large' ? 'e2-standard-4' : 'e2-medium'}"`)
      lines.push('  }')
      lines.push('}')
    } else if (config.provider === 'azure') {
      lines.push('resource "azurerm_kubernetes_cluster" "main" {')
      lines.push(`  name                = "\${var.project_name}-\${var.environment}"`)
      lines.push('  location            = azurerm_resource_group.main.location')
      lines.push('  resource_group_name = azurerm_resource_group.main.name')
      lines.push('  dns_prefix          = "${var.project_name}-${var.environment}"')
      lines.push(`  kubernetes_version  = "${cl.kubernetesVersion}"`)
      lines.push('')
      lines.push('  default_node_pool {')
      lines.push('    name       = "default"')
      lines.push(`    node_count = ${cl.nodeCount}`)
      lines.push(`    vm_size    = "${cl.nodeSize === 'large' ? 'Standard_D4s_v3' : 'Standard_D2s_v3'}"`)
      if (cl.enableAutoscaling) {
        lines.push('    enable_auto_scaling = true')
        lines.push(`    min_count           = ${cl.minNodes}`)
        lines.push(`    max_count           = ${cl.maxNodes}`)
      }
      lines.push('  }')
      lines.push('')
      lines.push('  identity {')
      lines.push('    type = "SystemAssigned"')
      lines.push('  }')
      lines.push('')
      lines.push('  tags = var.tags')
      lines.push('}')
    }

    lines.push('')
    return lines.join('\n')
  }

  private renderTfvars(config: IaCConfig): string {
    const lines: string[] = []
    lines.push(`region       = "${config.region}"`)
    lines.push(`environment  = "${config.environment}"`)
    lines.push(`project_name = "${config.projectName}"`)
    lines.push('')
    return lines.join('\n')
  }

  // ---------- Helpers ----------

  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)
  }
}
