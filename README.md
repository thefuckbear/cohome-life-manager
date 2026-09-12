# 合住 CoHome

**已在Github Page部署上线，请访问：https://thefuckbear.github.io/cohome-life-manager/#/**

面向年轻合租群体的最小可用 Web UI，覆盖费用 AA、清洁值日、公共物品和室友公约四个模块。

## 当前版本

- 首页、侧边栏和移动端导航均可跳转。
- 5 个页面已经提供完整的界面骨架和演示数据。
- 费用结算、值日完成、库存更新和公约确认已支持真实状态变化，并保存到浏览器本地。
- 其余功能按钮会在浏览器控制台输出 `[合住 CoHome] xx功能预留`，同时显示页面内提示。
- 使用 `HashRouter` 和相对资源路径，兼容 GitHub Pages 子路径部署。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 技术栈

React、TypeScript、Vite、React Router、Lucide React、原生 CSS。
