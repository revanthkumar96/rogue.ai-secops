import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { Log } from "../util/log"
import { lazy } from "../util/lazy"
import { registerRoutes } from "./routes/index.js"

const log = Log.create({ service: "server" })

export namespace Server {
  export const Default = lazy(() => createApp({}))

  export function createApp(opts: { cors?: string[] }): Hono {
    const app = new Hono()

    // Setup middleware and base routes
    app
      .onError((err, c) => {
        log.error("request failed", { error: err.message })
        return c.json(
          {
            error: err.message,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
          },
          500,
        )
      })
      .use("*", logger())
      .use(
        "*",
        cors({
          origin: opts.cors || ["http://localhost:*"],
          credentials: true,
        }),
      )
      .get("/", (c) =>
        c.json({
          name: "Rouge API",
          version: "0.1.0",
          description: "DevOps & Testing Automation Platform",
        }),
      )
      .get("/health", (c) =>
        c.json({
          status: "ok",
          timestamp: Date.now(),
        }),
      )

    // Register API routes
    registerRoutes(app)

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
