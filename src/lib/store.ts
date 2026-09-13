import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { addDaysLocal, buildShares, currentMonday, dateKey, round2 } from './selectors'
import type {
  ActivityEvent,
  AddExpenseInput,
  Agreement,
  AgreementVersion,
  AgreementVote,
  AppData,
  BillCycle,
  BillPayment,
  BillReminder,
  ChoreArea,
  ChoreRule,
  ChoreTask,
  Expense,
  ExpenseShare,
  House,
  ID,
  Member,
  Money,
  SplitRule,
  Supply,
  SwapRequest,
  TransferRecord,
} from './types'

const HOUSE_ID = 'h-main'
const MEMBER_ZHOU = 'm-zhou'
const MEMBER_LIN = 'm-lin'
const MEMBER_XIA = 'm-xia'

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const AREA_LABEL: Record<ChoreArea, string> = {
  kitchen: '厨房清洁',
  living: '客厅清洁',
  bathroom: '卫生间清洁',
  trash: '垃圾清理',
  custom: '公共区域清洁',
}

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

const COLOR_PALETTE = ['#e6a25a', '#6f9a83', '#7d83b7', '#c26742', '#5d8fa8', '#b78a6f']

function nextDueDate(dueDate: string, cycle: BillCycle): string {
  const [y, m, d] = dueDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  if (cycle === 'weekly') dt.setDate(dt.getDate() + 7)
  else if (cycle === 'monthly') dt.setMonth(dt.getMonth() + 1)
  else if (cycle === 'yearly') dt.setFullYear(dt.getFullYear() + 1)
  else return dueDate
  return dateKey(dt)
}

export function createSeedData(): AppData {
  const now = new Date()
  const monday = mondayOf(now)
  const sunday = addDays(monday, 6)

  const houses: House[] = [
    { id: HOUSE_ID, name: '小满之家', createdAt: toISO(addDays(now, -128)), settlementDay: 15 },
  ]

  const members: Member[] = [
    { id: MEMBER_ZHOU, houseId: HOUSE_ID, name: '小周', initials: '周', color: '#e6a25a', isSelf: true, role: 'member', joinedAt: toISO(addDays(now, -128)), status: '在家', balance: 100 },
    { id: MEMBER_LIN, houseId: HOUSE_ID, name: '小林', initials: '林', color: '#6f9a83', isSelf: false, role: 'member', joinedAt: toISO(addDays(now, -128)), status: '外出', balance: 0 },
    { id: MEMBER_XIA, houseId: HOUSE_ID, name: '小夏', initials: '夏', color: '#7d83b7', isSelf: false, role: 'owner', joinedAt: toISO(addDays(now, -128)), status: '在家', balance: 0 },
  ]

  const expenses: Expense[] = [
    { id: 'e-elec', houseId: HOUSE_ID, title: '9 月电费', amount: 240, category: 'utility', payerId: MEMBER_LIN, date: dateKey(addDays(now, -2)), splitMode: 'equal', createdAt: toISO(addDays(now, -2)), createdBy: MEMBER_LIN },
    { id: 'e-tissue', houseId: HOUSE_ID, title: '客厅抽纸', amount: 45, category: 'daily', payerId: MEMBER_ZHOU, date: dateKey(addDays(now, -4)), splitMode: 'equal', createdAt: toISO(addDays(now, -4)), createdBy: MEMBER_ZHOU, supplyId: 'su-tissue' },
    { id: 'e-broadband', houseId: HOUSE_ID, title: '宽带月费', amount: 120, category: 'internet', payerId: MEMBER_XIA, date: dateKey(addDays(now, -11)), splitMode: 'equal', createdAt: toISO(addDays(now, -11)), createdBy: MEMBER_XIA },
  ]

  const shares: ExpenseShare[] = [
    { id: 's-elec-zhou', houseId: HOUSE_ID, expenseId: 'e-elec', memberId: MEMBER_ZHOU, amount: 80, settled: false },
    { id: 's-elec-lin', houseId: HOUSE_ID, expenseId: 'e-elec', memberId: MEMBER_LIN, amount: 80, settled: true, settledAt: toISO(addDays(now, -1)) },
    { id: 's-elec-xia', houseId: HOUSE_ID, expenseId: 'e-elec', memberId: MEMBER_XIA, amount: 80, settled: false },
    { id: 's-tissue-zhou', houseId: HOUSE_ID, expenseId: 'e-tissue', memberId: MEMBER_ZHOU, amount: 15, settled: true, settledAt: toISO(addDays(now, -3)) },
    { id: 's-tissue-lin', houseId: HOUSE_ID, expenseId: 'e-tissue', memberId: MEMBER_LIN, amount: 15, settled: true, settledAt: toISO(addDays(now, -3)) },
    { id: 's-tissue-xia', houseId: HOUSE_ID, expenseId: 'e-tissue', memberId: MEMBER_XIA, amount: 15, settled: true, settledAt: toISO(addDays(now, -3)) },
    { id: 's-broadband-zhou', houseId: HOUSE_ID, expenseId: 'e-broadband', memberId: MEMBER_ZHOU, amount: 40, settled: false },
    { id: 's-broadband-lin', houseId: HOUSE_ID, expenseId: 'e-broadband', memberId: MEMBER_LIN, amount: 40, settled: true, settledAt: toISO(addDays(now, -8)) },
    { id: 's-broadband-xia', houseId: HOUSE_ID, expenseId: 'e-broadband', memberId: MEMBER_XIA, amount: 40, settled: true, settledAt: toISO(addDays(now, -8)) },
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

  const swapRequests: SwapRequest[] = [
    { id: 'sw-1', taskId: 'c-bathroom', fromId: MEMBER_ZHOU, toId: MEMBER_LIN, status: 'pending', createdAt: toISO(addDays(now, -0.2)) },
  ]

  const supplies: Supply[] = [
    { id: 'su-tissue', houseId: HOUSE_ID, name: '抽纸', emoji: '🧻', category: '日用清洁', createdBy: MEMBER_ZHOU, createdAt: toISO(addDays(now, -4)), refPrice: 45 },
    { id: 'su-detergent', houseId: HOUSE_ID, name: '洗洁精', emoji: '🧴', category: '厨房用品', createdBy: MEMBER_LIN, createdAt: toISO(addDays(now, -9)), refPrice: 12.8 },
    { id: 'su-bags', houseId: HOUSE_ID, name: '垃圾袋', emoji: '🗑️', category: '日用清洁', createdBy: MEMBER_XIA, createdAt: toISO(addDays(now, -14)), refPrice: 19.9 },
    { id: 'su-laundry', houseId: HOUSE_ID, name: '洗衣液', emoji: '🧺', category: '洗护用品', createdBy: MEMBER_ZHOU, createdAt: toISO(addDays(now, -18)), refPrice: 36.9 },
  ]

  const billReminders: BillReminder[] = [
    { id: 'b-rent', houseId: HOUSE_ID, title: '房租', amount: 3000, dueDate: dateKey(new Date(now.getFullYear(), now.getMonth(), 25)), cycle: 'monthly', initiatorId: MEMBER_XIA, createdBy: MEMBER_XIA, createdAt: toISO(addDays(now, -30)), status: 'pending' },
    { id: 'b-water', houseId: HOUSE_ID, title: '水费', amount: 86.5, dueDate: dateKey(addDays(now, -2)), cycle: 'monthly', initiatorId: MEMBER_LIN, createdBy: MEMBER_LIN, createdAt: toISO(addDays(now, -15)), status: 'pending' },
    { id: 'b-net', houseId: HOUSE_ID, title: '宽带费', amount: 120, dueDate: dateKey(addDays(now, 3)), cycle: 'monthly', initiatorId: MEMBER_ZHOU, createdBy: MEMBER_ZHOU, createdAt: toISO(addDays(now, -10)), status: 'pending' },
  ]

  const agreements: Agreement[] = [
    { id: 'a-silent', houseId: HOUSE_ID, title: '晚间安静时间', content: '工作日 23:00 后降低音量，使用耳机观看视频。', category: '作息', status: 'active', version: 1, createdBy: MEMBER_XIA, createdAt: toISO(addDays(now, -30)), effectiveAt: toISO(addDays(now, -28)), icon: '🌙' },
    { id: 'a-visitor', houseId: HOUSE_ID, title: '公共区域访客规则', content: '邀请访客留宿需至少提前一天在群内告知。', category: '访客', status: 'voting', version: 1, createdBy: MEMBER_XIA, createdAt: toISO(addDays(now, -1)), icon: '🚪' },
    { id: 'a-fee', houseId: HOUSE_ID, title: '每月费用结算日', content: '每月 15 日前完成上月所有公共费用的结算。', category: '费用', status: 'active', version: 1, createdBy: MEMBER_LIN, createdAt: toISO(addDays(now, -40)), effectiveAt: toISO(addDays(now, -38)), icon: '🧾' },
    { id: 'a-kitchen', houseId: HOUSE_ID, title: '厨房使用与清洁', content: '使用后当日清洁灶台和餐具，不长时间占用水槽。', category: '卫生', status: 'active', version: 1, createdBy: MEMBER_ZHOU, createdAt: toISO(addDays(now, -25)), effectiveAt: toISO(addDays(now, -23)), icon: '🍳' },
  ]

  const votes: AgreementVote[] = [
    { id: 'v-silent-zhou', houseId: HOUSE_ID, agreementId: 'a-silent', memberId: MEMBER_ZHOU, agree: true, votedAt: toISO(addDays(now, -29)) },
    { id: 'v-silent-lin', houseId: HOUSE_ID, agreementId: 'a-silent', memberId: MEMBER_LIN, agree: true, votedAt: toISO(addDays(now, -29)) },
    { id: 'v-silent-xia', houseId: HOUSE_ID, agreementId: 'a-silent', memberId: MEMBER_XIA, agree: true, votedAt: toISO(addDays(now, -29)) },
    { id: 'v-visitor-xia', houseId: HOUSE_ID, agreementId: 'a-visitor', memberId: MEMBER_XIA, agree: true, votedAt: toISO(addDays(now, -1)) },
    { id: 'v-visitor-lin', houseId: HOUSE_ID, agreementId: 'a-visitor', memberId: MEMBER_LIN, agree: true, votedAt: toISO(addDays(now, -1)) },
    { id: 'v-fee-zhou', houseId: HOUSE_ID, agreementId: 'a-fee', memberId: MEMBER_ZHOU, agree: true, votedAt: toISO(addDays(now, -39)) },
    { id: 'v-fee-lin', houseId: HOUSE_ID, agreementId: 'a-fee', memberId: MEMBER_LIN, agree: true, votedAt: toISO(addDays(now, -39)) },
    { id: 'v-fee-xia', houseId: HOUSE_ID, agreementId: 'a-fee', memberId: MEMBER_XIA, agree: true, votedAt: toISO(addDays(now, -39)) },
    { id: 'v-kitchen-zhou', houseId: HOUSE_ID, agreementId: 'a-kitchen', memberId: MEMBER_ZHOU, agree: true, votedAt: toISO(addDays(now, -24)) },
    { id: 'v-kitchen-lin', houseId: HOUSE_ID, agreementId: 'a-kitchen', memberId: MEMBER_LIN, agree: true, votedAt: toISO(addDays(now, -24)) },
    { id: 'v-kitchen-xia', houseId: HOUSE_ID, agreementId: 'a-kitchen', memberId: MEMBER_XIA, agree: true, votedAt: toISO(addDays(now, -24)) },
  ]

  const activities: ActivityEvent[] = [
    { id: 'a1', houseId: HOUSE_ID, actorId: MEMBER_LIN, type: 'expense_added', targetId: 'e-elec', summary: '添加了 9 月电费', at: toISO(addDays(now, -2)) },
    { id: 'a2', houseId: HOUSE_ID, actorId: MEMBER_XIA, type: 'chore_done', targetId: 'c-living', summary: '完成了客厅清洁', at: toISO(addDays(now, -1)) },
    { id: 'a3', houseId: HOUSE_ID, actorId: MEMBER_ZHOU, type: 'supply_restocked', targetId: 'su-tissue', summary: '登记了公共物品：抽纸', at: toISO(addDays(now, -4)) },
  ]

  return {
    houses,
    currentHouseId: HOUSE_ID,
    members,
    expenses,
    shares,
    transfers: [],
    choreRules,
    choreTasks: chores,
    swapRequests,
    supplies,
    purchases: [],
    billReminders,
    billPayments: [],
    agreements,
    votes,
    agreementVersions: [],
    activities,
    currentUserId: MEMBER_ZHOU,
    splitRule: { mode: 'equal', participantIds: [] },
  }
}

export type SettleResult = 'ok' | 'insufficient' | 'denied' | 'missing' | 'none'

export interface AppState extends AppData {
  addExpense: (input: AddExpenseInput) => void
  deleteExpense: (expenseId: ID) => void
  settleShare: (expenseId: ID, shareId: ID) => SettleResult
  settleAll: () => SettleResult
  recharge: (amount: Money) => void
  completeChore: (taskId: ID, note?: string) => void
  generateNextWeek: () => void
  swapChore: (taskId: ID, withMemberId: ID) => void
  respondSwapRequest: (requestId: ID, accept: boolean) => void
  assignChoreTask: (area: ChoreArea, date: string, time?: string) => void
  deleteChoreTask: (taskId: ID) => void
  remindChore: (taskId: ID) => void
  registerSupply: (name: string, emoji: string, category: string, price: Money) => void
  deleteSupply: (supplyId: ID) => void
  proposeAgreement: (title: string, content: string, category: string, icon: string) => void
  deleteAgreement: (agreementId: ID) => void
  updateAgreement: (agreementId: ID, title: string, content: string) => void
  voteAgreement: (agreementId: ID, agree: boolean) => void
  remindAgreement: (agreementId: ID, memberId: ID) => void
  addMember: (name: string) => void
  switchAccount: (memberId: ID) => void
  saveSplitRule: (rule: SplitRule) => void
  remindExpense: (expenseId: ID, memberId: ID) => void
  addBillReminder: (title: string, amount: Money, dueDate: string, cycle: BillCycle) => void
  deleteBillReminder: (billId: ID) => void
  payBill: (billId: ID) => 'ok' | 'insufficient' | 'already' | 'missing' | 'paid'
  addHouse: (name: string) => void
  switchHouse: (houseId: ID) => void
  reset: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      /** 当前合租屋的成员 */
      const houseMembers = (state: AppData) => state.members.filter((m) => m.houseId === state.currentHouseId)

      return {
        ...createSeedData(),
        addExpense: (input) => {
          const { title, amount, category, payerId, date, splitMode, participants, customAmounts } = input
          const expenseId = uid('e')
          const now = new Date().toISOString()
          set((state) => {
            const selfId = state.currentUserId
            const split = buildShares({
              amount,
              participants,
              payerId,
              splitMode: splitMode === 'ratio' ? 'equal' : splitMode,
              customAmounts,
            })
            const newExpense: Expense = {
              id: expenseId,
              houseId: state.currentHouseId,
              title,
              amount: round2(amount),
              category,
              payerId,
              date,
              splitMode: splitMode === 'ratio' ? 'equal' : splitMode,
              createdAt: now,
              createdBy: selfId,
            }
            const newShares: ExpenseShare[] = split.map((s) => ({
              id: uid('s'),
              houseId: state.currentHouseId,
              expenseId,
              memberId: s.memberId,
              amount: round2(s.amount),
              settled: s.memberId === payerId,
              settledAt: s.memberId === payerId ? now : undefined,
            }))
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
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
        deleteExpense: (expenseId) => {
          set((state) => {
            const expense = state.expenses.find((e) => e.id === expenseId)
            if (!expense) return {}
            if (expense.createdBy && expense.createdBy !== state.currentUserId) return {}
            const now = new Date().toISOString()
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'expense_added',
              targetId: expenseId,
              summary: `删除了账单「${expense.title}」`,
              at: now,
            }
            return {
              expenses: state.expenses.filter((e) => e.id !== expenseId),
              shares: state.shares.filter((s) => s.expenseId !== expenseId),
              activities: [activity, ...state.activities],
            }
          })
        },
        settleShare: (expenseId, shareId) => {
          const state = get()
          const share = state.shares.find((s) => s.id === shareId)
          if (!share) return 'missing'
          if (share.memberId !== state.currentUserId) return 'denied'
          const expense = state.expenses.find((e) => e.id === expenseId && e.houseId === state.currentHouseId)
          if (!expense) return 'missing'
          const self = houseMembers(state).find((m) => m.id === state.currentUserId)
          if (!self || self.balance < share.amount) return 'insufficient'
          const now = new Date().toISOString()
          const payerName = houseMembers(state).find((m) => m.id === expense.payerId)?.name ?? '室友'
          set((s) => {
            const shares = s.shares.map((x) =>
              x.id === shareId ? { ...x, settled: true, settledAt: now } : x,
            )
            const members = s.members.map((m) => {
              if (m.id === s.currentUserId && m.houseId === s.currentHouseId) {
                return { ...m, balance: round2(m.balance - share.amount) }
              }
              if (m.id === expense.payerId && m.houseId === s.currentHouseId) {
                return { ...m, balance: round2(m.balance + share.amount) }
              }
              return m
            })
            const transfer: TransferRecord = {
              id: uid('t'),
              houseId: s.currentHouseId,
              expenseId,
              fromId: s.currentUserId,
              toId: expense.payerId,
              amount: share.amount,
              at: now,
            }
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: s.currentHouseId,
              actorId: s.currentUserId,
              type: 'expense_settled',
              targetId: expenseId,
              summary: `向${payerName}转账 ¥${share.amount.toFixed(2)} 结清「${expense.title}」`,
              at: now,
            }
            return {
              shares,
              members,
              transfers: [...s.transfers, transfer],
              activities: [activity, ...s.activities],
            }
          })
          return 'ok'
        },
        settleAll: () => {
          const state = get()
          const hid = state.currentHouseId
          const myShares = state.shares.filter((s) => {
            if (s.settled || s.memberId !== state.currentUserId) return false
            const e = state.expenses.find((x) => x.id === s.expenseId)
            return !!e && e.houseId === hid
          })
          if (myShares.length === 0) return 'none'
          const total = round2(myShares.reduce((sum, s) => sum + s.amount, 0))
          const self = houseMembers(state).find((m) => m.id === state.currentUserId)
          if (!self || self.balance < total) return 'insufficient'
          const now = new Date().toISOString()
          set((s) => {
            const ids = new Set(myShares.map((x) => x.id))
            const shares = s.shares.map((x) => (ids.has(x.id) ? { ...x, settled: true, settledAt: now } : x))
            const transfers: TransferRecord[] = []
            const members = s.members.map((m) => {
              let bal = m.balance
              if (m.id === s.currentUserId && m.houseId === s.currentHouseId) {
                bal = round2(bal - total)
              }
              for (const sh of myShares) {
                const e = s.expenses.find((x) => x.id === sh.expenseId)
                if (e && e.payerId === m.id && m.houseId === s.currentHouseId) {
                  bal = round2(bal + sh.amount)
                  transfers.push({
                    id: uid('t'),
                    houseId: s.currentHouseId,
                    expenseId: sh.expenseId,
                    fromId: s.currentUserId,
                    toId: m.id,
                    amount: sh.amount,
                    at: now,
                  })
                }
              }
              return bal === m.balance ? m : { ...m, balance: bal }
            })
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: s.currentHouseId,
              actorId: s.currentUserId,
              type: 'expense_settled',
              targetId: '',
              summary: `一键结清了我的 ${myShares.length} 笔待结算（共 ¥${total.toFixed(2)}）`,
              at: now,
            }
            return { shares, members, transfers: [...s.transfers, ...transfers], activities: [activity, ...s.activities] }
          })
          return 'ok'
        },
        recharge: (amount) => {
          const value = round2(amount)
          if (!(value > 0)) return
          set((state) => {
            const now = new Date().toISOString()
            const members = state.members.map((m) =>
              m.id === state.currentUserId && m.houseId === state.currentHouseId
                ? { ...m, balance: round2(m.balance + value) }
                : m,
            )
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'expense_settled',
              targetId: '',
              summary: `充值了 ¥${value.toFixed(2)}`,
              at: now,
            }
            return { members, activities: [activity, ...state.activities] }
          })
        },
        completeChore: (taskId, note) => {
          set((state) => {
            const task = state.choreTasks.find((c) => c.id === taskId)
            if (!task) return {}
            if (task.assigneeId !== state.currentUserId) return {}
            const now = new Date().toISOString()
            const cleanNote = note?.trim()
            const choreTasks = state.choreTasks.map((c) =>
              c.id === taskId
                ? { ...c, status: 'done' as const, completedAt: now, completedBy: state.currentUserId, note: cleanNote || undefined }
                : c,
            )
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'chore_done',
              targetId: taskId,
              summary: cleanNote ? `完成了${task.title}（备注：${cleanNote}）` : `完成了${task.title}`,
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
            const hid = state.currentHouseId
            if (state.choreTasks.some((c) => c.weekOf === nextWeek && c.houseId === hid)) return {}
            const now = new Date().toISOString()
            const newTasks: ChoreTask[] = state.choreTasks
              .filter((c) => c.weekOf === thisWeek && c.houseId === hid)
              .map((task) => {
                const rule = state.choreRules.find((r) => r.area === task.area)
                const rotateOrder = rule && rule.rotateOrder.length > 0
                  ? rule.rotateOrder
                  : houseMembers(state).map((m) => m.id)
                const idx = rotateOrder.indexOf(task.assigneeId)
                const nextAssignee = rotateOrder[(idx + 1) % rotateOrder.length]
                const dayOfWeek = DAYS.indexOf(task.dayLabel)
                const offset = (dayOfWeek - 1 + 7) % 7
                const dueDate = addDaysLocal(nextMonday, offset)
                dueDate.setHours(20, 0, 0, 0)
                return {
                  id: uid('c'),
                  houseId: hid,
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
              houseId: hid,
              actorId: state.currentUserId,
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
            if (task.assigneeId !== state.currentUserId) return {}
            if (state.swapRequests.some((r) => r.taskId === taskId && r.status === 'pending')) return {}
            const target = houseMembers(state).find((m) => m.id === withMemberId)
            const now = new Date().toISOString()
            const request: SwapRequest = {
              id: uid('sw'),
              taskId,
              fromId: state.currentUserId,
              toId: withMemberId,
              status: 'pending',
              createdAt: now,
            }
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'chore_swapped',
              targetId: taskId,
              summary: `向${target?.name ?? '室友'}发起了换班邀请（${task.title}）`,
              at: now,
              notifyId: withMemberId,
            }
            return { swapRequests: [...state.swapRequests, request], activities: [activity, ...state.activities] }
          })
        },
        respondSwapRequest: (requestId, accept) => {
          set((state) => {
            const request = state.swapRequests.find((r) => r.id === requestId)
            if (!request || request.status !== 'pending') return {}
            if (request.toId !== state.currentUserId) return {}
            const now = new Date().toISOString()
            const task = state.choreTasks.find((c) => c.id === request.taskId)
            const from = houseMembers(state).find((m) => m.id === request.fromId)
            const swapRequests = state.swapRequests.map((r) =>
              r.id === requestId ? { ...r, status: accept ? ('accepted' as const) : ('rejected' as const) } : r,
            )
            let choreTasks = state.choreTasks
            let activity: ActivityEvent
            if (accept && task) {
              choreTasks = state.choreTasks.map((c) =>
                c.id === request.taskId ? { ...c, assigneeId: request.toId, swappedFromId: request.fromId } : c,
              )
              activity = {
                id: uid('a'),
                houseId: state.currentHouseId,
                actorId: state.currentUserId,
                type: 'chore_swapped',
                targetId: request.taskId,
                summary: `同意换班，「${task.title}」已换给你`,
                at: now,
                notifyId: request.fromId,
              }
            } else {
              activity = {
                id: uid('a'),
                houseId: state.currentHouseId,
                actorId: state.currentUserId,
                type: 'chore_swapped',
                targetId: request.taskId,
                summary: `拒绝了${from?.name ?? '对方'}的换班邀请`,
                at: now,
                notifyId: request.fromId,
              }
            }
            return { swapRequests, choreTasks, activities: [activity, ...state.activities] }
          })
        },
        assignChoreTask: (area, date, time) => {
          set((state) => {
            const [y, m, d] = date.split('-').map(Number)
            if (!y || !m || !d) return {}
            if (date < dateKey(new Date())) return {}
            const [hh = 20, mm = 0] = (time ?? '20:00').split(':').map(Number)
            const dueDate = new Date(y, m - 1, d, hh, mm, 0, 0)
            const weekOf = dateKey(currentMonday(dueDate))
            const now = new Date().toISOString()
            const task: ChoreTask = {
              id: uid('c'),
              houseId: state.currentHouseId,
              ruleId: state.choreRules.find((r) => r.area === area)?.id,
              area,
              title: AREA_LABEL[area],
              assigneeId: state.currentUserId,
              weekOf,
              date: formatDate(dueDate),
              dayLabel: DAYS[dueDate.getDay()],
              dueAt: toISO(dueDate),
              status: 'pending',
            }
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'chore_rotated',
              targetId: task.id,
              summary: `认领了${DAYS[dueDate.getDay()]} ${hh}:${mm.toString().padStart(2, '0')} 的${AREA_LABEL[area]}值日`,
              at: now,
            }
            return { choreTasks: [...state.choreTasks, task], activities: [activity, ...state.activities] }
          })
        },
        deleteChoreTask: (taskId) => {
          set((state) => {
            const task = state.choreTasks.find((c) => c.id === taskId)
            if (!task) return {}
            if (task.assigneeId !== state.currentUserId) return {}
            const now = new Date().toISOString()
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'chore_rotated',
              targetId: taskId,
              summary: `删除了值日任务「${task.title}」`,
              at: now,
            }
            return {
              choreTasks: state.choreTasks.filter((c) => c.id !== taskId),
              activities: [activity, ...state.activities],
            }
          })
        },
        remindChore: (taskId) => {
          set((state) => {
            const task = state.choreTasks.find((c) => c.id === taskId)
            if (!task) return {}
            const target = houseMembers(state).find((m) => m.id === task.assigneeId)
            const now = new Date().toISOString()
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'chore_reminded',
              targetId: taskId,
              summary: `提醒${target?.name ?? '室友'}完成「${task.title}」值日`,
              at: now,
              notifyId: task.assigneeId,
            }
            return { activities: [activity, ...state.activities] }
          })
        },
        registerSupply: (name, emoji, category, price) => {
          set((state) => {
            const selfId = state.currentUserId
            const now = new Date().toISOString()
            const value = round2(price)
            const existing = state.supplies.find((s) => s.name === name && s.houseId === state.currentHouseId)
            const supplyId = existing?.id ?? uid('su')
            const supplies = existing
              ? state.supplies.map((s) => (s.id === supplyId ? { ...s, refPrice: value, createdBy: selfId, createdAt: now, emoji, category } : s))
              : [...state.supplies, { id: supplyId, houseId: state.currentHouseId, name, emoji, category, createdBy: selfId, createdAt: now, refPrice: value }]

            const eid = uid('e')
            const split = buildShares({
              amount: value,
              participants: houseMembers(state).map((m) => m.id),
              payerId: selfId,
              splitMode: 'equal',
            })
            const newExpense: Expense = {
              id: eid,
              houseId: state.currentHouseId,
              title: `公共物品：${name}`,
              amount: value,
              category: 'daily',
              payerId: selfId,
              date: dateKey(new Date()),
              splitMode: 'equal',
              supplyId,
              createdAt: now,
              createdBy: selfId,
            }
            const newShares: ExpenseShare[] = split.map((s) => ({
              id: uid('s'),
              houseId: state.currentHouseId,
              expenseId: eid,
              memberId: s.memberId,
              amount: s.amount,
              settled: s.memberId === selfId,
              settledAt: s.memberId === selfId ? now : undefined,
            }))
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: selfId,
              type: 'supply_restocked',
              targetId: supplyId,
              summary: `登记了公共物品「${name}」（¥${value.toFixed(2)}），已生成 AA 账单`,
              at: now,
            }
            return {
              supplies,
              purchases: [...state.purchases, { id: uid('p'), houseId: state.currentHouseId, supplyId, buyerId: selfId, price: value, boughtAt: now, expenseId: eid }],
              expenses: [...state.expenses, newExpense],
              shares: [...state.shares, ...newShares],
              activities: [activity, ...state.activities],
            }
          })
        },
        deleteSupply: (supplyId) => {
          set((state) => {
            const supply = state.supplies.find((s) => s.id === supplyId)
            if (!supply) return {}
            if (supply.createdBy !== state.currentUserId) return {}
            const now = new Date().toISOString()
            const linkedExpenseIds = state.expenses.filter((e) => e.supplyId === supplyId).map((e) => e.id)
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'supply_restocked',
              targetId: supplyId,
              summary: `移除了公共物品「${supply.name}」及其账单`,
              at: now,
            }
            return {
              supplies: state.supplies.filter((s) => s.id !== supplyId),
              purchases: state.purchases.filter((p) => p.supplyId !== supplyId),
              expenses: state.expenses.filter((e) => e.supplyId !== supplyId),
              shares: state.shares.filter((s) => !linkedExpenseIds.includes(s.expenseId)),
              activities: [activity, ...state.activities],
            }
          })
        },
        proposeAgreement: (title, content, category, icon) => {
          set((state) => {
            const selfId = state.currentUserId
            const now = new Date().toISOString()
            const agreement: Agreement = {
              id: uid('ag'),
              houseId: state.currentHouseId,
              title,
              content,
              category,
              status: 'voting',
              version: 1,
              createdBy: selfId,
              createdAt: now,
              icon,
            }
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: selfId,
              type: 'agreement_proposed',
              targetId: agreement.id,
              summary: `发起了新公约「${title}」`,
              at: now,
            }
            return { agreements: [...state.agreements, agreement], activities: [activity, ...state.activities] }
          })
        },
        deleteAgreement: (agreementId) => {
          set((state) => {
            const agreement = state.agreements.find((a) => a.id === agreementId)
            if (!agreement) return {}
            if (agreement.createdBy !== state.currentUserId) return {}
            const now = new Date().toISOString()
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'agreement_proposed',
              targetId: agreementId,
              summary: `删除了公约「${agreement.title}」`,
              at: now,
            }
            return {
              agreements: state.agreements.filter((a) => a.id !== agreementId),
              votes: state.votes.filter((v) => v.agreementId !== agreementId),
              activities: [activity, ...state.activities],
            }
          })
        },
        updateAgreement: (agreementId, title, content) => {
          set((state) => {
            const agreement = state.agreements.find((a) => a.id === agreementId)
            if (!agreement) return {}
            if (agreement.createdBy !== state.currentUserId) return {}
            const now = new Date().toISOString()
            const historyEntry: AgreementVersion = {
              id: uid('av'),
              houseId: state.currentHouseId,
              agreementId,
              title: agreement.title,
              content: agreement.content,
              version: agreement.version,
              editedBy: agreement.createdBy,
              editedAt: agreement.createdAt,
            }
            const newVersion = agreement.version + 1
            const agreements = state.agreements.map((a) =>
              a.id === agreementId
                ? { ...a, title, content, version: newVersion, status: 'voting' as const, effectiveAt: undefined }
                : a,
            )
            const votes = state.votes.filter((v) => v.agreementId !== agreementId)
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'agreement_proposed',
              targetId: agreementId,
              summary: `修改了公约「${title}」（v${newVersion}），需全员重新确认`,
              at: now,
            }
            return {
              agreements,
              agreementVersions: [...state.agreementVersions, historyEntry],
              votes,
              activities: [activity, ...state.activities],
            }
          })
        },
        voteAgreement: (agreementId, agree) => {
          set((state) => {
            const agreement = state.agreements.find((a) => a.id === agreementId)
            if (!agreement) return {}
            const selfId = state.currentUserId
            const now = new Date().toISOString()
            const alreadyVoted = state.votes.some((v) => v.agreementId === agreementId && v.memberId === selfId)
            if (alreadyVoted) return {}
            const votes = [...state.votes, { id: uid('v'), houseId: state.currentHouseId, agreementId, memberId: selfId, agree, votedAt: now }]
            const agreeCount = votes.filter((v) => v.agreementId === agreementId && v.agree).length
            const memberCount = houseMembers(state).length
            const allAgreed = agreeCount >= memberCount
            const agreements = state.agreements.map((a) =>
              a.id === agreementId ? { ...a, status: allAgreed ? ('active' as const) : a.status, effectiveAt: allAgreed ? now : a.effectiveAt } : a,
            )
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: selfId,
              type: 'agreement_voted',
              targetId: agreementId,
              summary: allAgreed ? `「${agreement.title}」全员通过，已生效` : `同意了「${agreement.title}」`,
              at: now,
            }
            return { votes, agreements, activities: [activity, ...state.activities] }
          })
        },
        remindAgreement: (agreementId, memberId) => {
          set((state) => {
            const agreement = state.agreements.find((a) => a.id === agreementId)
            const target = houseMembers(state).find((m) => m.id === memberId)
            if (!agreement || !target) return {}
            const now = new Date().toISOString()
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'agreement_reminded',
              targetId: agreementId,
              summary: `提醒${target.name}遵守「${agreement.title}」`,
              at: now,
              notifyId: memberId,
            }
            return { activities: [activity, ...state.activities] }
          })
        },
        addMember: (name) => {
          set((state) => {
            if (!name.trim()) return {}
            const now = new Date().toISOString()
            const member: Member = {
              id: uid('m'),
              houseId: state.currentHouseId,
              name: name.trim(),
              initials: name.trim().slice(0, 1),
              color: COLOR_PALETTE[houseMembers(state).length % COLOR_PALETTE.length],
              isSelf: false,
              role: 'member',
              joinedAt: now,
              status: '在家',
              balance: 0,
            }
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'member_added',
              targetId: member.id,
              summary: `邀请 ${member.name} 加入了合租屋`,
              at: now,
            }
            return { members: [...state.members, member], activities: [activity, ...state.activities] }
          })
        },
        switchAccount: (memberId) => {
          set((state) => {
            const member = state.members.find((m) => m.id === memberId)
            if (!member) return {}
            const inCurrent = state.members.some((m) => m.houseId === state.currentHouseId && m.id === memberId)
            if (inCurrent) return { currentUserId: memberId }
            // 目标不在当前房：自动跳到该成员所在的合租屋
            return { currentUserId: memberId, currentHouseId: member.houseId }
          })
        },
        saveSplitRule: (rule) => {
          set({ splitRule: rule })
        },
        remindExpense: (expenseId, memberId) => {
          set((state) => {
            const expense = state.expenses.find((e) => e.id === expenseId)
            const share = state.shares.find((s) => s.expenseId === expenseId && s.memberId === memberId && !s.settled)
            if (!expense || !share) return {}
            const target = houseMembers(state).find((m) => m.id === memberId)
            const now = new Date().toISOString()
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'expense_reminded',
              targetId: expenseId,
              summary: `催${target?.name ?? '室友'}结清「${expense.title}」的 ¥${share.amount.toFixed(2)}`,
              at: now,
              notifyId: memberId,
            }
            return { activities: [activity, ...state.activities] }
          })
        },
        addBillReminder: (title, amount, dueDate, cycle) => {
          set((state) => {
            const now = new Date().toISOString()
            const bill: BillReminder = {
              id: uid('b'),
              houseId: state.currentHouseId,
              title,
              amount: round2(amount),
              dueDate,
              cycle,
              initiatorId: state.currentUserId,
              createdBy: state.currentUserId,
              createdAt: now,
              status: 'pending',
            }
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: state.currentHouseId,
              actorId: state.currentUserId,
              type: 'expense_added',
              targetId: bill.id,
              summary: `发起了共同缴费「${title}」（¥${round2(amount).toFixed(2)}，${dueDate} 截止）`,
              at: now,
            }
            return { billReminders: [...state.billReminders, bill], activities: [activity, ...state.activities] }
          })
        },
        deleteBillReminder: (billId) => {
          set((state) => {
            const bill = state.billReminders.find((b) => b.id === billId)
            if (!bill) return {}
            if (bill.createdBy !== state.currentUserId) return {}
            return {
              billReminders: state.billReminders.filter((b) => b.id !== billId),
              billPayments: state.billPayments.filter((p) => p.billId !== billId),
            }
          })
        },
        payBill: (billId) => {
          const state = get()
          const bill = state.billReminders.find((b) => b.id === billId)
          if (!bill) return 'missing'
          if (bill.status === 'paid') return 'paid'
          const members = state.members.filter((m) => m.houseId === bill.houseId)
          const n = members.length || 1
          const perMember = round2(bill.amount / n)
          if (state.billPayments.some((p) => p.billId === billId && p.memberId === state.currentUserId)) return 'already'
          const self = members.find((m) => m.id === state.currentUserId)
          if (!self || self.balance < perMember) return 'insufficient'
          const now = new Date().toISOString()
          set((s) => {
            const members2 = s.members.map((m) => {
              let bal = m.balance
              if (m.id === s.currentUserId && m.houseId === bill.houseId) {
                bal = round2(bal - perMember)
              }
              if (m.id === bill.initiatorId && m.houseId === bill.houseId) {
                bal = round2(bal + perMember)
              }
              return bal === m.balance ? m : { ...m, balance: bal }
            })
            const payment: BillPayment = {
              id: uid('bp'),
              houseId: bill.houseId,
              billId,
              memberId: s.currentUserId,
              amount: perMember,
              paidAt: now,
            }
            const newPayments = [...s.billPayments, payment]
            const allPaid = newPayments.filter((p) => p.billId === billId).length >= n
            let billReminders = s.billReminders.map((b) =>
              b.id === billId ? { ...b, status: allPaid ? ('paid' as const) : b.status } : b,
            )
            let summary = `支付了「${bill.title}」的 ¥${perMember.toFixed(2)}`
            if (allPaid) {
              const initiator = s.members.find((m) => m.id === bill.initiatorId)
              summary = `「${bill.title}」全员已缴，款项已汇给${initiator?.name ?? '发起人'}`
              if (bill.cycle !== 'once') {
                const next: BillReminder = {
                  ...bill,
                  id: uid('b'),
                  dueDate: nextDueDate(bill.dueDate, bill.cycle),
                  status: 'pending',
                  createdAt: now,
                }
                billReminders = [...billReminders, next]
              }
            }
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: s.currentHouseId,
              actorId: s.currentUserId,
              type: 'expense_settled',
              targetId: billId,
              summary,
              at: now,
            }
            return { members: members2, billPayments: newPayments, billReminders, activities: [activity, ...s.activities] }
          })
          return 'ok'
        },
        addHouse: (name) => {
          set((state) => {
            if (!name.trim()) return {}
            const now = new Date().toISOString()
            const hid = uid('h')
            const house: House = {
              id: hid,
              name: name.trim(),
              createdAt: now,
              settlementDay: 15,
            }
            const self = houseMembers(state).find((m) => m.id === state.currentUserId)
            const member: Member = {
              id: state.currentUserId,
              houseId: hid,
              name: self?.name ?? '我',
              initials: self?.initials ?? '我',
              color: self?.color ?? COLOR_PALETTE[0],
              isSelf: true,
              role: 'owner',
              joinedAt: now,
              status: '在家',
              balance: 0,
            }
            const activity: ActivityEvent = {
              id: uid('a'),
              houseId: hid,
              actorId: state.currentUserId,
              type: 'member_added',
              targetId: hid,
              summary: `创建了新合租屋「${house.name}」`,
              at: now,
            }
            return {
              houses: [...state.houses, house],
              members: [...state.members, member],
              activities: [activity, ...state.activities],
              currentHouseId: hid,
            }
          })
        },
        switchHouse: (houseId) => {
          set((state) => {
            if (!state.houses.some((h) => h.id === houseId)) return {}
            if (!state.members.some((m) => m.houseId === houseId && m.id === state.currentUserId)) return {}
            return { currentHouseId: houseId }
          })
        },
        reset: () => set({ ...createSeedData() }),
      }
    },
    {
      name: 'cohome:store',
      version: 8,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        houses: state.houses,
        currentHouseId: state.currentHouseId,
        members: state.members,
        expenses: state.expenses,
        shares: state.shares,
        transfers: state.transfers,
        choreRules: state.choreRules,
        choreTasks: state.choreTasks,
        swapRequests: state.swapRequests,
        supplies: state.supplies,
        purchases: state.purchases,
        billReminders: state.billReminders,
        billPayments: state.billPayments,
        agreements: state.agreements,
        votes: state.votes,
        agreementVersions: state.agreementVersions,
        activities: state.activities,
        currentUserId: state.currentUserId,
        splitRule: state.splitRule,
      }),
    },
  ),
)
