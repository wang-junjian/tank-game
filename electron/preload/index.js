const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 可以在这里暴露需要的API给渲染进程
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  on: (channel, callback) => ipcRenderer.on(channel, callback),
  off: (channel, callback) => ipcRenderer.off(channel, callback),
});
