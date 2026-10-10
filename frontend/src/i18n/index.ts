import i18n, { type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useApp } from '../store/app'

// One file per area so lanes never edit the same file: <lang>/{app,cart,stuck,status}.json.
// Each top-level key lives in exactly one area file; files are merged per language here.
// en is the source of truth; missing keys fall back to English. `npm run i18n:check` lists gaps.
const files = import.meta.glob<Record<string, unknown>>('./*/*.json', { eager: true, import: 'default' })

const resources: Resource = {}
for (const [path, strings] of Object.entries(files)) {
  const lang = path.split('/')[1]
  resources[lang] ??= { translation: {} }
  Object.assign(resources[lang].translation, strings)
}

void i18n.use(initReactI18next).init({
  resources,
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
