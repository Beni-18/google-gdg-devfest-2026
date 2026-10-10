import { describe, expect, it } from 'vitest'
import { maskAadhaar } from './extract'

describe('maskAadhaar', () => {
  it('keeps only the last four digits, with or without separators', () => {
    expect(maskAadhaar('Aadhaar 1234 5678 9012')).toBe('Aadhaar XXXX XXXX 9012')
    expect(maskAadhaar('1234-5678-9012')).toBe('XXXX XXXX 9012')
    expect(maskAadhaar('123456789012')).toBe('XXXX XXXX 9012')
  })

  it('leaves dates and short numbers alone', () => {
    expect(maskAadhaar('DOB 26/01/1989, PIN 600001')).toBe('DOB 26/01/1989, PIN 600001')
  })
})
