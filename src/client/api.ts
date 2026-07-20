import {
  decryptEncryptedBody,
  encryptSignXdata,
  makeXSignatureBounty,
  makeXSignatureBountyAllotment,
  makeXSignatureLoyalty,
  makeXSignaturePayment,
} from "../crypto";
import { javaLikeTimestamp } from "../time";
import type { AppConfig, Tokens } from "../types";

export async function sendApiRequest(
  config: AppConfig,
  path: string,
  payload: Record<string, unknown>,
  idToken: string,
  method = "POST",
): Promise<unknown> {
  const encrypted = await encryptSignXdata(config, method, path, idToken, payload);
  const xtime = encrypted.encryptedBody.xtime;
  const sigTimeSec = Math.floor(xtime / 1000);

  const response = await fetch(`${config.baseApiUrl}/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "User-Agent": config.userAgent,
      "x-api-key": config.apiKey,
      authorization: `Bearer ${idToken}`,
      "x-hv": "v3",
      "x-signature-time": String(sigTimeSec),
      "x-signature": encrypted.xSignature,
      "x-request-id": crypto.randomUUID(),
      "x-request-at": javaLikeTimestamp(),
      "x-version-app": config.appVersion,
    },
    body: JSON.stringify(encrypted.encryptedBody),
  });

  const raw = await response.json().catch(() => null);
  if (!raw) throw new Error(`Non-JSON response: ${response.status}`);
  return decryptEncryptedBody(config, raw);
}

export async function sendSignedPaymentRequest(
  config: AppConfig,
  tokens: Tokens,
  path: string,
  payload: Record<string, unknown>,
  paymentSignature: string,
  sigTimeSec: number,
): Promise<unknown> {
  const encrypted = await encryptSignXdata(config, "POST", path, tokens.id_token, payload);
  const response = await fetch(`${config.baseApiUrl}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "User-Agent": config.userAgent,
      "x-api-key": config.apiKey,
      authorization: `Bearer ${tokens.id_token}`,
      "x-hv": "v3",
      "x-signature-time": String(sigTimeSec),
      "x-signature": paymentSignature,
      "x-request-id": crypto.randomUUID(),
      "x-request-at": javaLikeTimestamp(new Date(sigTimeSec * 1000)),
      "x-version-app": config.appVersion,
    },
    body: JSON.stringify(encrypted.encryptedBody),
  });
  const raw = await response.json().catch(() => null);
  if (!raw) throw new Error(`Non-JSON response: ${response.status}`);
  return decryptEncryptedBody(config, raw);
}

export async function signPayment(
  config: AppConfig,
  tokens: Tokens,
  path: string,
  packageCode: string,
  tokenPayment: string,
  paymentMethod: string,
  paymentFor: string,
  tsToSign: number,
): Promise<string> {
  return makeXSignaturePayment(
    config,
    tokens.access_token,
    tsToSign,
    packageCode,
    tokenPayment,
    paymentMethod,
    paymentFor,
    path,
  );
}

export async function signBounty(
  config: AppConfig,
  tokens: Tokens,
  packageCode: string,
  tokenPayment: string,
  tsToSign: number,
): Promise<string> {
  return makeXSignatureBounty(config, tokens.access_token, tsToSign, packageCode, tokenPayment);
}

export async function signLoyalty(
  config: AppConfig,
  packageCode: string,
  tokenConfirmation: string,
  path: string,
  tsToSign: number,
): Promise<string> {
  return makeXSignatureLoyalty(config, tsToSign, packageCode, tokenConfirmation, path);
}

export async function signBountyAllotment(
  config: AppConfig,
  packageCode: string,
  tokenConfirmation: string,
  path: string,
  destinationMsisdn: string,
  tsToSign: number,
): Promise<string> {
  return makeXSignatureBountyAllotment(
    config,
    tsToSign,
    packageCode,
    tokenConfirmation,
    path,
    destinationMsisdn,
  );
}
