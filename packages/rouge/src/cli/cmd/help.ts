import { cmd } from "./cmd.js"
import { UI } from "../ui/index.js"

export const HelpCommand = cmd({
  command: "help [command]",
  describe: "show help for a command",
  builder: (yargs) =>
    yargs.positional("command", {
      describe: "command to get help for",
      type: "string",
    }),
  handler: (args) => {
    UI.nl()
    console.log(UI.logo())
    UI.nl()

    if (!args.command) {
      UI.header("Rouge - DevOps & Testing Automation")
      UI.nl()
      UI.info("Available commands:")
      UI.nl()

      UI.step("agent")
      UI.item("Manage and run automation agents")
      UI.nl()

      UI.step("serve")
      UI.item("Start the Rouge API server")
      UI.nl()

      UI.step("test")
      UI.item("Run tests")
      UI.nl()

      UI.step("workflow")
      UI.item("Manage workflows")
      UI.nl()

      UI.step("deploy")
      UI.item("Manage deployments")
      UI.nl()

      UI.step("config")
      UI.item("Manage configuration")
      UI.nl()

      UI.step("list")
      UI.item("List agents, skills, or abilities")
      UI.nl()

      UI.step("status")
      UI.item("Show Rouge status")
      UI.nl()

      UI.step("version")
      UI.item("Show version information")
      UI.nl()

      UI.divider()
      UI.nl()
      UI.info("For more help on a command: rouge help <command>")
      UI.info("For version info: rouge --version")
      UI.nl()
    } else {
      showCommandHelp(args.command)
    }
  },
})

function showCommandHelp(command: string) {
  UI.header(`Help: ${command}`)
  UI.nl()

  const helps: Record<string, { description: string; usage: string[]; examples: string[] }> = {
    agent: {
      description: "Manage and execute automation agents",
      usage: [
        "rouge agent list                    # List all agents",
        "rouge agent test                    # Test Ollama connectivity",
        "rouge agent run <type> <task>       # Run an agent",
        "rouge agent run <type> <task> --stream  # Stream output",
      ],
      examples: [
        'rouge agent run test "Generate unit tests"',
        'rouge agent run deploy "Deploy to staging"',
        'rouge agent run ci-cd "Create GitHub Actions workflow"',
      ],
    },
    serve: {
      description: "Start the Rouge API server",
      usage: [
        "rouge serve                         # Start on default port (3000)",
        "rouge serve --port 4000             # Start on custom port",
        "rouge serve --host 127.0.0.1        # Bind to specific host",
      ],
      examples: [
        "rouge serve",
        "rouge serve --port 3001",
      ],
    },
    test: {
      description: "Run tests",
      usage: [
        "rouge test                          # Run all tests",
        "rouge test [pattern]                # Run matching tests",
        "rouge test --coverage               # Run with coverage",
      ],
      examples: [
        "rouge test",
        "rouge test **/*.test.ts",
      ],
    },
    workflow: {
      description: "Manage workflows",
      usage: [
        "rouge workflow list                 # List workflows",
        "rouge workflow create <name>        # Create workflow",
        "rouge workflow run <id>             # Run workflow",
      ],
      examples: [
        "rouge workflow list",
        "rouge workflow create my-workflow",
      ],
    },
    list: {
      description: "List agents, skills, or abilities",
      usage: [
        "rouge list agents                   # List all agents",
        "rouge list skills                   # List all skills",
        "rouge list abilities                # List all abilities",
        "rouge list skills --category test   # Filter by category",
      ],
      examples: [
        "rouge list agents",
        "rouge list skills --category deployment",
      ],
    },
    status: {
      description: "Show Rouge system status",
      usage: ["rouge status                        # Show system status"],
      examples: ["rouge status"],
    },
  }

  const help = helps[command]
  if (help) {
    UI.info(help.description)
    UI.nl()

    UI.header("Usage")
    help.usage.forEach((line) => UI.item(line))
    UI.nl()

    UI.header("Examples")
    help.examples.forEach((line) => UI.item(line))
    UI.nl()
  } else {
    UI.warn(`No help available for command: ${command}`)
    UI.nl()
    UI.info("Available commands: agent, serve, test, workflow, deploy, config, list, status, version")
    UI.nl()
  }
}
