import type { AppConfig, Tokens } from "../types";
import { sendApiRequest } from "./api";

export async function getFamilyData(config: AppConfig, tokens: Tokens): Promise<unknown> {
  return sendApiRequest(config, "sharings/api/v8/family-plan/member-info", {
    group_id: 0,
    is_enterprise: false,
    lang: "en",
  }, tokens.id_token);
}

export async function validateMsisdn(config: AppConfig, tokens: Tokens, msisdn: string): Promise<unknown> {
  return sendApiRequest(config, "api/v8/auth/check-dukcapil", {
    with_bizon: true,
    with_family_plan: true,
    is_enterprise: false,
    with_optimus: true,
    lang: "en",
    msisdn,
    with_regist_status: true,
    with_enterprise: true,
  }, tokens.id_token);
}

export async function changeMember(
  config: AppConfig,
  tokens: Tokens,
  parentAlias: string,
  alias: string,
  slotId: number,
  familyMemberId: string,
  newMsisdn: string,
): Promise<unknown> {
  return sendApiRequest(config, "sharings/api/v8/family-plan/change-member", {
    parent_alias: parentAlias,
    is_enterprise: false,
    slot_id: slotId,
    alias,
    lang: "en",
    msisdn: newMsisdn,
    family_member_id: familyMemberId,
  }, tokens.id_token);
}

export async function removeMember(
  config: AppConfig,
  tokens: Tokens,
  familyMemberId: string,
): Promise<unknown> {
  return sendApiRequest(config, "sharings/api/v8/family-plan/remove-member", {
    is_enterprise: false,
    family_member_id: familyMemberId,
    lang: "en",
  }, tokens.id_token);
}

export async function setQuotaLimit(
  config: AppConfig,
  tokens: Tokens,
  originalAllocation: number,
  newAllocation: number,
  familyMemberId: string,
): Promise<unknown> {
  return sendApiRequest(config, "sharings/api/v8/family-plan/allocate-quota", {
    is_enterprise: false,
    member_allocations: [{
      new_text_allocation: 0,
      original_text_allocation: 0,
      original_voice_allocation: 0,
      original_allocation: originalAllocation,
      new_voice_allocation: 0,
      message: "",
      new_allocation: newAllocation,
      family_member_id: familyMemberId,
      status: "",
    }],
    lang: "en",
  }, tokens.id_token);
}
