import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { Log } from "../util/log"
import { lazy } from "../util/lazy"
import { registerRoutes } from "./routes/index.js"
import { Config } from "../config/config.js"
import { migrate } from "../storage/migrate.js"
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

    // Dashboard stats endpoint
    api.get("/stats", async (c) => {
      try {
        const { DatabaseTool } = await import("../tool/database.js")
        const [wfStats, testStats, deployments, execLogs] = await Promise.all([
          DatabaseTool.getWorkflowStats(),
          DatabaseTool.getTestStats(),
          DatabaseTool.listDeployments({ limit: 5 }),
          DatabaseTool.listExecutionLogs({ limit: 10 }),
        ])
        return c.json({
          workflows: wfStats.stats || { total: 0, by_status: {} },
          tests: testStats.stats || { total_runs: 0, total_passed: 0, total_failed: 0, by_status: {} },
          deployments: {
            total: deployments.count || 0,
            recent: deployments.deployments || [],
          },
          executions: {
            total: execLogs.count || 0,
            recent: (execLogs.logs || []).map((l: any) => ({
              id: l.id,
              agent_type: l.agent_type,
              task: l.task?.substring(0, 80),
              success: l.success,
              started_at: l.started_at,
            })),
          },
        })
      } catch (e: any) {
        return c.json({
          workflows: { total: 0, by_status: {} },
          tests: { total_runs: 0, total_passed: 0, total_failed: 0, by_status: {} },
          deployments: { total: 0, recent: [] },
          executions: { total: 0, recent: [] },
        })
      }
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

  export async function listen(opts: { port: number; hostname: string }) {
    // Run database migrations
    try {
      await migrate()
    } catch (error) {
      log.error("Failed to run migrations, continuing anyway...", error)
    }

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
