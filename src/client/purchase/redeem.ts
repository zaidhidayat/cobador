import { buildEncryptedField } from "../../crypto";
import type { AppConfig, Tokens } from "../../types";
import { sendSignedPaymentRequest, signBounty, signBountyAllotment, signLoyalty } from "../api";

export async function settlementBounty(
  config: AppConfig,
  tokens: Tokens,
  tokenConfirmation: string,
  tsToSign: number,
  paymentTarget: string,
  price: number,
  itemName = "",
): Promise<unknown> {
  const path = "api/v8/personalization/bounties-exchange";
  const payload: Record<string, unknown> = {
    total_discount: 0,
    is_enterprise: false,
    payment_token: "",
    token_payment: "",
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
    timestamp: tsToSign,
    points_gained: 0,
    can_trigger_rating: false,
    akrab_members: [],
    akrab_parent_alias: "",
    referral_unique_code: "",
    coupon: "",
    payment_for: "REDEEM_VOUCHER",
    with_upsell: false,
    topup_number: "",
    stage_token: "",
    authentication_id: "",
    encrypted_payment_token: await buildEncryptedField(config, true),
    token: "",
    token_confirmation: tokenConfirmation,
    access_token: tokens.access_token,
    wallet_number: "",
    encrypted_authentication_id: await buildEncryptedField(config, true),
    additional_data: {
      original_price: 0,
      is_spend_limit_temporary: false,
      migration_type: "",
      akrab_m2m_group_id: "",
      spend_limit_amount: 0,
      is_spend_limit: false,
      mission_id: "",
      tax: 0,
      benefit_type: "",
      quota_bonus: 0,
      cashtag: "",
      is_family_plan: false,
      combo_details: [],
      is_switch_plan: false,
      discount_recurring: 0,
      is_akrab_m2m: false,
      balance_type: "",
      has_bonus: false,
      discount_promo: 0,
    },
    total_amount: 0,
    is_using_autobuy: false,
    items: [{
      item_code: paymentTarget,
      product_type: "",
      item_price: price,
      item_name: itemName,
      tax: 0,
    }],
  };

  const signature = await signBounty(config, tokens, paymentTarget, tokenConfirmation, tsToSign);
  return sendSignedPaymentRequest(config, tokens, path, payload, signature, tsToSign);
}

export async function settlementLoyalty(
  config: AppConfig,
  tokens: Tokens,
  tokenConfirmation: string,
  tsToSign: number,
  paymentTarget: string,
  price: number,
): Promise<unknown> {
  const path = "gamification/api/v8/loyalties/tiering/exchange";
  const payload: Record<string, unknown> = {
    item_code: paymentTarget,
    amount: 0,
    partner: "",
    is_enterprise: false,
    item_name: "",
    lang: "en",
    points: price,
    timestamp: tsToSign,
    token_confirmation: tokenConfirmation,
  };
  const signature = await signLoyalty(config, paymentTarget, tokenConfirmation, path, tsToSign);
  return sendSignedPaymentRequest(config, tokens, path, payload, signature, tsToSign);
}

export async function bountyAllotment(
  config: AppConfig,
  tokens: Tokens,
  tsToSign: number,
  destinationMsisdn: string,
  itemName: string,
  itemCode: string,
  tokenConfirmation: string,
): Promise<unknown> {
  const path = "gamification/api/v8/loyalties/tiering/bounties-allotment";
  const payload: Record<string, unknown> = {
    destination_msisdn: destinationMsisdn,
    item_code: itemCode,
    is_enterprise: false,
    item_name: itemName,
    lang: "en",
    timestamp: tsToSign,
    token_confirmation: tokenConfirmation,
  };
  const signature = await signBountyAllotment(
    config,
    itemCode,
    tokenConfirmation,
    path,
    destinationMsisdn,
    tsToSign,
  );
  return sendSignedPaymentRequest(config, tokens, path, payload, signature, tsToSign);
}
