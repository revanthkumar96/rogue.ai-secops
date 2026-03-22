import { cmd } from "./cmd"
import { UI } from "../ui"
import { Agent } from "../../agent/agent.js"
import type { AgentType } from "@rouge/shared/types"

export const AgentCommand = cmd({
  command: "agent <action>",
  describe: "manage automation agents",
  builder: (yargs) =>
    yargs
      .command("list", "list available agents", {}, async () => {
        UI.info("Available agents:")
        const agents = Agent.listAgents()

        for (const agent of agents) {
          const capability = await Agent.getCapabilities(agent)
          UI.info(`  - ${capability.name}: ${capability.description}`)
        }
      })
      .command(
        "run <name> <task>",
        "run a specific agent",
        (yargs) =>
          yargs
            .positional("name", {
              describe: "agent name",
              type: "string",
              choices: [
                "test",
                "deploy",
                "monitor",
                "analyze",
                "ci-cd",
                "security",
                "performance",
                "infrastructure",
                "incident",
                "database",
              ],
            })
            .positional("task", {
              describe: "task description",
              type: "string",
            })
            .option("stream", {
              describe: "stream output",
              type: "boolean",
              default: false,
            }),
        async (args) => {
          UI.info(`Running ${args.name} agent...`)

          // Check connection first
          const connected = await Agent.testConnection()
          if (!connected) {
            UI.error("Ollama is not available. Please start Ollama first.")
            process.exit(1)
          }

          if (args.stream) {
            // Stream output
            for await (const chunk of Agent.executeStream({
              type: args.name as AgentType,
              task: args.task as string,
              stream: true,
            })) {
              process.stdout.write(chunk)
            }
            console.log()
          } else {
            // Execute and show result
            const result = await Agent.execute({
              type: args.name as AgentType,
              task: args.task as string,
              stream: false,
            })

            if (result.success) {
              UI.success("Agent completed successfully")
              console.log(result.output)
            } else {
              UI.error("Agent failed")
              console.error(result.output)
              process.exit(1)
            }
          }
        },
      )
      .command("test", "test agent connectivity", {}, async () => {
        UI.info("Testing Ollama connection...")
        const connected = await Agent.testConnection()

        if (connected) {
          UI.success("Ollama is available and ready")
        } else {
          UI.error("Ollama is not available")
          UI.info("Please start Ollama: ollama serve")
          process.exit(1)
        }
      })
      .demandCommand(1, "You must specify an agent action"),
  handler: () => {},
})
