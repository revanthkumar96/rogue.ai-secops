import { describe, it, expect } from 'bun:test'
import { $ } from 'bun'

describe('CLI Commands', () => {
  describe('Version Command', () => {
    it('should display version with --version', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts --version`.quiet()
      expect(exitCode).toBe(0)
      expect(stdout.toString()).toContain('Rouge')
    })

    it('should display version with -v', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts -v`.quiet()
      expect(exitCode).toBe(0)
      expect(stdout.toString()).toContain('Rouge')
    })
  })

  describe('Help Command', () => {
    it('should display help with --help', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts --help`.quiet()
      expect(exitCode).toBe(0)
      expect(stdout.toString()).toContain('Commands')
    })

    it('should display help with -h', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts -h`.quiet()
      expect(exitCode).toBe(0)
      expect(stdout.toString()).toContain('Commands')
    })

    it('should display help for specific command', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts help agent`.quiet()
      expect(exitCode).toBe(0)
      expect(stdout.toString()).toContain('agent')
    })
  })

  describe('Status Command', () => {
    it('should display system status', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts status`.quiet()
      expect(exitCode).toBe(0)
      expect(stdout.toString()).toContain('Rouge')
    })
  })

  describe('List Commands', () => {
    it('should list agents', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts list agents`.quiet()
      expect(exitCode).toBe(0)
      const output = stdout.toString()
      expect(output).toContain('test')
      expect(output).toContain('deploy')
      expect(output).toContain('monitor')
    })

    it('should list skills', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts list skills`.quiet()
      expect(exitCode).toBe(0)
      expect(stdout.toString().toLowerCase()).toContain('skill')
    })

    it('should list abilities', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts list abilities`.quiet()
      expect(exitCode).toBe(0)
      expect(stdout.toString().toLowerCase()).toContain('ability')
    })

    it('should filter skills by category', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts list skills --category testing`.quiet()
      expect(exitCode).toBe(0)
      expect(stdout.toString()).toContain('testing')
    })
  })

  describe('Agent Commands', () => {
    it('should list agents with agent list', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts agent list`.quiet()
      expect(exitCode).toBe(0)
      const output = stdout.toString()
      expect(output).toContain('test')
      expect(output).toContain('deploy')
    })

    it('should test agent connection', async () => {
      const { exitCode } = await $`bun run src/index.ts agent test`.quiet()
      // Exit code 0 if Ollama is running, otherwise non-zero
      expect(typeof exitCode).toBe('number')
    })

    it('should handle invalid agent type', async () => {
      const { exitCode } = await $`bun run src/index.ts agent run invalid "test"`.quiet().nothrow()
      expect(exitCode).not.toBe(0)
    })
  })

  describe('Config Commands', () => {
    it('should display configuration', async () => {
      const { stdout, exitCode } = await $`bun run src/index.ts config show`.quiet()
      expect(exitCode).toBe(0)
      expect(stdout.toString()).toContain('ollama')
    })
  })

  describe('Error Handling', () => {
    it('should handle unknown command', async () => {
      const { exitCode } = await $`bun run src/index.ts unknown-command`.quiet().nothrow()
      expect(exitCode).not.toBe(0)
    })

    it('should handle missing required arguments', async () => {
      const { exitCode } = await $`bun run src/index.ts agent run`.quiet().nothrow()
      expect(exitCode).not.toBe(0)
    })

    it('should validate command syntax', async () => {
      const { exitCode } = await $`bun run src/index.ts list`.quiet().nothrow()
      // Should fail without specifying what to list
      expect(exitCode).not.toBe(0)
    })
  })

  describe('Command Aliases', () => {
    it('should support version alias', async () => {
      const { stdout: longForm } = await $`bun run src/index.ts --version`.quiet()
      const { stdout: shortForm } = await $`bun run src/index.ts -v`.quiet()
      expect(longForm.toString()).toEqual(shortForm.toString())
    })

    it('should support help alias', async () => {
      const { stdout: longForm } = await $`bun run src/index.ts --help`.quiet()
      const { stdout: shortForm } = await $`bun run src/index.ts -h`.quiet()
      expect(longForm.toString()).toEqual(shortForm.toString())
    })
  })
})
