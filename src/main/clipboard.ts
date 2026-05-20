import { addRecord } from './store';
import { notifyRenderer } from './notify';

const electron: typeof import('electron') = require('electron');

let lastText = '';
let lastImageHash = '';
let timer: ReturnType<typeof setInterval> | null = null;

function getImageHash(image: Electron.NativeImage): string {
  const buf = image.toPNG();
  if (buf.length === 0) return '';
  const sample = buf.slice(0, 1024).toString('hex');
  return `${buf.length}_${sample}`;
}

async function checkClipboard() {
  try {
    const image = electron.clipboard.readImage();
    if (!image.isEmpty()) {
      const hash = getImageHash(image);
      if (hash && hash !== lastImageHash) {
        lastImageHash = hash;
        lastText = '';
        const buf = image.toPNG();
        await addRecord('image', undefined, Buffer.from(buf));
        notifyRenderer();
      }
      return;
    }

    const text = electron.clipboard.readText();
    if (text && text !== lastText) {
      lastText = text;
      lastImageHash = '';
      await addRecord('text', text);
      notifyRenderer();
    }
  } catch (err) {
    console.error('[PasteMemo] clipboard check error:', err);
  }
}

export function startClipboardWatcher() {
  if (timer) return;
  checkClipboard();
  timer = setInterval(checkClipboard, 500);
}

export function stopClipboardWatcher() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
