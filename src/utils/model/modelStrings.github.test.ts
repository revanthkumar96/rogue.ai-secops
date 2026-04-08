import { afterEach, expect, test } from 'bun:test'

import { resetModelStringsForTestingOnly } from '../../bootstrap/state.js'
import { parseUserSpecifiedModel } from './model.js'
import { getModelStrings } from './modelStrings.js'

const originalEnv = {
  NIRO_USE_GITHUB: process.env.NIRO_USE_GITHUB,
  NIRO_USE_OPENAI: process.env.NIRO_USE_OPENAI,
  NIRO_USE_GEMINI: process.env.NIRO_USE_GEMINI,
  NIRO_USE_BEDROCK: process.env.NIRO_USE_BEDROCK,
  NIRO_USE_VERTEX: process.env.NIRO_USE_VERTEX,
  CLAUDE_CODE_USE_FOUNDRY: process.env.CLAUDE_CODE_USE_FOUNDRY,
}

function clearProviderFlags(): void {
  delete process.env.NIRO_USE_GITHUB
  delete process.env.NIRO_USE_OPENAI
  delete process.env.NIRO_USE_GEMINI
  delete process.env.NIRO_USE_BEDROCK
  delete process.env.NIRO_USE_VERTEX
  delete process.env.CLAUDE_CODE_USE_FOUNDRY
}

afterEach(() => {
  process.env.NIRO_USE_GITHUB = originalEnv.NIRO_USE_GITHUB
  process.env.NIRO_USE_OPENAI = originalEnv.NIRO_USE_OPENAI
  process.env.NIRO_USE_GEMINI = originalEnv.NIRO_USE_GEMINI
  process.env.NIRO_USE_BEDROCK = originalEnv.NIRO_USE_BEDROCK
  process.env.NIRO_USE_VERTEX = originalEnv.NIRO_USE_VERTEX
  process.env.CLAUDE_CODE_USE_FOUNDRY = originalEnv.CLAUDE_CODE_USE_FOUNDRY
  resetModelStringsForTestingOnly()
})

test('GitHub provider model strings are concrete IDs', () => {
  clearProviderFlags()
  process.env.NIRO_USE_GITHUB = '1'

  const modelStrings = getModelStrings()

  for (const value of Object.values(modelStrings)) {
    expect(typeof value).toBe('string')
    expect(value.trim().length).toBeGreaterThan(0)
  }
})

test('GitHub provider model strings are safe to parse', () => {
  clearProviderFlags()
  process.env.NIRO_USE_GITHUB = '1'

  const modelStrings = getModelStrings()

  expect(() => parseUserSpecifiedModel(modelStrings.sonnet46 as any)).not.toThrow()
})
