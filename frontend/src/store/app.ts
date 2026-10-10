import { create } from 'zustand'
import { isLang, type Lang } from '../lib/langs'
import type { Health } from '../lib/types'
import { registerReset } from './reset'

const LANG_KEY = 'mitra.lang' // the only thing we persist

function savedLang(): Lang | null {
  try {
    const v = localStorage.getItem(LANG_KEY)
    return isLang(v) ? v : null
  } catch {
    return null
  }
}

interface AppState {
  lang: Lang
  langChosen: boolean
  consented: boolean
  assisted: boolean
  clientNo: number
  health: Health | null
  healthError: boolean
  /** "Fix with Mitra" handoff from the Document Cart to the Stuck-Case Solver. */
  handoff: { text: string; cartIssues: string[] } | null

  setLang: (lang: Lang) => void
  setConsented: (v: boolean) => void
  setAssisted: (v: boolean) => void
  nextClient: () => void
  setHealth: (h: Health | null, error?: boolean) => void
  setHandoff: (h: AppState['handoff']) => void
}

export const useApp = create<AppState>((set) => ({
  lang: savedLang() ?? 'en',
  langChosen: savedLang() !== null,
  consented: false,
  assisted: false,
  clientNo: 1,
  health: null,
  healthError: false,
  handoff: null,

  setLang: (lang) => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      // private mode: language just won't be remembered
    }
    set({ lang, langChosen: true })
  },
  setConsented: (consented) => set({ consented }),
  setAssisted: (assisted) => set({ assisted }),
  nextClient: () => set((s) => ({ clientNo: s.clientNo + 1 })),
  setHealth: (health, error = false) => set({ health, healthError: error }),
  setHandoff: (handoff) => set({ handoff }),
}))

registerReset(() => useApp.setState({ handoff: null }))
