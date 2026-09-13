export const PLACEHOLDER_EVENT = 'cohome:placeholder'
export const NOTIFY_EVENT = 'cohome:notify'

let audio: HTMLAudioElement | null = null

export function playNotificationSound() {
  try {
    if (typeof window === 'undefined') return
    if (!audio) {
      audio = new Audio('notification.m4a')
    }
    audio.currentTime = 0
    audio.play().catch(() => {
      // 浏览器自动播放策略拦截时静默失败
    })
  } catch {
    // 音频加载失败不影响功能
  }
}

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
  playNotificationSound()
  window.dispatchEvent(new CustomEvent(NOTIFY_EVENT, { detail: { message } }))
}
