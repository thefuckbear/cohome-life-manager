import { useState } from 'react'
import { BellRing, CalendarDays, Check, Plus, Repeat2, Trash2 } from 'lucide-react'
import { Modal } from '../components/Modal'
import { notify } from '../lib/placeholder'
import {
  addDaysLocal,
  choresDoneCount,
  choreCompletionCounts,
  choresThisWeek,
  choreReminderStage,
  currentMonday,
  dateKey,
  formatDue,
  getMember,
  getSelf,
  myChoreToday,
  timeAgo,
  weekRangeLabel,
} from '../lib/selectors'
import { useStore } from '../lib/store'
import type { ChoreArea, ChoreTask, ID } from '../lib/types'

const CHORE_AREAS: { area: ChoreArea; label: string; emoji: string }[] = [
  { area: 'kitchen', label: '厨房', emoji: '🍳' },
  { area: 'living', label: '客厅', emoji: '🛋️' },
  { area: 'bathroom', label: '卫生间', emoji: '🚿' },
  { area: 'trash', label: '垃圾', emoji: '🗑️' },
]

function todayKey() {
  const n = new Date()
  return `${String(n.getMonth() + 1).padStart(2, '0')}/${String(n.getDate()).padStart(2, '0')}`
}

function isOverdue(task: ChoreTask) {
  return task.status === 'pending' && new Date(task.dueAt).getTime() < Date.now()
}

function SwapModal({ task, onClose }: { task: ChoreTask; onClose: () => void }) {
  const store = useStore()
  const [target, setTarget] = useState<ID | null>(null)
  const others = store.members.filter((m) => m.houseId === store.currentHouseId && m.id !== task.assigneeId)

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
        <button className="button button--primary" type="button" disabled={!target} onClick={() => { store.swapChore(task.id, target!); notify('已发送换班邀请，等待对方回应'); onClose() }}>
          <Repeat2 size={15} /> 发送邀请
        </button>
      </div>
    </Modal>
  )
}

function ClaimModal({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const nextMonday = dateKey(addDaysLocal(currentMonday(), 7))
  const [area, setArea] = useState<ChoreArea>('kitchen')
  const [date, setDate] = useState(nextMonday)
  const [time, setTime] = useState('20:00')

  const submit = () => {
    store.assignChoreTask(area, date, time)
    notify(`已认领 ${date} ${time} 的值日任务`)
    onClose()
  }

  return (
    <div className="form">
      <p className="form-label" style={{ color: '#7f8a83' }}>只能为自己认领值日任务，室友之间靠「提醒」互相监督。</p>
      <span className="form-label">选择值日任务</span>
      <div className="participant-list">
        {CHORE_AREAS.map(({ area: a, label, emoji }) => (
          <label key={a} className="participant-item">
            <input type="radio" name="claim-area" checked={area === a} onChange={() => setArea(a)} />
            <span>{emoji} {label}</span>
          </label>
        ))}
      </div>
      <div className="form-row">
        <div className="form-field">
          <span className="form-label">值日日期</span>
          <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-field">
          <span className="form-label">截止时间</span>
          <input className="form-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <p className="form-label" style={{ color: '#9aa09c' }}>默认下周；截止前 10 分钟会收到通知。</p>
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" disabled={!date || !time} onClick={submit}><Plus size={15} /> 认领值日</button>
      </div>
    </div>
  )
}

function CompleteModal({ task, onClose }: { task: ChoreTask; onClose: () => void }) {
  const store = useStore()
  const [note, setNote] = useState('')

  return (
    <Modal title="完成值日" onClose={onClose}>
      <div className="form">
        <p className="form-label">完成「{task.title}」了？可留一句备注作为凭证。</p>
        <div className="form-field">
          <textarea
            className="form-input"
            style={{ height: '72px', padding: '9px 11px', resize: 'vertical' }}
            value={note}
            placeholder="例如：已拖地、倒垃圾、擦灶台"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="modal__footer">
          <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
          <button className="button button--primary" type="button" onClick={() => { store.completeChore(task.id, note); notify(note.trim() ? '已完成值日，备注已记录' : '已完成值日'); onClose() }}><Check size={15} /> 确认完成</button>
        </div>
      </div>
    </Modal>
  )
}

export function Chores() {
  const store = useStore()
  const self = getSelf(store)
  const selfId = self?.id ?? ''
  const [swapTask, setSwapTask] = useState<ChoreTask | null>(null)
  const [completeTask, setCompleteTask] = useState<ChoreTask | null>(null)
  const [showClaim, setShowClaim] = useState(false)

  const tasks = choresThisWeek(store)
  const done = choresDoneCount(store)
  const { weekNumber, label } = weekRangeLabel()
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  const today = todayKey()
  const dueToday = tasks.filter((t) => t.status === 'pending' && (t.date === today || isOverdue(t)))
  const overdueCount = tasks.filter((t) => isOverdue(t)).length

  const myToday = self ? myChoreToday(store, self.id) : undefined
  const myStage = myToday ? choreReminderStage(myToday) : null
  const myIncoming = store.swapRequests.filter((r) => r.toId === selfId && r.status === 'pending')
  const myOutgoing = store.swapRequests.filter((r) => r.fromId === selfId && r.status === 'pending')
  const choreCounts = choreCompletionCounts(store)

  const handleDelete = (task: ChoreTask) => {
    if (window.confirm(`确定删除值日任务「${task.title}」吗？`)) {
      store.deleteChoreTask(task.id)
      notify(`已删除值日任务「${task.title}」`)
    }
  }

  const handleRemind = (task: ChoreTask) => {
    store.remindChore(task.id)
    const assignee = getMember(store, task.assigneeId)
    notify(`已提醒 ${assignee?.name} 完成「${task.title}」`)
  }

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">自觉认领，互相提醒</span><h1>清洁值日</h1><p>为自己认领值日任务，室友之间靠一键提醒互相监督。</p></div>
        <button className="button button--primary" type="button" onClick={() => setShowClaim(true)}><Plus size={17} /> 认领值日</button>
      </section>

      {myToday && (
        <section className={`chore-reminder ${myStage === 'due-soon' ? 'is-due-soon' : ''}`}>
          <span className="chore-reminder__icon"><BellRing size={20} /></span>
          <div>
            <strong>{myStage === 'due-soon' ? '值日临近截止' : '今日轮到你值日'}</strong>
            <span>{myStage === 'due-soon' ? `今晚 20:00 前记得完成「${myToday.title}」` : `今天轮到你负责「${myToday.title}」，记得完成`}</span>
          </div>
        </section>
      )}

      {dueToday.length > 0 && (
        <section className="chore-reminder chore-reminder--team">
          <span className="chore-reminder__icon"><BellRing size={20} /></span>
          <div>
            <strong>今日值班提醒</strong>
            <span>{dueToday.map((t) => `${getMember(store, t.assigneeId)?.name}：${t.title}${isOverdue(t) ? '（已逾期）' : ''}`).join('　')}</span>
          </div>
        </section>
      )}

      {(myIncoming.length > 0 || myOutgoing.length > 0) && (
        <section className="panel module-panel">
          <div className="panel__header"><div><h2>换班邀请</h2><p>换班需对方同意才会生效</p></div></div>
          <div className="swap-request-list">
            {myIncoming.map((r) => {
              const task = store.choreTasks.find((c) => c.id === r.taskId)
              const from = getMember(store, r.fromId)
              return (
                <div className="swap-request" key={r.id}>
                  <div className="swap-request__main">
                    <strong>{from?.name} 想将「{task?.title ?? '值日任务'}」换给你</strong>
                    <span>{timeAgo(r.createdAt)}</span>
                  </div>
                  <button className="button button--secondary" type="button" onClick={() => { store.respondSwapRequest(r.id, false); notify('已拒绝换班邀请') }}>拒绝</button>
                  <button className="button button--primary" type="button" onClick={() => { store.respondSwapRequest(r.id, true); notify('已接受换班，任务归你了') }}>接受</button>
                </div>
              )
            })}
            {myOutgoing.map((r) => {
              const task = store.choreTasks.find((c) => c.id === r.taskId)
              const to = getMember(store, r.toId)
              return (
                <div className="swap-request" key={r.id}>
                  <div className="swap-request__main">
                    <strong>「{task?.title ?? '值日任务'}」已向 {to?.name} 发出换班邀请</strong>
                    <span>等待对方回应 · {timeAgo(r.createdAt)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="schedule-summary">
        <div>
          <span className="schedule-icon"><CalendarDays size={24} /></span>
          <div><small>第 {weekNumber} 周</small><strong>{label}</strong></div>
        </div>
        <div className="progress-copy">
          <span><strong>{done}</strong> / {tasks.length} 已完成{overdueCount > 0 ? ` · ${overdueCount} 项已逾期` : ''}</span>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        </div>
      </section>

      <section className="panel module-panel">
        <div className="panel__header">
          <div><h2>本周排班</h2><p>各自认领、自觉完成，逾期会高亮提醒</p></div>
        </div>
        <div className="chore-stats">
          <span className="chore-stats__label">本月完成</span>
          {store.members.filter((m) => m.houseId === store.currentHouseId).map((m) => (
            <span key={m.id} className="chore-stat">
              <span className="avatar avatar--sm" style={{ background: m.color }}>{m.initials}</span>
              <span>{m.name} · <strong>{choreCounts[m.id] ?? 0}</strong> 次</span>
            </span>
          ))}
        </div>
        <div className="chore-grid">
          {tasks.map((item) => {
            const member = getMember(store, item.assigneeId)
            const isDone = item.status === 'done'
            const overdue = isOverdue(item)
            const isMine = item.assigneeId === selfId
            const hasPendingSwap = store.swapRequests.some((r) => r.taskId === item.id && r.status === 'pending')
            return (
              <article className={`chore-card ${isDone ? 'is-done' : ''}`} key={item.id}>
                <div className="chore-card__date"><strong>{item.dayLabel}</strong><span>{item.date}</span></div>
                <div className="chore-card__body">
                  <span className="avatar" style={{ background: member?.color }}>{member?.initials}</span>
                  <div>
                    <small>{member?.name}{item.swappedFromId ? '（已换班）' : ''}负责</small>
                    <strong>{item.title}</strong>
                    {isDone && item.note && <small className="chore-note">📝 {item.note}</small>}
                  </div>
                </div>
                <span className={`tag ${isDone ? 'tag--success' : overdue ? 'tag--danger' : 'tag--warm'}`}>{isDone && <Check size={13} />}{isDone ? '已完成' : overdue ? '已逾期' : `截止 ${formatDue(item.dueAt)}`}</span>
                {isDone ? (
                  <span className="tag tag--success">完成记录</span>
                ) : isMine ? (
                  <div className="chore-actions">
                    <button className="button button--ghost" type="button" aria-label="删除任务" onClick={() => handleDelete(item)}><Trash2 size={15} /></button>
                    <button className="button button--secondary" type="button" disabled={hasPendingSwap} onClick={() => setSwapTask(item)}><Repeat2 size={15} /> {hasPendingSwap ? '邀请待回应' : '换班'}</button>
                    <button className="button button--primary" type="button" onClick={() => setCompleteTask(item)}><Check size={15} /> 完成</button>
                  </div>
                ) : (
                  <button className="button button--secondary" type="button" onClick={() => handleRemind(item)}><BellRing size={15} /> 提醒</button>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {swapTask && <SwapModal task={swapTask} onClose={() => setSwapTask(null)} />}
      {completeTask && <CompleteModal task={completeTask} onClose={() => setCompleteTask(null)} />}
      {showClaim && <Modal title="认领值日" onClose={() => setShowClaim(false)}><ClaimModal onClose={() => setShowClaim(false)} /></Modal>}
    </div>
  )
}
