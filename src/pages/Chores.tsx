import { useEffect, useState } from 'react'
import { BellRing, CalendarDays, Check, Clock3, Plus, RefreshCw, Repeat2, UserPlus } from 'lucide-react'
import { Modal } from '../components/Modal'
import { notify } from '../lib/placeholder'
import {
  choresDoneCount,
  choresThisWeek,
  choreReminderStage,
  formatDue,
  getMember,
  getSelf,
  myChoreToday,
  nextWeekGenerated,
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

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

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

function SetupPlanModal({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [areas, setAreas] = useState<ChoreArea[]>(['kitchen', 'living', 'bathroom', 'trash'])
  const [members, setMembers] = useState<ID[]>(store.members.map((m) => m.id))

  const toggleArea = (a: ChoreArea) => {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }
  const toggleMember = (id: ID) => {
    setMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submit = () => {
    store.setupChorePlan(areas, members)
    notify('已自动生成本周值日排班')
    onClose()
  }

  return (
    <div className="form">
      <span className="form-label">选择要做的值日任务（可多选）</span>
      <div className="participant-list">
        {CHORE_AREAS.map(({ area, label, emoji }) => (
          <label key={area} className="participant-item">
            <input type="checkbox" checked={areas.includes(area)} onChange={() => toggleArea(area)} />
            <span>{emoji} {label}</span>
          </label>
        ))}
      </div>
      <span className="form-label">参加值日的室友（自动轮流分配）</span>
      <div className="participant-list">
        {store.members.map((m) => (
          <label key={m.id} className="participant-item">
            <input type="checkbox" checked={members.includes(m.id)} onChange={() => toggleMember(m.id)} />
            <span className="avatar avatar--sm" style={{ background: m.color }}>{m.initials}</span>
            <span>{m.name}{m.isSelf ? '（我）' : ''}</span>
          </label>
        ))}
      </div>
      <p className="form-label" style={{ color: '#7f8a83' }}>将生成 {areas.length} 项任务，按顺序轮流分给 {members.length} 位室友。</p>
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" disabled={!areas.length || !members.length} onClick={submit}><CalendarDays size={15} /> 自动生成排班</button>
      </div>
    </div>
  )
}

function AssignModal({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [area, setArea] = useState<ChoreArea>('kitchen')
  const [memberId, setMemberId] = useState<ID>(store.members[0]?.id ?? '')
  const [dayOffset, setDayOffset] = useState(0)

  const submit = () => {
    store.assignChoreTask(area, memberId, dayOffset)
    const member = getMember(store, memberId)
    notify(`已安排 ${member?.name} 在${WEEKDAYS[dayOffset]}负责${CHORE_AREAS.find((a) => a.area === area)?.label}`)
    onClose()
  }

  return (
    <div className="form">
      <span className="form-label">选择值日任务</span>
      <div className="participant-list">
        {CHORE_AREAS.map(({ area: a, label, emoji }) => (
          <label key={a} className="participant-item">
            <input type="radio" name="assign-area" checked={area === a} onChange={() => setArea(a)} />
            <span>{emoji} {label}</span>
          </label>
        ))}
      </div>
      <span className="form-label">指派给哪位室友</span>
      <div className="participant-list">
        {store.members.map((m) => (
          <label key={m.id} className="participant-item">
            <input type="radio" name="assign-member" checked={memberId === m.id} onChange={() => setMemberId(m.id)} />
            <span className="avatar avatar--sm" style={{ background: m.color }}>{m.initials}</span>
            <span>{m.name}{m.isSelf ? '（我）' : ''}</span>
          </label>
        ))}
      </div>
      <span className="form-label">在周几值日</span>
      <div className="participant-list">
        {WEEKDAYS.map((d, i) => (
          <label key={d} className="participant-item">
            <input type="radio" name="assign-day" checked={dayOffset === i} onChange={() => setDayOffset(i)} />
            <span>{d}</span>
          </label>
        ))}
      </div>
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" onClick={submit}><UserPlus size={15} /> 指定值日</button>
      </div>
    </div>
  )
}

export function Chores() {
  const store = useStore()
  const self = getSelf(store)
  const [swapTask, setSwapTask] = useState<ChoreTask | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [showAssign, setShowAssign] = useState(false)

  const tasks = choresThisWeek(store)
  const done = choresDoneCount(store)
  const { weekNumber, label } = weekRangeLabel()
  const nextGenerated = nextWeekGenerated(store)
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  const today = todayKey()
  const dueToday = tasks.filter((t) => t.status === 'pending' && (t.date === today || isOverdue(t)))
  const overdueCount = tasks.filter((t) => isOverdue(t)).length

  const myToday = self ? myChoreToday(store, self.id) : undefined
  const myStage = myToday ? choreReminderStage(myToday) : null

  useEffect(() => {
    if (!self) return
    const chore = myChoreToday(useStore.getState(), self.id)
    if (!chore || !('Notification' in window)) return
    if (Notification.permission === 'granted') {
      const stage = choreReminderStage(chore)
      const title = stage === 'due-soon' ? '值日临近截止' : '今日值日提醒'
      const body = stage === 'due-soon' ? `今晚 20:00 前完成「${chore.title}」` : `今天轮到你值日「${chore.title}」`
      new Notification(title, { body })
    } else if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [self])

  const handleGenerate = () => {
    if (nextGenerated) return
    store.generateNextWeek()
  }

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">轮流分担，不靠催促</span><h1>清洁值日</h1><p>填人 + 点选任务，自动生成公平排班，到期自动提醒。</p></div>
        <div className="header-actions">
          <button className="button button--secondary" type="button" onClick={() => setShowAssign(true)}><UserPlus size={16} /> 指定值日</button>
          <button className="button button--primary" type="button" onClick={() => setShowSetup(true)}><Plus size={17} /> 重新安排排班</button>
        </div>
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

      <section className="schedule-summary">
        <div>
          <span className="schedule-icon"><CalendarDays size={24} /></span>
          <div><small>第 {weekNumber} 周</small><strong>{label}</strong></div>
        </div>
        <div className="progress-copy">
          <span><strong>{done}</strong> / {tasks.length} 已完成{overdueCount > 0 ? ` · ${overdueCount} 项已逾期` : ''}</span>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        </div>
        <button className="button button--secondary" type="button" disabled={nextGenerated} onClick={handleGenerate} style={nextGenerated ? { opacity: 0.6 } : undefined}>
          <RefreshCw size={16} /> {nextGenerated ? '下周排班已生成' : '生成下周排班'}
        </button>
      </section>

      <section className="panel module-panel">
        <div className="panel__header">
          <div><h2>本周排班</h2><p>按公共区域自动轮换，逾期会高亮提醒</p></div>
        </div>
        <div className="chore-grid">
          {tasks.map((item) => {
            const member = getMember(store, item.assigneeId)
            const isDone = item.status === 'done'
            const overdue = isOverdue(item)
            return (
              <article className={`chore-card ${isDone ? 'is-done' : ''}`} key={item.id}>
                <div className="chore-card__date"><strong>{item.dayLabel}</strong><span>{item.date}</span></div>
                <div className="chore-card__body">
                  <span className="avatar" style={{ background: member?.color }}>{member?.initials}</span>
                  <div><small>{member?.name}{item.swappedFromId ? '（已换班）' : ''}负责</small><strong>{item.title}</strong></div>
                </div>
                <span className={`tag ${isDone ? 'tag--success' : overdue ? 'tag--danger' : 'tag--warm'}`}>{isDone && <Check size={13} />}{isDone ? '已完成' : overdue ? '已逾期' : `截止 ${formatDue(item.dueAt)}`}</span>
                {isDone ? (
                  <span className="tag tag--success">完成记录</span>
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

      {swapTask && <SwapModal task={swapTask} onClose={() => setSwapTask(null)} />}
      {showSetup && <Modal title="自动排班" onClose={() => setShowSetup(false)}><SetupPlanModal onClose={() => setShowSetup(false)} /></Modal>}
      {showAssign && <Modal title="指定值日" onClose={() => setShowAssign(false)}><AssignModal onClose={() => setShowAssign(false)} /></Modal>}
    </div>
  )
}
