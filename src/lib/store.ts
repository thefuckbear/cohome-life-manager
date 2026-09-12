import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { addDaysLocal, buildShares, currentMonday, dateKey } from './selectors'
import type {
  ActivityEvent,
  AddExpenseInput,
  Agreement,
  AgreementVote,
  AppData,
  ChoreArea,
  ChoreRule,
  ChoreTask,
  Expense,
  ExpenseShare,
  House,
  ID,
  Member,
  Money,
  Supply,
} from './types'

const HOUSE_ID = 'h-main'
const MEMBER_ZHOU = 'm-zhou'
const MEMBER_LIN = 'm-lin'
const MEMBER_XIA = 'm-xia'

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function mondayOf(date: Date) {
  const d = startOfDay(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d
}

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatDate(date: Date) {
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`
}

function toISO(date: Date) {
  return date.toISOString()
}

function uid(prefix: string): ID {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createSeedData(): AppData {
  const now = new Date()
  const monday = mondayOf(now)
  const sunday = addDays(monday, 6)

  const house: House = {
    id: HOUSE_ID,
    name: '小满之家',
    createdAt: toISO(addDays(now, -128)),
    settlementDay: 15,
  }

  const members: Member[] = [
    { id: MEMBER_ZHOU, houseId: HOUSE_ID, name: '小周', initials: '周', color: '#e6a25a', isSelf: true, role: 'member', joinedAt: toISO(addDays(now, -128)), status: '在家' },
    { id: MEMBER_LIN, houseId: HOUSE_ID, name: '小林', initials: '林', color: '#6f9a83', isSelf: false, role: 'member', joinedAt: toISO(addDays(now, -128)), status: '外出' },
    { id: MEMBER_XIA, houseId: HOUSE_ID, name: '小夏', initials: '夏', color: '#7d83b7', isSelf: false, role: 'owner', joinedAt: toISO(addDays(now, -128)), status: '在家' },
  ]

  const expenses: Expense[] = [
    { id: 'e-elec', houseId: HOUSE_ID, title: '9 月电费', amount: 24000, category: 'utility', payerId: MEMBER_LIN, date: dateKey(addDays(now, -2)), splitMode: 'equal', createdAt: toISO(addDays(now, -2)) },
    { id: 'e-tissue', houseId: HOUSE_ID, title: '客厅抽纸', amount: 4500, category: 'daily', payerId: MEMBER_ZHOU, date: dateKey(addDays(now, -4)), splitMode: 'equal', createdAt: toISO(addDays(now, -4)) },
    { id: 'e-broadband', houseId: HOUSE_ID, title: '宽带月费', amount: 12000, category: 'internet', payerId: MEMBER_XIA, date: dateKey(addDays(now, -11)), splitMode: 'equal', createdAt: toISO(addDays(now, -11)) },
  ]

  const shares: ExpenseShare[] = [
    { id: 's-elec-zhou', expenseId: 'e-elec', memberId: MEMBER_ZHOU, amount: 8000, settled: false },
    { id: 's-elec-lin', expenseId: 'e-elec', memberId: MEMBER_LIN, amount: 8000, settled: true, settledAt: toISO(addDays(now, -1)) },
    { id: 's-elec-xia', expenseId: 'e-elec', memberId: MEMBER_XIA, amount: 8000, settled: false },
    { id: 's-tissue-zhou', expenseId: 'e-tissue', memberId: MEMBER_ZHOU, amount: 1500, settled: true, settledAt: toISO(addDays(now, -3)) },
    { id: 's-tissue-lin', expenseId: 'e-tissue', memberId: MEMBER_LIN, amount: 1500, settled: true, settledAt: toISO(addDays(now, -3)) },
    { id: 's-tissue-xia', expenseId: 'e-tissue', memberId: MEMBER_XIA, amount: 1500, settled: true, settledAt: toISO(addDays(now, -3)) },
    { id: 's-broadband-zhou', expenseId: 'e-broadband', memberId: MEMBER_ZHOU, amount: 4000, settled: false },
    { id: 's-broadband-lin', expenseId: 'e-broadband', memberId: MEMBER_LIN, amount: 4000, settled: true, settledAt: toISO(addDays(now, -8)) },
    { id: 's-broadband-xia', expenseId: 'e-broadband', memberId: MEMBER_XIA, amount: 4000, settled: true, settledAt: toISO(addDays(now, -8)) },
  ]

  const dueSunday = new Date(sunday)
  dueSunday.setHours(20, 0, 0, 0)

  const choreRules: ChoreRule[] = [
    { id: 'r-kitchen', houseId: HOUSE_ID, area: 'kitchen', label: '厨房', frequency: 'weekly', weekday: 1, rotateOrder: [MEMBER_ZHOU, MEMBER_LIN, MEMBER_XIA], startDate: dateKey(monday) },
    { id: 'r-living', houseId: HOUSE_ID, area: 'living', label: '客厅', frequency: 'weekly', weekday: 3, rotateOrder: [MEMBER_ZHOU, MEMBER_LIN, MEMBER_XIA], startDate: dateKey(monday) },
    { id: 'r-bathroom', houseId: HOUSE_ID, area: 'bathroom', label: '卫生间', frequency: 'weekly', weekday: 0, rotateOrder: [MEMBER_ZHOU, MEMBER_LIN, MEMBER_XIA], startDate: dateKey(monday) },
    { id: 'r-trash', houseId: HOUSE_ID, area: 'trash', label: '垃圾', frequency: 'weekly', weekday: 0, rotateOrder: [MEMBER_ZHOU, MEMBER_LIN, MEMBER_XIA], startDate: dateKey(monday) },
  ]

  const chores: ChoreTask[] = [
    { id: 'c-kitchen', houseId: HOUSE_ID, ruleId: 'r-kitchen', area: 'kitchen', title: '厨房清洁', assigneeId: MEMBER_LIN, weekOf: dateKey(monday), date: formatDate(monday), dayLabel: DAYS[monday.getDay()], dueAt: toISO(dueSunday), status: 'done', completedAt: toISO(monday) },
    { id: 'c-living', houseId: HOUSE_ID, ruleId: 'r-living', area: 'living', title: '客厅清洁', assigneeId: MEMBER_XIA, weekOf: dateKey(monday), date: formatDate(addDays(monday, 2)), dayLabel: DAYS[addDays(monday, 2).getDay()], dueAt: toISO(dueSunday), status: 'done', completedAt: toISO(addDays(monday, 2)) },
    { id: 'c-bathroom', houseId: HOUSE_ID, ruleId: 'r-bathroom', area: 'bathroom', title: '卫生间清洁', assigneeId: MEMBER_ZHOU, weekOf: dateKey(monday), date: formatDate(sunday), dayLabel: DAYS[sunday.getDay()], dueAt: toISO(dueSunday), status: 'pending' },
    { id: 'c-trash', houseId: HOUSE_ID, ruleId: 'r-trash', area: 'trash', title: '垃圾清理', assigneeId: MEMBER_LIN, weekOf: dateKey(monday), date: formatDate(sunday), dayLabel: DAYS[sunday.getDay()], dueAt: toISO(dueSunday), status: 'pending' },
  ]

  const supplies: Supply[] = [
    { id: 'su-tissue', houseId: HOUSE_ID, name: '抽纸', emoji: '🧻', category: '日用清洁', cycleDays: 14, lastBuyerId: MEMBER_ZHOU, lastBoughtAt: toISO(addDays(now, -13)), refPrice: 4580, rotateOrder: [MEMBER_ZHOU, MEMBER_LIN, MEMBER_XIA] },
    { id: 'su-detergent', houseId: HOUSE_ID, name: '洗洁精', emoji: '🧴', category: '厨房用品', cycleDays: 21, lastBuyerId: MEMBER_LIN, lastBoughtAt: toISO(addDays(now, -19)), refPrice: 1280, rotateOrder: [MEMBER_ZHOU, MEMBER_LIN, MEMBER_XIA] },
    { id: 'su-bags', houseId: HOUSE_ID, name: '垃圾袋', emoji: '🗑️', category: '日用清洁', cycleDays: 21, lastBuyerId: MEMBER_XIA, lastBoughtAt: toISO(addDays(now, -8)), refPrice: 1990, rotateOrder: [MEMBER_ZHOU, MEMBER_LIN, MEMBER_XIA] },
    { id: 'su-laundry', houseId: HOUSE_ID, name: '洗衣液', emoji: '🧺', category: '洗护用品', cycleDays: 30, lastBuyerId: MEMBER_ZHOU, lastBoughtAt: toISO(addDays(now, -24)), refPrice: 3690, rotateOrder: [MEMBER_ZHOU, MEMBER_LIN, MEMBER_XIA] },
  ]

  const agreements: Agreement[] = [
    { id: 'a-silent', houseId: HOUSE_ID, title: '晚间安静时间', content: '工作日 23:00 后降低音量，使用耳机观看视频。', category: '作息', status: 'active', version: 1, createdBy: MEMBER_XIA, createdAt: toISO(addDays(now, -30)), effectiveAt: toISO(addDays(now, -28)), icon: '🌙' },
    { id: 'a-visitor', houseId: HOUSE_ID, title: '公共区域访客规则', content: '邀请访客留宿需至少提前一天在群内告知。', category: '访客', status: 'voting', version: 1, createdBy: MEMBER_XIA, createdAt: toISO(addDays(now, -1)), icon: '🚪' },
    { id: 'a-fee', houseId: HOUSE_ID, title: '每月费用结算日', content: '每月 15 日前完成上月所有公共费用的结算。', category: '费用', status: 'active', version: 1, createdBy: MEMBER_LIN, createdAt: toISO(addDays(now, -40)), effectiveAt: toISO(addDays(now, -38)), icon: '🧾' },
    { id: 'a-kitchen', houseId: HOUSE_ID, title: '厨房使用与清洁', content: '使用后当日清洁灶台和餐具，不长时间占用水槽。', category: '卫生', status: 'active', version: 1, createdBy: MEMBER_ZHOU, createdAt: toISO(addDays(now, -25)), effectiveAt: toISO(addDays(now, -23)), icon: '🍳' },
  ]

  const votes: AgreementVote[] = [
    { id: 'v-silent-zhou', agreementId: 'a-silent', memberId: MEMBER_ZHOU, agree: true, votedAt: toISO(addDays(now, -29)) },
    { id: 'v-silent-lin', agreementId: 'a-silent', memberId: MEMBER_LIN, agree: true, votedAt: toISO(addDays(now, -29)) },
    { id: 'v-silent-xia', agreementId: 'a-silent', memberId: MEMBER_XIA, agree: true, votedAt: toISO(addDays(now, -29)) },
    { id: 'v-visitor-xia', agreementId: 'a-visitor', memberId: MEMBER_XIA, agree: true, votedAt: toISO(addDays(now, -1)) },
    { id: 'v-visitor-lin', agreementId: 'a-visitor', memberId: MEMBER_LIN, agree: true, votedAt: toISO(addDays(now, -1)) },
    { id: 'v-fee-zhou', agreementId: 'a-fee', memberId: MEMBER_ZHOU, agree: true, votedAt: toISO(addDays(now, -39)) },
    { id: 'v-fee-lin', agreementId: 'a-fee', memberId: MEMBER_LIN, agree: true, votedAt: toISO(addDays(now, -39)) },
    { id: 'v-fee-xia', agreementId: 'a-fee', memberId: MEMBER_XIA, agree: true, votedAt: toISO(addDays(now, -39)) },
    { id: 'v-kitchen-zhou', agreementId: 'a-kitchen', memberId: MEMBER_ZHOU, agree: true, votedAt: toISO(addDays(now, -24)) },
    { id: 'v-kitchen-lin', agreementId: 'a-kitchen', memberId: MEMBER_LIN, agree: true, votedAt: toISO(addDays(now, -24)) },
    { id: 'v-kitchen-xia', agreementId: 'a-kitchen', memberId: MEMBER_XIA, agree: true, votedAt: toISO(addDays(now, -24)) },
  ]

  const activities: ActivityEvent[] = [
    { id: 'a1', houseId: HOUSE_ID, actorId: MEMBER_LIN, type: 'expense_added', targetId: 'e-elec', summary: '添加了 9 月电费', at: toISO(addDays(now, -1)) },
    { id: 'a2', houseId: HOUSE_ID, actorId: MEMBER_XIA, type: 'chore_done', targetId: 'c-living', summary: '完成了客厅清洁', at: toISO(addDays(now, -1)) },
    { id: 'a3', houseId: HOUSE_ID, actorId: MEMBER_ZHOU, type: 'supply_low', targetId: 'su-tissue', summary: '将抽纸标记为即将用完', at: toISO(addDays(now, -1)) },
  ]

  return {
    house,
    members,
    expenses,
    shares,
    choreRules,
    choreTasks: chores,
    supplies,
    purchases: [],
    agreements,
    votes,
    activities,
  }
}

export interface AppState extends AppData {
  addExpense: (input: AddExpenseInput) => void
  settleShare: (expenseId: ID, shareId: ID) => void
  settleAll: () => void
  completeChore: (taskId: ID) => void
  generateNextWeek: () => void
  swapChore: (taskId: ID, withMemberId: ID) => void
  recordPurchase: (supplyId: ID, price: Money, asExpense: boolean) => void
  remindAgreement: (agreementId: ID, memberId: ID) => void
  setupChorePlan: (areas: ChoreArea[], memberIds: ID[]) => void
  reset: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...createSeedData(),
      addExpense: (input) => {
        const { title, amount, category, payerId, date, splitMode, participants, customAmounts } = input
        const expenseId = uid('e')
        const now = new Date().toISOString()
        set((state) => {
          const selfId = state.members.find((m) => m.isSelf)?.id ?? payerId
          const split = buildShares({
            amount,
            participants,
            payerId,
            splitMode: splitMode === 'ratio' ? 'equal' : splitMode,
            customAmounts,
          })
          const newExpense: Expense = {
            id: expenseId,
            houseId: state.house.id,
            title,
            amount,
            category,
            payerId,
            date,
            splitMode: splitMode === 'ratio' ? 'equal' : splitMode,
            createdAt: now,
          }
          const newShares: ExpenseShare[] = split.map((s) => ({
            id: uid('s'),
            expenseId,
            memberId: s.memberId,
            amount: s.amount,
            settled: s.memberId === payerId,
            settledAt: s.memberId === payerId ? now : undefined,
          }))
          const activity: ActivityEvent = {
            id: uid('a'),
            houseId: state.house.id,
            actorId: selfId,
            type: 'expense_added',
            targetId: expenseId,
            summary: `添加了 ${title}`,
            at: now,
          }
          return {
            expenses: [...state.expenses, newExpense],
            shares: [...state.shares, ...newShares],
            activities: [activity, ...state.activities],
          }
        })
      },
      settleShare: (expenseId, shareId) => {
        set((state) => {
          const share = state.shares.find((s) => s.id === shareId)
          if (!share) return {}
          const expense = state.expenses.find((e) => e.id === expenseId)
          const now = new Date().toISOString()
          const selfId = state.members.find((m) => m.isSelf)?.id ?? share.memberId
          const shares = state.shares.map((s) =>
            s.id === shareId ? { ...s, settled: true, settledAt: now } : s,
          )
          const activity: ActivityEvent = {
            id: uid('a'),
            houseId: state.house.id,
            actorId: selfId,
            type: 'expense_settled',
            targetId: expenseId,
            summary: `结清了 ${expense?.title ?? '一笔费用'}`,
            at: now,
          }
          return { shares, activities: [activity, ...state.activities] }
        })
      },
      settleAll: () => {
        set((state) => {
          const now = new Date().toISOString()
          const selfId = state.members.find((m) => m.isSelf)?.id ?? ''
          const shares = state.shares.map((s) =>
            s.settled ? s : { ...s, settled: true, settledAt: now },
          )
          const activity: ActivityEvent = {
            id: uid('a'),
            houseId: state.house.id,
            actorId: selfId,
            type: 'expense_settled',
            targetId: '',
            summary: '一键结清了所有待结算费用',
            at: now,
          }
          return { shares, activities: [activity, ...state.activities] }
        })
      },
      completeChore: (taskId) => {
        set((state) => {
          const task = state.choreTasks.find((c) => c.id === taskId)
          if (!task) return {}
          const now = new Date().toISOString()
          const selfId = state.members.find((m) => m.isSelf)?.id ?? task.assigneeId
          const choreTasks = state.choreTasks.map((c) =>
            c.id === taskId ? { ...c, status: 'done' as const, completedAt: now, completedBy: selfId } : c,
          )
          const activity: ActivityEvent = {
            id: uid('a'),
            houseId: state.house.id,
            actorId: selfId,
            type: 'chore_done',
            targetId: taskId,
            summary: `完成了${task.title}`,
            at: now,
          }
          return { choreTasks, activities: [activity, ...state.activities] }
        })
      },
      generateNextWeek: () => {
        set((state) => {
          const monday = currentMonday()
          const thisWeek = dateKey(monday)
          const nextMonday = addDaysLocal(monday, 7)
          const nextWeek = dateKey(nextMonday)
          if (state.choreTasks.some((c) => c.weekOf === nextWeek)) return {}
          const now = new Date().toISOString()
          const selfId = state.members.find((m) => m.isSelf)?.id ?? ''
          const newTasks: ChoreTask[] = state.choreTasks
            .filter((c) => c.weekOf === thisWeek)
            .map((task) => {
              const rule = state.choreRules.find((r) => r.area === task.area)
              const rotateOrder = rule && rule.rotateOrder.length > 0
                ? rule.rotateOrder
                : state.members.map((m) => m.id)
              const idx = rotateOrder.indexOf(task.assigneeId)
              const nextAssignee = rotateOrder[(idx + 1) % rotateOrder.length]
              const dayOfWeek = DAYS.indexOf(task.dayLabel)
              const offset = (dayOfWeek - 1 + 7) % 7
              const dueDate = addDaysLocal(nextMonday, offset)
              dueDate.setHours(20, 0, 0, 0)
              return {
                id: uid('c'),
                houseId: state.house.id,
                ruleId: rule?.id,
                area: task.area,
                title: task.title,
                assigneeId: nextAssignee,
                weekOf: nextWeek,
                date: formatDate(dueDate),
                dayLabel: DAYS[dueDate.getDay()],
                dueAt: toISO(dueDate),
                status: 'pending' as const,
              }
            })
          if (newTasks.length === 0) return {}
          const activity: ActivityEvent = {
            id: uid('a'),
            houseId: state.house.id,
            actorId: selfId,
            type: 'chore_rotated',
            targetId: '',
            summary: '生成了下周值日排班',
            at: now,
          }
          return { choreTasks: [...state.choreTasks, ...newTasks], activities: [activity, ...state.activities] }
        })
      },
      swapChore: (taskId, withMemberId) => {
        set((state) => {
          const task = state.choreTasks.find((c) => c.id === taskId)
          if (!task || task.assigneeId === withMemberId) return {}
          const now = new Date().toISOString()
          const selfId = state.members.find((m) => m.isSelf)?.id ?? task.assigneeId
          const target = state.members.find((m) => m.id === withMemberId)
          const choreTasks = state.choreTasks.map((c) =>
            c.id === taskId ? { ...c, assigneeId: withMemberId, swappedFromId: task.assigneeId } : c,
          )
          const activity: ActivityEvent = {
            id: uid('a'),
            houseId: state.house.id,
            actorId: selfId,
            type: 'chore_swapped',
            targetId: taskId,
            summary: `将${task.title}换给了${target?.name ?? '室友'}`,
            at: now,
          }
          return { choreTasks, activities: [activity, ...state.activities] }
        })
      },
      recordPurchase: (supplyId, price, asExpense) => {
        set((state) => {
          const supply = state.supplies.find((s) => s.id === supplyId)
          if (!supply) return {}
          const selfId = state.members.find((m) => m.isSelf)?.id ?? state.members[0]?.id ?? ''
          const now = new Date().toISOString()
          const nowDate = new Date()

          let expenses = state.expenses
          let shares = state.shares
          let expenseId: ID | undefined

          if (asExpense && price > 0) {
            const eid = uid('e')
            expenseId = eid
            const split = buildShares({
              amount: price,
              participants: state.members.map((m) => m.id),
              payerId: selfId,
              splitMode: 'equal',
            })
            const newExpense: Expense = {
              id: eid,
              houseId: state.house.id,
              title: `补货：${supply.name}`,
              amount: price,
              category: 'daily',
              payerId: selfId,
              date: dateKey(nowDate),
              splitMode: 'equal',
              supplyId,
              createdAt: now,
            }
            const newShares: ExpenseShare[] = split.map((s) => ({
              id: uid('s'),
              expenseId: eid,
              memberId: s.memberId,
              amount: s.amount,
              settled: s.memberId === selfId,
              settledAt: s.memberId === selfId ? now : undefined,
            }))
            expenses = [...state.expenses, newExpense]
            shares = [...state.shares, ...newShares]
          }

          const supplies = state.supplies.map((s) =>
            s.id === supplyId ? { ...s, lastBuyerId: selfId, lastBoughtAt: now } : s,
          )
          const purchase = { id: uid('p'), supplyId, buyerId: selfId, price, boughtAt: now, expenseId }
          const activity: ActivityEvent = {
            id: uid('a'),
            houseId: state.house.id,
            actorId: selfId,
            type: 'supply_restocked',
            targetId: supplyId,
            summary: asExpense ? `补货了${supply.name}（¥${(price / 100).toFixed(2)}），已记入 AA` : `补货了${supply.name}`,
            at: now,
          }
          return {
            supplies,
            purchases: [...state.purchases, purchase],
            expenses,
            shares,
            activities: [activity, ...state.activities],
          }
        })
      },
      remindAgreement: (agreementId, memberId) => {
        set((state) => {
          const agreement = state.agreements.find((a) => a.id === agreementId)
          const target = state.members.find((m) => m.id === memberId)
          if (!agreement || !target) return {}
          const selfId = state.members.find((m) => m.isSelf)?.id ?? ''
          const now = new Date().toISOString()
          const activity: ActivityEvent = {
            id: uid('a'),
            houseId: state.house.id,
            actorId: selfId,
            type: 'agreement_reminded',
            targetId: agreementId,
            summary: `提醒${target.name}遵守「${agreement.title}」`,
            at: now,
          }
          return { activities: [activity, ...state.activities] }
        })
      },
      setupChorePlan: (areas, memberIds) => {
        set((state) => {
          if (areas.length === 0 || memberIds.length === 0) return {}
          const thisWeek = dateKey(currentMonday())
          const now = new Date().toISOString()
          const selfId = state.members.find((m) => m.isSelf)?.id ?? ''
          const AREA_LABEL: Record<ChoreArea, string> = {
            kitchen: '厨房清洁',
            living: '客厅清洁',
            bathroom: '卫生间清洁',
            trash: '垃圾清理',
            custom: '公共区域清洁',
          }
          const AREA_DAY_OFFSET: Record<ChoreArea, number> = {
            kitchen: 0,
            living: 2,
            bathroom: 5,
            trash: 6,
            custom: 4,
          }
          const newTasks: ChoreTask[] = areas.map((area, i) => {
            const assigneeId = memberIds[i % memberIds.length]
            const dueDate = addDaysLocal(currentMonday(), AREA_DAY_OFFSET[area])
            dueDate.setHours(20, 0, 0, 0)
            return {
              id: uid('c'),
              houseId: state.house.id,
              ruleId: state.choreRules.find((r) => r.area === area)?.id,
              area,
              title: AREA_LABEL[area],
              assigneeId,
              weekOf: thisWeek,
              date: formatDate(dueDate),
              dayLabel: DAYS[dueDate.getDay()],
              dueAt: toISO(dueDate),
              status: 'pending' as const,
            }
          })
          const choreTasks = [...state.choreTasks.filter((c) => c.weekOf !== thisWeek), ...newTasks]
          const activity: ActivityEvent = {
            id: uid('a'),
            houseId: state.house.id,
            actorId: selfId,
            type: 'chore_rotated',
            targetId: '',
            summary: `重新安排了本周值日（${areas.length} 项任务）`,
            at: now,
          }
          return { choreTasks, activities: [activity, ...state.activities] }
        })
      },
      reset: () => set({ ...createSeedData() }),
    }),
    {
      name: 'cohome:store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        house: state.house,
        members: state.members,
        expenses: state.expenses,
        shares: state.shares,
        choreRules: state.choreRules,
        choreTasks: state.choreTasks,
        supplies: state.supplies,
        purchases: state.purchases,
        agreements: state.agreements,
        votes: state.votes,
        activities: state.activities,
      }),
    },
  ),
)