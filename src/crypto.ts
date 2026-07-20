import type { AppConfig } from "./types";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const PAYMENT_SALT = "#ae-hei_9Tee6he+Ik3Gais5=";

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64Url(bytes: Uint8Array): string {
  // Python uses base64.urlsafe_b64encode which KEEPS the "=" padding. The
  // server's Go base64 decoder rejects unpadded urlsafe input ("illegal base64
  // data at input byte N"), so we must not strip the padding here.
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_");
}

async function aesCbcKey(rawKey: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", textEncoder.encode(rawKey), "AES-CBC", false, ["encrypt", "decrypt"]);
}

async function hmac(key: string, message: string, hash: "SHA-256" | "SHA-512"): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(key),
    { name: "HMAC", hash },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, textEncoder.encode(message)));
}

async function sha256Hex(input: string): Promise<string> {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", textEncoder.encode(input))));
}

export async function deriveIv(xtimeMs: number): Promise<Uint8Array> {
  const hex = await sha256Hex(String(xtimeMs));
  return textEncoder.encode(hex.slice(0, 16));
}

// NOTE: WebCrypto's AES-CBC applies/removes PKCS7 padding automatically (it is
// mandatory in the spec and cannot be disabled). So we must NOT pad/unpad
// manually here — doing so double-pads on encrypt and throws "Invalid PKCS7
// padding" on decrypt. The Python CLI pads manually only because pycryptodome's
// raw AES does not; the semantics still match (single PKCS7 padding).
export async function encryptXdata(config: AppConfig, plaintext: string, xtimeMs: number): Promise<string> {
  const key = await aesCbcKey(config.xdataKey);
  const iv = await deriveIv(xtimeMs);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, textEncoder.encode(plaintext)));
  return base64Url(encrypted);
}

export async function decryptXdata(config: AppConfig, xdata: string, xtimeMs: number): Promise<string> {
  const key = await aesCbcKey(config.xdataKey);
  const iv = await deriveIv(xtimeMs);
  const decrypted = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, base64ToBytes(xdata)));
  return textDecoder.decode(decrypted);
}

export async function makeXSignature(
  config: AppConfig,
  idToken: string,
  method: string,
  path: string,
  sigTimeSec: number,
): Promise<string> {
  const key = `${config.xApiBaseSecret};${idToken};${method};${path};${sigTimeSec}`;
  const message = `${idToken};${sigTimeSec};`;
  return bytesToHex(await hmac(key, message, "SHA-512"));
}

export async function makeAxApiSignature(
  config: AppConfig,
  tsForSign: string,
  contact: string,
  code: string,
  contactType: string,
): Promise<string> {
  const preimage = `${tsForSign}password${contactType}${contact}${code}openid`;
  return bytesToBase64(await hmac(config.axApiSigKey, preimage, "SHA-256"));
}

export async function makeXSignaturePayment(
  config: AppConfig,
  accessToken: string,
  sigTimeSec: number,
  packageCode: string,
  tokenPayment: string,
  paymentMethod: string,
  paymentFor: string,
  path: string,
): Promise<string> {
  const key = `${config.xApiBaseSecret};${sigTimeSec}${PAYMENT_SALT};POST;${path};${sigTimeSec}`;
  const message = `${accessToken};${tokenPayment};${sigTimeSec};${paymentFor};${paymentMethod};${packageCode};`;
  return bytesToHex(await hmac(key, message, "SHA-512"));
}

export async function makeXSignatureBounty(
  config: AppConfig,
  accessToken: string,
  sigTimeSec: number,
  packageCode: string,
  tokenPayment: string,
): Promise<string> {
  const path = "api/v8/personalization/bounties-exchange";
  const key = `${config.xApiBaseSecret};${accessToken};${sigTimeSec}${PAYMENT_SALT};POST;${path};${sigTimeSec}`;
  const message = `${accessToken};${tokenPayment};${sigTimeSec};${packageCode};`;
  return bytesToHex(await hmac(key, message, "SHA-512"));
}

export async function makeXSignatureLoyalty(
  config: AppConfig,
  sigTimeSec: number,
  packageCode: string,
  tokenConfirmation: string,
  path: string,
): Promise<string> {
  const key = `${config.xApiBaseSecret};${sigTimeSec}${PAYMENT_SALT};POST;${path};${sigTimeSec}`;
  const message = `${tokenConfirmation};${sigTimeSec};${packageCode};`;
  return bytesToHex(await hmac(key, message, "SHA-512"));
}

export async function makeXSignatureBountyAllotment(
  config: AppConfig,
  sigTimeSec: number,
  packageCode: string,
  tokenConfirmation: string,
  path: string,
  destinationMsisdn: string,
): Promise<string> {
  const key = `${config.xApiBaseSecret};${sigTimeSec}${PAYMENT_SALT};${destinationMsisdn};POST;${path};${sigTimeSec}`;
  const message = `${tokenConfirmation};${sigTimeSec};${destinationMsisdn};${packageCode};`;
  return bytesToHex(await hmac(key, message, "SHA-512"));
}

export async function buildEncryptedField(config: AppConfig, urlsafe = false): Promise<string> {
  const key = await aesCbcKey(config.encryptedFieldKey);
  const ivHex = bytesToHex(crypto.getRandomValues(new Uint8Array(8)));
  const iv = textEncoder.encode(ivHex);
  // Empty plaintext; WebCrypto auto-pads to one 0x10 block (matches Python pad(b"")).
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, new Uint8Array(0)));
  return (urlsafe ? base64Url(encrypted) : bytesToBase64(encrypted)) + ivHex;
}

export async function encryptCircleMsisdn(config: AppConfig, msisdn: string): Promise<string> {
  const key = await aesCbcKey(config.encryptedFieldKey);
  const ivHex = bytesToHex(crypto.getRandomValues(new Uint8Array(8)));
  const iv = textEncoder.encode(ivHex);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, textEncoder.encode(msisdn)),
  );
  return base64Url(encrypted) + ivHex;
}

export async function decryptCircleMsisdn(config: AppConfig, encryptedMsisdnB64: string): Promise<string> {
  try {
    const ivAscii = encryptedMsisdnB64.slice(-16);
    const b64Part = encryptedMsisdnB64.slice(0, -16);
    const key = await aesCbcKey(config.encryptedFieldKey);
    const iv = textEncoder.encode(ivAscii);
    const decrypted = new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, base64ToBytes(b64Part)),
    );
    return textDecoder.decode(decrypted);
  } catch {
    return "";
  }
}

export async function encryptSignXdata(
  config: AppConfig,
  method: string,
  path: string,
  idToken: string,
  payload: Record<string, unknown>,
): Promise<{ xSignature: string; encryptedBody: { xdata: string; xtime: number } }> {
  const plainBody = JSON.stringify(payload);
  const xtime = Date.now();
  const xdata = await encryptXdata(config, plainBody, xtime);
  const sigTimeSec = Math.floor(xtime / 1000);
  const xSignature = await makeXSignature(config, idToken, method, path, sigTimeSec);
  return { xSignature, encryptedBody: { xdata, xtime } };
}

export async function decryptEncryptedBody(config: AppConfig, body: unknown): Promise<unknown> {
  if (!body || typeof body !== "object" || !("xdata" in body) || !("xtime" in body)) {
    throw new Error("Invalid encrypted body");
  }
  const encrypted = body as { xdata: string; xtime: number };
  return JSON.parse(await decryptXdata(config, encrypted.xdata, Number(encrypted.xtime)));
}

// Device fingerprint. The server stores the fingerprint sent on request-otp and
// rejects submit-otp if it differs ("ax fingerprint not match"). Cloudflare
// Workers isolates are recycled between requests, so an in-memory value is not
// stable. Mirroring the Python CLI (which persists one fingerprint to `ax.fp`
// and reuses it), we generate ONCE and persist to D1, then reuse forever.
// `axFingerprint` just encrypts whatever plaintext it is given; generation of a
// fresh random device happens in `generateFingerprintPlain` at first use.
export function generateFingerprintPlain(): string {
  const rand = () => 1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000);
  return `samsung${rand()}|SM-N93${rand()}|en|720x1540|GMT07:00|192.169.69.69|1.0|Android 13|6281398370564`;
}

export async function axFingerprint(config: AppConfig, plain = generateFingerprintPlain()): Promise<string> {
  const key = await aesCbcKey(config.axFpKey);
  const iv = new Uint8Array(16);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, textEncoder.encode(plain)),
  );
  return bytesToBase64(encrypted);
}

export async function axDeviceId(fingerprint: string): Promise<string> {
  return md5Hex(textEncoder.encode(fingerprint));
}

export function base64Encode(input: string): string {
  return bytesToBase64(textEncoder.encode(input));
}

function md5Hex(input: Uint8Array): string {
  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const table = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
  const bytes = Array.from(input);
  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 0; i < 8; i++) bytes.push(Math.floor(bitLength / 2 ** (8 * i)) & 0xff);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const words = Array.from({ length: 16 }, (_, i) => {
      const j = offset + i * 4;
      return (bytes[j] | (bytes[j + 1] << 8) | (bytes[j + 2] << 16) | (bytes[j + 3] << 24)) >>> 0;
    });
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const temp = d;
      d = c;
      c = b;
      const sum = (a + f + table[i] + words[g]) >>> 0;
      b = (b + ((sum << shifts[i]) | (sum >>> (32 - shifts[i])))) >>> 0;
      a = temp;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return [a0, b0, c0, d0].map((word) => {
    return [0, 8, 16, 24].map((shift) => ((word >>> shift) & 0xff).toString(16).padStart(2, "0")).join("");
  }).join("");
}
