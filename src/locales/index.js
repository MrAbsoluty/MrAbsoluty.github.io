import en from './en.js'
import es from './es.js'

export const SUPPORTED_LOCALES = ['es', 'en']

export const localeOptions = [
  { code: 'es', flag: '🇪🇸' },
  { code: 'en', flag: '🇺🇸' },
]

export const translations = { es, en }
export const defaultLocale = 'es'

export function getTranslations(locale) {
  const normalizedLocale = String(locale || defaultLocale).toLowerCase().startsWith('en') ? 'en' : 'es'
  return translations[normalizedLocale] || translations[defaultLocale]
}

