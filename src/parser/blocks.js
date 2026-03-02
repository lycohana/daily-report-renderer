/**
 * 块渲染模块
 *
 * 统一处理 <data> 和 <weather> 块的 HTML 渲染逻辑
 * 用于 src/routes.js 和 src/markdownParser.js
 *
 * 安全假设：Markdown 来源为本地受控编辑，但为防御性编程仍进行 HTML 转义
 */

const { hasCenterAttribute, parseWeatherItems } = require('./weatherParser');

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
 * 将天气日期文案拆分为「星期」与「日期」
 * 例如：周二 3 -> { weekday: '周二', date: '3' }
 *
 * @param {string} dayText - 原始日期文案
 * @returns {{weekday: string, date: string}}
 */
function splitWeatherDay(dayText) {
  const raw = String(dayText || '').trim();
  if (!raw) {
    return { weekday: '', date: '' };
  }

  const normalized = raw.replace(/\s+/g, ' ');
  const weekFirstMatch = normalized.match(/^(今天|明天|后天|周[一二三四五六日天]|星期[一二三四五六日天])(?:\s*([0-9]{1,2}(?:日|号)?))?$/);
  if (weekFirstMatch) {
    return {
      weekday: weekFirstMatch[1],
      date: weekFirstMatch[2] || ''
    };
  }

  const genericMatch = normalized.match(/^([^\d\s]+)\s*([0-9]{1,2}(?:日|号)?)$/);
  if (genericMatch) {
    return {
      weekday: genericMatch[1],
      date: genericMatch[2]
    };
  }

  return { weekday: normalized, date: '' };
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
    const rawValue = numMatch[1].trim();
    // 提取数值和单位（如 98.7%、100 万、1.5 亿等）
    const numValue = parseFloat(rawValue.replace(/,/g, ''));
    // 提取单位后缀（百分号、万、亿等）
    const unitMatch = rawValue.match(/[\d.]+(.*?)$/);
    const unit = unitMatch && unitMatch[1] ? unitMatch[1] : '';
    items.push({
      value: escapeHtml(rawValue),
      label: escapeHtml(numMatch[2]),
      numValue: isNaN(numValue) ? null : numValue,
      unit: escapeHtml(unit)
    });
  }
  
  if (items.length > 0) {
    const itemsHtml = items.map(item => {
      const dataAttr = item.numValue !== null ? ` data-count="${item.numValue}" data-unit="${item.unit}"` : '';
      return `<div class="front-stat">
        <div class="front-stat-value"${dataAttr}>${item.value}</div>
        <div class="front-stat-label">${item.label}</div>
      </div>`;
    }).join('');
    
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
  const items = parseWeatherItems(weatherContent).map(item => ({
    day: escapeHtml(item.day),
    city: item.city ? escapeHtml(item.city) : null,
    icon: escapeHtml(item.icon),
    condition: escapeHtml(item.condition),
    temp: escapeHtml(item.temp)
  }));
  
  if (items.length > 0) {
    const centerClass = isCenter ? ' weather-center' : '';
    // 当卡片数量不超过 5 个时，使用 weather-fill 类让卡片自适应填满容器
    const fillClass = items.length <= 5 ? ' weather-fill' : '';
    const itemsHtml = items.map(item => {
      const dayParts = splitWeatherDay(item.day);
      const tempParts = item.temp.split('/').map(part => part.trim()).filter(Boolean);
      const highTemp = tempParts[0] || item.temp;
      const lowTemp = tempParts[1] || '';
      const cityHtml = item.city
        ? `<div class="weather-city">${item.city}</div>`
        : '<div class="weather-city weather-city-placeholder">-</div>';
      const dayHtml = dayParts.date
        ? `<div class="weather-day"><span class="weather-weekday">${dayParts.weekday}</span><span class="weather-day-separator">·</span><span class="weather-date">${dayParts.date}</span></div>`
        : `<div class="weather-day"><span class="weather-weekday">${dayParts.weekday}</span></div>`;

      const tempHtml = lowTemp
        ? `<div class="weather-temp" data-raw-temp="${item.temp}"><div class="weather-temp-high">${highTemp}</div><div class="weather-temp-divider">/</div><div class="weather-temp-low">${lowTemp}</div></div>`
        : `<div class="weather-temp" data-raw-temp="${item.temp}"><div class="weather-temp-high">${highTemp}</div></div>`;

      return `<div class="weather-item">
        <div class="weather-item-top">
          ${dayHtml}
          ${cityHtml}
        </div>
        <div class="weather-icon-wrap"><div class="weather-icon">${item.icon}</div></div>
        <div class="weather-condition">${item.condition}</div>
        ${tempHtml}
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
  return html.replace(/<weather\b([^>]*)>([\s\S]*?)<\/weather>/gi, (match, attrs, weatherContent) => {
    const isCenter = hasCenterAttribute(attrs);
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

  return html.replace(notesRegex, (match, p1) => {
    const notesContent = p1.trim();
    // 使用 matchAll 避免 lastIndex 状态问题
    const notes = [...notesContent.matchAll(/<note>([\s\S]*?)<\/note>/g)]
      .map(m => m[1].trim())
      .filter(Boolean);
    
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
