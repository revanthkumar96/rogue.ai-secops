import { cmd } from "./cmd"
import { UI } from "../ui"

export const ConfigCommand = cmd({
  command: "config <action>",
  describe: "manage Rouge configuration",
  builder: (yargs) =>
    yargs
      .command("show", "show current configuration", {}, () => {
        UI.info("Current configuration:")
        UI.warn("Config management not yet implemented")
      })
      .command(
        "set <key> <value>",
        "set a configuration value",
        (yargs) =>
          yargs
            .positional("key", { type: "string" })
            .positional("value", { type: "string" }),
        (args) => {
          UI.info(`Setting ${args.key} = ${args.value}`)
          UI.warn("Config management not yet implemented")
        },
      )
      .demandCommand(1, "You must specify a config action"),
  handler: () => {},
})
