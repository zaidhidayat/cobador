import type { AppConfig, Tokens } from "../types";
import { sendApiRequest } from "./api";

export async function dukcapil(
  config: AppConfig,
  tokens: Tokens | null,
  msisdn: string,
  kk: string,
  nik: string,
): Promise<unknown> {
  return sendApiRequest(config, "api/v8/auth/regist/dukcapil", {
    msisdn,
    kk,
    nik,
    lang: "en",
  }, tokens?.id_token || "");
}
