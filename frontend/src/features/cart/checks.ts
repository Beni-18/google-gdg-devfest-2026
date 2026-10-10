// Deterministic cross-checks, no LLM (plan 3.3 "Deterministic checks").
import type { ApplicationType, CartDoc, CartReport, Issue, Verdict } from './types'

/**
 * TODO(cart): name consistency (exact / order / initials / fuzzy >= 0.85, see plan reference code),
 * DOB consistency, DOB-proof type, address, parents' names, old passport expiry, age vs application
 * type, completeness per application type.
 */
export function runChecks(_docs: CartDoc[], _appType: ApplicationType): CartReport {
  const issues: Issue[] = []
  return { verdict: verdictFor(issues), issues }
}

export function verdictFor(issues: Issue[]): Verdict {
  if (issues.some((i) => i.severity === 'blocker')) return 'not_ready'
  if (issues.some((i) => i.severity === 'warning')) return 'almost_ready'
  return 'ready'
}
