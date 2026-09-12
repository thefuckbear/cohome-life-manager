import { useEffect, useState, type ReactNode } from 'react'
import {
  Bell,
  BookOpenCheck,
  Box,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Home,
  ReceiptText,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { PLACEHOLDER_EVENT, triggerPlaceholder } from '../lib/placeholder'

const navigation = [
  { to: '/', label: '今日首页', icon: Home },
  { to: '/expenses', label: '费用 AA', icon: ReceiptText },
  { to: '/chores', label: '清洁值日', icon: ClipboardCheck },
  { to: '/supplies', label: '公共物品', icon: Box },
  { to: '/agreements', label: '室友公约', icon: BookOpenCheck },
]

function Brand() {
  return (
    <div className="brand">
      <div className="brand__mark"><Sparkles size={20} /></div>
      <div>
        <strong>合住</strong>
        <span>CoHome</span>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState('')

  useEffect(() => {
    let timer = 0
    const handlePlaceholder = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>
      setToast(customEvent.detail.message)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setToast(''), 2400)
    }
    window.addEventListener(PLACEHOLDER_EVENT, handlePlaceholder)
    return () => {
      window.removeEventListener(PLACEHOLDER_EVENT, handlePlaceholder)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <button className="home-switcher" type="button" onClick={() => triggerPlaceholder('切换合租屋')}>
          <span className="home-switcher__icon"><Users size={17} /></span>
          <span><small>当前合租屋</small><strong>小满之家</strong></span>
          <ChevronDown size={16} />
        </button>
        <nav className="sidebar__nav" aria-label="主导航">
          <span className="nav-caption">生活管理</span>
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__status">
          <div className="status-icon"><CheckCircle2 size={18} /></div>
          <div><strong>本周生活状态良好</strong><span>3 位室友都很配合</span></div>
        </div>
        <div className="profile-mini">
          <span className="avatar avatar--self">周</span>
          <div><strong>小周</strong><span>普通成员</span></div>
          <button aria-label="账户菜单" onClick={() => triggerPlaceholder('个人账户')}><ChevronDown size={16} /></button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><Brand /></div>
          <div className="topbar__spacer" />
          <button className="icon-button" aria-label="通知中心" onClick={() => triggerPlaceholder('通知中心')}>
            <Bell size={19} />
            <span className="notification-dot" />
          </button>
          <div className="topbar__profile">
            <span className="avatar avatar--self">周</span>
            <div><strong>小周</strong><span>小满之家</span></div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="移动端主导航">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `mobile-nav__item${isActive ? ' is-active' : ''}`}>
            <Icon size={20} />
            <span>{label.replace('公共', '').replace('室友', '')}</span>
          </NavLink>
        ))}
      </nav>

      {toast && (
        <div className="toast" role="status">
          <span className="toast__icon"><Sparkles size={17} /></span>
          <div><strong>接口已预留</strong><span>{toast}，后续可接入真实逻辑</span></div>
          <button aria-label="关闭提示" onClick={() => setToast('')}><X size={16} /></button>
        </div>
      )}
    </div>
  )
}
