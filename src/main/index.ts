import path from 'path';
import { ipcMain } from 'electron';
import type { BrowserWindow as BW, Tray as Tr } from 'electron';
import { startClipboardWatcher, stopClipboardWatcher } from './clipboard';
import {
  getAllRecords,
  getRecordById,
  togglePin,
  deleteRecord,
  getSetting,
  setSetting,
  cleanupExpired,
} from './store';

const electron: typeof import('electron') = require('electron');

let mainWindow: BW | null = null;
let tray: Tr | null = null;
let isQuitting = false;

const isDev = !electron.app.isPackaged;

function getWindow(): BW {
  return mainWindow!;
}

function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 420,
    height: 640,
    minWidth: 320,
    minHeight: 400,
    show: true,
    frame: true,
    resizable: true,
    title: 'PasteMemo',
    backgroundColor: '#F0F7FF',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Forward renderer console to main process for debugging
  mainWindow.webContents.on('console-message', (_event, level, message) => {
    const prefix = level === 3 ? '[RENDERER ERROR]' : '[RENDERER]';
    console.log(prefix, message);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.png');
  const icon = electron.nativeImage.createFromPath(iconPath);
  tray = new electron.Tray(icon);
  tray.setToolTip('PasteMemo');

  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: '打开面板',
      click: () => getWindow().show(),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        electron.app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    const win = getWindow();
    win.isVisible() ? win.hide() : win.show();
  });
}

function registerHotkey() {
  electron.globalShortcut.register('Alt+V', () => {
    const win = getWindow();
    win.isVisible() ? win.hide() : win.show();
    win.focus();
  });
}

function registerIpcHandlers() {
  ipcMain.handle('clipboard:get-all', async (_event, search?: string) => {
    const records = await getAllRecords({ query: search });
    console.log('[PasteMemo] get-all records count:', records.length, 'search:', search || '(none)');
    return records;
  });

  ipcMain.handle('clipboard:copy', async (_event, id: number) => {
    const record = await getRecordById(id);
    if (!record) return false;

    if (record.type === 'text' && record.content) {
      electron.clipboard.writeText(record.content);
    } else if (record.type === 'image' && record.image_path) {
      const img = electron.nativeImage.createFromPath(record.image_path);
      electron.clipboard.writeImage(img);
    }
    return true;
  });

  ipcMain.handle('clipboard:pin', async (_event, id: number) => {
    return togglePin(id);
  });

  ipcMain.handle('clipboard:delete', async (_event, id: number) => {
    return deleteRecord(id);
  });

  ipcMain.handle('settings:get', async (_event, key: string) => {
    return getSetting(key);
  });

  ipcMain.handle('settings:set', async (_event, key: string, value: string) => {
    return setSetting(key, value);
  });
}

electron.app.whenReady().then(() => {
  createWindow();
  createTray();
  registerHotkey();
  registerIpcHandlers();
  startClipboardWatcher();
  cleanupExpired();
});

electron.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
});

electron.app.on('activate', () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

electron.app.on('will-quit', () => {
  stopClipboardWatcher();
  electron.globalShortcut.unregisterAll();
});
