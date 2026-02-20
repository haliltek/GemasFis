/**
 * Firebase Service Layer
 * Uses mock data for development - to be replaced with real Firebase SDK calls
 * after you configure your Firebase project in src/constants/config.ts
 */

import { Receipt, MonthlyStats, User } from '../types';

// ─── MOCK DATA ────────────────────────────────────────────────
let mockReceipts: Receipt[] = [
    {
        id: 'receipt_001',
        userId: 'user_001',
        userName: 'Ahmet Yılmaz',
        imageUrl:
            'https://via.placeholder.com/400x600/1E1E2E/6C63FF?text=Fiş+1',
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
        logoExpenseName: 'Ofis Giderleri',
        logoCashAccountCode: 'KA-001',
        logoCashAccountName: 'Ana Kasa',
        aiConfidenceScore: 0.95,
        createdAt: new Date('2026-02-15T10:30:00'),
        updatedAt: new Date('2026-02-15T10:35:00'),
    },
    {
        id: 'receipt_002',
        userId: 'user_001',
        userName: 'Ahmet Yılmaz',
        imageUrl:
            'https://via.placeholder.com/400x600/1E1E2E/00D4AA?text=Fiş+2',
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
        logoExpenseName: 'Araç Giderleri',
        aiConfidenceScore: 0.88,
        createdAt: new Date('2026-02-18T14:20:00'),
        updatedAt: new Date('2026-02-18T14:22:00'),
    },
    {
        id: 'receipt_003',
        userId: 'user_001',
        userName: 'Ahmet Yılmaz',
        imageUrl:
            'https://via.placeholder.com/400x600/1E1E2E/FF6B6B?text=Fiş+3',
        amount: 2350.00,
        currency: 'TRY',
        date: '2026-02-19',
        merchantName: 'İstanbul Havalimanı Restoran',
        description: 'Müşteri yemek gideri',
        kdvAmount: 352.50,
        kdvRate: 18,
        logoStatus: 'failed',
        logoErrorMessage: 'Logo API bağlantı hatası: Timeout',
        aiConfidenceScore: 0.72,
        createdAt: new Date('2026-02-19T19:45:00'),
        updatedAt: new Date('2026-02-19T19:50:00'),
    },
    {
        id: 'receipt_004',
        userId: 'user_001',
        userName: 'Ahmet Yılmaz',
        imageUrl:
            'https://via.placeholder.com/400x600/1E1E2E/FFB347?text=Fiş+4',
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
];

const mockUser: User = {
    uid: 'user_001',
    email: 'ahmet.yilmaz@gemas.com.tr',
    displayName: 'Ahmet Yılmaz',
    role: 'manager',
    department: 'Satış & Pazarlama',
    createdAt: new Date('2025-01-01'),
};

// ─── AUTH MOCK ────────────────────────────────────────────────
export const authService = {
    async signIn(email: string, password: string): Promise<User> {
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 1200));

        if (email && password.length >= 6) {
            return mockUser;
        }
        throw new Error('Geçersiz email veya şifre');
    },

    async signOut(): Promise<void> {
        await new Promise((r) => setTimeout(r, 300));
    },

    async resetPassword(email: string): Promise<void> {
        await new Promise((r) => setTimeout(r, 800));
        if (!email.includes('@')) throw new Error('Geçersiz email adresi');
    },

    onAuthStateChanged(callback: (user: User | null) => void): () => void {
        // Simulate auto-login check
        setTimeout(() => callback(null), 500);
        return () => { };
    },
};

// ─── RECEIPT MOCK ─────────────────────────────────────────────
export const receiptService = {
    async getReceipts(userId: string): Promise<Receipt[]> {
        await new Promise((r) => setTimeout(r, 600));
        return mockReceipts.filter((r) => r.userId === userId);
    },

    async getReceiptById(id: string): Promise<Receipt | null> {
        await new Promise((r) => setTimeout(r, 300));
        return mockReceipts.find((r) => r.id === id) || null;
    },

    async createReceipt(
        data: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<Receipt> {
        await new Promise((r) => setTimeout(r, 800));
        const newReceipt: Receipt = {
            ...data,
            id: `receipt_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        mockReceipts = [newReceipt, ...mockReceipts];
        return newReceipt;
    },

    async updateReceipt(id: string, data: Partial<Receipt>): Promise<void> {
        await new Promise((r) => setTimeout(r, 400));
        mockReceipts = mockReceipts.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: new Date() } : r
        );
    },

    async deleteReceipt(id: string): Promise<void> {
        await new Promise((r) => setTimeout(r, 300));
        mockReceipts = mockReceipts.filter((r) => r.id !== id);
    },

    async getMonthlyStats(
        userId: string,
        month: string
    ): Promise<MonthlyStats> {
        await new Promise((r) => setTimeout(r, 500));
        const userReceipts = mockReceipts.filter((r) => r.userId === userId);
        const total = userReceipts.reduce((s, r) => s + r.amount, 0);

        return {
            totalAmount: total,
            totalCount: userReceipts.length,
            successCount: userReceipts.filter(
                (r) => r.logoStatus === 'success'
            ).length,
            failedCount: userReceipts.filter(
                (r) => r.logoStatus === 'failed'
            ).length,
            pendingCount: userReceipts.filter(
                (r) =>
                    r.logoStatus === 'pending' ||
                    r.logoStatus === 'draft' ||
                    r.logoStatus === 'processing'
            ).length,
            currency: 'TRY',
            month,
            categoryBreakdown: [
                {
                    code: 'GID.OFIS',
                    name: 'Ofis Giderleri',
                    amount: 1250.5,
                    count: 1,
                    percentage: 13.2,
                },
                {
                    code: 'GID.ARAC',
                    name: 'Araç Giderleri',
                    amount: 4800,
                    count: 1,
                    percentage: 50.7,
                },
                {
                    code: 'GID.YMK',
                    name: 'Yemek Giderleri',
                    amount: 2350,
                    count: 1,
                    percentage: 24.8,
                },
                {
                    code: 'GID.DIV',
                    name: 'Diğer',
                    amount: 680,
                    count: 1,
                    percentage: 11.3,
                },
            ],
        };
    },
};

// ─── FILE UPLOAD MOCK ─────────────────────────────────────────
export const storageService = {
    async uploadReceipt(
        imageUri: string,
        userId: string,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        // Simulate upload with progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise((r) => setTimeout(r, 150));
            onProgress?.(i);
        }
        // Return mock URL
        return `https://via.placeholder.com/400x600/1E1E2E/6C63FF?text=Uploaded`;
    },
};

// ─── CLOUD FUNCTIONS MOCK ─────────────────────────────────────
export const cloudFunctions = {
    async analyzeReceipt(imageBase64: string): Promise<{
        ocrData: any;
        aiSuggestions: any[];
        confidence: number;
    }> {
        // Simulate Gemini AI analysis delay
        await new Promise((r) => setTimeout(r, 3000));

        return {
            ocrData: {
                rawText:
                    'MİGROS TİCARET A.Ş.\nVergi No: 1234567890\nTarih: 20.02.2026\nTopla: 1.250,50 TL\nKDV: 187,58 TL',
                confidence: 0.95,
                merchantName: 'Migros Ticaret A.Ş.',
                taxNumber: '1234567890',
                totalAmount: 1250.5,
                kdvAmount: 187.58,
                currency: 'TRY',
                date: '2026-02-20',
                lineItems: [
                    {
                        description: 'A4 Kağıt 500 Yaprak',
                        quantity: 5,
                        unitPrice: 125.0,
                        totalPrice: 625.0,
                        kdvRate: 18,
                    },
                    {
                        description: 'Kalemlik & Masa Aksesuarları',
                        quantity: 1,
                        unitPrice: 437.92,
                        totalPrice: 437.92,
                        kdvRate: 18,
                    },
                ],
            },
            aiSuggestions: [
                {
                    serviceCode: 'GID.OFIS',
                    serviceName: 'Ofis & Kırtasiye Giderleri',
                    confidence: 0.91,
                    reason: 'Fişte ofis malzemeleri (kağıt, kalemlik) mevcut',
                },
                {
                    serviceCode: 'GID.GEN',
                    serviceName: 'Genel Giderler',
                    confidence: 0.72,
                    reason: 'Alternatif genel gider kalemi',
                },
                {
                    serviceCode: 'GID.YNT',
                    serviceName: 'Yönetim Giderleri',
                    confidence: 0.45,
                    reason: 'Yönetim ofisi malzemeleri olabilir',
                },
            ],
            confidence: 0.95,
        };
    },

    async transferToLogo(payload: {
        receiptId: string;
        expenseCode: string;
        cashAccountCode: string;
        description?: string;
    }): Promise<{ success: boolean; logoRefNo?: string; error?: string }> {
        await new Promise((r) => setTimeout(r, 2000));

        // Simulate 90% success rate
        if (Math.random() > 0.1) {
            return {
                success: true,
                logoRefNo: `GDR-2026-${String(Date.now()).slice(-6)}`,
            };
        }
        return {
            success: false,
            error: 'Logo REST API bağlantı zaman aşımı',
        };
    },

    async getLogoServiceCards(): Promise<any[]> {
        await new Promise((r) => setTimeout(r, 600));
        return [
            {
                code: 'GID.OFIS',
                name: 'Ofis & Kırtasiye Giderleri',
                type: 'expense',
                kdvRate: 18,
            },
            {
                code: 'GID.ARAC',
                name: 'Araç & Ulaşım Giderleri',
                type: 'expense',
                kdvRate: 18,
            },
            {
                code: 'GID.YMK',
                name: 'Yemek & Temsil Giderleri',
                type: 'expense',
                kdvRate: 18,
            },
            {
                code: 'GID.OTL',
                name: 'Otel & Konaklama Giderleri',
                type: 'expense',
                kdvRate: 18,
            },
            {
                code: 'GID.TLS',
                name: 'Telefon & İletişim Giderleri',
                type: 'expense',
                kdvRate: 18,
            },
            {
                code: 'GID.BLG',
                name: 'Bilgisayar & Teknoloji Giderleri',
                type: 'expense',
                kdvRate: 18,
            },
            {
                code: 'GID.RKL',
                name: 'Reklam & Pazarlama Giderleri',
                type: 'expense',
                kdvRate: 18,
            },
            {
                code: 'GID.GEN',
                name: 'Genel Giderler',
                type: 'expense',
                kdvRate: 18,
            },
        ];
    },

    async getLogoCashAccounts(): Promise<any[]> {
        await new Promise((r) => setTimeout(r, 400));
        return [
            { code: 'KA-001', name: 'Ana Kasa (TL)', type: 'cash', currency: 'TRY' },
            {
                code: 'KA-002',
                name: 'Döviz Kasa (USD)',
                type: 'cash',
                currency: 'USD',
            },
            { code: 'BK-001', name: 'İş Bankası Vadesiz', type: 'bank', currency: 'TRY' },
            { code: 'BK-002', name: 'Garanti BBVA Vadesiz', type: 'bank', currency: 'TRY' },
            {
                code: 'KK-001',
                name: 'Kurumsal Kredi Kartı',
                type: 'credit_card',
                currency: 'TRY',
            },
        ];
    },
};
