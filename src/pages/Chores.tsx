import { useState } from 'react'
import { CalendarDays, Check, Clock3, Plus, RefreshCw, Repeat2 } from 'lucide-react'
import { Modal } from '../components/Modal'
import { PlaceholderButton } from '../components/PlaceholderButton'
import {
  choresDoneCount,
  choresThisWeek,
  formatDue,
  getMember,
  nextWeekGenerated,
  weekRangeLabel,
} from '../lib/selectors'
import { useStore } from '../lib/store'
import type { ChoreTask, ID } from '../lib/types'

function SwapModal({ task, onClose }: { task: ChoreTask; onClose: () => void }) {
  const store = useStore()
  const [target, setTarget] = useState<ID | null>(null)
  const others = store.members.filter((m) => m.id !== task.assigneeId)

  return (
    <Modal title="与谁换班" onClose={onClose}>
      <p className="form-label">将「{task.title}」换给：</p>
      <div className="swap-list">
        {others.map((m) => (
          <label key={m.id} className={`swap-item${target === m.id ? ' is-checked' : ''}`}>
            <input type="radio" name="swap-target" checked={target === m.id} onChange={() => setTarget(m.id)} />
            <span className="avatar avatar--sm" style={{ background: m.color }}>{m.initials}</span>
            <span>{m.name}{m.isSelf ? '（我）' : ''}</span>
          </label>
        ))}
      </div>
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" disabled={!target} onClick={() => { store.swapChore(task.id, target!); onClose() }}>
          <Repeat2 size={15} /> 确认换班
        </button>
      </div>
    </Modal>
  )
}

export function Chores() {
  const store = useStore()
  const [swapTask, setSwapTask] = useState<ChoreTask | null>(null)

  const tasks = choresThisWeek(store)
  const done = choresDoneCount(store)
  const { weekNumber, label } = weekRangeLabel()
  const nextGenerated = nextWeekGenerated(store)
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  const handleGenerate = () => {
    if (nextGenerated) return
    store.generateNextWeek()
  }

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">轮流分担，不靠催促</span><h1>清洁值日</h1><p>查看本周排班、完成任务，或和室友轻松换班。</p></div>
        <PlaceholderButton feature="新建值日任务" variant="primary"><Plus size={17} /> 新建任务</PlaceholderButton>
      </section>

      <section className="schedule-summary">
        <div>
          <span className="schedule-icon"><CalendarDays size={24} /></span>
          <div><small>第 {weekNumber} 周</small><strong>{label}</strong></div>
        </div>
        <div className="progress-copy">
          <span><strong>{done}</strong> / {tasks.length} 已完成</span>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        </div>
        <button className="button button--secondary" type="button" disabled={nextGenerated} onClick={handleGenerate} style={nextGenerated ? { opacity: 0.6 } : undefined}>
          <RefreshCw size={16} /> {nextGenerated ? '下周排班已生成' : '生成下周排班'}
        </button>
      </section>

      <section className="panel module-panel">
        <div className="panel__header">
          <div><h2>本周排班</h2><p>按公共区域轮换安排</p></div>
          <PlaceholderButton feature="排班规则设置" variant="ghost">管理轮换规则</PlaceholderButton>
        </div>
        <div className="chore-grid">
          {tasks.map((item) => {
            const member = getMember(store, item.assigneeId)
            const isDone = item.status === 'done'
            return (
              <article className={`chore-card ${isDone ? 'is-done' : ''}`} key={item.id}>
                <div className="chore-card__date"><strong>{item.dayLabel}</strong><span>{item.date}</span></div>
                <div className="chore-card__body">
                  <span className="avatar" style={{ background: member?.color }}>{member?.initials}</span>
                  <div><small>{member?.name}{item.swappedFromId ? '（已换班）' : ''}负责</small><strong>{item.title}</strong></div>
                </div>
                <span className={`tag ${isDone ? 'tag--success' : 'tag--warm'}`}>{isDone && <Check size={13} />}{isDone ? '已完成' : `截止 ${formatDue(item.dueAt)}`}</span>
                {isDone ? (
                  <PlaceholderButton feature={`${item.title}完成记录`} variant="ghost">查看记录</PlaceholderButton>
                ) : (
                  <div className="chore-actions">
                    <button className="button button--secondary" type="button" onClick={() => setSwapTask(item)}><Repeat2 size={15} /> 换班</button>
                    <button className="button button--primary" type="button" onClick={() => store.completeChore(item.id)}><Check size={15} /> 完成</button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="empty-preview"><Clock3 size={24} /><div><strong>接口预留：逾期提醒</strong><span>后续可在截止前提醒负责人，并保留任务完成记录。</span></div><PlaceholderButton feature="值日提醒设置" variant="secondary">设置提醒</PlaceholderButton></section>

      {swapTask && <SwapModal task={swapTask} onClose={() => setSwapTask(null)} />}
    </div>
  )
}