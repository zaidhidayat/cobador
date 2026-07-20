import { decryptCircleMsisdn, encryptCircleMsisdn } from "../crypto";
import type { AppConfig, Tokens } from "../types";
import { sendApiRequest } from "./api";

export async function getGroupData(config: AppConfig, tokens: Tokens): Promise<unknown> {
  return sendApiRequest(config, "family-hub/api/v8/groups/status", {
    is_enterprise: false,
    lang: "en",
  }, tokens.id_token);
}

export async function getGroupMembers(config: AppConfig, tokens: Tokens, groupId: string): Promise<unknown> {
  return sendApiRequest(config, "family-hub/api/v8/members/info", {
    group_id: groupId,
    is_enterprise: false,
    lang: "en",
  }, tokens.id_token);
}

export async function validateCircleMember(config: AppConfig, tokens: Tokens, msisdn: string): Promise<unknown> {
  return sendApiRequest(config, "family-hub/api/v8/members/validate", {
    msisdn: await encryptCircleMsisdn(config, msisdn),
    is_enterprise: false,
    lang: "en",
  }, tokens.id_token);
}

export async function inviteCircleMember(
  config: AppConfig,
  tokens: Tokens,
  msisdn: string,
  name: string,
  groupId: string,
  memberIdParent: string,
): Promise<unknown> {
  return sendApiRequest(config, "family-hub/api/v8/members/invite", {
    access_token: tokens.access_token,
    group_id: groupId,
    is_enterprise: false,
    members: [{ msisdn: await encryptCircleMsisdn(config, msisdn), name }],
    lang: "en",
    member_id_parent: memberIdParent,
  }, tokens.id_token);
}

export async function removeCircleMember(
  config: AppConfig,
  tokens: Tokens,
  memberId: string,
  groupId: string,
  memberIdParent: string,
  isLastMember = false,
): Promise<unknown> {
  return sendApiRequest(config, "family-hub/api/v8/members/remove", {
    member_id: memberId,
    group_id: groupId,
    is_enterprise: false,
    is_last_member: isLastMember,
    lang: "en",
    member_id_parent: memberIdParent,
  }, tokens.id_token);
}

export async function acceptCircleInvitation(
  config: AppConfig,
  tokens: Tokens,
  groupId: string,
  memberId: string,
): Promise<unknown> {
  return sendApiRequest(config, "family-hub/api/v8/groups/accept-invitation", {
    access_token: tokens.access_token,
    group_id: groupId,
    member_id: memberId,
    is_enterprise: false,
    lang: "en",
  }, tokens.id_token);
}

export async function createCircle(
  config: AppConfig,
  tokens: Tokens,
  parentName: string,
  groupName: string,
  memberMsisdn: string,
  memberName: string,
): Promise<unknown> {
  return sendApiRequest(config, "family-hub/api/v8/groups/create", {
    access_token: tokens.access_token,
    parent_name: parentName,
    group_name: groupName,
    is_enterprise: false,
    members: [{
      msisdn: await encryptCircleMsisdn(config, memberMsisdn),
      name: memberName,
    }],
    lang: "en",
  }, tokens.id_token);
}

export async function spendingTracker(
  config: AppConfig,
  tokens: Tokens,
  parentSubsId: string,
  familyId: string,
): Promise<unknown> {
  return sendApiRequest(config, "gamification/api/v8/family-hub/spending-tracker", {
    is_enterprise: false,
    parent_subs_id: parentSubsId,
    family_id: familyId,
    lang: "en",
  }, tokens.id_token);
}

export async function getBonusData(
  config: AppConfig,
  tokens: Tokens,
  parentSubsId: string,
  familyId: string,
): Promise<unknown> {
  return sendApiRequest(config, "gamification/api/v8/family-hub/bonus/list", {
    is_enterprise: false,
    parent_subs_id: parentSubsId,
    family_id: familyId,
    lang: "en",
  }, tokens.id_token);
}

export async function decryptMemberMsisdn(config: AppConfig, encrypted: string): Promise<string> {
  return decryptCircleMsisdn(config, encrypted);
}
