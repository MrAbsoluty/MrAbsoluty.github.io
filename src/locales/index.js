import en from './en'
import es from './es'
import es419 from './es-419'

export const localeOptions = [
  { code: 'es', flag: '🇪🇸' },
  { code: 'es-419', flag: '🇨🇱' },
  { code: 'en', flag: '🇺🇸' },
]

export const translations = { es, 'es-419': es419, en }
export const defaultLocale = 'es'

export function getTranslations(locale) {
  return translations[locale] || translations[defaultLocale]
}
