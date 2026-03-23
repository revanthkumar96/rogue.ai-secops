import fs from "fs/promises"
import path from "path"

const REF_SKILLS_DIR = "c:\\Users\\sudik\\OneDrive\\Desktop\\ROGUE\\rouge\\ref_skills"
const DEST_DIR = "c:\\Users\\sudik\\OneDrive\\Desktop\\ROGUE\\rouge\\packages\\rouge\\src\\agent\\persona"

async function findAgents(dir: string, results: string[] = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await findAgents(fullPath, results)
    } else if (entry.name.endsWith(".md") && (entry.name.includes("agent") || entry.name.includes("persona") || entry.name.includes("orchestrator") || entry.name.includes("developer") || entry.name.includes("researcher"))) {
        // Avoid files that are likely documentation
        if (!entry.name.includes("README") && !entry.name.includes("CLAUDE") && !entry.name.includes("LICENSE") && !entry.name.includes("CONTRIBUTING")) {
            results.push(fullPath)
        }
    }
  }
  return results
}

async function migrate() {
  const agents = await findAgents(REF_SKILLS_DIR)
  console.log(`Found ${agents.length} agents.`)

  for (const agentPath of agents) {
    const fileName = path.basename(agentPath)
    const finalDest = path.join(DEST_DIR, fileName)
    
    // Check if it already exists to avoid overwriting existing rouge agents if names clash
    try {
        await fs.access(finalDest)
        const newName = `${path.basename(agentPath, ".md")}-ref.md`
        await fs.copyFile(agentPath, path.join(DEST_DIR, newName))
        console.log(`Copying ${agentPath} to ${path.join(DEST_DIR, newName)} (Clash avoided)`)
    } catch {
        console.log(`Copying ${agentPath} to ${finalDest}`)
        await fs.copyFile(agentPath, finalDest)
    }
  }
}

migrate().catch(console.error)
