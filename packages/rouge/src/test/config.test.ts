import { describe, test, expect } from "bun:test"
import { Config, RougeConfig } from "../config/config"

describe("Config System", () => {
  test("should create default config", () => {
    const config = RougeConfig.parse({})
    expect(config.ollama.url).toBe("http://localhost:11434")
    expect(config.ollama.model).toBe("llama3.2:3b")
    expect(config.agents.default).toBe("test")
  })

  test("should validate ollama config", () => {
    const config = RougeConfig.parse({
      ollama: {
        url: "http://localhost:11434",
        model: "llama3.2:3b",
        timeout: 30000,
      },
    })
    expect(config.ollama.url).toBe("http://localhost:11434")
    expect(config.ollama.model).toBe("llama3.2:3b")
    expect(config.ollama.timeout).toBe(30000)
  })

  test("should validate agent config", () => {
    const config = RougeConfig.parse({
      agents: {
        default: "deploy",
        enabled: ["test", "deploy"],
        maxConcurrent: 3,
      },
    })
    expect(config.agents.default).toBe("deploy")
    expect(config.agents.enabled).toEqual(["test", "deploy"])
    expect(config.agents.maxConcurrent).toBe(3)
  })

  test("should validate workflow config", () => {
    const config = RougeConfig.parse({
      workflows: {
        parallel: false,
        timeout: 7200,
        retries: 5,
      },
    })
    expect(config.workflows.parallel).toBe(false)
    expect(config.workflows.timeout).toBe(7200)
    expect(config.workflows.retries).toBe(5)
  })

  test("should validate permission config", () => {
    const config = RougeConfig.parse({
      permissions: {
        deploy: "deny",
        test: "allow",
        bash: "ask",
      },
    })
    expect(config.permissions.deploy).toBe("deny")
    expect(config.permissions.test).toBe("allow")
    expect(config.permissions.bash).toBe("ask")
  })
})
