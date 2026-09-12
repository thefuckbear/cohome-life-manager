export const PLACEHOLDER_EVENT = 'cohome:placeholder'

export type AppNotice = {
  title: string
  message: string
}

export function triggerNotice(message: string, title = '操作成功') {
  window.dispatchEvent(
    new CustomEvent<AppNotice>(PLACEHOLDER_EVENT, {
      detail: { title, message },
    }),
  )
}

export function triggerPlaceholder(feature: string) {
  const message = `${feature}功能预留`
  console.info(`[合住 CoHome] ${message}`)
  triggerNotice(`${message}，后续可接入真实逻辑`, '接口已预留')
}
