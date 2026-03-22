import type { Hono } from "hono"
import { workflowRoutes } from "./workflow.js"
import { testRoutes } from "./test.js"
import { deployRoutes } from "./deploy.js"
import { agentRoutes } from "./agent.js"
import { configRoutes } from "./config.js"

/**
 * Route registration
 * Rouge route implementation
 */

export function registerRoutes(app: Hono): Hono {
  return app
    .route("/workflow", workflowRoutes)
    .route("/test", testRoutes)
    .route("/deploy", deployRoutes)
    .route("/agent", agentRoutes)
    .route("/config", configRoutes)
}
