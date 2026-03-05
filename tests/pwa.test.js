const fs = require('fs');
const path = require('path');

function readProjectFile(...parts) {
  return fs.readFileSync(path.join(__dirname, '..', ...parts), 'utf-8');
}

describe('PWA Setup', () => {
  test('manifest should define install metadata and required icons', () => {
    const manifestRaw = readProjectFile('public', 'manifest.webmanifest');
    const manifest = JSON.parse(manifestRaw);

    expect(manifest.name).toBe('每日日报');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/?source=pwa');
    expect(manifest.theme_color).toBe('#1a1a1a');
    expect(Array.isArray(manifest.icons)).toBe(true);

    const iconSizes = manifest.icons.map(icon => icon.sizes);
    expect(iconSizes).toContain('192x192');
    expect(iconSizes).toContain('512x512');
    expect(fs.existsSync(path.join(__dirname, '..', 'public', 'icons', 'icon-192.png'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '..', 'public', 'icons', 'icon-512.png'))).toBe(true);
  });

  test('service worker should cache offline fallback and support updates', () => {
    const sw = readProjectFile('public', 'sw.js');

    expect(sw).toContain('/offline.html');
    expect(sw).toContain("self.addEventListener('fetch'");
    expect(sw).toContain("self.addEventListener('message'");
    expect(sw).toContain('SKIP_WAITING');
  });

  test('primary pages should include PWA head and register script', () => {
    const viewFiles = ['index.ejs', 'list.ejs', 'tree.ejs', 'error.ejs'];

    viewFiles.forEach(file => {
      const content = readProjectFile('views', file);
      expect(content).toContain("include('partials/pwa-head')");
      expect(content).toContain("include('partials/pwa-script')");
    });
  });
});
