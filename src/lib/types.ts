export type ID = string
/** 金额单位：元（浮点数；显示用 toFixed(2)，计算用 round2 控制精度） */
export type Money = number

export type SplitMode = 'equal' | 'custom' | 'ratio'
export type ExpenseCategory = 'rent' | 'utility' | 'daily' | 'internet' | 'other'

export interface AddExpenseInput {
  title: string
  amount: Money
  category: ExpenseCategory
  payerId: ID
  date: string
  splitMode: SplitMode
  participants: ID[]
  customAmounts?: Record<ID, Money>
}

export interface House {
  id: ID
  name: string
  createdAt: string
  settlementDay: number
}

export interface Member {
  id: ID
  houseId: ID
  name: string
  initials: string
  color: string
  isSelf: boolean
  role: 'owner' | 'member'
  joinedAt: string
  status: '在家' | '外出'
  balance: Money
}

export interface Expense {
  id: ID
  houseId: ID
  title: string
  amount: Money
  category: ExpenseCategory
  payerId: ID
  date: string
  splitMode: SplitMode
  note?: string
  supplyId?: ID
  createdAt: string
  createdBy?: ID
}

export interface ExpenseShare {
  id: ID
  houseId: ID
  expenseId: ID
  memberId: ID
  amount: Money
  settled: boolean
  settledAt?: string
}

/** 转账记录：某人结清分摊时，钱从付款人流向垫付人 */
export interface TransferRecord {
  id: ID
  houseId: ID
  expenseId: ID
  fromId: ID
  toId: ID
  amount: Money
  at: string
}

export type ChoreArea = 'kitchen' | 'living' | 'bathroom' | 'trash' | 'custom'
export type ChoreStatus = 'pending' | 'done'

export interface ChoreRule {
  id: ID
  houseId: ID
  area: ChoreArea
  label: string
  frequency: 'daily' | 'weekly' | 'biweekly'
  weekday?: number
  rotateOrder: ID[]
  startDate: string
}

export interface ChoreTask {
  id: ID
  houseId: ID
  ruleId?: ID
  area: ChoreArea
  title: string
  assigneeId: ID
  weekOf: string
  date: string
  dayLabel: string
  dueAt: string
  status: ChoreStatus
  completedAt?: string
  completedBy?: ID
  swappedFromId?: ID
  note?: string
}

export type SwapStatus = 'pending' | 'accepted' | 'rejected'

export interface SwapRequest {
  id: ID
  taskId: ID
  fromId: ID
  toId: ID
  status: SwapStatus
  createdAt: string
}

export interface Supply {
  id: ID
  houseId: ID
  name: string
  emoji: string
  category: string
  createdBy: ID
  createdAt: string
  refPrice?: Money
}

export interface PurchaseLog {
  id: ID
  houseId: ID
  supplyId: ID
  buyerId: ID
  price: Money
  boughtAt: string
  expenseId?: ID
}

export type BillCycle = 'once' | 'weekly' | 'monthly' | 'yearly'

/** 缴费日：水电等共同缴费，有截止日、可按周期循环，全员付款才算已缴，款项汇给发起人 */
export interface BillReminder {
  id: ID
  houseId: ID
  title: string
  amount: Money
  dueDate: string
  cycle: BillCycle
  initiatorId: ID
  createdBy: ID
  createdAt: string
  status: 'pending' | 'paid'
}

export interface BillPayment {
  id: ID
  houseId: ID
  billId: ID
  memberId: ID
  amount: Money
  paidAt: string
}

export type AgreementStatus = 'draft' | 'voting' | 'active' | 'archived'

export interface Agreement {
  id: ID
  houseId: ID
  title: string
  content: string
  category: string
  status: AgreementStatus
  version: number
  createdBy: ID
  createdAt: string
  effectiveAt?: string
  icon: string
}

export interface AgreementVote {
  id: ID
  houseId: ID
  agreementId: ID
  memberId: ID
  agree: boolean
  votedAt: string
}

export interface AgreementVersion {
  id: ID
  houseId: ID
  agreementId: ID
  title: string
  content: string
  version: number
  editedBy: ID
  editedAt: string
}

export type ActivityType =
  | 'expense_added'
  | 'expense_settled'
  | 'chore_done'
  | 'chore_rotated'
  | 'chore_swapped'
  | 'supply_low'
  | 'supply_restocked'
  | 'agreement_voted'
  | 'agreement_reminded'
  | 'agreement_proposed'
  | 'chore_reminded'
  | 'member_added'
  | 'expense_reminded'

export interface ActivityEvent {
  id: ID
  houseId: ID
  actorId: ID
  type: ActivityType
  targetId: ID
  summary: string
  at: string
  notifyId?: ID
}

export interface SplitRule {
  mode: 'equal' | 'custom'
  participantIds: ID[]
}

/** AI 小助手：回答里的可点击跳转按钮 */
export interface AssistantRoute {
  path: string
  label: string
}

/** AI 小助手：一条聊天消息（content 为已剥离跳转标记的纯文本） */
export interface AssistantMessage {
  id: ID
  role: 'user' | 'assistant'
  content: string
  routes: AssistantRoute[]
  isError?: boolean
  createdAt: string
}

export interface AppData {
  houses: House[]
  currentHouseId: ID
  members: Member[]
  expenses: Expense[]
  shares: ExpenseShare[]
  transfers: TransferRecord[]
  choreRules: ChoreRule[]
  choreTasks: ChoreTask[]
  swapRequests: SwapRequest[]
  supplies: Supply[]
  purchases: PurchaseLog[]
  billReminders: BillReminder[]
  billPayments: BillPayment[]
  agreements: Agreement[]
  votes: AgreementVote[]
  agreementVersions: AgreementVersion[]
  activities: ActivityEvent[]
  currentUserId: ID
  splitRule: SplitRule
  /** AI 小助手：用户自填的 DeepSeek API Key（BYOK，仅存本机浏览器） */
  assistantKey: string
  assistantMessages: AssistantMessage[]
}