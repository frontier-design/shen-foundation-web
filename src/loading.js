let done = false
const listeners = new Set()

export function isLoadingDone() {
  return done
}

export function markLoadingDone() {
  if (done) return
  done = true
  listeners.forEach((cb) => cb())
  listeners.clear()
}

export function onLoadingDone(cb) {
  if (done) {
    cb()
    return () => {}
  }
  listeners.add(cb)
  return () => listeners.delete(cb)
}
