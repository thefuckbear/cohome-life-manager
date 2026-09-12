import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CircleDollarSign,
  Filter,
  Plus,
  ReceiptText,
  WalletCards,
} from 'lucide-react'
import { Modal } from '../components/Modal'
import { PlaceholderButton } from '../components/PlaceholderButton'
import {
  computeSettlements,
  dateKey,
  expenseStatus,
  expenseTotal,
  expenseShares,
  getMember,
  getSelf,
  payableFor,
  receivableFor,
  yuan,
  yuanToFen,
} from '../lib/selectors'
import { useStore } from '../lib/store'
import type { Expense, ExpenseCategory, ID, SplitMode } from '../lib/types'

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

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const store = useStore()
  const self = getSelf(store)
  const [title, setTitle] = useState('')
  const [amountYuan, setAmountYuan] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('utility')
  const [payerId, setPayerId] = useState<ID>(self?.id ?? '')
  const [date, setDate] = useState(dateKey(new Date()))
  const [splitMode, setSplitMode] = useState<SplitMode>('equal')
  const [participants, setParticipants] = useState<ID[]>([self?.id ?? ''])
  const [customAmounts, setCustomAmounts] = useState<Record<ID, string>>({})
  const [error, setError] = useState('')

  const total = yuanToFen(parseFloat(amountYuan || '0') || 0)

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
    .reduce((sum, p) => sum + yuanToFen(parseFloat(customAmounts[p] || '0') || 0), 0)

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
        customAmountsFinal[p] = p === payerId ? total - othersSum : yuanToFen(parseFloat(customAmounts[p] || '0') || 0)
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
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="expense-category">分类</label>
          <select id="expense-category" className="form-select" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {(Object.keys(CATEGORY_LABEL) as ExpenseCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="expense-payer">付款人</label>
          <select id="expense-payer" className="form-select" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
            {store.members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}{m.isSelf ? '（我）' : ''}</option>
            ))}
          </select>
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
          {store.members.map((m) => (
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
            {store.members
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

function ExpenseDetail({ expenseId, onClose }: { expenseId: ID; onClose: () => void }) {
  const store = useStore()
  const expense = store.expenses.find((e) => e.id === expenseId)
  if (!expense) return null
  const payer = getMember(store, expense.payerId)
  const shares = expenseShares(store, expenseId)
  const unsettled = shares.filter((s) => !s.settled).length

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
          return (
            <div className="detail-row" key={s.id}>
              <span className="avatar avatar--sm" style={{ background: member?.color }}>{member?.initials}</span>
              <div className="detail-row__main">
                <strong>{member?.name}{member?.isSelf ? '（我）' : ''}</strong>
                <span>{s.memberId === expense.payerId ? '垫付人' : '参与分摊'}</span>
              </div>
              <span className={`tag ${s.settled ? 'tag--success' : 'tag--warm'}`}>{s.settled && <Check size={12} />}{s.settled ? '已结清' : '待结算'}</span>
              <strong>¥{yuan(s.amount)}</strong>
              {!s.settled && (
                <button className="button button--ghost" type="button" onClick={() => store.settleShare(expense.id, s.id)}>
                  标记已结清
                </button>
              )}
            </div>
          )
        })}
      </div>
      {unsettled > 0 && (
        <div className="modal__footer">
          <button className="button button--primary button--full" type="button" onClick={() => store.settleShare(expense.id, shares.find((s) => !s.settled)!.id)}>
            结清这笔费用
          </button>
        </div>
      )}
    </div>
  )
}

export function Expenses() {
  const store = useStore()
  const self = getSelf(store)
  const selfId = self?.id ?? ''
  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState<ID | null>(null)

  const payable = payableFor(store, selfId)
  const receivable = receivableFor(store, selfId)
  const total = expenseTotal(store)
  const settlements = computeSettlements(store)
  const bills = [...store.expenses].sort((a, b) => (a.date < b.date ? 1 : -1))

  const handleSettleAll = () => {
    if (window.confirm('确定一键结清所有待结算费用吗？')) {
      store.settleAll()
    }
  }

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">费用透明，关系轻松</span><h1>费用 AA</h1><p>记录每一笔共同支出，自动算清谁该付给谁。</p></div>
        <PlaceholderButton feature="新增费用" variant="primary" onClick={() => setShowForm(true)}><Plus size={17} /> 记一笔费用</PlaceholderButton>
      </section>

      <section className="metric-row">
        <article className="metric-card"><span className="metric-icon metric-icon--orange"><ArrowUpRight size={20} /></span><div><small>我需要支付</small><strong>¥{yuan(payable.total)}</strong><span>共 {payable.count} 笔待结算</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--green"><ArrowDownLeft size={20} /></span><div><small>我将收到</small><strong>¥{yuan(receivable.total)}</strong><span>来自室友的待结算</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--purple"><CircleDollarSign size={20} /></span><div><small>共同支出总额</small><strong>¥{yuan(total)}</strong><span>已记录 {store.expenses.length} 笔费用</span></div></article>
      </section>

      {settlements.length > 0 && (
        <section className="panel module-panel">
          <div className="panel__header">
            <div><h2>结算方案</h2><p>按下面转账，账就平了</p></div>
            <span className="tag tag--warm">{settlements.length} 笔转账</span>
          </div>
          <div className="settlement-list">
            {settlements.map((s) => {
              const from = getMember(store, s.from)
              const to = getMember(store, s.to)
              return (
                <div className="settlement-row" key={`${s.from}-${s.to}`}>
                  <span className="avatar avatar--sm" style={{ background: from?.color }}>{from?.initials}</span>
                  <strong>{from?.name}</strong>
                  <span className="settlement-arrow">转给</span>
                  <span className="avatar avatar--sm" style={{ background: to?.color }}>{to?.initials}</span>
                  <strong>{to?.name}</strong>
                  <span className="settlement-amount">¥{yuan(s.amount)}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="panel module-panel">
        <div className="panel__header">
          <div><h2>账单</h2><p>所有共同费用都在这里</p></div>
          <div className="header-actions">
            <PlaceholderButton feature="账单筛选" variant="secondary"><Filter size={16} /> 筛选</PlaceholderButton>
            <button className="button button--primary" type="button" onClick={handleSettleAll}><WalletCards size={16} /> 一键结算</button>
          </div>
        </div>
        <div className="table-list">
          {bills.map((bill) => {
            const payer = getMember(store, bill.payerId)
            const status = expenseStatus(store, bill, selfId)
            return (
              <article className="table-row" key={bill.id}>
                <span className="item-emoji">{CATEGORY_EMOJI[bill.category]}</span>
                <div className="table-row__main"><strong>{bill.title}</strong><span>{payer?.name} 支付 · {bill.date}</span></div>
                <strong className="table-amount">¥{yuan(bill.amount)}</strong>
                <span className={`tag tag--${status.kind}`}>{status.label}</span>
                <button className="button button--ghost" type="button" onClick={() => setDetailId(bill.id)}>查看明细</button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="empty-preview"><ReceiptText size={24} /><div><strong>接口预留：分摊规则</strong><span>后续支持按比例分摊与账单导出。</span></div><PlaceholderButton feature="分摊规则设置" variant="secondary">设置规则</PlaceholderButton></section>

      {showForm && (
        <Modal title="记一笔费用" onClose={() => setShowForm(false)}>
          <ExpenseForm onDone={() => setShowForm(false)} />
        </Modal>
      )}
      {detailId && (
        <Modal title="费用明细" onClose={() => setDetailId(null)}>
          <ExpenseDetail expenseId={detailId} onClose={() => setDetailId(null)} />
        </Modal>
      )}
    </div>
  )
}