const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs   = require('fs');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const URLS_PATH   = path.join(__dirname, 'urls.txt');

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      partition: 'persist:dual-browser-session'
    }
  });

  win.loadFile('index.html');
}

// ── Load config (groups + urls) ────────────────────────────
ipcMain.handle('load-config', async () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
    // Fall back to urls.txt (legacy plain templates OR new JSON-per-line)
    if (fs.existsSync(URLS_PATH)) {
      const lines = fs.readFileSync(URLS_PATH, 'utf-8')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);
      
      // Check if it's new JSON-per-line format (starts with '{')
      const jsonUrls = lines.filter(l => l.startsWith('{')).map(l => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter(Boolean);

      if (jsonUrls.length > 0) {
        // New format: has id, label, template, groupId, enabled
        return {
          groups: [],
          urls: jsonUrls
        };
      }

      // Old format: plain URL templates
      const legacyUrls = lines.filter(l => l.includes('{search_keyword}'));
      return { legacyUrls };
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }
  return null;
});

// ── Save config (groups + urls) ────────────────────────────
ipcMain.handle('save-config', async (event, config) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    // Keep urls.txt in sync preserving labels & groups (JSON per line)
    if (config.urls && Array.isArray(config.urls)) {
      const lines = config.urls.map(u => JSON.stringify({
        id: u.id, label: u.label, template: u.template,
        groupId: u.groupId, enabled: u.enabled
      })).join('\n');
      fs.writeFileSync(URLS_PATH, lines, 'utf-8');
    }
    return { ok: true };
  } catch (err) {
    console.error('Error saving config:', err);
    return { ok: false, error: err.message };
  }
});

// ── Clear cookies ──────────────────────────────────────────
ipcMain.on('clear-cookies', async () => {
  const ses = session.fromPartition('persist:dual-browser-session');
  await ses.clearStorageData({ storages: ['cookies'] });
});

app.whenReady().then(createWindow);
