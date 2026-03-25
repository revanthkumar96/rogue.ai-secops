import fs from "fs/promises"
import { xdgData, xdgCache, xdgConfig, xdgState } from "xdg-basedir"
import path from "path"
import os from "os"

const app = "rouge"
const home = os.homedir()
const isCI = !!process.env.GITHUB_ACTIONS
const workspace = process.env.GITHUB_WORKSPACE

const base = isCI && workspace ? path.join(workspace, ".rouge") : home

const data = isCI && workspace ? path.join(base, "data") : path.join(xdgData || path.join(home, ".local", "share"), app)
const cache = isCI && workspace ? path.join(base, "cache") : path.join(xdgCache || path.join(home, ".cache"), app)
const config = isCI && workspace ? path.join(base, "config") : path.join(xdgConfig || path.join(home, ".config"), app)
const state = isCI && workspace ? path.join(base, "state") : path.join(xdgState || path.join(home, ".local", "state"), app)

export namespace Global {
  export const Path = {
    get home() {
      return process.env.ROUGE_TEST_HOME || home
    },
    data,
    bin: path.join(cache, "bin"),
    log: path.join(data, "log"),
    cache,
    config,
    state,
  }
}

import { mkdirSync } from "fs"

// Create directories synchronously to avoid race conditions during import
try {
  mkdirSync(Global.Path.data, { recursive: true })
  mkdirSync(Global.Path.config, { recursive: true })
  mkdirSync(Global.Path.state, { recursive: true })
  mkdirSync(Global.Path.log, { recursive: true })
  mkdirSync(Global.Path.bin, { recursive: true })
} catch (e) {
  // Ignore or log error if logging was initialized
}
