/* eslint-disable react-refresh/only-export-components */
import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

// ─── Tokens ───────────────────────────────────────────────
export const C = {
  bg:     '#080808',
  card:   '#141414',
  input:  '#0d0d0d',
  border: 'rgba(198,166,107,0.16)',
  gold:   '#C6A66B',
  cream:  '#F5F2EC',
  muted:  '#9a968f',
  subtle: '#b8b4ac',
  verde:  '#202020',
  danger: '#ef4444',
}
export const f = { serif: "'Cormorant Garamond', serif", sans: "'Manrope Variable', sans-serif" }

export const base = {
  width: '100%', background: C.input, border: `1px solid ${C.border}`,
  color: C.cream, padding: '11px 14px', fontFamily: f.sans, fontSize: 14,
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  borderRadius: 0,
}

// ─── Primitives ───────────────────────────────────────────
export function Inp({ label, hint, type = 'text', value, onChange, placeholder, mono }) {
  const id = useId()
  const [fo, setFo] = useState(false)
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <label htmlFor={id} style={{ display: 'block', fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: fo ? C.gold : C.muted, marginBottom: 7, transition: 'color 0.2s' }}>{label}</label>}
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={e => { setFo(true); e.target.style.borderColor = C.gold }}
        onBlur={e => { setFo(false); e.target.style.borderColor = C.border }}
        style={{ ...base, fontFamily: mono ? 'monospace' : f.sans }} />
      {hint && <p style={{ fontFamily: f.sans, fontSize: 11, color: C.muted, marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

export function Txt({ label, value, onChange, rows = 3, placeholder }) {
  const id = useId()
  const [fo, setFo] = useState(false)
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <label htmlFor={id} style={{ display: 'block', fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: fo ? C.gold : C.muted, marginBottom: 7, transition: 'color 0.2s' }}>{label}</label>}
      <textarea id={id} value={value} onChange={onChange} rows={rows} placeholder={placeholder}
        onFocus={e => { setFo(true); e.target.style.borderColor = C.gold }}
        onBlur={e => { setFo(false); e.target.style.borderColor = C.border }}
        style={{ ...base, resize: 'vertical' }} />
    </div>
  )
}

export function Sel({ label, value, onChange, options }) {
  const id = useId()
  const [fo, setFo] = useState(false)
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <label htmlFor={id} style={{ display: 'block', fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: fo ? C.gold : C.muted, marginBottom: 7, transition: 'color 0.2s' }}>{label}</label>}
      <select id={id} value={value} onChange={onChange}
        onFocus={e => { setFo(true); e.target.style.borderColor = C.gold }}
        onBlur={e => { setFo(false); e.target.style.borderColor = C.border }}
        style={{ ...base, cursor: 'pointer', appearance: 'none', background: '#0d0d0d' }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o} style={{ background: '#111' }}>{o.label ?? o}</option>)}
      </select>
    </div>
  )
}

export const BADGE_OPTS = [
  { value: '', label: 'Sin badge' },
  { value: 'Estrella', label: 'Estrella' },
  { value: 'Signature', label: 'Signature' },
  { value: 'Para 2',   label: 'Para 2' },
  { value: 'Popular',  label: 'Popular' },
  { value: 'Nuevo',    label: 'Nuevo' },
  { value: 'Veggie',   label: 'Veggie' },
]

export function Btn({ children, onClick, variant = 'gold', type = 'button', full, small, style: ex = {} }) {
  const v = {
    gold:    { background: C.gold,   color: '#111', border: 'none' },
    outline: { background: 'transparent', color: C.gold, border: `1px solid ${C.border}` },
    verde:   { background: C.verde,  color: C.cream, border: 'none' },
    danger:  { background: 'rgba(239,68,68,0.1)', color: C.danger, border: '1px solid rgba(239,68,68,0.2)' },
    ghost:   { background: 'transparent', color: C.muted, border: `1px solid rgba(255,255,255,0.07)` },
    dashed:  { background: 'transparent', color: C.gold, border: `1px dashed rgba(198,166,107,0.28)` },
  }
  return (
    <button type={type} onClick={onClick} style={{ fontFamily: f.sans, fontSize: small ? 11 : 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', padding: small ? '7px 12px' : '10px 22px', cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap', width: full ? '100%' : 'auto', ...v[variant], ...ex }}
      onMouseEnter={e => { if (variant === 'gold') e.currentTarget.style.background = '#F5F2EC' }}
      onMouseLeave={e => { e.currentTarget.style.background = v[variant].background }}>
      {children}
    </button>
  )
}

export function Card({ children, accent, style: ex = {} }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${accent ? 'rgba(198,166,107,0.3)' : C.border}`, borderTop: accent ? `2px solid ${C.gold}` : undefined, padding: '26px 28px', ...ex }}>
      {children}
    </div>
  )
}

export function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
      <div>
        {eyebrow && <p style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>{eyebrow}</p>}
        <h2 style={{ fontFamily: f.serif, fontSize: 34, color: C.cream, lineHeight: 1.1, marginBottom: subtitle ? 8 : 0 }}>{title}</h2>
        {subtitle && <p style={{ fontFamily: f.sans, fontSize: 13, color: C.muted, lineHeight: 1.6, maxWidth: 520 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '28px 0 20px' }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      {label && <span style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.muted, whiteSpace: 'nowrap' }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  )
}

export function Toast({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14 }}
          style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, background: C.gold, color: '#111', padding: '13px 26px', fontFamily: f.sans, fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', boxShadow: '0 16px 50px rgba(0,0,0,0.5)' }}>
          <Check size={14} style={{ verticalAlign: -2, marginRight: 8 }} />Cambios guardados
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ImgInput({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: 'block', fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.muted, marginBottom: 7 }}>{label}</label>
      {value && <img src={value} alt={label} onError={e => e.target.style.display = 'none'} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', border: `1px solid ${C.border}`, borderBottom: 'none' }} />}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://..."
        onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
        style={{ ...base, fontSize: 12, fontFamily: 'monospace' }} />
    </div>
  )
}

