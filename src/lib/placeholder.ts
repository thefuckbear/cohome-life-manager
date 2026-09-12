export const PLACEHOLDER_EVENT = 'cohome:placeholder'

export function triggerPlaceholder(feature: string) {
  const message = `${feature}功能预留`
  console.info(`[合住 CoHome] ${message}`)
  window.dispatchEvent(
    new CustomEvent(PLACEHOLDER_EVENT, {
      detail: { message },
    }),
  )
}
