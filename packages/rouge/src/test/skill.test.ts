import { describe, test, expect } from "bun:test"
import { Skill } from "../skill"

describe("Skill System", () => {
  test("should list all skills", () => {
    const skills = Skill.list()
    expect(skills.length).toBeGreaterThan(0)
  })

  test("should get skill by ID", () => {
    const skill = Skill.get("test:generate")
    expect(skill).toBeTruthy()
    expect(skill?.name).toBe("Generate Tests")
    expect(skill?.category).toBe("testing")
  })

  test("should filter skills by category", () => {
    const testSkills = Skill.byCategory("testing")
    expect(testSkills.length).toBeGreaterThan(0)
    expect(testSkills.every((s) => s.category === "testing")).toBe(true)
  })

  test("should search skills", () => {
    const results = Skill.search("deploy")
    expect(results.length).toBeGreaterThan(0)
  })

  test("all skills should have required fields", () => {
    const skills = Skill.list()
    for (const skill of skills) {
      expect(skill.id).toBeTruthy()
      expect(skill.name).toBeTruthy()
      expect(skill.description).toBeTruthy()
      expect(skill.category).toBeTruthy()
      expect(Array.isArray(skill.inputs)).toBe(true)
      expect(Array.isArray(skill.outputs)).toBe(true)
      expect(Array.isArray(skill.examples)).toBe(true)
    }
  })
})
