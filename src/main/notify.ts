const electron: typeof import('electron') = require('electron');

export function notifyRenderer() {
  const wins = electron.BrowserWindow.getAllWindows();
  if (wins.length > 0) {
    wins[0].webContents.send('clipboard:new-record');
  }
}
