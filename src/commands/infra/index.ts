import type { Command } from '../../commands.js'

const infra = {
  name: 'infra',
  description: 'Phase 1: Generate infrastructure-as-code from project diagnostics. Usage: /infra [aws|gcp|azure|local] [dev|staging|prod]',
  isEnabled: () => true,
  type: 'local',
  supportsNonInteractive: true,
  load: () => import('./infra.js'),
} satisfies Command

export default infra
