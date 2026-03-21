import { cmd } from "./cmd"
import { Interactive } from "../interactive.js"

export const RunCommand = cmd({
  command: "$0",
  describe: "start Rouge in interactive mode",
  handler: async () => {
    await Interactive.start()
  },
})
