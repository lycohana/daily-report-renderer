/**
 * 块渲染模块
 *
 * 统一处理 <data> 和 <weather> 块的 HTML 渲染逻辑
 * 用于 src/routes.js 和 src/markdownParser.js
 *
 * 安全假设：Markdown 来源为本地受控编辑，但为防御性编程仍进行 HTML 转义
 */

/**
 * HTML 转义函数
 *
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeHtml(str) {
  if (typeof str !== 'string') {
    return str;
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 将 <data> 块内容转换为 HTML
 *
 * @param {string} dataContent - <data> 标签内的内容
 * @returns {string} 渲染后的 HTML，如果无有效数据则返回空字符串
 */
function renderDataBlock(dataContent) {
  const items = [];
  const numStrRegex = /<num>([\s\S]*?)<\/num>\s*<str>([\s\S]*?)<\/str>/g;
  let numMatch;
  while ((numMatch = numStrRegex.exec(dataContent)) !== null) {
    items.push({ value: escapeHtml(numMatch[1]), label: escapeHtml(numMatch[2]) });
  }
  
  if (items.length > 0) {
    const itemsHtml = items.map(item =>
      `<div class="front-stat">
        <div class="front-stat-value">${item.value}</div>
        <div class="front-stat-label">${item.label}</div>
      </div>`
    ).join('');
    
    return `<div class="front-stats" data-inline="true">${itemsHtml}</div>`;
  }
  return '';
}

/**
 * 将 <weather> 块内容转换为 HTML
 * 
 * @param {string} weatherContent - <weather> 标签内的内容
 * @param {boolean} isCenter - 是否居中显示（由 <weather center> 语法决定）
 * @returns {string} 渲染后的 HTML，如果无有效数据则返回空字符串
 */
function renderWeatherBlock(weatherContent, isCenter = false) {
  const dayRegex = /<day>([\s\S]*?)<\/day>/g;
  const items = [];
  let m;
  while ((m = dayRegex.exec(weatherContent)) !== null) {
    const parts = m[1].split('|');
    if (parts.length >= 4) {
      let day, city, icon, condition, temp;
      if (parts.length === 4) {
        // 无城市：日期 | 图标 | 天气 | 温度
        day = escapeHtml(parts[0].trim());
        city = null;
        icon = escapeHtml(parts[1].trim());
        condition = escapeHtml(parts[2].trim());
        temp = escapeHtml(parts[3].trim());
      } else {
        // 有城市：日期 | 城市 | 图标 | 天气 | 温度
        day = escapeHtml(parts[0].trim());
        city = escapeHtml(parts[1].trim());
        icon = escapeHtml(parts[2].trim());
        condition = escapeHtml(parts[3].trim());
        temp = escapeHtml(parts[4].trim());
      }
      items.push({ day, city, icon, condition, temp });
    }
  }
  
  if (items.length > 0) {
    const centerClass = isCenter ? ' weather-center' : '';
    // 当卡片数量少于 5 个时，使用 weather-fill 类让卡片自适应填满容器
    const fillClass = items.length < 5 ? ' weather-fill' : '';
    const itemsHtml = items.map(item => {
      const cityHtml = item.city
        ? `<div class="weather-city">${item.city}</div>`
        : '<div class="weather-city weather-city-placeholder">-</div>';
      return `<div class="weather-item">
        <div class="weather-icon">${item.icon}</div>
        ${cityHtml}
        <div class="weather-condition">${item.condition}</div>
        <div class="weather-temp">${item.temp}</div>
        <div class="weather-day">${item.day}</div>
      </div>`;
    }).join('');
    
    return `<div class="weather-grid${centerClass}${fillClass}" data-inline="true">${itemsHtml}</div>`;
  }
  return '';
}

/**
 * 处理 HTML 中的 <data> 块
 * 
 * @param {string} html - 原始 HTML 内容
 * @returns {string} 处理后的 HTML
 */
function processDataBlocks(html) {
  return html.replace(/<data>([\s\S]*?)<\/data>/g, (match, dataContent) => {
    return renderDataBlock(dataContent);
  });
}

/**
 * 处理 HTML 中的 <weather> 块
 * 
 * @param {string} html - 原始 HTML 内容
 * @returns {string} 处理后的 HTML
 */
function processWeatherBlocks(html) {
  return html.replace(/<weather(?:\s+center)?>([\s\S]*?)<\/weather>/g, (match, weatherContent) => {
    const isCenter = match.includes('center');
    return renderWeatherBlock(weatherContent, isCenter);
  });
}

/**
 * 处理 HTML 中的 <notes> 块
 *
 * @param {string} html - 原始 HTML 内容
 * @returns {string} 处理后的 HTML
 */
function processNotesBlocks(html, md) {
  const notesRegex = /<notes>([\s\S]*?)<\/notes>/g;
  const noteRegex = /<note>([\s\S]*?)<\/note>/g;
  
  return html.replace(notesRegex, (match, p1) => {
    const notesContent = p1.trim();
    const notes = [];
    let noteMatch;
    // 重置正则的 lastIndex
    noteRegex.lastIndex = 0;
    while ((noteMatch = noteRegex.exec(notesContent)) !== null) {
      const noteValue = noteMatch[1].trim();
      if (noteValue) {
        notes.push(noteValue);
      }
    }
    
    if (notes.length === 0) {
      return '';
    }
    
    let notesHtml = '<div class="notes-section"><div class="notes-title">随笔笔记</div><div class="notes-grid">';
    notes.forEach((note) => {
      // 对每个 note 内容进行 Markdown 渲染
      const renderedNote = md.render(note).trim();
      // 移除包裹的 <p> 标签（如果只有一个段落）
      const cleanNote = renderedNote.replace(/^<p>(.*?)<\/p>$/, '$1');
      notesHtml += `<div class="note-card"><div class="note-card-content">${cleanNote}</div></div>`;
    });
    notesHtml += '</div></div>';
    return notesHtml;
  });
}

/**
 * 处理 HTML 中的 <sum> 块
 *
 * @param {string} html - 原始 HTML 内容
 * @returns {string} 处理后的 HTML
 */
function processSumBlocks(html) {
  return html.replace(/<sum>([\s\S]*?)<\/sum>/g, (match, p1) => {
    const value = p1.trim();
    return `<div class="analysis-box"><div class="analysis-title">总结</div><div class="analysis-content">${value}</div></div>`;
  });
}

/**
 * 处理 HTML 中的 <think>块
 *
 * @param {string} html - 原始 HTML 内容
 * @returns {string} 处理后的 HTML
 */
function processThinkBlocks(html) {
  return html.replace(/<think>([\s\S]*?)<\/think>/g, (match, p1) => {
    const value = p1.trim();
    return `<div class="thought-box"><div class="thought-title">思考</div><div class="thought-content">${value}</div></div>`;
  });
}

/**
 * 处理 HTML 中的所有块（data + weather + notes + sum + think）
 *
 * @param {string} html - 原始 HTML 内容
 * @param {Object} md - markdown-it 实例
 * @returns {string} 处理后的 HTML
 */
function processBlocks(html, md) {
  let result = processDataBlocks(html);
  result = processWeatherBlocks(result);
  result = processSumBlocks(result);
  result = processThinkBlocks(result);
  if (md) {
    result = processNotesBlocks(result, md);
  }
  return result;
}

module.exports = {
  renderDataBlock,
  renderWeatherBlock,
  processDataBlocks,
  processWeatherBlocks,
  processBlocks
};
