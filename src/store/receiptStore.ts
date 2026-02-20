import { create } from 'zustand';
import { Receipt, MonthlyStats } from '../types/index';

interface ReceiptState {
    receipts: Receipt[];
    currentReceipt: Receipt | null;
    monthlyStats: MonthlyStats | null;
    isLoading: boolean;
    isUploading: boolean;
    uploadProgress: number;
    error: string | null;

    setReceipts: (receipts: Receipt[]) => void;
    addReceipt: (receipt: Receipt) => void;
    updateReceipt: (id: string, data: Partial<Receipt>) => void;
    removeReceipt: (id: string) => void;
    setCurrentReceipt: (receipt: Receipt | null) => void;
    setMonthlyStats: (stats: MonthlyStats) => void;
    setLoading: (loading: boolean) => void;
    setUploading: (uploading: boolean, progress?: number) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}

export const useReceiptStore = create<ReceiptState>((set) => ({
    receipts: [],
    currentReceipt: null,
    monthlyStats: null,
    isLoading: false,
    isUploading: false,
    uploadProgress: 0,
    error: null,

    setReceipts: (receipts) => set({ receipts }),

    addReceipt: (receipt) =>
        set((state) => ({ receipts: [receipt, ...state.receipts] })),

    updateReceipt: (id, data) =>
        set((state) => ({
            receipts: state.receipts.map((r) =>
                r.id === id ? { ...r, ...data } : r
            ),
            currentReceipt:
                state.currentReceipt?.id === id
                    ? { ...state.currentReceipt, ...data }
                    : state.currentReceipt,
        })),

    removeReceipt: (id) =>
        set((state) => ({
            receipts: state.receipts.filter((r) => r.id !== id),
        })),

    setCurrentReceipt: (receipt) => set({ currentReceipt: receipt }),
    setMonthlyStats: (stats) => set({ monthlyStats: stats }),
    setLoading: (isLoading) => set({ isLoading }),
    setUploading: (isUploading, uploadProgress = 0) => set({ isUploading, uploadProgress }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
}));
