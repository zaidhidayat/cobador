export function renderApp(): Response {
  return new Response(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dordoran Web</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f3f6fb;
      --panel: #ffffff;
      --ink: #152033;
      --muted: #66758b;
      --line: #d9e2ef;
      --brand: #1763c7;
      --brand-2: #0f4f9f;
      --danger: #b42318;
      --ok: #067647;
      --soft: #eef4ff;
      --shadow: 0 10px 30px rgba(21, 32, 51, 0.07);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--ink); }
    button, input, select, textarea { font: inherit; }
    button {
      border: 0; border-radius: 10px; padding: 10px 14px; cursor: pointer;
      background: var(--brand); color: #fff; font-weight: 700;
    }
    button:hover { background: var(--brand-2); }
    button.secondary { background: #e8eef8; color: var(--ink); }
    button.danger { background: var(--danger); color: #fff; }
    button:disabled { opacity: .55; cursor: not-allowed; }
    input, select, textarea {
      width: 100%; border: 1px solid var(--line); border-radius: 10px;
      padding: 11px 12px; background: #fbfcff;
    }
    textarea { min-height: 90px; resize: vertical; }
    label { display:block; font-size: 13px; font-weight: 700; margin: 12px 0 6px; color: #314158; }
    .app { display:grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
    .sidebar {
      background: #101828; color: #e7eefc; padding: 22px 16px; position: sticky; top: 0; height: 100vh; overflow:auto;
    }
    .brand { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
    .brand small { display:block; color:#9fb0cb; font-weight:500; font-size:12px; margin-top:4px; }
    .nav { display:flex; flex-direction:column; gap:6px; margin-top:18px; }
    .nav button {
      width:100%; text-align:left; background: transparent; color:#d7e3f7; border:1px solid transparent;
      padding: 11px 12px; border-radius: 10px; font-weight: 650;
    }
    .nav button.active, .nav button:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.08); }
    .main { padding: 22px; }
    .topbar {
      display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:18px; flex-wrap:wrap;
    }
    .metrics { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:12px; margin-bottom:16px; }
    .metric, .panel, .card {
      background: var(--panel); border:1px solid var(--line); border-radius: 14px; box-shadow: var(--shadow);
    }
    .metric { padding: 14px; }
    .metric span { display:block; color: var(--muted); font-size:12px; margin-bottom:6px; }
    .metric strong { font-size: 16px; word-break: break-word; }
    .panel { padding: 18px; }
    .grid-2 { display:grid; grid-template-columns: 1.1fr .9fr; gap: 14px; }
    .row { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
    .muted { color: var(--muted); }
    .status { white-space: pre-wrap; color:#405168; min-height: 20px; }
    .list { display:flex; flex-direction:column; gap:10px; }
    .card { padding: 14px; }
    .card h3 { margin:0 0 8px; font-size:15px; }
    .pill {
      display:inline-flex; align-items:center; gap:6px; border-radius:999px; padding:4px 10px;
      background: var(--soft); color: var(--brand); font-size:12px; font-weight:700;
    }
    .pill.ok { background:#e8f8ef; color: var(--ok); }
    .pill.bad { background:#fdecec; color: var(--danger); }
    pre {
      margin:0; padding:14px; background:#0f172a; color:#e5eefc; border-radius:12px;
      overflow:auto; max-height: 420px; font-size:12px;
    }
    .hidden { display:none !important; }
    .section-title { display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:14px; }
    .section-title h2 { margin:0; font-size:22px; }
    table { width:100%; border-collapse: collapse; }
    th, td { text-align:left; padding:10px 8px; border-bottom:1px solid var(--line); vertical-align:top; font-size:14px; }
    th { color: var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.03em; }
    .modal-backdrop {
      position:fixed; inset:0; background:rgba(15,23,42,.48); display:flex; align-items:center; justify-content:center;
      padding:18px; z-index:40;
    }
    .modal {
      width:min(920px,100%); max-height:90vh; overflow:auto; background:#fff; border-radius:16px; padding:18px;
      box-shadow: 0 20px 50px rgba(0,0,0,.25);
    }
    .tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
    .tabs button { background:#e8eef8; color:var(--ink); }
    .tabs button.active { background: var(--brand); color:#fff; }
    .qrbox { background:#fff; border:1px dashed var(--line); border-radius:12px; padding:12px; text-align:center; }
    .qrbox img { max-width: 260px; width:100%; background:#fff; }
    .loading-bar {
      height: 3px; background: linear-gradient(90deg, transparent, var(--brand), transparent);
      background-size: 200% 100%; animation: shimmer 1.1s linear infinite; margin: 0 0 12px; border-radius: 999px;
    }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
    .empty {
      border: 1px dashed var(--line); border-radius: 12px; padding: 22px; text-align: center; color: var(--muted); background: #fbfcff;
    }
    .btn-group { display:flex; flex-wrap:wrap; gap:8px; }
    .pay-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:8px; margin-top:10px; }
    .pay-grid button { width:100%; }
    .top-accounts { display:flex; gap:6px; flex-wrap:wrap; }
    .top-accounts button { padding:7px 10px; font-size:12px; }
    .auth-overlay {
      position:fixed; inset:0; background:linear-gradient(135deg,#101828,#1763c7); display:flex;
      align-items:center; justify-content:center; padding:18px; z-index:60;
    }
    .auth-card {
      width:min(400px,100%); background:#fff; border-radius:16px; padding:24px;
      box-shadow:0 24px 60px rgba(0,0,0,.35);
    }
    .auth-card label { margin-top:12px; }
    .hamburger {
      display:none; background:var(--brand); color:#fff; border-radius:10px;
      width:44px; height:44px; padding:0; font-size:20px; line-height:1; flex:0 0 auto;
    }
    .nav-backdrop {
      position:fixed; inset:0; background:rgba(15,23,42,.5); z-index:44; display:none;
    }
    .nav-backdrop.show { display:block; }
    .brand-close { display:none; }

    /* Tablet: kecilkan metrics jadi 2 kolom */
    @media (max-width: 1100px) {
      .metrics { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }

    /* Layar sempit: sidebar jadi drawer off-canvas + hamburger */
    @media (max-width: 860px) {
      .app { grid-template-columns: 1fr; }
      .hamburger { display:inline-flex; align-items:center; justify-content:center; }
      .sidebar {
        position:fixed; top:0; left:0; bottom:0; width:min(280px,82vw); height:100%;
        transform:translateX(-100%); transition:transform .25s ease; z-index:45; box-shadow:0 0 40px rgba(0,0,0,.4);
      }
      .app.nav-open .sidebar { transform:translateX(0); }
      .brand-close { display:inline-flex; align-items:center; justify-content:center; float:right; background:transparent; color:#d7e3f7; width:32px; height:32px; padding:0; }
      .main { padding:16px; }
      .grid-2, .pay-grid { grid-template-columns: 1fr; }
      /* Tabel lebar bisa di-scroll dalam panel/card */
      .panel, .card { overflow-x:auto; }
    }

    /* HP kecil */
    @media (max-width: 560px) {
      .metrics { grid-template-columns: 1fr 1fr; gap:8px; }
      .main { padding:12px; }
      .metric { padding:11px; }
      .metric strong { font-size:14px; }
      .panel { padding:14px; }
      .section-title h2 { font-size:19px; }
      h1 { font-size:20px; }
      .topbar { gap:8px; }
      .modal { padding:14px; }
      button { padding:10px 12px; }
    }
    @media (max-width: 380px) {
      .metrics { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="app" id="app">
    <aside class="sidebar" id="sidebar">
      <div class="brand">Dordoran Web<button class="brand-close" id="navClose" aria-label="Tutup menu">✕</button><small>Port penuh menu CLI MyXL</small></div>
      <div class="nav" id="nav"></div>
    </aside>
    <div class="nav-backdrop" id="navBackdrop"></div>
    <main class="main">
      <div class="topbar">
        <div class="row" style="margin:0;align-items:flex-start;flex:1">
          <button class="hamburger" id="navToggle" aria-label="Buka menu">☰</button>
          <div>
            <div class="muted" id="sessionStatus">Memuat sesi...</div>
            <div style="margin-top:6px"><span class="pill" id="activePill">Belum login</span></div>
            <div class="top-accounts" id="topAccounts" style="margin-top:8px"></div>
          </div>
        </div>
        <div class="row" style="margin:0">
          <button class="secondary" id="refreshTopBtn">Refresh</button>
          <button class="danger" id="logoutBtn">Logout</button>
        </div>
      </div>
      <div id="globalLoading" class="loading-bar hidden"></div>
      <div class="metrics" id="metrics">
        <div class="metric"><span>Nomor</span><strong id="mNumber">-</strong></div>
        <div class="metric"><span>Subscription</span><strong id="mType">-</strong></div>
        <div class="metric"><span>Balance</span><strong id="mBalance">-</strong></div>
        <div class="metric"><span>Points / Tier</span><strong id="mPoints">-</strong></div>
      </div>
      <div id="content"></div>
    </main>
  </div>
  <div id="authOverlay" class="auth-overlay hidden">
    <div class="auth-card">
      <div class="brand" style="color:var(--ink)">Dordoran Web<small class="muted">Masuk untuk melanjutkan</small></div>
      <div class="tabs" style="margin-top:16px">
        <button class="active" id="tabLogin">Login</button>
        <button id="tabRegister">Daftar</button>
      </div>
      <form id="authForm" autocomplete="off">
        <label for="authUser">Username</label>
        <input id="authUser" name="username" autocomplete="username" placeholder="username kamu">
        <label for="authPass">Password</label>
        <input id="authPass" name="password" type="password" autocomplete="current-password" placeholder="••••••">
        <div id="authConfirmWrap" class="hidden">
          <label for="authPass2">Ulangi Password</label>
          <input id="authPass2" type="password" autocomplete="new-password" placeholder="••••••">
        </div>
        <div class="status" id="authStatus" style="margin-top:10px"></div>
        <div class="row" style="margin-top:14px">
          <button type="submit" id="authSubmit" style="flex:1">Login</button>
        </div>
      </form>
      <div class="muted" id="authHint" style="margin-top:12px;font-size:12px">Belum punya akun? Klik tab Daftar untuk membuat akun baru.</div>
    </div>
  </div>
  <div id="modalRoot"></div>
  <script>
    const SECTIONS = [
      ["home", "Beranda"],
      ["accounts", "Akun"],
      ["packages", "Paket Saya"],
      ["hot", "HOT"],
      ["buy", "Cari Paket"],
      ["store", "Store"],
      ["family", "Family Plan"],
      ["circle", "Circle"],
      ["bookmarks", "Bookmark"],
      ["decoy", "Decoy Custom"],
      ["history", "Riwayat"],
      ["notifications", "Notifikasi"],
      ["tools", "Tools"],
    ];

    const state = {
      section: localStorage.getItem("dordoran.section") || "home",
      me: null,
      dashboard: null,
      loading: false,
      status: "",
      packageDetail: null,
    };

    const $ = (id) => document.getElementById(id);
    const content = () => $("content");

    function setLoading(on) {
      state.loading = !!on;
      const el = $("globalLoading");
      if (el) el.classList.toggle("hidden", !on);
    }

    async function api(path, options = {}) {
      setLoading(true);
      try {
        const response = await fetch(path, {
          ...options,
          headers: { "content-type": "application/json", ...(options.headers || {}) },
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.ok === false) throw new Error(body.error || JSON.stringify(body));
        return body;
      } finally {
        setLoading(false);
      }
    }

    function money(v) {
      if (v == null || v === "") return "-";
      const n = Number(v);
      if (Number.isFinite(n)) return "Rp " + n.toLocaleString("id-ID");
      return String(v);
    }

    function formatQuotaByte(v) {
      const n = Number(v) || 0;
      if (n >= 1024 ** 3) return (n / 1024 ** 3).toFixed(2) + " GB";
      if (n >= 1024 ** 2) return (n / 1024 ** 2).toFixed(2) + " MB";
      if (n >= 1024) return (n / 1024).toFixed(2) + " KB";
      return n + " B";
    }

    function escapeHtml(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({
        "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
      }[c]));
    }

    function setStatus(msg) {
      state.status = msg || "";
      const el = document.getElementById("sectionStatus");
      if (el) el.textContent = state.status;
    }

    function renderNav() {
      $("nav").innerHTML = SECTIONS.map(([id, label]) =>
        '<button data-section="' + id + '" class="' + (state.section === id ? "active" : "") + '">' + label + "</button>"
      ).join("");
      $("nav").querySelectorAll("button").forEach((btn) => {
        btn.onclick = () => {
          state.section = btn.dataset.section;
          localStorage.setItem("dordoran.section", state.section);
          closeNav();
          render();
        };
      });
    }

    function openNav() { $("app").classList.add("nav-open"); $("navBackdrop").classList.add("show"); }
    function closeNav() { $("app").classList.remove("nav-open"); $("navBackdrop").classList.remove("show"); }

    function updateTop() {
      const d = state.dashboard || {};
      const me = state.me || {};
      $("mNumber").textContent = d.number || me.number || "-";
      $("mType").textContent = d.subscription_type || "-";
      $("mBalance").textContent = money(d.balance?.remaining ?? d.balance);
      const tier = d.tiering || {};
      $("mPoints").textContent = (tier.current_point != null || tier.tier != null)
        ? (tier.current_point ?? "-") + " / Tier " + (tier.tier ?? "-")
        : "-";
      $("sessionStatus").textContent = me.number ? ("Sesi aktif: " + me.number) : "Belum login";
      $("activePill").textContent = me.number || "Belum login";
      $("activePill").className = "pill " + (me.number ? "ok" : "");
      const accBox = $("topAccounts");
      if (accBox) {
        const accounts = me.accounts || [];
        accBox.innerHTML = accounts.map((a) =>
          '<button class="' + (a.active ? "" : "secondary") + '" data-top-switch="' + escapeHtml(a.number) + '">' +
          escapeHtml(a.number) + (a.active ? " ✓" : "") + "</button>"
        ).join("");
        accBox.querySelectorAll("[data-top-switch]").forEach((btn) => {
          btn.onclick = async () => {
            if (btn.dataset.topSwitch === me.number) return;
            try {
              await api("/api/accounts/switch", { method: "POST", body: JSON.stringify({ number: btn.dataset.topSwitch }) });
              await loadMe();
              await loadDashboard().catch(() => {});
              render();
            } catch (e) { setStatus(e.message); }
          };
        });
      }
    }

    function panel(title, body, actions = "") {
      return '<section class="panel">' +
        '<div class="section-title"><h2>' + title + '</h2><div class="row" style="margin:0">' + actions + '</div></div>' +
        '<div class="status" id="sectionStatus">' + escapeHtml(state.status) + '</div>' +
        body +
      '</section>';
    }

    function openModal(html) {
      $("modalRoot").innerHTML = '<div class="modal-backdrop"><div class="modal">' + html + '</div></div>';
      $("modalRoot").querySelector(".modal-backdrop").onclick = (e) => {
        if (e.target.classList.contains("modal-backdrop")) closeModal();
      };
    }
    function closeModal() { $("modalRoot").innerHTML = ""; }

    async function loadMe() {
      state.me = await api("/api/me");
      updateTop();
    }

    async function loadDashboard() {
      try {
        state.dashboard = await api("/api/dashboard");
        updateTop();
      } catch (e) {
        state.dashboard = null;
        updateTop();
        throw e;
      }
    }

    async function showPackageDetail(optionCode, extra = {}) {
      setStatus("Memuat detail paket...");
      const res = await api("/api/packages/option?code=" + encodeURIComponent(optionCode));
      const p = { ...(res.data || {}), addons: res.addons, extra };
      state.packageDetail = p;
      // Sebagian paket (mis. bonus aktivasi) membalas FAILED/REQUEST_NOT_ALLOWED
      // di options/detail: tidak ada package_option, jadi tidak bisa dibeli.
      if (!p.package_option) {
        openModal(
          '<div class="section-title"><h2>Detail tidak tersedia</h2>' +
          '<button class="secondary" id="closeModalBtn">Tutup</button></div>' +
          '<div class="status">Paket ini tidak mengembalikan detail yang bisa dibeli' +
          (p.message ? " (" + escapeHtml(p.message) + ")" : "") + ".</div>" +
          '<details style="margin-top:14px"><summary>Raw JSON</summary><pre>' + escapeHtml(JSON.stringify(res, null, 2)) + "</pre></details>"
        );
        $("closeModalBtn").onclick = closeModal;
        setStatus("");
        return;
      }
      const opt = p.package_option || {};
      const fam = p.package_family || {};
      const variant = p.package_detail_variant || {};
      const benefits = (opt.benefits || []).map((b) =>
        '<div class="card" style="box-shadow:none"><strong>' + escapeHtml(b.name) + '</strong><div class="muted">' +
        escapeHtml(b.data_type) + " · total " + escapeHtml(b.total) + (b.is_unlimited ? " · unlimited" : "") +
        "</div></div>"
      ).join("") || '<div class="muted">Tidak ada benefit</div>';

      openModal(
        '<div class="section-title"><h2>' + escapeHtml(fam.name || "") + " · " + escapeHtml(variant.name || "") + " · " + escapeHtml(opt.name || optionCode) + '</h2>' +
        '<button class="secondary" id="closeModalBtn">Tutup</button></div>' +
        '<div class="row"><span class="pill">' + money(opt.price) + '</span>' +
        '<span class="pill">' + escapeHtml(opt.validity || "-") + '</span>' +
        '<span class="pill">' + escapeHtml(fam.payment_for || "BUY_PACKAGE") + '</span></div>' +
        '<div style="margin-top:14px" class="list">' + benefits + '</div>' +
        '<div class="grid-2" style="margin-top:14px">' +
          '<div><label>Family code</label><input readonly value="' + escapeHtml(fam.package_family_code || "") + '">' +
          '<label>Option code</label><input readonly value="' + escapeHtml(opt.package_option_code || optionCode) + '"></div>' +
          '<div><label>Token confirmation</label><textarea readonly>' + escapeHtml(p.token_confirmation || "") + '</textarea></div>' +
        '</div>' +
        '<h3 style="margin:18px 0 8px">Pembayaran</h3>' +
        '<div class="pay-grid">' +
          '<button data-pay="balance">1. Pulsa</button>' +
          '<button data-pay="balance-decoy">4. Pulsa + Decoy</button>' +
          '<button data-pay="balance-decoy-v2">5. Pulsa + Decoy V2</button>' +
          '<button data-pay="balance-decoy-custom">5.5 Pulsa + Decoy Custom</button>' +
          '<button data-pay="qris">3. QRIS</button>' +
          '<button data-pay="qris-decoy">6. QRIS + Decoy</button>' +
          '<button data-pay="qris0-decoy">7. QRIS0 + Decoy</button>' +
          '<button data-pay="ewallet">2. E-Wallet</button>' +
          '<button data-pay="n-times">8. Pulsa N×</button>' +
          ((fam.payment_for === "REDEEM_VOUCHER")
            ? '<button data-pay="bounty">B. Bonus</button><button data-pay="loyalty">L. Poin</button><button data-pay="allot">BA. Kirim Bonus</button>'
            : "") +
          '<button class="secondary" data-pay="bookmark">0. Bookmark</button>' +
        '</div>' +
        '<div id="payResult" style="margin-top:14px"></div>' +
        '<details style="margin-top:14px"><summary>Raw JSON</summary><pre>' + escapeHtml(JSON.stringify(res, null, 2)) + '</pre></details>'
      );

      $("closeModalBtn").onclick = closeModal;
      document.querySelectorAll("[data-pay]").forEach((btn) => {
        btn.onclick = () => handlePay(btn.dataset.pay, p).catch((e) => {
          $("payResult").innerHTML = '<div class="status">' + escapeHtml(e.message) + "</div>";
        });
      });
      setStatus("");
    }

    function itemFromPackage(p) {
      const opt = p.package_option || {};
      return {
        item_code: opt.package_option_code,
        product_type: "",
        item_price: opt.price || 0,
        item_name: opt.name || "",
        tax: 0,
        token_confirmation: p.token_confirmation || "",
      };
    }

    function toUrlSafeB64(text) {
      return btoa(unescape(encodeURIComponent(text || "")))
        .replace(/\\+/g, "-")
        .replace(/\\//g, "_")
        .replace(/=+$/g, "");
    }

    function renderQrisBox(res) {
      const q = encodeURIComponent(res.qr_code || "");
      return '<div class="qrbox"><div class="muted">Transaction: ' + escapeHtml(res.transaction_id) + "</div>" +
        '<img alt="QRIS" src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + q + '">' +
        '<div class="row" style="justify-content:center"><a target="_blank" href="https://ki-ar-kod.netlify.app/?data=' +
        toUrlSafeB64(res.qr_code || "") +
        '">Buka viewer</a><button class="secondary" id="copyQrisBtn">Copy QRIS</button></div></div><pre>' +
        escapeHtml(res.qr_code || "") + "</pre>";
    }

    // Popup ringkas setelah pembelian sukses. Menerima body settlement
    // (res.data) dari balance/n-times: { status, data: { details[], payment_method, total_amount, transaction_code } }.
    function showPurchaseSuccess(res, fallbackName, fallbackMethod) {
      const body = res?.data?.data || res?.data || {};
      const settlementStatus = res?.data?.status || body.status || "";
      const details = Array.isArray(body.details) ? body.details : [];
      const method = body.payment_method || fallbackMethod || "-";
      const total = body.total_amount != null ? body.total_amount : null;
      const trxCode = body.transaction_code || "-";

      const itemRows = (details.length
        ? details.map((d) =>
            '<div class="row" style="justify-content:space-between;margin:0;gap:8px">' +
            '<span>' + escapeHtml(d.name || d.code || "-") + '</span>' +
            '<span class="muted">' + (d.amount ? money(d.amount) : "Rp 0") +
            ' · <span class="pill ' + (String(d.status).toUpperCase() === "SUCCESS" ? "ok" : "bad") + '">' + escapeHtml(d.status || "-") + '</span></span>' +
            "</div>")
        : ['<div class="muted">' + escapeHtml(fallbackName || "-") + "</div>"]
      ).join("");

      openModal(
        '<div class="section-title"><h2>✅ Pembelian Berhasil</h2>' +
        '<button class="secondary" id="closeSuccessBtn">Tutup</button></div>' +
        '<div class="row"><span class="pill ok">' + escapeHtml(settlementStatus || "SUCCESS") + '</span>' +
        '<span class="pill">Metode: ' + escapeHtml(method) + '</span>' +
        (total != null ? '<span class="pill">Total: ' + money(total) + '</span>' : "") + '</div>' +
        '<div class="card" style="margin-top:14px"><h3>Paket</h3><div class="list" style="gap:6px">' + itemRows + '</div></div>' +
        '<div class="grid-2" style="margin-top:12px">' +
          '<div><label>Transaction Code</label><input readonly value="' + escapeHtml(trxCode) + '"></div>' +
          '<div><label>Total</label><input readonly value="' + (total != null ? money(total) : "-") + '"></div>' +
        '</div>' +
        '<details style="margin-top:12px"><summary>Raw JSON</summary><pre>' + escapeHtml(JSON.stringify(res, null, 2)) + '</pre></details>'
      );
      const close = $("closeSuccessBtn");
      if (close) close.onclick = closeModal;
    }

    async function handlePay(kind, packageData) {
      const item = itemFromPackage(packageData);
      const paymentFor = packageData.package_family?.payment_for || "BUY_PACKAGE";
      const box = $("payResult");
      if (!confirm("Konfirmasi aksi: " + kind + " untuk " + (item.item_name || item.item_code) + "?")) return;
      box.innerHTML = '<div class="muted">Memproses ' + escapeHtml(kind) + "...</div>";

      if (kind === "bookmark") {
        const famCode = packageData.package_family?.package_family_code || "";
        if (!famCode) {
          box.innerHTML = '<div class="status">Paket ini tidak punya family code, tidak bisa di-bookmark.</div>';
          return;
        }
        await api("/api/bookmarks", {
          method: "POST",
          body: JSON.stringify({
            family_code: famCode,
            family_name: packageData.package_family?.name || "",
            is_enterprise: !!packageData.extra?.is_enterprise,
            variant_name: packageData.package_detail_variant?.name || packageData.extra?.variant_name || "",
            option_name: item.item_name,
            option_order: packageData.extra?.order || 0,
          }),
        });
        box.innerHTML = '<div class="pill ok">Bookmark ditambahkan</div>';
        return;
      }

      if (kind === "balance" || kind === "balance-decoy" || kind === "balance-decoy-v2" || kind === "balance-decoy-custom") {
        const useDecoy = kind !== "balance";
        const custom = kind === "balance-decoy-custom";
        const pf = kind === "balance-decoy-v2" ? "🤫" : (kind === "balance-decoy-custom" ? "🗿" : paymentFor);
        // Overwrite amount hanya untuk beli Pulsa langsung (tanpa decoy). Decoy
        // menghitung total sendiri di server, jadi tidak ditawari overwrite.
        let overwriteAmount = null;
        if (!useDecoy) {
          const def = String(item.item_price || 0);
          const ans = prompt("Total harga (Rp). Kosongkan untuk pakai harga default:", def);
          if (ans === null) return;
          const trimmed = ans.trim();
          if (trimmed !== "" && trimmed !== def) {
            const n = Number(trimmed);
            if (!Number.isFinite(n) || n < 0) { box.innerHTML = '<div class="status">Nominal tidak valid.</div>'; return; }
            overwriteAmount = n;
          }
        }
        const res = await api("/api/purchase/balance", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            payment_for: pf,
            items: [item],
            use_decoy: useDecoy,
            decoy_type: "balance",
            custom_decoy: custom,
            overwrite_amount: overwriteAmount,
            token_confirmation_idx: useDecoy ? 1 : 0,
          }),
        });
        const st = res.data?.status || res.data?.data?.status;
        if (st === "SUCCESS") {
          showPurchaseSuccess(res, item.item_name, "BALANCE");
        } else {
          box.innerHTML = "<pre>" + escapeHtml(JSON.stringify(res, null, 2)) + "</pre>";
        }
        return;
      }

      if (kind === "qris" || kind === "qris-decoy" || kind === "qris0-decoy") {
        const useDecoy = kind !== "qris";
        const decoyType = kind === "qris0-decoy" ? "qris0" : "qris";
        const res = await api("/api/purchase/qris", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            payment_for: useDecoy ? "SHARE_PACKAGE" : paymentFor,
            items: [item],
            use_decoy: useDecoy,
            decoy_type: decoyType,
            token_confirmation_idx: useDecoy ? 1 : 0,
          }),
        });
        box.innerHTML = renderQrisBox(res);
        const copyBtn = $("copyQrisBtn");
        if (copyBtn) copyBtn.onclick = async () => {
          try { await navigator.clipboard.writeText(res.qr_code || ""); copyBtn.textContent = "Copied"; }
          catch { copyBtn.textContent = "Copy gagal"; }
        };
        return;
      }

      if (kind === "ewallet") {
        const method = prompt("Metode: DANA / SHOPEEPAY / GOPAY / OVO", "DANA");
        if (!method) return;
        let wallet = "";
        if (method === "DANA" || method === "OVO") {
          wallet = prompt("Nomor e-wallet (08...)", "") || "";
        }
        const res = await api("/api/purchase/ewallet", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            payment_for: paymentFor,
            payment_method: method,
            wallet_number: wallet,
            items: [item],
          }),
        });
        const deeplink = res.data?.data?.deeplink || res.data?.deeplink || "";
        box.innerHTML = (deeplink
          ? '<div class="row"><a target="_blank" href="' + escapeHtml(deeplink) + '">Buka deeplink pembayaran</a></div>'
          : "") + "<pre>" + escapeHtml(JSON.stringify(res, null, 2)) + "</pre>";
        return;
      }

      if (kind === "n-times") {
        const times = Number(prompt("Berapa kali? (max 20)", "2") || "1");
        const useDecoy = confirm("Pakai decoy?");
        const res = await api("/api/purchase/n-times", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            times,
            use_decoy: useDecoy,
            decoy_type: "balance",
            items: [item],
            payment_for: useDecoy ? "🤫" : paymentFor,
            token_confirmation_idx: useDecoy ? 1 : 0,
          }),
        });
        box.innerHTML = "<pre>" + escapeHtml(JSON.stringify(res, null, 2)) + "</pre>";
        return;
      }

      if (kind === "bounty") {
        const res = await api("/api/purchase/bounty", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            token_confirmation: packageData.token_confirmation,
            ts_to_sign: packageData.timestamp,
            payment_target: item.item_code,
            price: item.item_price,
            item_name: item.item_name,
          }),
        });
        box.innerHTML = "<pre>" + escapeHtml(JSON.stringify(res, null, 2)) + "</pre>";
        return;
      }

      if (kind === "loyalty") {
        const res = await api("/api/purchase/loyalty", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            token_confirmation: packageData.token_confirmation,
            ts_to_sign: packageData.timestamp,
            payment_target: item.item_code,
            price: item.item_price,
          }),
        });
        box.innerHTML = "<pre>" + escapeHtml(JSON.stringify(res, null, 2)) + "</pre>";
        return;
      }

      if (kind === "allot") {
        const destination = prompt("Nomor tujuan bonus (628...)", "");
        if (!destination) return;
        const res = await api("/api/purchase/bounty-allotment", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            token_confirmation: packageData.token_confirmation,
            ts_to_sign: packageData.timestamp,
            payment_target: item.item_code,
            item_name: item.item_name,
            destination_msisdn: destination,
          }),
        });
        box.innerHTML = "<pre>" + escapeHtml(JSON.stringify(res, null, 2)) + "</pre>";
      }
    }

    async function renderHome() {
      content().innerHTML = panel("Beranda",
        '<div class="grid-2">' +
          '<div class="card"><h3>Ringkasan</h3><div class="muted">Pilih menu di kiri untuk fitur yang sama seperti CLI: multi-akun, paket, HOT, store, family, circle, purchase, tools.</div>' +
          '<div class="row"><button data-go="accounts">Kelola Akun</button><button class="secondary" data-go="packages">Paket Saya</button><button class="secondary" data-go="buy">Cari Paket</button></div></div>' +
          '<div class="card"><h3>Dashboard raw</h3><pre>' + escapeHtml(JSON.stringify(state.dashboard || {}, null, 2)) + "</pre></div>" +
        "</div>"
      );
      content().querySelectorAll("[data-go]").forEach((b) => b.onclick = () => { state.section = b.dataset.go; render(); });
    }

    async function renderAccounts() {
      setStatus("Memuat akun...");
      const data = await api("/api/accounts");
      const rows = (data.accounts || []).map((a) =>
        '<tr><td>' + escapeHtml(a.number) + (a.active ? ' <span class="pill ok">aktif</span>' : "") +
        "</td><td>" + escapeHtml(a.subscription_type || "-") + "</td><td>" + escapeHtml(a.subscriber_id || "-") +
        '</td><td class="row" style="margin:0">' +
        (!a.active ? '<button data-switch="' + escapeHtml(a.number) + '">Aktifkan</button><button class="danger" data-del="' + escapeHtml(a.number) + '">Hapus</button>' : "") +
        "</td></tr>"
      ).join("") || '<tr><td colspan="4">Belum ada akun</td></tr>';

      content().innerHTML = panel("Akun",
        '<div class="grid-2">' +
          '<div class="card"><h3>Daftar akun</h3><table><thead><tr><th>Nomor</th><th>Tipe</th><th>Subscriber</th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
          '<div class="card"><h3>Tambah / Login OTP</h3>' +
            '<label>Nomor XL</label><input id="phone" placeholder="628...">' +
            '<div class="row"><button id="otpBtn">Request OTP</button></div>' +
            '<label>Kode OTP</label><input id="otp" placeholder="6 digit">' +
            '<div class="row"><button id="submitBtn">Submit OTP</button></div>' +
          "</div>" +
        "</div>"
      );

      content().querySelectorAll("[data-switch]").forEach((b) => b.onclick = async () => {
        await api("/api/accounts/switch", { method: "POST", body: JSON.stringify({ number: b.dataset.switch }) });
        await loadMe(); await loadDashboard(); render();
      });
      content().querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => {
        if (!confirm("Hapus akun " + b.dataset.del + "?")) return;
        await api("/api/accounts/" + encodeURIComponent(b.dataset.del), { method: "DELETE" });
        render();
      });
      $("otpBtn").onclick = async () => {
        try {
          setStatus("Request OTP...");
          const res = await api("/api/auth/request-otp", { method: "POST", body: JSON.stringify({ contact: $("phone").value.trim() }) });
          setStatus("OTP terkirim. Subscriber: " + (res.subscriber_id || "-"));
        } catch (e) { setStatus(e.message); }
      };
      $("submitBtn").onclick = async () => {
        try {
          setStatus("Submit OTP...");
          await api("/api/auth/submit-otp", {
            method: "POST",
            body: JSON.stringify({ contact: $("phone").value.trim(), code: $("otp").value.trim() }),
          });
          await loadMe(); await loadDashboard(); setStatus("Login berhasil"); render();
        } catch (e) { setStatus(e.message); }
      };
      setStatus("");
    }

    async function renderPackages() {
      setStatus("Memuat paket saya...");
      const res = await api("/api/packages/mine");
      const quotas = res.data?.data?.quotas || res.data?.quotas || [];
      const cards = quotas.map((q, idx) => {
        const benefits = (q.benefits || []).map((b) => {
          const type = b.data_type;
          let val;
          if (type === "DATA") val = formatQuotaByte(b.remaining) + " / " + formatQuotaByte(b.total);
          else if (type === "VOICE") val = (b.remaining / 60).toFixed(2) + " / " + (b.total / 60).toFixed(2) + " menit";
          else if (type === "TEXT") val = b.remaining + " / " + b.total + " SMS";
          else val = b.remaining + " / " + b.total;
          return '<div class="muted">• ' + escapeHtml(b.name || "") + ": " + escapeHtml(val) + "</div>";
        }).join("");
        return '<div class="card"><h3>' + (idx + 1) + ". " + escapeHtml(q.name || q.quota_code) + "</h3>" +
        '<div class="muted">' + escapeHtml(q.group_name || "") + "</div>" +
        (benefits ? '<div style="margin:8px 0">' + benefits + "</div>" : "") +
        '<div class="row">' +
          '<button data-detail="' + escapeHtml(q.quota_code) + '">Detail</button>' +
          '<button class="danger" data-unsub="' + escapeHtml(q.quota_code) + '" data-domain="' + escapeHtml(q.product_domain || "") + '" data-stype="' + escapeHtml(q.product_subscription_type || "") + '">Unsubscribe</button>' +
        "</div></div>";
      }).join("") || '<div class="muted">Tidak ada paket</div>';
      content().innerHTML = panel("Paket Saya", '<div class="list">' + cards + "</div>");
      content().querySelectorAll("[data-detail]").forEach((b) => b.onclick = () => showPackageDetail(b.dataset.detail));
      content().querySelectorAll("[data-unsub]").forEach((b) => b.onclick = async () => {
        if (!confirm("Unsubscribe paket ini?")) return;
        await api("/api/packages/unsubscribe", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            quota_code: b.dataset.unsub,
            product_domain: b.dataset.domain,
            product_subscription_type: b.dataset.stype,
          }),
        });
        render();
      });
      setStatus("");
    }

    async function renderHot() {
      setStatus("Memuat HOT...");
      const [hot, hot2] = await Promise.all([api("/api/catalog/hot"), api("/api/catalog/hot2")]);
      const hotCards = (hot.data || []).map((p, i) =>
        '<div class="card"><h3>' + (i + 1) + ". " + escapeHtml(p.family_name) + " · " + escapeHtml(p.variant_name) + " · " + escapeHtml(p.option_name) + "</h3>" +
        '<div class="muted">' + escapeHtml(p.family_code) + '</div><div class="row"><button data-hot="' + i + '">Buka</button></div></div>'
      ).join("");
      const hot2Cards = (hot2.data || []).map((p, i) =>
        '<div class="card"><h3>' + escapeHtml(p.name) + '</h3><div class="muted">' + escapeHtml(p.price) + " · " + escapeHtml(p.detail || "") +
        '</div><div class="row"><button class="secondary" data-hot2="' + i + '">Resolve & Bayar</button></div></div>'
      ).join("");
      content().innerHTML = panel("HOT Packages",
        '<div class="tabs"><button class="active" data-tab="hot1">HOT</button><button data-tab="hot2">HOT-2</button></div>' +
        '<div id="hot1" class="list">' + hotCards + '</div>' +
        '<div id="hot2" class="list hidden">' + hot2Cards + "</div>"
      );
      content().querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => {
        content().querySelectorAll("[data-tab]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        $("hot1").classList.toggle("hidden", b.dataset.tab !== "hot1");
        $("hot2").classList.toggle("hidden", b.dataset.tab !== "hot2");
      });
      content().querySelectorAll("[data-hot]").forEach((b) => b.onclick = async () => {
        const p = hot.data[Number(b.dataset.hot)];
        const fam = await api("/api/packages/family?code=" + encodeURIComponent(p.family_code) + "&enterprise=" + !!p.is_enterprise);
        let optionCode = null;
        for (const variant of fam.data?.package_variants || []) {
          if (variant.name !== p.variant_name) continue;
          for (const option of variant.package_options || []) {
            if (option.order === p.order) optionCode = option.package_option_code;
          }
        }
        if (!optionCode) throw new Error("Option tidak ditemukan di family");
        await showPackageDetail(optionCode, { order: p.order });
      });
      content().querySelectorAll("[data-hot2]").forEach((b) => b.onclick = async () => {
        const pack = hot2.data[Number(b.dataset.hot2)];
        setStatus("Resolve HOT2...");
        const items = [];
        for (const child of pack.packages || []) {
          const detail = await api("/api/packages/resolve", {
            method: "POST",
            body: JSON.stringify({
              family_code: child.family_code,
              variant_code: child.variant_code,
              order: child.order,
              is_enterprise: child.is_enterprise,
              migration_type: child.migration_type,
            }),
          });
          if (!detail.data) throw new Error("Gagal resolve salah satu package HOT2");
          items.push(itemFromPackage(detail.data));
        }
        const method = prompt("Metode: balance / qris / ewallet", "balance");
        if (!method) return;
        if (!confirm("Bayar HOT2 " + pack.name + " dengan " + items.length + " item?")) return;
        let res;
        if (method === "qris") {
          res = await api("/api/purchase/qris", {
            method: "POST",
            body: JSON.stringify({
              confirm: true,
              items,
              payment_for: pack.payment_for || "BUY_PACKAGE",
              overwrite_amount: pack.overwrite_amount,
              token_confirmation_idx: pack.token_confirmation_idx || 0,
              amount_idx: pack.amount_idx ?? -1,
            }),
          });
        } else if (method === "ewallet") {
          const pm = prompt("DANA/SHOPEEPAY/GOPAY/OVO", "DANA");
          res = await api("/api/purchase/ewallet", {
            method: "POST",
            body: JSON.stringify({
              confirm: true,
              items,
              payment_method: pm,
              payment_for: pack.payment_for || "BUY_PACKAGE",
              overwrite_amount: pack.overwrite_amount,
              token_confirmation_idx: pack.token_confirmation_idx || 0,
            }),
          });
        } else {
          res = await api("/api/purchase/balance", {
            method: "POST",
            body: JSON.stringify({
              confirm: true,
              items,
              payment_for: pack.payment_for || "BUY_PACKAGE",
              overwrite_amount: pack.overwrite_amount,
              token_confirmation_idx: pack.token_confirmation_idx || 0,
            }),
          });
        }
        openModal('<h2>HOT2 result</h2><pre>' + escapeHtml(JSON.stringify(res, null, 2)) + '</pre><div class="row"><button id="closeModalBtn">Tutup</button></div>');
        $("closeModalBtn").onclick = closeModal;
        setStatus("");
      });
      setStatus("");
    }

    async function renderBuy() {
      content().innerHTML = panel("Cari Paket",
        '<div class="grid-2">' +
          '<div class="card"><h3>By Option Code</h3><label>Option code</label><input id="optionCode"><div class="row"><button id="optBtn">Buka Detail</button></div></div>' +
          '<div class="card"><h3>By Family Code</h3><label>Family code</label><input id="familyCode"><label>Enterprise</label><select id="familyEnt"><option value="auto">auto</option><option value="false">false</option><option value="true">true</option></select><div class="row"><button id="famBtn">Load Family</button></div></div>' +
        '</div><div id="buyResult" style="margin-top:14px"></div>'
      );
      $("optBtn").onclick = async () => {
        try { await showPackageDetail($("optionCode").value.trim()); }
        catch (e) { setStatus(e.message); }
      };
      $("famBtn").onclick = async () => {
        try {
          setStatus("Load family...");
          const ent = $("familyEnt").value;
          let path = "/api/packages/family?code=" + encodeURIComponent($("familyCode").value.trim());
          if (ent !== "auto") path += "&enterprise=" + ent;
          const res = await api(path);
          const variants = res.data?.package_variants || [];
          let html = '<div class="card"><h3>' + escapeHtml(res.data?.package_family?.name || "Family") + '</h3><div class="list">';
          for (const variant of variants) {
            html += '<div><strong>' + escapeHtml(variant.name) + "</strong>";
            for (const option of variant.package_options || []) {
              html += '<div class="row" style="align-items:center"><span>' + escapeHtml(option.order + ". " + option.name + " · " + money(option.price)) +
                '</span><button data-code="' + escapeHtml(option.package_option_code) + '" data-order="' + option.order + '">Detail</button></div>';
            }
            html += "</div>";
          }
          html += "</div></div>";
          $("buyResult").innerHTML = html;
          $("buyResult").querySelectorAll("button[data-code]").forEach((b) => b.onclick = () => showPackageDetail(b.dataset.code, { order: Number(b.dataset.order) }));
          setStatus("");
        } catch (e) { setStatus(e.message); }
      };
    }

    async function renderStore() {
      content().innerHTML = panel("Store",
        '<div class="tabs">' +
          '<button class="active" data-store="segments">Segments</button>' +
          '<button data-store="families">Family List</button>' +
          '<button data-store="packages">Packages</button>' +
          '<button data-store="redeemables">Redeemables</button>' +
        '</div>' +
        '<label><input type="checkbox" id="enterprise"> Enterprise</label>' +
        '<div class="row"><button id="storeLoad">Load</button></div>' +
        '<div id="storeOut" style="margin-top:14px"></div>'
      );
      let mode = "segments";
      content().querySelectorAll("[data-store]").forEach((b) => b.onclick = () => {
        content().querySelectorAll("[data-store]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        mode = b.dataset.store;
      });
      $("storeLoad").onclick = async () => {
        try {
          setStatus("Load store...");
          const ent = $("enterprise").checked ? "true" : "false";
          let res;
          if (mode === "segments") res = await api("/api/store/segments?enterprise=" + ent);
          if (mode === "families") res = await api("/api/store/families?enterprise=" + ent + "&subsType=" + encodeURIComponent(state.dashboard?.subscription_type || "PREPAID"));
          if (mode === "packages") res = await api("/api/store/packages?enterprise=" + ent + "&subsType=" + encodeURIComponent(state.dashboard?.subscription_type || "PREPAID"));
          if (mode === "redeemables") res = await api("/api/store/redeemables?enterprise=" + ent);
          const out = $("storeOut");
          if (mode === "segments") {
            const segments = res.data?.data?.store_segments || res.data?.store_segments || [];
            out.innerHTML = segments.map((seg) =>
              '<div class="card"><h3>' + escapeHtml(seg.title) + "</h3>" +
              (seg.banners || []).map((banner) =>
                '<div class="row" style="justify-content:space-between"><div><strong>' + escapeHtml(banner.family_name || banner.title) +
                '</strong><div class="muted">' + money(banner.discounted_price) + " · " + escapeHtml(banner.validity || "") +
                '</div></div>' + (banner.action_type === "PDP"
                  ? '<button data-pdp="' + escapeHtml(banner.action_param) + '">Detail</button>' : "") + "</div>"
              ).join("") + "</div>"
            ).join("") || '<div class="muted">Kosong</div>';
          } else if (mode === "families") {
            const list = res.data?.data?.results || res.data?.results || [];
            out.innerHTML = '<div class="list">' + list.map((f) =>
              '<div class="card row" style="justify-content:space-between"><div><strong>' + escapeHtml(f.label) +
              '</strong><div class="muted">' + escapeHtml(f.id) + '</div></div><button data-family="' + escapeHtml(f.id) + '">Buka</button></div>'
            ).join("") + "</div>";
          } else if (mode === "packages") {
            const list = res.data?.data?.results_price_only || res.data?.results_price_only || [];
            out.innerHTML = '<div class="list">' + list.map((p) =>
              '<div class="card row" style="justify-content:space-between"><div><strong>' + escapeHtml(p.title) +
              '</strong><div class="muted">' + escapeHtml(p.family_name || "") + " · " + money(p.discounted_price || p.original_price) +
              '</div></div>' + (p.action_type === "PDP" ? '<button data-pdp="' + escapeHtml(p.action_param) + '">Detail</button>' : "") + "</div>"
            ).join("") + "</div>";
          } else {
            const cats = res.data?.data?.categories || res.data?.categories || [];
            out.innerHTML = cats.map((cat) =>
              '<div class="card"><h3>' + escapeHtml(cat.category_name) + "</h3>" +
              (cat.redeemables || []).map((r) =>
                '<div class="row" style="justify-content:space-between"><div><strong>' + escapeHtml(r.name) +
                '</strong><div class="muted">' + escapeHtml(r.action_type) + '</div></div>' +
                (r.action_type === "PDP" ? '<button data-pdp="' + escapeHtml(r.action_param) + '">Detail</button>' :
                 r.action_type === "PLP" ? '<button data-family="' + escapeHtml(r.action_param) + '">Family</button>' : "") +
                "</div>"
              ).join("") + "</div>"
            ).join("") || '<div class="muted">Kosong</div>';
          }
          out.querySelectorAll("[data-pdp]").forEach((b) => b.onclick = () => showPackageDetail(b.dataset.pdp));
          out.querySelectorAll("[data-family]").forEach((b) => b.onclick = async () => {
            state.section = "buy";
            await render();
            $("familyCode").value = b.dataset.family;
            $("famBtn").click();
          });
          setStatus("");
        } catch (e) { setStatus(e.message); }
      };
    }

    async function renderFamily() {
      setStatus("Memuat family plan...");
      const res = await api("/api/family");
      const data = res.data?.data || res.data || {};
      const info = data.member_info || {};
      const members = info.members || [];
      if (!info.plan_type) {
        content().innerHTML = panel("Family Plan", '<div class="muted">Anda bukan organizer family plan.</div><pre>' + escapeHtml(JSON.stringify(res, null, 2)) + "</pre>");
        setStatus("");
        return;
      }
      const rows = members.map((m, i) =>
        '<tr><td>' + (i + 1) + "</td><td>" + escapeHtml(m.msisdn || "<empty>") + "</td><td>" + escapeHtml(m.alias || "") +
        "</td><td>" + escapeHtml(m.member_type || "") + "</td><td>" + escapeHtml(JSON.stringify(m.usage || {})) + "</td></tr>"
      ).join("");
      content().innerHTML = panel("Family Plan",
        '<div class="card"><strong>' + escapeHtml(info.plan_type) + "</strong> · parent " + escapeHtml(info.parent_msisdn || "") +
        '<div class="muted">Quota remaining/total: ' + escapeHtml(info.remaining_quota) + " / " + escapeHtml(info.total_quota) + "</div></div>" +
        '<table style="margin-top:12px"><thead><tr><th>#</th><th>MSISDN</th><th>Alias</th><th>Type</th><th>Usage</th></tr></thead><tbody>' + rows + "</tbody></table>" +
        '<div class="grid-2" style="margin-top:14px">' +
          '<div class="card"><h3>Change Member</h3>' +
            '<label>Slot number</label><input id="fmSlot" type="number">' +
            '<label>MSISDN baru</label><input id="fmMsisdn">' +
            '<label>Parent alias</label><input id="fmParent">' +
            '<label>Child alias</label><input id="fmAlias">' +
            '<div class="row"><button id="fmChange">Ganti</button></div></div>' +
          '<div class="card"><h3>Remove / Limit</h3>' +
            '<label>Slot number hapus</label><input id="fmDel" type="number">' +
            '<div class="row"><button class="danger" id="fmRemove">Hapus Member</button></div>' +
            '<label>Slot limit</label><input id="fmLimSlot" type="number">' +
            '<label>Quota MB</label><input id="fmLimMb" type="number">' +
            '<div class="row"><button id="fmLimit">Set Limit</button></div></div>' +
        "</div>"
      );
      $("fmChange").onclick = async () => {
        const idx = Number($("fmSlot").value) - 1;
        const member = members[idx];
        if (!member) return setStatus("Slot invalid");
        if (!confirm("Assign member ke slot ini?")) return;
        await api("/api/family/change-member", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            parent_alias: $("fmParent").value,
            alias: $("fmAlias").value,
            slot_id: member.slot_id,
            family_member_id: member.family_member_id,
            msisdn: $("fmMsisdn").value.trim(),
          }),
        });
        render();
      };
      $("fmRemove").onclick = async () => {
        const member = members[Number($("fmDel").value) - 1];
        if (!member || !confirm("Hapus member?")) return;
        await api("/api/family/remove-member", {
          method: "POST",
          body: JSON.stringify({ confirm: true, family_member_id: member.family_member_id }),
        });
        render();
      };
      $("fmLimit").onclick = async () => {
        const member = members[Number($("fmLimSlot").value) - 1];
        if (!member) return;
        const mb = Number($("fmLimMb").value);
        await api("/api/family/quota-limit", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            family_member_id: member.family_member_id,
            original_allocation: member.usage?.quota_allocated || 0,
            new_allocation: mb * 1024 * 1024,
          }),
        });
        render();
      };
      setStatus("");
    }

    async function renderCircle() {
      setStatus("Memuat circle...");
      const res = await api("/api/circle");
      const data = res.data || {};
      if (!data.group?.group_id) {
        content().innerHTML = panel("Circle",
          '<div class="muted">Belum ada Circle.</div>' +
          '<div class="card" style="margin-top:12px"><h3>Buat Circle</h3>' +
          '<label>Nama parent</label><input id="cParent"><label>Nama group</label><input id="cGroup">' +
          '<label>Member msisdn</label><input id="cMsisdn"><label>Member name</label><input id="cName">' +
          '<div class="row"><button id="cCreate">Create</button></div></div>'
        );
        $("cCreate").onclick = async () => {
          await api("/api/circle/create", {
            method: "POST",
            body: JSON.stringify({
              confirm: true,
              parent_name: $("cParent").value,
              group_name: $("cGroup").value,
              member_msisdn: $("cMsisdn").value,
              member_name: $("cName").value,
            }),
          });
          render();
        };
        setStatus("");
        return;
      }
      const members = data.members || [];
      const rows = members.map((m, i) =>
        '<tr><td>' + (i + 1) + "</td><td>" + escapeHtml(m.msisdn_plain || m.msisdn || "") + "</td><td>" + escapeHtml(m.member_name || "") +
        "</td><td>" + escapeHtml(m.member_role || "") + "</td><td>" + escapeHtml(m.status || "") +
        '</td><td class="row" style="margin:0">' +
        (m.member_role !== "PARENT" ? '<button class="danger" data-rm="' + escapeHtml(m.member_id) + '">Remove</button>' : "") +
        (m.status === "INVITED" ? '<button data-acc="' + escapeHtml(m.member_id) + '">Accept</button>' : "") +
        "</td></tr>"
      ).join("");
      content().innerHTML = panel("Circle",
        '<div class="card"><strong>' + escapeHtml(data.group.group_name) + "</strong> · " + escapeHtml(data.group.group_status) +
        '<div class="muted">Owner: ' + escapeHtml(data.group.owner_name || "") + "</div></div>" +
        '<table style="margin-top:12px"><thead><tr><th>#</th><th>MSISDN</th><th>Name</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>' + rows + "</tbody></table>" +
        '<div class="card" style="margin-top:14px"><h3>Invite</h3><label>MSISDN</label><input id="invMsisdn"><label>Name</label><input id="invName">' +
        '<div class="row"><button id="invBtn">Invite</button><button class="secondary" id="bonusBtn">Bonus List</button></div></div>' +
        '<pre style="margin-top:14px">' + escapeHtml(JSON.stringify(data.spending || {}, null, 2)) + "</pre>"
      );
      $("invBtn").onclick = async () => {
        await api("/api/circle/invite", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            msisdn: $("invMsisdn").value.trim(),
            name: $("invName").value.trim(),
            group_id: data.group.group_id,
            member_id_parent: data.parent_member_id,
          }),
        });
        render();
      };
      content().querySelectorAll("[data-rm]").forEach((b) => b.onclick = async () => {
        if (!confirm("Remove member?")) return;
        await api("/api/circle/remove", {
          method: "POST",
          body: JSON.stringify({
            confirm: true,
            member_id: b.dataset.rm,
            group_id: data.group.group_id,
            member_id_parent: data.parent_member_id,
            is_last_member: members.length <= 2,
          }),
        });
        render();
      });
      content().querySelectorAll("[data-acc]").forEach((b) => b.onclick = async () => {
        await api("/api/circle/accept", {
          method: "POST",
          body: JSON.stringify({ confirm: true, group_id: data.group.group_id, member_id: b.dataset.acc }),
        });
        render();
      });
      $("bonusBtn").onclick = async () => {
        const bonus = await api("/api/circle/bonuses?parent_subs_id=" + encodeURIComponent(data.parent_subs_id) + "&family_id=" + encodeURIComponent(data.group.group_id));
        openModal('<h2>Circle Bonuses</h2><pre>' + escapeHtml(JSON.stringify(bonus, null, 2)) + '</pre><button id="closeModalBtn">Tutup</button>');
        $("closeModalBtn").onclick = closeModal;
      };
      setStatus("");
    }

    async function renderDecoy() {
      setStatus("Memuat konfigurasi decoy custom...");
      const res = await api("/api/custom-decoy?payment_type=balance");
      const d = res.data || {};
      content().innerHTML = panel("Decoy Custom",
        '<div class="card"><h3>Decoy Custom (untuk menu 5.5 Pulsa + Decoy Custom)</h3>' +
        '<div class="muted">Definisi paket decoy ini disimpan khusus untuk akun kamu. Isi parameter paket decoy yang ingin digabung saat pembelian.</div>' +
        '<div class="grid-2" style="margin-top:12px">' +
          '<div><label>Family code</label><input id="dFamily" value="' + escapeHtml(d.family_code || "") + '"></div>' +
          '<div><label>Variant code</label><input id="dVariant" value="' + escapeHtml(d.variant_code || "") + '"></div>' +
          '<div><label>Option order</label><input id="dOrder" inputmode="numeric" value="' + escapeHtml(d.option_order != null ? d.option_order : "") + '"></div>' +
          '<div><label>Price (harga override, angka)</label><input id="dPrice" inputmode="numeric" value="' + escapeHtml(d.price != null ? d.price : "") + '"></div>' +
          '<div><label>Migration type</label><input id="dMigration" value="' + escapeHtml(d.migration_type || "NONE") + '"></div>' +
          '<div><label>Enterprise?</label><select id="dEnt"><option value="0"' + (d.is_enterprise ? "" : " selected") + '>Tidak</option><option value="1"' + (d.is_enterprise ? " selected" : "") + '>Ya</option></select></div>' +
          '<div><label>Family name (opsional)</label><input id="dFamName" value="' + escapeHtml(d.family_name || "") + '"></div>' +
          '<div><label>Option name (opsional)</label><input id="dOptName" value="' + escapeHtml(d.option_name || "") + '"></div>' +
        '</div>' +
        '<div class="row"><button id="dSave">Simpan</button></div>' +
        (d.updated_at ? '<div class="muted" style="margin-top:8px">Terakhir diubah: ' + escapeHtml(new Date(d.updated_at * 1000).toLocaleString("id-ID")) + "</div>" : "") +
        "</div>"
      );
      $("dSave").onclick = async () => {
        try {
          if (!$("dFamily").value.trim() || !$("dVariant").value.trim()) {
            setStatus("Family code & variant code wajib diisi");
            return;
          }
          await api("/api/custom-decoy", {
            method: "POST",
            body: JSON.stringify({
              payment_type: "balance",
              family_code: $("dFamily").value.trim(),
              variant_code: $("dVariant").value.trim(),
              option_order: Number($("dOrder").value.trim() || "0"),
              price: Number($("dPrice").value.trim() || "0"),
              migration_type: $("dMigration").value.trim() || "NONE",
              is_enterprise: $("dEnt").value === "1",
              family_name: $("dFamName").value.trim(),
              option_name: $("dOptName").value.trim(),
            }),
          });
          setStatus("Decoy custom tersimpan.");
          render();
        } catch (e) { setStatus(e.message); }
      };
      setStatus("");
    }

    async function renderBookmarks() {
      setStatus("Memuat bookmark...");
      const res = await api("/api/bookmarks");
      const list = res.bookmarks || [];
      content().innerHTML = panel("Bookmark",
        '<div class="list">' + (list.map((b) =>
          '<div class="card row" style="justify-content:space-between"><div><strong>' + escapeHtml(b.family_name) + " · " + escapeHtml(b.variant_name) + " · " + escapeHtml(b.option_name) +
          '</strong><div class="muted">' + escapeHtml(b.family_code) + "</div></div>" +
          '<div class="row" style="margin:0"><button data-open="' + escapeHtml(b.family_code) + '" data-variant="' + escapeHtml(b.variant_name) + '" data-order="' + b.option_order + '">Buka</button>' +
          '<button class="danger" data-del="' + b.id + '">Hapus</button></div></div>'
        ).join("") || '<div class="muted">Kosong</div>') + "</div>"
      );
      content().querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => {
        await api("/api/bookmarks/" + b.dataset.del, { method: "DELETE" });
        render();
      });
      content().querySelectorAll("[data-open]").forEach((b) => b.onclick = async () => {
        const fam = await api("/api/packages/family?code=" + encodeURIComponent(b.dataset.open));
        for (const variant of fam.data?.package_variants || []) {
          if (variant.name !== b.dataset.variant) continue;
          for (const option of variant.package_options || []) {
            if (String(option.order) === String(b.dataset.order)) {
              await showPackageDetail(option.package_option_code, { order: option.order });
              return;
            }
          }
        }
        setStatus("Bookmark option tidak ditemukan");
      });
      setStatus("");
    }

    async function renderHistory() {
      setStatus("Memuat riwayat...");
      const res = await api("/api/transactions");
      const list = res.data?.list || [];
      content().innerHTML = panel("Riwayat Transaksi",
        '<table><thead><tr><th>Judul</th><th>Harga</th><th>Metode</th><th>Status</th><th>Waktu</th></tr></thead><tbody>' +
        (list.map((t) => '<tr><td>' + escapeHtml(t.title) + "</td><td>" + escapeHtml(t.price) + "</td><td>" + escapeHtml(t.payment_method_label) +
          "</td><td>" + escapeHtml(t.status) + " / " + escapeHtml(t.payment_status) + "</td><td>" + escapeHtml(t.formated_date || t.timestamp) +
          "</td></tr>").join("") || '<tr><td colspan="5">Kosong</td></tr>') +
        "</tbody></table>"
      );
      setStatus("");
    }

    async function renderNotifications() {
      setStatus("Memuat notifikasi...");
      const res = await api("/api/notifications");
      const list = res.data?.data?.notification?.data || [];
      content().innerHTML = panel("Notifikasi",
        '<div class="list">' + (list.map((n) =>
          '<div class="card"><div class="row" style="justify-content:space-between"><strong>' + escapeHtml(n.brief_message || "") +
          '</strong><span class="pill ' + (n.is_read ? "ok" : "bad") + '">' + (n.is_read ? "READ" : "UNREAD") + "</span></div>" +
          '<div class="muted">' + escapeHtml(n.timestamp || "") + "</div><div>" + escapeHtml(n.full_message || "") + "</div>" +
          (!n.is_read ? '<div class="row"><button data-read="' + escapeHtml(n.notification_id) + '">Mark read</button></div>' : "") +
          "</div>"
        ).join("") || '<div class="muted">Kosong</div>') + "</div>"
      );
      content().querySelectorAll("[data-read]").forEach((b) => b.onclick = async () => {
        await api("/api/notifications/" + encodeURIComponent(b.dataset.read), { method: "POST", body: "{}" });
        render();
      });
      setStatus("");
    }

    async function renderTools() {
      content().innerHTML = panel("Tools",
        '<div class="grid-2">' +
          '<div class="card"><h3>Validate MSISDN</h3><label>MSISDN</label><input id="valMsisdn"><div class="row"><button id="valBtn">Validate</button></div><pre id="valOut">{}</pre></div>' +
          '<div class="card"><h3>Register Dukcapil</h3><label>MSISDN</label><input id="dukMsisdn"><label>NIK</label><input id="dukNik"><label>KK</label><input id="dukKk"><div class="row"><button id="dukBtn">Submit</button></div><pre id="dukOut">{}</pre></div>' +
        "</div>"
      );
      $("valBtn").onclick = async () => {
        const res = await api("/api/tools/validate-msisdn", { method: "POST", body: JSON.stringify({ msisdn: $("valMsisdn").value.trim() }) });
        $("valOut").textContent = JSON.stringify(res, null, 2);
      };
      $("dukBtn").onclick = async () => {
        if (!confirm("Kirim data dukcapil?")) return;
        const res = await api("/api/tools/dukcapil", {
          method: "POST",
          body: JSON.stringify({
            msisdn: $("dukMsisdn").value.trim(),
            nik: $("dukNik").value.trim(),
            kk: $("dukKk").value.trim(),
          }),
        });
        $("dukOut").textContent = JSON.stringify(res, null, 2);
      };
    }

    async function render() {
      renderNav();
      updateTop();
      try {
        if (state.section === "home") await renderHome();
        else if (state.section === "accounts") await renderAccounts();
        else if (state.section === "packages") await renderPackages();
        else if (state.section === "hot") await renderHot();
        else if (state.section === "buy") await renderBuy();
        else if (state.section === "store") await renderStore();
        else if (state.section === "family") await renderFamily();
        else if (state.section === "circle") await renderCircle();
        else if (state.section === "bookmarks") await renderBookmarks();
        else if (state.section === "history") await renderHistory();
        else if (state.section === "notifications") await renderNotifications();
        else if (state.section === "decoy") await renderDecoy();
        else if (state.section === "tools") await renderTools();
      } catch (e) {
        content().innerHTML = panel(SECTIONS.find((x) => x[0] === state.section)?.[1] || "Menu",
          '<div class="card"><div class="status">' + escapeHtml(e.message) + '</div>' +
          (String(e.message).toLowerCase().includes("login") || String(e.message).toLowerCase().includes("aktif")
            ? '<div class="row"><button id="goAccounts">Ke menu Akun</button></div>' : "") +
          "</div>");
        const btn = document.getElementById("goAccounts");
        if (btn) btn.onclick = () => { state.section = "accounts"; render(); };
      }
    }

    $("logoutBtn").onclick = async () => {
      await fetch("/api/account/logout", { method: "POST" });
      state.me = null; state.dashboard = null; state.section = "home";
      showAuth("login");
    };
    $("refreshTopBtn").onclick = async () => {
      try { await loadMe(); await loadDashboard(); setStatus("Refreshed"); render(); }
      catch (e) { setStatus(e.message); render(); }
    };

    // ---- Responsive nav drawer ----
    $("navToggle").onclick = openNav;
    $("navClose").onclick = closeNav;
    $("navBackdrop").onclick = closeNav;
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });

    // ---- Browser account auth gate ----
    let authMode = "login";

    function showAuth(mode) {
      authMode = mode || "login";
      $("authOverlay").classList.remove("hidden");
      $("tabLogin").classList.toggle("active", authMode === "login");
      $("tabRegister").classList.toggle("active", authMode === "register");
      $("authConfirmWrap").classList.toggle("hidden", authMode !== "register");
      $("authSubmit").textContent = authMode === "login" ? "Login" : "Daftar";
      $("authPass").setAttribute("autocomplete", authMode === "login" ? "current-password" : "new-password");
      $("authHint").textContent = authMode === "login"
        ? "Belum punya akun? Klik tab Daftar untuk membuat akun baru."
        : "Sudah punya akun? Klik tab Login.";
      $("authStatus").textContent = "";
    }
    function hideAuth() { $("authOverlay").classList.add("hidden"); }

    $("tabLogin").onclick = () => showAuth("login");
    $("tabRegister").onclick = () => showAuth("register");

    $("authForm").onsubmit = async (e) => {
      e.preventDefault();
      const username = $("authUser").value.trim();
      const password = $("authPass").value;
      if (!username || !password) { $("authStatus").textContent = "Username dan password wajib."; return; }
      if (authMode === "register" && password !== $("authPass2").value) {
        $("authStatus").textContent = "Konfirmasi password tidak sama."; return;
      }
      $("authSubmit").disabled = true;
      $("authStatus").textContent = authMode === "login" ? "Masuk..." : "Membuat akun...";
      try {
        await api("/api/account/" + authMode, { method: "POST", body: JSON.stringify({ username, password }) });
        $("authPass").value = ""; if ($("authPass2")) $("authPass2").value = "";
        hideAuth();
        await boot();
      } catch (err) {
        $("authStatus").textContent = err.message;
      } finally {
        $("authSubmit").disabled = false;
      }
    };

    async function boot() {
      try { await loadMe(); if (state.me?.number) await loadDashboard(); } catch {}
      render();
    }

    (async () => {
      try {
        const status = await api("/api/account/me");
        if (status.authenticated) { hideAuth(); await boot(); }
        else showAuth("login");
      } catch {
        showAuth("login");
      }
    })();
  </script>
</body>
</html>`, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
