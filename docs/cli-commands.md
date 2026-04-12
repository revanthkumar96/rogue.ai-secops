# CLI Commands Documentation - Phase 6 LLM Wiki Integration

## Overview

This document provides comprehensive documentation for all CLI commands introduced in Phase 6: Knowledge Management & Documentation Intelligence. These commands extend the existing NiRo.ai CLI with powerful wiki capabilities.

## Command Structure

### Base Command
```bash
niro wiki <subcommand> [options] [arguments]
```

### Global Options
```bash
--config <path>     # Path to wiki configuration file
--verbose           # Enable verbose logging
--quiet             # Suppress non-error output
--format <type>     # Output format: json, markdown, table
--help              # Show help for command
```

## Commands

### 1. wiki ingest

#### Purpose
Ingest new sources into the knowledge base, automatically extracting entities, concepts, and generating cross-references.

#### Syntax
```bash
niro wiki ingest [source] [options]
```

#### Arguments
- **source** (optional): Path to file or directory to ingest. Defaults to current directory.

#### Options
```bash
--type <type>        # Source type: document, code, log, meeting, article, paper
--category <cat>      # Force categorization: tech, business, security, compliance
--recursive          # Process directory recursively
--batch             # Batch process multiple files
--dry-run           # Show what would be ingested without processing
--force              # Force re-ingestion of already processed sources
```

#### Examples
```bash
# Ingest single document
niro wiki ingest ./docs/design-spec.md

# Ingest directory recursively
niro wiki ingest ./meeting-notes/ --recursive --type meeting

# Batch ingest with specific category
niro wiki ingest ./research/ --type paper --category tech --batch

# Dry run to preview changes
niro wiki ingest ./new-docs/ --dry-run --verbose
```

#### Output
```json
{
  "status": "success",
  "processed": {
    "files": 15,
    "pagesCreated": 23,
    "pagesUpdated": 5,
    "entitiesExtracted": 147,
    "conceptsIdentified": 38,
    "crossReferencesAdded": 89
  },
  "warnings": [
    "Large file detected (>10MB): performance may be impacted"
  ],
  "processingTime": "4.2s"
}
```

### 2. wiki query

#### Purpose
Query the accumulated knowledge base with intelligent synthesis and citation support.

#### Syntax
```bash
niro wiki query <question> [options]
```

#### Arguments
- **question** (required): Question or search query to ask the wiki.

#### Options
```bash
--format <type>       # Output format: markdown, table, slides, json
--max-results <num>   # Maximum number of results to consider (default: 10)
--include-related     # Include related pages in results
--confidence <min>    # Minimum confidence threshold (0-100)
--citations          # Show detailed citations
--interactive         # Interactive mode for follow-up questions
```

#### Examples
```bash
# Simple query
niro wiki query "What is our microservices architecture?"

# Query with specific format
niro wiki query "Security vulnerabilities found" --format table --citations

# Interactive query with confidence threshold
niro wiki query "How do we handle GDPR compliance?" --interactive --confidence 80

# Query with related pages
niro wiki query "Database migration strategy" --include-related --max-results 5
```

#### Output Examples

**Markdown Format:**
```markdown
# Database Migration Strategy

Based on the accumulated knowledge, our database migration approach follows these principles:

## Key Components
- **Incremental Migration**: Phase-based rollout to minimize downtime
- **Rollback Capability**: Automatic rollback on failure detection
- **Data Validation**: Comprehensive validation at each phase

## Implementation Details
[Detailed answer with citations]

## Related Pages
- Microservices Architecture
- Database Connection Pooling
- Migration Testing Strategy
```

**Table Format:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Question │ Answer │ Confidence │ Sources │ Last Updated │
├─────────────────────────────────────────────────────────────────────────┤
│ Architecture │ Microservices-based │ 95% │ 3 sources │ 2026-04-10 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. wiki lint

#### Purpose
Health-check the wiki for maintenance issues, contradictions, and improvement opportunities.

#### Syntax
```bash
niro wiki lint [options]
```

#### Options
```bash
--fix                # Automatically fix fixable issues
--check <type>       # Specific check type: all, contradictions, orphans, stale, references
--severity <level>   # Minimum severity to report: low, medium, high, critical
--output <file>      # Save report to file
--interactive         # Interactive mode for reviewing issues
```

#### Examples
```bash
# Full health check
niro wiki lint

# Check for contradictions only
niro wiki lint --check contradictions --severity high

# Auto-fix fixable issues
niro wiki lint --fix --interactive

# Save detailed report
niro wiki lint --output wiki-health-report.json --verbose
```

#### Output
```json
{
  "overallHealth": 87,
  "issues": [
    {
      "type": "contradiction",
      "severity": "medium",
      "message": "Database scaling approach differs between 'architecture.md' and 'scaling-guide.md'",
      "pages": ["architecture.md", "scaling-guide.md"],
      "recommendation": "Review and reconcile the two approaches"
    },
    {
      "type": "orphan",
      "severity": "low",
      "message": "Page 'old-api-docs.md' has no incoming references",
      "pages": ["old-api-docs.md"],
      "recommendation": "Add references or consider deletion"
    }
  ],
  "statistics": {
    "totalPages": 156,
    "orphanedPages": 3,
    "contradictions": 2,
    "stalePages": 8,
    "lastChecked": "2026-04-12T14:30:00Z"
  },
  "recommendations": [
    "Review 2 contradictions for consistency",
    "Update 8 stale pages with recent information",
    "Consider removing 3 orphaned pages"
  ]
}
```

### 4. wiki status

#### Purpose
Display comprehensive wiki statistics, health metrics, and integration status with other phases.

#### Syntax
```bash
niro wiki status [options]
```

#### Options
```bash
--detailed           # Show detailed statistics
--health             # Include health check results
--growth             # Show growth trends
--integrations        # Show integration status with other phases
--export <format>    # Export status data: json, csv
--watch              # Watch mode - update status every 30 seconds
```

#### Examples
```bash
# Basic status
niro wiki status

# Detailed status with health
niro wiki status --detailed --health

# Status with growth trends
niro wiki status --growth --integrations

# Export status data
niro wiki status --export json --output wiki-stats.json

# Watch mode for dashboard
niro wiki status --watch
```

#### Output
```json
{
  "wiki": {
    "totalPages": 156,
    "totalSources": 42,
    "totalEntities": 892,
    "totalConcepts": 234,
    "lastUpdated": "2026-04-12T14:25:00Z",
    "healthScore": 87,
    "sizeOnDisk": "2.3GB"
  },
  "growth": {
    "pagesAddedThisWeek": 12,
    "sourcesProcessedThisMonth": 8,
    "growthRate": "15% monthly",
    "projectedSize": "3.1GB (30 days)"
  },
  "integrations": {
    "phase0": {
      "status": "active",
      "lastSync": "2026-04-12T13:45:00Z",
      "itemsSynced": 23
    },
    "phase1": {
      "status": "active", 
      "lastSync": "2026-04-12T14:10:00Z",
      "itemsSynced": 18
    },
    "phase2": {
      "status": "active",
      "lastSync": "2026-04-12T14:20:00Z", 
      "itemsSynced": 31
    }
  },
  "health": {
    "overallScore": 87,
    "issues": {
      "critical": 0,
      "high": 1,
      "medium": 3,
      "low": 5
    },
    "lastHealthCheck": "2026-04-12T14:30:00Z"
  }
}
```

## Integration Commands

### wiki integrate

#### Purpose
Configure and manage integrations with other NiRo.ai phases.

#### Syntax
```bash
niro wiki integrate <phase> [options]
```

#### Arguments
- **phase**: Phase number (0, 1, 2, 3, 4, 5)

#### Options
```bash
--enable             # Enable integration with specified phase
--disable            # Disable integration
--auto-sync          # Enable automatic synchronization
--sync-interval <min> # Sync interval in minutes (default: 60)
--data-types <types>  # Data types to sync: all, inventory, security, compliance
```

#### Examples
```bash
# Enable Phase 0 integration
niro wiki integrate 0 --enable --auto-sync

# Configure specific data types for Phase 1
niro wiki integrate 1 --data-types inventory,compliance --sync-interval 30

# Disable Phase 3 integration
niro wiki integrate 3 --disable
```

## Configuration Commands

### wiki config

#### Purpose
Manage wiki configuration and schema settings.

#### Syntax
```bash
niro wiki config <action> [key] [value]
```

#### Actions
- **get**: Get configuration value
- **set**: Set configuration value
- **list**: List all configuration
- **reset**: Reset to defaults
- **validate**: Validate current configuration

#### Examples
```bash
# Get configuration value
niro wiki config get retention.days

# Set configuration value
niro wiki config set pii.detection true

# List all configuration
niro wiki config list

# Validate configuration
niro wiki config validate
```

## Advanced Commands

### wiki export

#### Purpose
Export wiki data in various formats for backup or migration.

#### Syntax
```bash
niro wiki export [format] [options]
```

#### Formats
- **json**: Full wiki export as JSON
- **markdown**: Export as markdown files
- **zip**: Compressed archive of entire wiki
- **pdf**: Generate PDF documentation

#### Options
```bash
--output <path>      # Output path for export
--include-sources    # Include raw sources in export
--password <pwd>      # Encrypt exported data
--metadata-only      # Export only metadata and index
```

### wiki import

#### Purpose
Import wiki data from backup or other systems.

#### Syntax
```bash
niro wiki import <source> [options]
```

#### Options
```bash
--format <type>      # Source format: json, zip, markdown
--merge              # Merge with existing wiki
--replace            # Replace existing wiki
--validate           # Validate imported data
```

## Error Handling

### Common Error Codes
- **WIKI_001**: Source file not found
- **WIKI_002**: Permission denied
- **WIKI_003**: Corrupted wiki data
- **WIKI_004**: Quota exceeded
- **WIKI_005**: Compliance violation
- **WIKI_006**: Index corrupted
- **WIKI_007**: LLM service unavailable

### Troubleshooting
```bash
# Enable debug logging
DEBUG=wiki:* niro wiki query "test question"

# Check wiki integrity
niro wiki lint --check all --fix

# Reset corrupted index
niro wiki config reset index

# Check permissions
niro wiki status --detailed
```

## Performance Tips

### Optimization
- Use **--batch** for multiple files
- Set appropriate **--max-results** to limit processing
- Enable **--auto-sync** for regular phase integration
- Use **--dry-run** to preview large operations

### Best Practices
- Run **wiki lint** regularly (weekly recommended)
- Monitor **wiki status --growth** for capacity planning
- Use **--format table** for quick data overview
- Enable **--citations** for research and verification

## Integration Examples

### Workflow with Phase 0
```bash
# 1. Run discovery (Phase 0)
niro diagnose

# 2. Auto-ingest results into wiki
niro wiki integrate 0 --enable --auto-sync

# 3. Query wiki about discovered architecture
niro wiki query "What technologies are used in this project?" --citations
```

### Workflow with Phase 1
```bash
# 1. Generate infrastructure (Phase 1)
niro infra aws production

# 2. Ingest infrastructure decisions
niro wiki ingest ./infra/ --type code --category infrastructure

# 3. Query infrastructure patterns
niro wiki query "What are our security groups for databases?" --format table
```

This comprehensive CLI documentation provides all the tools needed to manage the LLM Wiki integration effectively within the NiRo.ai ecosystem.
