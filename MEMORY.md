# 合住 CoHome — 项目交接记忆档案

> 生成日期：2026-09-12（最近更新：2026-09-13）
> 用途：将本项目从 Codex/OpenCode 迁移到 **DeepSeek Harness** 继续开发时的完整交接档案。
> 工作目录：`C:\Users\HY\Desktop\test_meituan\cohome-life-manager`
> 交接原则：已实现的标注「已完成」，未做的标注「预留/待做」，不把预留说成实现。

---

## 0. 一页速览（先读这个）

- **产品**：合租生活管家「合住 CoHome」，移动端优先 Web App，演示家庭「小满之家」，3 位室友（小周/小林/小夏）。
- **线上 URL**：`https://thefuckbear.github.io/cohome-life-manager/`（已部署最新版，HTTP 200）
- **技术栈**：React 19 + TypeScript + Vite 6 + React Router 7（HashRouter）+ **Zustand** + lucide-react + 原生 CSS（无 Tailwind/shadcn）。
- **完成度**：✅ 费用 AA / 清洁值日 / 公共物品 / 室友公约 / 账号鉴权 / 通知中心 / 使用说明 / 缴费日提醒 / 月统计；⏳ P3 场景功能待做（见第 12 节）。
- **Git 分支**：`main` 是唯一主线；`full-features` 已并入 main（保留为历史）；`gh-pages` 是部署产物分支；旧实现已打 tag `legacy/lightweight-persistence` 归档。
- **部署**：GitHub Actions 自动部署（`.github/workflows/deploy.yml`）——**push 到 main 自动构建并部署到 gh-pages**，刷新网页（等约 1 分钟 CDN）即见新功能。不再手动 `npm run deploy`。

---

## 1. 项目背景（题目）

【题目】合租生活管家
【背景】年轻人合租时常面临房租水电分摊不清、公共区域清洁排班混乱、共用物品消耗无记录等问题，容易引发室友矛盾。
【任务】使用 AI Coding 工具，设计一个「合租生活管家」，支持：费用 AA 分摊、清洁值日排班、公共物品登记与提醒、室友公约管理。
【提交要求】仅提交一个可在线访问的部署链接。

产品定位语：**让合租生活中的每一笔钱、每一次值日、每一件公共物品和每一条约定，都清楚、有记录、可追溯。**

---

## 2. 产品结构与设计决策

- 核心页面：**今日首页 / 费用 AA / 清洁值日 / 公共物品 / 室友公约 / 使用说明**。
- 首页不是数据看板，而是「今天要做什么」：待支付、今日值日、待确认公约、缴费日临近，点击跳转。
- 数据用 localStorage 持久化（key=`cohome:store`），内置「重置演示数据」按钮；不接后端、不做真实支付。
- **账号鉴权（简化版）**：左下角头像菜单切换账号（演示多室友视角），权限规则见第 6 节第 7 条。
- 视觉方向：温暖、鼠尾草绿主色、暖白背景、大圆角卡片、头像昵称、柔和提醒色。

---

## 3. 当前 Git / 部署状态（重要）

仓库：`github.com/thefuckbear/cohome-life-manager`

| 分支 | 内容 | 状态 |
|---|---|---|
| `main` | **唯一主线**，仓库默认分支，最新稳定代码 | ✅ 已推送，线上运行它的构建 |
| `full-features` | 原开发线，已并入 main（内容一致） | ✅ 保留为历史 |
| `gh-pages` | GitHub Pages 部署产物（`dist/` 内容），Pages 源 = 该分支根目录 | ✅ 已部署本方案 |
| tag `legacy/lightweight-persistence` | 旧实现快照（原 main 的 b050b68），供未来重构参考 | ✅ 已归档 |

- **自动部署**：`.github/workflows/deploy.yml`，push main → `npm ci && npm run build` → `peaceiris/actions-gh-pages` 推 gh-pages。工作流需要 `permissions: contents: write`。
- `vite.config.ts` 设了 `base: './'` + HashRouter，兼容子路径部署，hash 路由刷新不会 404。
- 线上验证：首页 / `#/expenses` / `#/chores` / `#/guide` 均 200。
- 注意：GitHub Pages 有约 1 分钟 CDN 缓存延迟；验证时抓 HTML 里的 `assets/index-*.js` 文件名是否与本地 `dist` 一致。

---

## 4. 技术栈细节与启动方式

```bash
npm install
npm run dev      # 本地开发
npm run build    # tsc -b && vite build（类型检查 + 打包）
npm run preview  # 预览构建产物
```

依赖：`react@19`、`react-dom@19`、`react-router-dom@7`、`zustand@5`、`lucide-react`；dev：`vite@6`、`typescript@5.7`、`@vitejs/plugin-react`。

---

## 5. 目录结构

```
src/
  main.tsx                 # 入口，HashRouter + App
  App.tsx                  # 路由：/ /expenses /chores /supplies /agreements /guide
  styles.css               # 全部样式（原生 CSS，含响应式 + 弹窗/表单）
  lib/
    types.ts               # 全部数据模型类型
    store.ts               # Zustand store：种子数据 + actions + persist（version 已到 6）
    selectors.ts           # 纯函数：派生计算 + 分摊/结算/统计/通知聚合
    placeholder.ts         # PLACEHOLDER_EVENT / NOTIFY_EVENT + triggerPlaceholder / notify
  components/
    AppShell.tsx           # 侧边栏/顶栏/移动底部导航 + 账号切换菜单 + 通知中心 + toast
    Modal.tsx              # 通用弹窗
    PlaceholderButton.tsx  # 预留按钮：点击弹 toast + 控制台打印「xx功能预留」
  pages/
    Dashboard.tsx          # 首页（✅ 全派生 + 邀请室友 + 任务跳转）
    Expenses.tsx           # 费用 AA（✅ 完整：记账/结算方案/催缴/筛选/分摊规则/缴费日/月统计/删除）
    Chores.tsx             # 清洁值日（✅ 完整：认领/两阶段提醒/完成凭证/换班邀请/公平统计/删除）
    Supplies.tsx           # 公共物品（✅ 自愿登记制：登记即生成 AA 账单）
    Agreements.tsx         # 室友公约（✅ 完整：发起/投票生效/一键提醒/版本历史/删除）
    Guide.tsx              # 使用说明（✅ 7 张卡片讲清全部功能）
```

---

## 6. 架构原则（核心）

1. **单一数据源**：所有数据集中在 `store`，页面只读它。
2. **存事实，不存结论**：store 只存原始事实；「余额、待办、进度、结算方案、统计」等结论全部由 selectors 派生计算。
3. **金额一律用「分」存整数**（`Money = number`）：`yuan(12650) → "126.50"`，避免浮点误差。
4. **新动态头插**：action 写入 `activities` 用 `[activity, ...state.activities]`。
5. **本地持久化**：Zustand `persist`，key=`cohome:store`，`partialize` 只存数据不存函数。**改 schema 必须提升 `version`**（否则旧 localStorage 数据导致白屏——本机陷阱清单第 19 条）。
6. **提醒模式**：跨模块干涉（催缴/值日提醒/公约提醒/换班通知）统一走「activity + notifyId」，通知中心 `notificationsFor(state, memberId)` 聚合。
7. **账号鉴权（currentUserId）**：
   - 只能**删除自己创建**的条目（账单/任务/物品/公约/缴费日，实体有 createdBy 或 assigneeId）
   - 只能**结清自己的**账单分摊（settleShare/settleAll 均校验 memberId === currentUserId）
   - 值日只能**给自己认领**（assignChoreTask 固定 assigneeId = currentUserId），只能完成/删除自己的任务
   - 公约**每账号限投一次**（voteAgreement 已投则忽略）
   - 换班**需对方同意**（swapChore 发邀请 → respondSwapRequest 接受/拒绝，拒绝通知发起人）
   - 成员间唯一干涉手段 = 提醒（remindExpense / remindChore / remindAgreement）

---

## 7. 数据模型（`src/lib/types.ts`）

- `ID = string`、`Money = number`（分）
- `House`：id / name / createdAt / settlementDay
- `Member`：id / houseId / name / initials / color / isSelf / role / joinedAt / status(在家|外出)
- `Expense`：id / houseId / title / amount / category(rent|utility|daily|internet|other) / payerId / date(YYYY-MM-DD) / splitMode(equal|custom) / note? / supplyId? / createdAt / **createdBy?**（创建者）
- `ExpenseShare`：id / expenseId / memberId / amount / settled / settledAt?
- `ChoreRule`：id / houseId / area / label / frequency / weekday / rotateOrder / startDate（仅种子数据用，UI 不再依赖）
- `ChoreTask`：id / houseId / ruleId? / area(kitchen|living|bathroom|trash|custom) / title / assigneeId / weekOf / date(MM/DD) / dayLabel / dueAt / status / completedAt? / completedBy? / swappedFromId? / **note?**（完成凭证）
- `SwapRequest`：id / taskId / fromId（发起人）/ toId（被邀请人）/ status(pending|accepted|rejected) / createdAt
- `Supply`（**自愿登记制，2026-09-13 重构**）：id / houseId / name / emoji / category / **createdBy**（登记人）/ createdAt / refPrice?
- `PurchaseLog`：id / supplyId / buyerId / price / boughtAt / expenseId?
- `BillReminder`：id / houseId / title / amount / dueDate(YYYY-MM-DD) / createdBy / createdAt / paid
- `Agreement`：id / houseId / title / content / category / status(draft|voting|active) / version / createdBy / createdAt / effectiveAt? / icon
- `AgreementVote`：id / agreementId / memberId / agree / votedAt
- `AgreementVersion`：id / agreementId / title / content / version / editedBy / editedAt（修改留痕）
- `ActivityEvent`：id / houseId / actorId / type / targetId / summary / at / **notifyId?**（被通知人）
  - type：`expense_added | expense_settled | expense_reminded | chore_done | chore_rotated | chore_swapped | chore_reminded | supply_restocked | agreement_voted | agreement_reminded | agreement_proposed | member_added`
- `SplitRule`：mode(equal|custom) / participantIds（空=全员）
- `AppData`：house / members / expenses / shares / choreRules / choreTasks / swapRequests / supplies / purchases / billReminders / agreements / votes / agreementVersions / activities / **currentUserId** / splitRule

---

## 8. store actions（`src/lib/store.ts`）

| action | 作用 | 权限 |
|---|---|---|
| `addExpense(input)` | 记费用：expense + 分摊（付款人自动 settled）+ 动态 | 任意 |
| `deleteExpense(id)` | 删账单 + 连带分摊 | createdBy === currentUserId |
| `settleShare(eid, sid)` | 结清单条分摊 | share.memberId === currentUserId |
| `settleAll()` | 一键结清**自己的**所有待结算 | 只结自己的 |
| `remindExpense(eid, memberId)` | 催缴某室友结清（notifyId 通知对方） | 对方须有未结清 share |
| `addBillReminder(title, amount, dueDate)` | 登记缴费日 | 任意 |
| `deleteBillReminder(id)` | 删缴费日 | createdBy === currentUserId |
| `markBillPaid(id)` | 标记已缴费 | 任意（集体行为） |
| `completeChore(taskId, note?)` | 完成值日（可带备注凭证） | assigneeId === currentUserId |
| `assignChoreTask(area, date)` | 认领值日（date 手动指定） | 只能给自己 |
| `deleteChoreTask(id)` | 删值日任务 | assigneeId === currentUserId |
| `remindChore(id)` | 提醒室友完成值日（notifyId 通知对方） | 任意 |
| `swapChore(taskId, withId)` | **发起换班邀请**（不再直接换班） | assigneeId === currentUserId，已有 pending 则拒绝 |
| `respondSwapRequest(id, accept)` | 接受/拒绝换班邀请 | toId === currentUserId；接受才转移任务，拒绝通知发起人 |
| `registerSupply(name, emoji, category, price)` | **登记公共物品 → 自动生成 AA 账单**（全员均摊） | 任意 |
| `deleteSupply(id)` | 删物品 + **连带删关联账单/分摊** | createdBy === currentUserId |
| `proposeAgreement(...)` | 发起公约（voting） | 任意 |
| `deleteAgreement(id)` | 删公约 + 相关投票 | createdBy === currentUserId |
| `updateAgreement(id, title, content)` | 修改公约：**旧版入历史、版本+1、回 voting、清空投票** | createdBy === currentUserId |
| `voteAgreement(id, agree)` | 投票；全员同意 → active | **每账号限一次** |
| `remindAgreement(id, memberId)` | 一键提醒违规室友（notifyId 通知对方） | 任意 |
| `addMember(name)` | 邀请新室友 | 任意 |
| `switchAccount(memberId)` | 切换当前账号 | 任意 |
| `saveSplitRule(rule)` | 保存默认分摊规则 | 任意 |
| `reset()` | 重置回种子数据 | 任意 |

种子数据要点（`createSeedData()`，日期相对当前动态生成）：成员小周/小林/小夏；费用电费¥240+抽纸¥45+宽带¥120（→ 小周净应付¥120）；值日 4 任务（2 done 2 pending）+ 1 条换班邀请（小周→小林 pending）；公共物品 4 件（自愿登记）；缴费日 3 条（房租本月25日/水费已逾期/宽带3天后）；公约 3 active + 1 voting（访客规则，小周未投）。

---

## 9. selectors 派生函数（`src/lib/selectors.ts`，全部纯函数）

- 通用：`getSelf`（**按 currentUserId**，不再用 isSelf）`getMember` `yuan` `timeAgo` `dateKey` `addDaysLocal` `currentMonday` `greeting` `todayLabel`
- 费用：`buildShares`（平均分摊余数给付款人）`yuanToFen` `computeNetBalances` **`computeSettlements`**（债务简化：最少转账清单）`pendingSharesFor` `payeesCountFor` `payableFor` `receivableFor` `expenseTotal` `expenseShares` `expenseStatus` **`monthlySummary`**（本月分类汇总+上月对比）
- 值日：`choresThisWeek` `choresDoneCount` `weekRangeLabel` `formatDue` `myChoreThisWeek` **`myChoreToday`**（今天我的 pending）**`choreReminderStage`**（start/due-soon 两阶段，截止前2小时切换）**`choreCompletionCounts`**（本月每人完成次数）
- 缴费日：**`daysLeft`**（自然日差，负数=逾期）**`upcomingBills`**（未缴按截止日升序）
- 通知：**`notificationsFor(state, memberId)`** → 聚合三类：被提醒（notifyId=我）/ 待结算 / 今日值日
- 公约：`agreementAwaitingSelf`（voting 且本人未投）

---

## 10. 各页面完成情况

**Dashboard（✅）**：问候/日期；余额卡（computeNetBalances）/值日卡/物品卡/默契分卡；「今天要处理」聚合待支付+今日值日+待确认公约+缴费日临近，点击跳对应页；邀请新室友（真实）；室友状态（当前账号标「我」）；最近动态；重置演示数据。

**Expenses（✅ 完整）**：记一笔费用（平均/自定义分摊，付款人补差）；结算方案（谁转给谁最少转账）；催缴按钮（明细里）；分类筛选；分摊规则设置（默认方式+参与人）；缴费日 panel（登记/标记已缴/删除，三色状态）；本月支出 panel（分类占比条+环比）；删除账单（创建者）。

**Chores（✅ 完整）**：认领值日（选任务+日期，默认下周）；我的提醒（两阶段：今日值日/临近截止）+ 团队今日值班条 + 浏览器系统通知；完成凭证（弹窗备注）；换班邀请卡片（接受/拒绝，对方同意才生效）；本月完成统计条；删除/提醒。

**Supplies（✅ 自愿登记制）**：登记物品（名称/分类/金额）→ 自动生成 AA 账单；清单显示登记人/时间；删除自己登记的（连带删账单）。

**Agreements（✅ 完整）**：发起公约；投票（每人限一次，全员同意→生效）；一键提醒（已生效公约）；修改（版本+1、回投票）；版本历史弹窗；删除（创建者）。

**Guide（✅）**：7 张卡片：账号与身份/今日首页/费用 AA/清洁值日/公共物品/室友公约/通知中心。

**AppShell（✅）**：左侧导航（含使用说明）；左下头像菜单切换账号；右上铃铛通知中心（红点提示，点击跳转）；toast 双类型（预留提示/操作成功）。

---

## 11. 已写的 Node 单测（可复用的验证套路）

**测试方案（2026-09-13 更新，已验证好用）**：把 lib 编译成 **ESM** 放进**项目内**临时目录跑：

```bash
# 在项目根目录（不是系统 temp！否则 node 找不到 zustand）
npx tsc src/lib/types.ts src/lib/selectors.ts src/lib/store.ts --outDir .test-tmp --module es2020 --target es2020 --moduleResolution node --skipLibCheck
# 改名 .mjs，patch import 补扩展名：
#   selectors.mjs: "from './types'" -> "from './types.mjs'"
#   store.mjs:    同上 + "from './selectors'" -> "from './selectors.mjs'"
```

测试脚本（.test-tmp/test-xxx.mjs）：
```js
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }  // store 测试必须
const { useStore } = await import('./store.mjs')
const s = useStore.getState()
s.someAction(...)      // 调用 action
useStore.getState()    // 读更新后的 state 断言
```

**踩坑记录**：
- 系统 temp 目录跑会 `ERR_MODULE_NOT_FOUND: zustand`——ESM 裸导入从文件位置向上找 node_modules，临时目录必须在项目内。
- PowerShell 5.1 `Rename-Item -Force` **不能覆盖已存在文件**；每次重编译前先 `Remove-Item` 清空 .test-tmp。
- 文件观察器缓存：目录删过之后，write 同名文件报 "file no longer exists"——换新文件名即可。
- 测完必须删 `.test-tmp`（或加 .gitignore）再提交。

**已覆盖断言**（截至 2026-09-13 共 60+ 项）：分摊守恒/余数给付款人/结算方案最小转账/结算守恒（净应付=净应收=转账总额）/催缴→通知中心/换班邀请全流程（含越权）/登记物品→AA账单→删除连带/缴费日登记与标记/月统计口径/完成凭证与越权/公平统计/公约版本全流程（版本+1、状态回退、历史留痕、投票清空、限投一次）/daysLeft 自然日差。

**结论**：每次改动后先 `npm run build`（类型检查），再按「小步 + 每步测试」推进；纯逻辑用 selectors 测试，行为用 store action 测试。

---

## 12. 下一步计划（待办，按优先级）

- [x] P1：温和催缴 / 月度账单统计 / 缴费日提醒
- [x] P2：值日完成凭证 / 值日公平统计 / 公约版本历史
- [ ] P3（待用户确认后再做）：
  1. 退租结算：成员退出时的费用清算方案
  2. 访客/留宿登记：谁家客人常住导致水电上涨
  3. 公共基金池：每人每月预存虚拟金额，公共支出从基金扣
  4. 留言板/公告：应用内公告替代群聊消息
- 每个模块先写 store action + selectors + 单测，再改页面；push main 自动部署。

---

## 13. 环境注意事项（Windows + PowerShell 5.1）

- **不要用 PowerShell 的 `Get-Content`/`Set-Content` 改含中文的源文件**：会以 GBK 误读 UTF-8 导致中文乱码。
- 本地 `vite preview` 监听 IPv6 `[::1]`，curl 访问 `127.0.0.1` 会失败；运行时验证以 `npm run build` + Node 单测 + 线上 HTTP 为准。
- 金额输入以「元」为单位（表单），存储转「分」。
- git push 在 PowerShell 里会因 stderr 显示 `NativeCommandError` + 退出码 1，**看输出内容判断成败**（`xxx..yyy main -> main` 即成功）。

---

## 14. 用户偏好（接手者务必遵守）

- **思考过程用中文**。
- 每次改动后要向用户**简洁解释原理**。
- **一步一步来 + 几步一回头**：小步实现，每步 build + 测试验证，不一股脑交付；充分测试各功能正常、接口互通。
- 明确区分「已完成 / 已验证 / 预留 / 仅诊断」。
- 改完代码 `npm run build` 验证；纯逻辑补 selectors 单测，行为补 store action 单测。
- **部署自动化**：完成功能后自主 commit + push 到 main（CI 自动部署），用户刷新网页即可测试，无需再问是否部署。
