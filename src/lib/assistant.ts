import type { AppData, AssistantRoute } from './types'
import {
  agreementAwaitingSelf,
  daysLeft,
  formatDue,
  getSelf,
  myChoreThisWeek,
  myChoreToday,
  payableFor,
  pendingSharesFor,
  upcomingBills,
  yuan,
} from './selectors'

export const DEEPSEEK_BASE = 'https://api.deepseek.com'
export const DEEPSEEK_MODEL = 'deepseek-chat'
export const MAX_HISTORY = 12

/** 静态「应用说明书」：描述每个页面的作用与权限规则，让模型知道往哪指路 */
const APP_GUIDE = [
  '「合住 CoHome」应用结构与功能说明：',
  '- 今日首页 /：问候、我的余额、我的值日、待办聚合、本周合住默契分',
  '- 费用 AA /expenses：记公共支出（均摊或自定义分摊）、结清我的分摊、一键结清、催缴室友、账单明细与转账记录、共同缴费（「缴费日」：房租水电等按周期发起，全员缴纳后款项汇给发起人）、本月支出统计。注意：「账单」是某次公共支出的 AA 分摊；「缴费日」是全员共同缴费，两者不同，都在本页。',
  '- 清洁值日 /chores：认领本周值日（只能认领给自己）、完成打卡（可附凭证备注）、发起换班（需对方同意）、提醒室友',
  '- 公共物品 /supplies：登记公共物品（自愿登记，登记即自动生成一张全员 AA 账单）',
  '- 室友公约 /agreements：发起公约、投票（全员同意才生效、每人限投一次）、修改（会回到投票状态并保留版本历史）、提醒室友遵守',
  '- 使用说明 /guide：完整图文教程',
  '- 设置 /settings：浅色/深色主题、AI 小助手的 API Key 管理',
  '权限规则：只能删除自己创建的记录；只能结清自己的分摊；值日只能认领给自己；公约每人限投一次。',
].join('\n')

/** 把当前用户的真实数据压缩成一小段可信快照，注入 prompt（防幻觉） */
export function buildContextSnapshot(state: AppData): string {
  const self = getSelf(state)
  const house = state.houses.find((h) => h.id === state.currentHouseId)
  const members = state.members.filter((m) => m.houseId === state.currentHouseId)
  const lines: string[] = []
  lines.push(`- 当前用户：${self?.name ?? '未知'}（账号视角）`)
  lines.push(`- 当前合租屋：${house?.name ?? '未知'}；室友：${members.map((m) => m.name).join('、')}（共 ${members.length} 人）`)
  lines.push(`- 我的钱包余额：¥${yuan(self?.balance ?? 0)}`)
  const payable = payableFor(state, state.currentUserId)
  if (payable.count > 0) {
    const details = pendingSharesFor(state, state.currentUserId)
      .slice(0, 5)
      .map((p) => `「${p.expense.title}」¥${yuan(p.share.amount)} 付给 ${p.payer?.name ?? '室友'}`)
      .join('；')
    lines.push(`- 我的待结算：共 ${payable.count} 笔，合计 ¥${yuan(payable.total)}（${details}）`)
  } else {
    lines.push('- 我的待结算：无')
  }
  const choreToday = myChoreToday(state, state.currentUserId)
  const choreWeek = myChoreThisWeek(state, state.currentUserId)
  if (choreToday) lines.push(`- 我今天值日：「${choreToday.title}」，${formatDue(choreToday.dueAt)}`)
  else if (choreWeek) lines.push(`- 我本周值日：「${choreWeek.title}」，${formatDue(choreWeek.dueAt)}`)
  else lines.push('- 我的值日：本周暂无')
  const bills = upcomingBills(state).slice(0, 4)
  if (bills.length > 0) {
    lines.push(
      `- 进行中的共同缴费：${bills
        .map((b) => {
          const d = daysLeft(b)
          const when = d < 0 ? `已逾期 ${-d} 天` : d === 0 ? '今天截止' : `还剩 ${d} 天`
          return `「${b.title}」¥${yuan(b.amount)}（${when}）`
        })
        .join('；')}`,
    )
  } else {
    lines.push('- 进行中的共同缴费：无')
  }
  const awaiting = agreementAwaitingSelf(state, state.currentUserId)
  lines.push(awaiting ? `- 待我确认的公约：「${awaiting.title}」` : '- 待我确认的公约：无')
  return lines.join('\n')
}

export function buildSystemPrompt(state: AppData): string {
  return [
    '你是「合住 CoHome」（合租生活管家 Web 应用）内置的 AI 小助手，负责指引用户完成合住生活相关的操作。',
    '',
    '你的核心职责：',
    '1. 用中文、简洁地告诉用户「去哪里、点哪里、填什么」；',
    '2. 在回答末尾给出页面跳转标记（见下方格式），方便用户一键直达。',
    '',
    '严格遵守以下规则：',
    '1. 你只提供指引，绝不代替用户操作，也绝不声称已帮用户完成任何操作；',
    '2. 涉及用户数据时，一律以「当前数据快照」为准；快照中没有的信息，明确说“我不清楚，建议到对应页面查看”，禁止编造任何数字、金额或状态；',
    '3. 回答简短（一般不超过 120 字），能用 1/2/3 步骤就用步骤表达；',
    '4. 指引涉及某个页面时，在回答最后另起一行输出跳转标记，每行一个，格式严格为：[[route:页面路径|按钮文字]]。页面路径只允许以下 7 个之一：/ /expenses /chores /supplies /agreements /guide /settings；没有合适页面时不要输出标记；',
    '5. 与合住生活无关的问题（如写代码、闲聊、叫外卖），礼貌说明你只能协助合住相关操作；',
    '6. 永远用中文回答。',
    '',
    APP_GUIDE,
    '',
    '【当前数据快照】（仅以下数据可信）',
    buildContextSnapshot(state),
  ].join('\n')
}

const VALID_PATHS = new Set(['/', '/expenses', '/chores', '/supplies', '/agreements', '/guide', '/settings'])
const ROUTE_RE = /\[\[route:([^\s|\]]+)\|([^\]]+)\]\]/g

/** 从模型回复中剥离 [[route:路径|按钮文字]] 跳转标记，返回纯文本 + 跳转按钮列表 */
export function parseRoutes(content: string): { text: string; routes: AssistantRoute[] } {
  const routes: AssistantRoute[] = []
  const text = content
    .replace(ROUTE_RE, (match, path: string, label: string) => {
      if (!VALID_PATHS.has(path)) return match
      routes.push({ path, label: label.trim() })
      return ''
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { text, routes }
}

/** 取最近若干条历史消息（不含新问题本身） */
export function buildHistoryMessages(state: AppData): { role: 'user' | 'assistant'; content: string }[] {
  return state.assistantMessages.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content }))
}

/** 解析 OpenAI 兼容的 SSE 数据流，逐段产出增量文本 */
export async function* streamDeltas(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let idx: number
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim()
        buffer = buffer.slice(idx + 1)
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') return
        let json: { error?: { message?: string }; choices?: { delta?: { content?: string } }[] }
        try {
          json = JSON.parse(payload)
        } catch {
          continue
        }
        if (json.error) throw new Error(json.error.message || '服务端返回错误')
        const delta = json.choices?.[0]?.delta?.content
        if (delta) yield delta
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export function friendlyError(status: number): string {
  if (status === 401) return 'API Key 无效，请到「设置」页检查你的 DeepSeek Key'
  if (status === 402) return 'DeepSeek 账户余额不足，请前往 platform.deepseek.com 充值'
  if (status === 429) return '请求太频繁了，请稍等片刻再试'
  if (status >= 500) return 'DeepSeek 服务暂时不可用，请稍后再试'
  return `请求失败（HTTP ${status}），请检查网络或稍后再试`
}

export interface AskInput {
  apiKey: string
  system: string
  question: string
  history?: { role: 'user' | 'assistant'; content: string }[]
  signal?: AbortSignal
}

/** 发起流式对话，逐段产出文本；出错抛带中文提示的 Error */
export async function* askAssistant(input: AskInput): AsyncGenerator<string> {
  const response = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: input.system },
        ...(input.history ?? []),
        { role: 'user', content: input.question },
      ],
      stream: true,
      temperature: 0.4,
      max_tokens: 600,
    }),
    signal: input.signal,
  })
  if (!response.ok) {
    let message = friendlyError(response.status)
    try {
      const detail = await response.text()
      const parsed = JSON.parse(detail) as { error?: { message?: string } }
      if (parsed.error?.message) message = `${message}：${parsed.error.message}`
    } catch {
      // 忽略错误体解析失败
    }
    throw new Error(message)
  }
  if (!response.body) throw new Error('响应流为空')
  yield* streamDeltas(response.body)
}
