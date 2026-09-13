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

export interface BillReminder {
  id: ID
  houseId: ID
  title: string
  amount: Money
  dueDate: string
  createdBy: ID
  createdAt: string
  paid: boolean
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

export interface AppData {
  houses: House[]
  currentHouseId: ID
  members: Member[]
  expenses: Expense[]
  shares: ExpenseShare[]
  choreRules: ChoreRule[]
  choreTasks: ChoreTask[]
  swapRequests: SwapRequest[]
  supplies: Supply[]
  purchases: PurchaseLog[]
  billReminders: BillReminder[]
  agreements: Agreement[]
  votes: AgreementVote[]
  agreementVersions: AgreementVersion[]
  activities: ActivityEvent[]
  currentUserId: ID
  splitRule: SplitRule
}