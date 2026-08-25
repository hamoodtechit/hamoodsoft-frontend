/**
 * Standardized Date and Time formatting utilities with Business Timezone support
 */

export interface TimeZoneOption {
  value: string
  label: string
  offset: string
  group: string
}

export const COMMON_TIMEZONES: TimeZoneOption[] = [
  // South Asia
  { value: "Asia/Dhaka", label: "Dhaka (Bangladesh)", offset: "GMT+06:00", group: "South Asia" },
  { value: "Asia/Kolkata", label: "Kolkata, Mumbai, New Delhi (India)", offset: "GMT+05:30", group: "South Asia" },
  { value: "Asia/Karachi", label: "Karachi, Islamabad (Pakistan)", offset: "GMT+05:00", group: "South Asia" },
  { value: "Asia/Colombo", label: "Colombo (Sri Lanka)", offset: "GMT+05:30", group: "South Asia" },
  { value: "Asia/Kathmandu", label: "Kathmandu (Nepal)", offset: "GMT+05:45", group: "South Asia" },
  
  // Middle East / Gulf
  { value: "Asia/Dubai", label: "Dubai, Abu Dhabi (UAE)", offset: "GMT+04:00", group: "Middle East" },
  { value: "Asia/Riyadh", label: "Riyadh, Jeddah (Saudi Arabia)", offset: "GMT+03:00", group: "Middle East" },
  { value: "Asia/Qatar", label: "Doha (Qatar)", offset: "GMT+03:00", group: "Middle East" },
  { value: "Asia/Kuwait", label: "Kuwait City (Kuwait)", offset: "GMT+03:00", group: "Middle East" },
  { value: "Asia/Bahrain", label: "Manama (Bahrain)", offset: "GMT+03:00", group: "Middle East" },
  { value: "Asia/Muscat", label: "Muscat (Oman)", offset: "GMT+04:00", group: "Middle East" },

  // Southeast & East Asia
  { value: "Asia/Singapore", label: "Singapore", offset: "GMT+08:00", group: "Asia Pacific" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (Malaysia)", offset: "GMT+08:00", group: "Asia Pacific" },
  { value: "Asia/Bangkok", label: "Bangkok (Thailand)", offset: "GMT+07:00", group: "Asia Pacific" },
  { value: "Asia/Jakarta", label: "Jakarta (Indonesia)", offset: "GMT+07:00", group: "Asia Pacific" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", offset: "GMT+08:00", group: "Asia Pacific" },
  { value: "Asia/Tokyo", label: "Tokyo (Japan)", offset: "GMT+09:00", group: "Asia Pacific" },

  // Europe & UK
  { value: "Europe/London", label: "London (UK)", offset: "GMT+00:00 / GMT+01:00", group: "Europe" },
  { value: "Europe/Paris", label: "Paris, Berlin, Rome (CET)", offset: "GMT+01:00 / GMT+02:00", group: "Europe" },
  { value: "Europe/Istanbul", label: "Istanbul (Turkey)", offset: "GMT+03:00", group: "Europe" },

  // Americas
  { value: "America/New_York", label: "New York, Eastern Time (US)", offset: "GMT-05:00 / GMT-04:00", group: "Americas" },
  { value: "America/Chicago", label: "Chicago, Central Time (US)", offset: "GMT-06:00 / GMT-05:00", group: "Americas" },
  { value: "America/Denver", label: "Denver, Mountain Time (US)", offset: "GMT-07:00 / GMT-06:00", group: "Americas" },
  { value: "America/Los_Angeles", label: "Los Angeles, Pacific Time (US)", offset: "GMT-08:00 / GMT-07:00", group: "Americas" },
  { value: "America/Toronto", label: "Toronto (Canada)", offset: "GMT-05:00 / GMT-04:00", group: "Americas" },

  // UTC / GMT
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: "GMT+00:00", group: "Universal" },
]

export const DEFAULT_TIMEZONE = "Asia/Dhaka"

export interface DateFormatOptions {
  timeZone?: string
  locale?: string
  dateStyle?: "full" | "long" | "medium" | "short"
  timeStyle?: "full" | "long" | "medium" | "short"
  includeTime?: boolean
}

/**
 * Detect the user's browser device timezone
 */
export function detectDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE
  } catch {
    return DEFAULT_TIMEZONE
  }
}

/**
 * Safe parser for string, number, or Date objects
 */
function parseDate(date: string | number | Date | null | undefined): Date | null {
  if (!date) return null
  const d = typeof date === "object" && date instanceof Date ? date : new Date(date)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Format date in the business timezone
 * Example: 24/08/2026 or Aug 24, 2026
 */
export function formatDate(
  date: string | number | Date | null | undefined,
  options?: { timeZone?: string; locale?: string; format?: "numeric" | "short" | "long" }
): string {
  const d = parseDate(date)
  if (!d) return "-"

  const timeZone = options?.timeZone || DEFAULT_TIMEZONE
  const locale = options?.locale || "en-GB"

  try {
    if (options?.format === "long") {
      return new Intl.DateTimeFormat(locale, {
        timeZone,
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(d)
    }

    if (options?.format === "short") {
      return new Intl.DateTimeFormat(locale, {
        timeZone,
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(d)
    }

    // Default numeric (DD/MM/YYYY)
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d)
  } catch (error) {
    // Fallback if invalid timezone specified
    return d.toLocaleDateString()
  }
}

/**
 * Format date and time in the business timezone
 * Example: 24/08/2026, 11:45 AM
 */
export function formatDateTime(
  date: string | number | Date | null | undefined,
  options?: { timeZone?: string; locale?: string; includeSeconds?: boolean }
): string {
  const d = parseDate(date)
  if (!d) return "-"

  const timeZone = options?.timeZone || DEFAULT_TIMEZONE
  const locale = options?.locale || "en-GB"

  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: options?.includeSeconds ? "2-digit" : undefined,
      hour12: true,
    }).format(d)
  } catch (error) {
    return d.toLocaleString()
  }
}

/**
 * Format time only in the business timezone
 * Example: 11:45 AM
 */
export function formatTime(
  date: string | number | Date | null | undefined,
  options?: { timeZone?: string; locale?: string; includeSeconds?: boolean }
): string {
  const d = parseDate(date)
  if (!d) return "-"

  const timeZone = options?.timeZone || DEFAULT_TIMEZONE
  const locale = options?.locale || "en-GB"

  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: options?.includeSeconds ? "2-digit" : undefined,
      hour12: true,
    }).format(d)
  } catch (error) {
    return d.toLocaleTimeString()
  }
}
