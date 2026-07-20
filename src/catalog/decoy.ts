import customBalance from "../data/decoy-custom-balance.json";
import defaultBalance from "../data/decoy-default-balance.json";
import defaultQris from "../data/decoy-default-qris.json";
import defaultQris0 from "../data/decoy-default-qris0.json";
import prioBalance from "../data/decoy-prio-balance.json";
import prioQris from "../data/decoy-prio-qris.json";
import prioQris0 from "../data/decoy-prio-qris0.json";
import { getPackageDetails } from "../client/packages";
import { getCustomDecoy, getDecoyCache, setDecoyCache } from "../store";
import type { AppConfig, Env, Tokens } from "../types";

type DecoyCatalog = {
  family_code: string;
  variant_code: string;
  order: number;
  is_enterprise: boolean;
  migration_type: string;
  price: number;
  option_name?: string;
  family_name?: string;
};

const CATALOGS: Record<string, DecoyCatalog> = {
  "default-balance": defaultBalance as DecoyCatalog,
  "custom-balance": customBalance as DecoyCatalog,
  "default-qris": defaultQris as DecoyCatalog,
  "default-qris0": defaultQris0 as DecoyCatalog,
  "prio-balance": prioBalance as DecoyCatalog,
  "prio-qris": prioQris as DecoyCatalog,
  "prio-qris0": prioQris0 as DecoyCatalog,
};

const PRIO_TYPES = new Set(["PRIORITAS", "PRIOHYBRID", "GO"]);

export function resolveDecoyName(paymentType: string, subscriptionType: string | null, custom = false): string {
  if (custom && paymentType === "balance") return "custom-balance";
  const prefix = PRIO_TYPES.has((subscriptionType || "").toUpperCase()) ? "prio-" : "default-";
  return `${prefix}${paymentType}`;
}

export async function getDecoy(
  env: Env,
  config: AppConfig,
  tokens: Tokens,
  number: string,
  paymentType: string,
  subscriptionType: string | null,
  custom = false,
  clientId = "",
): Promise<{ name: string; option_code: string; price: number }> {
  const name = resolveDecoyName(paymentType, subscriptionType, custom);
  const cached = await getDecoyCache(env, number, name);
  const now = Math.floor(Date.now() / 1000);
  if (cached && now - cached.last_fetched_at < 300 && cached.option_code) {
    return { name, option_code: cached.option_code, price: cached.price };
  }

  // Custom decoy: the definition is set per-user and stored in D1, not read
  // from the static JSON catalogs. Fall back to the static catalog only if the
  // user hasn't configured one yet.
  let params: { family_code: string; variant_code: string; order: number; is_enterprise: boolean; migration_type: string; price: number } | null = null;
  if (custom && clientId) {
    const saved = await getCustomDecoy(env, clientId, paymentType);
    if (saved) {
      params = {
        family_code: saved.family_code,
        variant_code: saved.variant_code,
        order: saved.option_order,
        is_enterprise: !!saved.is_enterprise,
        migration_type: saved.migration_type || "NONE",
        price: saved.price,
      };
    }
  }
  if (!params) {
    const catalog = CATALOGS[name];
    if (!catalog) throw new Error(`Decoy catalog tidak ditemukan: ${name}`);
    if (custom && clientId) {
      throw new Error("Custom decoy belum diatur. Set dulu di menu Decoy Custom.");
    }
    params = {
      family_code: catalog.family_code,
      variant_code: catalog.variant_code,
      order: catalog.order,
      is_enterprise: catalog.is_enterprise,
      migration_type: catalog.migration_type,
      price: catalog.price,
    };
  }

  const detail = await getPackageDetails(
    config,
    tokens,
    params.family_code,
    params.variant_code,
    params.order,
    params.is_enterprise,
    params.migration_type,
  );
  const optionCode = (detail?.package_option as { package_option_code?: string } | undefined)?.package_option_code;
  if (!optionCode) throw new Error(`Gagal resolve decoy option untuk ${name}`);

  await setDecoyCache(env, number, name, optionCode, params.price);
  return { name, option_code: optionCode, price: params.price };
}
