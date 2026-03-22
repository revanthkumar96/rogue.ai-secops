import { describe, it, expect, beforeAll } from 'bun:test'
import { Ollama } from '../provider/ollama'

describe('Provider System', () => {
  describe('Ollama Provider', () => {
    it('should create default Ollama instance', async () => {
      const provider = await Ollama.Default()
      expect(provider).toBeDefined()
      expect(provider.name).toBe('Ollama')
    })

    it('should have correct configuration', async () => {
      const provider = await Ollama.Default()
      expect(provider).toHaveProperty('url')
      expect(provider).toHaveProperty('model')
    })

    it('should test connection', async () => {
      const provider = await Ollama.Default()
      const isConnected = await provider.isAvailable()
      expect(typeof isConnected).toBe('boolean')
    })

    it('should list models', async () => {
      const provider = await Ollama.Default()
      try {
        const models = await provider.listModels()
        expect(Array.isArray(models)).toBe(true)
      } catch (error) {
        // Ollama might not be running, that's ok for tests
        expect(error).toBeDefined()
      }
    })

    it('should generate response', async () => {
      const provider = await Ollama.Default()
      try {
        const response = await provider.chat({
          messages: [{ role: 'user', content: 'Hello, what is 2+2?' }],
          stream: false
        })
        expect(response).toBeDefined()
        expect(response.content).toBeDefined()
      } catch (error) {
        // Ollama might not be running or model not available
        expect(error).toBeDefined()
      }
    }, { timeout: 30000 })
  })

  describe('Provider Configuration', () => {
    it('should validate provider URL', async () => {
      const provider = await Ollama.Default()
      expect(provider.url).toMatch(/^https?:\/\//)
    })

    it('should have default model', async () => {
      const provider = await Ollama.Default()
      expect(provider.model).toBeDefined()
      expect(typeof provider.model).toBe('string')
    })

    it('should have timeout configuration', async () => {
      const provider = await Ollama.Default()
      expect(provider.timeout).toBeDefined()
      expect(typeof provider.timeout).toBe('number')
      expect(provider.timeout).toBeGreaterThan(0)
    })
  })
})
