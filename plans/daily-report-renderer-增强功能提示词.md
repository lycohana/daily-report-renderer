# Daily Report Renderer - 增强功能提示词指南

> 为 Vibe Coding 设计的详细提示词，按功能模块拆分，标注重要性和困难度
> 
> **项目结构**:
> ```
> Daily/
> ├── src/
> │   ├── parser/
> │   │   ├── tags/
> │   │   │   └── handlers/
> │   │   │       ├── block/      # 块级标签处理器
> │   │   │       ├── inline/     # 行内标签处理器
> │   │   │       └── marker/     # 标记标签处理器
> │   │   └── renderers/
> │   │       └── htmlRenderer.js # HTML 渲染器
> │   ├── server.js               # Express 服务器
> │   └── routes.js               # 路由配置
> ├── views/
> │   ├── index.ejs               # 主页模板
> │   ├── list.ejs                # 列表页模板
> │   └── partials/               # EJS 局部模板
> │       └── progress.ejs        # 阅读进度条组件
> └── public/                     # 静态资源
> ```

---

## 功能总览

| 优先级 | 功能模块 | 重要性 | 困难度 | 预估工时 | 状态 |
|--------|----------|--------|--------|----------|------|
| P0 | 阅读进度条 | ⭐⭐⭐ | 🟢 简单 | 30min | ✅ 已完成 |
| P0 | 暗黑模式切换 | ⭐⭐⭐ | 🟢 简单 | 45min | ✅ 已完成|
| P0 | 字体大小调节 | ⭐⭐ | 🟢 简单 | 30min | |
| P0 | 章节折叠功能 | ⭐⭐⭐ | 🟡 中等 | 1h | |
| P0 | 搜索功能 | ⭐⭐⭐ | 🟡 中等 | 2h | |
| P0 | 分享功能 | ⭐⭐ | 🟢 简单 | 45min | |
| P1 | 返回顶部按钮 | ⭐⭐ | 🟢 简单 | 20min | ✅ 已完成|
| P1 | 工具栏 Tooltip | ⭐ |  简单 | 15min | |
| P1 | 数字滚动动画 | ⭐ | 🟢 简单 | 30min | |
| P1 | 标签过滤点击 | ⭐⭐ | 🟡 中等 | 45min | |
| P1 | 加载动画 | ⭐⭐ | 🟢 简单 | 30min | |
| P2 | 快捷键支持 | ⭐ | 🟡 中等 | 1h | |
| P2 | 阅读时间估算 | ⭐ | 🟢 简单 | 20min | |
| P2 | 状态持久化 | ⭐⭐ | 🟡 中等 | 1h | |
| P2 | 打印优化 | ⭐ | 🟢 简单 | 30min | |

---

## P0 - 核心功能

### 1. 阅读进度条 ✅

**重要性**: ⭐⭐⭐ | **困难度**: 🟢 简单 | **预估工时**: 30min

#### 功能描述
在页面顶部显示一个细长的进度条，随着用户滚动实时更新，显示当前阅读进度百分比。

#### 实现位置
- **组件文件**: [`@/views/partials/progress.ejs`](../views/partials/progress.ejs)
- **引用方式**: 在 [`@/views/index.ejs`](../views/index.ejs:82) 中使用 `<%- include('partials/progress') %>`

#### 实现要点
- 固定在页面顶部的 4px 高度横条
- 使用 CSS 渐变颜色（红→蓝）
- 监听 scroll 事件更新宽度
- 平滑过渡效果
- 移动端适配（768px 断点）

#### CSS 代码
```css
.progress-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  z-index: 10000;
  background: transparent;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-red), var(--accent-blue));
  width: 0%;
  transition: width 0.1s ease;
}

.progress-percent {
  position: fixed;
  top: 6px;
  right: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--accent-blue);
  background: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 10001;
  opacity: 0;
  transition: opacity 0.3s;
}

.progress-percent.show {
  opacity: 1;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .progress-percent {
    top: 8px;
    right: 8px;
    font-size: 0.65rem;
    padding: 2px 6px;
  }
  .progress-container {
    height: 3px;
  }
}
```

#### JavaScript 代码
```javascript
(function() {
  function updateProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      progressBar.style.width = scrolled + '%';
    }
    
    const progressPercent = document.getElementById('progressPercent');
    if (progressPercent) {
      progressPercent.textContent = Math.round(scrolled) + '%';
      progressPercent.classList[scrolled > 0 ? 'add' : 'remove']('show');
    }
  }
  
  window.addEventListener('scroll', updateProgress, { passive: true });
  document.addEventListener('DOMContentLoaded', updateProgress);
})();
```

#### HTML 结构
```html
<div class="progress-container">
  <div class="progress-bar" id="progressBar"></div>
</div>
<div class="progress-percent" id="progressPercent">0%</div>
```

---

### 2. 暗黑模式切换

**重要性**: ⭐⭐⭐ | **困难度**: 🟢 简单 | **预估工时**: 45min

#### 功能描述
一键切换日间/暗黑主题，使用 CSS 变量实现，支持 LocalStorage 保存用户偏好。

#### 实现位置
- **样式文件**: [`@/views/index.ejs`](../views/index.ejs) 或新建 `@/public/css/dark-mode.css`
- **脚本文件**: [`@/public/js/dark-mode.js`](../public/js/dark-mode.js)

#### 实现要点
- 定义两套 CSS 变量（`:root` 和 `:root.dark`）
- 切换按钮在工具栏
- LocalStorage 持久化设置
- 按钮图标随模式变化（🌙/☀️）

#### CSS 变量定义
```css
:root {
  --ink-black: #1a1a1a;
  --paper-bg: #f5f2eb;
  --accent-red: #c41e3a;
  --accent-blue: #1e3a5f;
  --text-dark: #2c2c2c;
  --text-muted: #666;
  --bg-primary: #ffffff;
  --bg-secondary: #faf9f6;
  --shadow-color: rgba(0,0,0,0.12);
}

:root.dark {
  --ink-black: #e8e6e1;
  --paper-bg: #0d0d0d;
  --accent-red: #e57373;
  --accent-blue: #64b5f6;
  --text-dark: #e0e0e0;
  --text-muted: #9e9e9e;
  --bg-primary: #1a1a1a;
  --bg-secondary: #242424;
  --shadow-color: rgba(0,0,0,0.4);
}
```

#### JavaScript 代码
```javascript
(function() {
  function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeButton(isDark);
  }
  
  function updateDarkModeButton(isDark) {
    const btn = document.querySelector('[data-action="darkMode"]');
    if (btn) {
      btn.textContent = isDark ? '☀️' : '🌙';
    }
  }
  
  // 恢复设置
  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
  }
  
  window.toggleDarkMode = toggleDarkMode;
})();
```

---

### 3. 字体大小调节

**重要性**: ⭐⭐ | **困难度**: 🟢 简单 | **预估工时**: 30min

#### 功能描述
支持 4 档字体大小切换（小/中/大/超大），点击工具栏按钮循环切换。

#### 实现位置
- **样式文件**: [`@/views/index.ejs`](../views/index.ejs)
- **脚本文件**: [`@/public/js/font-size.js`](../public/js/font-size.js)

#### 实现要点
- 定义 4 个 CSS 类：`font-small`, `font-medium`, `font-large`, `font-xlarge`
- 使用 CSS 变量 `--base-font-size`
- 标题字号按比例缩放
- LocalStorage 保存偏好

#### CSS 代码
```css
.font-small { --base-font-size: 14px; }
.font-medium { --base-font-size: 16px; }
.font-large { --base-font-size: 18px; }
.font-xlarge { --base-font-size: 20px; }

body.font-adjusted {
  font-size: var(--base-font-size);
}

body.font-adjusted .masthead h1 {
  font-size: calc(2.8rem * var(--base-font-size) / 16px);
}
```

#### JavaScript 代码
```javascript
(function() {
  const fontSizes = ['font-small', 'font-medium', 'font-large', 'font-xlarge'];
  let currentFontIndex = parseInt(localStorage.getItem('fontSize')) || 1;
  
  function cycleFontSize() {
    document.body.classList.remove(fontSizes[currentFontIndex]);
    currentFontIndex = (currentFontIndex + 1) % fontSizes.length;
    document.body.classList.add(fontSizes[currentFontIndex]);
    document.body.classList.add('font-adjusted');
    localStorage.setItem('fontSize', currentFontIndex);
  }
  
  // 初始化
  if (currentFontIndex >= 0 && currentFontIndex < fontSizes.length) {
    document.body.classList.add(fontSizes[currentFontIndex]);
  }
  
  window.cycleFontSize = cycleFontSize;
})();
```

---

### 4. 章节折叠功能

**重要性**: ⭐⭐⭐ | **困难度**: 🟡 中等 | **预估工时**: 1h

#### 功能描述
点击章节标题可折叠/展开章节内容，支持"全部折叠/展开"按钮。

#### 实现位置
- **样式文件**: [`@/views/index.ejs`](../views/index.ejs)
- **脚本文件**: [`@/public/js/section-toggle.js`](../public/js/section-toggle.js)

#### 实现要点
- 章节标题添加 `onclick` 事件
- 使用 CSS 类 `collapsed` 控制透明度
- 折叠图标旋转动画
- 全部折叠按钮切换状态

#### CSS 代码
```css
.section-header {
  cursor: pointer;
  transition: all 0.3s ease;
}

.section-header:hover {
  background: var(--bg-secondary);
  margin: 0 -40px 28px;
  padding: 14px 40px;
  border-radius: 8px;
}

.section.collapsed {
  opacity: 0.3;
  pointer-events: none;
}

.section-collapse-icon {
  transition: transform 0.3s ease;
}

.section.collapsed .section-collapse-icon {
  transform: rotate(-90deg);
}
```

#### JavaScript 代码
```javascript
(function() {
  function toggleSection(header) {
    const section = header.parentElement;
    section.classList.toggle('collapsed');
  }
  
  let allCollapsed = false;
  function toggleAllSections() {
    const sections = document.querySelectorAll('.section');
    allCollapsed = !allCollapsed;
    sections.forEach(section => {
      if (allCollapsed) {
        section.classList.add('collapsed');
      } else {
        section.classList.remove('collapsed');
      }
    });
  }
  
  window.toggleSection = toggleSection;
  window.toggleAllSections = toggleAllSections;
})();
```

#### HTML 结构
```html
<div class="section" id="section-0">
  <div class="section-header" onclick="toggleSection(this)">
    <span class="section-icon">🤖</span>
    <h3 class="section-title">AI 热点头条</h3>
    <span class="section-number">P01</span>
    <span class="section-collapse-icon">▼</span>
  </div>
  <!-- 章节内容 -->
</div>
```

---

### 5. 搜索功能

**重要性**: ⭐⭐⭐ | **困难度**: 🟡 中等 | **预估工时**: 2h

#### 功能描述
支持全文搜索，高亮匹配内容，支持标签快捷搜索，Ctrl+K 快捷键唤起。

#### 实现位置
- **样式文件**: [`@/views/index.ejs`](../views/index.ejs) 或 `@/public/css/search.css`
- **脚本文件**: [`@/public/js/search.js`](../public/js/search.js)

#### 实现要点
- 搜索遮罩层覆盖全屏
- 输入时实时搜索
- 高亮匹配文本（黄色背景）
- 标签点击快捷搜索
- 支持 Ctrl+K 快捷键

#### CSS 代码
```css
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 9997;
  display: none;
  align-items: flex-start;
  justify-content: center;
  padding-top: 100px;
}

.search-overlay.active {
  display: flex;
}

.search-box {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 8px 40px var(--shadow-color);
}

.highlight-match {
  background: rgba(255,193,7,0.3);
  padding: 2px 4px;
  border-radius: 4px;
}
```

#### JavaScript 代码
```javascript
(function() {
  function openSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (overlay) {
      overlay.classList.add('active');
      document.getElementById('searchInput').focus();
    }
  }
  
  function closeSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }
  
  function searchContent() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const articles = document.querySelectorAll('.article');
    
    // 清除之前的高亮
    document.querySelectorAll('.highlight-match').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
    
    if (!query) return;
    
    articles.forEach(article => {
      const text = article.textContent.toLowerCase();
      if (text.includes(query)) {
        article.style.display = '';
        highlightText(article, query);
      } else {
        article.style.display = 'none';
      }
    });
  }
  
  function highlightText(element, query) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.parentNode.tagName !== 'SCRIPT' && node.parentNode.tagName !== 'STYLE') {
        nodes.push(node);
      }
    }
    nodes.forEach(node => {
      const text = node.textContent;
      const index = text.toLowerCase().indexOf(query);
      if (index !== -1) {
        const span = document.createElement('span');
        span.className = 'highlight-match';
        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);
        span.textContent = match;
        node.parentNode.replaceChild(document.createTextNode(before), node);
        node.parentNode.insertBefore(span, node.nextSibling);
        node.parentNode.insertBefore(document.createTextNode(after), span.nextSibling);
      }
    });
  }
  
  // 快捷键
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
    }
  });
  
  window.openSearch = openSearch;
  window.closeSearch = closeSearch;
  window.searchContent = searchContent;
})();
```

#### HTML 结构
```html
<div class="search-overlay" id="searchOverlay" onclick="if(event.target===this) closeSearch()">
  <div class="search-box">
    <div class="search-input-wrapper">
      <span>🔍</span>
      <input type="text" class="search-input" id="searchInput" placeholder="搜索文章内容..." oninput="searchContent()">
      <span style="cursor:pointer" onclick="closeSearch()">✕</span>
    </div>
  </div>
</div>
```

---

### 6. 分享功能

**重要性**: ⭐⭐ | **困难度**: 🟢 简单 | **预估工时**: 45min

#### 功能描述
分享弹窗支持复制链接、微信、微博、QQ 分享。

#### 实现位置
- **样式文件**: [`@/views/index.ejs`](../views/index.ejs) 或 `@/public/css/share.css`
- **脚本文件**: [`@/public/js/share.js`](../public/js/share.js)

#### 实现要点
- 弹窗式分享面板
- 4 种分享方式
- 复制链接使用 Clipboard API
- 社交平台使用分享 URL

#### CSS 代码
```css
.share-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-primary);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 40px var(--shadow-color);
  z-index: 9998;
  display: none;
}

.share-modal.active {
  display: block;
  animation: fadeInUp 0.3s ease;
}

.share-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.share-option:hover {
  background: var(--bg-secondary);
  transform: translateY(-2px);
}
```

#### JavaScript 代码
```javascript
(function() {
  function toggleShare() {
    const modal = document.getElementById('shareModal');
    if (modal) {
      modal.classList.toggle('active');
    }
  }
  
  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('链接已复制到剪贴板！');
      toggleShare();
    });
  }
  
  function shareToWeibo() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${title}`);
  }
  
  function shareToQQ() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`);
  }
  
  window.toggleShare = toggleShare;
  window.copyLink = copyLink;
  window.shareToWeibo = shareToWeibo;
  window.shareToQQ = shareToQQ;
})();
```

---

## P1 - 重要功能

### 7. 返回顶部按钮

**重要性**: ⭐⭐ | **困难度**: 🟢 简单 | **预估工时**: 20min

#### 实现位置
- **样式文件**: [`@/views/index.ejs`](../views/index.ejs)
- **脚本文件**: [`@/public/js/back-to-top.js`](../public/js/back-to-top.js)

#### CSS 代码
```css
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: var(--accent-blue);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(30,58,95,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 9998;
}

.back-to-top.visible {
  opacity: 1;
  visibility: visible;
}

.back-to-top:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(30,58,95,0.5);
}
```

#### JavaScript 代码
```javascript
(function() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  function checkBackToTop() {
    const btn = document.getElementById('backToTop');
    if (btn) {
      if (window.scrollY > 500) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }
  }
  
  window.addEventListener('scroll', checkBackToTop);
  window.scrollToTop = scrollToTop;
})();
```

---

### 8. 工具栏 Tooltip

**重要性**: ⭐ | **困难度**: 🟢 简单 | **预估工时**: 15min

#### 实现位置
- **样式文件**: [`@/views/index.ejs`](../views/index.ejs)

#### CSS 代码
```css
.toolbar-tooltip {
  position: relative;
}

.toolbar-tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  right: 55px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--ink-black);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.toolbar-tooltip:hover::after {
  opacity: 1;
}
```

#### HTML 结构
```html
<button class="toolbar-btn toolbar-tooltip" data-tooltip="暗黑模式" onclick="toggleDarkMode()">
  🌙
</button>
```

---

### 9. 数字滚动动画

**重要性**: ⭐ | **困难度**: 🟢 简单 | **预估工时**: 30min

#### 实现位置
- **脚本文件**: [`@/public/js/number-animation.js`](../public/js/number-animation.js)

#### JavaScript 代码
```javascript
(function() {
  function animateNumbers() {
    const statValues = document.querySelectorAll('.front-stat-value[data-count]');
    statValues.forEach(el => {
      const target = parseInt(el.dataset.count);
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(current);
        }
      }, 16);
    });
  }
  window.addEventListener('load', animateNumbers);
})();
```

---

### 10. 标签过滤点击

**重要性**: ⭐⭐ | **困难度**: 🟡 中等 | **预估工时**: 45min

#### 实现位置
- **脚本文件**: [`@/public/js/tag-filter.js`](../public/js/tag-filter.js)

#### JavaScript 代码
```javascript
(function() {
  document.querySelectorAll('.front-tag, .article-tag').forEach(tag => {
    tag.addEventListener('click', function(e) {
      e.preventDefault();
      const filter = this.dataset.filter;
      if (filter) {
        if (typeof openSearch === 'function') {
          openSearch();
        }
        if (typeof searchByTag === 'function') {
          searchByTag(filter);
        }
      }
    });
  });
  
  function searchByTag(tag) {
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = tag;
      if (typeof searchContent === 'function') {
        searchContent();
      }
    }
  }
  
  window.searchByTag = searchByTag;
})();
```

---

### 11. 加载动画

**重要性**: ⭐⭐ | **困难度**: 🟢 简单 | **预估工时**: 30min

#### 实现位置
- **样式文件**: [`@/views/index.ejs`](../views/index.ejs)

#### CSS 代码
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.5s ease forwards;
}
```

---

## P2 - 增强功能

### 12. 快捷键支持

**重要性**: ⭐ | **困难度**: 🟡 中等 | **预估工时**: 1h

#### 实现位置
- **脚本文件**: [`@/public/js/shortcuts.js`](../public/js/shortcuts.js)

| 快捷键 | 功能 |
|--------|------|
| Ctrl+K | 打开搜索 |
| Escape | 关闭弹窗 |
| Ctrl+D | 切换暗黑模式 |
| Ctrl+0 | 重置字体大小 |
| G+H | 回到顶部 |
| G+E | 回到底部 |

#### JavaScript 代码
```javascript
(function() {
  document.addEventListener('keydown', function(e) {
    // Ctrl+K 搜索
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      if (typeof openSearch === 'function') openSearch();
    }
    // Escape 关闭
    if (e.key === 'Escape') {
      if (typeof closeSearch === 'function') closeSearch();
      const shareModal = document.getElementById('shareModal');
      if (shareModal) shareModal.classList.remove('active');
    }
    // Ctrl+D 暗黑模式
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      if (typeof toggleDarkMode === 'function') toggleDarkMode();
    }
    // Ctrl+0 重置字体
    if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      if (typeof resetFontSize === 'function') resetFontSize();
    }
  });
})();
```

---

### 13. 阅读时间估算

**重要性**: ⭐ | **困难度**: 🟢 简单 | **预估工时**: 20min

#### 实现位置
- **脚本文件**: [`@/public/js/read-time.js`](../public/js/read-time.js)

#### JavaScript 代码
```javascript
(function() {
  function calculateReadTime() {
    const text = document.body.innerText;
    const words = text.length;
    const minutes = Math.ceil(words / 400);
    const element = document.getElementById('readTime');
    if (element) {
      element.textContent = `约 ${minutes} 分钟`;
    }
  }
  document.addEventListener('DOMContentLoaded', calculateReadTime);
})();
```

---

### 14. 状态持久化

**重要性**: ⭐⭐ | **困难度**: 🟡 中等 | **预估工时**: 1h

#### 实现位置
- **脚本文件**: [`@/public/js/persist-state.js`](../public/js/persist-state.js)

| 设置项 | Key | 值类型 |
|--------|-----|--------|
| 暗黑模式 | darkMode | boolean |
| 字体大小 | fontSize | number |
| 章节折叠状态 | sectionsCollapsed | array |

#### JavaScript 代码
```javascript
(function() {
  // 保存章节状态
  function saveSectionState() {
    const sections = document.querySelectorAll('.section');
    const state = Array.from(sections).map((s, i) => ({
      id: s.id,
      collapsed: s.classList.contains('collapsed')
    }));
    localStorage.setItem('sectionsCollapsed', JSON.stringify(state));
  }
  
  // 恢复章节状态
  function restoreSectionState() {
    const state = JSON.parse(localStorage.getItem('sectionsCollapsed') || '[]');
    state.forEach(item => {
      const section = document.getElementById(item.id);
      if (section && item.collapsed) {
        section.classList.add('collapsed');
      }
    });
  }
  
  window.saveSectionState = saveSectionState;
  window.restoreSectionState = restoreSectionState;
})();
```

---

### 15. 打印优化

**重要性**: ⭐ | **困难度**: 🟢 简单 | **预估工时**: 30min

#### 实现位置
- **样式文件**: [`@/views/index.ejs`](../views/index.ejs)

#### CSS 代码
```css
@media print {
  .toolbar,
  .back-to-top,
  .search-overlay,
  .progress-container,
  .share-modal {
    display: none !important;
  }
  
  body {
    background: #fff;
    padding: 0;
  }
  
  .container {
    box-shadow: none;
    max-width: none;
  }
  
  .section {
    break-inside: avoid;
  }
  
  a {
    text-decoration: underline;
  }
}
```

---

## 完整工具栏实现

### HTML 结构
在 [`@/views/index.ejs`](../views/index.ejs) 的 `</body>` 前添加：

```html
<div class="toolbar">
  <button class="toolbar-btn toolbar-tooltip" data-tooltip="搜索内容 (Ctrl+K)" onclick="openSearch()">
    🔍
  </button>
  <button class="toolbar-btn toolbar-tooltip" data-tooltip="暗黑模式" onclick="toggleDarkMode()">
    🌙
  </button>
  <button class="toolbar-btn toolbar-tooltip" data-tooltip="字体大小" onclick="cycleFontSize()">
    Aa
  </button>
  <button class="toolbar-btn toolbar-tooltip" data-tooltip="折叠全部" onclick="toggleAllSections()">
    📋
  </button>
  <button class="toolbar-btn toolbar-tooltip" data-tooltip="分享" onclick="toggleShare()">
    📤
  </button>
  <button class="toolbar-btn toolbar-tooltip" data-tooltip="打印/导出" onclick="window.print()">
    🖨️
  </button>
</div>
```

### CSS 样式
```css
.toolbar {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
}

.toolbar-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: var(--bg-primary);
  color: var(--text-dark);
  cursor: pointer;
  box-shadow: 0 4px 12px var(--shadow-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.toolbar-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px var(--shadow-color);
}

.toolbar-btn.active {
  background: var(--accent-blue);
  color: #fff;
}
```

---

## 集成到项目的步骤

### 步骤 1: 创建公共 JS 文件
在 `@/public/js/` 目录下创建对应的 JavaScript 文件：
```bash
mkdir -p public/js
touch public/js/dark-mode.js
touch public/js/font-size.js
touch public/js/section-toggle.js
touch public/js/search.js
touch public/js/share.js
touch public/js/back-to-top.js
```

### 步骤 2: 修改 `views/index.ejs`
在 `<head>` 标签中添加 CSS 样式引用，在 `</body>` 前添加 JS 脚本引用：

```html
<head>
  <!-- 其他样式... -->
  <link rel="stylesheet" href="/css/dark-mode.css">
  <link rel="stylesheet" href="/css/search.css">
</head>
<body>
  <!-- 页面内容... -->
  
  <!-- 工具栏 -->
  <div class="toolbar">...</div>
  
  <!-- 脚本引用 -->
  <script src="/js/dark-mode.js"></script>
  <script src="/js/font-size.js"></script>
  <script src="/js/search.js"></script>
  <script src="/js/share.js"></script>
</body>
```

### 步骤 3: 测试功能
```bash
npm run dev
```
访问 `http://localhost:3000` 测试所有新增功能。

### 步骤 4: 优化性能
- 使用 `requestAnimationFrame` 优化滚动事件
- 搜索功能添加防抖
- CSS 压缩

---

## 开发建议

### 1. 渐进式增强
先实现核心功能（P0），再逐步添加 P1、P2 功能。

### 2. 可访问性
- 确保所有按钮有 `aria-label`
- 键盘导航支持
- 颜色对比度符合 WCAG 标准

### 3. 性能优化
```javascript
// 防抖函数
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 搜索使用防抖
const debouncedSearch = debounce(searchContent, 300);
```

### 4. 响应式适配
```css
@media (max-width: 768px) {
  .toolbar {
    flex-direction: row;
    top: auto;
    bottom: 20px;
    right: 10px;
    left: 10px;
    justify-content: center;
  }
  
  .toolbar-btn {
    width: 48px;
    height: 48px;
  }
}
```

---

## Vibe Coding 提示词模板

当你想实现某个功能时，直接使用以下模板：

```
我需要为日报页面添加 [功能名称] 功能。

具体要求：
1. [具体要求 1]
2. [具体要求 2]
3. [具体要求 3]

参考样式/行为：[描述期望的效果]

请帮我：
- 编写 CSS 样式
- 编写 JavaScript 逻辑
- 修改 HTML 结构
```

示例：
```
我需要为日报页面添加阅读进度条功能。

具体要求：
1. 固定在页面顶部，4px 高度
2. 颜色使用红蓝渐变
3. 随滚动实时更新宽度

请帮我编写完整的 CSS 和 JavaScript 代码，并创建 EJS 局部模板到 @/views/partials/progress.ejs。
```

---

## 项目文件路径速查

| 功能 | 文件路径 |
|------|----------|
| 阅读进度条 | `@/views/partials/progress.ejs` |
| 主页模板 | `@/views/index.ejs` |
| 列表页模板 | `@/views/list.ejs` |
| 引用块样式 | `@/src/parser/tags/handlers/block/QuoteHandler.js` |
| 服务器配置 | `@/src/server.js` |
| 路由配置 | `@/src/routes.js` |
| Markdown 解析 | `@/src/markdownParser.js` |
| HTML 渲染器 | `@/src/parser/renderers/htmlRenderer.js` |

---

## 总结

本指南将增强功能分为 3 个优先级：

- **P0（核心）**：阅读进度条 ✅、暗黑模式、字体调节、章节折叠、搜索、分享
- **P1（重要）**：返回顶部、Tooltip、数字动画、标签过滤、加载动画
- **P2（增强）**：快捷键、阅读时间、状态持久化、打印优化

建议按顺序实现，先完成 P0 功能，再逐步完善 P1 和 P2。

祝你 Vibe Coding 愉快！🚀
