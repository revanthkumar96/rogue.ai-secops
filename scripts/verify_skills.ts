import { Skill } from "../packages/rouge/src/skill/index.js"

async function verify() {
  console.log("Verifying loaded skills...")
  
  const skills = Skill.list()
  console.log(`Total skills loaded: ${skills.length}`)
  
  if (skills.length === 0) {
    console.error("No skills were loaded!")
    process.exit(1)
  }

  // Check for specific migrated skills
  const expectedSkills = ["shadcn", "branch-orchestration", "github-orchestrator-ref"]
  for (const id of expectedSkills) {
    const skill = Skill.get(id)
    if (skill) {
      console.log(`[PASS] Found skill: ${id} (${skill.name})`)
    } else {
      // It might be named differently due to the migration script's logic
      const possibleMatch = skills.find(s => s.id.includes(id) || s.name.toLowerCase().includes(id))
      if (possibleMatch) {
          console.log(`[INFO] Found similar skill for ${id}: ${possibleMatch.id}`)
      } else {
          console.warn(`[WARN] Skill not found: ${id}`)
      }
    }
  }

  console.log("\nSample skills list:")
  skills.slice(0, 10).forEach(s => {
    console.log(`- ${s.id}: ${s.name} (${s.category})`)
  })

  console.log("\nVerification complete.")
}

verify().catch(console.error)
