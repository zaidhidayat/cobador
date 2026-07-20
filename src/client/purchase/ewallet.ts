import type { AppConfig, PaymentItem, Tokens } from "../../types";
import { sendSignedPaymentRequest, signPayment } from "../api";
import { paymentTargets, preparePayment, resolveAmount } from "./common";

export async function settlementEwallet(
  config: AppConfig,
  tokens: Tokens,
  items: PaymentItem[],
  paymentMethod: string,
  paymentFor: string,
  walletNumber = "",
  overwriteAmount: number | null = null,
  tokenConfirmationIdx = 0,
  amountIdx = -1,
): Promise<unknown> {
  const amount = resolveAmount(items, overwriteAmount, amountIdx);
  const prepared = await preparePayment(config, tokens, items, tokenConfirmationIdx);
  const path = "payments/api/v8/settlement-multipayment/ewallet";
  const targets = paymentTargets(items);

  const payload: Record<string, unknown> = {
    akrab: { akrab_members: [], akrab_parent_alias: "", members: [] },
    can_trigger_rating: false,
    total_discount: 0,
    coupon: "",
    payment_for: paymentFor,
    topup_number: "",
    is_enterprise: false,
    autobuy: {
      is_using_autobuy: false,
      activated_autobuy_code: "",
      autobuy_threshold_setting: { label: "", type: "", value: 0 },
    },
    cc_payment_type: "",
    access_token: tokens.access_token,
    is_myxl_wallet: false,
    wallet_number: walletNumber,
    additional_data: {},
    total_amount: amount,
    total_fee: 0,
    is_use_point: false,
    lang: "en",
    items,
    verification_token: prepared.tokenPayment,
    payment_method: paymentMethod,
    timestamp: prepared.tsToSign,
  };

  const signature = await signPayment(
    config,
    tokens,
    path,
    targets,
    prepared.tokenPayment,
    paymentMethod,
    paymentFor,
    prepared.tsToSign,
  );

  return sendSignedPaymentRequest(config, tokens, path, payload, signature, prepared.tsToSign);
}
