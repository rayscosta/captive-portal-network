import Database from 'better-sqlite3'

const dbPath = process.env.DATABASE_PATH || './database.sqlite'

let dbInstance = null

export const getDb = () => {
  // Comentário: abre conexão com SQLite de forma síncrona (better-sqlite3 é síncrono por design)
  if (!dbInstance) {
    dbInstance = new Database(dbPath)
    dbInstance.pragma('foreign_keys = ON')
  }
  return dbInstance
}

export const ensureDatabase = () => {
  const db = getDb()
  // Comentário: cria tabelas se não existirem
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      name TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      ip TEXT,
      mac TEXT,
      agent_token TEXT UNIQUE,
      last_seen DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS command_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_id INTEGER NOT NULL,
      output TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(command_id) REFERENCES commands(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS captive_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      ip TEXT,
      mac TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS state_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT UNIQUE NOT NULL,
      ip TEXT,
      mac TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT,
      action TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  // Comentário: better-sqlite3 mantém a conexão aberta; não precisa fechar aqui
}
