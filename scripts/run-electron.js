const { spawn } = require('child_process');
const path = require('path');

// Remove ELECTRON_RUN_AS_NODE so Electron initializes properly as main process
delete process.env.ELECTRON_RUN_AS_NODE;

const electronBin = process.platform === 'win32'
  ? path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')
  : path.join(__dirname, '..', 'node_modules', '.bin', 'electron');

const child = spawn(electronBin, ['.'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: { ...process.env },
});

child.on('error', (err) => {
  console.error('Failed to start Electron:', err.message);
  process.exit(1);
});

child.on('exit', (code) => process.exit(code || 0));
