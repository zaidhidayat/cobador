CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  active_number TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS client_accounts (
  client_id TEXT NOT NULL,
  number TEXT NOT NULL,
  subscriber_id TEXT,
  subscription_type TEXT,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  id_token TEXT,
  token_updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY(client_id, number),
  FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_accounts_client_id ON client_accounts(client_id);

