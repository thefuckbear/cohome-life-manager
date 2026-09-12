# 合住 CoHome — 项目交接记忆档案

> 生成日期：2026-09-12
> 用途：将本项目从 Codex/OpenCode 迁移到 **DeepSeek Harness** 继续开发时的完整交接档案。
> 工作目录：`C:\Users\HY\Desktop\test_meituan\cohome-life-manager`
> 交接原则：已实现的标注「已完成」，未做的标注「预留/待做」，不把预留说成实现。

---

## 0. 一页速览（先读这个）

- **产品**：合租生活管家「合住 CoHome」，移动端优先 Web App，演示家庭「小满之家」，当前用户「小周」。
- **线上 URL**：`https://thefuckbear.github.io/cohome-life-manager/`（已部署最新版，HTTP 200）
- **技术栈**：React 19 + TypeScript + Vite 6 + React Router 7（HashRouter）+ **Zustand** + lucide-react + 原生 CSS（无 Tailwind/shadcn）。
- **完成度**：数据层 ✅、费用 AA ✅、清洁值日 ✅；公共物品 ⏳、室友公约 ⏳、跨模块联动 ⏳。
- **Git 分支**：`main` 是唯一主线（**开发请从 main 开 feature 分支，完成后合并回 main**）；`full-features` 已并入 main（保留为历史）；`gh-pages` 是部署产物分支；旧实现已打 tag `legacy/lightweight-persistence` 归档。

---

## 1. 项目背景（题目）

【题目】合租生活管家
【背景】年轻人合租时常面临房租水电分摊不清、公共区域清洁排班混乱、共用物品消耗无记录等问题，容易引发室友矛盾。
【任务】使用 AI Coding 工具，设计一个「合租生活管家」，支持：费用 AA 分摊、清洁值日排班、公共物品登记与提醒、室友公约管理。
【建议】可结合用户痛点自由设计；不必追求技术细节，优先呈现产品结构和功能设计。
【提交要求】仅提交一个可在线访问的部署链接。

产品定位语：**让合租生活中的每一笔钱、每一次值日、每一件公共物品和每一条约定，都清楚、有记录、可追溯。**

---

## 2. 产品结构与设计决策

- 五个核心页面：**今日首页 / 费用 AA / 清洁值日 / 公共物品 / 室友公约**。
- 首页不是数据看板，而是「今天要做什么」：待支付、今日值日、待补货、待确认公约、最近动态。
- 数据用 localStorage 持久化，内置「重置演示数据」按钮；不接后端、不做真实支付。
- 首版目标是一个完整演示闭环（不要求真实多人同步）。
- 视觉方向：温暖、鼠尾草绿主色、暖白背景、大圆角卡片、头像昵称、柔和提醒色。

---

## 3. 当前 Git / 部署状态（重要）

仓库：`github.com/thefuckbear/cohome-life-manager`

| 分支 | 内容 | 状态 |
|---|---|---|
| `main` | **唯一主线**（本方案：数据层+费用AA+值日），仓库默认分支，最新稳定代码 | ✅ 已推送，线上运行它的构建 |
| `full-features` | 原开发线，2026-09-13 已并入 `main`，内容与 main 完全一致 | ✅ 保留为历史 |
| `gh-pages` | GitHub Pages 部署产物（`dist/` 内容），Pages 源已确认 = 该分支根目录 | ✅ 已部署本方案 |
| tag `legacy/lightweight-persistence` | 旧实现快照（`useLocalStorageState` 轻量持久化，原 main 的 b050b68），供未来重构参考 | ✅ 已归档 |

- 部署命令：`npm run deploy`（= `npm run build && gh-pages -d dist`）。
- `vite.config.ts` 设了 `base: './'` + HashRouter，兼容子路径部署，hash 路由刷新不会 404。
- 线上验证过：首页 / `#/expenses` / `#/chores` 均 200，且加载了最新构建 JS。
- 注意：GitHub Pages 更新可能有短暂 CDN 缓存延迟；验证时抓 HTML 里的 `assets/index-*.js` 文件名是否与本地 `dist` 一致。

---

## 4. 技术栈细节与启动方式

```bash
npm install
npm run dev      # 本地开发
npm run build    # tsc -b && vite build（类型检查 + 打包）
npm run preview  # 预览构建产物
npm run deploy   # 构建并部署 gh-pages
```

依赖：`react@19`、`react-dom@19`、`react-router-dom@7`、`zustand@5`、`lucide-react`；dev：`vite@6`、`typescript@5.7`、`@vitejs/plugin-react`、`gh-pages`。

---

## 5. 目录结构

```
src/
  main.tsx                 # 入口，HashRouter + App
  App.tsx                  # 路由：/ /expenses /chores /supplies /agreements
  styles.css               # 全部样式（原生 CSS，含响应式 + 弹窗/表单）
  data.ts                  # ❌ 已删除（旧硬编码数据，被 store 取代）
  lib/
    types.ts               # 全部数据模型类型
    store.ts               # Zustand store：种子数据 + actions + persist
    selectors.ts           # 纯函数：派生计算 + 分摊算法
  components/
    AppShell.tsx           # 侧边栏/顶栏/移动底部导航 + toast（placeholder 提示）
    Modal.tsx              # 通用弹窗（费用/值日共用）
    PlaceholderButton.tsx  # 预留按钮：点击弹 toast + 控制台打印「xx功能预留」
  pages/
    Dashboard.tsx          # 首页（已接入 store，全派生）
    Expenses.tsx           # 费用 AA（✅ 已实现真实功能）
    Chores.tsx             # 清洁值日（✅ 已实现真实功能）
    Supplies.tsx           # 公共物品（⏳ 仍用静态数据）
    Agreements.tsx         # 室友公约（⏳ 仍用静态数据）
```

---

## 6. 架构原则（核心）

1. **单一数据源**：所有数据集中在 `store`，页面只读它；不再在页面里硬编码数据。
2. **存事实，不存结论**：store 只存「小林垫付电费240、小周未结清80」这类原始事实；「余额、待办、进度」等**结论全部由 selectors 派生计算**。保证各处永远一致。
3. **金额一律用「分」存整数**（`Money = number`）：`yuan(12650) → "126.50"`，`yuanToFen(126.5) → 12650`，避免浮点误差。
4. **新动态头插**：所有 action 写入 `activities` 时用 `[activity, ...state.activities]`，保证「最近动态」最新在最上。
5. **本地持久化**：Zustand `persist` 中间件，key=`cohome:store`，`partialize` 只存数据不存函数。
6. **预留接口可辨识**：未实现的按钮用 `PlaceholderButton`，点击只在控制台打印 `[合住 CoHome] xx功能预留` 并弹 toast「接口已预留」。

---

## 7. 数据模型（`src/lib/types.ts`）

- `ID = string`、`Money = number`（分）
- `House`：id / name（小满之家）/ createdAt / settlementDay
- `Member`：id / houseId / name / initials / color / **isSelf**（演示用户=小周）/ role / joinedAt / status(在家|外出)
- `Expense`：id / houseId / title / amount / category(rent|utility|daily|internet|other) / payerId / date / splitMode(equal|custom|ratio) / supplyId? / createdAt
- `ExpenseShare`：id / expenseId / memberId / amount / settled / settledAt?
- `ChoreRule`：id / houseId / area / label / frequency / weekday / **rotateOrder(轮换顺序)** / startDate
- `ChoreTask`：id / houseId / ruleId? / area / title / assigneeId / **weekOf(YYYY-MM-DD，本周一)** / date(MM/DD) / dayLabel / dueAt / status(pending|done) / completedAt? / completedBy? / **swappedFromId?**（换班来源）
- `Supply`：id / houseId / name / emoji / category / **level(enough|low|almost_out)** / stockPct / lastBuyerId? / lastBoughtAt? / refPrice? / restockOwnerId?
- `PurchaseLog`：id / supplyId / buyerId / price / boughtAt / expenseId?
- `Agreement`：id / houseId / title / content / category / status(draft|voting|active|archived) / version / createdBy / createdAt / effectiveAt? / icon
- `AgreementVote`：id / agreementId / memberId / agree / votedAt
- `ActivityEvent`：id / houseId / actorId / type / targetId / summary / at
  - type 枚举：`expense_added | expense_settled | chore_done | chore_rotated | chore_swapped | supply_low | supply_restocked | agreement_voted`
- `AppData`：上述 10 个集合的聚合接口。
- `AddExpenseInput`：addExpense 的入参（title/amount/category/payerId/date/splitMode/participants/customAmounts?）

---

## 8. store actions（`src/lib/store.ts`）

| action | 作用 |
|---|---|
| `addExpense(input)` | 记一笔费用：生成 expense + 每条分摊（付款人自己的分摊自动 settled）+ 动态头插 |
| `settleShare(expenseId, shareId)` | 标记某条分摊已结清 + 动态 |
| `settleAll()` | 一键结清所有待结算 + 动态 |
| `completeChore(taskId)` | 标记值日完成 + 动态 |
| `generateNextWeek()` | 生成下周排班（负责人顺移一位，幂等：已生成则不重复）+ 动态 |
| `swapChore(taskId, withMemberId)` | 换班，记录 swappedFromId + 动态 |
| `reset()` | 重置回种子演示数据 |

种子数据要点（`createSeedData()`，日期全部相对当前日期动态生成）：
- 成员：小周(self, 在家) / 小林(外出) / 小夏(owner, 在家)
- 费用：电费¥240(小林垫付，小周/小夏未结) + 抽纸¥45(小周垫付，已全结清) + 宽带¥120(小夏垫付，小周未结) → **小周应付 ¥120、共2笔**
- 值日：本周 4 任务（厨房[小林已完成]、客厅[小夏已完成]、卫生间[小周待完成]、垃圾[小林待完成]），4 条轮换规则 rotateOrder=[小周,小林,小夏]
- 物品：抽纸(almost_out,18%)、洗洁精(low,28%)、垃圾袋(enough,72%)、洗衣液(enough,88%)
- 公约：3 条 active + 1 条 voting（公共区域访客规则，小周未投票）
- 动态：3 条（添加电费/完成客厅清洁/抽纸即将用完）

---

## 9. selectors 派生函数（`src/lib/selectors.ts`，全部纯函数）

通用工具：`getSelf` `getMember` `getExpense` `yuan` `timeAgo` `dateKey` `addDaysLocal` `currentMonday` `greeting` `todayLabel`

费用：
- `buildShares({amount, participants, payerId, splitMode, customAmounts})` → 平均分摊**余数给付款人**；custom 用传入金额
- `yuanToFen(yuan)` → 分
- `computeNetBalances(state)` → 每人净额（应付为负/应收为正，只算未结清）
- `pendingSharesFor(state, memberId)` / `payeesCountFor(state, memberId)`
- `payableFor` / `receivableFor` / `expenseTotal` / `expenseShares` / `expenseStatus`

值日：
- `choresThisWeek(state)`（按当前周一过滤）`choresDoneCount` `nextWeekGenerated` `weekRangeLabel`（第X周+日期范围）`formatDue`
- `myChoreThisWeek(state, memberId)` → 自己本周未完成任务

物品/公约：
- `lowSupplies(state)`（level ≠ enough）`agreementAwaitingSelf(state, memberId)`（voting 且本人未投票）

---

## 10. 各页面完成情况

**Dashboard（✅ 已接入 store）**：问候语/日期动态；余额卡/值日卡/物品卡/默契分卡；「今天要处理」任务列表由派生数据动态生成（待支付→跳费用页、待确认公约→跳公约页、待补货→跳物品页）；室友状态、最近动态来自 store；「重置演示数据」按钮（confirm 后 reset）。

**Expenses（✅ 完整实现）**：
- 「记一笔费用」→ 弹窗表单（名称/金额元/分类/付款人/日期/平均or自定义分摊/勾选参与室友）
- 平均分摊自动计算，自定义模式**付款人金额自动补差**（=总额−其他人之和，其他人输入超总额时提示错误）
- 「查看明细」→ 弹窗显示每人应付+结清状态，可「标记已结清」
- 「一键结算」→ confirm 后 settleAll
- 三张指标卡实时派生；「筛选」「分摊规则设置」仍是 PlaceholderButton

**Chores（✅ 完整实现）**：
- 本周排班卡片，进度条实时；「完成」→ completeChore；「换班」→ 弹窗选室友 → swapChore；「生成下周排班」→ generateNextWeek（已生成则按钮变灰）；「新建任务」「管理轮换规则」「设置提醒」仍是 placeholder

**Supplies（⏳ 静态数据）**：页面内容完整但数据是文件内写死数组，未接 store；「登记物品」「创建采购单」「更新状态」「分配负责人」均为 placeholder。

**Agreements（⏳ 静态数据）**：同上；「发起新公约」「历史版本」「阅读并确认」「提醒未确认成员」均为 placeholder。

---

## 11. 已写的 Node 单测（可复用的验证套路）

- 编译 TS 纯逻辑到临时目录：`npx tsc src/lib/types.ts src/lib/selectors.ts src/lib/store.ts --outDir <tmp> --module commonjs --target es2020 --moduleResolution node --skipLibCheck`
- **坑 1**：项目是 ESM（package.json `"type":"module"`），commonjs 输出必须改名 `.cjs`，且把产物内 `require("./types")` 等改成 `require("./types.cjs")`（用一个小 patch.cjs 做字符串替换）。
- **坑 2**：store.ts 依赖 zustand + localStorage，测试前需 polyfill `global.localStorage`（getItem/setItem/removeItem 的简单对象实现）。
- 已覆盖断言：分摊守恒/余数给付款人/元分转换/应付应收/记账→结清→一键结算整链/值日完成/下周顺移/幂等/换班。
- 结论：**每次改动后先 `npm run build`，再把改动过的纯逻辑补对应断言**。

---

## 12. 下一步计划（待办）

1. **公共物品**：Supplies 接入 store；`updateSupplyLevel`（三级状态切换）、`recordPurchase`（补货，可顺带生成 AA 费用）、低库存自动汇总到首页待办。
2. **室友公约**：Agreements 接入 store；`voteAgreement`（全员同意→active）、`proposeAgreement`（新草案）、版本历史。
3. **首页联动 + 跨模块联动**：补货↔费用、值日完成/公约确认↔动态、首页待办聚合。
4. 每个模块先写 store action + selectors + 单测，再改页面，最后 `npm run deploy`。

---

## 13. 环境注意事项（Windows + PowerShell 5.1）

- **不要用 PowerShell 的 `Get-Content`/`Set-Content` 改含中文的源文件**：会以 GBK 误读 UTF-8 导致中文乱码。应使用带 UTF-8 支持的文件写入方式（如直接写新文件覆盖）。
- 本地 `vite preview` 监听 IPv6 `[::1]`，用 curl 访问 `127.0.0.1` 会失败；运行时验证以 `npm run build` + Node 单测 + 线上 HTTP 为准。
- 金额输入以「元」为单位（表单），存储转「分」。

---

## 14. 用户偏好（接手者务必遵守）

- **思考过程用中文**（用户明确要求，否则看不懂）。
- 每次改动后要向用户**简洁解释原理**（用户有编程基础，可直说技术细节）。
- **一步一步来**：一次只做一个可验证的小步，不一次性铺开。
- 明确区分「已完成 / 已验证 / 预留 / 仅诊断」；不要把预留接口说成已实现。
- 改完代码后 `npm run build` 验证；能补单测就补单测。
- 部署时机由用户决定，用户要求时才 `npm run deploy`。