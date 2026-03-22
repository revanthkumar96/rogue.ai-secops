import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { Log } from "../util/log"
import { lazy } from "../util/lazy"
import { registerRoutes } from "./routes/index.js"
import { Config } from "../config/config.js"
import fs from "fs/promises"
import path from "path"

const log = Log.create({ service: "server" })

export namespace Server {
  export const Default = lazy(() => createApp({}))

  export function createApp(opts: { cors?: string[] }): Hono {
    const app = new Hono()
    const api = new Hono()

    // Setup logging and error handling
    app.onError((err, c) => {
      console.error(`[Server Error] ${err.message}`)
      return c.json({ error: err.message }, 500)
    })

    // Middleware on the API sub-router
    api.use("*", logger())
    api.use(
      "*",
      cors({
        origin: (origin) => origin,
        credentials: true,
      })
    )

    // API Routes
    api.get("/", (c) =>
      c.json({
        name: "Rouge API",
        version: "0.1.0",
        status: "ok",
      })
    )

    api.get("/health", (c) =>
      c.json({
        status: "ok",
        timestamp: Date.now(),
      })
    )

    api.get("/config", async (c) => {
      const config = await Config.load()
      return c.json(config)
    })

    api.get("/files/list", async (c) => {
      const dir = c.req.query("path") || process.cwd()
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        const folders = entries.filter(e => e.isDirectory() && !e.name.startsWith(".")).map(e => e.name).sort()
        return c.json({ path: path.resolve(dir), folders })
      } catch (err: any) {
        return c.json({ error: err.message }, 500)
      }
    })

    // Register other routes on the api sub-router
    registerRoutes(api)

    // Mount the api sub-router on the main app
    app.route("/api", api)

    return app
  }

  export function listen(opts: { port: number; hostname: string }) {
    const app = createApp({})

    log.info("starting server", opts)

    const server = Bun.serve({
      port: opts.port,
      hostname: opts.hostname,
      fetch: app.fetch,
    })

    log.info("server started", {
      url: `http://${server.hostname}:${server.port}`,
    })

    return server
  }
}
