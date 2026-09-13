import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { applyTheme, getTheme, type Theme } from '../lib/placeholder'

export function Settings() {
  const [theme, setTheme] = useState<Theme>(getTheme())

  const changeTheme = (t: Theme) => {
    setTheme(t)
    applyTheme(t)
  }

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">偏好设置</span><h1>设置</h1><p>调整应用外观。</p></div>
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
    </div>
  )
}
