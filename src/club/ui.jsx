/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion } from 'framer-motion'
import {
  Cake, Gift, MapPin, RotateCcw, ShoppingBag, SlidersHorizontal, Sparkles, Target, Ticket, Trophy, Undo2, Users, X,
} from 'lucide-react'
import { Isotype } from '../components/Logo'

export const TYPE_ICON = {
  bienvenida: Gift, compra: ShoppingBag, primera_compra: Sparkles, pedidos_n: Trophy, pedidos_total: Trophy,
  referido: Users, cumple: Cake, visita: MapPin, mision: Target, ajuste: SlidersHorizontal,
  canje: Ticket, canje_cancelado: Undo2, reversa: RotateCcw,
}

/** Marca un nivel como ya celebrado (preferencia visual; el nivel real sale de los puntos históricos). */
export const acknowledgeLevel = (memberId, index) => { try { localStorage.setItem(`joakina_club_lvl_${memberId}`, String(index)) } catch { /* sin almacenamiento */ } }

export const fmt = (n) => Number(n).toLocaleString('es-AR')
export const fmtDate = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })

/** Skeleton cosmético: la base es local, pero así la pantalla respira igual que con una API real. */
export function useSkeleton(ms = 380) {
  const [loading, setLoading] = useState(true)
  useEffect(() => { const timer = setTimeout(() => setLoading(false), ms); return () => clearTimeout(timer) }, [ms])
  return loading
}

export const Skeleton = ({ className = '', style }) => <span className={`skel ${className}`} style={style} aria-hidden="true" />

export function AnimatedNumber({ value }) {
  const [shown, setShown] = useState(value)
  const previous = useRef(value)
  useEffect(() => {
    const controls = animate(previous.current, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setShown(Math.round(v)) })
    previous.current = value
    return () => controls.stop()
  }, [value])
  return <>{fmt(shown)}</>
}

export function LevelBadge({ level }) {
  return <span className="lvlbadge" data-level={level.id}><i />{level.name}</span>
}

export function MemberCard({ summary }) {
  const { member, level, balance } = summary
  return (
    <div className="mcard" data-level={level.id} role="group" aria-label="Tarjeta de socio">
      <div className="mcard__top">
        <span className="mcard__brand"><Isotype size={28} accent="currentColor" />JOAKINA CLUB</span>
        <span className="mcard__lvl">{level.name}</span>
      </div>
      <div className="mcard__pts">
        <b><AnimatedNumber value={balance} /></b>
        <span>PUNTOS</span>
      </div>
      <div className="mcard__bottom">
        <div><small>Socio</small><strong>{member.firstName} {member.lastName}</strong></div>
        <div><small>N.º de socio</small><strong>{member.number}</strong></div>
      </div>
    </div>
  )
}

export function LevelProgress({ summary, compact = false }) {
  const { level, next, progress, remaining, lifetime } = summary
  return (
    <div className="lprog">
      <div className="lprog__head">
        <LevelBadge level={level} />
        {next ? <span>{fmt(remaining)} pts para <b>{next.name}</b></span> : <span>Alcanzaste el máximo nivel</span>}
      </div>
      <div className="lprog__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Progreso al siguiente nivel">
        <motion.span initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <div className="lprog__foot"><span>{fmt(lifetime)} puntos acumulados</span>{next && <span>{fmt(next.min)}</span>}</div>
      {!compact && <p className="lprog__desc">{level.description}</p>}
    </div>
  )
}

/** Lluvia de destellos dorados para celebrar canjes, regalos y bienvenidas. */
export function Celebration({ show }) {
  const [pieces] = useState(() => Array.from({ length: 30 }, (_, i) => {
    const angle = (i / 30) * Math.PI * 2 + Math.random() * 0.4
    const distance = 90 + Math.random() * 170
    return { id: i, x: Math.cos(angle) * distance, y: Math.sin(angle) * distance - 40, size: 4 + Math.random() * 6, delay: Math.random() * 0.15, light: i % 3 === 0 }
  }))
  return (
    <AnimatePresence>
      {show && (
        <div className="confetti" aria-hidden="true">
          {pieces.map((p) => (
            <motion.i key={p.id} className={p.light ? 'is-light' : ''} style={{ width: p.size, height: p.size }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }} animate={{ x: p.x, y: p.y + 70, opacity: 0, scale: 1, rotate: 180 }}
              transition={{ duration: 1.5, delay: p.delay, ease: [0.22, 1, 0.36, 1] }} />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

export function Modal({ open, onClose, title, children, label }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" style={{ zIndex: 1200 }} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div className="cmodal" role="dialog" aria-modal="true" aria-label={label || title}
            initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <button className="icon-btn cmodal__close" onClick={onClose} aria-label="Cerrar"><X size={20} strokeWidth={1.3} /></button>
            {title && <h2>{title}</h2>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export const EmptyState = ({ icon: Icon = Sparkles, title, children }) => (
  <div className="empty"><Icon size={30} strokeWidth={1} /><h3>{title}</h3>{children && <p>{children}</p>}</div>
)

export function Field({ label, error, children, hint }) {
  return (
    <label className={`cfield ${error ? 'has-error' : ''}`}>
      <span>{label}</span>
      {children}
      {error ? <em role="alert">{error}</em> : hint ? <small>{hint}</small> : null}
    </label>
  )
}
