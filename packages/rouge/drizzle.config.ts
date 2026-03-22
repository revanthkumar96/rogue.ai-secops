import { defineConfig } from "drizzle-kit";
import path from "path";
import os from "os";

// Resolve the database path matching Global.Path.data
// Global.Path.data is path.join(xdgData, "rouge")
// On Windows, xdgData is usually %LOCALAPPDATA%
const dbPath = path.join(os.homedir(), ".local", "share", "rouge", "rouge.db");

export default defineConfig({
  schema: "./src/storage/schema/index.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
