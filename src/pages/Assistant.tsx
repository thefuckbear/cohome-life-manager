import { useEffect, useRef, useState } from 'react'
import { Bot, KeyRound, Send, Sparkles, Square, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { askAssistant, buildHistoryMessages, buildSystemPrompt, parseRoutes } from '../lib/assistant'
import { getSelf } from '../lib/selectors'
import { useStore } from '../lib/store'
import type { AssistantRoute } from '../lib/types'

const QUICK_QUESTIONS = [
  '我想记一笔公共支出',
  '我还欠谁钱',
  '今天谁值日',
  '账单和缴费日有什么区别',
]

const FAQ_ITEMS: { q: string; a: string; routes: AssistantRoute[] }[] = [
  {
    q: '我想增加一笔公共支出',
    a: '打开「费用 AA」页 → 点右上角「记一笔」→ 填写项目、金额和分摊方式，保存后系统自动算出每个人应付多少，付款人自动记作已结清。',
    routes: [{ path: '/expenses', label: '去记一笔' }],
  },
  {
    q: '我还欠室友多少钱',
    a: '打开「费用 AA」页，顶部「我需要支付」就是你的待结算总额，明细里可以逐笔结清，也可以一键结清；钱包余额不足时先去「充值」。',
    routes: [{ path: '/expenses', label: '去结清' }],
  },
  {
    q: '今天谁值日',
    a: '打开「清洁值日」页查看本周排班。值日需要自己认领（只能认领给自己），完成后记得点「完成」打卡，可以附上凭证备注。',
    routes: [{ path: '/chores', label: '去值日' }],
  },
  {
    q: '怎么登记公共物品',
    a: '打开「公共物品」页 → 点「登记物品」→ 填写名称、分类和价格。登记后会自动生成一张 AA 账单，由大家均摊。',
    routes: [{ path: '/supplies', label: '去登记' }],
  },
  {
    q: '怎么发起一条室友公约',
    a: '打开「室友公约」页 → 点「发起公约」→ 填写标题和内容。发起后进入投票，全员同意才会生效；修改公约会回到投票状态并保留版本历史。',
    routes: [{ path: '/agreements', label: '去发起' }],
  },
  {
    q: '账单和缴费日有什么区别',
    a: '「账单」是某次公共支出的 AA 分摊（比如一起买的抽纸）；「缴费日」是全员共同缴费（比如房租、水电），有截止日期、可按周期循环，全员缴完才算完成，钱汇给发起人。两者都在「费用 AA」页。',
    routes: [{ path: '/expenses', label: '去费用 AA' }],
  },
]

export function Assistant() {
  const navigate = useNavigate()
  const store = useStore()
  const self = getSelf(store)
  const hasKey = store.assistantKey.trim().length > 0
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [streamText, setStreamText] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = chatRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [store.assistantMessages.length, streamText, busy])

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || busy) return
    const key = useStore.getState().assistantKey.trim()
    if (!key) return
    store.appendAssistantMessage({ role: 'user', content: question })
    setDraft('')
    setBusy(true)
    setStreamText('')
    const controller = new AbortController()
    abortRef.current = controller
    const state = useStore.getState()
    let acc = ''
    try {
      for await (const delta of askAssistant({
        apiKey: key,
        system: buildSystemPrompt(state),
        history: buildHistoryMessages(state),
        question,
        signal: controller.signal,
      })) {
        acc += delta
        setStreamText(acc)
      }
      const { text, routes } = parseRoutes(acc.trim() || '小助手没有返回内容，请再试一次')
      store.appendAssistantMessage({ role: 'assistant', content: text, routes })
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        const { text, routes } = parseRoutes(acc.trim())
        store.appendAssistantMessage({ role: 'assistant', content: text || '已停止生成', routes })
      } else {
        store.appendAssistantMessage({
          role: 'assistant',
          content: err instanceof Error ? err.message : '网络异常，请稍后再试',
          isError: true,
        })
      }
    } finally {
      setBusy(false)
      setStreamText('')
      abortRef.current = null
    }
  }

  return (
    <div className="page module-page">
      <section className="module-heading">
        <div>
          <span className="eyebrow">AI 助手</span>
          <h1>小助手</h1>
          <p>用大白话问它，它会告诉你去哪操作、怎么操作。</p>
        </div>
        {hasKey && store.assistantMessages.length > 0 && (
          <button className="button button--secondary" type="button" onClick={() => store.clearAssistantMessages()}>
            <Trash2 size={15} /> 清空对话
          </button>
        )}
      </section>

      {!hasKey ? (
        <section className="panel module-panel">
          <div className="assistant-offline">
            <span className="assistant-offline__icon"><KeyRound size={22} /></span>
            <div>
              <strong>还没有配置 AI Key</strong>
              <p>小助手基于 DeepSeek 大模型。填一个你自己的 API Key（仅保存在本机浏览器），就能开始对话；不配置也可以先看下面的常见问题。</p>
            </div>
            <button className="button button--primary" type="button" onClick={() => navigate('/settings')}>
              <KeyRound size={15} /> 去设置配置 Key
            </button>
          </div>
          <div className="assistant-faq">
            {FAQ_ITEMS.map((item) => (
              <div className="assistant-faq-card" key={item.q}>
                <strong>{item.q}</strong>
                <p>{item.a}</p>
                <div className="assistant-routes">
                  {item.routes.map((r) => (
                    <button key={r.path} className="assistant-route" type="button" onClick={() => navigate(r.path)}>
                      {r.label} →
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel module-panel assistant-panel">
          <div className="assistant-panel__head">
            <div>
              <h2>和小助手聊聊</h2>
              <p>它是「指引员」：只教你怎么做，不会替你操作</p>
            </div>
            <span className="assistant-badge"><Bot size={14} /> DeepSeek</span>
          </div>
          <div className="assistant-chat" ref={chatRef}>
            {store.assistantMessages.length === 0 && !busy && (
              <div className="assistant-empty">
                <Sparkles size={26} />
                <p>
                  你好，{self?.name ?? '室友'}！我是合住小助手。
                  <br />
                  比如你可以问我：<strong>「我想记一笔公共支出」</strong>
                </p>
              </div>
            )}
            {store.assistantMessages.map((m) => (
              <div
                key={m.id}
                className={`assistant-msg${m.role === 'user' ? ' assistant-msg--user' : ''}${m.isError ? ' assistant-msg--error' : ''}`}
              >
                <div className="assistant-bubble">{m.content}</div>
                {m.routes.length > 0 && (
                  <div className="assistant-routes">
                    {m.routes.map((r, i) => (
                      <button key={`${r.path}-${i}`} className="assistant-route" type="button" onClick={() => navigate(r.path)}>
                        {r.label} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="assistant-msg">
                <div className="assistant-bubble assistant-bubble--stream">
                  {streamText || '正在思考…'}
                  {streamText && <span className="assistant-caret" />}
                </div>
              </div>
            )}
          </div>
          <div className="assistant-chips">
            {QUICK_QUESTIONS.map((q) => (
              <button key={q} className="assistant-chip" type="button" disabled={busy} onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>
          <div className="assistant-inputbar">
            <input
              className="form-input"
              value={draft}
              placeholder="例如：我想增加一笔公共支出"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) send(draft)
              }}
            />
            {busy ? (
              <button className="button button--secondary" type="button" onClick={() => abortRef.current?.abort()}>
                <Square size={14} /> 停止
              </button>
            ) : (
              <button className="button button--primary" type="button" onClick={() => send(draft)} disabled={!draft.trim()}>
                <Send size={15} /> 发送
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
