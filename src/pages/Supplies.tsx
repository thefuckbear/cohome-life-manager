import { useState } from 'react'
import { Box, PackageCheck, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { Modal } from '../components/Modal'
import { notify } from '../lib/placeholder'
import { getMember, round2, timeAgo, yuan } from '../lib/selectors'
import { useStore } from '../lib/store'
import type { Supply } from '../lib/types'

const SUPPLY_CATEGORIES = ['日用清洁', '厨房用品', '洗护用品', '其他']

function RegisterModal({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🧻')
  const [category, setCategory] = useState(SUPPLY_CATEGORIES[0])
  const [priceYuan, setPriceYuan] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!name.trim()) return setError('请填写物品名称')
    const price = round2(parseFloat(priceYuan || '0'))
    if (!(price > 0)) return setError('请填写正确的购买金额')
    store.registerSupply(name.trim(), emoji || '📦', category, price)
    notify(`已登记「${name.trim()}」为公共物品，并生成 AA 账单`)
    onClose()
  }

  return (
    <div className="form">
      <p className="form-label" style={{ color: '#7f8a83' }}>登记后该物品成为公共物品，并自动生成一笔由全体室友 AA 分摊的账单。</p>
      <div className="form-row">
        <div className="form-field form-field--grow">
          <label className="form-label" htmlFor="sup-name">物品名称</label>
          <input id="sup-name" className="form-input" value={name} placeholder="例如：抽纸、洗洁精" onChange={(e) => { setName(e.target.value); setError('') }} />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="sup-emoji">图标</label>
          <input id="sup-emoji" className="form-input" value={emoji} placeholder="🧻" onChange={(e) => setEmoji(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="sup-category">分类</label>
          <select id="sup-category" className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {SUPPLY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="sup-price">购买金额（元）</label>
          <input id="sup-price" className="form-input" type="number" min="0" step="0.01" value={priceYuan} placeholder="0.00" onChange={(e) => { setPriceYuan(e.target.value); setError('') }} />
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" onClick={submit}><Plus size={15} /> 登记并生成账单</button>
      </div>
    </div>
  )
}

export function Supplies() {
  const store = useStore()
  const selfId = store.currentUserId
  const [showRegister, setShowRegister] = useState(false)

  const handleDelete = (supply: Supply) => {
    if (window.confirm(`确定移除公共物品「${supply.name}」吗？`)) {
      store.deleteSupply(supply.id)
      notify(`已移除公共物品「${supply.name}」`)
    }
  }

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">自愿登记，共同分担</span><h1>公共物品</h1><p>买了共用物品想让大家分摊？登记一下，自动生成 AA 账单。</p></div>
        <button className="button button--primary" type="button" onClick={() => setShowRegister(true)}><Plus size={17} /> 登记物品</button>
      </section>

      <section className="metric-row">
        <article className="metric-card"><span className="metric-icon metric-icon--purple"><Box size={20} /></span><div><small>公共物品</small><strong>{store.supplies.length}</strong><span>由室友自愿登记</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--orange"><PackageCheck size={20} /></span><div><small>累计采购记录</small><strong>{store.purchases.length}</strong><span>每笔都进了 AA 账单</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--green"><ReceiptText size={20} /></span><div><small>公共物品支出</small><strong>{store.expenses.filter((e) => e.supplyId).length} 笔</strong><span>在费用 AA 里可见</span></div></article>
      </section>

      <section className="panel module-panel">
        <div className="panel__header"><div><h2>物品清单</h2><p>谁登记谁负责删除，不强制轮换</p></div></div>
        <div className="supply-grid">
          {store.supplies.map((supply) => {
            const creator = getMember(store, supply.createdBy)
            const isMine = supply.createdBy === selfId
            return (
              <article className="supply-card" key={supply.id}>
                <div className="supply-card__top">
                  <span className="item-emoji item-emoji--large">{supply.emoji}</span>
                  <span className="tag tag--success">公共物品</span>
                </div>
                <h3>{supply.name}</h3>
                <span className="supply-category">{supply.category}{supply.refPrice ? ` · 参考价 ¥${yuan(supply.refPrice)}` : ''}</span>
                <div className="supply-next">
                  <span className="avatar avatar--sm" style={{ background: creator?.color }}>{creator?.initials}</span>
                  <span><strong>{creator?.name}</strong> 登记 · {timeAgo(supply.createdAt)}</span>
                </div>
                <div className="supply-card__footer">
                  <span>登记即生成 AA 账单</span>
                  {isMine ? (
                    <button className="button button--ghost" type="button" aria-label="移除物品" onClick={() => handleDelete(supply)}><Trash2 size={15} /> 移除</button>
                  ) : (
                    <span className="tag">他人登记</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {showRegister && (
        <Modal title="登记公共物品" onClose={() => setShowRegister(false)}>
          <RegisterModal onClose={() => setShowRegister(false)} />
        </Modal>
      )}
    </div>
  )
}
