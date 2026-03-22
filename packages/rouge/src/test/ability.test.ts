import { describe, test, expect } from "bun:test"
import { Ability } from "../ability"

describe("Ability System", () => {
  test("should list all abilities", () => {
    const abilities = Ability.list()
    expect(abilities).toHaveLength(30)
  })

  test("should get ability by ID", () => {
    const ability = Ability.get("test-generation")
    expect(ability).toBeTruthy()
    expect(ability?.name).toBe("Test Generation")
    expect(ability?.agents).toContain("test")
  })

  test("should get abilities for agent", () => {
    const testAbilities = Ability.forAgent("test")
    expect(testAbilities.length).toBeGreaterThan(0)
    expect(testAbilities.every((a) => a.agents.includes("test"))).toBe(true)
  })

  test("should check if agent has ability", () => {
    const hasAbility = Ability.hasAbility("test", "test-generation")
    expect(hasAbility).toBe(true)

    const noAbility = Ability.hasAbility("test", "deployment-execution")
    expect(noAbility).toBe(false)
  })

  test("should get permissions for ability", () => {
    const perms = Ability.getPermissions("deployment-execution")
    expect(perms).toContain("read")
    expect(perms).toContain("write")
    expect(perms).toContain("execute")
    expect(perms).toContain("deploy")
  })

  test("all abilities should have required fields", () => {
    const abilities = Ability.list()
    for (const ability of abilities) {
      expect(ability.id).toBeTruthy()
      expect(ability.name).toBeTruthy()
      expect(ability.description).toBeTruthy()
      expect(Array.isArray(ability.agents)).toBe(true)
      expect(Array.isArray(ability.permissions)).toBe(true)
      expect(Array.isArray(ability.tools)).toBe(true)
      expect(Array.isArray(ability.skills)).toBe(true)
    }
  })
})
