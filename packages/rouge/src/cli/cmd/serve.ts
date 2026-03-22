import { cmd } from "./cmd"
import { Server } from "../../server/server"
import { UI } from "../ui"

export const ServeCommand = cmd({
  command: "serve",
  describe: "start the Rouge API server",
  builder: (yargs) =>
    yargs
      .option("port", {
        describe: "port to listen on",
        type: "number",
        default: 3000,
      })
      .option("host", {
        describe: "host to bind to",
        type: "string",
        default: "127.0.0.1",
      }),
  handler: async (args) => {
    const server = Server.listen({
      port: args.port,
      hostname: args.host,
    })

    UI.success(`Server running on http://${server.hostname}:${server.port}`)

    // Keep running
    await new Promise(() => {})
  },
})
