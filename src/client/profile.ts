import type { AppConfig, Tokens } from "../types";
import { sendApiRequest } from "./api";

export async function getTransactionHistory(config: AppConfig, tokens: Tokens): Promise<unknown> {
  const res = await sendApiRequest(config, "payments/api/v8/transaction-history", {
    is_enterprise: false,
    lang: "en",
  }, tokens.id_token);
  return (res as { data?: unknown }).data || res;
}

export async function getDashboardSegments(config: AppConfig, tokens: Tokens): Promise<unknown> {
  return sendApiRequest(config, "dashboard/api/v8/segments", {
    access_token: tokens.access_token,
  }, tokens.id_token);
}

export async function getNotificationDetail(
  config: AppConfig,
  tokens: Tokens,
  notificationId: string,
): Promise<unknown> {
  return sendApiRequest(config, "api/v8/notification/detail", {
    is_enterprise: false,
    lang: "en",
    notification_id: notificationId,
  }, tokens.id_token);
}
