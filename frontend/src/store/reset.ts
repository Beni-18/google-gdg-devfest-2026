// Assisted mode "Clear all": every store holding client data registers a reset here,
// so one call wipes everything between walk-in clients. Nothing is persisted.
const resets = new Set<() => void>()

export function registerReset(fn: () => void) {
  resets.add(fn)
}

export function resetAll() {
  resets.forEach((fn) => fn())
}
