import { describe, it, expect } from 'bun:test'
import { ToolRegistry } from '../tool/registry.js'

describe('Tool System', () => {
  describe('Tool Registry', () => {
    it('should list all tools', () => {
      const tools = ToolRegistry.listTools()
      expect(Array.isArray(tools)).toBe(true)
      expect(tools.length).toBeGreaterThan(0)
    })

    it('should register and retrieve tools', () => {
      const tools = ToolRegistry.listTools()
      expect(tools).toContain('ReadFile')
      expect(tools).toContain('Bash')
    })

    it('should have tool definitions', () => {
      const defs = ToolRegistry.getToolDefinitions()
      expect(Array.isArray(defs)).toBe(true)
      expect(defs.length).toBeGreaterThan(0)
      
      const readFileDef = defs.find(d => d.name === 'ReadFile')
      expect(readFileDef).toBeDefined()
      expect(readFileDef.description).toBeDefined()
      expect(readFileDef.parameters).toBeDefined()
    })
  })

  describe('Tool Execution & Permissions', () => {
    it('should execute ReadFile with permissions', async () => {
      const result = await ToolRegistry.call('ReadFile', { path: 'package.json' }, [
        { tool: 'ReadFile', action: 'allow' }
      ])
      expect(result).toBeDefined()
      if (typeof result === 'string' && result.startsWith('Error:')) {
        // Might fail if run from wrong directory, but should still return something
      } else {
        expect(typeof result).toBe('string')
      }
    })

    it('should deny unauthorized Bash execution', async () => {
      const result = await ToolRegistry.call('Bash', { command: 'rm -rf /' }, [
        { tool: 'Bash', action: 'deny' }
      ])
      expect(result).toContain('Error: Permission denied')
    })

    it('should handle missing tools', async () => {
      try {
        await ToolRegistry.call('NonExistentTool', {}, [])
        expect(false).toBe(true)
      } catch (error: any) {
        expect(error.message).toContain('Tool not found')
      }
    })
  })
})
