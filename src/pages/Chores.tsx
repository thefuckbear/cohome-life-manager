import { CalendarDays, Check, Clock3, Plus, RefreshCw, Repeat2 } from 'lucide-react'
import { PlaceholderButton } from '../components/PlaceholderButton'
import { triggerNotice } from '../lib/placeholder'
import { useLocalStorageState } from '../lib/useLocalStorageState'

const schedule = [
  { day: '周一', date: '09/07', room: '厨房', person: '小林', status: '已完成', color: '#6f9a83' },
  { day: '周三', date: '09/09', room: '客厅', person: '小夏', status: '已完成', color: '#7d83b7' },
  { day: '周日', date: '09/13', room: '卫生间', person: '小周', status: '待完成', color: '#e6a25a' },
  { day: '周日', date: '09/13', room: '垃圾清理', person: '小林', status: '待完成', color: '#6f9a83' },
]

export function Chores() {
  const [completed, setCompleted] = useLocalStorageState<Record<string, boolean>>('cohome:chores:completed', {})
  const completedCount = schedule.filter((item) => item.status === '已完成' || completed[item.room]).length

  const completeChore = (room: string) => {
    setCompleted((current) => ({ ...current, [room]: true }))
    console.info(`[合住 CoHome] ${room}值日已完成`)
    triggerNotice(`${room}已标记完成，本周值日进度已同步更新。`)
  }

  return (
    <div className="page module-page">
      <section className="module-heading"><div><span className="eyebrow">轮流分担，不靠催促</span><h1>清洁值日</h1><p>查看本周排班、完成任务，或和室友轻松换班。</p></div><PlaceholderButton feature="新建值日任务" variant="primary"><Plus size={17} /> 新建任务</PlaceholderButton></section>
      <section className="schedule-summary">
        <div><span className="schedule-icon"><CalendarDays size={24} /></span><div><small>第 37 周</small><strong>9 月 7 日 — 9 月 13 日</strong></div></div>
        <div className="progress-copy"><span><strong>{completedCount}</strong> / 4 已完成</span><div className="progress-track"><span style={{ width: `${completedCount * 25}%` }} /></div></div>
        <PlaceholderButton feature="自动生成下周排班" variant="secondary"><RefreshCw size={16} /> 生成下周排班</PlaceholderButton>
      </section>
      <section className="panel module-panel">
        <div className="panel__header"><div><h2>本周排班</h2><p>按公共区域轮换安排</p></div><PlaceholderButton feature="排班规则设置" variant="ghost">管理轮换规则</PlaceholderButton></div>
        <div className="chore-grid">
          {schedule.map((item) => {
            const isDone = item.status === '已完成' || completed[item.room]
            return (
            <article className={`chore-card ${isDone ? 'is-done' : ''}`} key={item.room}>
              <div className="chore-card__date"><strong>{item.day}</strong><span>{item.date}</span></div>
              <div className="chore-card__body"><span className="avatar" style={{ background: item.color }}>{item.person.slice(1)}</span><div><small>{item.person}负责</small><strong>{item.room}</strong></div></div>
              <span className={`tag ${isDone ? 'tag--success' : 'tag--warm'}`}>{isDone && <Check size={13} />}{isDone ? '已完成' : '待完成'}</span>
              {isDone ? <PlaceholderButton feature={`${item.room}完成记录`} variant="ghost">查看记录</PlaceholderButton> : <div className="chore-actions"><PlaceholderButton feature={`${item.room}申请换班`} variant="secondary"><Repeat2 size={15} /> 换班</PlaceholderButton><button type="button" className="button button--primary" onClick={() => completeChore(item.room)}><Check size={15} /> 完成</button></div>}
            </article>
            )
          })}
        </div>
      </section>
      <section className="empty-preview"><Clock3 size={24} /><div><strong>接口预留：逾期提醒</strong><span>后续可在截止前提醒负责人，并保留任务完成记录。</span></div><PlaceholderButton feature="值日提醒设置" variant="secondary">设置提醒</PlaceholderButton></section>
    </div>
  )
}
