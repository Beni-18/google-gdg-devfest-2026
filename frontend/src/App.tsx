import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import CartPage from './features/cart/CartPage'
import HomePage from './features/home/HomePage'
import WelcomePage from './features/onboarding/WelcomePage'
import StatusPage from './features/status/StatusPage'
import StuckPage from './features/stuck/StuckPage'
import { api } from './lib/api'
import { useApp } from './store/app'

export default function App() {
  const consented = useApp((s) => s.consented)
  const setHealth = useApp((s) => s.setHealth)

  useEffect(() => {
    api.health().then(
      (h) => setHealth(h),
      () => setHealth(null, true),
    )
  }, [setHealth])

  if (!consented) return <WelcomePage />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="stuck" element={<StuckPage />} />
        <Route path="status" element={<StatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
