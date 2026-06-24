const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  clearCookies: () => ipcRenderer.send('clear-cookies'),
  getSearchUrls: () => ipcRenderer.invoke('get-search-urls')
});