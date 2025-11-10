import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import ru from '../locales/ru.json'

const STORAGE_KEY = 'challenge-me-locale'

function detectStartingLocale() {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && ['en', 'ru'].includes(stored)) {
    return stored
  }

  const browserLocale = window.navigator.language?.slice(0, 2).toLowerCase()
  if (browserLocale && ['en', 'ru'].includes(browserLocale)) {
    return browserLocale
  }

  return 'en'
}

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' }
]

const i18n = createI18n({
  legacy: false,
  locale: detectStartingLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    ru
  }
})

export function setLocale(locale) {
  if (!locale || !['en', 'ru'].includes(locale)) {
    return
  }

  if (i18n.global.locale.value === locale) {
    return
  }

  i18n.global.locale.value = locale

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, locale)
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { locale } }))
  }
}

export default i18n
