/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import {
  CHANGE_EVENT, DB_KEY, SESSION_KEY, consumeNewPoints, getSession, login as serviceLogin,
  logout as serviceLogout, reconcileOrders, registerMember, setSession, summaryForToken,
} from './store'
import './club.css'

const ClubContext = createContext(null)

export function ClubProvider({ children }) {
  const [token, setToken] = useState(getSession)
  const [version, setVersion] = useState(0)
  const [toasts, setToasts] = useState([])
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  // El resumen se calcula desde la base en cada cambio: las pantallas nunca guardan puntos propios.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const summary = useMemo(() => (token ? summaryForToken(token) : null), [token, version])

  useEffect(() => {
    const refresh = () => { try { reconcileOrders() } catch { /* se reintenta luego */ } bump() }
    const onStorage = (e) => {
      if (e.key === SESSION_KEY) setToken(getSession())
      if (!e.key || [DB_KEY, 'joakina_orders', SESSION_KEY].includes(e.key)) refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(CHANGE_EVENT, bump)
    const timer = setTimeout(refresh, 0)
    return () => { clearTimeout(timer); window.removeEventListener('storage', onStorage); window.removeEventListener(CHANGE_EVENT, bump) }
  }, [bump])

  useEffect(() => {
    if (!token || summary) return undefined
    const timer = setTimeout(() => { setSession(null); setToken(null) }, 0) // sesión vencida o cuenta eliminada
    return () => clearTimeout(timer)
  }, [token, summary])

  const notify = useCallback((message, { points } = {}) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((list) => [...list.slice(-2), { id, message, points }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4200)
  }, [])

  const register = useCallback(async (data, options) => {
    const result = await registerMember(data, options)
    setSession(result.token); setToken(result.token)
    return result
  }, [])

  const login = useCallback(async (email, password) => {
    const next = await serviceLogin(email, password)
    setSession(next); setToken(next)
    return next
  }, [])

  const logout = useCallback(() => { serviceLogout(token); setSession(null); setToken(null) }, [token])

  /** Marca como vistos los puntos recientes y avisa si hubo novedades (por ejemplo, un pedido entregado). */
  const syncPoints = useCallback(() => {
    if (!token) return
    try {
      const gained = consumeNewPoints(token)
      if (gained > 0) notify('¡Sumaste puntos!', { points: gained })
    } catch { /* sesión inválida */ }
  }, [token, notify])

  const value = useMemo(() => ({
    token, summary, member: summary?.member ?? null, notify, register, login, logout, refresh: bump, syncPoints,
  }), [token, summary, notify, register, login, logout, bump, syncPoints])

  return (
    <ClubContext.Provider value={value}>
      {children}
      <div className="club-toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} className="club-toast" initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}>
              <Sparkles size={16} strokeWidth={1.4} />
              <span>{t.message}</span>
              {t.points ? <b>+{t.points.toLocaleString('es-AR')} pts</b> : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ClubContext.Provider>
  )
}

export const useClub = () => useContext(ClubContext)
