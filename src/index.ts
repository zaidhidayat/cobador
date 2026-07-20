import { getHot2Catalog, getHotCatalog } from "./catalog/hot";
import { getDecoy } from "./catalog/decoy";
import { requestOtp, submitOtp, getProfile } from "./client/ciam";
import {
  createCircle,
  decryptMemberMsisdn,
  getBonusData,
  getGroupData,
  getGroupMembers,
  inviteCircleMember,
  removeCircleMember,
  acceptCircleInvitation,
  spendingTracker,
  validateCircleMember,
} from "./client/circle";
import {
  changeMember,
  getFamilyData,
  removeMember,
  setQuotaLimit,
  validateMsisdn,
} from "./client/family";
import {
  getAddons,
  getBalance,
  getFamily,
  getMyPackages,
  getPackageByOption,
  getPackageDetails,
  getTieringInfo,
  unsubscribePackage,
} from "./client/packages";
import { getDashboardSegments, getNotificationDetail, getTransactionHistory } from "./client/profile";
import { settlementBalance } from "./client/purchase/balance";
import { settlementEwallet } from "./client/purchase/ewallet";
import { getQrisCode, settlementQris } from "./client/purchase/qris";
import { bountyAllotment, settlementBounty, settlementLoyalty } from "./client/purchase/redeem";
import { dukcapil } from "./client/registration";
import { getFamilyList, getRedeemables, getSegments, getStorePackages } from "./client/storeApi";
import { loadConfig } from "./config";
import { badRequest, jsonResponse, notFound, readJson, unauthorized, withCookies } from "./http";
import {
  clearSessionCookie,
  createSessionCookie,
  getSession,
} from "./session";
import {
  createUser,
  validatePassword,
  validateUsername,
  verifyUser,
} from "./auth";
import {
  audit,
  deleteClientAccount,
  ensureClient,
  getCustomDecoy,
  listAccounts,
  requireActiveContext,
  saveClientAccount,
  setActiveNumber,
  setCustomDecoy,
} from "./store";
import type { Env, PaymentItem } from "./types";
import { renderApp } from "./ui";

interface OtpBody { contact?: string; code?: string }
interface SwitchBody { number?: string }
interface BookmarkBody {
  family_code?: string;
  family_name?: string;
  is_enterprise?: boolean;
  variant_name?: string;
  option_name?: string;
  option_order?: number;
}
interface PurchaseBody {
  confirm?: boolean;
  payment_for?: string;
  items?: PaymentItem[];
  overwrite_amount?: number | null;
  token_confirmation_idx?: number;
  amount_idx?: number;
  wallet_number?: string;
  payment_method?: string;
  use_decoy?: boolean;
  decoy_type?: string;
  custom_decoy?: boolean;
  times?: number;
  option_code?: string;
  family_code?: string;
  variant_code?: string;
  option_order?: number;
  is_enterprise?: boolean | null;
  migration_type?: string | null;
  token_confirmation?: string;
  ts_to_sign?: number;
  payment_target?: string;
  price?: number;
  item_name?: string;
  destination_msisdn?: string;
}

function asBool(value: string | null): boolean {
  return value === "1" || value === "true" || value === "y";
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const config = await loadConfig(env);
  let session = await getSession(config, request);
  const cookies: string[] = [];

  const respond = (data: unknown, init: ResponseInit = {}) => withCookies(jsonResponse(data, init), cookies);

  // Require a logged-in application user (browser account) for this session.
  const requireUser = () => {
    if (!session) throw new Error("Silakan login atau daftar dulu.");
    return session;
  };
  // Require both a logged-in user AND an active MyXL account with fresh tokens.
  const requireAuth = async () => {
    const user = requireUser();
    return requireActiveContext(env, config, user);
  };

  // ---- Browser account: register & login ----
  if (url.pathname === "/api/account/register" && request.method === "POST") {
    const body = await readJson<{ username?: string; password?: string }>(request);
    const username = (body.username || "").trim();
    const usernameErr = validateUsername(username);
    if (usernameErr) return badRequest(usernameErr);
    const passwordErr = validatePassword(body.password || "");
    if (passwordErr) return badRequest(passwordErr);
    let user;
    try {
      user = await createUser(env, username, body.password as string);
    } catch (e) {
      return badRequest(e instanceof Error ? e.message : "Gagal daftar");
    }
    await ensureClient(env, user.id, null);
    session = { userId: user.id, clientId: user.id, username: user.username, activeNumber: null, exp: 0 };
    cookies.push(await createSessionCookie(config, { userId: user.id, username: user.username, activeNumber: null }));
    await audit(env, null, "user_register", { username: user.username });
    return respond({ ok: true, username: user.username });
  }

  if (url.pathname === "/api/account/login" && request.method === "POST") {
    const body = await readJson<{ username?: string; password?: string }>(request);
    if (!body.username || !body.password) return badRequest("username dan password wajib");
    const user = await verifyUser(env, body.username.trim(), body.password);
    if (!user) return unauthorized("Username atau password salah");
    await ensureClient(env, user.id, null);
    const accounts = await listAccounts(env, user.id);
    const active = accounts.find((a) => a.number)?.number || null;
    session = { userId: user.id, clientId: user.id, username: user.username, activeNumber: active, exp: 0 };
    cookies.push(await createSessionCookie(config, { userId: user.id, username: user.username, activeNumber: active }));
    if (active) await setActiveNumber(env, user.id, active);
    await audit(env, null, "user_login", { username: user.username });
    return respond({ ok: true, username: user.username, number: active });
  }

  if (url.pathname === "/api/account/logout" && request.method === "POST") {
    cookies.push(clearSessionCookie());
    return respond({ ok: true });
  }

  if (url.pathname === "/api/account/me" && request.method === "GET") {
    return respond({ ok: true, authenticated: !!session, username: session?.username || null });
  }

  // From here on, every endpoint requires a logged-in browser account.
  if (url.pathname.startsWith("/api/") && !session) {
    return respond({ ok: false, error: "Silakan login atau daftar dulu." }, { status: 401 });
  }

  // ---- MyXL Auth (OTP) ----
  if (url.pathname === "/api/auth/request-otp" && request.method === "POST") {
    const body = await readJson<OtpBody>(request);
    if (!body.contact) return badRequest("contact wajib diisi");
    const result = await requestOtp(config, body.contact);
    await audit(env, body.contact, "request_otp");
    return respond({ ok: true, subscriber_id: result.subscriber_id, raw: result.raw });
  }

  if (url.pathname === "/api/auth/submit-otp" && request.method === "POST") {
    const user = requireUser();
    const body = await readJson<OtpBody>(request);
    if (!body.contact || !body.code) return badRequest("contact dan code wajib diisi");
    const tokens = await submitOtp(config, "SMS", body.contact, body.code);
    const profile = await getProfile(config, tokens).catch(() => undefined);
    await saveClientAccount(env, user.clientId, body.contact, tokens, profile);
    session = { ...user, activeNumber: body.contact };
    cookies.push(await createSessionCookie(config, { userId: user.userId, username: user.username, activeNumber: body.contact }));
    await audit(env, body.contact, "submit_otp");
    return respond({ ok: true, number: body.contact });
  }

  if (url.pathname === "/api/logout" && request.method === "POST") {
    return respond({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } });
  }

  if (url.pathname === "/api/me" && request.method === "GET") {
    const user = requireUser();
    const accounts = await listAccounts(env, user.clientId);
    return respond({
      ok: true,
      clientId: user.clientId,
      username: user.username,
      number: user.activeNumber,
      accounts: accounts.map((a) => ({
        number: a.number,
        subscriber_id: a.subscriber_id,
        subscription_type: a.subscription_type,
        active: a.number === user.activeNumber,
      })),
    });
  }

  // ---- Accounts ----
  if (url.pathname === "/api/accounts" && request.method === "GET") {
    const user = requireUser();
    const accounts = await listAccounts(env, user.clientId);
    return respond({
      ok: true,
      activeNumber: user.activeNumber,
      accounts: accounts.map((a) => ({
        number: a.number,
        subscriber_id: a.subscriber_id,
        subscription_type: a.subscription_type,
        active: a.number === user.activeNumber,
      })),
    });
  }

  if (url.pathname === "/api/accounts/switch" && request.method === "POST") {
    const user = requireUser();
    const body = await readJson<SwitchBody>(request);
    if (!body.number) return badRequest("number wajib");
    const accounts = await listAccounts(env, user.clientId);
    if (!accounts.some((a) => a.number === body.number)) return badRequest("Akun tidak ditemukan di sesi ini");
    await setActiveNumber(env, user.clientId, body.number);
    session = { ...user, activeNumber: body.number };
    cookies.push(await createSessionCookie(config, { userId: user.userId, username: user.username, activeNumber: body.number }));
    await audit(env, body.number, "switch_account");
    return respond({ ok: true, number: body.number });
  }

  if (url.pathname.startsWith("/api/accounts/") && request.method === "DELETE") {
    const user = requireUser();
    const number = decodeURIComponent(url.pathname.split("/").pop() || "");
    if (!number) return badRequest("number wajib");
    if (user.activeNumber === number) return badRequest("Tidak bisa hapus akun aktif. Ganti dulu.");
    const removed = await deleteClientAccount(env, user.clientId, number);
    await audit(env, number, "delete_account", { removed });
    return respond({ ok: true, removed });
  }

  // ---- Dashboard ----
  if (url.pathname === "/api/dashboard" && request.method === "GET") {
    const ctx = await requireAuth();
    const [profile, balance] = await Promise.all([
      getProfile(config, ctx.tokens),
      getBalance(config, ctx.tokens),
    ]);
    const profileRoot = (profile.profile || profile || {}) as Record<string, unknown>;
    let tiering: Record<string, unknown> = {};
    if (String(profileRoot.subscription_type || ctx.account.subscription_type || "") === "PREPAID") {
      tiering = await getTieringInfo(config, ctx.tokens).catch(() => ({}));
    }
    return respond({
      ok: true,
      number: ctx.number,
      subscriber_id: profileRoot.subscriber_id || ctx.account.subscriber_id,
      subscription_type: profileRoot.subscription_type || ctx.account.subscription_type,
      balance,
      tiering,
      profile,
    });
  }

  // ---- Packages ----
  if (url.pathname === "/api/packages/mine" && request.method === "GET") {
    const ctx = await requireAuth();
    const data = await getMyPackages(config, ctx.tokens);
    return respond({ ok: true, data });
  }

  if (url.pathname === "/api/packages/unsubscribe" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{
      quota_code?: string;
      product_domain?: string;
      product_subscription_type?: string;
      confirm?: boolean;
    }>(request);
    if (!body.confirm) return badRequest("confirm=true wajib");
    if (!body.quota_code || !body.product_domain || !body.product_subscription_type) {
      return badRequest("quota_code, product_domain, product_subscription_type wajib");
    }
    const data = await unsubscribePackage(
      config,
      ctx.tokens,
      body.quota_code,
      body.product_domain,
      body.product_subscription_type,
    );
    await audit(env, ctx.number, "unsubscribe", body);
    return respond({ ok: true, data });
  }

  if (url.pathname === "/api/packages/family" && request.method === "GET") {
    const ctx = await requireAuth();
    const code = url.searchParams.get("code");
    if (!code) return badRequest("query code wajib");
    const enterprise = url.searchParams.get("enterprise");
    const migration = url.searchParams.get("migration");
    const data = await getFamily(
      config,
      ctx.tokens,
      code,
      enterprise === null ? null : asBool(enterprise),
      migration,
    );
    await audit(env, ctx.number, "package_family_fetch", { code });
    return respond({ ok: true, data });
  }

  if (url.pathname === "/api/packages/option" && request.method === "GET") {
    const ctx = await requireAuth();
    const code = url.searchParams.get("code");
    if (!code) return badRequest("query code wajib");
    const data = await getPackageByOption(config, ctx.tokens, code);
    const addons = await getAddons(config, ctx.tokens, code).catch(() => null);
    await audit(env, ctx.number, "package_option_fetch", { code });
    return respond({ ok: true, data, addons });
  }

  if (url.pathname === "/api/packages/resolve" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{
      family_code?: string;
      variant_code?: string;
      order?: number;
      is_enterprise?: boolean | null;
      migration_type?: string | null;
    }>(request);
    if (!body.family_code || !body.variant_code || body.order == null) {
      return badRequest("family_code, variant_code, order wajib");
    }
    const data = await getPackageDetails(
      config,
      ctx.tokens,
      body.family_code,
      body.variant_code,
      body.order,
      body.is_enterprise ?? null,
      body.migration_type ?? null,
    );
    return respond({ ok: true, data });
  }

  // ---- Catalog ----
  if (url.pathname === "/api/catalog/hot" && request.method === "GET") {
    return respond({ ok: true, data: getHotCatalog() });
  }
  if (url.pathname === "/api/catalog/hot2" && request.method === "GET") {
    return respond({ ok: true, data: getHot2Catalog() });
  }

  // ---- Bookmarks ----
  if (url.pathname === "/api/bookmarks" && request.method === "GET") {
    const ctx = await requireAuth();
    const result = await env.DB.prepare(
      "SELECT * FROM bookmarks WHERE number = ? ORDER BY created_at DESC",
    ).bind(ctx.number).all();
    return respond({ ok: true, bookmarks: result.results });
  }

  if (url.pathname === "/api/bookmarks" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<BookmarkBody>(request);
    if (!body.family_code) return badRequest("family_code wajib");
    await env.DB.prepare(`
      INSERT OR IGNORE INTO bookmarks
        (number, family_code, family_name, is_enterprise, variant_name, option_name, option_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ctx.number,
      body.family_code,
      body.family_name || "",
      body.is_enterprise ? 1 : 0,
      body.variant_name || "",
      body.option_name || "",
      body.option_order || 0,
    ).run();
    await audit(env, ctx.number, "bookmark_add", body);
    return respond({ ok: true });
  }

  if (url.pathname.startsWith("/api/bookmarks/") && request.method === "DELETE") {
    const ctx = await requireAuth();
    const id = Number(url.pathname.split("/").pop());
    if (!Number.isFinite(id)) return badRequest("id bookmark tidak valid");
    await env.DB.prepare("DELETE FROM bookmarks WHERE id = ? AND number = ?").bind(id, ctx.number).run();
    await audit(env, ctx.number, "bookmark_delete", { id });
    return respond({ ok: true });
  }

  // ---- Store ----
  if (url.pathname === "/api/store/segments" && request.method === "GET") {
    const ctx = await requireAuth();
    const data = await getSegments(config, ctx.tokens, asBool(url.searchParams.get("enterprise")));
    return respond({ ok: true, data });
  }
  if (url.pathname === "/api/store/families" && request.method === "GET") {
    const ctx = await requireAuth();
    const data = await getFamilyList(
      config,
      ctx.tokens,
      url.searchParams.get("subsType") || "PREPAID",
      asBool(url.searchParams.get("enterprise")),
    );
    return respond({ ok: true, data });
  }
  if (url.pathname === "/api/store/packages" && request.method === "GET") {
    const ctx = await requireAuth();
    const data = await getStorePackages(
      config,
      ctx.tokens,
      url.searchParams.get("subsType") || "PREPAID",
      asBool(url.searchParams.get("enterprise")),
      url.searchParams.get("q") || "",
    );
    return respond({ ok: true, data });
  }
  if (url.pathname === "/api/store/redeemables" && request.method === "GET") {
    const ctx = await requireAuth();
    const data = await getRedeemables(config, ctx.tokens, asBool(url.searchParams.get("enterprise")));
    return respond({ ok: true, data });
  }

  // ---- Transactions / notifications ----
  if (url.pathname === "/api/transactions" && request.method === "GET") {
    const ctx = await requireAuth();
    const data = await getTransactionHistory(config, ctx.tokens);
    return respond({ ok: true, data });
  }
  if (url.pathname === "/api/notifications" && request.method === "GET") {
    const ctx = await requireAuth();
    const data = await getDashboardSegments(config, ctx.tokens);
    return respond({ ok: true, data });
  }
  if (url.pathname.startsWith("/api/notifications/") && request.method === "POST") {
    const ctx = await requireAuth();
    const id = url.pathname.split("/").pop() || "";
    const data = await getNotificationDetail(config, ctx.tokens, id);
    return respond({ ok: true, data });
  }

  // ---- Family plan ----
  if (url.pathname === "/api/family" && request.method === "GET") {
    const ctx = await requireAuth();
    const data = await getFamilyData(config, ctx.tokens);
    return respond({ ok: true, data });
  }
  if (url.pathname === "/api/family/change-member" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{
      parent_alias?: string;
      alias?: string;
      slot_id?: number;
      family_member_id?: string;
      msisdn?: string;
      confirm?: boolean;
    }>(request);
    if (!body.confirm) return badRequest("confirm=true wajib");
    if (!body.parent_alias || !body.alias || body.slot_id == null || !body.family_member_id || !body.msisdn) {
      return badRequest("field wajib kurang");
    }
    const data = await changeMember(
      config,
      ctx.tokens,
      body.parent_alias,
      body.alias,
      body.slot_id,
      body.family_member_id,
      body.msisdn,
    );
    await audit(env, ctx.number, "family_change_member", body);
    return respond({ ok: true, data });
  }
  if (url.pathname === "/api/family/remove-member" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{ family_member_id?: string; confirm?: boolean }>(request);
    if (!body.confirm || !body.family_member_id) return badRequest("confirm + family_member_id wajib");
    const data = await removeMember(config, ctx.tokens, body.family_member_id);
    await audit(env, ctx.number, "family_remove_member", body);
    return respond({ ok: true, data });
  }
  if (url.pathname === "/api/family/quota-limit" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{
      original_allocation?: number;
      new_allocation?: number;
      family_member_id?: string;
      confirm?: boolean;
    }>(request);
    if (!body.confirm || body.original_allocation == null || body.new_allocation == null || !body.family_member_id) {
      return badRequest("field wajib kurang");
    }
    const data = await setQuotaLimit(
      config,
      ctx.tokens,
      body.original_allocation,
      body.new_allocation,
      body.family_member_id,
    );
    await audit(env, ctx.number, "family_quota_limit", body);
    return respond({ ok: true, data });
  }

  // ---- Circle ----
  if (url.pathname === "/api/circle" && request.method === "GET") {
    const ctx = await requireAuth();
    const groupRes = await getGroupData(config, ctx.tokens) as {
      status?: string;
      data?: { group_id?: string; group_name?: string; group_status?: string; owner_name?: string };
    };
    const groupId = groupRes?.data?.group_id || "";
    if (!groupId) return respond({ ok: true, data: { group: groupRes, members: null, spending: null } });

    const membersRes = await getGroupMembers(config, ctx.tokens, groupId) as {
      data?: { members?: Array<Record<string, unknown>>; package?: unknown };
    };
    const members = [];
    let parentMemberId = "";
    let parentSubsId = "";
    for (const member of membersRes?.data?.members || []) {
      const encrypted = String(member.msisdn || "");
      const plain = encrypted ? await decryptMemberMsisdn(config, encrypted) : "";
      if (member.member_role === "PARENT") {
        parentMemberId = String(member.member_id || "");
        parentSubsId = String(member.subscriber_number || "");
      }
      members.push({ ...member, msisdn_plain: plain });
    }
    const spending = parentSubsId
      ? await spendingTracker(config, ctx.tokens, parentSubsId, groupId).catch(() => null)
      : null;
    return respond({
      ok: true,
      data: {
        group: groupRes.data,
        members,
        package: membersRes?.data?.package || null,
        spending,
        parent_member_id: parentMemberId,
        parent_subs_id: parentSubsId,
      },
    });
  }

  if (url.pathname === "/api/circle/create" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{
      parent_name?: string;
      group_name?: string;
      member_msisdn?: string;
      member_name?: string;
      confirm?: boolean;
    }>(request);
    if (!body.confirm) return badRequest("confirm=true wajib");
    if (!body.parent_name || !body.group_name || !body.member_msisdn || !body.member_name) {
      return badRequest("field wajib kurang");
    }
    const data = await createCircle(
      config,
      ctx.tokens,
      body.parent_name,
      body.group_name,
      body.member_msisdn,
      body.member_name,
    );
    await audit(env, ctx.number, "circle_create", body);
    return respond({ ok: true, data });
  }

  if (url.pathname === "/api/circle/invite" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{
      msisdn?: string;
      name?: string;
      group_id?: string;
      member_id_parent?: string;
      confirm?: boolean;
    }>(request);
    if (!body.confirm || !body.msisdn || !body.name || !body.group_id || !body.member_id_parent) {
      return badRequest("field wajib kurang");
    }
    const validation = await validateCircleMember(config, ctx.tokens, body.msisdn);
    const data = await inviteCircleMember(
      config,
      ctx.tokens,
      body.msisdn,
      body.name,
      body.group_id,
      body.member_id_parent,
    );
    await audit(env, ctx.number, "circle_invite", body);
    return respond({ ok: true, validation, data });
  }

  if (url.pathname === "/api/circle/remove" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{
      member_id?: string;
      group_id?: string;
      member_id_parent?: string;
      is_last_member?: boolean;
      confirm?: boolean;
    }>(request);
    if (!body.confirm || !body.member_id || !body.group_id || !body.member_id_parent) {
      return badRequest("field wajib kurang");
    }
    const data = await removeCircleMember(
      config,
      ctx.tokens,
      body.member_id,
      body.group_id,
      body.member_id_parent,
      !!body.is_last_member,
    );
    await audit(env, ctx.number, "circle_remove", body);
    return respond({ ok: true, data });
  }

  if (url.pathname === "/api/circle/accept" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{ group_id?: string; member_id?: string; confirm?: boolean }>(request);
    if (!body.confirm || !body.group_id || !body.member_id) return badRequest("field wajib kurang");
    const data = await acceptCircleInvitation(config, ctx.tokens, body.group_id, body.member_id);
    await audit(env, ctx.number, "circle_accept", body);
    return respond({ ok: true, data });
  }

  if (url.pathname === "/api/circle/bonuses" && request.method === "GET") {
    const ctx = await requireAuth();
    const parentSubsId = url.searchParams.get("parent_subs_id") || "";
    const familyId = url.searchParams.get("family_id") || "";
    if (!parentSubsId || !familyId) return badRequest("parent_subs_id dan family_id wajib");
    const data = await getBonusData(config, ctx.tokens, parentSubsId, familyId);
    return respond({ ok: true, data });
  }

  // ---- Tools ----
  if (url.pathname === "/api/tools/validate-msisdn" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{ msisdn?: string }>(request);
    if (!body.msisdn) return badRequest("msisdn wajib");
    const data = await validateMsisdn(config, ctx.tokens, body.msisdn);
    return respond({ ok: true, data });
  }
  if (url.pathname === "/api/tools/dukcapil" && request.method === "POST") {
    const body = await readJson<{ msisdn?: string; kk?: string; nik?: string }>(request);
    if (!body.msisdn || !body.kk || !body.nik) return badRequest("msisdn, kk, nik wajib");
    let tokens = null as Awaited<ReturnType<typeof requireAuth>>["tokens"] | null;
    try {
      tokens = (await requireAuth()).tokens;
    } catch {
      tokens = null;
    }
    const data = await dukcapil(config, tokens, body.msisdn, body.kk, body.nik);
    await audit(env, body.msisdn, "dukcapil", { msisdn: body.msisdn });
    return respond({ ok: true, data });
  }

  // ---- Custom decoy (per user, disimpan di D1) ----
  if (url.pathname === "/api/custom-decoy" && request.method === "GET") {
    const ctx = await requireAuth();
    const paymentType = url.searchParams.get("payment_type") || "balance";
    const data = await getCustomDecoy(env, ctx.session.clientId, paymentType);
    return respond({ ok: true, data });
  }

  if (url.pathname === "/api/custom-decoy" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{
      payment_type?: string;
      family_code?: string;
      variant_code?: string;
      option_order?: number;
      is_enterprise?: boolean;
      migration_type?: string;
      price?: number;
      family_name?: string;
      option_name?: string;
    }>(request);
    if (!body.family_code || !body.variant_code) {
      return badRequest("family_code dan variant_code wajib");
    }
    await setCustomDecoy(env, ctx.session.clientId, body.payment_type || "balance", {
      family_code: body.family_code,
      variant_code: body.variant_code,
      option_order: body.option_order || 0,
      is_enterprise: !!body.is_enterprise,
      migration_type: body.migration_type || "NONE",
      price: body.price || 0,
      family_name: body.family_name || "",
      option_name: body.option_name || "",
    });
    await audit(env, ctx.number, "custom_decoy_set", body);
    return respond({ ok: true });
  }

  // ---- Decoy ----
  if (url.pathname.startsWith("/api/decoy/") && request.method === "GET") {
    const ctx = await requireAuth();
    const paymentType = url.pathname.split("/").pop() || "balance";
    const custom = asBool(url.searchParams.get("custom"));
    const data = await getDecoy(
      env,
      config,
      ctx.tokens,
      ctx.number,
      paymentType,
      ctx.account.subscription_type,
      custom,
      ctx.session.clientId,
    );
    return respond({ ok: true, data });
  }

  // Custom decoy per-user: read the saved definition.
  if (url.pathname === "/api/decoy-custom" && request.method === "GET") {
    const ctx = await requireAuth();
    const paymentType = url.searchParams.get("payment_type") || "balance";
    const data = await getCustomDecoy(env, ctx.session.clientId, paymentType);
    return respond({ ok: true, data });
  }

  // Custom decoy per-user: save/update the definition.
  if (url.pathname === "/api/decoy-custom" && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<{
      payment_type?: string;
      family_code?: string;
      variant_code?: string;
      option_order?: number;
      is_enterprise?: boolean;
      migration_type?: string;
      price?: number;
      family_name?: string;
      option_name?: string;
    }>(request);
    if (!body.family_code || !body.variant_code) {
      return badRequest("family_code dan variant_code wajib");
    }
    const paymentType = body.payment_type || "balance";
    await setCustomDecoy(env, ctx.session.clientId, paymentType, {
      family_code: body.family_code,
      variant_code: body.variant_code,
      option_order: body.option_order ?? 0,
      is_enterprise: !!body.is_enterprise,
      migration_type: body.migration_type || "NONE",
      price: body.price ?? 0,
      family_name: body.family_name || "",
      option_name: body.option_name || "",
    });
    await audit(env, ctx.number, "custom_decoy_set", { paymentType, family_code: body.family_code });
    return respond({ ok: true });
  }

  // ---- Purchase ----
  if (url.pathname.startsWith("/api/purchase/") && request.method === "POST") {
    const ctx = await requireAuth();
    const body = await readJson<PurchaseBody>(request);
    if (!body.confirm) return badRequest("confirm=true wajib untuk purchase");
    const kind = url.pathname.split("/").pop() || "";

    const ensureItems = async (): Promise<PaymentItem[]> => {
      if (body.items?.length) return body.items;
      if (body.option_code) {
        const detail = await getPackageByOption(config, ctx.tokens, body.option_code) as {
          package_option?: { package_option_code?: string; price?: number; name?: string };
          token_confirmation?: string;
        };
        return [{
          item_code: detail.package_option?.package_option_code || body.option_code,
          product_type: "",
          item_price: detail.package_option?.price || 0,
          item_name: detail.package_option?.name || body.option_code,
          tax: 0,
          token_confirmation: detail.token_confirmation || "",
        }];
      }
      if (body.family_code && body.variant_code && body.option_order != null) {
        const detail = await getPackageDetails(
          config,
          ctx.tokens,
          body.family_code,
          body.variant_code,
          body.option_order,
          body.is_enterprise ?? null,
          body.migration_type ?? null,
        ) as {
          package_option?: { package_option_code?: string; price?: number; name?: string };
          token_confirmation?: string;
        } | null;
        if (!detail) throw new Error("Gagal resolve package detail");
        return [{
          item_code: detail.package_option?.package_option_code || "",
          product_type: "",
          item_price: detail.package_option?.price || 0,
          item_name: detail.package_option?.name || "",
          tax: 0,
          token_confirmation: detail.token_confirmation || "",
        }];
      }
      throw new Error("items atau option/family resolve wajib");
    };

    const maybeAttachDecoy = async (items: PaymentItem[]): Promise<PaymentItem[]> => {
      if (!body.use_decoy) return items;
      const decoyType = body.decoy_type || "balance";
      const decoy = await getDecoy(
        env,
        config,
        ctx.tokens,
        ctx.number,
        decoyType,
        ctx.account.subscription_type,
        !!body.custom_decoy,
        ctx.session.clientId,
      );
      const detail = await getPackageByOption(config, ctx.tokens, decoy.option_code) as {
        package_option?: { package_option_code?: string; price?: number; name?: string };
        token_confirmation?: string;
      };
      return [
        ...items,
        {
          item_code: detail.package_option?.package_option_code || decoy.option_code,
          product_type: "",
          item_price: detail.package_option?.price || decoy.price,
          item_name: detail.package_option?.name || decoy.name,
          tax: 0,
          token_confirmation: detail.token_confirmation || "",
        },
      ];
    };

    if (kind === "balance") {
      let items = await ensureItems();
      items = await maybeAttachDecoy(items);
      const paymentFor = body.payment_for || "BUY_PACKAGE";
      let overwrite = body.overwrite_amount ?? null;
      if (body.use_decoy && overwrite == null) {
        overwrite = items.reduce((s, i) => s + i.item_price, 0);
      }
      const data = await settlementBalance(
        config,
        ctx.tokens,
        items,
        paymentFor,
        overwrite,
        body.token_confirmation_idx ?? (body.use_decoy ? 1 : 0),
        body.amount_idx ?? -1,
      );
      await audit(env, ctx.number, "purchase_balance", { items, paymentFor, overwrite });
      return respond({ ok: true, data });
    }

    if (kind === "qris") {
      let items = await ensureItems();
      items = await maybeAttachDecoy(items);
      const paymentFor = body.payment_for || (body.use_decoy ? "SHARE_PACKAGE" : "BUY_PACKAGE");
      const transactionId = await settlementQris(
        config,
        ctx.tokens,
        items,
        paymentFor,
        body.overwrite_amount ?? null,
        body.token_confirmation_idx ?? (body.use_decoy ? 1 : 0),
        body.amount_idx ?? -1,
      );
      const qrCode = await getQrisCode(config, ctx.tokens, transactionId);
      await audit(env, ctx.number, "purchase_qris", { transactionId, items });
      return respond({ ok: true, transaction_id: transactionId, qr_code: qrCode });
    }

    if (kind === "ewallet") {
      const items = await ensureItems();
      const paymentMethod = body.payment_method || "DANA";
      const data = await settlementEwallet(
        config,
        ctx.tokens,
        items,
        paymentMethod,
        body.payment_for || "BUY_PACKAGE",
        body.wallet_number || "",
        body.overwrite_amount ?? null,
        body.token_confirmation_idx ?? 0,
        body.amount_idx ?? -1,
      );
      await audit(env, ctx.number, "purchase_ewallet", { paymentMethod, items });
      return respond({ ok: true, data });
    }

    if (kind === "bounty") {
      if (!body.token_confirmation || !body.payment_target || body.ts_to_sign == null) {
        return badRequest("token_confirmation, payment_target, ts_to_sign wajib");
      }
      const data = await settlementBounty(
        config,
        ctx.tokens,
        body.token_confirmation,
        body.ts_to_sign,
        body.payment_target,
        body.price || 0,
        body.item_name || "",
      );
      await audit(env, ctx.number, "purchase_bounty", body);
      return respond({ ok: true, data });
    }

    if (kind === "loyalty") {
      if (!body.token_confirmation || !body.payment_target || body.ts_to_sign == null) {
        return badRequest("token_confirmation, payment_target, ts_to_sign wajib");
      }
      const data = await settlementLoyalty(
        config,
        ctx.tokens,
        body.token_confirmation,
        body.ts_to_sign,
        body.payment_target,
        body.price || 0,
      );
      await audit(env, ctx.number, "purchase_loyalty", body);
      return respond({ ok: true, data });
    }

    if (kind === "bounty-allotment") {
      if (!body.token_confirmation || !body.payment_target || !body.destination_msisdn || body.ts_to_sign == null) {
        return badRequest("field bounty-allotment kurang");
      }
      const data = await bountyAllotment(
        config,
        ctx.tokens,
        body.ts_to_sign,
        body.destination_msisdn,
        body.item_name || "",
        body.payment_target,
        body.token_confirmation,
      );
      await audit(env, ctx.number, "purchase_bounty_allotment", { destination: body.destination_msisdn });
      return respond({ ok: true, data });
    }

    if (kind === "n-times") {
      const times = Math.min(Math.max(body.times || 1, 1), 20);
      const results = [];
      for (let i = 0; i < times; i++) {
        let items = await ensureItems();
        items = await maybeAttachDecoy(items);
        const overwrite = body.use_decoy
          ? items.reduce((s, it) => s + it.item_price, 0)
          : (body.overwrite_amount ?? null);
        const data = await settlementBalance(
          config,
          ctx.tokens,
          items,
          body.payment_for || "BUY_PACKAGE",
          overwrite,
          body.token_confirmation_idx ?? (body.use_decoy ? 1 : 0),
        );
        results.push(data);
      }
      await audit(env, ctx.number, "purchase_n_times", { times });
      return respond({ ok: true, results });
    }

    return badRequest(`purchase kind tidak dikenal: ${kind}`);
  }

  return notFound();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) {
        try {
          return await handleApi(request, env);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes("Belum") || message.includes("aktif") || message.includes("login")) {
            return unauthorized(message);
          }
          return jsonResponse({ ok: false, error: message }, { status: 500 });
        }
      }
      if (request.method === "GET") return renderApp();
      return notFound();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return jsonResponse({ ok: false, error: message }, { status: 500 });
    }
  },
};
