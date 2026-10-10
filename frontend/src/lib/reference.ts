// Sourced reference figures from backend/data/reference (Lane D keeps these files; never edit them from here).
import evisa from '@reference/evisa_rules.json'
import pv from '@reference/pv_pending_2025.json'

/** Passport files pending police verification > 30 days, by state, 1 Dec 2025. Counts, not rates. */
export const pvPending = pv

/** Inputs for the e-Visa pre-check (M6). */
export const evisaRules = evisa
