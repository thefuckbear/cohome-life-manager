import { useState } from 'react'
import {
  ArrowRight,
  Box,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  Plus,
  ReceiptText,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { notify } from '../lib/placeholder'
import {
  agreementAwaitingSelf,
  daysLeft,
  getMember,
  getSelf,
  greeting,
  myChoreThisWeek,
  myChoreToday,
  payableFor,
  pendingSharesFor,
  timeAgo,
  todayLabel,
  upcomingBills,
  yuan,
} from '../lib/selectors'
import { useStore } from '../lib/store'

const quickActions = [
  { title: '记一笔费用', text: '房租、水电或日用品', icon: ReceiptText, color: 'mint', to: '/expenses' },
  { title: '认领值日', text: '自觉认领本周清洁', icon: CalendarDays, color: 'lavender', to: '/chores' },
  { title: '登记物品', text: '公共物品 AA 分摊', icon: Box, color: 'peach', to: '/supplies' },
]

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!name.trim()) return setError('请填写室友名字')
    store.addMember(name.trim())
    notify(`已邀请 ${name.trim()} 加入${store.houses.find((h) => h.id === store.currentHouseId)?.name ?? '合租屋'}`)
    onClose()
  }

  return (
    <div className="form">
      <div className="form-field">
        <label className="form-label" htmlFor="member-name">室友名字</label>
        <input id="member-name" className="form-input" value={name} placeholder="例如：小陈" onChange={(e) => { setName(e.target.value); setError('') }} />
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" onClick={submit}><Plus size={15} /> 邀请加入</button>
      </div>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const store = useStore()
  const self = getSelf(store)
  const [showAddMember, setShowAddMember] = useState(false)

  const myPending = self ? pendingSharesFor(store, self.id) : []
  const myPayable = self ? payableFor(store, self.id) : { total: 0, count: 0 }
  const myChore = self ? myChoreThisWeek(store, self.id) : undefined
  const myToday = self ? myChoreToday(store, self.id) : undefined
  const pendingAgreement = self ? agreementAwaitingSelf(store, self.id) : undefined

  const firstPending = myPending[0]

  const tasks: { key: string; title: string; sub: string; tag: string; tagClass: string }[] = []
  if (firstPending) {
    tasks.push({
      key: `pay-${firstPending.share.id}`,
      title: `支付 ${firstPending.expense.title}分摊`,
      sub: `应付给${firstPending.payer?.name ?? '室友'} ¥${yuan(firstPending.share.amount)}`,
      tag: '待支付',
      tagClass: 'tag--danger',
    })
  }
  if (myToday) {
    tasks.push({
      key: `chore-${myToday.id}`,
      title: `今天值日：${myToday.title}`,
      sub: '今晚 20:00 前完成',
      tag: '值日',
      tagClass: 'tag--warm',
    })
  }
  const dueBill = upcomingBills(store).find((b) => daysLeft(b) <= 3)
  if (dueBill) {
    const left = daysLeft(dueBill)
    tasks.push({
      key: `bill-${dueBill.id}`,
      title: `${dueBill.title}缴费${left < 0 ? '已逾期' : '临近'}`,
      sub: `${dueBill.dueDate} 截止 · ¥${yuan(dueBill.amount)}`,
      tag: '缴费',
      tagClass: left < 0 ? 'tag--danger' : 'tag--warm',
    })
  }
  if (pendingAgreement) {
    const creator = getMember(store, pendingAgreement.createdBy)
    tasks.push({
      key: `agree-${pendingAgreement.id}`,
      title: `确认新版${pendingAgreement.title}`,
      sub: `${creator?.name ?? '室友'}在 ${timeAgo(pendingAgreement.createdAt)}发起`,
      tag: '待确认',
      tagClass: 'tag--warm',
    })
  }

  const handleReset = () => {
    if (window.confirm('确定要重置所有演示数据吗？当前改动会丢失。')) {
      useStore.getState().reset()
      console.info('[合住 CoHome] 演示数据已重置')
    }
  }

  return (
    <div className="page page--dashboard">
      <section className="welcome-row">
        <div>
          <span className="eyebrow">{todayLabel()}</span>
          <h1>{greeting()}，{self?.name ?? '室友'} <span>👋</span></h1>
          <p>{store.houses.find((h) => h.id === store.currentHouseId)?.name ?? '合租屋'}今天很平静，还有 {tasks.length} 件小事等你处理。</p>
        </div>
        <div className="welcome-actions">
          <button className="button button--secondary" type="button" onClick={handleReset}><RotateCcw size={15} /> 重置演示数据</button>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card summary-card--balance">
          <div className="summary-card__top"><span className="summary-icon"><CircleDollarSign size={21} /></span><span className="tag tag--warm">钱包</span></div>
          <span className="summary-label">我的余额</span>
          <strong className="summary-value">¥{yuan(self?.balance ?? 0)}</strong>
          <span className="summary-note">{myPayable.total > 0 ? `待结算 ¥${yuan(myPayable.total)} · ${myPayable.count} 笔` : '目前没有待结算费用'}</span>
        </article>
        <article className="summary-card">
          <div className="summary-card__top"><span className="summary-icon summary-icon--lavender"><CalendarDays size={21} /></span><span className="tag">本周</span></div>
          <span className="summary-label">我的值日</span>
          <strong className="summary-value summary-value--text">{myChore ? myChore.title : '本周无排班'}</strong>
          <span className="summary-note"><Clock3 size={14} /> {myChore ? `${new Date(myChore.dueAt).getHours().toString().padStart(2, '0')}:00 前完成` : '自觉认领一个吧'}</span>
        </article>
        <article className="summary-card">
          <div className="summary-card__top"><span className="summary-icon summary-icon--peach"><Box size={21} /></span><span className="tag tag--success">自愿登记</span></div>
          <span className="summary-label">公共物品</span>
          <strong className="summary-value summary-value--text">{store.supplies.length} 件公共物品</strong>
          <span className="summary-note">{store.supplies.length ? '登记即生成 AA 账单' : '还没有登记'}</span>
        </article>
        <article className="summary-card summary-card--score">
          <div className="summary-card__top"><span className="summary-icon summary-icon--green"><Sparkles size={21} /></span><span className="tag tag--success">+6</span></div>
          <span className="summary-label">本周合住默契</span>
          <strong className="summary-value">86<span className="summary-unit">分</span></strong>
          <span className="summary-note">继续保持，配合得很棒</span>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-main">
          <section className="panel tasks-panel">
            <div className="panel__header"><div><h2>今天要处理</h2><p>完成这些小事，让合租更顺畅</p></div><button className="text-button" onClick={() => navigate('/chores')}>查看全部 <ArrowRight size={15} /></button></div>
            <div className="task-list">
              {tasks.map((task) => (
                <article className="task-row" key={task.key}>
                  <button className="task-check" onClick={() => console.info('[合住 CoHome] 标记任务完成功能预留')} aria-label="标记完成"><Check size={15} /></button>
                  <div className="task-body"><strong>{task.title}</strong><span>{task.sub}</span></div>
                  <span className={`tag ${task.tagClass}`}>{task.tag}</span>
                  {task.key.startsWith('pay-') || task.key.startsWith('bill-') ? (
                    <button className="button button--ghost" onClick={() => navigate('/expenses')}>{task.key.startsWith('bill-') ? '去处理' : '去支付'}</button>
                  ) : task.key.startsWith('agree-') ? (
                    <button className="button button--ghost" onClick={() => navigate('/agreements')}>去看看</button>
                  ) : (
                    <button className="button button--ghost" onClick={() => navigate('/chores')}>去完成</button>
                  )}
                </article>
              ))}
              {tasks.length === 0 && (
                <div className="task-row"><div className="task-body"><strong>今天没有待办</strong><span>一切都很平静</span></div></div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel__header"><div><h2>快速开始</h2><p>常用功能，一步直达</p></div></div>
            <div className="quick-grid">
              {quickActions.map(({ title, text, icon: Icon, color, to }) => (
                <button key={title} className="quick-card" onClick={() => navigate(to)}>
                  <span className={`quick-icon quick-icon--${color}`}><Icon size={21} /></span>
                  <span><strong>{title}</strong><small>{text}</small></span>
                  <ArrowRight size={17} />
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="dashboard-aside">
          <section className="panel roommates-panel">
            <div className="panel__header"><div><h2>室友状态</h2><p>{store.houses.find((h) => h.id === store.currentHouseId)?.name ?? '合租屋'} · {store.members.filter((m) => m.houseId === store.currentHouseId).length} 人</p></div></div>
            <div className="roommate-list">
              {store.members.filter((m) => m.houseId === store.currentHouseId).map((member) => (
                <div className="roommate" key={member.id}>
                  <span className="avatar" style={{ background: member.color }}>{member.initials}</span>
                  <div><strong>{member.name}{member.id === store.currentUserId && <em>我</em>}</strong><span>{member.status}</span></div>
                  <span className={`presence ${member.status === '在家' ? 'is-home' : ''}`} />
                </div>
              ))}
            </div>
            <button className="button button--secondary button--full" type="button" onClick={() => setShowAddMember(true)}><Plus size={16} /> 邀请新室友</button>
          </section>

          <section className="panel activity-panel">
            <div className="panel__header"><div><h2>最近动态</h2><p>生活变化都有记录</p></div></div>
            <div className="activity-list">
              {store.activities.slice(0, 6).map((item) => {
                const actor = getMember(store, item.actorId)
                return (
                  <div className="activity" key={item.id}>
                    <span className="activity__dot" style={{ background: actor?.color }} />
                    <div><p><strong>{actor?.name}</strong> {item.summary}</p><span>{timeAgo(item.at)}</span></div>
                  </div>
                )
              })}
            </div>
          </section>
        </aside>
      </section>

      {showAddMember && (
        <Modal title="邀请新室友" onClose={() => setShowAddMember(false)}>
          <AddMemberModal onClose={() => setShowAddMember(false)} />
        </Modal>
      )}
    </div>
  )
}
