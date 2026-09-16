import { useEffect, useState, type ReactNode } from 'react'
import {
  Bell,
  BellRing,
  BookOpen,
  BookOpenCheck,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Home,
  Plus,
  ReceiptText,
  Settings as SettingsIcon,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Modal } from './Modal'
import { NOTIFY_EVENT, PLACEHOLDER_EVENT, playNotificationSound, triggerPlaceholder } from '../lib/placeholder'
import { getSelf, myChoreToday, notificationsFor } from '../lib/selectors'
import { useStore } from '../lib/store'

const navigation = [
  { to: '/', label: '今日首页', icon: Home },
  { to: '/expenses', label: '费用 AA', icon: ReceiptText },
  { to: '/chores', label: '清洁值日', icon: ClipboardCheck },
  { to: '/supplies', label: '公共物品', icon: Box },
  { to: '/agreements', label: '室友公约', icon: BookOpenCheck },
  { to: '/guide', label: '使用说明', icon: BookOpen },
  { to: '/settings', label: '设置', icon: SettingsIcon },
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

function AddHouseModal({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!name.trim()) return setError('请填写合租屋名称')
    store.addHouse(name.trim())
    onClose()
  }

  return (
    <div className="form">
      <p className="form-label" style={{ color: '#7f8a83' }}>创建后自动切换过去，你将成为新合租屋的管理员。</p>
      <div className="form-field">
        <label className="form-label" htmlFor="house-name">合租屋名称</label>
        <input id="house-name" className="form-input" value={name} placeholder="例如：朝阳小窝" onChange={(e) => { setName(e.target.value); setError('') }} />
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" onClick={submit}><Plus size={15} /> 创建合租屋</button>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const store = useStore()
  const self = getSelf(store)
  const [toast, setToast] = useState<{ text: string; kind: 'placeholder' | 'notify' } | null>(null)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showHouseMenu, setShowHouseMenu] = useState(false)
  const [showAddHouse, setShowAddHouse] = useState(false)

  const notifs = notificationsFor(store, store.currentUserId)
  const currentHouse = store.houses.find((h) => h.id === store.currentHouseId)

  useEffect(() => {
    let timer = 0
    const show = (text: string, kind: 'placeholder' | 'notify') => {
      setToast({ text, kind })
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setToast(null), 2400)
    }
    const handlePlaceholder = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>
      show(customEvent.detail.message, 'placeholder')
    }
    const handleNotify = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>
      show(customEvent.detail.message, 'notify')
    }
    window.addEventListener(PLACEHOLDER_EVENT, handlePlaceholder)
    window.addEventListener(NOTIFY_EVENT, handleNotify)
    return () => {
      window.removeEventListener(PLACEHOLDER_EVENT, handlePlaceholder)
      window.removeEventListener(NOTIFY_EVENT, handleNotify)
      window.clearTimeout(timer)
    }
  }, [])

  const goFor = (route: string) => {
    setShowNotif(false)
    navigate(route)
  }

  useEffect(() => {
    if (!self) return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    const notified = new Set<string>()
    const check = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      const chore = myChoreToday(useStore.getState(), self.id)
      if (!chore) return
      const due = new Date(chore.dueAt).getTime()
      const left = due - Date.now()
      if (left <= 10 * 60_000 && left > 0 && !notified.has(chore.id)) {
        notified.add(chore.id)
        new Notification('值日临近截止', { body: `「${chore.title}」将在 10 分钟内截止` })
        playNotificationSound()
      }
    }
    check()
    const timer = window.setInterval(check, 60_000)
    return () => window.clearInterval(timer)
  }, [self])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <button className="home-switcher" type="button" onClick={() => setShowHouseMenu((v) => !v)}>
          <span className="home-switcher__icon"><Users size={17} /></span>
          <span><small>当前合租屋</small><strong>{currentHouse?.name ?? '合租屋'}</strong></span>
          <ChevronDown size={16} />
          {showHouseMenu && (
            <div className="account-menu account-menu--down">
              <span className="account-menu__caption">我的合租屋</span>
              {store.houses.map((h) => (
                <button
                  key={h.id}
                  className={`account-menu__item${h.id === store.currentHouseId ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => { store.switchHouse(h.id); setShowHouseMenu(false) }}
                >
                  <span className="home-switcher__icon" style={{ width: 26, height: 26, fontSize: 13 }}>🏠</span>
                  <span>{h.name}{h.id === store.currentHouseId ? '（当前）' : ''}</span>
                </button>
              ))}
              <button className="account-menu__item" type="button" onClick={() => { setShowAddHouse(true); setShowHouseMenu(false) }}>
                <span className="home-switcher__icon" style={{ width: 26, height: 26, fontSize: 13 }}>＋</span>
                <span>添加合租屋</span>
              </button>
            </div>
          )}
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
          <span className="avatar" style={{ background: self?.color }}>{self?.initials}</span>
          <div><strong>{self?.name ?? '访客'}</strong><span>{self?.role === 'owner' ? '管理员' : '普通成员'}</span></div>
          <button className="profile-mini__switch" aria-label="切换账号" onClick={() => setShowAccountMenu((v) => !v)}>切换账号 <ChevronDown size={13} /></button>
          {showAccountMenu && (
            <div className="account-menu">
              <span className="account-menu__caption">切换账号（演示多成员视角）</span>
              {Array.from(new Map(store.members.map((m) => [m.id, m])).values()).map((m) => (
                <button
                  key={m.id}
                  className={`account-menu__item${m.id === store.currentUserId ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => { store.switchAccount(m.id); setShowAccountMenu(false) }}
                >
                  <span className="avatar avatar--sm" style={{ background: m.color }}>{m.initials}</span>
                  <span>{m.name}{m.id === store.currentUserId ? '（当前）' : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><Brand /></div>
          <div className="topbar__spacer" />
          <button className="icon-button" aria-label="通知中心" onClick={() => setShowNotif(true)}>
            <Bell size={19} />
            {notifs.length > 0 && <span className="notification-dot" />}
          </button>
          <div className="topbar__profile">
            <span className="avatar" style={{ background: self?.color }}>{self?.initials}</span>
            <div><strong>{self?.name}</strong><span>{currentHouse?.name ?? '合租屋'}</span></div>
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

      {showNotif && (
        <Modal title="通知中心" onClose={() => setShowNotif(false)}>
          <div className="notif-list">
            {notifs.length === 0 && (
              <p className="form-label" style={{ color: '#99a09b' }}>暂无通知。室友提醒你、你有待结算、今天值日时，都会出现在这里。</p>
            )}
            {notifs.map((n) => (
              <button key={n.id} className="notif-row" type="button" onClick={() => goFor(n.route)}>
                <span className={`notif-row__icon notif-row__icon--${n.kind}`}>
                  {n.kind === 'reminded' ? <BellRing size={16} /> : n.kind === 'settle' ? <ReceiptText size={16} /> : <CalendarDays size={16} />}
                </span>
                <span className="notif-row__main">
                  <strong>{n.text}</strong>
                  <span>{n.sub}</span>
                </span>
                <span className="notif-row__go">查看</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {showAddHouse && (
        <Modal title="添加合租屋" onClose={() => setShowAddHouse(false)}>
          <AddHouseModal onClose={() => setShowAddHouse(false)} />
        </Modal>
      )}

      {toast && (
        <div className="toast" role="status">
          <span className="toast__icon"><Sparkles size={17} /></span>
          <div>
            <strong>{toast.kind === 'notify' ? '操作成功' : '接口已预留'}</strong>
            <span>{toast.kind === 'notify' ? toast.text : `${toast.text}，后续可接入真实逻辑`}</span>
          </div>
          <button aria-label="关闭提示" onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}
    </div>
  )
}
