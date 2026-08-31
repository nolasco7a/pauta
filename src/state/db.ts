import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('pauta.db');

db.execSync(`
  DROP TABLE IF EXISTS recent_scripts;
  CREATE TABLE IF NOT EXISTS scripts (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    videos TEXT NOT NULL DEFAULT '[]',
    updated_at INTEGER NOT NULL
  );
`);

type ScriptRow = {
  id: string;
  title: string;
  body: string;
  videos: string;
  updated_at: number;
};

export type VideoRef = {
  uri: string; // copia propia en el sandbox de la app, es lo que se reproduce
  assetId: string | null; // espejo en Fotos (solo para la galería del sistema), puede faltar
};

export type ScriptEntry = {
  id: string;
  title: string;
  body: string;
  videos: VideoRef[];
  updatedAt: number;
};

function rowToEntry(row: ScriptRow): ScriptEntry {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    videos: JSON.parse(row.videos),
    updatedAt: row.updated_at,
  };
}

export function getAllScripts(): ScriptEntry[] {
  return db.getAllSync<ScriptRow>('SELECT * FROM scripts ORDER BY updated_at DESC').map(rowToEntry);
}

export function deleteScript(id: string) {
  db.runSync('DELETE FROM scripts WHERE id = ?', id);
}

export function upsertScript(entry: ScriptEntry) {
  db.runSync(
    `INSERT INTO scripts (id, title, body, videos, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       body = excluded.body,
       videos = excluded.videos,
       updated_at = excluded.updated_at`,
    entry.id,
    entry.title,
    entry.body,
    JSON.stringify(entry.videos),
    entry.updatedAt
  );
}
