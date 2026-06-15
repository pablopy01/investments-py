// Preload script — runs in the renderer process with access to Node.js APIs
// Using contextBridge to safely expose APIs to the renderer
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App version and platform
  getVersion: () => ipcRenderer.invoke('get-version'),
  platform: process.platform,

  // Real-time News API
  getRealNews: () => ipcRenderer.invoke('news:get'),
  syncRealNews: (issuers) => ipcRenderer.invoke('news:sync', issuers),

  // Real-time Launches API
  getRealLaunches: () => ipcRenderer.invoke('launches:get'),
  syncRealLaunches: () => ipcRenderer.invoke('launches:sync'),

  // Exchange rate API
  getLiveExchangeRate: () => ipcRenderer.invoke('fx:get-live'),

  // Open links in external default browser
  openExternalLink: (url) => ipcRenderer.send('link:open', url),
});
