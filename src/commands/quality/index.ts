import type { Command } from '../../commands.js'

const quality = {
  name: 'quality',
  description: 'Phase 2: Run quality gates — test strategy, coverage analysis, security checks, and deployment readiness. Usage: /quality [dev|staging|prod]',
  isEnabled: () => true,
  type: 'local',
  supportsNonInteractive: true,
  load: () => import('./quality.js'),
} satisfies Command

export default quality
