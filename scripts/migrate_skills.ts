import fs from "fs/promises"
import path from "path"

const REF_SKILLS_DIR = "c:\\Users\\sudik\\OneDrive\\Desktop\\ROGUE\\rouge\\ref_skills"
const DEST_DIR = "c:\\Users\\sudik\\OneDrive\\Desktop\\ROGUE\\rouge\\packages\\rouge\\src\\skill\\definitions"

async function findSkills(dir: string, results: string[] = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await findSkills(fullPath, results)
    } else if (entry.name === "SKILL.md") {
      results.push(fullPath)
    }
  }
  return results
}

async function migrate() {
  const skills = await findSkills(REF_SKILLS_DIR)
  console.log(`Found ${skills.length} skills.`)

  for (const skillPath of skills) {
    const parts = skillPath.split(path.sep)
    // Try to find a unique name. Usually it's the parent directory of SKILL.md
    const folderName = parts[parts.length - 2]
    const pluginName = parts.find(p => p.includes("-worktree") || p.includes("-main") || p === "dotclaude-main") || ""
    
    let destName = folderName
    if (destName === "skills" || destName === "skill") {
        destName = parts[parts.length - 3]
    }
    
    const finalDest = path.join(DEST_DIR, `${destName}.md`)
    console.log(`Copying ${skillPath} to ${finalDest}`)
    await fs.copyFile(skillPath, finalDest)
  }
}

migrate().catch(console.error)
