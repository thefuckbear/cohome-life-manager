import {
  ArrowRight,
  Box,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  Plus,
  ReceiptText,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { activities, roommates } from '../data'
import { PlaceholderButton } from '../components/PlaceholderButton'

const quickActions = [
  { title: '记一笔费用', text: '房租、水电或日用品', icon: ReceiptText, color: 'mint', to: '/expenses' },
  { title: '安排值日', text: '查看本周清洁计划', icon: CalendarDays, color: 'lavender', to: '/chores' },
  { title: '登记物品', text: '记录库存与补货', icon: Box, color: 'peach', to: '/supplies' },
]

export function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="page page--dashboard">
      <section className="welcome-row">
        <div>
          <span className="eyebrow">9 月 12 日 · 星期六</span>
          <h1>晚上好，小周 <span>👋</span></h1>
          <p>小满之家今天很平静，还有 3 件小事等你处理。</p>
        </div>
        <PlaceholderButton feature="创建新事项" variant="primary"><Plus size={17} /> 创建新事项</PlaceholderButton>
      </section>

      <section className="summary-grid">
        <article className="summary-card summary-card--balance">
          <div className="summary-card__top"><span className="summary-icon"><CircleDollarSign size={21} /></span><span className="tag tag--warm">待结算</span></div>
          <span className="summary-label">我的合租余额</span>
          <strong className="summary-value">- ¥126.50</strong>
          <span className="summary-note">你需要支付给 2 位室友</span>
        </article>
        <article className="summary-card">
          <div className="summary-card__top"><span className="summary-icon summary-icon--lavender"><CalendarDays size={21} /></span><span className="tag">本周</span></div>
          <span className="summary-label">我的值日</span>
          <strong className="summary-value summary-value--text">卫生间清洁</strong>
          <span className="summary-note"><Clock3 size={14} /> 明天 20:00 前完成</span>
        </article>
        <article className="summary-card">
          <div className="summary-card__top"><span className="summary-icon summary-icon--peach"><Box size={21} /></span><span className="tag tag--danger">需关注</span></div>
          <span className="summary-label">公共物品</span>
          <strong className="summary-value summary-value--text">2 件快用完</strong>
          <span className="summary-note">抽纸、洗洁精需要补货</span>
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
              <article className="task-row">
                <button className="task-check" onClick={() => console.info('[合住 CoHome] 标记任务完成功能预留')} aria-label="标记完成"><Check size={15} /></button>
                <div className="task-body"><strong>支付 9 月电费分摊</strong><span>应付给小林 ¥80.00</span></div>
                <span className="tag tag--danger">今天截止</span>
                <PlaceholderButton feature="费用支付" variant="ghost">去处理</PlaceholderButton>
              </article>
              <article className="task-row">
                <button className="task-check" onClick={() => console.info('[合住 CoHome] 标记任务完成功能预留')} aria-label="标记完成"><Check size={15} /></button>
                <div className="task-body"><strong>确认新版访客公约</strong><span>小夏在 2 小时前发起</span></div>
                <span className="tag tag--warm">待确认</span>
                <button className="button button--ghost" onClick={() => navigate('/agreements')}>去看看</button>
              </article>
              <article className="task-row">
                <button className="task-check" onClick={() => console.info('[合住 CoHome] 标记任务完成功能预留')} aria-label="标记完成"><Check size={15} /></button>
                <div className="task-body"><strong>决定抽纸由谁补货</strong><span>预计还能使用 2 天</span></div>
                <span className="tag">物品</span>
                <button className="button button--ghost" onClick={() => navigate('/supplies')}>去分配</button>
              </article>
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
            <div className="panel__header"><div><h2>室友状态</h2><p>小满之家 · 3 人</p></div></div>
            <div className="roommate-list">
              {roommates.map((member) => (
                <div className="roommate" key={member.name}>
                  <span className="avatar" style={{ background: member.color }}>{member.initials}</span>
                  <div><strong>{member.name}{member.name === '小周' && <em>我</em>}</strong><span>{member.status}</span></div>
                  <span className={`presence ${member.status === '在家' ? 'is-home' : ''}`} />
                </div>
              ))}
            </div>
            <PlaceholderButton feature="邀请新室友" variant="secondary" className="button--full"><Plus size={16} /> 邀请新室友</PlaceholderButton>
          </section>

          <section className="panel activity-panel">
            <div className="panel__header"><div><h2>最近动态</h2><p>生活变化都有记录</p></div></div>
            <div className="activity-list">
              {activities.map((item) => (
                <div className="activity" key={item.action}>
                  <span className="activity__dot" style={{ background: item.color }} />
                  <div><p><strong>{item.person}</strong> {item.action}</p><span>{item.time}</span></div>
                </div>
              ))}
            </div>
            <PlaceholderButton feature="全部动态" variant="ghost" className="button--full">查看全部动态 <ArrowRight size={15} /></PlaceholderButton>
          </section>
        </aside>
      </section>
    </div>
  )
}
