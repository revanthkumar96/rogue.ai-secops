import { Hono } from "hono"
import { stream } from "hono/streaming"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { Agent } from "../../agent/agent.js"
import type { AgentType } from "@rouge/shared/types"

/**
 * Agent routes
 * Rouge route implementation
 */

const app = new Hono()

// List agents
app.get("/", (c) => {
  const agents = Agent.listAgents()
  return c.json({
    agents,
  })
})

// Get agent capabilities
app.get("/:type", async (c) => {
  const type = c.req.param("type") as AgentType
  try {
    const capability = await Agent.getCapabilities(type)
    return c.json(capability)
  } catch (error: any) {
    return c.json({ error: error.message }, 404)
  }
})

// Execute agent
app.post(
  "/execute",
  zValidator(
    "json",
    z.object({
      type: z.enum([
        "test",
        "deploy",
        "monitor",
        "analyze",
        "ci-cd",
        "security",
        "performance",
        "infrastructure",
        "incident",
        "database",
        "router",
      ]),
      task: z.string(),
      context: z.record(z.any()).optional(),
      stream: z.boolean().default(false),
      sessionId: z.string().optional(),
    })
  ),
  async (c) => {
    const data = c.req.valid("json")

    const sessionId = data.sessionId || c.req.header("x-session-id") || "web-default"

    if (data.stream) {
      return stream(c, async (stream) => {
        for await (const chunk of Agent.executeStream({ ...data, sessionId })) {
          await stream.write(chunk)
        }
      })
    } else {
      const result = await Agent.execute({ ...data, sessionId })
      return c.json(result)
    }
  }
)

// Test connectivity
app.get("/test/connection", async (c) => {
  const connected = await Agent.testConnection()
  return c.json({
    connected,
    provider: "ollama",
  })
})

export const agentRoutes = app
