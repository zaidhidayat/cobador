import type { Env } from "./types";

const encoder = new TextEncoder();
const PBKDF2_ITERATIONS = 100_000;

export interface User {
  id: string;
  username: string;
  username_lower: string;
  password_hash: string;
  password_salt: string;
  created_at: number;
  last_login_at: number | null;
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function derive(password: string, saltHex: string): Promise<string> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(saltHex), iterations: PBKDF2_ITERATIONS },
    baseKey,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

/** Constant-time string compare to avoid timing leaks on password verification. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function validateUsername(username: string): string | null {
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
    return "Username 3-32 karakter, hanya huruf/angka/._-";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (typeof password !== "string" || password.length < 6 || password.length > 128) {
    return "Password minimal 6 karakter";
  }
  return null;
}

export async function getUserByUsername(env: Env, username: string): Promise<User | null> {
  return env.DB.prepare("SELECT * FROM users WHERE username_lower = ?")
    .bind(username.toLowerCase())
    .first<User>();
}

export async function getUserById(env: Env, id: string): Promise<User | null> {
  return env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>();
}

export async function createUser(env: Env, username: string, password: string): Promise<User> {
  const existing = await getUserByUsername(env, username);
  if (existing) throw new Error("Username sudah dipakai");

  const id = crypto.randomUUID();
  const saltHex = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await derive(password, saltHex);

  await env.DB.prepare(`
    INSERT INTO users (id, username, username_lower, password_hash, password_salt, created_at)
    VALUES (?, ?, ?, ?, ?, unixepoch())
  `).bind(id, username, username.toLowerCase(), hash, saltHex).run();

  return {
    id,
    username,
    username_lower: username.toLowerCase(),
    password_hash: hash,
    password_salt: saltHex,
    created_at: Math.floor(Date.now() / 1000),
    last_login_at: null,
  };
}

export async function verifyUser(env: Env, username: string, password: string): Promise<User | null> {
  const user = await getUserByUsername(env, username);
  if (!user) {
    // Derive anyway to keep timing roughly constant against user enumeration.
    await derive(password, bytesToHex(new Uint8Array(16)));
    return null;
  }
  const hash = await derive(password, user.password_salt);
  if (!timingSafeEqual(hash, user.password_hash)) return null;
  await env.DB.prepare("UPDATE users SET last_login_at = unixepoch() WHERE id = ?").bind(user.id).run();
  return user;
}
