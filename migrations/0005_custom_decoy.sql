-- Per-user custom decoy definition (menu 5.5 "Pulsa + Decoy Custom").
-- Each app user (client_id) stores their own decoy package parameters.
-- Mirrors the fields of decoy_data/decoy-custom-balance.json but per user.
CREATE TABLE IF NOT EXISTS custom_decoy (
  client_id TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'balance',
  family_code TEXT NOT NULL,
  variant_code TEXT NOT NULL,
  option_order INTEGER NOT NULL DEFAULT 0,
  is_enterprise INTEGER NOT NULL DEFAULT 0,
  migration_type TEXT NOT NULL DEFAULT 'NONE',
  price INTEGER NOT NULL DEFAULT 0,
  family_name TEXT NOT NULL DEFAULT '',
  option_name TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY(client_id, payment_type)
);
