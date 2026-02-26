# 主题系统开发指南（Dark Mode）

**版本**: 1.0.0
**最后更新**: 2026-02-26

本文档定义日报前端主题系统的维护方式，目标是让新组件默认可适配浅色/暗黑两种模式，减少后续"补丁式覆盖"。

## 快速开始

系统支持浅色/暗黑双模式切换，用户偏好自动保存到 localStorage。

### 主题切换

- **切换按钮**: 页面右下角悬浮圆形按钮（🌙/☀️）
- **主题状态**: `html[data-theme='light']` / `html[data-theme='dark']`
- **持久化**: 用户选择自动保存到 localStorage
- **系统偏好**: 首次访问时自动检测系统主题偏好

### CSS 变量

```css
:root {
  --ink-black: #1a1a1a;        /* 主标题色 */
  --paper-bg: #f5f2eb;         /* 背景色 */
  --accent-red: #c41e3a;       /* 强调红色 */
  --accent-blue: #1e3a5f;      /* 强调蓝色 */
  --accent-gold: #b8860b;      /* 强调金色 */
  --text-dark: #2c2c2c;        /* 正文深色 */
  --text-muted: #666;          /* 次要文字 */
  --border-color: #d4d0c8;     /* 边框颜色 */
}
```

## 1. 当前架构

- 主题状态：`html[data-theme='light' | 'dark']`
- 初始化与持久化：`public/js/dark-mode.js`
- 页面接入：
  - `views/index.ejs` 负责挂载切换按钮与基础变量
  - `public/css/dark-mode.css` 负责 dark 覆盖
- 切换按钮：右下角悬浮圆形按钮（`🌙/☀️`）

## 2. 维护原则（必须遵守）

1. 新组件样式优先使用语义变量（`var(--...)`），不要写死颜色值。
2. 组件默认样式放在组件自身（模板内或 handler `getStyles()`），只放“light 默认值”。
3. dark 覆盖统一放 `public/css/dark-mode.css`，选择器前缀统一 `html[data-theme='dark']`。
4. 不在 JS 中写样式切换逻辑，JS 只负责切换 `data-theme`。
5. 任何新增组件都要补“浅色+暗黑”截图或手动验收记录。

## 3. 语义变量规范

建议按下面分层扩展变量：

- 基础色：
  - `--paper-bg`
  - `--text-dark`
  - `--text-muted`
  - `--border-color`
  - `--accent-red`
  - `--accent-blue`
  - `--accent-gold`

- 组件表面（新增时优先补这层）：
  - `--surface-1` 主容器
  - `--surface-2` 次级区块
  - `--surface-card` 卡片
  - `--surface-overlay` 浮层/工具栏

如果某类组件色彩特殊（如 weather/analysis/thought），新增专用变量，不要复制硬编码。

## 4. 新增组件接入流程

1. 在组件样式里先写浅色版本，颜色都用变量：

```css
.my-card {
  background: var(--surface-card);
  color: var(--text-dark);
  border: 1px solid var(--border-color);
}
```

2. 在 `public/css/dark-mode.css` 追加 dark 覆盖：

```css
html[data-theme='dark'] .my-card {
  background: #1d2633;
  border-color: #33445a;
}
```

3. 若是标签处理器输出的类名（`src/parser/tags/handlers/**`）：
  - 确保类名稳定（例如 `.analysis-box`）
  - 在 `dark-mode.css` 为该类补覆盖

4. 验收：
  - 切换按钮可切换
  - 刷新后主题保持
  - 亮/暗模式下文本对比可读
  - 移动端无布局错位

## 5. 标签处理器开发约束

适用于 `src/parser/tags/handlers/**/getStyles()`：

1. 尽量使用变量：`var(--text-dark)`、`var(--text-muted)`、`var(--accent-*)`。
2. 如果必须用固定浅色背景（如渐变），必须在 `dark-mode.css` 提供对应类覆盖。
3. `getStyles()` 中定义的类名要语义稳定，避免改名导致 dark 覆盖失效。

## 6. 回归清单（建议每次改 UI 都跑）

1. `npm test -- routes.test.js`
2. 手动打开一篇日报，分别检查：
  - 头版头条区
  - 目录区
  - 文章区（含引用）
  - `sum/think` 区块
  - `weather/data/notes` 区块
  - 页脚与进度组件

## 7. 常见问题

- 问：为什么有些组件暗黑不生效？
  - 通常是新组件写了硬编码颜色，且未在 `dark-mode.css` 覆盖。

- 问：新类名在哪里登记？
  - 组件代码定义后，立即在 `dark-mode.css` 增加对应 dark 规则，并在 PR 描述列出类名。

- 问：能否把 dark 样式写在组件文件里？
  - 可以，但建议优先集中在 `public/css/dark-mode.css`，便于统一审查与回归。
