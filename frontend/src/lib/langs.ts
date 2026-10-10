// Tier A (en, hi, ta) + A+ (mr, bn). Keep in sync with `Lang` in backend/app/schemas.py.
export const LANGS = [
  { code: 'en', native: 'English', bcp47: 'en-IN', tesseract: 'eng' },
  { code: 'hi', native: 'हिन्दी', bcp47: 'hi-IN', tesseract: 'hin' },
  { code: 'ta', native: 'தமிழ்', bcp47: 'ta-IN', tesseract: 'tam' },
  { code: 'mr', native: 'मराठी', bcp47: 'mr-IN', tesseract: 'mar' },
  { code: 'bn', native: 'বাংলা', bcp47: 'bn-IN', tesseract: 'ben' },
] as const

export type Lang = (typeof LANGS)[number]['code']

export const langInfo = (code: Lang) => LANGS.find((l) => l.code === code) ?? LANGS[0]

export const isLang = (value: unknown): value is Lang => LANGS.some((l) => l.code === value)
