import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowUpRight,
  BellRing,
  CalendarClock,
  Check,
  CircleDollarSign,
  Plus,
  ReceiptText,
  Settings2,
  Trash2,
  Wallet,
  WalletCards,
} from 'lucide-react'
import { Modal } from '../components/Modal'
import { notify } from '../lib/placeholder'
import {
  billProgress,
  dateKey,
  daysLeft,
  expenseStatus,
  expenseTotal,
  expenseShares,
  getMember,
  getSelf,
  monthlySummary,
  payableFor,
  round2,
  timeAgo,
  transferRecords,
  upcomingBills,
  yuan,
} from '../lib/selectors'
import { useStore } from '../lib/store'
import type { BillCycle, Expense, ExpenseCategory, ID, SplitMode } from '../lib/types'

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  rent: '房租',
  utility: '水电',
  daily: '日用品',
  internet: '网络',
  other: '其他',
}

const CATEGORY_EMOJI: Record<ExpenseCategory, string> = {
  rent: '🏠',
  utility: '⚡',
  daily: '🧻',
  internet: '📶',
  other: '🧾',
}

const ALL_CATEGORIES: (ExpenseCategory | 'all')[] = ['all', 'rent', 'utility', 'daily', 'internet', 'other']

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const store = useStore()
  const self = getSelf(store)
  const members = store.members.filter((m) => m.houseId === store.currentHouseId)
  const [title, setTitle] = useState('')
  const [amountYuan, setAmountYuan] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('utility')
  const [payerId, setPayerId] = useState<ID>(self?.id ?? '')
  const [date, setDate] = useState(dateKey(new Date()))
  const [splitMode, setSplitMode] = useState<SplitMode>(store.splitRule.mode === 'custom' ? 'custom' : 'equal')
  const defaultParticipants = store.splitRule.participantIds.length
    ? store.splitRule.participantIds.filter((id) => members.some((m) => m.id === id))
    : members.map((m) => m.id)
  const [participants, setParticipants] = useState<ID[]>(defaultParticipants)
  const [customAmounts, setCustomAmounts] = useState<Record<ID, string>>({})
  const [error, setError] = useState('')

  const total = round2(parseFloat(amountYuan || '0') || 0)

  const toggleParticipant = (id: ID) => {
    setError('')
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  const setCustom = (id: ID, value: string) => {
    setError('')
    setCustomAmounts((prev) => ({ ...prev, [id]: value }))
  }

  const othersSum = participants
    .filter((p) => p !== payerId)
    .reduce((sum, p) => sum + round2(parseFloat(customAmounts[p] || '0') || 0), 0)

  const submit = () => {
    if (!title.trim()) return setError('请填写费用名称')
    if (!(total > 0)) return setError('请填写正确的金额')
    if (participants.length < 1) return setError('至少选择一位参与人')
    if (splitMode === 'custom' && othersSum > total) {
      return setError('参与人金额之和不能超过总额')
    }
    let customAmountsFinal: Record<ID, number> | undefined
    if (splitMode === 'custom') {
      customAmountsFinal = {}
      for (const p of participants) {
        customAmountsFinal[p] = p === payerId ? total - othersSum : round2(parseFloat(customAmounts[p] || '0') || 0)
      }
    }
    store.addExpense({
      title: title.trim(),
      amount: total,
      category,
      payerId,
      date,
      splitMode,
      participants,
      customAmounts: customAmountsFinal,
    })
    onDone()
  }

  return (
    <div className="form">
      <div className="form-row">
        <div className="form-field form-field--grow">
          <label className="form-label" htmlFor="expense-title">费用名称</label>
          <input id="expense-title" className="form-input" value={title} placeholder="例如：9 月电费" onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="expense-amount">金额（元）</label>
          <input id="expense-amount" className="form-input" type="number" min="0" step="0.01" value={amountYuan} placeholder="0.00" onChange={(e) => setAmountYuan(e.target.value)} />
        </div>
      </div>
      <div className="form-row form-row--3">
        <div className="form-field">
          <label className="form-label" htmlFor="expense-category">分类</label>
          <select id="expense-category" className="form-select" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {(Object.keys(CATEGORY_LABEL) as ExpenseCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <span className="form-label">付款人</span>
          <div className="payer-fixed">
            <span className="avatar avatar--sm" style={{ background: self?.color }}>{self?.initials}</span>
            <strong>{self?.name}（我）</strong>
          </div>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="expense-date">日期</label>
          <input id="expense-date" className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="form-field">
        <span className="form-label">分摊方式</span>
        <div className="split-choice">
          <label className={`split-radio${splitMode === 'equal' ? ' is-checked' : ''}`}>
            <input type="radio" name="split" checked={splitMode === 'equal'} onChange={() => { setSplitMode('equal'); setError('') }} />
            平均分摊
          </label>
          <label className={`split-radio${splitMode === 'custom' ? ' is-checked' : ''}`}>
            <input type="radio" name="split" checked={splitMode === 'custom'} onChange={() => { setSplitMode('custom'); setError('') }} />
            自定义金额
          </label>
        </div>
      </div>

      <div className="form-field">
        <span className="form-label">参与分摊的室友</span>
        <div className="participant-list">
          {members.map((m) => (
            <label key={m.id} className="participant-item">
              <input
                type="checkbox"
                checked={participants.includes(m.id)}
                disabled={m.id === payerId}
                onChange={() => toggleParticipant(m.id)}
              />
              <span className="avatar avatar--sm" style={{ background: m.color }}>{m.initials}</span>
              <span>{m.name}{m.id === payerId ? '（付款人，必选）' : ''}</span>
            </label>
          ))}
        </div>
      </div>

      {splitMode === 'custom' && (
        <div className="form-field">
          <span className="form-label">每人金额（元，付款人自动补差）</span>
          <div className="custom-amounts">
            {members
              .filter((m) => participants.includes(m.id))
              .map((m) => {
                const isPayer = m.id === payerId
                const auto = Math.max(0, total - othersSum)
                return (
                  <div key={m.id} className="custom-amount-row">
                    <span className="avatar avatar--sm" style={{ background: m.color }}>{m.initials}</span>
                    <span className="custom-amount-name">{m.name}{isPayer ? '（补差）' : ''}</span>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={isPayer}
                      value={isPayer ? (auto / 100).toFixed(2) : customAmounts[m.id] ?? ''}
                      placeholder={isPayer ? '自动' : '0.00'}
                      onChange={(e) => setCustom(m.id, e.target.value)}
                    />
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onDone}>取消</button>
        <button className="button button--primary" type="button" onClick={submit}><Plus size={15} /> 记入账单</button>
      </div>
    </div>
  )
}

function ExpenseDetail({ expenseId, onClose, onNeedRecharge }: { expenseId: ID; onClose: () => void; onNeedRecharge: () => void }) {
  const store = useStore()
  const selfId = store.currentUserId
  const expense = store.expenses.find((e) => e.id === expenseId)
  if (!expense) return null
  const payer = getMember(store, expense.payerId)
  const shares = expenseShares(store, expenseId)
  const myUnsettled = shares.find((s) => !s.settled && s.memberId === selfId)

  const handleSettle = (shareId: ID) => {
    const result = store.settleShare(expense.id, shareId)
    if (result === 'insufficient') {
      notify('余额不足，请先充值')
      onNeedRecharge()
    } else if (result === 'ok') {
      notify('已结清')
    }
  }

  return (
    <div>
      <div className="detail-summary">
        <span className="item-emoji item-emoji--large">{CATEGORY_EMOJI[expense.category]}</span>
        <div>
          <h3>{expense.title}</h3>
          <p>{payer?.name} 支付 · {expense.date} · {CATEGORY_LABEL[expense.category]}</p>
        </div>
        <strong className="detail-amount">¥{yuan(expense.amount)}</strong>
      </div>
      <div className="detail-rows">
        {shares.map((s) => {
          const member = getMember(store, s.memberId)
          const isMine = s.memberId === selfId
          return (
            <div className="detail-row" key={s.id}>
              <span className="avatar avatar--sm" style={{ background: member?.color }}>{member?.initials}</span>
              <div className="detail-row__main">
                <strong>{member?.name}{isMine ? '（我）' : ''}</strong>
                <span>{s.memberId === expense.payerId ? '垫付人' : '参与分摊'}</span>
              </div>
              <span className={`tag ${s.settled ? 'tag--success' : 'tag--warm'}`}>{s.settled && <Check size={12} />}{s.settled ? '已结清' : '待结算'}</span>
              <strong>¥{yuan(s.amount)}</strong>
              {!s.settled && isMine && (
                <button className="button button--ghost" type="button" onClick={() => handleSettle(s.id)}>
                  标记已结清
                </button>
              )}
              {!s.settled && !isMine && (
                <button className="button button--ghost" type="button" onClick={() => { store.remindExpense(expense.id, s.memberId); notify(`已提醒 ${member?.name} 结清「${expense.title}」`) }}>
                  <BellRing size={13} /> 催缴
                </button>
              )}
            </div>
          )
        })}
      </div>
      {myUnsettled && (
        <div className="modal__footer">
          <button className="button button--primary button--full" type="button" onClick={() => handleSettle(myUnsettled.id)}>
            结清我的这笔分摊
          </button>
        </div>
      )}
    </div>
  )
}

function SplitRuleModal({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [mode, setMode] = useState<'equal' | 'custom'>(store.splitRule.mode)
  const [participantIds, setParticipantIds] = useState<ID[]>(store.splitRule.participantIds)

  const toggleMember = (id: ID) => {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submit = () => {
    store.saveSplitRule({ mode, participantIds })
    notify('分摊规则已保存，新账单将默认使用')
    onClose()
  }

  return (
    <div className="form">
      <span className="form-label">默认分摊方式</span>
      <div className="split-choice">
        <label className={`split-radio${mode === 'equal' ? ' is-checked' : ''}`}>
          <input type="radio" name="rule-mode" checked={mode === 'equal'} onChange={() => setMode('equal')} />
          平均分摊
        </label>
        <label className={`split-radio${mode === 'custom' ? ' is-checked' : ''}`}>
          <input type="radio" name="rule-mode" checked={mode === 'custom'} onChange={() => setMode('custom')} />
          自定义金额
        </label>
      </div>
      <span className="form-label">默认参与人（不勾选 = 全体成员）</span>
      <div className="participant-list">
        {store.members.filter((m) => m.houseId === store.currentHouseId).map((m) => (
          <label key={m.id} className="participant-item">
            <input type="checkbox" checked={participantIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
            <span className="avatar avatar--sm" style={{ background: m.color }}>{m.initials}</span>
            <span>{m.name}</span>
          </label>
        ))}
      </div>
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" onClick={submit}><Settings2 size={15} /> 保存规则</button>
      </div>
    </div>
  )
}

function BillModal({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [title, setTitle] = useState('')
  const [amountYuan, setAmountYuan] = useState('')
  const [dueDate, setDueDate] = useState(dateKey(new Date()))
  const [cycle, setCycle] = useState<BillCycle>('monthly')
  const [error, setError] = useState('')

  const submit = () => {
    if (!title.trim()) return setError('请填写缴费名称')
    const amount = round2(parseFloat(amountYuan || '0'))
    if (!(amount > 0)) return setError('请填写正确的金额')
    if (!dueDate) return setError('请选择截止日期')
    store.addBillReminder(title.trim(), amount, dueDate, cycle)
    notify(`已发起共同缴费「${title.trim()}」，全员付款后款项汇给你`)
    onClose()
  }

  return (
    <div className="form">
      <p className="form-label" style={{ color: '#7f8a83' }}>水电燃气等共同缴费：你作为发起人，室友各自付款，全部付清后款项汇入你的余额。</p>
      <div className="form-field">
        <label className="form-label" htmlFor="bill-title">缴费名称</label>
        <input id="bill-title" className="form-input" value={title} placeholder="例如：9 月电费" onChange={(e) => { setTitle(e.target.value); setError('') }} />
      </div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="bill-amount">金额（元）</label>
          <input id="bill-amount" className="form-input" type="number" min="0" step="0.01" value={amountYuan} placeholder="0.00" onChange={(e) => { setAmountYuan(e.target.value); setError('') }} />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="bill-due">截止日期</label>
          <input id="bill-due" className="form-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="bill-cycle">循环周期</label>
        <select id="bill-cycle" className="form-select" value={cycle} onChange={(e) => setCycle(e.target.value as BillCycle)}>
          <option value="once">仅一次</option>
          <option value="weekly">每周循环</option>
          <option value="monthly">每月循环</option>
          <option value="yearly">每年循环</option>
        </select>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" onClick={submit}><CalendarClock size={15} /> 发起缴费</button>
      </div>
    </div>
  )
}

function RechargeModal({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const self = getSelf(store)
  const [amountYuan, setAmountYuan] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    const amount = round2(parseFloat(amountYuan || '0'))
    if (!(amount > 0)) return setError('请输入正确的充值金额')
    store.recharge(amount)
    notify(`已充值 ¥${amount.toFixed(2)}`)
    onClose()
  }

  return (
    <div className="form">
      <p className="form-label">当前余额：¥{yuan(self?.balance ?? 0)}</p>
      <div className="form-field">
        <label className="form-label" htmlFor="recharge-amount">充值金额（元）</label>
        <input id="recharge-amount" className="form-input" type="number" min="0" step="0.01" value={amountYuan} placeholder="0.00" onChange={(e) => { setAmountYuan(e.target.value); setError('') }} />
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" onClick={submit}><Wallet size={15} /> 确认充值</button>
      </div>
    </div>
  )
}

export function Expenses() {
  const store = useStore()
  const self = getSelf(store)
  const selfId = self?.id ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [showRule, setShowRule] = useState(false)
  const [showRecharge, setShowRecharge] = useState(false)
  const [detailId, setDetailId] = useState<ID | null>(null)
  const [filter, setFilter] = useState<ExpenseCategory | 'all'>('all')
  const [showBill, setShowBill] = useState(false)

  useEffect(() => {
    if (searchParams.get('recharge') === '1') {
      setShowRecharge(true)
      searchParams.delete('recharge')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const payable = payableFor(store, selfId)
  const total = expenseTotal(store)
  const transfers = transferRecords(store)
  const summary = monthlySummary(store)
  const billsDue = upcomingBills(store)
  const catOrder: ExpenseCategory[] = ['rent', 'utility', 'daily', 'internet', 'other']
  const maxCat = Math.max(1, ...catOrder.map((c) => summary.byCategory[c] ?? 0))
  const bills = [...store.expenses]
    .filter((b) => filter === 'all' || b.category === filter)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const handleSettleAll = () => {
    if (window.confirm('确定结清我的所有待结算分摊吗？')) {
      const result = store.settleAll()
      if (result === 'none') notify('没有待结算的费用')
      else if (result === 'insufficient') {
        notify('余额不足，请先充值')
        setShowRecharge(true)
      }
    }
  }

  const handleDelete = (bill: Expense) => {
    if (window.confirm(`确定删除账单「${bill.title}」吗？该账单的分摊记录会一并删除。`)) {
      store.deleteExpense(bill.id)
      notify(`已删除账单「${bill.title}」`)
    }
  }

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">费用透明，关系轻松</span><h1>费用 AA</h1><p>记录每一笔共同支出，自动算清谁该付给谁。</p></div>
        <button className="button button--primary" type="button" onClick={() => setShowForm(true)}><Plus size={17} /> 记一笔费用</button>
      </section>

      <section className="metric-row">
        <article className="metric-card"><span className="metric-icon metric-icon--orange"><ArrowUpRight size={20} /></span><div><small>我需要支付</small><strong>¥{yuan(payable.total)}</strong><span>共 {payable.count} 笔待结算</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--purple"><CircleDollarSign size={20} /></span><div><small>共同支出总额</small><strong>¥{yuan(total)}</strong><span>已记录 {store.expenses.filter((e) => e.houseId === store.currentHouseId).length} 笔费用</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--green"><Wallet size={20} /></span><div><small>我的余额</small><strong>¥{yuan(self?.balance ?? 0)}</strong><button className="button button--ghost" type="button" style={{ padding: 0, minHeight: 24 }} onClick={() => setShowRecharge(true)}><Wallet size={12} /> 充值</button></div></article>
      </section>

      {transfers.length > 0 && (
        <section className="panel module-panel">
          <div className="panel__header">
            <div><h2>转账记录</h2><p>结清账单时，钱自动转到垫付人余额</p></div>
            <span className="tag tag--warm">{transfers.length} 笔</span>
          </div>
          <div className="settlement-list">
            {transfers.slice(0, 8).map((t) => {
              const from = getMember(store, t.fromId)
              const to = getMember(store, t.toId)
              return (
                <div className="settlement-row" key={t.id}>
                  <span className="avatar avatar--sm" style={{ background: from?.color }}>{from?.initials}</span>
                  <strong>{from?.name}</strong>
                  <span className="settlement-arrow">转给</span>
                  <span className="avatar avatar--sm" style={{ background: to?.color }}>{to?.initials}</span>
                  <strong>{to?.name}</strong>
                  <span className="settlement-amount">¥{yuan(t.amount)}</span>
                  <span className="settlement-arrow">{timeAgo(t.at)}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="panel module-panel">
        <div className="panel__header">
          <div><h2>本月支出</h2><p>{summary.count} 笔 · {summary.prevTotal > 0 ? `上月 ¥${yuan(summary.prevTotal)}` : '上月无记录'}</p></div>
          <strong className="table-amount">¥{yuan(summary.total)}</strong>
        </div>
        <div className="category-bars">
          {catOrder.filter((c) => summary.byCategory[c]).map((c) => (
            <div className="category-bar" key={c}>
              <span className="category-bar__label">{CATEGORY_EMOJI[c]} {CATEGORY_LABEL[c]}</span>
              <div className="category-bar__track"><span style={{ width: `${((summary.byCategory[c] ?? 0) / maxCat) * 100}%` }} /></div>
              <strong className="category-bar__amount">¥{yuan(summary.byCategory[c])}</strong>
            </div>
          ))}
          {summary.total === 0 && <p className="form-label" style={{ color: '#99a09b' }}>本月还没有账单，记一笔试试。</p>}
        </div>
      </section>

      <section className="panel module-panel">
        <div className="panel__header">
          <div><h2>账单</h2><p>所有共同费用都在这里</p></div>
          <div className="header-actions">
            <select className="form-select" style={{ height: 36, width: 108 }} value={filter} onChange={(e) => setFilter(e.target.value as ExpenseCategory | 'all')}>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c === 'all' ? '全部账单' : CATEGORY_LABEL[c as ExpenseCategory]}</option>
              ))}
            </select>
            <button className="button button--secondary" type="button" onClick={() => setShowRule(true)}><Settings2 size={16} /> 分摊规则</button>
            <button className="button button--primary" type="button" onClick={handleSettleAll}><WalletCards size={16} /> 结清我的待结算</button>
          </div>
        </div>
        <div className="table-list">
          {bills.length === 0 && (
            <div className="table-row"><div className="table-row__main"><strong>该分类下暂无账单</strong><span>换个分类试试</span></div></div>
          )}
          {bills.map((bill) => {
            const payer = getMember(store, bill.payerId)
            const status = expenseStatus(store, bill, selfId)
            const canDelete = bill.createdBy ? bill.createdBy === selfId : bill.payerId === selfId
            return (
              <article className="table-row" key={bill.id}>
                <span className="item-emoji">{CATEGORY_EMOJI[bill.category]}</span>
                <div className="table-row__main"><strong>{bill.title}</strong><span>{payer?.name} 支付 · {bill.date}</span></div>
                <strong className="table-amount">¥{yuan(bill.amount)}</strong>
                <span className={`tag tag--${status.kind}`}>{status.label}</span>
                <button className="button button--ghost" type="button" onClick={() => setDetailId(bill.id)}>查看明细</button>
                {canDelete && (
                  <button className="button button--ghost" type="button" aria-label="删除账单" onClick={() => handleDelete(bill)}><Trash2 size={15} /></button>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel module-panel">
        <div className="panel__header">
          <div><h2>共同缴费</h2><p>水电类缴费：到期前付款，全员付清款项汇给发起人</p></div>
          <button className="button button--secondary" type="button" onClick={() => setShowBill(true)}><CalendarClock size={16} /> 发起缴费</button>
        </div>
        <div className="table-list">
          {billsDue.length === 0 && (
            <div className="table-row"><div className="table-row__main"><strong>暂无待缴的共同缴费</strong><span>都缴清啦</span></div></div>
          )}
          {billsDue.map((bill) => {
            const left = daysLeft(bill)
            const overdue = left < 0
            const soon = left >= 0 && left <= 3
            const initiator = getMember(store, bill.initiatorId)
            const prog = billProgress(store, bill)
            const cycleLabel = bill.cycle === 'once' ? '仅一次' : bill.cycle === 'weekly' ? '每周' : bill.cycle === 'monthly' ? '每月' : '每年'
            return (
              <article className="table-row" key={bill.id}>
                <span className="item-emoji">🧾</span>
                <div className="table-row__main">
                  <strong>{bill.title}</strong>
                  <span>{initiator?.name} 发起 · {bill.dueDate} 截止 · {cycleLabel}循环 · 已付 {prog.paidCount}/{prog.memberCount} 人</span>
                </div>
                <strong className="table-amount">¥{yuan(bill.amount)}</strong>
                <span className={`tag ${overdue ? 'tag--danger' : soon ? 'tag--warm' : 'tag--success'}`}>{overdue ? `已逾期 ${-left} 天` : left === 0 ? '今天截止' : `还有 ${left} 天`}</span>
                {prog.myPaid ? (
                  <span className="tag tag--success"><Check size={13} /> 我已付款</span>
                ) : (
                  <button className="button button--primary" type="button" onClick={() => {
                    const r = store.payBill(bill.id)
                    if (r === 'insufficient') { notify('余额不足，请先充值'); setShowRecharge(true) }
                    else if (r === 'ok') notify(`已付 ¥${yuan(prog.perMember)}，${prog.allPaid ? '全员已缴，款项已汇给发起人' : `还差 ${prog.memberCount - prog.paidCount - 1} 人`}`)
                  }}>付 ¥{yuan(prog.perMember)}</button>
                )}
                {bill.createdBy === selfId && (
                  <button className="button button--ghost" type="button" aria-label="删除缴费" onClick={() => store.deleteBillReminder(bill.id)}><Trash2 size={15} /></button>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {showForm && (
        <Modal title="记一笔费用" onClose={() => setShowForm(false)}>
          <ExpenseForm onDone={() => setShowForm(false)} />
        </Modal>
      )}
      {showRule && (
        <Modal title="分摊规则" onClose={() => setShowRule(false)}>
          <SplitRuleModal onClose={() => setShowRule(false)} />
        </Modal>
      )}
      {detailId && (
        <Modal title="费用明细" onClose={() => setDetailId(null)}>
          <ExpenseDetail expenseId={detailId} onClose={() => setDetailId(null)} onNeedRecharge={() => setShowRecharge(true)} />
        </Modal>
      )}
      {showBill && (
        <Modal title="登记缴费日" onClose={() => setShowBill(false)}>
          <BillModal onClose={() => setShowBill(false)} />
        </Modal>
      )}
      {showRecharge && (
        <Modal title="充值" onClose={() => setShowRecharge(false)}>
          <RechargeModal onClose={() => setShowRecharge(false)} />
        </Modal>
      )}
    </div>
  )
}
