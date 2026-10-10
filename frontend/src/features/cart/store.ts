import { create } from 'zustand'
import { registerReset } from '../../store/reset'
import { DOC_TYPES, type ApplicationType, type CartDoc, type DocType } from './types'

const emptyDocs = () =>
  Object.fromEntries(DOC_TYPES.map((type) => [type, { type, status: 'empty', progress: 0, fields: {} }])) as Record<
    DocType,
    CartDoc
  >

interface CartState {
  appType: ApplicationType
  docs: Record<DocType, CartDoc>
  setAppType: (t: ApplicationType) => void
  update: (type: DocType, patch: Partial<CartDoc>) => void
}

// In memory only: document data is never persisted (plan section 6).
export const useCart = create<CartState>((set) => ({
  appType: 'fresh',
  docs: emptyDocs(),
  setAppType: (appType) => set({ appType }),
  update: (type, patch) => set((s) => ({ docs: { ...s.docs, [type]: { ...s.docs[type], ...patch } } })),
}))

registerReset(() => useCart.setState({ appType: 'fresh', docs: emptyDocs() }))
