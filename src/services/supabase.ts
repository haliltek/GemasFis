/**
 * ─────────────────────────────────────────────────────────────
 *  GemasFiş — Supabase Service Layer
 * ─────────────────────────────────────────────────────────────
 *
 *  Architecture:
 *   • Auth    → Supabase Auth (email/password, row-level security)
 *   • DB      → Supabase PostgreSQL  (receipts, users, logo_transfer_logs)
 *   • Storage → Supabase Storage     (receipt images bucket)
 *   • AI/OCR  → Supabase Edge Function: analyze-receipt  (calls Gemini Vision API)
 *   • Logo    → Supabase Edge Function: transfer-to-logo  (Logo REST bridge, runs server-side)
 *
 *  Development mode:
 *   Set USE_MOCK = true to run fully offline with realistic test data.
 *   Set USE_MOCK = false after configuring src/constants/config.ts with
 *   your real Supabase project credentials.
 * ─────────────────────────────────────────────────────────────
 */

import { EDGE_FUNCTIONS, APP_CONFIG } from '../constants/config';
import { Receipt, MonthlyStats, User, OcrAnalysisResponse, LogoTransferResponse } from '../types/index';

// ─── Toggle this flag for dev/prod ────────────────────────────
const USE_MOCK = true;

// ─────────────────────────────────────────────────────────────
// MOCK DATA  (realistic, used when USE_MOCK = true)
// ─────────────────────────────────────────────────────────────
let mockReceipts: Receipt[] = [
    {
        id: 'r_001',
        userId: 'user_001',
        userName: 'Ahmet Yılmaz',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        amount: 1250.50,
        currency: 'TRY',
        date: '2026-02-15',
        merchantName: 'Migros Ticaret A.Ş.',
        description: 'Ofis malzemeleri alımı',
        taxNumber: '1234567890',
        kdvAmount: 187.58,
        kdvRate: 18,
        logoStatus: 'success',
        logoRefNo: 'GDR-2026-001234',
        logoExpenseCode: 'GID.OFIS',
        logoExpenseName: 'Ofis & Kırtasiye Giderleri',
        logoCashAccountCode: 'KA-001',
        logoCashAccountName: 'Ana Kasa (TL)',
        aiConfidenceScore: 0.95,
        logoTransferredAt: new Date('2026-02-15T10:35:00'),
        createdAt: new Date('2026-02-15T10:30:00'),
        updatedAt: new Date('2026-02-15T10:35:00'),
    },
    {
        id: 'r_002',
        userId: 'user_001',
        userName: 'Ahmet Yılmaz',
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
        amount: 4800.00,
        currency: 'TRY',
        date: '2026-02-18',
        merchantName: 'Shell & Turcas Petrol A.Ş.',
        description: 'Araç yakıt gideri',
        taxNumber: '9876543210',
        kdvAmount: 720.00,
        kdvRate: 18,
        logoStatus: 'pending',
        logoExpenseCode: 'GID.ARAC',
        logoExpenseName: 'Araç & Ulaşım Giderleri',
        aiConfidenceScore: 0.88,
        createdAt: new Date('2026-02-18T14:20:00'),
        updatedAt: new Date('2026-02-18T14:22:00'),
    },
    {
        id: 'r_003',
        userId: 'user_001',
        userName: 'Ahmet Yılmaz',
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
        amount: 2350.00,
        currency: 'TRY',
        date: '2026-02-19',
        merchantName: 'İstanbul Havalimanı Restoran',
        description: 'Müşteri yemek gideri',
        kdvAmount: 352.50,
        kdvRate: 18,
        logoStatus: 'failed',
        logoErrorMessage: 'Logo API bağlantı hatası: Connection timeout (30s)',
        aiConfidenceScore: 0.72,
        createdAt: new Date('2026-02-19T19:45:00'),
        updatedAt: new Date('2026-02-19T19:50:00'),
    },
    {
        id: 'r_004',
        userId: 'user_001',
        userName: 'Ahmet Yılmaz',
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
        amount: 680.00,
        currency: 'TRY',
        date: '2026-02-20',
        merchantName: 'Koçtaş Yapı Market',
        description: 'Ofis tadilat malzemeleri',
        kdvAmount: 102.00,
        kdvRate: 18,
        logoStatus: 'draft',
        aiConfidenceScore: 0.91,
        createdAt: new Date('2026-02-20T08:00:00'),
        updatedAt: new Date('2026-02-20T08:05:00'),
    },
    {
        id: 'r_005',
        userId: 'user_001',
        userName: 'Ahmet Yılmaz',
        imageUrl: 'https://images.unsplash.com/photo-1565372781813-6a27ad563e7b?w=400',
        amount: 3420.00,
        currency: 'TRY',
        date: '2026-02-14',
        merchantName: 'Hilton İstanbul',
        description: 'Müşteri ziyareti otel konaklaması',
        taxNumber: '5556667770',
        kdvAmount: 513.00,
        kdvRate: 18,
        logoStatus: 'success',
        logoRefNo: 'GDR-2026-001198',
        logoExpenseCode: 'GID.OTL',
        logoExpenseName: 'Otel & Konaklama Giderleri',
        logoCashAccountCode: 'KK-001',
        logoCashAccountName: 'Kurumsal Kredi Kartı',
        aiConfidenceScore: 0.93,
        logoTransferredAt: new Date('2026-02-14T22:10:00'),
        createdAt: new Date('2026-02-14T21:30:00'),
        updatedAt: new Date('2026-02-14T22:10:00'),
    },
];

const mockUser: User = {
    uid: 'user_001',
    email: 'ahmet.yilmaz@gemas.com.tr',
    displayName: 'Ahmet Yılmaz',
    role: 'manager',
    department: 'Satış & Pazarlama',
    createdAt: new Date('2025-01-01'),
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────
export const authService = {
    async signIn(email: string, password: string): Promise<User> {
        if (USE_MOCK) {
            await delay(1200);
            if (!email || password.length < 6) throw new Error('Geçersiz email veya şifre');
            return mockUser;
        }

        // ── Real Supabase Auth ──
        const { getSupabase } = await import('../lib/supabase');
        const sb = getSupabase();
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);

        // Fetch additional user profile from public.users table
        const { data: profile } = await sb
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        return {
            uid: data.user.id,
            email: data.user.email!,
            displayName: profile?.display_name ?? data.user.email!,
            role: profile?.role ?? 'employee',
            department: profile?.department,
            avatarUrl: profile?.avatar_url,
            logoUserId: profile?.logo_user_id,
            createdAt: new Date(data.user.created_at),
        };
    },

    async signOut(): Promise<void> {
        if (USE_MOCK) { await delay(300); return; }
        const { getSupabase } = await import('../lib/supabase');
        await getSupabase().auth.signOut();
    },

    async resetPassword(email: string): Promise<void> {
        if (USE_MOCK) {
            await delay(800);
            if (!email.includes('@')) throw new Error('Geçersiz email adresi');
            return;
        }
        const { getSupabase } = await import('../lib/supabase');
        const { error } = await getSupabase().auth.resetPasswordForEmail(email);
        if (error) throw new Error(error.message);
    },

    onAuthStateChanged(callback: (user: User | null) => void): () => void {
        if (USE_MOCK) {
            setTimeout(() => callback(null), 500);
            return () => { };
        }
        const { getSupabase } = require('../lib/supabase');
        const sb = getSupabase();
        const { data: { subscription } } = sb.auth.onAuthStateChange(
            async (_event: any, session: any) => {
                if (!session) { callback(null); return; }
                const { data: profile } = await sb
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                callback({
                    uid: session.user.id,
                    email: session.user.email,
                    displayName: profile?.display_name ?? session.user.email,
                    role: profile?.role ?? 'employee',
                    department: profile?.department,
                    createdAt: new Date(session.user.created_at),
                });
            }
        );
        return () => subscription.unsubscribe();
    },
};

// ─────────────────────────────────────────────────────────────
// RECEIPT SERVICE  (Supabase table: receipts)
// ─────────────────────────────────────────────────────────────
export const receiptService = {
    async getReceipts(userId: string): Promise<Receipt[]> {
        if (USE_MOCK) {
            await delay(600);
            return mockReceipts.filter((r) => r.userId === userId);
        }
        const { getSupabase } = await import('../lib/supabase');
        const { data, error } = await getSupabase()
            .from('receipts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(APP_CONFIG.receiptPageSize);
        if (error) throw error;
        return (data ?? []).map(dbRowToReceipt);
    },

    async getReceiptById(id: string): Promise<Receipt | null> {
        if (USE_MOCK) {
            await delay(300);
            return mockReceipts.find((r) => r.id === id) ?? null;
        }
        const { getSupabase } = await import('../lib/supabase');
        const { data, error } = await getSupabase()
            .from('receipts')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return dbRowToReceipt(data);
    },

    async createReceipt(
        payload: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<Receipt> {
        if (USE_MOCK) {
            await delay(800);
            const rec: Receipt = {
                ...payload,
                id: `r_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockReceipts = [rec, ...mockReceipts];
            return rec;
        }
        const { getSupabase } = await import('../lib/supabase');
        const { data, error } = await getSupabase()
            .from('receipts')
            .insert([receiptToDbRow(payload)])
            .select()
            .single();
        if (error) throw error;
        return dbRowToReceipt(data);
    },

    async updateReceipt(id: string, updates: Partial<Receipt>): Promise<void> {
        if (USE_MOCK) {
            await delay(400);
            mockReceipts = mockReceipts.map((r) =>
                r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
            );
            return;
        }
        const { getSupabase } = await import('../lib/supabase');
        const { error } = await getSupabase()
            .from('receipts')
            .update({ ...receiptToDbRow(updates as any), updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteReceipt(id: string): Promise<void> {
        if (USE_MOCK) {
            await delay(300);
            mockReceipts = mockReceipts.filter((r) => r.id !== id);
            return;
        }
        // Soft delete
        const { getSupabase } = await import('../lib/supabase');
        await getSupabase()
            .from('receipts')
            .update({ is_deleted: true })
            .eq('id', id);
    },

    async getMonthlyStats(userId: string, month: string): Promise<MonthlyStats> {
        if (USE_MOCK) {
            await delay(500);
            const all = mockReceipts.filter((r) => r.userId === userId);
            const total = all.reduce((s, r) => s + r.amount, 0);
            return {
                totalAmount: total,
                totalCount: all.length,
                successCount: all.filter((r) => r.logoStatus === 'success').length,
                failedCount: all.filter((r) => r.logoStatus === 'failed').length,
                pendingCount: all.filter((r) => ['pending', 'draft', 'processing'].includes(r.logoStatus)).length,
                currency: 'TRY',
                month,
                categoryBreakdown: [
                    { code: 'GID.OFIS', name: 'Ofis Giderleri', amount: 1250.50, count: 1, percentage: 13.2 },
                    { code: 'GID.ARAC', name: 'Araç Giderleri', amount: 4800.00, count: 1, percentage: 38.7 },
                    { code: 'GID.YMK', name: 'Yemek Giderleri', amount: 2350.00, count: 1, percentage: 19.0 },
                    { code: 'GID.OTL', name: 'Konaklama Giderleri', amount: 3420.00, count: 1, percentage: 27.6 },
                    { code: 'GID.DIV', name: 'Diğer', amount: 680.00, count: 1, percentage: 5.5 },
                ],
            };
        }
        // Supabase: use a PostgreSQL RPC function for aggregated stats
        const { getSupabase } = await import('../lib/supabase');
        const { data, error } = await getSupabase().rpc('get_monthly_stats', {
            p_user_id: userId,
            p_month: month,
        });
        if (error) throw error;
        return data as MonthlyStats;
    },
};

// ─────────────────────────────────────────────────────────────
// STORAGE SERVICE  (Supabase Storage bucket: receipts)
// ─────────────────────────────────────────────────────────────
export const storageService = {
    async uploadReceipt(
        imageUri: string,
        userId: string,
        onProgress?: (pct: number) => void
    ): Promise<string> {
        if (USE_MOCK) {
            for (let i = 0; i <= 100; i += 20) {
                await delay(200);
                onProgress?.(i);
            }
            return 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400';
        }

        // ── Real Supabase Storage upload ──
        const { getSupabase } = await import('../lib/supabase');
        const sb = getSupabase();

        // Convert URI to Blob (React Native compatible)
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const ext = imageUri.split('.').pop() ?? 'jpg';
        const path = `${userId}/${Date.now()}.${ext}`;

        onProgress?.(20);
        const { data, error } = await sb.storage
            .from('receipts')
            .upload(path, blob, { contentType: `image/${ext}`, upsert: false });
        onProgress?.(90);

        if (error) throw error;

        const { data: urlData } = sb.storage.from('receipts').getPublicUrl(data.path);
        onProgress?.(100);
        return urlData.publicUrl;
    },
};

// ─────────────────────────────────────────────────────────────
// EDGE FUNCTIONS  (Supabase Edge Functions / Deno + Gemini)
// ─────────────────────────────────────────────────────────────
export const edgeFunctions = {
    /**
     * analyze-receipt edge function
     * → Receives a base64 image
     * → Calls Gemini Pro Vision API to extract OCR data
     * → Returns structured receipt fields + AI expense category suggestions
     */
    async analyzeReceipt(imageBase64: string): Promise<OcrAnalysisResponse> {
        if (USE_MOCK) {
            await delay(3000); // Simulate Gemini call
            return {
                ocrData: {
                    rawText:
                        'MİGROS TİCARET A.Ş.\nVergi No: 1234567890\nTarih: 20.02.2026\n' +
                        'A4 Kağıt (5 adet) ........ 625,00 ₺\nKalemlik ................ 437,92 ₺\n' +
                        '─────────────────────\nAra Toplam: 1.062,92 ₺\nKDV (%%18): 191,33 ₺\nTOPLAM: 1.254,25 ₺',
                    confidence: 0.95,
                    merchantName: 'Migros Ticaret A.Ş.',
                    taxNumber: '1234567890',
                    totalAmount: 1254.25,
                    kdvAmount: 191.33,
                    currency: 'TRY',
                    date: '2026-02-20',
                    lineItems: [
                        { description: 'A4 Kağıt 500 Yaprak', quantity: 5, unitPrice: 125.0, totalPrice: 625.0, kdvRate: 18 },
                        { description: 'Kalemlik & Masa Aksesuarları', quantity: 1, unitPrice: 437.92, totalPrice: 437.92, kdvRate: 18 },
                    ],
                },
                aiSuggestions: [
                    { serviceCode: 'GID.OFIS', serviceName: 'Ofis & Kırtasiye Giderleri', confidence: 0.92, reason: 'Ofis malzemeleri (kağıt, kalemlik) tespit edildi' },
                    { serviceCode: 'GID.GEN', serviceName: 'Genel Giderler', confidence: 0.61, reason: 'Alternatif genel gider kalemi' },
                    { serviceCode: 'GID.YNT', serviceName: 'Yönetim Giderleri', confidence: 0.38, reason: 'Yönetim ofisi malzemeleri olabilir' },
                ],
                confidence: 0.95,
            };
        }

        // ── Real call to Supabase Edge Function ──
        const { getSupabase } = await import('../lib/supabase');
        const { data, error } = await getSupabase().functions.invoke('analyze-receipt', {
            body: { imageBase64 },
        });
        if (error) throw new Error(error.message);
        return data as OcrAnalysisResponse;
    },

    /**
     * transfer-to-logo edge function
     * → Receives receipt details + Logo ERP field mapping
     * → Calls Logo REST API from server-side (private network safe)
     * → Returns Logo document reference number
     */
    async transferToLogo(payload: {
        receiptId: string;
        expenseCode: string;
        cashAccountCode: string;
        description?: string;
        projectCode?: string;
    }): Promise<LogoTransferResponse> {
        if (USE_MOCK) {
            await delay(2200);
            if (Math.random() > 0.15) {
                return { success: true, logoRefNo: `GDR-2026-${String(Date.now()).slice(-6)}` };
            }
            return { success: false, errorMessage: 'Logo REST API bağlantı zaman aşımı' };
        }
        const { getSupabase } = await import('../lib/supabase');
        const { data, error } = await getSupabase().functions.invoke('transfer-to-logo', {
            body: payload,
        });
        if (error) throw new Error(error.message);
        return data as LogoTransferResponse;
    },

    /**
     * get-logo-data edge function
     * → Fetches Logo service cards and cash accounts
     */
    async getLogoServiceCards(): Promise<any[]> {
        if (USE_MOCK) {
            await delay(600);
            return [
                { code: 'GID.OFIS', name: 'Ofis & Kırtasiye Giderleri', type: 'expense', kdvRate: 18 },
                { code: 'GID.ARAC', name: 'Araç & Ulaşım Giderleri', type: 'expense', kdvRate: 18 },
                { code: 'GID.YMK', name: 'Yemek & Temsil Giderleri', type: 'expense', kdvRate: 18 },
                { code: 'GID.OTL', name: 'Otel & Konaklama Giderleri', type: 'expense', kdvRate: 18 },
                { code: 'GID.TLS', name: 'Telefon & İletişim Giderleri', type: 'expense', kdvRate: 18 },
                { code: 'GID.BLG', name: 'Bilgisayar & Teknoloji Giderleri', type: 'expense', kdvRate: 18 },
                { code: 'GID.RKL', name: 'Reklam & Pazarlama Giderleri', type: 'expense', kdvRate: 18 },
                { code: 'GID.GEN', name: 'Genel Giderler', type: 'expense', kdvRate: 18 },
            ];
        }
        const { getSupabase } = await import('../lib/supabase');
        const { data, error } = await getSupabase().functions.invoke('get-logo-data', {
            body: { type: 'service_cards' },
        });
        if (error) throw new Error(error.message);
        return data;
    },

    async getLogoCashAccounts(): Promise<any[]> {
        if (USE_MOCK) {
            await delay(400);
            return [
                { code: 'KA-001', name: 'Ana Kasa (TL)', type: 'cash', currency: 'TRY' },
                { code: 'KA-002', name: 'Döviz Kasa (USD)', type: 'cash', currency: 'USD' },
                { code: 'BK-001', name: 'İş Bankası Vadesiz', type: 'bank', currency: 'TRY' },
                { code: 'BK-002', name: 'Garanti BBVA Vadesiz', type: 'bank', currency: 'TRY' },
                { code: 'KK-001', name: 'Kurumsal Kredi Kartı', type: 'credit_card', currency: 'TRY' },
            ];
        }
        const { getSupabase } = await import('../lib/supabase');
        const { data, error } = await getSupabase().functions.invoke('get-logo-data', {
            body: { type: 'cash_accounts' },
        });
        if (error) throw new Error(error.message);
        return data;
    },
};

// ─────────────────────────────────────────────────────────────
// DB ROW MAPPERS  (snake_case ↔ camelCase)
// ─────────────────────────────────────────────────────────────
function dbRowToReceipt(row: any): Receipt {
    return {
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        imageUrl: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        amount: row.amount,
        currency: row.currency,
        date: row.date,
        merchantName: row.merchant_name,
        description: row.description,
        taxNumber: row.tax_number,
        kdvAmount: row.kdv_amount,
        kdvRate: row.kdv_rate,
        logoStatus: row.logo_status,
        logoRefNo: row.logo_ref_no,
        logoExpenseCode: row.logo_expense_code,
        logoExpenseName: row.logo_expense_name,
        logoCashAccountCode: row.logo_cash_account_code,
        logoCashAccountName: row.logo_cash_account_name,
        logoProjectCode: row.logo_project_code,
        logoErrorMessage: row.logo_error_message,
        logoTransferredAt: row.logo_transferred_at ? new Date(row.logo_transferred_at) : undefined,
        rawOcrData: row.raw_ocr_data,
        aiSuggestions: row.ai_suggestions,
        aiConfidenceScore: row.ai_confidence_score,
        isDeleted: row.is_deleted,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function receiptToDbRow(r: Partial<Receipt>): Record<string, any> {
    return {
        user_id: r.userId,
        user_name: r.userName,
        image_url: r.imageUrl,
        thumbnail_url: r.thumbnailUrl,
        amount: r.amount,
        currency: r.currency,
        date: r.date,
        merchant_name: r.merchantName,
        description: r.description,
        tax_number: r.taxNumber,
        kdv_amount: r.kdvAmount,
        kdv_rate: r.kdvRate,
        logo_status: r.logoStatus,
        logo_ref_no: r.logoRefNo,
        logo_expense_code: r.logoExpenseCode,
        logo_expense_name: r.logoExpenseName,
        logo_cash_account_code: r.logoCashAccountCode,
        logo_cash_account_name: r.logoCashAccountName,
        logo_project_code: r.logoProjectCode,
        logo_error_message: r.logoErrorMessage,
        logo_transferred_at: r.logoTransferredAt?.toISOString(),
        raw_ocr_data: r.rawOcrData,
        ai_suggestions: r.aiSuggestions,
        ai_confidence_score: r.aiConfidenceScore,
    };
}
