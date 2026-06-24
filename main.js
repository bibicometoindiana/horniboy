const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');

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

ipcMain.handle('get-search-urls', async () => {
  const filePath = path.join(__dirname, 'urls.txt');
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const urls = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.includes('{search_keyword}'));
    return urls;
  } catch (err) {
    console.error('Error reading urls.txt:', err);
    return [];
  }
});

ipcMain.on('clear-cookies', async () => {
  const ses = session.fromPartition('persist:dual-browser-session');
  await ses.clearStorageData({ storages: ['cookies'] });
});

app.whenReady().then(createWindow);