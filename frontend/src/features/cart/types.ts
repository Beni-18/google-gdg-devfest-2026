// M1 Document Cart data model (plan section 3.3). Everything here stays on the device.

export const DOC_TYPES = ['aadhaar', 'pan', 'passport', 'marksheet', 'address', 'birth'] as const
export type DocType = (typeof DOC_TYPES)[number]

export type ApplicationType = 'fresh' | 'reissue' | 'minor'

export interface ExtractedFields {
  name?: string
  fatherName?: string
  motherName?: string
  dob?: string // as printed; checks.ts parses DD/MM/YYYY, DD-MM-YYYY or year only
  address?: string
  aadhaarLast4?: string // never the full number
  pan?: string
  passportNumber?: string
  expiry?: string
}

export type DocStatus = 'empty' | 'reading' | 'review' | 'confirmed' | 'error'

export interface CartDoc {
  type: DocType
  status: DocStatus
  progress: number // 0..1 while reading
  rawText?: string // OCR output, Aadhaar already masked
  fields: ExtractedFields // user-confirmed on the confirm/edit screen
}

export type Severity = 'blocker' | 'warning' | 'info'

export interface Issue {
  /** Mismatch type sent to the agent as cart_issues, e.g. "name_mismatch:aadhaar_vs_marksheet". Never values. */
  id: string
  severity: Severity
  found: string // what we found
  why: string // why it matters ("commonly causes problems", never "will be rejected")
  fix: string // how to fix it
}

export type Verdict = 'not_ready' | 'almost_ready' | 'ready'

export interface CartReport {
  verdict: Verdict
  issues: Issue[]
}
