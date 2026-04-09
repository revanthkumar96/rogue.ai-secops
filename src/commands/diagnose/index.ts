import type { Command } from '../../commands.js'

const diagnose = {
  name: 'diagnose',
  description: 'Run Phase 0 project diagnostics: tech discovery, security audit, compliance analysis, and spec generation',
  isEnabled: () => true,
  type: 'local',
  supportsNonInteractive: true,
  load: () => import('./diagnose.js'),
} satisfies Command

export default diagnose
