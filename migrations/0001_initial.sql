CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  encrypted INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS accounts (
  number TEXT PRIMARY KEY,
  subscriber_id TEXT,
  subscription_type TEXT,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  id_token TEXT,
  token_updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL,
  family_code TEXT NOT NULL,
  family_name TEXT NOT NULL DEFAULT '',
  is_enterprise INTEGER NOT NULL DEFAULT 0,
  variant_name TEXT NOT NULL DEFAULT '',
  option_name TEXT NOT NULL DEFAULT '',
  option_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(number, family_code, variant_name, option_order)
);

CREATE TABLE IF NOT EXISTS decoy_cache (
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  option_code TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  last_fetched_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(number, name)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

