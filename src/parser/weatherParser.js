/**
 * Weather 解析工具
 *
 * 统一处理 weather/day 新旧语法：
 * 1) 旧语法：<day>周一|东莞|☀️|晴|26°C/17°C</day>
 * 2) 新语法：<day day="周一" city="东莞" icon="☀️" weather="晴" temp="26/17" />
 */

const DAY_ATTR_KEYS = ['day', 'weekday', 'date', 'city', 'icon', 'weather', 'temp'];

const ICON_TO_CONDITION = {
  '☀️': '晴',
  '⛅': '多云',
  '☁️': '阴',
  '🌧️': '雨',
  '⛈️': '雷阵雨',
  '❄️': '雪',
  '🌫️': '雾'
};

function hasCenterAttribute(attrText) {
  const source = String(attrText || '').trim();
  if (!source) {
    return false;
  }
  return /(?:^|\s)center(?:\s*(?:=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?(?=\s|$))/i.test(source);
}

function parseAttributes(attrText) {
  const attrs = {};
  const source = String(attrText || '');
  const attrRegex = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match;

  while ((match = attrRegex.exec(source)) !== null) {
    const key = match[1].toLowerCase();
    const value = (match[2] ?? match[3] ?? match[4] ?? '').trim();
    attrs[key] = value;
  }

  return attrs;
}

function normalizeTempPart(input) {
  const raw = String(input || '').trim();
  if (!raw) {
    return '';
  }

  const numberMatch = raw.match(/-?\d+(?:\.\d+)?/);
  if (!numberMatch) {
    return raw;
  }

  return `${numberMatch[0]}°C`;
}

function normalizeTemperature(temp) {
  const raw = String(temp || '').trim();
  if (!raw) {
    return '';
  }

  const normalized = raw
    .replace(/℃/g, '°C')
    .replace(/／/g, '/')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.includes('/')) {
    const parts = normalized.split('/').map(part => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${normalizeTempPart(parts[0])}/${normalizeTempPart(parts[1])}`;
    }
    if (parts.length === 1) {
      return normalizeTempPart(parts[0]);
    }
  }

  const numbers = normalized.match(/-?\d+(?:\.\d+)?/g);
  if (numbers && numbers.length >= 2) {
    return `${numbers[0]}°C/${numbers[1]}°C`;
  }
  if (numbers && numbers.length === 1) {
    return `${numbers[0]}°C`;
  }

  return normalized;
}

function inferIconFromWeather(condition) {
  const text = String(condition || '').trim();
  if (!text) {
    return '';
  }

  if (/雷/.test(text) && /雨/.test(text)) {
    return '⛈️';
  }
  if (/雪/.test(text)) {
    return '❄️';
  }
  if (/雾|霾/.test(text)) {
    return '🌫️';
  }
  if (/雨/.test(text)) {
    return '🌧️';
  }
  if (/多云|少云|晴间多云|局部多云/.test(text)) {
    return '⛅';
  }
  if (/阴/.test(text)) {
    return '☁️';
  }
  if (/晴/.test(text)) {
    return '☀️';
  }

  return '';
}

function inferConditionFromIcon(icon) {
  const value = String(icon || '').trim();
  if (!value) {
    return '未知';
  }
  return ICON_TO_CONDITION[value] || '未知';
}

function finalizeItem(item) {
  const day = String(item.day || '').trim();
  if (!day) {
    return null;
  }

  const cityRaw = String(item.city || '').trim();
  const city = cityRaw || null;
  let icon = String(item.icon || '').trim();
  let condition = String(item.condition || '').trim();
  const temp = normalizeTemperature(item.temp);

  if (!icon && condition) {
    icon = inferIconFromWeather(condition);
  }

  if (!condition) {
    condition = inferConditionFromIcon(icon);
  }

  return { day, city, icon, condition, temp };
}

function parseLegacyDay(body) {
  const parts = String(body || '').split('|').map(part => part.trim());
  if (parts.length < 4) {
    return null;
  }

  if (parts.length === 4) {
    return finalizeItem({
      day: parts[0],
      city: null,
      icon: parts[1],
      condition: parts[2],
      temp: parts[3]
    });
  }

  return finalizeItem({
    day: parts[0],
    city: parts[1],
    icon: parts[2],
    condition: parts[3],
    temp: parts[4]
  });
}

function parseAttributeDay(attrs) {
  const directDay = String(attrs.day || '').trim();
  const weekday = String(attrs.weekday || '').trim();
  const date = String(attrs.date || '').trim();
  const day = directDay || [weekday, date].filter(Boolean).join(' ').trim();

  return finalizeItem({
    day,
    city: attrs.city,
    icon: attrs.icon,
    condition: attrs.weather,
    temp: attrs.temp
  });
}

function parseWeatherItems(weatherContent) {
  const source = String(weatherContent || '');
  const dayTokenRegex = /<day\b[\s\S]*?(?:\/>|>[\s\S]*?<\/day>)/gi;
  const items = [];
  let match;

  while ((match = dayTokenRegex.exec(source)) !== null) {
    const token = match[0];
    const openTagMatch = token.match(/^<day\b([^>]*)>/i);
    if (!openTagMatch) {
      continue;
    }

    const attrs = parseAttributes(openTagMatch[1] || '');
    const hasAttrSyntax = DAY_ATTR_KEYS.some(key => Object.prototype.hasOwnProperty.call(attrs, key));

    let item = null;
    if (hasAttrSyntax) {
      item = parseAttributeDay(attrs);
    } else {
      const body = token
        .replace(/^<day\b[^>]*>/i, '')
        .replace(/<\/day>\s*$/i, '');
      item = parseLegacyDay(body);
    }

    if (item) {
      items.push(item);
    }
  }

  return items;
}

module.exports = {
  hasCenterAttribute,
  normalizeTemperature,
  parseWeatherItems
};
