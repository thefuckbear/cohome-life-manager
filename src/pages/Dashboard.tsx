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
import { PlaceholderButton } from '../components/PlaceholderButton'
import {
  agreementAwaitingSelf,
  computeNetBalances,
  getMember,
  getSelf,
  greeting,
  lowSupplies,
  myChoreThisWeek,
  payeesCountFor,
  pendingSharesFor,
  timeAgo,
  todayLabel,
  yuan,
} from '../lib/selectors'
import { useStore } from '../lib/store'

const quickActions = [
  { title: '记一笔费用', text: '房租、水电或日用品', icon: ReceiptText, color: 'mint', to: '/expenses' },
  { title: '安排值日', text: '查看本周清洁计划', icon: CalendarDays, color: 'lavender', to: '/chores' },
  { title: '登记物品', text: '记录库存与补货', icon: Box, color: 'peach', to: '/supplies' },
]

export function Dashboard() {
  const navigate = useNavigate()
  const store = useStore()
  const self = getSelf(store)

  const net = computeNetBalances(store)
  const selfNet = self ? (net[self.id] ?? 0) : 0
  const myPending = self ? pendingSharesFor(store, self.id) : []
  const myChore = self ? myChoreThisWeek(store, self.id) : undefined
  const lows = lowSupplies(store)
  const pendingAgreement = self ? agreementAwaitingSelf(store, self.id) : undefined

  const firstPending = myPending[0]
  const firstLow = lows[0]

  const tasks: { key: string; title: string; sub: string; tag: string; tagClass: string }[] = []
  if (firstPending) {
    tasks.push({
      key: `pay-${firstPending.share.id}`,
      title: `支付 ${firstPending.expense.title}分摊`,
      sub: `应付给${firstPending.payer?.name ?? '室友'} ¥${yuan(firstPending.share.amount)}`,
      tag: '今天截止',
      tagClass: 'tag--danger',
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
  if (firstLow) {
    tasks.push({
      key: `supply-${firstLow.id}`,
      title: `决定${firstLow.name}由谁补货`,
      sub: `库存仅剩 ${firstLow.stockPct}%`,
      tag: '物品',
      tagClass: '',
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
          <p>{store.house.name}今天很平静，还有 {tasks.length} 件小事等你处理。</p>
        </div>
        <div className="welcome-actions">
          <PlaceholderButton feature="创建新事项" variant="primary"><Plus size={17} /> 创建新事项</PlaceholderButton>
          <button className="button button--secondary" type="button" onClick={handleReset}><RotateCcw size={15} /> 重置演示数据</button>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card summary-card--balance">
          <div className="summary-card__top"><span className="summary-icon"><CircleDollarSign size={21} /></span><span className="tag tag--warm">待结算</span></div>
          <span className="summary-label">我的合租余额</span>
          <strong className="summary-value">{selfNet < 0 ? `- ¥${yuan(-selfNet)}` : `+ ¥${yuan(selfNet)}`}</strong>
          <span className="summary-note">{selfNet < 0 ? `你需要支付给 ${payeesCountFor(store, self!.id)} 位室友` : '目前没有待结算费用'}</span>
        </article>
        <article className="summary-card">
          <div className="summary-card__top"><span className="summary-icon summary-icon--lavender"><CalendarDays size={21} /></span><span className="tag">本周</span></div>
          <span className="summary-label">我的值日</span>
          <strong className="summary-value summary-value--text">{myChore ? myChore.title : '本周无排班'}</strong>
          <span className="summary-note"><Clock3 size={14} /> {myChore ? `${new Date(myChore.dueAt).getHours().toString().padStart(2, '0')}:00 前完成` : '好好休息一下'}</span>
        </article>
        <article className="summary-card">
          <div className="summary-card__top"><span className="summary-icon summary-icon--peach"><Box size={21} /></span><span className="tag tag--danger">需关注</span></div>
          <span className="summary-label">公共物品</span>
          <strong className="summary-value summary-value--text">{lows.length} 件快用完</strong>
          <span className="summary-note">{lows.length ? `${lows.map((s) => s.name).join('、')}需要补货` : '库存充足'}</span>
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
                  {task.key.startsWith('pay-') ? (
                    <PlaceholderButton feature="费用支付" variant="ghost">去处理</PlaceholderButton>
                  ) : task.key.startsWith('agree-') ? (
                    <button className="button button--ghost" onClick={() => navigate('/agreements')}>去看看</button>
                  ) : (
                    <button className="button button--ghost" onClick={() => navigate('/supplies')}>去分配</button>
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
            <div className="panel__header"><div><h2>室友状态</h2><p>{store.house.name} · {store.members.length} 人</p></div></div>
            <div className="roommate-list">
              {store.members.map((member) => (
                <div className="roommate" key={member.id}>
                  <span className="avatar" style={{ background: member.color }}>{member.initials}</span>
                  <div><strong>{member.name}{member.isSelf && <em>我</em>}</strong><span>{member.status}</span></div>
                  <span className={`presence ${member.status === '在家' ? 'is-home' : ''}`} />
                </div>
              ))}
            </div>
            <PlaceholderButton feature="邀请新室友" variant="secondary" className="button--full"><Plus size={16} /> 邀请新室友</PlaceholderButton>
          </section>

          <section className="panel activity-panel">
            <div className="panel__header"><div><h2>最近动态</h2><p>生活变化都有记录</p></div></div>
            <div className="activity-list">
              {store.activities.map((item) => {
                const actor = getMember(store, item.actorId)
                return (
                  <div className="activity" key={item.id}>
                    <span className="activity__dot" style={{ background: actor?.color }} />
                    <div><p><strong>{actor?.name}</strong> {item.summary}</p><span>{timeAgo(item.at)}</span></div>
                  </div>
                )
              })}
            </div>
            <PlaceholderButton feature="全部动态" variant="ghost" className="button--full">查看全部动态 <ArrowRight size={15} /></PlaceholderButton>
          </section>
        </aside>
      </section>
    </div>
  )
}