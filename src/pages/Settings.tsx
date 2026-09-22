import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { applyTheme, getTheme, notify, type Theme } from '../lib/placeholder'
import { useStore } from '../lib/store'

export function Settings() {
  const [theme, setTheme] = useState<Theme>(getTheme())
  const store = useStore()
  const [keyInput, setKeyInput] = useState('')
  const hasKey = store.assistantKey.trim().length > 0

  const changeTheme = (t: Theme) => {
    setTheme(t)
    applyTheme(t)
  }

  const saveKey = () => {
    const v = keyInput.trim()
    if (!v) return
    store.setAssistantKey(v)
    setKeyInput('')
    notify('已保存 DeepSeek API Key')
  }

  const clearKey = () => {
    store.clearAssistantKey()
    notify('已清除 API Key')
  }

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">偏好设置</span><h1>设置</h1><p>调整应用外观与小助手配置。</p></div>
      </section>
      <section className="panel module-panel">
        <div className="panel__header"><div><h2>主题</h2><p>选择浅色或深色外观</p></div></div>
        <div className="theme-options">
          <button className={`theme-option${theme === 'light' ? ' is-active' : ''}`} type="button" onClick={() => changeTheme('light')}>
            <Sun size={22} />
            <span><strong>浅色</strong><small>默认主题，清爽明亮</small></span>
          </button>
          <button className={`theme-option${theme === 'dark' ? ' is-active' : ''}`} type="button" onClick={() => changeTheme('dark')}>
            <Moon size={22} />
            <span><strong>深色</strong><small>夜间使用更护眼</small></span>
          </button>
        </div>
      </section>
      <section className="panel module-panel">
        <div className="panel__header"><div><h2>AI 小助手</h2><p>小助手基于 DeepSeek 大模型，需要你自己的 API Key（BYOK）</p></div></div>
        <div className="assistant-keybox">
          <p className="assistant-keybox__status">
            当前状态：{hasKey ? `已配置（${store.assistantKey.slice(0, 6)}…${store.assistantKey.slice(-4)}）` : '未配置 —— 小助手页将显示离线常见问题'}
          </p>
          <div className="assistant-keybox__row">
            <input
              type="password"
              className="form-input"
              value={keyInput}
              placeholder="sk-…（在 platform.deepseek.com 申请）"
              autoComplete="off"
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <button className="button button--primary" type="button" onClick={saveKey} disabled={!keyInput.trim()}>保存</button>
            {hasKey && <button className="button button--secondary" type="button" onClick={clearKey}>清除</button>}
          </div>
          <p className="assistant-keybox__hint">Key 只保存在本机浏览器（localStorage），直连 DeepSeek 官方接口，不会上传到任何服务器。</p>
        </div>
      </section>
    </div>
  )
}
