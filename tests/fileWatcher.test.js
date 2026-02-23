const fileWatcher = require('../src/fileWatcher');

describe('File Watcher', () => {
  describe('parseFilename', () => {
    test('should parse standard filename correctly', () => {
      const result = fileWatcher.parseFilename('daily-report-001-2026-02-22.md');
      
      expect(result).toBeDefined();
      expect(result.number).toBe(1);
      expect(result.year).toBe(2026);
      expect(result.month).toBe(2);
      expect(result.day).toBe(22);
      expect(result.sortKey).toBe('20260222');
    });

    test('should parse filename with single digit month and day', () => {
      const result = fileWatcher.parseFilename('daily-report-001-2026-1-5.md');
      
      expect(result).toBeDefined();
      expect(result.month).toBe(1);
      expect(result.day).toBe(5);
      expect(result.sortKey).toBe('20260105');
    });

    test('should return null for invalid filename', () => {
      const result = fileWatcher.parseFilename('invalid-filename.md');
      
      expect(result).toBeNull();
    });

    test('should extract edition number from filename', () => {
      const result = fileWatcher.parseFilename('daily-report-042-2026-02-22.md');
      
      expect(result.number).toBe(42);
      expect(result.sortKey).toBe('20260222');
    });
  });

  describe('scanDirectory', () => {
    test('should return empty array for non-existent directory', async () => {
      const result = await fileWatcher.scanDirectory('/non/existent/path');
      
      expect(result).toEqual([]);
    });
  });
});
