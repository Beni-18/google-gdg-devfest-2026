// Lists UI strings that still need translating. Usage: npm run i18n:check [-- --verbose]
import { readdirSync, readFileSync } from 'node:fs'

const root = new URL('../src/i18n/', import.meta.url)
const keys = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]))

function load(lang) {
  const merged = {}
  for (const file of readdirSync(new URL(`${lang}/`, root)).filter((f) => f.endsWith('.json'))) {
    const data = JSON.parse(readFileSync(new URL(`${lang}/${file}`, root), 'utf8'))
    for (const key of Object.keys(data)) {
      if (key in merged) {
        console.error(`${lang}/${file}: top-level key "${key}" is defined in two files`)
        process.exitCode = 1
      }
    }
    Object.assign(merged, data)
  }
  return merged
}

const base = keys(load('en'))
for (const lang of ['hi', 'ta', 'mr', 'bn']) {
  const have = new Set(keys(load(lang)))
  const missing = base.filter((k) => !have.has(k))
  console.log(`${lang}: ${base.length - missing.length}/${base.length} translated`)
  if (process.argv.includes('--verbose')) missing.forEach((k) => console.log(`   - ${k}`))
}
