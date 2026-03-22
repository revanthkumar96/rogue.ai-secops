import { cmd } from "./cmd"
import { UI } from "../ui"

export const ConfigCommand = cmd({
  command: "config <action>",
  describe: "manage Rouge configuration",
  builder: (yargs) =>
    yargs
      .command("show", "show current configuration", {}, async () => {
        const { Config } = await import("../../config/config.js")
        const config = await Config.load()
        UI.info("Current configuration:")
        console.log(JSON.stringify(config, null, 2))
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
