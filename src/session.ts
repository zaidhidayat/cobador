import type { AppConfig, ClientSession } from "./types";

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(config: AppConfig, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(config.sessionSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie") || "";
  const found = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null;
}

export async function createSessionCookie(
  config: AppConfig,
  session: { userId: string; username: string; activeNumber: string | null },
): Promise<string> {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({
    userId: session.userId,
    username: session.username,
    activeNumber: session.activeNumber,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  })));
  const signature = await sign(config, payload);
  return `app_session=${encodeURIComponent(`${payload}.${signature}`)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
}

export function clearSessionCookie(): string {
  return "app_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}

export async function getSession(config: AppConfig, request: Request): Promise<ClientSession | null> {
  const raw = getCookie(request, "app_session");
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  if (await sign(config, payload) !== signature) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as Partial<ClientSession>;
    if (!parsed.userId || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      userId: parsed.userId,
      clientId: parsed.userId,
      username: parsed.username || "",
      activeNumber: parsed.activeNumber || null,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}
