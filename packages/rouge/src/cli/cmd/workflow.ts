import { cmd } from "./cmd"
import { UI } from "../ui"

export const WorkflowCommand = cmd({
  command: "workflow <action>",
  describe: "manage automation workflows",
  builder: (yargs) =>
    yargs
      .command("list", "list all workflows", {}, () => {
        UI.info("Listing workflows...")
        UI.warn("Workflow management not yet implemented")
      })
      .command(
        "create <name>",
        "create a new workflow",
        (yargs) =>
          yargs.positional("name", {
            describe: "workflow name",
            type: "string",
          }),
        (args) => {
          UI.info(`Creating workflow: ${args.name}`)
          UI.warn("Workflow creation not yet implemented")
        },
      )
      .command(
        "run <id>",
        "execute a workflow",
        (yargs) =>
          yargs.positional("id", {
            describe: "workflow ID",
            type: "string",
          }),
        (args) => {
          UI.info(`Running workflow: ${args.id}`)
          UI.warn("Workflow execution not yet implemented")
        },
      )
      .demandCommand(1, "You must specify a workflow action"),
  handler: () => {},
})
