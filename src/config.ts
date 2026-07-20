import { axDeviceId, axFingerprint, generateFingerprintPlain } from "./crypto";
import type { AppConfig, Env } from "./types";

const FINGERPRINT_KEY = "AX_FINGERPRINT_PLAIN";

const CONFIG_KEYS = [
  "BASE_API_URL",
  "BASE_CIAM_URL",
  "BASIC_AUTH",
  "API_KEY",
  "UA",
  "XDATA_KEY",
  "AX_API_SIG_KEY",
  "X_API_BASE_SECRET",
  "AX_FP_KEY",
  "ENCRYPTED_FIELD_KEY",
  "APP_SESSION_SECRET",
] as const;

async function getSetting(env: Env, key: string): Promise<string | undefined> {
  const direct = env[key as keyof Env];
  if (typeof direct === "string" && direct.length > 0) return direct;

  const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return row?.value;
}

async function getFingerprintPlain(env: Env): Promise<string | undefined> {
  const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(FINGERPRINT_KEY)
    .first<{ value: string }>();
  return row?.value && row.value.length > 0 ? row.value : undefined;
}

async function setFingerprintPlain(env: Env, value: string): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, unixepoch())
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()
  `).bind(FINGERPRINT_KEY, value).run();
}

export async function loadConfig(env: Env): Promise<AppConfig> {
  const values = new Map<string, string>();
  await Promise.all(CONFIG_KEYS.map(async (key) => {
    const value = await getSetting(env, key);
    if (value) values.set(key, value);
  }));

  const required = CONFIG_KEYS.filter((key) => !values.get(key));
  if (required.length > 0) {
    throw new Error(`Missing Worker config: ${required.join(", ")}`);
  }

  // Load-or-create a stable device fingerprint, persisted plaintext in D1
  // (like the Python CLI's `ax.fp`). Generated once, reused on every request so
  // request-otp and submit-otp always send the identical Ax-Fingerprint.
  let fingerprintPlain = await getFingerprintPlain(env);
  if (!fingerprintPlain) {
    fingerprintPlain = generateFingerprintPlain();
    await setFingerprintPlain(env, fingerprintPlain);
  }
  const axFpKey = values.get("AX_FP_KEY")!;
  const fingerprintEnc = await axFingerprint({ axFpKey } as AppConfig, fingerprintPlain);
  const deviceId = await axDeviceId(fingerprintEnc);

  return {
    baseApiUrl: values.get("BASE_API_URL")!,
    baseCiamUrl: values.get("BASE_CIAM_URL")!,
    basicAuth: values.get("BASIC_AUTH")!,
    apiKey: values.get("API_KEY")!,
    userAgent: values.get("UA")!,
    xdataKey: values.get("XDATA_KEY")!,
    axApiSigKey: values.get("AX_API_SIG_KEY")!,
    xApiBaseSecret: values.get("X_API_BASE_SECRET")!,
    axFpKey: values.get("AX_FP_KEY")!,
    encryptedFieldKey: values.get("ENCRYPTED_FIELD_KEY")!,
    sessionSecret: values.get("APP_SESSION_SECRET")!,
    appVersion: env.APP_VERSION || "8.9.0",
    axRequestDevice: env.AX_REQUEST_DEVICE || "samsung",
    axRequestDeviceModel: env.AX_REQUEST_DEVICE_MODEL || "SM-N935F",
    axSubstype: env.AX_SUBSTYPE || "PREPAID",
    axFingerprint: fingerprintEnc,
    axDeviceId: deviceId,
  };
}
