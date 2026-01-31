/**
 * Format a number as currency based on settings
 * @param amount - The amount to format
 * @param settings - The settings object from useAppSettings
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  settings: { generalSettings: { currency?: { symbol: string; code: string }; currencySymbolPlacement?: "before-amount" | "after-amount" } | null }
): string {
  const currency = settings.generalSettings?.currency
  const symbol = currency?.symbol || "$"
  const placement = settings.generalSettings?.currencySymbolPlacement || "before-amount"
  
  const formattedAmount = amount.toFixed(2)
  
  if (placement === "after-amount") {
    return `${formattedAmount} ${symbol}`
  }
  
  return `${symbol}${formattedAmount}`
}
