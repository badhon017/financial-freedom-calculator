export const TAKA = '৳'

/**
 * Bangladeshi/South Asian digit grouping: the last three digits, then pairs.
 * 12345678 becomes 1,23,45,678.
 */
export function groupBD(value: number): string {
  const negative = value < 0
  const digits = String(Math.round(Math.abs(value)))
  const grouped =
    digits.length <= 3
      ? digits
      : digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + digits.slice(-3)
  return negative ? '-' + grouped : grouped
}

/** Full precision with the taka sign, e.g. ৳1,23,45,678. */
export function formatTaka(value: number): string {
  return TAKA + groupBD(value)
}

/**
 * Drop trailing zeros, but only ever after a decimal point — stripping them
 * blindly turns 50 into 5 and ৳500 into ৳5.
 */
function trimZeros(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals)
  return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed
}

/**
 * Short form for charts and headlines: ৳1.25 Cr, ৳12.5 L, ৳45,000.
 * Crore and lakh are how these numbers are actually spoken in Bangladesh.
 */
export function formatCompact(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 1e7) return sign + TAKA + trimZeros(abs / 1e7, 2) + ' Cr'
  if (abs >= 1e5) return sign + TAKA + trimZeros(abs / 1e5, 2) + ' L'
  if (abs >= 1000) return sign + TAKA + groupBD(abs)
  return sign + TAKA + trimZeros(abs, 0)
}

/** Axis labels, where even the taka sign is noise. */
export function formatAxis(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1e7) return sign + trimZeros(abs / 1e7, 1) + 'Cr'
  if (abs >= 1e5) return sign + trimZeros(abs / 1e5, 1) + 'L'
  if (abs >= 1000) return sign + trimZeros(abs / 1000, 0) + 'K'
  return sign + trimZeros(abs, 0)
}

export function formatPct(value: number, decimals = 1): string {
  return trimZeros(value, decimals) + '%'
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function monthName(month: number): string {
  return MONTH_NAMES[((month - 1) % 12 + 12) % 12]
}

export function monthShort(month: number): string {
  return monthName(month).slice(0, 3)
}

/** "12 years 4 months", with the units that actually apply. */
export function formatDuration(months: number): string {
  const whole = Math.max(0, Math.round(months))
  const years = Math.floor(whole / 12)
  const rest = whole % 12
  if (years === 0) return rest === 1 ? '1 month' : `${rest} months`
  const yearPart = years === 1 ? '1 year' : `${years} years`
  if (rest === 0) return yearPart
  return `${yearPart} ${rest === 1 ? '1 month' : `${rest} months`}`
}

/** Signed shift in a date, for sensitivity rows: "2 yr 1 mo later". */
export function formatMonthDelta(months: number): string {
  if (months === 0) return 'no change'
  const direction = months > 0 ? 'later' : 'sooner'
  const abs = Math.abs(months)
  const years = Math.floor(abs / 12)
  const rest = abs % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} yr`)
  if (rest > 0) parts.push(`${rest} mo`)
  return parts.join(' ') + ' ' + direction
}
