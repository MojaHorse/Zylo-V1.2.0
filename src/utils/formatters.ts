/**
 * Shared formatting utilities for POS UI display.
 */

export const formatBusinessDayOrderNumber = (num?: number | string | null) => {
    if (num == null || num === '') return null;
    const parsed = Number(num);
    return isNaN(parsed) ? null : `#${String(parsed).padStart(3, "0")}`;
};

export const formatReceiptLabel = (receipt?: string | null) => {
    return receipt ? `Receipt: ${receipt}` : null;
};
