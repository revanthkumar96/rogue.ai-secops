import { describe, it, expect } from 'bun:test'
import { Tool } from '../tool/index'

describe('Tool System', () => {
  describe('Tool Registry', () => {
    it('should list all tools', () => {
      const tools = Tool.listTools()
      expect(Array.isArray(tools)).toBe(true)
      expect(tools.length).toBeGreaterThan(0)
    })

    it('should get tool by id', () => {
      const tools = Tool.listTools()
      if (tools.length > 0) {
        const tool = Tool.getTool(tools[0])
        expect(tool).toBeDefined()
        expect(tool.id).toBe(tools[0])
        expect(tool.name).toBeDefined()
        expect(tool.description).toBeDefined()
      }
    })

    it('should validate tool structure', () => {
      const tools = Tool.listTools()
      tools.forEach(toolId => {
        const tool = Tool.getTool(toolId)
        expect(tool).toHaveProperty('id')
        expect(tool).toHaveProperty('name')
        expect(tool).toHaveProperty('description')
        expect(tool).toHaveProperty('category')
        expect(tool).toHaveProperty('parameters')
      })
    })
  })

  describe('Tool Categories', () => {
    it('should have testing tools', () => {
      const tools = Tool.listTools()
      const testingTools = tools.filter(id => {
        const tool = Tool.getTool(id)
        return tool.category === 'testing'
      })
      expect(testingTools.length).toBeGreaterThan(0)
    })

    it('should have deployment tools', () => {
      const tools = Tool.listTools()
      const deployTools = tools.filter(id => {
        const tool = Tool.getTool(id)
        return tool.category === 'deployment'
      })
      expect(deployTools.length).toBeGreaterThan(0)
    })

    it('should have monitoring tools', () => {
      const tools = Tool.listTools()
      const monitorTools = tools.filter(id => {
        const tool = Tool.getTool(id)
        return tool.category === 'monitoring'
      })
      expect(monitorTools.length).toBeGreaterThan(0)
    })

    it('should have infrastructure tools', () => {
      const tools = Tool.listTools()
      const infraTools = tools.filter(id => {
        const tool = Tool.getTool(id)
        return tool.category === 'infrastructure'
      })
      expect(infraTools.length).toBeGreaterThan(0)
    })
  })

  describe('Tool Parameters', () => {
    it('should have valid parameter definitions', () => {
      const tools = Tool.listTools()
      tools.forEach(toolId => {
        const tool = Tool.getTool(toolId)
        expect(tool.parameters).toBeDefined()
        expect(typeof tool.parameters).toBe('object')

        Object.keys(tool.parameters).forEach(paramName => {
          const param = tool.parameters[paramName]
          expect(param).toHaveProperty('type')
          expect(param).toHaveProperty('required')
          expect(['string', 'number', 'boolean', 'array', 'object']).toContain(param.type)
        })
      })
    })

    it('should identify required parameters', () => {
      const tools = Tool.listTools()
      tools.forEach(toolId => {
        const tool = Tool.getTool(toolId)
        const requiredParams = Object.entries(tool.parameters)
          .filter(([_, param]) => param.required)

        expect(requiredParams).toBeDefined()
      })
    })
  })

  describe('Tool Execution', () => {
    it('should have execute method', () => {
      const tools = Tool.listTools()
      if (tools.length > 0) {
        const tool = Tool.getTool(tools[0])
        expect(tool).toHaveProperty('execute')
        expect(typeof tool.execute).toBe('function')
      }
    })

    it('should validate parameters before execution', async () => {
      // Test parameter validation
      const tools = Tool.listTools()
      if (tools.length > 0) {
        const tool = Tool.getTool(tools[0])
        const requiredParams = Object.entries(tool.parameters)
          .filter(([_, param]) => param.required)
          .map(([name, _]) => name)

        if (requiredParams.length > 0) {
          // Execution without required params should fail
          try {
            await tool.execute({})
            // Should not reach here if validation works
            expect(false).toBe(true)
          } catch (error) {
            // Expected error for missing parameters
            expect(error).toBeDefined()
          }
        }
      }
    })
  })

  describe('Tool Search and Filter', () => {
    it('should filter tools by category', () => {
      const allTools = Tool.listTools()
      const categories = new Set(allTools.map(id => Tool.getTool(id).category))

      categories.forEach(category => {
        const filtered = allTools.filter(id => Tool.getTool(id).category === category)
        expect(filtered.length).toBeGreaterThan(0)
        filtered.forEach(id => {
          expect(Tool.getTool(id).category).toBe(category)
        })
      })
    })

    it('should search tools by name', () => {
      const tools = Tool.listTools()
      const searchTerm = 'test'

      const results = tools.filter(id => {
        const tool = Tool.getTool(id)
        return tool.name.toLowerCase().includes(searchTerm)
      })

      results.forEach(id => {
        const tool = Tool.getTool(id)
        expect(tool.name.toLowerCase()).toContain(searchTerm)
      })
    })
  })
})
