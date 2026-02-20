// ─── Supabase Config ──────────────────────────────────────────
// Reads from .env.local (EXPO_PUBLIC_ prefix is required for Expo)
export const supabaseConfig = {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://zroxzbuuavrhfaikvsym.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_9Qb6ee4ACZ4RvQhKEOBDhg_NazcOfgC',
};

// ─── Supabase Edge Functions ───────────────────────────────────
export const EDGE_FUNCTIONS_BASE =
    `${supabaseConfig.url}/functions/v1`;

export const EDGE_FUNCTIONS = {
    analyzeReceipt: `${EDGE_FUNCTIONS_BASE}/analyze-receipt`,
    transferToLogo: `${EDGE_FUNCTIONS_BASE}/transfer-to-logo`,
    getLogoData: `${EDGE_FUNCTIONS_BASE}/get-logo-data`,
};

// ─── App Config ───────────────────────────────────────────────
export const APP_CONFIG = {
    receiptPageSize: 50,
    maxImageSizeMB: 10,
    supportedCurrencies: ['TRY', 'USD', 'EUR', 'GBP'],
};
