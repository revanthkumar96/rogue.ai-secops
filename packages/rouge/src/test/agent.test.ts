import { describe, test, expect } from "bun:test"
import { Agent } from "../agent/agent"

describe("Agent System", () => {
  test("should list all agents", () => {
    const agents = Agent.listAgents()
    expect(agents).toHaveLength(10)
    expect(agents).toContain("test")
    expect(agents).toContain("deploy")
    expect(agents).toContain("monitor")
    expect(agents).toContain("analyze")
    expect(agents).toContain("ci-cd")
    expect(agents).toContain("security")
    expect(agents).toContain("performance")
    expect(agents).toContain("infrastructure")
    expect(agents).toContain("incident")
    expect(agents).toContain("database")
  })

  test("should get agent capabilities", async () => {
    const capabilities = await Agent.getCapabilities("test")
    expect(capabilities.name).toBe("test")
    expect(capabilities.description).toContain("Test")
    expect(capabilities.tools).toContain("ReadLog")
    expect(capabilities.permissions).toContain("read")
  })

  test("should load agent prompts", async () => {
    const agents = Agent.listAgents()
    for (const agent of agents) {
      const capability = await Agent.getCapabilities(agent)
      expect(capability.prompt).toBeTruthy()
      expect(capability.prompt.length).toBeGreaterThan(0)
    }
  })
})
