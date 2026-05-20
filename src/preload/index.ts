import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('pasteMemo', {
  toggleWindow: () => ipcRenderer.invoke('window:toggle'),
  getHistory: (search?: string) => ipcRenderer.invoke('clipboard:get-all', search),
  copyToClipboard: (id: number) => ipcRenderer.invoke('clipboard:copy', id),
  togglePin: (id: number) => ipcRenderer.invoke('clipboard:pin', id),
  deleteRecord: (id: number) => ipcRenderer.invoke('clipboard:delete', id),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
  onNewRecord: (callback: () => void) => {
    ipcRenderer.on('clipboard:new-record', callback);
    return () => ipcRenderer.removeListener('clipboard:new-record', callback);
  },
});
