/**
 * Utility formatting functions for the GemasFis app
 */

/**
 * Format a number as currency string
 */
export function formatCurrency(
    amount: number,
    currency: string = 'TRY'
): string {
    const locale = currency === 'TRY' ? 'tr-TR' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format an ISO/YYYY-MM-DD date string to localized Turkish date
 */
export function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

/**
 * Format a Date object to short date
 */
export function formatShortDate(date: Date): string {
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date): string {
    return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Get relative time string (e.g., "2 saat önce")
 */
export function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return formatShortDate(date);
}

/**
 * Get current month key: YYYY-MM
 */
export function getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get month display name
 */
export function getMonthDisplayName(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
    return `%${value.toFixed(1)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Format AI confidence score as percentage string
 */
export function formatConfidence(score: number): string {
    return `${Math.round(score * 100)}%`;
}

/**
 * Get status display label in Turkish
 */
export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        pending: 'Beklemede',
        processing: 'İşleniyor',
        success: 'Aktarıldı',
        failed: 'Hata',
        draft: 'Taslak',
    };
    return labels[status] || status;
}
