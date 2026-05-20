import path from 'path';
import fs from 'fs';
import initSqlJs, { Database } from 'sql.js';

const electron: typeof import('electron') = require('electron');

export interface ClipboardRecord {
  id: number;
  type: 'text' | 'image';
  content: string | null;
  image_path: string | null;
  data_url: string | null;
  pinned: number;
  created_at: number;
}

interface SearchParams {
  query?: string;
  limit?: number;
  offset?: number;
}

const DB_FILENAME = 'paste-memo.db';
const SETTINGS_DEFAULTS: Record<string, string> = {
  retentionDays: '3',
};

let db: Database | null = null;
let dbInitPromise: Promise<Database> | null = null;

function getUserDataPath(): string {
  return path.join(electron.app.getPath('userData'), DB_FILENAME);
}

function getImagesPath(): string {
  const dir = path.join(electron.app.getPath('userData'), 'images');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function getDb(): Promise<Database> {
  if (db) return db;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    console.log('[PasteMemo] Initializing SQLite...');

    // Use require.resolve to find sql.js dist folder (works in dev and production/asar)
    const sqlJsDir = path.dirname(require.resolve('sql.js'));
    console.log('[PasteMemo] sql.js located at:', sqlJsDir);

    const SQL = await initSqlJs({
      locateFile: (file: string) => path.join(sqlJsDir, file),
    });
    console.log('[PasteMemo] SQLite loaded');

    const dbPath = getUserDataPath();
    console.log('[PasteMemo] DB path:', dbPath);

    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    db.run('PRAGMA journal_mode=WAL');
    db.run('PRAGMA foreign_keys=ON');
    createTables(db);
    return db;
  })();

  return dbInitPromise;
}

function createTables(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS clipboard_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      content TEXT,
      image_path TEXT,
      image_size INTEGER,
      pinned INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(getUserDataPath(), buffer);
}

export async function addRecord(type: 'text' | 'image', content?: string, imageBuffer?: Buffer): Promise<ClipboardRecord> {
  const database = await getDb();
  const now = Date.now();
  let imagePath: string | null = null;

  if (type === 'image' && imageBuffer) {
    const filename = `${now}_${Date.now().toString(36)}.png`;
    imagePath = path.join(getImagesPath(), filename);
    fs.writeFileSync(imagePath, imageBuffer);
  }

  const stmt = database.prepare(
    'INSERT INTO clipboard_records (type, content, image_path, created_at) VALUES (?, ?, ?, ?)'
  );
  stmt.run([type, content || null, imagePath, now]);
  stmt.free();

  const id = database.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;
  saveDb();

  return { id, type, content: content || null, image_path: imagePath, data_url: null, pinned: 0, created_at: now };
}

export async function getAllRecords(params: SearchParams = {}): Promise<ClipboardRecord[]> {
  const database = await getDb();
  const { query, limit = 200, offset = 0 } = params;

  let sql = 'SELECT * FROM clipboard_records';
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (query) {
    conditions.push('type = ? AND content LIKE ?');
    values.push('text', `%${query}%`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY pinned DESC, created_at DESC LIMIT ? OFFSET ?';
  values.push(limit, offset);

  const stmt = database.prepare(sql);
  stmt.bind(values);
  const rows: ClipboardRecord[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject();
    const imagePath = row.image_path as string | null;
    let dataUrl: string | null = null;

    if (row.type === 'image' && imagePath && fs.existsSync(imagePath)) {
      const imgBuf = fs.readFileSync(imagePath);
      dataUrl = `data:image/png;base64,${imgBuf.toString('base64')}`;
    }

    rows.push({
      id: row.id as number,
      type: row.type as 'text' | 'image',
      content: row.content as string | null,
      image_path: imagePath,
      data_url: dataUrl,
      pinned: row.pinned as number,
      created_at: row.created_at as number,
    });
  }

  stmt.free();
  return rows;
}

export async function getRecordById(id: number): Promise<ClipboardRecord | null> {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM clipboard_records WHERE id = ?');
  stmt.bind([id]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as number,
      type: row.type as 'text' | 'image',
      content: row.content as string | null,
      image_path: row.image_path as string | null,
      data_url: null,
      pinned: row.pinned as number,
      created_at: row.created_at as number,
    };
  }

  stmt.free();
  return null;
}

export async function togglePin(id: number): Promise<boolean> {
  const database = await getDb();
  const record = await getRecordById(id);
  if (!record) return false;

  const newPinned = record.pinned ? 0 : 1;
  database.run('UPDATE clipboard_records SET pinned = ? WHERE id = ?', [newPinned, id]);
  saveDb();
  return newPinned === 1;
}

export async function deleteRecord(id: number): Promise<boolean> {
  const record = await getRecordById(id);
  if (!record) return false;

  // Delete image file if exists
  if (record.image_path && fs.existsSync(record.image_path)) {
    fs.unlinkSync(record.image_path);
  }

  const database = await getDb();
  database.run('DELETE FROM clipboard_records WHERE id = ?', [id]);
  saveDb();
  return true;
}

export async function cleanupExpired(): Promise<number> {
  const database = await getDb();
  const retentionDays = parseInt(await getSetting('retentionDays'), 10);
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  // Find expired records with images to delete files first
  const stmt = database.prepare(
    "SELECT id, image_path FROM clipboard_records WHERE pinned = 0 AND created_at < ? AND image_path IS NOT NULL"
  );
  stmt.bind([cutoff]);

  const imagePaths: string[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    if (row.image_path) imagePaths.push(row.image_path as string);
  }
  stmt.free();

  for (const p of imagePaths) {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  }

  const result = database.run(
    'DELETE FROM clipboard_records WHERE pinned = 0 AND created_at < ?',
    [cutoff]
  );
  saveDb();

  return database.getRowsModified();
}

export async function getSetting(key: string): Promise<string> {
  const database = await getDb();
  const stmt = database.prepare('SELECT value FROM settings WHERE key = ?');
  stmt.bind([key]);

  if (stmt.step()) {
    const val = stmt.getAsObject().value as string;
    stmt.free();
    return val;
  }

  stmt.free();
  return SETTINGS_DEFAULTS[key] || '';
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDb();
  database.run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    [key, value, value]
  );
  saveDb();
}
