import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
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
    sqlite.exec("PRAGMA journal_mode = WAL")
    sqlite.exec("PRAGMA synchronous = NORMAL")
    sqlite.exec("PRAGMA busy_timeout = 5000")
    sqlite.exec("PRAGMA cache_size = -64000")
    sqlite.exec("PRAGMA foreign_keys = ON")
    sqlite.exec("PRAGMA wal_checkpoint(PASSIVE)")

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

  export function transaction<T>(fn: (tx: Transaction) => T): T {
    const db = client()
    // @ts-ignore - Drizzle transaction typing can be tricky with specific drivers
    return db.transaction((tx) => fn(tx))
  }

  export type Client = ReturnType<typeof client>
  export type Transaction = Parameters<Parameters<Client["transaction"]>[0]>[0]
}
