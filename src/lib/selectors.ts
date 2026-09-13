import type {
  AddExpenseInput,
  Agreement,
  AppData,
  BillReminder,
  ChoreTask,
  Expense,
  ExpenseShare,
  ID,
  Member,
  Money,
} from './types'

export function getSelf(state: AppData): Member | undefined {
  return state.members.find((m) => m.id === state.currentUserId)
}

export function getMember(state: AppData, id: ID): Member | undefined {
  return state.members.find((m) => m.id === id)
}

export function getExpense(state: AppData, id: ID): Expense | undefined {
  return state.expenses.find((e) => e.id === id)
}

export function yuan(fen: Money): string {
  return (fen / 100).toFixed(2)
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 172_800_000) return '昨天'
  const d = new Date(iso)
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

export function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysLocal(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function currentMonday(date = new Date()): Date {
  const monday = new Date(date)
  monday.setHours(0, 0, 0, 0)
  const day = (monday.getDay() + 6) % 7
  monday.setDate(monday.getDate() - day)
  return monday
}

export function greeting(hour = new Date().getHours()): string {
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

export function todayLabel(date = new Date()): string {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日 · ${days[date.getDay()]}`
}

export function computeNetBalances(state: AppData): Record<ID, Money> {
  const net: Record<ID, Money> = {}
  for (const m of state.members) net[m.id] = 0
  for (const share of state.shares) {
    if (share.settled) continue
    const expense = getExpense(state, share.expenseId)
    if (!expense) continue
    if (expense.payerId === share.memberId) continue
    net[expense.payerId] += share.amount
    net[share.memberId] -= share.amount
  }
  return net
}

export interface Settlement {
  from: ID
  to: ID
  amount: Money
}

export function computeSettlements(state: AppData): Settlement[] {
  const net = computeNetBalances(state)
  const creditors: { id: ID; amount: Money }[] = []
  const debtors: { id: ID; amount: Money }[] = []
  for (const [id, value] of Object.entries(net)) {
    if (value > 0) creditors.push({ id, amount: value })
    else if (value < 0) debtors.push({ id, amount: -value })
  }
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)
  const result: Settlement[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount)
    result.push({ from: debtors[i].id, to: creditors[j].id, amount })
    debtors[i].amount -= amount
    creditors[j].amount -= amount
    if (debtors[i].amount === 0) i += 1
    if (creditors[j].amount === 0) j += 1
  }
  return result
}

export interface PendingShare {
  share: ExpenseShare
  expense: Expense
  payer: Member | undefined
}

export function pendingSharesFor(state: AppData, memberId: ID): PendingShare[] {
  const result: PendingShare[] = []
  for (const share of state.shares) {
    if (share.memberId !== memberId || share.settled) continue
    const expense = getExpense(state, share.expenseId)
    if (!expense) continue
    result.push({ share, expense, payer: getMember(state, expense.payerId) })
  }
  return result
}

export function payeesCountFor(state: AppData, memberId: ID): number {
  const payees = new Set<ID>()
  for (const pending of pendingSharesFor(state, memberId)) {
    payees.add(pending.expense.payerId)
  }
  return payees.size
}

export function myChoreThisWeek(state: AppData, memberId: ID): ChoreTask | undefined {
  const weekOf = dateKey(currentMonday())
  return state.choreTasks.find(
    (c) => c.assigneeId === memberId && c.weekOf === weekOf && c.status === 'pending',
  )
}

export function myChoreToday(state: AppData, memberId: ID): ChoreTask | undefined {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return state.choreTasks.find((c) => {
    if (c.assigneeId !== memberId || c.status !== 'pending') return false
    const due = new Date(c.dueAt).getTime()
    return due >= start.getTime() && due <= end.getTime()
  })
}

export type ReminderStage = 'start' | 'due-soon'

export function choreReminderStage(task: ChoreTask, now = new Date()): ReminderStage {
  const due = new Date(task.dueAt).getTime()
  const twoHoursBefore = due - 2 * 3_600_000
  return now.getTime() >= twoHoursBefore ? 'due-soon' : 'start'
}

export function choresThisWeek(state: AppData): ChoreTask[] {
  const weekOf = dateKey(currentMonday())
  return state.choreTasks.filter((c) => c.weekOf === weekOf)
}

export function choresDoneCount(state: AppData): number {
  return choresThisWeek(state).filter((c) => c.status === 'done').length
}

export function nextWeekGenerated(state: AppData): boolean {
  const weekOf = dateKey(addDaysLocal(currentMonday(), 7))
  return state.choreTasks.some((c) => c.weekOf === weekOf)
}

export function weekRangeLabel(): { weekNumber: number; label: string } {
  const monday = currentMonday()
  const sunday = addDaysLocal(monday, 6)
  const startOfYear = new Date(monday.getFullYear(), 0, 1)
  const weekNumber = Math.ceil((monday.getTime() - startOfYear.getTime()) / 86400000 / 7) + 1
  const label = `${monday.getMonth() + 1} 月 ${monday.getDate()} 日 — ${sunday.getMonth() + 1} 月 ${sunday.getDate()} 日`
  return { weekNumber, label }
}

export function formatDue(dueAt: string): string {
  const due = new Date(dueAt)
  const hours = `${due.getHours().toString().padStart(2, '0')}:00`
  return `${hours} 前完成`
}

export interface NotificationItem {
  id: string
  kind: 'reminded' | 'settle' | 'chore'
  text: string
  sub: string
  at: string
}

export function notificationsFor(state: AppData, memberId: ID): NotificationItem[] {
  const items: NotificationItem[] = []
  for (const act of state.activities) {
    if (act.notifyId !== memberId) continue
    const actor = getMember(state, act.actorId)
    items.push({
      id: `n-${act.id}`,
      kind: 'reminded',
      text: `${actor?.name ?? '室友'} 提醒了你`,
      sub: act.summary,
      at: act.at,
    })
  }
  for (const pending of pendingSharesFor(state, memberId)) {
    items.push({
      id: `n-settle-${pending.share.id}`,
      kind: 'settle',
      text: `待支付「${pending.expense.title}」`,
      sub: `应付给 ${pending.payer?.name ?? '室友'} ¥${yuan(pending.share.amount)}`,
      at: pending.expense.createdAt,
    })
  }
  const chore = myChoreToday(state, memberId)
  if (chore) {
    items.push({
      id: `n-chore-${chore.id}`,
      kind: 'chore',
      text: `今天轮到你值日「${chore.title}」`,
      sub: '今晚 20:00 前完成',
      at: chore.dueAt,
    })
  }
  items.sort((a, b) => (a.at < b.at ? 1 : -1))
  return items
}

export interface MonthlySummary {
  total: Money
  count: number
  byCategory: Record<string, Money>
  prevTotal: Money
}

export function monthlySummary(state: AppData, now = new Date()): MonthlySummary {
  const y = now.getFullYear()
  const m = now.getMonth()
  const prefix = `${y}-${String(m + 1).padStart(2, '0')}`
  const prevPrefix = m === 0 ? `${y - 1}-12` : `${y}-${String(m).padStart(2, '0')}`
  let total = 0
  let prevTotal = 0
  let count = 0
  const byCategory: Record<string, Money> = {}
  for (const e of state.expenses) {
    if (e.date.startsWith(prefix)) {
      total += e.amount
      count += 1
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount
    } else if (e.date.startsWith(prevPrefix)) {
      prevTotal += e.amount
    }
  }
  return { total, count, byCategory, prevTotal }
}

export function daysLeft(bill: BillReminder, now = new Date()): number {
  const [y, m, d] = bill.dueDate.split('-').map(Number)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueStart = new Date(y, m - 1, d)
  return Math.round((dueStart.getTime() - todayStart.getTime()) / 86_400_000)
}

export function upcomingBills(state: AppData): BillReminder[] {
  return state.billReminders
    .filter((b) => !b.paid)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
}

export function agreementAwaitingSelf(state: AppData, memberId: ID): Agreement | undefined {
  return state.agreements.find(
    (a) =>
      a.status === 'voting' &&
      !state.votes.some((v) => v.agreementId === a.id && v.memberId === memberId),
  )
}

export interface SplitShare {
  memberId: ID
  amount: Money
}

export function buildShares(input: {
  amount: Money
  participants: ID[]
  payerId: ID
  splitMode: 'equal' | 'custom'
  customAmounts?: Record<ID, Money>
}): SplitShare[] {
  const { amount, participants, payerId, splitMode, customAmounts } = input
  if (splitMode === 'custom' && customAmounts) {
    return participants.map((pid) => ({ memberId: pid, amount: customAmounts[pid] ?? 0 }))
  }
  const n = participants.length
  if (n === 0) return []
  const base = Math.floor(amount / n)
  const remainder = amount - base * n
  return participants.map((pid) => ({
    memberId: pid,
    amount: pid === payerId ? base + remainder : base,
  }))
}

export function yuanToFen(yuan: number): Money {
  return Math.round(yuan * 100)
}

export interface MoneySummary {
  total: Money
  count: number
}

export function payableFor(state: AppData, memberId: ID): MoneySummary {
  let total = 0
  let count = 0
  for (const share of state.shares) {
    if (share.memberId === memberId && !share.settled) {
      total += share.amount
      count += 1
    }
  }
  return { total, count }
}

export function receivableFor(state: AppData, memberId: ID): MoneySummary {
  let total = 0
  let count = 0
  for (const share of state.shares) {
    if (share.settled || share.memberId === memberId) continue
    const expense = getExpense(state, share.expenseId)
    if (expense && expense.payerId === memberId) {
      total += share.amount
      count += 1
    }
  }
  return { total, count }
}

export function expenseTotal(state: AppData): Money {
  return state.expenses.reduce((sum, e) => sum + e.amount, 0)
}

export function expenseShares(state: AppData, expenseId: ID): ExpenseShare[] {
  return state.shares.filter((s) => s.expenseId === expenseId)
}

export interface ExpenseStatus {
  label: string
  kind: 'success' | 'warm' | 'danger'
}

export function expenseStatus(state: AppData, expense: Expense, selfId: ID): ExpenseStatus {
  const shares = expenseShares(state, expense.id)
  const unsettled = shares.filter((s) => !s.settled)
  if (unsettled.length === 0) return { label: '已结清', kind: 'success' }
  const payees = new Set(unsettled.map((s) => s.memberId))
  if (expense.payerId === selfId) return { label: `${payees.size} 人待结算`, kind: 'warm' }
  if (unsettled.some((s) => s.memberId === selfId)) return { label: '待我结算', kind: 'danger' }
  return { label: `${payees.size} 人待结算`, kind: 'warm' }
}