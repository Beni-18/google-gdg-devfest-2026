// Turn OCR text into fields per document type (plan 3.3 "Extractors").
import type { DocType, ExtractedFields } from './types'

const AADHAAR = /(?<!\d)\d{4}[\s-]?\d{4}[\s-]?(\d{4})(?!\d)/g

/** Never cut: run on raw OCR text before it is stored or shown. Keeps only the last 4 digits. */
export function maskAadhaar(text: string): string {
  return text.replace(AADHAAR, 'XXXX XXXX $1')
}

/** TODO(cart): regex + keyword cues, e.g. PAN [A-Z]{5}[0-9]{4}[A-Z], MRZ lines with '<', "Name of Candidate". */
export function classify(_text: string): DocType | null {
  return null
}

/** TODO(cart): per-type field extraction. Unknown fields stay undefined for the user to fill in. */
export function extractFields(_type: DocType, _text: string): ExtractedFields {
  return {}
}
