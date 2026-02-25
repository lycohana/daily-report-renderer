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
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
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
  const numStrRegex = /<num>([^<]+)<\/num>\s*<str>([^<]+)<\/str>/g;
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
  const dayRegex = /<day>([^<]+)<\/day>/g;
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
    
    return `<div class="weather-grid${centerClass}" data-inline="true">${itemsHtml}</div>`;
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
 * 处理 HTML 中的所有块（data + weather）
 * 
 * @param {string} html - 原始 HTML 内容
 * @returns {string} 处理后的 HTML
 */
function processBlocks(html) {
  let result = processDataBlocks(html);
  result = processWeatherBlocks(result);
  return result;
}

module.exports = {
  renderDataBlock,
  renderWeatherBlock,
  processDataBlocks,
  processWeatherBlocks,
  processBlocks
};
