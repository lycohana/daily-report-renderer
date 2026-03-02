/**
 * Blocks 模块单元测试
 * 
 * 测试 renderDataBlock, renderWeatherBlock, processDataBlocks, processWeatherBlocks, processBlocks
 */

const {
  renderDataBlock,
  renderWeatherBlock,
  processDataBlocks,
  processWeatherBlocks,
  processBlocks
} = require('../../src/parser/blocks');

describe('Blocks Module', () => {
  describe('renderDataBlock', () => {
    test('should render data block with valid content', () => {
      const dataContent = '<num>98.7%</num><str>任务完成率</str>';
      const result = renderDataBlock(dataContent);
      
      expect(result).toContain('front-stats');
      expect(result).toContain('98.7%');
      expect(result).toContain('任务完成率');
    });

    test('should render data block with multiple items', () => {
      const dataContent = '<num>98.7%</num><str>任务完成率</str><num>100万</num><str>Token上下文</str>';
      const result = renderDataBlock(dataContent);
      
      expect(result).toContain('98.7%');
      expect(result).toContain('任务完成率');
      expect(result).toContain('100万');
      expect(result).toContain('Token上下文');
    });

    test('should return empty string for invalid content', () => {
      const dataContent = 'invalid content';
      const result = renderDataBlock(dataContent);
      
      expect(result).toBe('');
    });

    test('should return empty string for empty content', () => {
      const dataContent = '';
      const result = renderDataBlock(dataContent);
      
      expect(result).toBe('');
    });

    test('should escape HTML in data values', () => {
      const dataContent = `<num>test & value</num><str>"quoted" and 'single'</str>`;
      const result = renderDataBlock(dataContent);

      expect(result).toContain('test &amp; value');
      expect(result).toContain('&quot;quoted&quot; and &#039;single&#039;');
    });
  });

  describe('renderWeatherBlock', () => {
    test('should render weather block with city', () => {
      const weatherContent = '<day>周一|东莞|☀️|晴|28°C/19°C</day>';
      const result = renderWeatherBlock(weatherContent, false);
      
      expect(result).toContain('weather-grid');
      expect(result).toContain('周一');
      expect(result).toContain('东莞');
      expect(result).toContain('☀️');
      expect(result).toContain('晴');
      expect(result).toContain('28°C/19°C');
    });

    test('should render weather block without city', () => {
      const weatherContent = '<day>周一|☀️|晴|28°C/19°C</day>';
      const result = renderWeatherBlock(weatherContent, false);
      
      expect(result).toContain('weather-grid');
      expect(result).toContain('周一');
      expect(result).toContain('weather-city-placeholder');
      expect(result).toContain('☀️');
      expect(result).toContain('晴');
      expect(result).toContain('28°C/19°C');
    });

    test('should render weather block with center class', () => {
      const weatherContent = '<day>周一|东莞|☀️|晴|28°C/19°C</day>';
      const result = renderWeatherBlock(weatherContent, true);
      
      expect(result).toContain('weather-grid weather-center');
    });

    test('should return empty string for invalid content', () => {
      const weatherContent = 'invalid content';
      const result = renderWeatherBlock(weatherContent, false);
      
      expect(result).toBe('');
    });

    test('should return empty string for empty content', () => {
      const weatherContent = '';
      const result = renderWeatherBlock(weatherContent, false);
      
      expect(result).toBe('');
    });

    test('should escape HTML in weather values', () => {
      const weatherContent = `<day>test & day|city's|icon "x"|condition & clear|"temp"</day>`;
      const result = renderWeatherBlock(weatherContent, false);

      expect(result).toContain('test &amp; day');
      expect(result).toContain('city&#039;s');
      expect(result).toContain('icon &quot;x&quot;');
      expect(result).toContain('condition &amp; clear');
      expect(result).toContain('&quot;temp&quot;');
    });

    test('should render weather block with day attribute syntax', () => {
      const weatherContent = '<day day="周三 4" weather="多云" temp="19 16" />';
      const result = renderWeatherBlock(weatherContent, false);

      expect(result).toContain('weather-grid');
      expect(result).toContain('>周三<');
      expect(result).toContain('>4<');
      expect(result).toContain('⛅');
      expect(result).toContain('多云');
      expect(result).toContain('19°C/16°C');
    });

    test('should render weather block with separate weekday/date/icon attributes', () => {
      const weatherContent = '<day weekday="周二" date="3" icon="🌧️" weather="雨" temp="17/14" />';
      const result = renderWeatherBlock(weatherContent, false);

      expect(result).toContain('weather-weekday');
      expect(result).toContain('weather-date');
      expect(result).toContain('>周二<');
      expect(result).toContain('>3<');
      expect(result).toContain('🌧️');
      expect(result).toContain('雨');
      expect(result).toContain('17°C/14°C');
    });

    test('should render mixed day syntax in source order', () => {
      const weatherContent = '<day day="周三 4" weather="雨" temp="17/14" /><day>周四|☀️|晴|24°C/15°C</day>';
      const result = renderWeatherBlock(weatherContent, false);

      expect(result).toContain('>周三<');
      expect(result).toContain('>4<');
      expect(result).toContain('>周四<');
      expect(result.indexOf('>周三<')).toBeLessThan(result.indexOf('>周四<'));
    });

    test('should normalize single temperature from day attribute syntax', () => {
      const weatherContent = '<day day="周四 5" icon="☀️" temp="24" />';
      const result = renderWeatherBlock(weatherContent, false);

      expect(result).toContain('24°C');
      expect(result).not.toContain('weather-temp-divider');
    });
  });

  describe('processDataBlocks', () => {
    test('should process data blocks in HTML', () => {
      const html = '<p>Some text</p><data><num>98.7%</num><str>任务完成率</str></data><p>More text</p>';
      const result = processDataBlocks(html);
      
      expect(result).not.toContain('<data>');
      expect(result).not.toContain('</data>');
      expect(result).toContain('front-stats');
      expect(result).toContain('98.7%');
      expect(result).toContain('任务完成率');
    });

    test('should handle multiple data blocks', () => {
      const html = '<data><num>98.7%</num><str>任务完成率</str></data><data><num>100万</num><str>Token上下文</str></data>';
      const result = processDataBlocks(html);
      
      expect(result).not.toContain('<data>');
      expect(result).toContain('98.7%');
      expect(result).toContain('100万');
    });

    test('should return original HTML when no data blocks', () => {
      const html = '<p>Some text</p>';
      const result = processDataBlocks(html);
      
      expect(result).toBe(html);
    });
  });

  describe('processWeatherBlocks', () => {
    test('should process weather blocks in HTML', () => {
      const html = '<p>Some text</p><weather><day>周一|东莞|☀️|晴|28°C/19°C</day></weather><p>More text</p>';
      const result = processWeatherBlocks(html);
      
      expect(result).not.toContain('<weather>');
      expect(result).not.toContain('</weather>');
      expect(result).toContain('weather-grid');
      expect(result).toContain('周一');
      expect(result).toContain('东莞');
    });

    test('should process weather blocks with center attribute', () => {
      const html = '<weather center><day>周一|东莞|☀️|晴|28°C/19°C</day></weather>';
      const result = processWeatherBlocks(html);
      
      expect(result).toContain('weather-grid weather-center');
    });

    test('should return original HTML when no weather blocks', () => {
      const html = '<p>Some text</p>';
      const result = processWeatherBlocks(html);
      
      expect(result).toBe(html);
    });

    test('should process weather block with arbitrary attributes', () => {
      const html = '<weather class="weekly" center data-x="1"><day day="周三 4" weather="雨" temp="17/14" /></weather>';
      const result = processWeatherBlocks(html);

      expect(result).toContain('weather-grid weather-center');
      expect(result).toContain('>周三<');
      expect(result).toContain('>4<');
      expect(result).toContain('17°C/14°C');
    });
  });

  describe('processBlocks', () => {
    test('should process both data and weather blocks', () => {
      const html = '<data><num>98.7%</num><str>任务完成率</str></data><weather><day>周一|东莞|☀️|晴|28°C/19°C</day></weather>';
      const result = processBlocks(html);
      
      expect(result).not.toContain('<data>');
      expect(result).not.toContain('<weather>');
      expect(result).toContain('front-stats');
      expect(result).toContain('weather-grid');
      expect(result).toContain('98.7%');
      expect(result).toContain('周一');
    });

    test('should handle complex mixed content', () => {
      const html = `
        <p>Before data</p>
        <data><num>98.7%</num><str>任务完成率</str></data>
        <p>Between</p>
        <weather center><day>周一|东莞|☀️|晴|28°C/19°C</day></weather>
        <p>After weather</p>
      `;
      const result = processBlocks(html);
      
      expect(result).not.toContain('<data>');
      expect(result).not.toContain('<weather>');
      expect(result).toContain('front-stats');
      expect(result).toContain('weather-grid weather-center');
    });
  });
});
