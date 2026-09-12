import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Filter, Plus, ReceiptText, WalletCards } from 'lucide-react'
import { PlaceholderButton } from '../components/PlaceholderButton'

const bills = [
  { title: '9 月电费', payer: '小林支付', amount: '¥240.00', date: '09-10', status: '2 人待结算', icon: '⚡' },
  { title: '客厅抽纸', payer: '小周支付', amount: '¥45.80', date: '09-08', status: '已结清', icon: '🧻' },
  { title: '宽带月费', payer: '小夏支付', amount: '¥120.00', date: '09-01', status: '1 人待结算', icon: '📶' },
]

export function Expenses() {
  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">费用透明，关系轻松</span><h1>费用 AA</h1><p>记录每一笔共同支出，自动算清谁该付给谁。</p></div>
        <PlaceholderButton feature="新增费用" variant="primary"><Plus size={17} /> 记一笔费用</PlaceholderButton>
      </section>
      <section className="metric-row">
        <article className="metric-card"><span className="metric-icon metric-icon--orange"><ArrowUpRight size={20} /></span><div><small>我需要支付</small><strong>¥126.50</strong><span>共 2 笔待结算</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--green"><ArrowDownLeft size={20} /></span><div><small>我将收到</small><strong>¥30.53</strong><span>来自小林</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon--purple"><CircleDollarSign size={20} /></span><div><small>本月共同支出</small><strong>¥405.80</strong><span>较上月减少 8%</span></div></article>
      </section>
      <section className="panel module-panel">
        <div className="panel__header"><div><h2>本月账单</h2><p>所有共同费用都在这里</p></div><div className="header-actions"><PlaceholderButton feature="账单筛选" variant="secondary"><Filter size={16} /> 筛选</PlaceholderButton><PlaceholderButton feature="一键结算" variant="primary"><WalletCards size={16} /> 一键结算</PlaceholderButton></div></div>
        <div className="table-list">
          {bills.map((bill) => (
            <article className="table-row" key={bill.title}>
              <span className="item-emoji">{bill.icon}</span>
              <div className="table-row__main"><strong>{bill.title}</strong><span>{bill.payer} · {bill.date}</span></div>
              <strong className="table-amount">{bill.amount}</strong>
              <span className={`tag ${bill.status === '已结清' ? 'tag--success' : 'tag--warm'}`}>{bill.status}</span>
              <PlaceholderButton feature={`${bill.title}账单详情`} variant="ghost">查看明细</PlaceholderButton>
            </article>
          ))}
        </div>
      </section>
      <section className="empty-preview"><ReceiptText size={24} /><div><strong>接口预留：分摊规则</strong><span>后续支持平均分、自定义金额和按比例分摊。</span></div><PlaceholderButton feature="分摊规则设置" variant="secondary">设置规则</PlaceholderButton></section>
    </div>
  )
}
