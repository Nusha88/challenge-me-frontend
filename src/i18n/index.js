import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import ru from '../locales/ru.json'

const STORAGE_KEY = 'challenge-me-locale'

function getBestLocale() {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const savedLocale = localStorage.getItem(STORAGE_KEY)
  if (savedLocale && ['en', 'ru'].includes(savedLocale)) {
    return savedLocale
  }

  const browserLocale = navigator.language || navigator.userLanguage
  const shortLocale = browserLocale.split('-')[0]

  const supportedLocales = ['ru', 'en']

  return supportedLocales.includes(shortLocale) ? shortLocale : 'en'
}

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' }
]

const i18n = createI18n({
  legacy: false,
  locale: getBestLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    ru
  },
  pluralRules: {
    // Russian uses three plural forms (one | few | many).
    ru(choice, choicesLength) {
      const n = Math.abs(choice)

      if (choicesLength < 3) {
        return n === 1 ? 0 : 1
      }

      const mod10 = n % 10
      const mod100 = n % 100

      if (mod10 === 1 && mod100 !== 11) return 0
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1
      return 2
    }
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
