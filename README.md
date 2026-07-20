# Dordoran Cloudflare Worker

Port penuh menu CLI Python (`me-cli-sunset`) ke web SPA serverless. Menu di web sekarang setara dengan CLI.

## Fitur (parity dengan CLI)

- **Akun browser (register/login)**: username + password disimpan di D1 (`users`), password PBKDF2-SHA256. Seluruh app wajib login dulu. Tiap user punya kumpulan akun MyBini sendiri (userId = clientId).
- Login OTP MyBini multi-akun + ganti akun aktif + hapus akun (D1 `client_accounts`), terikat ke user browser
- Dashboard: profile, balance, points/tier
- Paket Saya (quota-details) + unsubscribe
- HOT & HOT-2 (katalog dibundle dari `src/data/hot*.json`)
- Cari paket: by option code / by family code
- Store: segments, family list, packages search, redeemables
- Family Plan organizer: ganti member, hapus member, set limit kuota
- Circle: status grup, members (msisdn didekripsi), create, invite, remove, accept, bonus list
- Bookmark: list / tambah / hapus
- Riwayat transaksi
- Notifikasi
- Tools: validate MSISDN, register dukcapil
- Pembayaran di detail paket: Pulsa, Pulsa+Decoy (v1/v2/custom), QRIS, QRIS+Decoy, QRIS0+Decoy, E-Wallet (DANA/ShopeePay/GoPay/OVO), Pulsa N×, Bounty, Loyalty, Kirim Bonus (allotment)

Semua aksi purchase butuh `confirm=true` dan dicatat di `audit_log`.

## Arsitektur

```
src/
  index.ts              router API (thin)
  config.ts crypto.ts time.ts types.ts http.ts session.ts store.ts
  client/
    api.ts              sendApiRequest + signer payment
    ciam.ts             OTP, refresh, extend-session, profile
    packages.ts         family/option/addons/quota/unsubscribe/intercept
    profile.ts          transaction history, segments, notif detail
    storeApi.ts         store segments/family-list/search/redeemables
    family.ts           family plan
    circle.ts           circle + enkripsi msisdn
    registration.ts     dukcapil
    purchase/           common, balance, qris, ewallet, redeem(bounty/loyalty/allotment)
  catalog/
    hot.ts              hot/hot2 bundled
    decoy.ts            decoy catalog + cache D1
  data/                 JSON katalog (hot*, decoy-*)
  ui.ts                 SPA modern (HTML/CSS/JS satu file)
```

## Setup

1. `npm install`
2. `npx wrangler d1 create dordoran_db` → salin `database_id` yang muncul ke `wrangler.toml`
3. `npm run db:migrate:local` (lokal) / `npm run db:migrate` (remote)
4. Set konfigurasi rahasia — lihat bagian [Konfigurasi & Secret](#konfigurasi--secret)
5. `npm run dev`

## Konfigurasi & Secret

Config diambil `loadConfig()` dengan urutan: **env binding lebih dulu, lalu tabel D1 `app_settings`**. Jadi ada dua cara mengisinya. Pilih salah satu (secret direkomendasikan untuk nilai sensitif).

### Daftar variabel

11 variabel **wajib** (mirror `.env` CLI Python). Kalau salah satu kosong, Worker melempar `Missing Worker config: ...` saat request pertama:

| Key | Isi |
|-----|-----|
| `BASE_API_URL` | Base URL API MyBini |
| `BASE_CIAM_URL` | Base URL CIAM (OTP/token) |
| `BASIC_AUTH` | Basic auth header (base64) |
| `API_KEY` | API key |
| `UA` | User-Agent aplikasi |
| `XDATA_KEY` | Kunci enkripsi xdata |
| `AX_API_SIG_KEY` | Kunci signature Ax-Api |
| `X_API_BASE_SECRET` | Secret base signature |
| `AX_FP_KEY` | Kunci fingerprint |
| `ENCRYPTED_FIELD_KEY` | Kunci enkripsi field (msisdn circle) |
| `APP_SESSION_SECRET` | Secret HMAC cookie sesi — **buat acak sendiri**, bukan dari CLI |

4 variabel **opsional** (punya default, biasanya diset non-secret di `[vars]` `wrangler.toml`):

| Key | Default |
|-----|---------|
| `APP_VERSION` | `8.9.0` |
| `AX_REQUEST_DEVICE` | `samsung` |
| `AX_REQUEST_DEVICE_MODEL` | `SM-N935F` |
| `AX_SUBSTYPE` | `PREPAID` |

> `APP_SESSION_SECRET` menandatangani cookie login browser. Generate string acak panjang, misal:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
> atau `openssl rand -hex 32`. Jangan pakai nilai yang mudah ditebak.

### Cara 1 — Secret (produksi, direkomendasikan)

Simpan 11 nilai wajib sebagai encrypted secret (tidak tersimpan di `wrangler.toml`, tidak terlihat di dashboard):

```bash
# jalankan satu per satu, tempel nilainya saat diminta
wrangler secret put BASE_API_URL
wrangler secret put BASE_CIAM_URL
wrangler secret put BASIC_AUTH
wrangler secret put API_KEY
wrangler secret put UA
wrangler secret put XDATA_KEY
wrangler secret put AX_API_SIG_KEY
wrangler secret put X_API_BASE_SECRET
wrangler secret put AX_FP_KEY
wrangler secret put ENCRYPTED_FIELD_KEY
wrangler secret put APP_SESSION_SECRET
```

Loop cepat dari file `.env` (format `KEY=value` per baris):

```bash
while IFS='=' read -r k v; do
  [ -z "$k" ] || [ "${k#\#}" != "$k" ] && continue
  echo "$v" | wrangler secret put "$k"
done < .env
```

Lihat/hapus:

```bash
wrangler secret list
wrangler secret delete API_KEY
```

Yang opsional cukup di `[vars]` `wrangler.toml` (sudah ada default di sana).

### Cara 2 — Lokal (`.dev.vars`) untuk `npm run dev`

Secret di atas hanya untuk deployment remote. Untuk dev lokal, buat file `.dev.vars` di folder `worker/` (formatnya seperti `.env`, **jangan di-commit**):

```dotenv
BASE_API_URL=...
BASE_CIAM_URL=...
BASIC_AUTH=...
API_KEY=...
UA=...
XDATA_KEY=...
AX_API_SIG_KEY=...
X_API_BASE_SECRET=...
AX_FP_KEY=...
ENCRYPTED_FIELD_KEY=...
APP_SESSION_SECRET=<random-hex>
```

`wrangler dev` otomatis memuat `.dev.vars`. Pastikan sudah masuk `.gitignore`.

### Cara 3 — Simpan di D1 `app_settings`

Karena `loadConfig()` fallback ke tabel `app_settings`, nilai bisa juga di-seed langsung ke DB (berguna kalau ingin ubah config tanpa redeploy). Row kunci sudah dibuat kosong oleh `migrations/0002_settings_keys.sql`; tinggal di-`UPDATE`:

```bash
wrangler d1 execute dordoran_db --local \
  --command "UPDATE app_settings SET value='ISI_NILAI' WHERE key='API_KEY';"
# remote: ganti --local dengan --remote
```

Prioritas: **env/secret menang** atas nilai `app_settings`. Kalau sebuah key diisi di secret sekaligus di D1, yang dipakai adalah secret.

## Endpoint

### Akun browser (gate seluruh app)
- `POST /api/account/register` `{ username, password }` → buat user + auto-login
- `POST /api/account/login` `{ username, password }`
- `POST /api/account/logout`
- `GET /api/account/me` → `{ authenticated, username }`

Semua endpoint `/api/*` lain balas 401 kalau belum login browser.

### MyBini auth & akun (setelah login browser)
- `POST /api/auth/request-otp` `{ contact }`
- `POST /api/auth/submit-otp` `{ contact, code }`
- `POST /api/logout`
- `GET /api/me`
- `GET /api/accounts`
- `POST /api/accounts/switch` `{ number }`
- `DELETE /api/accounts/:number`

### Dashboard & paket
- `GET /api/dashboard`
- `GET /api/packages/mine`
- `POST /api/packages/unsubscribe`
- `GET /api/packages/option?code=`
- `GET /api/packages/family?code=&enterprise=`

### Katalog
- `GET /api/catalog/hot`
- `GET /api/catalog/hot2`
- `GET /api/decoy/:type?custom=`  (type: balance|qris|qris0)

### Store
- `GET /api/store/segments?enterprise=`
- `GET /api/store/families?subsType=&enterprise=`
- `GET /api/store/packages?subsType=&enterprise=&q=`
- `GET /api/store/redeemables?enterprise=`

### Bookmark / riwayat / notif / tools
- `GET|POST /api/bookmarks`, `DELETE /api/bookmarks/:id`
- `GET /api/transactions`
- `GET /api/notifications`
- `POST /api/tools/validate-msisdn`, `POST /api/tools/dukcapil`

### Family plan
- `GET /api/family`
- `POST /api/family/change-member` `/remove-member` `/quota-limit`

### Circle
- `GET /api/circle`
- `POST /api/circle/create` `/invite` `/remove` `/accept`

### Purchase (semua `confirm=true`)
- `POST /api/purchase/balance`
- `POST /api/purchase/qris`  → `{ transaction_id, qr_code }`
- `POST /api/purchase/ewallet`
- `POST /api/purchase/n-times`
- `POST /api/purchase/bounty` `/loyalty` `/bounty-allotment`

Body purchase menerima `items` langsung, atau resolve via `option_code`, atau `family_code`+`variant_code`+`option_order`. Decoy diaktifkan dengan `use_decoy`, `decoy_type`, `custom_decoy`.

## Catatan

- Sentry mode (polling file) CLI tidak diport — tidak cocok di Worker.
- Crypto mempertahankan salt payment `#ae-hei_...` agar signature cocok dengan server.
- Katalog hot/decoy dibundle (bukan filesystem runtime); decoy cache disimpan per-nomor di D1.
