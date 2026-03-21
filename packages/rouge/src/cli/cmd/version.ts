import { cmd } from "./cmd.js"
import { UI } from "../ui/index.js"
import { Installation } from "../../installation/index.js"

export const VersionCommand = cmd({
  command: "version",
  describe: "show version information",
  handler: () => {
    UI.nl()
    console.log(UI.logo())
    UI.nl()
    UI.kv("Version", Installation.VERSION)
    UI.kv("Runtime", `Bun ${Bun.version}`)
    UI.kv("Platform", `${process.platform} ${process.arch}`)
    UI.nl()
  },
})
