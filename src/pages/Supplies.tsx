import { BellRing, Box, ListPlus, PackageCheck, Plus, ShoppingBasket } from 'lucide-react'
import { PlaceholderButton } from '../components/PlaceholderButton'
import { triggerNotice } from '../lib/placeholder'
import { useLocalStorageState } from '../lib/useLocalStorageState'

const supplies = [
  { name: '抽纸', category: '日用清洁', level: 18, state: '即将用完', buyer: '小周', emoji: '🧻' },
  { name: '洗洁精', category: '厨房用品', level: 28, state: '较少', buyer: '小林', emoji: '🧴' },
  { name: '垃圾袋', category: '日用清洁', level: 72, state: '充足', buyer: '小夏', emoji: '🗑️' },
  { name: '洗衣液', category: '洗护用品', level: 88, state: '充足', buyer: '小周', emoji: '🧺' },
]

export function Supplies() {
  const [levels, setLevels] = useLocalStorageState<Record<string, number>>('cohome:supplies:levels', {})

  const updateSupply = (name: string, originalLevel: number) => {
    const currentLevel = levels[name] ?? originalLevel
    const nextLevel = currentLevel >= 70 ? 30 : 100
    setLevels((current) => ({ ...current, [name]: nextLevel }))
    console.info(`[合住 CoHome] ${name}库存已更新为 ${nextLevel}%`)
    triggerNotice(`${name}库存已更新为 ${nextLevel}%，刷新页面后状态仍会保留。`)
  }

  return (
    <div className="page module-page">
      <section className="module-heading"><div><span className="eyebrow">常用物品，心里有数</span><h1>公共物品</h1><p>登记库存状态，及时提醒补货，不再临用才发现没有。</p></div><PlaceholderButton feature="登记公共物品" variant="primary"><Plus size={17} /> 登记物品</PlaceholderButton></section>
      <section className="metric-row">
        <article className="metric-card"><span className="metric-icon metric-icon--purple"><Box size={20} /></span><div><small>已登记物品</small><strong>12</strong><span>4 个物品类别</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--orange"><BellRing size={20} /></span><div><small>需要补货</small><strong>2</strong><span>其中 1 件即将用完</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--green"><PackageCheck size={20} /></span><div><small>本月已补充</small><strong>5</strong><span>合计支出 ¥126.40</span></div></article>
      </section>
      <section className="panel module-panel">
        <div className="panel__header"><div><h2>物品库存</h2><p>使用三级状态，记录更轻松</p></div><PlaceholderButton feature="创建采购清单" variant="secondary"><ShoppingBasket size={16} /> 创建采购单</PlaceholderButton></div>
        <div className="supply-grid">
          {supplies.map((item) => {
            const level = levels[item.name] ?? item.level
            const state = level >= 70 ? '充足' : level >= 25 ? '较少' : '即将用完'
            return (
            <article className="supply-card" key={item.name}>
              <div className="supply-card__top"><span className="item-emoji item-emoji--large">{item.emoji}</span><span className={`tag ${state === '充足' ? 'tag--success' : state === '较少' ? 'tag--warm' : 'tag--danger'}`}>{state}</span></div>
              <h3>{item.name}</h3><span className="supply-category">{item.category}</span>
              <div className="supply-level"><div><span style={{ width: `${level}%` }} /></div><small>库存状态 {level}%</small></div>
              <div className="supply-card__footer"><span>上次购买：{item.buyer}</span><button type="button" className="button button--ghost" onClick={() => updateSupply(item.name, item.level)}>{level >= 70 ? '标记较少' : '标记已补货'}</button></div>
            </article>
            )
          })}
        </div>
      </section>
      <section className="empty-preview"><ListPlus size={24} /><div><strong>接口预留：智能采购清单</strong><span>后续将低库存物品自动汇总，并分配采购负责人。</span></div><PlaceholderButton feature="采购负责人分配" variant="secondary">分配负责人</PlaceholderButton></section>
    </div>
  )
}
