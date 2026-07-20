import type { AppConfig, PaymentItem, Tokens } from "../../types";
import { sendApiRequest } from "../api";
import { interceptPage } from "../packages";

export async function getPaymentMethods(
  config: AppConfig,
  tokens: Tokens,
  tokenConfirmation: string,
  paymentTarget: string,
): Promise<Record<string, unknown>> {
  const res = await sendApiRequest(config, "payments/api/v8/payment-methods-option", {
    payment_type: "PURCHASE",
    is_enterprise: false,
    payment_target: paymentTarget,
    lang: "en",
    is_referral: false,
    token_confirmation: tokenConfirmation,
  }, tokens.id_token) as { status?: string; data?: Record<string, unknown> };

  if (res.status !== "SUCCESS" || !res.data) {
    throw new Error(`Gagal ambil payment methods: ${JSON.stringify(res)}`);
  }
  return res.data;
}

export function paymentTargets(items: PaymentItem[]): string {
  return items.map((item) => item.item_code).join(";");
}

export function resolveAmount(
  items: PaymentItem[],
  overwriteAmount: number | null | undefined,
  amountIdx = -1,
): number {
  if (typeof overwriteAmount === "number" && overwriteAmount >= 0) return overwriteAmount;
  if (amountIdx >= 0 && amountIdx < items.length) return items[amountIdx].item_price;
  return items.reduce((sum, item) => sum + (item.item_price || 0), 0);
}

export async function preparePayment(
  config: AppConfig,
  tokens: Tokens,
  items: PaymentItem[],
  tokenConfirmationIdx = 0,
): Promise<{ tokenPayment: string; tsToSign: number; tokenConfirmation: string }> {
  if (!items.length) throw new Error("Items kosong");
  const idx = Math.min(Math.max(tokenConfirmationIdx, 0), items.length - 1);
  await interceptPage(config, tokens, items[0].item_code, false);
  const methods = await getPaymentMethods(config, tokens, items[idx].token_confirmation, items[idx].item_code);
  return {
    tokenPayment: String(methods.token_payment || ""),
    tsToSign: Number(methods.timestamp || Math.floor(Date.now() / 1000)),
    tokenConfirmation: items[idx].token_confirmation,
  };
}
