import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { Config, RougeConfig } from "../../config/config.js"

/**
 * Configuration routes
 * Rouge route implementation
 */

const app = new Hono()

// Get configuration
app.get("/", async (c) => {
  const config = await Config.load()
  return c.json(config)
})

// Get specific section
app.get("/:section", async (c) => {
  const section = c.req.param("section") as keyof typeof RougeConfig.shape
  try {
    const value = await Config.get(section)
    return c.json({ [section]: value })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Update configuration
app.patch("/", zValidator("json", RougeConfig.partial()), async (c) => {
  const updates = c.req.valid("json")
  const config = await Config.load()

  // Apply updates
  Object.assign(config, updates)
  await Config.save(config)

  return c.json(config)
})

// Update specific section
app.patch("/:section", async (c) => {
  const section = c.req.param("section") as keyof typeof RougeConfig.shape
  const value = await c.req.json()

  try {
    const config = await Config.update(section, value)
    return c.json(config)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export const configRoutes = app
