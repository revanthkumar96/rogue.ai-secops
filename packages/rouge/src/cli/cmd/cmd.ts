import type { Argv, CommandModule } from "yargs"

export function cmd<T>(config: CommandModule<{}, T>): CommandModule<{}, T> {
  return config
}

export type Command<T = {}> = CommandModule<{}, T>
