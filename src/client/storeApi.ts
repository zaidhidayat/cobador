import type { AppConfig, Tokens } from "../types";
import { sendApiRequest } from "./api";

export async function getSegments(config: AppConfig, tokens: Tokens, isEnterprise = false): Promise<unknown> {
  return sendApiRequest(config, "api/v8/configs/store/segments", {
    is_enterprise: isEnterprise,
    lang: "en",
  }, tokens.id_token);
}

export async function getFamilyList(
  config: AppConfig,
  tokens: Tokens,
  subsType = "PREPAID",
  isEnterprise = false,
): Promise<unknown> {
  return sendApiRequest(config, "api/v8/xl-stores/options/search/family-list", {
    is_enterprise: isEnterprise,
    subs_type: subsType,
    lang: "en",
  }, tokens.id_token);
}

export async function getStorePackages(
  config: AppConfig,
  tokens: Tokens,
  subsType = "PREPAID",
  isEnterprise = false,
  textSearch = "",
): Promise<unknown> {
  return sendApiRequest(config, "api/v9/xl-stores/options/search", {
    is_enterprise: isEnterprise,
    filters: [
      { unit: "THOUSAND", id: "FIL_SEL_P", type: "PRICE", items: [] },
      { unit: "GB", id: "FIL_SEL_MQ", type: "DATA_TYPE", items: [] },
      {
        unit: "PACKAGE_NAME",
        id: "FIL_PKG_N",
        type: "PACKAGE_NAME",
        items: [{ id: "", label: "" }],
      },
      { unit: "DAY", id: "FIL_SEL_V", type: "VALIDITY", items: [] },
    ],
    substype: subsType,
    text_search: textSearch,
    lang: "en",
  }, tokens.id_token);
}

export async function getRedeemables(
  config: AppConfig,
  tokens: Tokens,
  isEnterprise = false,
): Promise<unknown> {
  return sendApiRequest(config, "api/v8/personalization/redeemables", {
    is_enterprise: isEnterprise,
    lang: "en",
  }, tokens.id_token);
}
