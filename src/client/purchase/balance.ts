import { buildEncryptedField } from "../../crypto";
import type { AppConfig, PaymentItem, Tokens } from "../../types";
import { sendSignedPaymentRequest, signPayment } from "../api";
import { paymentTargets, preparePayment, resolveAmount } from "./common";

export async function settlementBalance(
  config: AppConfig,
  tokens: Tokens,
  items: PaymentItem[],
  paymentFor: string,
  overwriteAmount: number | null = null,
  tokenConfirmationIdx = 0,
  amountIdx = -1,
  topupNumber = "",
  stageToken = "",
): Promise<unknown> {
  const amount = resolveAmount(items, overwriteAmount, amountIdx);
  const prepared = await preparePayment(config, tokens, items, tokenConfirmationIdx);
  const path = "payments/api/v8/settlement-multipayment";
  const targets = paymentTargets(items);

  const payload: Record<string, unknown> = {
    total_discount: 0,
    is_enterprise: false,
    payment_token: "",
    token_payment: prepared.tokenPayment,
    activated_autobuy_code: "",
    cc_payment_type: "",
    is_myxl_wallet: false,
    pin: "",
    ewallet_promo_id: "",
    members: [],
    total_fee: 0,
    fingerprint: "",
    autobuy_threshold_setting: { label: "", type: "", value: 0 },
    is_use_point: false,
    lang: "en",
    payment_method: "BALANCE",
    timestamp: prepared.tsToSign,
    points_gained: 0,
    can_trigger_rating: false,
    akrab_members: [],
    akrab_parent_alias: "",
    referral_unique_code: "",
    coupon: "",
    payment_for: paymentFor,
    with_upsell: false,
    topup_number: topupNumber,
    stage_token: stageToken,
    authentication_id: "",
    encrypted_payment_token: await buildEncryptedField(config, true),
    token: "",
    token_confirmation: "",
    access_token: tokens.access_token,
    wallet_number: "",
    encrypted_authentication_id: await buildEncryptedField(config, true),
    additional_data: {
      original_price: items[items.length - 1]?.item_price || 0,
      is_spend_limit_temporary: false,
      migration_type: "",
      akrab_m2m_group_id: "false",
      spend_limit_amount: 0,
      is_spend_limit: false,
      mission_id: "",
      tax: 0,
      quota_bonus: 0,
      cashtag: "",
      is_family_plan: false,
      combo_details: [],
      is_switch_plan: false,
      discount_recurring: 0,
      is_akrab_m2m: false,
      balance_type: "PREPAID_BALANCE",
      has_bonus: false,
      discount_promo: 0,
    },
    total_amount: amount,
    is_using_autobuy: false,
    items,
  };

  const signature = await signPayment(
    config,
    tokens,
    path,
    targets,
    prepared.tokenPayment,
    "BALANCE",
    paymentFor,
    prepared.tsToSign,
  );

  return sendSignedPaymentRequest(config, tokens, path, payload, signature, prepared.tsToSign);
}
