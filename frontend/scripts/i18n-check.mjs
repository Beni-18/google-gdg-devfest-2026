// Lists UI strings that still need translating. Usage: npm run i18n:check
import { readFileSync } from 'node:fs'

const dir = new URL('../src/i18n/', import.meta.url)
const load = (lang) => JSON.parse(readFileSync(new URL(`${lang}.json`, dir), 'utf8'))
const keys = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]))

const base = keys(load('en'))
for (const lang of ['hi', 'ta', 'mr', 'bn']) {
  const have = new Set(keys(load(lang)))
  const missing = base.filter((k) => !have.has(k))
  console.log(`${lang}: ${base.length - missing.length}/${base.length} translated`)
  if (process.argv.includes('--verbose')) missing.forEach((k) => console.log(`   - ${k}`))
}
