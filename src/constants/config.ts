// ─── Supabase Config ──────────────────────────────────────────
// Reads from .env.local (EXPO_PUBLIC_ prefix is required for Expo)
export const supabaseConfig = {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://zroxzbuuavrhfaikvsym.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_9Qb6ee4ACZ4RvQhKEOBDhg_NazcOfgC',
};

// ─── Supabase Edge Functions ───────────────────────────────────
// Gemini-powered OCR and Logo ERP bridge live here
export const EDGE_FUNCTIONS_BASE =
    `${supabaseConfig.url}/functions/v1`;

export const EDGE_FUNCTIONS = {
    analyzeReceipt: `${EDGE_FUNCTIONS_BASE}/analyze-receipt`,  // Gemini Vision OCR
    transferToLogo: `${EDGE_FUNCTIONS_BASE}/transfer-to-logo`, // Logo REST bridge
    getLogoData: `${EDGE_FUNCTIONS_BASE}/get-logo-data`,    // Service cards / cash accounts
};

// ─── Logo ERP (used inside Edge Functions on the server) ──────
// These are set as Supabase Edge Function secrets, NOT exposed to the client
export const LOGO_API_CONFIG = {
    baseUrl: 'YOUR_LOGO_API_BASE_URL',  // e.g. http://192.168.1.100:9014
    firmNo: 'YOUR_FIRM_NO',            // e.g. '001'
    periodNo: 'YOUR_PERIOD_NO',          // e.g. '01'
};

// ─── App ──────────────────────────────────────────────────────
export const APP_CONFIG = {
    appName: 'GemasFiş',
    version: '1.0.0',
    defaultCurrency: 'TRY',
    supportedCurrencies: ['TRY', 'USD', 'EUR'],
    maxImageSizeMB: 5,
    receiptPageSize: 20,
};
