import { getProfile, refreshToken } from "./client/ciam";
import type { Account, ActiveContext, AppConfig, ClientSession, CustomDecoy, Env, Tokens } from "./types";

export async function ensureClient(env: Env, clientId: string, activeNumber: string | null = null): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO clients (id, active_number, updated_at)
    VALUES (?, ?, unixepoch())
    ON CONFLICT(id) DO UPDATE SET
      active_number = COALESCE(excluded.active_number, clients.active_number),
      updated_at = unixepoch()
  `).bind(clientId, activeNumber).run();
}

export async function setActiveNumber(env: Env, clientId: string, number: string | null): Promise<void> {
  await ensureClient(env, clientId, number);
  await env.DB.prepare(`
    UPDATE clients SET active_number = ?, updated_at = unixepoch() WHERE id = ?
  `).bind(number, clientId).run();
}

export async function saveClientAccount(
  env: Env,
  clientId: string,
  number: string,
  tokens: Tokens,
  profile?: Record<string, unknown>,
): Promise<void> {
  await ensureClient(env, clientId, number);
  const profileRoot = (profile?.profile || profile || {}) as Record<string, unknown>;
  await env.DB.prepare(`
    INSERT INTO client_accounts (client_id, number, subscriber_id, subscription_type, refresh_token, access_token, id_token, token_updated_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())
    ON CONFLICT(client_id, number) DO UPDATE SET
      subscriber_id = excluded.subscriber_id,
      subscription_type = excluded.subscription_type,
      refresh_token = excluded.refresh_token,
      access_token = excluded.access_token,
      id_token = excluded.id_token,
      token_updated_at = unixepoch(),
      updated_at = unixepoch()
  `).bind(
    clientId,
    number,
    typeof profileRoot.subscriber_id === "string" ? profileRoot.subscriber_id : null,
    typeof profileRoot.subscription_type === "string" ? profileRoot.subscription_type : null,
    tokens.refresh_token,
    tokens.access_token,
    tokens.id_token,
  ).run();
  await setActiveNumber(env, clientId, number);
}

export async function getAccount(env: Env, clientId: string, number: string): Promise<Account | null> {
  return env.DB.prepare("SELECT * FROM client_accounts WHERE client_id = ? AND number = ?")
    .bind(clientId, number)
    .first<Account>();
}

export async function listAccounts(env: Env, clientId: string): Promise<Account[]> {
  const result = await env.DB.prepare(`
    SELECT * FROM client_accounts WHERE client_id = ? ORDER BY updated_at DESC
  `).bind(clientId).all<Account>();
  return result.results || [];
}

export async function deleteClientAccount(env: Env, clientId: string, number: string): Promise<boolean> {
  const result = await env.DB.prepare(
    "DELETE FROM client_accounts WHERE client_id = ? AND number = ?",
  ).bind(clientId, number).run();
  return (result.meta.changes || 0) > 0;
}

export async function getFreshTokens(
  env: Env,
  config: AppConfig,
  clientId: string,
  number: string,
): Promise<Tokens | null> {
  const account = await getAccount(env, clientId, number);
  if (!account) return null;

  const age = Math.floor(Date.now() / 1000) - account.token_updated_at;
  if (account.access_token && account.id_token && age < 300) {
    return {
      refresh_token: account.refresh_token,
      access_token: account.access_token,
      id_token: account.id_token,
    };
  }

  const tokens = await refreshToken(config, account.refresh_token, account.subscriber_id || "");
  const profile = await getProfile(config, tokens).catch(() => undefined);
  await saveClientAccount(env, clientId, number, tokens, profile);
  return tokens;
}

export async function requireActiveContext(
  env: Env,
  config: AppConfig,
  session: ClientSession,
): Promise<ActiveContext> {
  if (!session.activeNumber) throw new Error("Belum ada akun aktif. Login dulu.");
  const account = await getAccount(env, session.clientId, session.activeNumber);
  if (!account) throw new Error("Akun aktif tidak ditemukan");
  const tokens = await getFreshTokens(env, config, session.clientId, session.activeNumber);
  if (!tokens) throw new Error("Gagal refresh token akun aktif");
  return {
    session,
    tokens,
    number: session.activeNumber,
    account,
  };
}

export async function audit(env: Env, number: string | null, action: string, detail: unknown = {}): Promise<void> {
  await env.DB.prepare("INSERT INTO audit_log (number, action, detail) VALUES (?, ?, ?)")
    .bind(number, action, JSON.stringify(detail))
    .run();
}

export async function getDecoyCache(
  env: Env,
  number: string,
  name: string,
): Promise<{ option_code: string; price: number; last_fetched_at: number } | null> {
  return env.DB.prepare(
    "SELECT option_code, price, last_fetched_at FROM decoy_cache WHERE number = ? AND name = ?",
  ).bind(number, name).first();
}

export async function setDecoyCache(
  env: Env,
  number: string,
  name: string,
  optionCode: string,
  price: number,
): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO decoy_cache (number, name, option_code, price, last_fetched_at)
    VALUES (?, ?, ?, ?, unixepoch())
    ON CONFLICT(number, name) DO UPDATE SET
      option_code = excluded.option_code,
      price = excluded.price,
      last_fetched_at = unixepoch()
  `).bind(number, name, optionCode, price).run();
}

export async function getCustomDecoy(
  env: Env,
  clientId: string,
  paymentType = "balance",
): Promise<CustomDecoy | null> {
  return env.DB.prepare(
    "SELECT * FROM custom_decoy WHERE client_id = ? AND payment_type = ?",
  ).bind(clientId, paymentType).first<CustomDecoy>();
}

export async function setCustomDecoy(
  env: Env,
  clientId: string,
  paymentType: string,
  decoy: {
    family_code: string;
    variant_code: string;
    option_order: number;
    is_enterprise: boolean;
    migration_type: string;
    price: number;
    family_name?: string;
    option_name?: string;
  },
): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO custom_decoy
      (client_id, payment_type, family_code, variant_code, option_order, is_enterprise, migration_type, price, family_name, option_name, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(client_id, payment_type) DO UPDATE SET
      family_code = excluded.family_code,
      variant_code = excluded.variant_code,
      option_order = excluded.option_order,
      is_enterprise = excluded.is_enterprise,
      migration_type = excluded.migration_type,
      price = excluded.price,
      family_name = excluded.family_name,
      option_name = excluded.option_name,
      updated_at = unixepoch()
  `).bind(
    clientId,
    paymentType,
    decoy.family_code,
    decoy.variant_code,
    decoy.option_order,
    decoy.is_enterprise ? 1 : 0,
    decoy.migration_type || "NONE",
    decoy.price || 0,
    decoy.family_name || "",
    decoy.option_name || "",
  ).run();
  // Invalidate cached resolution so the next purchase refetches the new option.
  await env.DB.prepare(
    "DELETE FROM decoy_cache WHERE name = ?",
  ).bind(`custom-${paymentType}`).run();
}
