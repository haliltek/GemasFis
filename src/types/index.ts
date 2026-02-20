// ─── User & Auth ──────────────────────────────────────────────
export interface User {
    uid: string;
    email: string;
    displayName: string;
    role: 'admin' | 'manager' | 'employee';
    department?: string;
    avatarUrl?: string;
    logoUserId?: string; // Logo ERP user reference
    createdAt: Date;
}

// ─── Receipt / Fiş ────────────────────────────────────────────
export type LogoStatus = 'pending' | 'processing' | 'success' | 'failed' | 'draft';

export interface OcrData {
    rawText: string;
    confidence: number;
    merchantName?: string;
    taxNumber?: string;
    totalAmount?: number;
    kdvAmount?: number;
    currency?: string;
    date?: string;
    lineItems?: OcrLineItem[];
}

export interface OcrLineItem {
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    kdvRate?: number;
}

export interface LogoServiceCard {
    code: string;
    name: string;
    type: string;
    accountCode?: string;
    kdvRate?: number;
}

export interface LogoCashAccount {
    code: string;
    name: string;
    type: 'cash' | 'bank' | 'credit_card';
    balance?: number;
    currency?: string;
}

export interface Receipt {
    id: string;
    userId: string;
    userName?: string;
    imageUrl: string;
    thumbnailUrl?: string;
    amount: number;
    currency: string;
    date: string; // ISO string
    merchantName: string;
    description?: string;
    taxNumber?: string;
    kdvAmount?: number;
    kdvRate?: number;

    // Logo ERP Fields
    logoStatus: LogoStatus;
    logoRefNo?: string;
    logoExpenseCode?: string; // Selected service card code
    logoExpenseName?: string; // Selected service card name
    logoCashAccountCode?: string; // Cash/Bank account
    logoCashAccountName?: string;
    logoProjectCode?: string;
    logoErrorMessage?: string;
    logoTransferredAt?: Date;

    // AI / OCR
    rawOcrData?: OcrData;
    aiSuggestions?: AiSuggestion[];
    aiConfidenceScore?: number;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    isDeleted?: boolean;
}

export interface AiSuggestion {
    serviceCode: string;
    serviceName: string;
    confidence: number;
    reason: string;
}

// ─── Statistics ───────────────────────────────────────────────
export interface MonthlyStats {
    totalAmount: number;
    totalCount: number;
    successCount: number;
    failedCount: number;
    pendingCount: number;
    currency: string;
    month: string; // YYYY-MM
    categoryBreakdown?: CategoryBreakdown[];
}

export interface CategoryBreakdown {
    code: string;
    name: string;
    amount: number;
    count: number;
    percentage: number;
}

// ─── Navigation Params ────────────────────────────────────────
export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
};

export type AuthStackParamList = {
    Login: undefined;
    ForgotPassword: undefined;
};

export type MainTabParamList = {
    Dashboard: undefined;
    Scan: undefined;
    History: undefined;
    Profile: undefined;
};

export type MainStackParamList = {
    MainTabs: undefined;
    ReceiptDetail: { receiptId: string };
    ReceiptReview: { imageUri: string; ocrData?: OcrData };
    ReceiptForm: { imageUri: string; receiptId?: string; ocrData?: OcrData };
    LogoTransfer: { receiptId: string };
    Notifications: undefined;
    Settings: undefined;
};

// ─── API Response ─────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// ─── Firebase Cloud Functions Payloads ────────────────────────
export interface OcrAnalysisRequest {
    imageBase64: string;
    imageUrl?: string;
}

export interface OcrAnalysisResponse {
    ocrData: OcrData;
    aiSuggestions: AiSuggestion[];
    confidence: number;
}

export interface LogoTransferRequest {
    receiptId: string;
    expenseCode: string;
    cashAccountCode: string;
    description?: string;
    projectCode?: string;
}

export interface LogoTransferResponse {
    success: boolean;
    logoRefNo?: string;
    errorMessage?: string;
}

// ─── Form State ───────────────────────────────────────────────
export interface ReceiptFormData {
    amount: string;
    currency: string;
    date: string;
    merchantName: string;
    description: string;
    kdvAmount: string;
    kdvRate: string;
    selectedServiceCard: LogoServiceCard | null;
    selectedCashAccount: LogoCashAccount | null;
    projectCode?: string;
}
