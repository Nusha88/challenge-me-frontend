export const COUNTRY_CODES = [
  'AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT',
  'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW',
  'BV', 'BR', 'IO', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV', 'KY', 'CF', 'TD', 'CL',
  'CN', 'CX', 'CC', 'CO', 'KM', 'CD', 'CG', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ',
  'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FK', 'FO', 'FJ',
  'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP',
  'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HM', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID',
  'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR',
  'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MG', 'MW', 'MY',
  'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS',
  'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'MK',
  'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR',
  'QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST',
  'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS', 'SS', 'ES',
  'LK', 'SD', 'SR', 'SJ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO',
  'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UM', 'UY', 'UZ', 'VU',
  'VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW'
]

const hasIntlDisplayNames = typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
const displayNamesCache = new Map()

function getDisplayNamesForLocale(locale) {
  if (!hasIntlDisplayNames) {
    return null
  }

  const normalized = locale || 'en'
  if (!displayNamesCache.has(normalized)) {
    try {
      displayNamesCache.set(normalized, new Intl.DisplayNames([normalized], { type: 'region' }))
    } catch (error) {
      displayNamesCache.set(normalized, null)
    }
  }

  return displayNamesCache.get(normalized)
}

export function sanitizeCountryCode(value) {
  if (!value) return ''
  const trimmed = String(value).trim()
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase()
  }
  return ''
}

export function isValidCountryCode(value, availableCodes = COUNTRY_CODES) {
  const code = sanitizeCountryCode(value)
  if (!code) {
    return false
  }
  return availableCodes.includes(code)
}

export function getCountryDisplayName(value, locale = 'en') {
  if (!value) return ''

  const code = sanitizeCountryCode(value)
  if (code) {
    const displayNames = getDisplayNamesForLocale(locale)
    if (displayNames) {
      const name = displayNames.of(code)
      if (name) {
        return name
      }
    }
    return code
  }

  return String(value)
}

export function getCountryOptions(locale = 'en') {
  const displayNames = getDisplayNamesForLocale(locale)
  const collator = typeof Intl !== 'undefined' && typeof Intl.Collator === 'function'
    ? new Intl.Collator(locale, { sensitivity: 'base' })
    : null

  const options = COUNTRY_CODES.map(code => {
    let title = code
    if (displayNames) {
      const name = displayNames.of(code)
      if (name) {
        title = name
      }
    }
    return { title, value: code }
  })

  options.sort((a, b) => {
    if (collator) {
      return collator.compare(a.title, b.title)
    }
    return a.title.localeCompare(b.title)
  })

  return options
}

function extractRegion(localeString) {
  if (!localeString) return ''
  const normalized = localeString.replace(/-/g, '_')
  const parts = normalized.split('_')
  const candidate = parts[parts.length - 1]
  if (candidate && /^[A-Za-z]{2}$/.test(candidate)) {
    return candidate.toUpperCase()
  }
  return ''
}

export function detectUserCountry(availableCodes = COUNTRY_CODES) {
  if (typeof window === 'undefined') return ''

  const localeCandidates = [
    ...(navigator.languages || []),
    navigator.language,
    typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().locale
      : null
  ].filter(Boolean)

  for (const locale of localeCandidates) {
    const region = extractRegion(locale)
    if (region && availableCodes.includes(region)) {
      return region
    }
  }

  return ''
}
