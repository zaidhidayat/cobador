import type { AppConfig, PaymentItem, Tokens } from "../../types";
import { sendApiRequest, sendSignedPaymentRequest, signPayment } from "../api";
import { paymentTargets, preparePayment, resolveAmount } from "./common";

export async function settlementQris(
  config: AppConfig,
  tokens: Tokens,
  items: PaymentItem[],
  paymentFor: string,
  overwriteAmount: number | null = null,
  tokenConfirmationIdx = 0,
  amountIdx = -1,
  topupNumber = "",
  stageToken = "",
): Promise<string> {
  const amount = resolveAmount(items, overwriteAmount, amountIdx);
  const prepared = await preparePayment(config, tokens, items, tokenConfirmationIdx);
  const path = "payments/api/v8/settlement-multipayment/qris";
  const targets = paymentTargets(items);

  const payload: Record<string, unknown> = {
    akrab: { akrab_members: [], akrab_parent_alias: "", members: [] },
    can_trigger_rating: false,
    total_discount: 0,
    coupon: "",
    payment_for: paymentFor,
    topup_number: topupNumber,
    stage_token: stageToken,
    is_enterprise: false,
    autobuy: {
      is_using_autobuy: false,
      activated_autobuy_code: "",
      autobuy_threshold_setting: { label: "", type: "", value: 0 },
    },
    access_token: tokens.access_token,
    is_myxl_wallet: false,
    additional_data: {
      original_price: items[0]?.item_price || 0,
      is_spend_limit_temporary: false,
      migration_type: "",
      spend_limit_amount: 0,
      is_spend_limit: false,
      tax: 0,
      benefit_type: "",
      quota_bonus: 0,
      cashtag: "",
      is_family_plan: false,
      combo_details: [],
      is_switch_plan: false,
      discount_recurring: 0,
      has_bonus: false,
      discount_promo: 0,
    },
    total_amount: amount,
    total_fee: 0,
    is_use_point: false,
    lang: "en",
    items,
    verification_token: prepared.tokenPayment,
    payment_method: "QRIS",
    timestamp: prepared.tsToSign,
  };

  const signature = await signPayment(
    config,
    tokens,
    path,
    targets,
    prepared.tokenPayment,
    "QRIS",
    paymentFor,
    prepared.tsToSign,
  );

  const res = await sendSignedPaymentRequest(config, tokens, path, payload, signature, prepared.tsToSign) as {
    status?: string;
    data?: { transaction_code?: string };
    message?: string;
  };
  if (res.status !== "SUCCESS" || !res.data?.transaction_code) {
    throw new Error(res.message || JSON.stringify(res));
  }
  return res.data.transaction_code;
}

export async function getQrisCode(config: AppConfig, tokens: Tokens, transactionId: string): Promise<string> {
  const res = await sendApiRequest(config, "payments/api/v8/pending-detail", {
    transaction_id: transactionId,
    is_enterprise: false,
    lang: "en",
    status: "",
  }, tokens.id_token) as { status?: string; data?: { qr_code?: string } };
  if (res.status !== "SUCCESS" || !res.data?.qr_code) {
    throw new Error(`Gagal ambil QRIS: ${JSON.stringify(res)}`);
  }
  return res.data.qr_code;
}
