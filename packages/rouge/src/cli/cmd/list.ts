import { cmd } from "./cmd.js"
import { UI } from "../ui/index.js"
import { Agent } from "../../agent/agent.js"
import { Skill } from "../../skill/index.js"
import { Ability } from "../../ability/index.js"

export const ListCommand = cmd({
  command: "list <type>",
  describe: "list agents, skills, or abilities",
  builder: (yargs) =>
    yargs
      .positional("type", {
        describe: "what to list",
        type: "string",
        choices: ["agents", "skills", "abilities"],
        demandOption: true,
      })
      .option("category", {
        describe: "filter by category",
        type: "string",
      }),
  handler: async (args) => {
    if (args.type === "agents") {
      UI.header("Available Agents")
      UI.nl()

      const agents = Agent.listAgents()
      for (const agent of agents) {
        const capability = await Agent.getCapabilities(agent)
        UI.step(capability.name)
        UI.item(capability.description)
        UI.nl()
      }
    } else if (args.type === "skills") {
      UI.header("Available Skills")
      UI.nl()

      const skills = args.category
        ? Skill.byCategory(args.category)
        : Skill.list()

      for (const skill of skills) {
        UI.step(`${skill.id} - ${skill.name}`)
        UI.item(skill.description)
        UI.item(`Category: ${skill.category}`)
        UI.nl()
      }

      if (skills.length === 0) {
        UI.warn("No skills found")
      }
    } else if (args.type === "abilities") {
      UI.header("Available Abilities")
      UI.nl()

      const abilities = Ability.list()
      for (const ability of abilities) {
        UI.step(`${ability.id} - ${ability.name}`)
        UI.item(ability.description)
        UI.item(`Agents: ${ability.agents.join(", ")}`)
        UI.nl()
      }
    }
  },
})
