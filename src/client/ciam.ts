import { base64Encode, makeAxApiSignature } from "../crypto";
import { javaLikeTimestamp, tsGmt7WithoutColon } from "../time";
import type { AppConfig, Tokens } from "../types";
import { sendApiRequest } from "./api";

async function deviceHeaders(config: AppConfig): Promise<Record<string, string>> {
  // Fingerprint + device id are resolved once in loadConfig (persisted in D1),
  // so every request in the auth flow sends the identical Ax-Fingerprint.
  return {
    "Ax-Device-Id": config.axDeviceId,
    "Ax-Fingerprint": config.axFingerprint,
    "Ax-Request-Device": config.axRequestDevice,
    "Ax-Request-Device-Model": config.axRequestDeviceModel,
    "Ax-Substype": config.axSubstype,
  };
}

function hostFromUrl(url: string): string {
  return new URL(url).host;
}

export function validateContact(contact: string): boolean {
  return /^628\d{7,11}$/.test(contact);
}

export async function requestOtp(config: AppConfig, contact: string): Promise<{ subscriber_id?: string; raw: unknown }> {
  if (!validateContact(contact)) throw new Error("Nomor harus format 628xxxxxxxx dan panjang valid");

  const url = new URL(`${config.baseCiamUrl}/realms/xl-ciam/auth/otp`);
  url.searchParams.set("contact", contact);
  url.searchParams.set("contactType", "SMS");
  url.searchParams.set("alternateContact", "false");

  const headers = {
    "Accept-Encoding": "gzip, deflate, br",
    Authorization: `Basic ${config.basicAuth}`,
    "Ax-Request-At": javaLikeTimestamp(),
    "Ax-Request-Id": crypto.randomUUID(),
    "Content-Type": "application/json",
    Host: hostFromUrl(config.baseCiamUrl),
    "User-Agent": config.userAgent,
    ...(await deviceHeaders(config)),
  };

  const response = await fetch(url, { method: "GET", headers });
  const raw = await response.json().catch(() => ({ status: response.status, body: "non-json" }));
  return {
    subscriber_id: typeof raw === "object" && raw && "subscriber_id" in raw ? String((raw as { subscriber_id: string }).subscriber_id) : undefined,
    raw,
  };
}

export async function submitOtp(
  config: AppConfig,
  contactType: "SMS" | "DEVICEID",
  contact: string,
  code: string,
): Promise<Tokens> {
  const finalContact = contactType === "DEVICEID" ? base64Encode(contact) : contact;
  if (contactType === "SMS" && !validateContact(contact)) throw new Error("Nomor tidak valid");
  if (!code || (contactType === "SMS" && !/^\d{6}$/.test(code))) throw new Error("Kode OTP tidak valid");

  const now = new Date();
  const tsForSign = tsGmt7WithoutColon(now);
  const tsHeader = tsGmt7WithoutColon(new Date(now.getTime() - 5 * 60_000));
  const signature = await makeAxApiSignature(config, tsForSign, finalContact, code, contactType);

  const body = new URLSearchParams({
    contactType,
    code,
    grant_type: "password",
    contact: finalContact,
    scope: "openid",
  });

  const response = await fetch(`${config.baseCiamUrl}/realms/xl-ciam/protocol/openid-connect/token`, {
    method: "POST",
    headers: {
      "Accept-Encoding": "gzip, deflate, br",
      Authorization: `Basic ${config.basicAuth}`,
      "Ax-Api-Signature": signature,
      "Ax-Request-At": tsHeader,
      "Ax-Request-Id": crypto.randomUUID(),
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": config.userAgent,
      ...(await deviceHeaders(config)),
    },
    body,
  });
  const raw = await response.json() as Record<string, unknown>;
  if (!response.ok || raw.error) throw new Error(JSON.stringify(raw));
  return raw as unknown as Tokens;
}

async function extendSession(config: AppConfig, subscriberId: string): Promise<string | null> {
  const url = new URL(`${config.baseCiamUrl}/realms/xl-ciam/auth/extend-session`);
  url.searchParams.set("contact", base64Encode(subscriberId));
  url.searchParams.set("contactType", "DEVICEID");
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${config.basicAuth}`,
      "Ax-Request-At": javaLikeTimestamp(),
      "Ax-Request-Id": crypto.randomUUID(),
      "Content-Type": "application/json",
      "User-Agent": config.userAgent,
      ...(await deviceHeaders(config)),
    },
  });
  if (!response.ok) return null;
  const data = await response.json() as { data?: { exchange_code?: string } };
  return data?.data?.exchange_code || null;
}

export async function refreshToken(
  config: AppConfig,
  refreshTokenValue: string,
  subscriberId = "",
): Promise<Tokens> {
  const response = await fetch(`${config.baseCiamUrl}/realms/xl-ciam/protocol/openid-connect/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${config.basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": config.userAgent,
      "Ax-Request-At": tsGmt7WithoutColon(),
      "Ax-Request-Id": crypto.randomUUID(),
      ...(await deviceHeaders(config)),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshTokenValue,
    }),
  });
  const raw = await response.json() as Record<string, unknown>;
  if (response.status === 400 && raw.error_description === "Session not active" && subscriberId) {
    const exchange = await extendSession(config, subscriberId);
    if (!exchange) throw new Error("Gagal extend session");
    return submitOtp(config, "DEVICEID", subscriberId, exchange);
  }
  if (!response.ok || raw.error) throw new Error(JSON.stringify(raw));
  return raw as unknown as Tokens;
}

export async function getProfile(config: AppConfig, tokens: Tokens): Promise<Record<string, unknown>> {
  const res = await sendApiRequest(config, "api/v8/profile", {
    access_token: tokens.access_token,
    app_version: config.appVersion,
    is_enterprise: false,
    lang: "en",
  }, tokens.id_token);
  return (res as { data?: Record<string, unknown> }).data || {};
}
