import { useState } from 'react'
import { BellRing, BookOpenCheck, Check, Clock3, Plus, ThumbsUp, Trash2, Users } from 'lucide-react'
import { Modal } from '../components/Modal'
import { notify } from '../lib/placeholder'
import { getMember, getSelf } from '../lib/selectors'
import { useStore } from '../lib/store'
import type { Agreement, ID } from '../lib/types'

const CATEGORIES = ['作息', '访客', '费用', '卫生', '其他']

function RemindModal({ agreement, onClose }: { agreement: Agreement; onClose: () => void }) {
  const store = useStore()
  const self = getSelf(store)
  const [target, setTarget] = useState<ID | null>(null)
  const candidates = store.members.filter((m) => m.id !== self?.id)

  const submit = () => {
    if (!target) return
    const member = getMember(store, target)
    store.remindAgreement(agreement.id, target)
    notify(`已提醒 ${member?.name} 遵守「${agreement.title}」`)
    onClose()
  }

  return (
    <div className="form">
      <p className="form-label">就「{agreement.title}」提醒哪位室友？</p>
      <div className="swap-list">
        {candidates.map((m) => (
          <label key={m.id} className={`swap-item${target === m.id ? ' is-checked' : ''}`}>
            <input type="radio" name="remind-target" checked={target === m.id} onChange={() => setTarget(m.id)} />
            <span className="avatar avatar--sm" style={{ background: m.color }}>{m.initials}</span>
            <span>{m.name}</span>
          </label>
        ))}
      </div>
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" disabled={!target} onClick={submit}><BellRing size={15} /> 发送提醒</button>
      </div>
    </div>
  )
}

function ProposeModal({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [icon, setIcon] = useState('📌')
  const [error, setError] = useState('')

  const submit = () => {
    if (!title.trim()) return setError('请填写公约标题')
    if (!content.trim()) return setError('请填写公约内容')
    store.proposeAgreement(title.trim(), content.trim(), category, icon || '📌')
    notify(`已发起新公约「${title.trim()}」，等待室友确认`)
    onClose()
  }

  return (
    <div className="form">
      <div className="form-row">
        <div className="form-field form-field--grow">
          <label className="form-label" htmlFor="ag-title">公约标题</label>
          <input id="ag-title" className="form-input" value={title} placeholder="例如：宠物饲养规则" onChange={(e) => { setTitle(e.target.value); setError('') }} />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="ag-icon">图标</label>
          <input id="ag-icon" className="form-input" value={icon} placeholder="📌" onChange={(e) => setIcon(e.target.value)} />
        </div>
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="ag-category">分类</label>
        <select id="ag-category" className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="ag-content">公约内容</label>
        <textarea id="ag-content" className="form-input" style={{ height: '88px', padding: '9px 11px', resize: 'vertical' }} value={content} placeholder="描述具体规则，越具体越少争议" onChange={(e) => { setContent(e.target.value); setError('') }} />
      </div>
      <p className="form-label" style={{ color: '#7f8a83' }}>发起后需 {store.members.length} 位室友全部确认才会生效。</p>
      {error && <p className="form-error">{error}</p>}
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" onClick={submit}><Plus size={15} /> 发起公约</button>
      </div>
    </div>
  )
}

export function Agreements() {
  const store = useStore()
  const self = getSelf(store)
  const selfId = self?.id ?? ''
  const [remindAgreement, setRemindAgreement] = useState<Agreement | null>(null)
  const [showPropose, setShowPropose] = useState(false)

  const confirmCount = (agreementId: string) =>
    store.votes.filter((v) => v.agreementId === agreementId && v.agree).length
  const selfVoted = (agreementId: string) =>
    store.votes.some((v) => v.agreementId === agreementId && v.memberId === selfId)
  const activeCount = store.agreements.filter((a) => a.status === 'active').length
  const votingCount = store.agreements.filter((a) => a.status === 'voting').length

  const handleDelete = (agreement: Agreement) => {
    if (window.confirm(`确定删除公约「${agreement.title}」吗？`)) {
      store.deleteAgreement(agreement.id)
      notify(`已删除公约「${agreement.title}」`)
    }
  }

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">有话说清楚，相处更自在</span><h1>室友公约</h1><p>共同讨论生活规则，全员同意后生效，违规可一键提醒。</p></div>
        <button className="button button--primary" type="button" onClick={() => setShowPropose(true)}><Plus size={17} /> 发起新公约</button>
      </section>

      <section className="agreement-banner">
        <span className="agreement-banner__icon"><BookOpenCheck size={26} /></span>
        <div><small>{store.house.name}公约</small><strong>已共同生活 128 天</strong><p>当前共有 {activeCount} 条有效公约{votingCount > 0 ? `，${votingCount} 条等待确认` : ''}。</p></div>
        <div className="agreement-banner__members"><Users size={17} /><span>{store.members.length} / {store.members.length} 位成员</span></div>
      </section>

      <section className="panel module-panel">
        <div className="panel__header"><div><h2>当前公约</h2><p>全员确认后生效，违规可温和提醒</p></div></div>
        <div className="agreement-list">
          {store.agreements.map((item) => {
            const count = confirmCount(item.id)
            const isActive = item.status === 'active'
            const hasVoted = selfVoted(item.id)
            return (
              <article className="agreement-row" key={item.id}>
                <span className="agreement-emoji">{item.icon}</span>
                <div className="agreement-copy">
                  <div>
                    <span className="tag">{item.category}</span>
                    <span className={`tag ${isActive ? 'tag--success' : 'tag--warm'}`}>{isActive ? <Check size={12} /> : <Clock3 size={12} />}{isActive ? '已生效' : '待确认'}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                  <span>{count} / {store.members.length} 位室友已同意</span>
                </div>
                {isActive ? (
                  <div className="chore-actions">
                    <button className="button button--secondary" type="button" onClick={() => setRemindAgreement(item)}><BellRing size={15} /> 一键提醒</button>
                    {item.createdBy === selfId && (
                      <button className="button button--ghost" type="button" aria-label="删除公约" onClick={() => handleDelete(item)}><Trash2 size={15} /></button>
                    )}
                  </div>
                ) : hasVoted ? (
                  <span className="tag tag--success"><Check size={13} /> 我已同意</span>
                ) : (
                  <button className="button button--primary" type="button" onClick={() => { store.voteAgreement(item.id, true); notify(`已同意「${item.title}」，还需 ${store.members.length - count - 1} 位室友确认`) }}><ThumbsUp size={15} /> 同意</button>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {remindAgreement && (
        <Modal title="一键提醒" onClose={() => setRemindAgreement(null)}>
          <RemindModal agreement={remindAgreement} onClose={() => setRemindAgreement(null)} />
        </Modal>
      )}
      {showPropose && (
        <Modal title="发起新公约" onClose={() => setShowPropose(false)}>
          <ProposeModal onClose={() => setShowPropose(false)} />
        </Modal>
      )}
    </div>
  )
}
