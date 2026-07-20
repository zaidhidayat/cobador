export interface Env {
  DB: D1Database;
  BASE_API_URL?: string;
  BASE_CIAM_URL?: string;
  BASIC_AUTH?: string;
  API_KEY?: string;
  UA?: string;
  XDATA_KEY?: string;
  AX_API_SIG_KEY?: string;
  X_API_BASE_SECRET?: string;
  AX_FP_KEY?: string;
  ENCRYPTED_FIELD_KEY?: string;
  APP_SESSION_SECRET?: string;
  APP_VERSION?: string;
  AX_REQUEST_DEVICE?: string;
  AX_REQUEST_DEVICE_MODEL?: string;
  AX_SUBSTYPE?: string;
}

export interface AppConfig {
  baseApiUrl: string;
  baseCiamUrl: string;
  basicAuth: string;
  apiKey: string;
  userAgent: string;
  xdataKey: string;
  axApiSigKey: string;
  xApiBaseSecret: string;
  axFpKey: string;
  encryptedFieldKey: string;
  sessionSecret: string;
  appVersion: string;
  axRequestDevice: string;
  axRequestDeviceModel: string;
  axSubstype: string;
  /** Encrypted AES fingerprint, stable across requests (persisted in D1). */
  axFingerprint: string;
  /** MD5 device id derived from the fingerprint. */
  axDeviceId: string;
}

export interface Tokens {
  refresh_token: string;
  access_token: string;
  id_token: string;
  [key: string]: unknown;
}

export interface Account {
  client_id: string;
  number: string;
  subscriber_id: string | null;
  subscription_type: string | null;
  refresh_token: string;
  access_token: string | null;
  id_token: string | null;
  token_updated_at: number;
}

export interface ClientSession {
  /** Application user id. Also used as clientId so MyXL accounts bind to the user. */
  userId: string;
  clientId: string;
  username: string;
  activeNumber: string | null;
  exp: number;
}

export interface PaymentItem {
  item_code: string;
  product_type: string;
  item_price: number;
  item_name: string;
  tax: number;
  token_confirmation: string;
}

export interface ActiveContext {
  session: ClientSession;
  tokens: Tokens;
  number: string;
  account: Account;
}

export interface CustomDecoy {
  client_id: string;
  payment_type: string;
  family_code: string;
  variant_code: string;
  option_order: number;
  is_enterprise: number;
  migration_type: string;
  price: number;
  family_name: string;
  option_name: string;
  updated_at: number;
}
