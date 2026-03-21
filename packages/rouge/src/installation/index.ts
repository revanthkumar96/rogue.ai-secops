export namespace Installation {
  export const VERSION = "0.1.0"
  export const CHANNEL = process.env.ROUGE_CHANNEL || "dev"

  export function isLocal(): boolean {
    return process.env.NODE_ENV === "development" || CHANNEL === "dev"
  }
}
