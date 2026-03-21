import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import path from "path"
import { Global } from "../global"
import { Log } from "../util/log"

const log = Log.create({ service: "db" })

export namespace DB {
  export const Path = process.env.ROUGE_DB_PATH || path.join(Global.Path.data, "rouge.db")

  let _client: ReturnType<typeof drizzle> | null = null

  export function client() {
    if (_client) return _client

    log.info("opening database", { path: Path })

    const sqlite = new Database(Path)

    // SQLite optimizations
    sqlite.pragma("journal_mode = WAL")
    sqlite.pragma("synchronous = NORMAL")
    sqlite.pragma("busy_timeout = 5000")
    sqlite.pragma("cache_size = -64000")
    sqlite.pragma("foreign_keys = ON")
    sqlite.pragma("wal_checkpoint(PASSIVE)")

    _client = drizzle(sqlite)

    return _client
  }

  export function close() {
    if (_client) {
      // @ts-ignore
      _client.$client?.close()
      _client = null
    }
  }

  export function transaction<T>(fn: (tx: ReturnType<typeof client>) => T): T {
    const db = client()
    return db.transaction((tx) => fn(tx))
  }

  export type Client = ReturnType<typeof client>
  export type Transaction = Parameters<Parameters<Client["transaction"]>[0]>[0]
}
