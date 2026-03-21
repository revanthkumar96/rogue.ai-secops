import { cmd } from "./cmd"
import { UI } from "../ui"

export const TestCommand = cmd({
  command: "test [pattern]",
  describe: "run tests",
  builder: (yargs) =>
    yargs
      .positional("pattern", {
        describe: "test file pattern",
        type: "string",
        default: "**/*.test.ts",
      })
      .option("coverage", {
        describe: "collect coverage",
        type: "boolean",
        default: false,
      })
      .option("watch", {
        describe: "watch mode",
        type: "boolean",
        default: false,
      }),
  handler: async (args) => {
    UI.info(`Running tests: ${args.pattern}`)
    UI.warn("Test execution not yet implemented")
  },
})
