export const PLACEHOLDER_EVENT = 'cohome:placeholder'
export const NOTIFY_EVENT = 'cohome:notify'

export function triggerPlaceholder(feature: string) {
  const message = `${feature}功能预留`
  console.info(`[合住 CoHome] ${message}`)
  window.dispatchEvent(
    new CustomEvent(PLACEHOLDER_EVENT, {
      detail: { message },
    }),
  )
}

export function notify(message: string) {
  window.dispatchEvent(new CustomEvent(NOTIFY_EVENT, { detail: { message } }))
}
