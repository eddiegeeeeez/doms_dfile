/** Mirrors backend constraints for shared client-side checks (optional use in forms). */

export const assetValidation = {
    tagNumber: { minLength: 1, maxLength: 50, pattern: /^[A-Z0-9\-]+$/i },
    purchasePrice: { min: 0, max: 999_999_999 },
    usefulLifeYears: { min: 0, max: 100 },
    acquisitionCost: { min: 0, max: 999_999_999 },
} as const;
