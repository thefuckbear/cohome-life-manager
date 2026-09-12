import { useState } from 'react'
import { BellRing, BookOpenCheck, Check, Clock3, Plus, Users } from 'lucide-react'
import { Modal } from '../components/Modal'
import { PlaceholderButton } from '../components/PlaceholderButton'
import { notify } from '../lib/placeholder'
import { getMember, getSelf } from '../lib/selectors'
import { useStore } from '../lib/store'
import type { Agreement, ID } from '../lib/types'

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

export function Agreements() {
  const store = useStore()
  const [remindAgreement, setRemindAgreement] = useState<Agreement | null>(null)

  const confirmCount = (agreementId: string) =>
    store.votes.filter((v) => v.agreementId === agreementId && v.agree).length
  const activeCount = store.agreements.filter((a) => a.status === 'active').length
  const votingCount = store.agreements.filter((a) => a.status === 'voting').length

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">有话说清楚，相处更自在</span><h1>室友公约</h1><p>共同讨论生活规则，全员同意后生效，违规可一键提醒。</p></div>
        <PlaceholderButton feature="发起新公约" variant="primary"><Plus size={17} /> 发起新公约</PlaceholderButton>
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
                  <span>{count} / {store.members.length} 位室友已确认</span>
                </div>
                {isActive ? (
                  <button className="button button--secondary" type="button" onClick={() => setRemindAgreement(item)}><BellRing size={15} /> 一键提醒</button>
                ) : (
                  <PlaceholderButton feature="公约确认" variant="primary">阅读并确认</PlaceholderButton>
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
    </div>
  )
}
