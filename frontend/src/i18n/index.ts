import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useApp } from '../store/app'
import bn from './bn.json'
import en from './en.json'
import hi from './hi.json'
import mr from './mr.json'
import ta from './ta.json'

// en.json is the source of truth; missing keys in other languages fall back to English.
// `npm run i18n:check` lists what still needs translating.
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ta: { translation: ta },
    mr: { translation: mr },
    bn: { translation: bn },
  },
  lng: useApp.getState().lang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
})

document.documentElement.lang = i18n.language
useApp.subscribe((s, prev) => {
  if (s.lang !== prev.lang) {
    void i18n.changeLanguage(s.lang)
    document.documentElement.lang = s.lang
  }
})

export default i18n
