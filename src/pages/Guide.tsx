import {
  Bell,
  BookOpenCheck,
  Box,
  CalendarDays,
  CircleDollarSign,
  Home,
  Users,
} from 'lucide-react'

const sections = [
  {
    icon: Users,
    title: '账号与身份',
    desc: '左下角头像菜单可切换账号，模拟不同室友的视角（演示用途）。',
    points: [
      '只能删除自己创建的条目（账单、任务、物品、公约）',
      '只能结清自己的账单；公约每人限投一次',
      '值日只能自己认领，室友间靠「提醒」互相监督',
    ],
  },
  {
    icon: Home,
    title: '今日首页',
    desc: '一眼看到今天要处理的事：待支付、今日值日、待确认公约、缴费日临近，点击即可跳转处理。',
    points: [
      '可邀请新室友加入',
      '「重置演示数据」一键还原初始状态',
    ],
  },
  {
    icon: CircleDollarSign,
    title: '费用 AA',
    desc: '记录共同支出，自动算清谁该付给谁。',
    points: [
      '记一笔费用：选付款人、参与人和分摊方式（平均 / 自定义金额）',
      '结算方案：直接告诉你该转给谁、转多少',
      '催缴：账单明细里提醒未结清的室友，对方通知中心会收到',
      '分摊规则：设置默认分摊方式和参与人',
      '缴费日：登记房租水电的截止日，逾期自动红色高亮',
      '本月支出：按分类看每月花了多少',
    ],
  },
  {
    icon: CalendarDays,
    title: '清洁值日',
    desc: '自觉认领值日任务，当天两次提醒（开始 + 20:00 临近截止）。',
    points: [
      '认领值日：给自己选任务和日期（默认下周，可调整）',
      '换班需对方同意：发邀请后对方可接受或拒绝',
      '「提醒」按钮可提醒室友完成值日',
    ],
  },
  {
    icon: Box,
    title: '公共物品',
    desc: '买了公共物品想让大家分摊？登记一下。',
    points: [
      '登记物品后自动生成一笔 AA 账单，全体均摊',
      '不登记的物品不受 AA 管理',
      '删除自己登记的物品时，对应账单一并删除',
    ],
  },
  {
    icon: BookOpenCheck,
    title: '室友公约',
    desc: '共同约定生活规则，白纸黑字更少争议。',
    points: [
      '发起新公约后，需全员同意才会生效',
      '已生效公约可「一键提醒」违规室友',
      '每人只能投一次票',
    ],
  },
  {
    icon: Bell,
    title: '通知中心',
    desc: '右上角铃铛，三类通知会出现在这里，点击可跳转处理。',
    points: [
      '被室友提醒（催缴、值日、公约）',
      '你有待结算的账单',
      '今天轮到你值日',
    ],
  },
]

export function Guide() {
  return (
    <div className="page module-page">
      <section className="module-heading">
        <div><span className="eyebrow">快速上手</span><h1>使用说明</h1><p>花一分钟了解合住 CoHome 的每个功能。</p></div>
      </section>
      <div className="guide-grid">
        {sections.map(({ icon: Icon, title, desc, points }) => (
          <article className="guide-card" key={title}>
            <div className="guide-card__top">
              <span className="guide-card__icon"><Icon size={19} /></span>
              <h3>{title}</h3>
            </div>
            <p>{desc}</p>
            <ul>
              {points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}
