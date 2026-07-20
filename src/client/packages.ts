import type { AppConfig, Tokens } from "../types";
import { sendApiRequest } from "./api";

export async function getBalance(config: AppConfig, tokens: Tokens): Promise<unknown> {
  const res = await sendApiRequest(config, "api/v8/packages/balance-and-credit", {
    is_enterprise: false,
    lang: "en",
  }, tokens.id_token);
  return (res as { data?: { balance?: unknown } }).data?.balance || null;
}

export async function getTieringInfo(config: AppConfig, tokens: Tokens): Promise<Record<string, unknown>> {
  const res = await sendApiRequest(config, "gamification/api/v8/loyalties/tiering/info", {
    is_enterprise: false,
    lang: "en",
  }, tokens.id_token);
  return (res as { data?: Record<string, unknown> }).data || {};
}

export async function getMyPackages(config: AppConfig, tokens: Tokens): Promise<unknown> {
  const res = await sendApiRequest(config, "api/v8/packages/quota-details", {
    is_enterprise: false,
    lang: "en",
    family_member_id: "",
  }, tokens.id_token);
  return res;
}

export async function unsubscribePackage(
  config: AppConfig,
  tokens: Tokens,
  quotaCode: string,
  productDomain: string,
  productSubscriptionType: string,
): Promise<unknown> {
  return sendApiRequest(config, "api/v8/packages/unsubscribe", {
    product_subscription_type: productSubscriptionType,
    quota_code: quotaCode,
    product_domain: productDomain,
    is_enterprise: false,
    unsubscribe_reason_code: "",
    lang: "en",
    family_member_id: "",
  }, tokens.id_token);
}

export async function getFamily(
  config: AppConfig,
  tokens: Tokens,
  familyCode: string,
  isEnterprise: boolean | null = null,
  migrationType: string | null = null,
): Promise<unknown> {
  const enterpriseList = isEnterprise === null ? [false, true] : [isEnterprise];
  const migrationList = migrationType === null
    ? ["NONE", "PRE_TO_PRIOH", "PRIOH_TO_PRIO", "PRIO_TO_PRIO"]
    : [migrationType];

  for (const mt of migrationList) {
    for (const ie of enterpriseList) {
      const res = await sendApiRequest(config, "api/v8/xl-stores/options/list", {
        is_show_tagging_tab: true,
        is_dedicated_event: true,
        is_transaction_routine: false,
        migration_type: mt,
        package_family_code: familyCode,
        is_autobuy: false,
        is_enterprise: ie,
        is_pdlp: true,
        referral_code: "",
        is_migration: false,
        lang: "en",
      }, tokens.id_token) as { status?: string; data?: { package_family?: { name?: string } } };

      if (res?.status === "SUCCESS" && res.data?.package_family?.name) {
        return res.data;
      }
    }
  }
  return null;
}

export async function getPackageByOption(
  config: AppConfig,
  tokens: Tokens,
  optionCode: string,
  familyCode = "",
  variantCode = "",
): Promise<unknown> {
  const res = await sendApiRequest(config, "api/v8/xl-stores/options/detail", {
    is_transaction_routine: false,
    migration_type: "NONE",
    package_family_code: familyCode,
    family_role_hub: "",
    is_autobuy: false,
    is_enterprise: false,
    is_shareable: false,
    is_migration: false,
    lang: "en",
    package_option_code: optionCode,
    is_upsell_pdp: false,
    package_variant_code: variantCode,
  }, tokens.id_token);
  return (res as { data?: unknown }).data || res;
}

export async function getAddons(config: AppConfig, tokens: Tokens, optionCode: string): Promise<unknown> {
  const res = await sendApiRequest(config, "api/v8/xl-stores/options/addons-pinky-box", {
    is_enterprise: false,
    lang: "en",
    package_option_code: optionCode,
  }, tokens.id_token);
  return (res as { data?: unknown }).data || res;
}

export async function getPackageDetails(
  config: AppConfig,
  tokens: Tokens,
  familyCode: string,
  variantCode: string,
  optionOrder: number,
  isEnterprise: boolean | null = null,
  migrationType: string | null = null,
): Promise<Record<string, unknown> | null> {
  const familyData = await getFamily(config, tokens, familyCode, isEnterprise, migrationType) as {
    package_variants?: Array<{
      package_variant_code: string;
      package_options?: Array<{ order: number; package_option_code: string }>;
    }>;
  } | null;
  if (!familyData) return null;

  let optionCode: string | null = null;
  for (const variant of familyData.package_variants || []) {
    if (variant.package_variant_code !== variantCode) continue;
    for (const option of variant.package_options || []) {
      if (option.order === optionOrder) {
        optionCode = option.package_option_code;
        break;
      }
    }
  }
  if (!optionCode) return null;
  return (await getPackageByOption(config, tokens, optionCode)) as Record<string, unknown> | null;
}

export async function interceptPage(
  config: AppConfig,
  tokens: Tokens,
  optionCode: string,
  isEnterprise = false,
): Promise<void> {
  await sendApiRequest(config, "misc/api/v8/utility/intercept-page", {
    is_enterprise: isEnterprise,
    lang: "en",
    package_option_code: optionCode,
  }, tokens.id_token);
}
