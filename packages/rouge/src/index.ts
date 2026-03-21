import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { RunCommand } from "./cli/cmd/run"
import { ServeCommand } from "./cli/cmd/serve"
import { TestCommand } from "./cli/cmd/test"
import { WorkflowCommand } from "./cli/cmd/workflow"
import { ConfigCommand } from "./cli/cmd/config"
import { AgentCommand } from "./cli/cmd/agent"
import { VersionCommand } from "./cli/cmd/version"
import { StatusCommand } from "./cli/cmd/status"
import { ListCommand } from "./cli/cmd/list"
import { HelpCommand } from "./cli/cmd/help"
import { Log } from "./util/log"
import { Installation } from "./installation"
import { UI } from "./cli/ui"
import { Global } from "./global"
import { Database } from "./storage/db"
import path from "path"
import { Filesystem } from "./util/filesystem"

process.on("unhandledRejection", (e) => {
  Log.Default.error("rejection", {
    e: e instanceof Error ? e.message : e,
  })
})

process.on("uncaughtException", (e) => {
  Log.Default.error("exception", {
    e: e instanceof Error ? e.message : e,
  })
})

async function main() {
  // Initialize logging
  await Log.init({
    print: process.argv.includes("--print-logs"),
    dev: Installation.isLocal(),
    level: Installation.isLocal() ? "DEBUG" : "INFO",
  })

  Log.Default.info("rouge", {
    version: Installation.VERSION,
    args: process.argv.slice(2),
  })

  // Ensure data directory exists
  await Filesystem.ensureDir(Global.Path.data)

  const cli = yargs(hideBin(process.argv))
    .scriptName("rouge")
    .wrap(100)
    .help("help", "show help")
    .alias("help", "h")
    .version("version", "show version number", Installation.VERSION)
    .alias("version", "v")
    .option("print-logs", {
      describe: "print logs to stderr",
      type: "boolean",
    })
    .usage("\n" + UI.logo())
    .command(RunCommand)
    .command(ServeCommand)
    .command(TestCommand)
    .command(WorkflowCommand)
    .command(ConfigCommand)
    .command(AgentCommand)
    .command(VersionCommand)
    .command(StatusCommand)
    .command(ListCommand)
    .command(HelpCommand)
    .fail((msg, err) => {
      if (msg?.startsWith("Unknown argument")) {
        cli.showHelp("log")
      }
      if (err) throw err
      process.exit(1)
    })
    .strict()

  await cli.parse()
}

try {
  await main()
} catch (e) {
  Log.Default.error("fatal", {
    error: e instanceof Error ? e.message : String(e),
    stack: e instanceof Error ? e.stack : undefined,
  })
  UI.error(e instanceof Error ? e.message : String(e))
  process.exitCode = 1
} finally {
  process.exit()
}
