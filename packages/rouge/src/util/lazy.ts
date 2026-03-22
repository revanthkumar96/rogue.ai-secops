export function lazy<T>(fn: () => T): { (): T; reset: () => void } {
  let result: T | undefined
  let computed = false

  const getter = () => {
    if (!computed) {
      result = fn()
      computed = true
    }
    return result!
  }

  getter.reset = () => {
    result = undefined
    computed = false
  }

  return getter
}
