'use strict';

/**
 * Returns a YYYY-MM-DD date string for the given date in Europe/Berlin timezone.
 * Uses Intl for robustness (no brittle string splitting).
 * 'en-CA' locale reliably produces YYYY-MM-DD format.
 */
function getBerlinDateString(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Berlin',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

/**
 * Returns Berlin date string for "yesterday" (previous calendar day in Berlin TZ).
 */
function getBerlinYesterdayString() {
    const y = new Date(Date.now() - 86400000); // 24h is sufficient for calendar day shift in TZ handling
    return getBerlinDateString(y);
}

/**
 * Formats a Berlin date string (or DB value) for user display.
 * Accepts YYYY-MM-DD or Date; returns a nice locale date or the raw string.
 */
function formatBerlinDateForDisplay(value) {
    if (!value) return 'Never';
    try {
        if (value instanceof Date) {
            // Format the Date object as Berlin date first, then display
            const berlinStr = getBerlinDateString(value);
            return new Date(berlinStr).toLocaleDateString();
        }
        // Assume YYYY-MM-DD string
        return new Date(String(value)).toLocaleDateString();
    } catch {
        return String(value);
    }
}

module.exports = {
    getBerlinDateString,
    getBerlinYesterdayString,
    formatBerlinDateForDisplay,
};
