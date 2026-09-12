import { useState } from 'react'
import { BellRing, Box, PackageCheck, Plus, ShoppingBasket } from 'lucide-react'
import { Modal } from '../components/Modal'
import { PlaceholderButton } from '../components/PlaceholderButton'
import {
  daysUntilRestock,
  getMember,
  nextBuyerFor,
  suppliesDueRestock,
  timeAgo,
  yuan,
} from '../lib/selectors'
import { useStore } from '../lib/store'
import type { Supply } from '../lib/types'

function PurchaseModal({ supply, onClose }: { supply: Supply; onClose: () => void }) {
  const store = useStore()
  const [priceYuan, setPriceYuan] = useState('')
  const [asExpense, setAsExpense] = useState(true)
  const [error, setError] = useState('')

  const submit = () => {
    const price = Math.round(parseFloat(priceYuan || '0') * 100)
    if (!(price > 0)) return setError('请填写正确的金额')
    store.recordPurchase(supply.id, price, asExpense)
    onClose()
  }

  return (
    <div className="form">
      <p className="form-label">你为「{supply.name}」补货，花了多少钱？</p>
      <div className="form-field">
        <label className="form-label" htmlFor="purchase-price">金额（元）</label>
        <input
          id="purchase-price"
          className="form-input"
          type="number"
          min="0"
          step="0.01"
          value={priceYuan}
          placeholder={supply.refPrice ? `参考价 ${yuan(supply.refPrice)}` : '0.00'}
          onChange={(e) => { setPriceYuan(e.target.value); setError('') }}
        />
      </div>
      <label className="participant-item" style={{ width: 'fit-content' }}>
        <input type="checkbox" checked={asExpense} onChange={(e) => setAsExpense(e.target.checked)} />
        <span>记入 AA 分摊（大家平摊这笔钱）</span>
      </label>
      {asExpense && (
        <p className="form-label" style={{ color: '#7f8a83' }}>将生成一笔「补货：{supply.name}」的费用，由 {store.members.length} 位室友均摊。</p>
      )}
      {error && <p className="form-error">{error}</p>}
      <div className="modal__footer">
        <button className="button button--secondary" type="button" onClick={onClose}>取消</button>
        <button className="button button--primary" type="button" onClick={submit}><ShoppingBasket size={15} /> 确认补货</button>
      </div>
    </div>
  )
}

export function Supplies() {
  const store = useStore()
  const [purchaseSupply, setPurchaseSupply] = useState<Supply | null>(null)
  const due = suppliesDueRestock(store)

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">轮流采购，不再总是一个人买</span><h1>公共物品</h1><p>登记常用物品，自动轮换采购负责人，买完一键记账。</p></div>
        <PlaceholderButton feature="登记公共物品" variant="primary"><Plus size={17} /> 登记物品</PlaceholderButton>
      </section>

      <section className="metric-row">
        <article className="metric-card"><span className="metric-icon metric-icon--purple"><Box size={20} /></span><div><small>已登记物品</small><strong>{store.supplies.length}</strong><span>按周期自动轮换负责人</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--orange"><BellRing size={20} /></span><div><small>该补货了</small><strong>{due.length}</strong><span>周期已到，轮到下一位</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--green"><PackageCheck size={20} /></span><div><small>累计采购</small><strong>{store.purchases.length}</strong><span>每次都可记入 AA 分摊</span></div></article>
      </section>

      <section className="panel module-panel">
        <div className="panel__header"><div><h2>物品采购</h2><p>谁上次买了，下次自动轮到别人</p></div></div>
        <div className="supply-grid">
          {store.supplies.map((supply) => {
            const next = nextBuyerFor(store, supply)
            const lastBuyer = supply.lastBuyerId ? getMember(store, supply.lastBuyerId) : undefined
            const days = daysUntilRestock(supply)
            const overdue = days <= 0
            return (
              <article className="supply-card" key={supply.id}>
                <div className="supply-card__top">
                  <span className="item-emoji item-emoji--large">{supply.emoji}</span>
                  <span className={`tag ${overdue ? 'tag--danger' : days <= 3 ? 'tag--warm' : 'tag--success'}`}>{overdue ? '该补货了' : `还有 ${days} 天`}</span>
                </div>
                <h3>{supply.name}</h3>
                <span className="supply-category">{supply.category} · 约每 {supply.cycleDays} 天补一次</span>
                <div className="supply-next">
                  <span className="avatar avatar--sm" style={{ background: next?.color }}>{next?.initials}</span>
                  <span>轮到 <strong>{next?.name}</strong> 采购</span>
                </div>
                <div className="supply-card__footer">
                  <span>{lastBuyer ? `上次 ${lastBuyer.name} 买 · ${supply.lastBoughtAt ? timeAgo(supply.lastBoughtAt) : ''}` : '尚未购买'}</span>
                  <button className="button button--primary" type="button" onClick={() => setPurchaseSupply(supply)}><ShoppingBasket size={14} /> 我买了</button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {purchaseSupply && (
        <Modal title="记录补货" onClose={() => setPurchaseSupply(null)}>
          <PurchaseModal supply={purchaseSupply} onClose={() => setPurchaseSupply(null)} />
        </Modal>
      )}
    </div>
  )
}
