import { BookOpenCheck, Check, ChevronRight, Clock3, FileClock, Plus, Users } from 'lucide-react'
import { PlaceholderButton } from '../components/PlaceholderButton'
import { triggerNotice } from '../lib/placeholder'
import { useLocalStorageState } from '../lib/useLocalStorageState'

const agreements = [
  { title: '晚间安静时间', copy: '工作日 23:00 后降低音量，使用耳机观看视频。', category: '作息', confirmed: 3, status: '已生效', icon: '🌙' },
  { title: '公共区域访客规则', copy: '邀请访客留宿需至少提前一天在群内告知。', category: '访客', confirmed: 2, status: '待我确认', icon: '🚪' },
  { title: '每月费用结算日', copy: '每月 15 日前完成上月所有公共费用的结算。', category: '费用', confirmed: 3, status: '已生效', icon: '🧾' },
  { title: '厨房使用与清洁', copy: '使用后当日清洁灶台和餐具，不长时间占用水槽。', category: '卫生', confirmed: 3, status: '已生效', icon: '🍳' },
]

export function Agreements() {
  const [visitorConfirmed, setVisitorConfirmed] = useLocalStorageState('cohome:agreements:visitor-confirmed', false)

  const confirmVisitorAgreement = () => {
    setVisitorConfirmed(true)
    console.info('[合住 CoHome] 公共区域访客规则已确认')
    triggerNotice('你已确认访客规则，3 位室友全部同意，公约正式生效。')
  }

  return (
    <div className="page module-page">
      <section className="module-heading"><div><span className="eyebrow">有话说清楚，相处更自在</span><h1>室友公约</h1><p>共同讨论生活规则，所有成员确认后正式生效。</p></div><PlaceholderButton feature="发起新公约" variant="primary"><Plus size={17} /> 发起新公约</PlaceholderButton></section>
      <section className="agreement-banner">
        <span className="agreement-banner__icon"><BookOpenCheck size={26} /></span>
        <div><small>小满之家公约</small><strong>已共同生活 128 天</strong><p>当前共有 8 条有效公约，1 条等待确认。</p></div>
        <div className="agreement-banner__members"><Users size={17} /><span>3 / 3 位成员</span></div>
      </section>
      <section className="panel module-panel">
        <div className="panel__header"><div><h2>当前公约</h2><p>公开透明，修改也会留下版本记录</p></div><PlaceholderButton feature="查看公约历史版本" variant="secondary"><FileClock size={16} /> 历史版本</PlaceholderButton></div>
        <div className="agreement-list">
          {agreements.map((item) => {
            const isVisitorAgreement = item.title === '公共区域访客规则'
            const isConfirmed = !isVisitorAgreement || visitorConfirmed
            const status = isConfirmed ? '已生效' : item.status
            const confirmedCount = isConfirmed ? 3 : item.confirmed
            return (
            <article className="agreement-row" key={item.title}>
              <span className="agreement-emoji">{item.icon}</span>
              <div className="agreement-copy"><div><span className="tag">{item.category}</span><span className={`tag ${status === '已生效' ? 'tag--success' : 'tag--warm'}`}>{status === '已生效' ? <Check size={12} /> : <Clock3 size={12} />}{status}</span></div><h3>{item.title}</h3><p>{item.copy}</p><span>{confirmedCount} / 3 位室友已确认</span></div>
              {!isConfirmed ? <button type="button" className="button button--primary" onClick={confirmVisitorAgreement}>阅读并确认</button> : <PlaceholderButton feature={`${item.title}详情`} variant="ghost">查看 <ChevronRight size={15} /></PlaceholderButton>}
            </article>
            )
          })}
        </div>
      </section>
      <section className="empty-preview"><FileClock size={24} /><div><strong>接口预留：公约投票与版本</strong><span>后续支持成员表决、修改提议和历史版本对比。</span></div><PlaceholderButton feature="公约通知设置" variant="secondary">提醒未确认成员</PlaceholderButton></section>
    </div>
  )
}
