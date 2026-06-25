/**
 * Formats a number as a whole number string with Thai-style commas.
 * @param amount - The number to format.
 * @returns A string representing the amount as a whole number.
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
