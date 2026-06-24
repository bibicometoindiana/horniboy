const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  clearCookies: ()       => ipcRenderer.send('clear-cookies'),
  loadConfig:   ()       => ipcRenderer.invoke('load-config'),
  saveConfig:   (config) => ipcRenderer.invoke('save-config', config),
});
