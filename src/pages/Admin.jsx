import { useState, useCallback, useId } from 'react'
import { useSite } from '../context/SiteContext'
import { formatPrice, splitList } from '../lib/format'
import { ACTIVE, MODE_LABEL, NEXT, deleteOrder, loadOrders, setOrderStatus, statusLabel } from '../lib/orders'
import { deleteReservation, loadReservations, setReservationStatus, tableById, toISO } from '../lib/reservations'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Check, Eye, EyeOff, Image as ImageIcon, Images, Info, Bike, CalendarDays, Gem, LayoutDashboard, Menu as MenuIcon, RotateCcw, Save, Tag, UtensilsCrossed } from 'lucide-react'
import { Isotype } from '../components/Logo'
import AdminClub from './AdminClub'
import { orderPoints, summaryForMember } from '../club/store'
import { BADGE_OPTS, Btn, Card, C, Divider, f, ImgInput, Inp, Sel, SectionHeader, Toast, Txt, base } from './adminUi'

const PASS = 'lacan2025'
// Acceso libre por el momento. Poné true para volver a pedir la contraseña.
const REQUIRE_PASSWORD = false

// ═══════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════

// ── DASHBOARD ─────────────────────────────────────────────
function Dashboard({ data, setSection }) {
  const totalItems = Object.values(data.menu).reduce((a, c) => a + c.items.length, 0)
  const visibleMenu = Object.values(data.menu).reduce((a, c) => a + c.items.filter(i => i.visible !== false).length, 0)
  const visibleGallery = data.gallery.filter(p => p.visible !== false).length
  const stats = [
    { label: 'Platos en carta',   value: totalItems,       sub: `${visibleMenu} visibles`,               icon: UtensilsCrossed, section: 'menu' },
    { label: 'Fotos en galería',  value: data.gallery.length, sub: `${visibleGallery} visibles`,          icon: Images, section: 'galeria' },
    { label: 'Promos activas',    value: data.promos.filter(p => p.visible).length, sub: 'en portada',   icon: Tag, section: 'promos' },
    { label: 'Imágenes del sitio',value: Object.keys(data.images).length, sub: 'portada y secciones',   icon: ImageIcon, section: 'imagenes' },
    { label: 'Pedidos nuevos',    value: loadOrders().filter(o => o.status === 'nuevo').length, sub: 'delivery y take away', icon: Bike, section: 'pedidos' },
  ]
  const actions = [
    { icon: UtensilsCrossed, label: 'Editar precios de la carta',   sub: 'Actualizá precios, descripciones y badges',   section: 'menu' },
    { icon: Tag, label: 'Gestionar promos',           sub: 'Editá las promos que aparecen en la home',    section: 'promos' },
    { icon: Images, label: 'Gestionar galería',           sub: 'Agregá, ocultá o eliminá fotos',              section: 'galeria' },
    { icon: ImageIcon, label: 'Cambiar imágenes',           sub: 'Portada, experiencia, combinados, reservas',       section: 'imagenes' },
    { icon: Info, label: 'Información del local',      sub: 'Teléfono, horarios, pagos, redes',          section: 'info' },
  ]
  return (
    <div>
      <SectionHeader eyebrow="Panel de control" title="Bienvenido" subtitle="Editá el contenido del sitio. Los cambios se guardan en este navegador." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 44 }}>
        {stats.map((s, i) => (
          <motion.button key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            onClick={() => setSection(s.section)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `2px solid ${C.gold}`, padding: '22px 18px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.borderTop = `2px solid ${C.gold}` }}>
            <div style={{ color: C.gold, marginBottom: 12 }}><s.icon size={22} strokeWidth={1.2} /></div>
            <div style={{ fontFamily: f.serif, fontSize: 38, color: C.gold, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontFamily: f.sans, fontSize: 12, color: C.cream, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: f.sans, fontSize: 11, color: C.muted }}>{s.sub}</div>
          </motion.button>
        ))}
      </div>
      <p style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.muted, marginBottom: 14 }}>Accesos rápidos</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginBottom: 36 }}>
        {actions.map((a, i) => (
          <motion.button key={a.section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.06 }}
            onClick={() => setSection(a.section)}
            style={{ background: C.card, border: `1px solid ${C.border}`, padding: '18px 20px', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = 'rgba(198,166,107,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card }}>
            <span style={{ color: C.gold, marginTop: 1 }}><a.icon size={20} strokeWidth={1.2} /></span>
            <div>
              <div style={{ fontFamily: f.sans, fontSize: 13, fontWeight: 600, color: C.cream, marginBottom: 3 }}>{a.label}</div>
              <div style={{ fontFamily: f.sans, fontSize: 12, color: C.muted }}>{a.sub}</div>
            </div>
          </motion.button>
        ))}
      </div>
      <div style={{ background: 'rgba(198,166,107,0.04)', border: `1px solid rgba(198,166,107,0.18)`, borderLeft: `3px solid ${C.gold}`, padding: '16px 20px' }}>
        <p style={{ fontFamily: f.sans, fontSize: 13, color: C.subtle, lineHeight: 1.7 }}>
          <strong style={{ color: C.gold }}>Tip:</strong> Los cambios quedan guardados sólo en este navegador; el público no los ve hasta conectar una base de datos. Presioná <strong style={{ color: C.cream }}>Guardar</strong> en cada sección para confirmar.
        </p>
      </div>
    </div>
  )
}

// ── MENÚ EDITOR ───────────────────────────────────────────
const EMPTY_ITEM = { name: '', description: '', price: '', badge: '', units: '', image: '' }

function MenuEditor() {
  const { data, updateMenu } = useSite()
  const [menu, setMenu] = useState(() => JSON.parse(JSON.stringify(data.menu)))
  const [cat, setCat] = useState(Object.keys(data.menu)[0])
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState(EMPTY_ITEM)

  const set = (c, i, field, val) => {
    const m = JSON.parse(JSON.stringify(menu))
    m[c].items[i][field] = val
    setMenu(m)
  }
  const del = (c, i) => { const m = JSON.parse(JSON.stringify(menu)); m[c].items.splice(i, 1); setMenu(m) }
  const tog = (c, i) => { const m = JSON.parse(JSON.stringify(menu)); m[c].items[i].visible = !m[c].items[i].visible; setMenu(m) }
  const add = () => {
    if (!newItem.name.trim()) return
    const m = JSON.parse(JSON.stringify(menu))
    m[cat].items.push({ ...newItem, id: `n_${Date.now()}`, visible: true })
    setMenu(m); setNewItem(EMPTY_ITEM); setAdding(false)
  }

  const items = menu[cat]?.items || []
  return (
    <div>
      <SectionHeader eyebrow="Contenido" title="Editor de Carta" subtitle="Editá precios, nombres y descripciones. Ocultá temporalmente un plato sin borrarlo."
        action={<Btn onClick={() => updateMenu(menu)}><Save size={14} style={{ verticalAlign: -2, marginRight: 8 }} />Guardar carta</Btn>} />

      {/* Category tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 28, overflowX: 'auto' }}>
        {Object.keys(menu).map(k => (
          <button key={k} onClick={() => setCat(k)} style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: cat === k ? C.gold : C.muted, background: 'none', border: 'none', borderBottom: cat === k ? `2px solid ${C.gold}` : '2px solid transparent', padding: '13px 18px', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1, transition: 'color 0.2s' }}>
            {menu[k].label}
          </button>
        ))}
      </div>

      <p style={{ fontFamily: f.sans, fontSize: 12, color: C.muted, marginBottom: 20 }}>
        <span style={{ color: C.cream, fontWeight: 600 }}>{items.length}</span> platos &nbsp;·&nbsp;
        <span style={{ color: C.gold, fontWeight: 600 }}>{items.filter(i => i.visible !== false).length}</span> visibles
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, idx) => (
          <div key={item.id || idx} style={{ background: item.visible !== false ? C.card : 'rgba(17,17,16,0.5)', border: `1px solid ${item.visible !== false ? C.border : 'rgba(255,255,255,0.04)'}`, borderLeft: `3px solid ${item.visible !== false ? C.gold : 'rgba(255,255,255,0.06)'}`, padding: '18px 20px', opacity: item.visible !== false ? 1 : 0.45, transition: 'all 0.2s' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px auto auto', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <input value={item.name} onChange={e => set(cat, idx, 'name', e.target.value)}
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
                style={{ ...base, fontFamily: f.serif, fontSize: 17, fontWeight: 500, padding: '9px 12px' }} />
              <input value={item.price} onChange={e => set(cat, idx, 'price', e.target.value)}
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
                placeholder="0000" style={{ ...base, fontFamily: f.serif, fontSize: 16, color: C.gold, textAlign: 'center', padding: '9px 10px' }} />
              <button onClick={() => tog(cat, idx)} style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 12px', border: 'none', cursor: 'pointer', background: item.visible !== false ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', color: item.visible !== false ? '#4ade80' : '#ef4444', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                {item.visible !== false ? '● Vis.' : '○ Oct.'}
              </button>
              <button onClick={() => del(cat, idx)} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 20, padding: '4px 6px', lineHeight: 1, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.danger}
                onMouseLeave={e => e.currentTarget.style.color = '#374151'}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 10, alignItems: 'flex-start' }}>
              <textarea value={item.description} rows={2} onChange={e => set(cat, idx, 'description', e.target.value)}
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
                style={{ ...base, resize: 'none', fontSize: 12, color: C.muted }} />
              <select value={item.badge || ''} onChange={e => set(cat, idx, 'badge', e.target.value)}
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
                style={{ ...base, fontSize: 11, padding: '8px 10px', cursor: 'pointer', background: '#0d0d0d' }}>
                {BADGE_OPTS.map(o => <option key={o.value} value={o.value} style={{ background: '#111' }}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginTop: 10, alignItems: 'center' }}>
              <input value={item.units || ''} onChange={e => set(cat, idx, 'units', e.target.value)} placeholder="Unidades (ej: 6 unidades)" aria-label="Unidades" style={{ ...base, fontSize: 12 }} />
              <input defaultValue={(item.options || []).join(', ')} onBlur={e => set(cat, idx, 'options', splitList(e.target.value))} placeholder="Opciones separadas por coma" aria-label="Opciones" style={{ ...base, fontSize: 12 }} />
              <input value={item.image || ''} onChange={e => set(cat, idx, 'image', e.target.value)} placeholder="URL o ruta de la foto" aria-label="Foto" style={{ ...base, fontSize: 12, fontFamily: 'monospace' }} />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: f.sans, fontSize: 12, color: C.subtle, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!item.featured} onChange={e => set(cat, idx, 'featured', e.target.checked)} style={{ accentColor: C.gold }} />
                Destacado en la home
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div style={{ marginTop: 10 }}>
        <AnimatePresence>
          {adding ? (
            <motion.div key="form" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: C.card, border: `1px solid ${C.gold}`, borderTop: `2px solid ${C.gold}`, padding: '24px 20px', marginBottom: 10 }}>
              <p style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 18 }}>Nuevo plato — {menu[cat]?.label}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Inp label="Nombre" value={newItem.name} onChange={e => setNewItem(v => ({ ...v, name: e.target.value }))} placeholder="Ej: Gyoza" />
                <Inp label="Precio (sin $)" value={newItem.price} onChange={e => setNewItem(v => ({ ...v, price: e.target.value }))} placeholder="3500" />
              </div>
              <Txt label="Descripción" value={newItem.description} onChange={e => setNewItem(v => ({ ...v, description: e.target.value }))} rows={2} />
              <Inp label="Unidades" value={newItem.units} onChange={e => setNewItem(v => ({ ...v, units: e.target.value }))} placeholder="Ej: 6 unidades" />
              <Inp label="Foto (URL o ruta)" value={newItem.image} onChange={e => setNewItem(v => ({ ...v, image: e.target.value }))} placeholder="https://..." mono />
              <Sel label="Badge" value={newItem.badge} onChange={e => setNewItem(v => ({ ...v, badge: e.target.value }))} options={BADGE_OPTS} />
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn onClick={add}>Agregar plato</Btn>
                <Btn variant="ghost" onClick={() => setAdding(false)}>Cancelar</Btn>
              </div>
            </motion.div>
          ) : (
            <button onClick={() => setAdding(true)} style={{ width: '100%', background: 'transparent', border: `1px dashed rgba(198,166,107,0.22)`, color: C.gold, padding: '14px', fontFamily: f.sans, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', marginTop: 4 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(198,166,107,0.05)'; e.currentTarget.style.borderColor = C.gold }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(198,166,107,0.22)' }}>
              + Agregar plato a {menu[cat]?.label}
            </button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── PROMOS EDITOR ─────────────────────────────────────────
function PromosEditor() {
  const { data, updatePromos } = useSite()
  const [promos, setPromos] = useState(() => JSON.parse(JSON.stringify(data.promos)))

  const set = (i, field, val) => { const p = [...promos]; p[i] = { ...p[i], [field]: val }; setPromos(p) }
  const del = (i) => setPromos(promos.filter((_, j) => j !== i))
  const add = () => setPromos([...promos, { id: `pr_${Date.now()}`, label: '', price: '', visible: true }])

  return (
    <div>
      <SectionHeader eyebrow="Home" title="Promos del Día" subtitle="Estas promos aparecen en la sección de la home. Podés editarlas, ocultarlas o agregar nuevas."
        action={<Btn onClick={() => updatePromos(promos)}><Save size={14} style={{ verticalAlign: -2, marginRight: 8 }} />Guardar promos</Btn>} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {promos.map((p, i) => (
          <div key={p.id} style={{ background: C.card, border: `1px solid ${p.visible ? C.border : 'rgba(255,255,255,0.04)'}`, borderLeft: `3px solid ${p.visible ? C.gold : 'rgba(255,255,255,0.06)'}`, padding: '16px 18px', opacity: p.visible ? 1 : 0.45, transition: 'all 0.2s' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px auto auto', gap: 10, alignItems: 'center' }}>
              <input value={p.label} onChange={e => set(i, 'label', e.target.value)} placeholder="Nombre de la promo"
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
                style={{ ...base, fontFamily: f.serif, fontSize: 15, padding: '9px 12px' }} />
              <input value={p.price} onChange={e => set(i, 'price', e.target.value)} placeholder="0000"
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
                style={{ ...base, fontFamily: f.serif, fontSize: 16, color: C.gold, textAlign: 'center', padding: '9px 10px' }} />
              <button onClick={() => set(i, 'visible', !p.visible)} style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 12px', border: 'none', cursor: 'pointer', background: p.visible ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', color: p.visible ? '#4ade80' : '#ef4444', whiteSpace: 'nowrap' }}>
                {p.visible ? '● Vis.' : '○ Oct.'}
              </button>
              <button onClick={() => del(i)} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 20, padding: '4px 6px', lineHeight: 1, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.danger}
                onMouseLeave={e => e.currentTarget.style.color = '#374151'}>×</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} style={{ width: '100%', background: 'transparent', border: `1px dashed rgba(198,166,107,0.22)`, color: C.gold, padding: '14px', fontFamily: f.sans, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', marginTop: 8, transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(198,166,107,0.05)'; e.currentTarget.style.borderColor = C.gold }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(198,166,107,0.22)' }}>
        + Nueva promo
      </button>
    </div>
  )
}

// ── GALERÍA EDITOR ────────────────────────────────────────
const GALLERY_CATS = ['Sushi', 'Combinados', 'Cocina', 'Ambiente']

function GaleriaEditor() {
  const { data, updateGallery } = useSite()
  const [gallery, setGallery] = useState(() => JSON.parse(JSON.stringify(data.gallery)))
  const [adding, setAdding] = useState(false)
  const [newPhoto, setNewPhoto] = useState({ src: '', title: '', cat: 'Sushi' })

  const tog = (i) => { const g = [...gallery]; g[i] = { ...g[i], visible: !g[i].visible }; setGallery(g) }
  const del = (i) => setGallery(gallery.filter((_, j) => j !== i))
  const upd = (i, field, val) => { const g = [...gallery]; g[i] = { ...g[i], [field]: val }; setGallery(g) }
  const add = () => {
    if (!newPhoto.src.trim()) return
    setGallery([...gallery, { ...newPhoto, id: `g_${Date.now()}`, visible: true }])
    setNewPhoto({ src: '', title: '', cat: 'Sushi' }); setAdding(false)
  }

  return (
    <div>
      <SectionHeader eyebrow="Galería" title="Gestión de Fotos" subtitle="Agregá, ocultá o eliminá fotos. Las fotos marcadas como visibles aparecen en la galería pública."
        action={<Btn onClick={() => updateGallery(gallery)}><Save size={14} style={{ verticalAlign: -2, marginRight: 8 }} />Guardar galería</Btn>} />

      <p style={{ fontFamily: f.sans, fontSize: 12, color: C.muted, marginBottom: 24 }}>
        <span style={{ color: C.cream, fontWeight: 600 }}>{gallery.length}</span> fotos totales &nbsp;·&nbsp;
        <span style={{ color: C.gold, fontWeight: 600 }}>{gallery.filter(p => p.visible !== false).length}</span> visibles
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {gallery.map((photo, i) => (
          <motion.div key={photo.id} layout style={{ background: C.card, border: `1px solid ${photo.visible !== false ? C.border : 'rgba(255,255,255,0.04)'}`, overflow: 'hidden', opacity: photo.visible !== false ? 1 : 0.45, transition: 'all 0.25s' }}>
            <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
              <img src={photo.src} alt={photo.title} onError={e => e.target.style.display = 'none'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                <button onClick={() => tog(i)} style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 10px', border: 'none', cursor: 'pointer', background: photo.visible !== false ? 'rgba(74,222,128,0.85)' : 'rgba(239,68,68,0.85)', color: '#fff' }}>
                  {photo.visible !== false ? '● Vis' : '○ Oct'}
                </button>
                <button onClick={() => del(i)} style={{ background: 'rgba(239,68,68,0.85)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, padding: '5px 9px', lineHeight: 1 }}>×</button>
              </div>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <input value={photo.title} onChange={e => upd(i, 'title', e.target.value)} placeholder="Título de la foto"
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
                style={{ ...base, fontSize: 12, marginBottom: 8 }} />
              <select value={photo.cat} onChange={e => upd(i, 'cat', e.target.value)}
                onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
                style={{ ...base, fontSize: 11, padding: '7px 10px', cursor: 'pointer', background: '#0d0d0d' }}>
                {GALLERY_CATS.map(c => <option key={c} value={c} style={{ background: '#111' }}>{c}</option>)}
              </select>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <AnimatePresence>
          {adding ? (
            <motion.div key="form" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: C.card, border: `1px solid ${C.gold}`, borderTop: `2px solid ${C.gold}`, padding: '24px 20px' }}>
              <p style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 18 }}>Nueva foto</p>
              <ImgInput label="URL de la imagen" value={newPhoto.src} onChange={v => setNewPhoto(p => ({ ...p, src: v }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Inp label="Título" value={newPhoto.title} onChange={e => setNewPhoto(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Niguiris" />
                <Sel label="Categoría" value={newPhoto.cat} onChange={e => setNewPhoto(p => ({ ...p, cat: e.target.value }))} options={GALLERY_CATS.map(c => ({ value: c, label: c }))} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn onClick={add}>Agregar foto</Btn>
                <Btn variant="ghost" onClick={() => setAdding(false)}>Cancelar</Btn>
              </div>
            </motion.div>
          ) : (
            <button onClick={() => setAdding(true)} style={{ width: '100%', background: 'transparent', border: `1px dashed rgba(198,166,107,0.22)`, color: C.gold, padding: '14px', fontFamily: f.sans, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(198,166,107,0.05)'; e.currentTarget.style.borderColor = C.gold }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(198,166,107,0.22)' }}>
              + Agregar foto a la galería
            </button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── IMÁGENES DEL SITIO ─────────────────────────────────────
function ImagenesEditor() {
  const { data, updateImages } = useSite()
  const [imgs, setImgs] = useState({ ...data.images })
  const set = (k, v) => setImgs(i => ({ ...i, [k]: v }))
  const labels = {
    hero: 'Portada principal', experience1: 'Experiencia 01: Sushi Art', experience2: 'Experiencia 02: Combinados',
    experience3: 'Experiencia 03: Cocina japonesa', combinados: 'Sección Combinados', reservas: 'Sección Reservas', nosotros: 'Página Nosotros',
  }
  return (
    <div>
      <SectionHeader eyebrow="Imágenes" title="Imágenes del Sitio" subtitle="Cambiá las imágenes principales pegando la URL. Podés usar Unsplash u otras fuentes."
        action={<Btn onClick={() => updateImages(imgs)}><Save size={14} style={{ verticalAlign: -2, marginRight: 8 }} />Guardar imágenes</Btn>} />
      {Object.entries(labels).map(([k, l]) => (
        <ImgInput key={k} label={l} value={imgs[k] || ''} onChange={v => set(k, v)} />
      ))}
    </div>
  )
}

// ── INFO DEL LOCAL ─────────────────────────────────────────
function InfoEditor() {
  const { data, updateInfo } = useSite()
  const [info, setInfo] = useState({ ...data.info, hours: JSON.parse(JSON.stringify(data.info.hours)) })
  const set = (k, v) => setInfo(i => ({ ...i, [k]: v }))
  const setHour = (i, field, v) => { const h = [...info.hours]; h[i] = { ...h[i], [field]: v }; setInfo(s => ({ ...s, hours: h })) }
  const addHour = () => setInfo(s => ({ ...s, hours: [...s.hours, { day: '', time: '' }] }))
  const delHour = (i) => setInfo(s => ({ ...s, hours: s.hours.filter((_, j) => j !== i) }))

  return (
    <div>
      <SectionHeader eyebrow="Información" title="Datos del Local" subtitle="Esta info aparece en el footer, página de contacto y botones de WhatsApp."
        action={<Btn onClick={() => updateInfo(info)}><Save size={14} style={{ verticalAlign: -2, marginRight: 8 }} />Guardar info</Btn>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        <Card>
          <p style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 18 }}>Datos de contacto</p>
          <Inp label="Dirección" value={info.address} onChange={e => set('address', e.target.value)} />
          <Inp label="Teléfono (display)" value={info.phone} onChange={e => set('phone', e.target.value)} placeholder="11 3123-1586" />
          <Inp label="WhatsApp (solo números, con código de país)" value={info.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="541131231586" />
          <Inp label="Link Google Maps" value={info.mapsUrl} onChange={e => set('mapsUrl', e.target.value)} mono />
        </Card>
        <Card>
          <p style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 18 }}>Redes sociales</p>
          <Inp label="Instagram (solo el usuario, sin @)" value={info.instagram} onChange={e => set('instagram', e.target.value)} placeholder="joakinasushi" />
          <Inp label="Facebook (URL completa)" value={info.facebook} onChange={e => set('facebook', e.target.value)} placeholder="https://facebook.com/..." />
        </Card>
        <Card>
          <p style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 18 }}>Pedidos y reservas</p>
          <Inp label="Medios de pago (separados por coma)" value={info.payments} onChange={e => set('payments', e.target.value)} placeholder="Efectivo, Transferencia" />
          <Txt label="Horarios de reserva (separados por coma)" value={info.reservationTimes} onChange={e => set('reservationTimes', e.target.value)} rows={3} />
        </Card>
      </div>

      <Divider label="Horarios" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {info.hours.map((h, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'center' }}>
            <input value={h.day} onChange={e => setHour(i, 'day', e.target.value)} placeholder="Ej: Martes a Domingo"
              onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
              style={{ ...base }} />
            <input value={h.time} onChange={e => setHour(i, 'time', e.target.value)} placeholder="10:00 — 23:45"
              onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = C.border}
              style={{ ...base }} />
            <button onClick={() => delHour(i)} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 20, padding: '6px', lineHeight: 1, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.danger}
              onMouseLeave={e => e.currentTarget.style.color = '#374151'}>×</button>
          </div>
        ))}
      </div>
      <Btn variant="dashed" onClick={addHour}>+ Agregar horario</Btn>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN ADMIN
// ═══════════════════════════════════════════════════════════

// ── DELIVERY Y TAKE AWAY ──────────────────────────────────
const MODE_FILTERS = [['todos', 'Todos'], ['delivery', 'Delivery'], ['retiro', 'Take away']]
const STATE_FILTERS = [['activos', 'Activos'], ['entregado', 'Entregados'], ['cancelado', 'Cancelados'], ['todos', 'Todos']]

function Chip({ on, onClick, children }) {
  return (
    <button onClick={onClick} style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '10px 16px', border: `1px solid ${on ? C.gold : C.border}`, color: on ? C.gold : C.muted, background: 'transparent', cursor: 'pointer' }}>{children}</button>
  )
}

function OrdersList() {
  const [orders, setOrders] = useState(loadOrders)
  const [mode, setMode] = useState('todos')
  const [state, setState] = useState('activos')
  const when = (iso) => new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const count = (s) => orders.filter((o) => o.status === s).length
  const todayKey = new Date().toDateString()
  const todaySales = orders.filter((o) => o.status !== 'cancelado' && new Date(o.createdAt).toDateString() === todayKey).reduce((sum, o) => sum + o.total, 0)

  const shown = orders
    .filter((o) => (mode === 'todos' || o.mode === mode) && (state === 'todos' ? true : state === 'activos' ? ACTIVE.includes(o.status) : o.status === state))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const tiles = [['Nuevos', count('nuevo')], ['Preparando', count('preparando')], ['Listos / en camino', count('listo')], ['Ventas de hoy', formatPrice(todaySales)]]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        {tiles.map(([label, value]) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `2px solid ${C.gold}`, padding: '16px 16px' }}>
            <div style={{ fontFamily: f.serif, fontSize: 32, color: C.gold, lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: f.sans, fontSize: 12, color: C.muted, marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {MODE_FILTERS.map(([k, l]) => <Chip key={k} on={mode === k} onClick={() => setMode(k)}>{l}</Chip>)}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22, alignItems: 'center' }}>
        {STATE_FILTERS.map(([k, l]) => <Chip key={k} on={state === k} onClick={() => setState(k)}>{l}</Chip>)}
        <Btn small variant="ghost" onClick={() => setOrders(loadOrders())}>Actualizar</Btn>
      </div>

      {shown.length === 0 && <Card><p style={{ fontFamily: f.sans, fontSize: 13, color: C.muted }}>No hay pedidos en esta vista. Los pedidos hechos desde la web aparecen acá.</p></Card>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map((o) => {
          const closed = o.status === 'entregado' || o.status === 'cancelado'
          return (
            <div key={o.id} data-order={o.code} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${o.status === 'cancelado' ? 'rgba(255,255,255,0.1)' : C.gold}`, padding: '16px 18px', opacity: closed ? 0.62 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontFamily: f.serif, fontSize: 22, color: C.cream }}>{o.code} <span style={{ fontFamily: f.sans, fontSize: 12, color: C.muted }}>· {when(o.createdAt)}</span></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 9px', border: `1px solid ${C.border}`, color: C.cream }}>{MODE_LABEL[o.mode]}</span>
                  {o.memberId && <span style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 9px', border: `1px solid ${C.gold}`, color: C.gold }}>Club</span>}
                  <span style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 9px', background: o.status === 'cancelado' ? 'rgba(239,68,68,0.12)' : 'rgba(198,166,107,0.16)', color: o.status === 'cancelado' ? C.danger : C.gold }}>{statusLabel(o.status, o.mode)}</span>
                </div>
              </div>
              <div style={{ fontFamily: f.sans, fontSize: 13, color: C.subtle, lineHeight: 1.6, marginBottom: 10 }}>
                <b style={{ color: C.cream, fontWeight: 600 }}>{o.customer.name}</b> · <a href={`tel:${o.customer.phone}`} style={{ color: C.gold }}>{o.customer.phone}</a>
                {o.mode === 'delivery' && o.customer.address && <><br />Dirección: {o.customer.address}</>}
                <br />Pago: {o.payment}
                {o.memberId && <><br />Socio Joakina Club: {summaryForMember(o.memberId)?.member.number ?? 'cuenta eliminada'} · {o.status === 'entregado' ? `${orderPoints(o.id).toLocaleString('es-AR')} puntos acreditados` : 'suma puntos al marcar Entregado'}</>}
                {o.notes && <><br />Nota: {o.notes}</>}
              </div>
              <ul style={{ listStyle: 'none', borderTop: `1px solid ${C.border}`, padding: '8px 0', marginBottom: 8 }}>
                {o.items.map((i, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontFamily: f.sans, fontSize: 13, color: C.cream, padding: '3px 0' }}>
                    <span>{i.qty}× {[i.name, i.units, i.option].filter(Boolean).join(' · ')}</span><span style={{ color: C.muted }}>{formatPrice(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ fontFamily: f.sans, fontSize: 12, color: C.muted }}>
                  {o.mode === 'delivery' && (o.toCoordinate ? 'Envío a coordinar' : `Envío ${o.fee ? formatPrice(o.fee) : 'gratis'}`)}
                </div>
                <div style={{ fontFamily: f.serif, fontSize: 24, color: C.gold }}>{formatPrice(o.total)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {NEXT[o.status] && <Btn small onClick={() => setOrders(setOrderStatus(o.id, NEXT[o.status]))}>Pasar a {statusLabel(NEXT[o.status], o.mode)}</Btn>}
                {!closed && <Btn small variant="danger" onClick={() => setOrders(setOrderStatus(o.id, 'cancelado'))}>Cancelar</Btn>}
                {closed && <Btn small variant="outline" onClick={() => setOrders(setOrderStatus(o.id, 'nuevo'))}>Reabrir</Btn>}
                <Btn small variant="ghost" onClick={() => { if (confirm('¿Eliminar este pedido?')) setOrders(deleteOrder(o.id)) }}>Eliminar</Btn>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ServiceConfig() {
  const { data, updateService } = useSite()
  const [cfg, setCfg] = useState(() => JSON.parse(JSON.stringify(data.service)))
  const set = (mode, field) => (e) => setCfg((c) => ({ ...c, [mode]: { ...c[mode], [field]: e.target.value } }))
  const toggle = (mode) => setCfg((c) => ({ ...c, [mode]: { ...c[mode], enabled: !c[mode].enabled } }))

  const Switch = ({ mode }) => (
    <button onClick={() => toggle(mode)} aria-pressed={cfg[mode].enabled} style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '9px 14px', border: 'none', cursor: 'pointer', background: cfg[mode].enabled ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)', color: cfg[mode].enabled ? '#4ade80' : '#ef4444' }}>
      {cfg[mode].enabled ? '● Activado' : '○ Desactivado'}
    </button>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Btn onClick={() => updateService(cfg)}><Save size={14} style={{ verticalAlign: -2, marginRight: 8 }} />Guardar configuración</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <p style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold }}>Delivery</p>
            <Switch mode="delivery" />
          </div>
          <Inp label="Tiempo estimado" value={cfg.delivery.minutes} onChange={set('delivery', 'minutes')} placeholder="Ej: 40 a 60 min" />
          <Inp label="Costo de envío ($)" value={cfg.delivery.fee} onChange={set('delivery', 'fee')} placeholder="Vacío = a coordinar" hint="Si lo dejás vacío, el cliente ve «A coordinar». Con 0 el envío es gratis." />
          <Inp label="Envío gratis desde ($)" value={cfg.delivery.freeFrom} onChange={set('delivery', 'freeFrom')} placeholder="Ej: 80000" />
          <Inp label="Pedido mínimo ($)" value={cfg.delivery.minOrder} onChange={set('delivery', 'minOrder')} placeholder="Ej: 30000" />
          <Txt label="Zonas de entrega y aclaraciones" value={cfg.delivery.note} onChange={set('delivery', 'note')} rows={3} placeholder="Se muestra al cliente en el pedido." />
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <p style={{ fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold }}>Take away</p>
            <Switch mode="retiro" />
          </div>
          <Inp label="Tiempo estimado" value={cfg.retiro.minutes} onChange={set('retiro', 'minutes')} placeholder="Ej: 20 a 30 min" />
          <Txt label="Aclaración de retiro" value={cfg.retiro.note} onChange={set('retiro', 'note')} rows={3} placeholder="Ej: Retiro por la puerta principal." />
          <p style={{ fontFamily: f.sans, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>Si desactivás una modalidad, el cliente ya no puede elegirla. Si desactivás las dos, la web avisa que los pedidos están pausados.</p>
        </Card>
      </div>
    </div>
  )
}

function PedidosEditor() {
  const [tab, setTab] = useState('pedidos')
  return (
    <div>
      <SectionHeader eyebrow="Pedidos online" title="Delivery y Take Away"
        subtitle="Los pedidos de la web llegan acá. Demo: se ven sólo en este navegador. Con una base de datos real los verías todos, desde cualquier dispositivo." />
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 28 }}>
        {[['pedidos', 'Pedidos'], ['config', 'Configuración']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: tab === k ? C.gold : C.muted, background: 'none', border: 'none', borderBottom: tab === k ? `2px solid ${C.gold}` : '2px solid transparent', padding: '13px 18px', cursor: 'pointer', marginBottom: -1 }}>{l}</button>
        ))}
      </div>
      {tab === 'pedidos' ? <OrdersList /> : <ServiceConfig />}
    </div>
  )
}

// ── RESERVAS ──────────────────────────────────────────────
function ReservasEditor() {
  const [list, setList] = useState(loadReservations)
  const [filter, setFilter] = useState('proximas')
  const today = toISO(new Date())
  const shown = list
    .filter((r) => filter === 'todas' || r.date >= today)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
  const active = shown.filter((r) => r.status === 'confirmada').length
  const fmt = (iso) => { const t = new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }); return t.charAt(0).toUpperCase() + t.slice(1) }

  return (
    <div>
      <SectionHeader eyebrow="Reservas" title="Reservas de mesas"
        subtitle="Demo: muestra las reservas hechas desde la web en este navegador. Con una base de datos real las verías todas, desde cualquier dispositivo."
        action={<Btn variant="outline" onClick={() => setList(loadReservations())}>Actualizar</Btn>} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['proximas', 'Próximas'], ['todas', 'Todas']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '9px 16px', border: `1px solid ${filter === k ? C.gold : C.border}`, color: filter === k ? C.gold : C.muted, background: 'transparent', cursor: 'pointer' }}>{l}</button>
        ))}
        <span style={{ fontFamily: f.sans, fontSize: 12, color: C.muted, marginLeft: 8 }}><b style={{ color: C.cream }}>{active}</b> confirmadas · {shown.length} en la lista</span>
      </div>
      {shown.length === 0 && <Card><p style={{ fontFamily: f.sans, fontSize: 13, color: C.muted }}>Todavía no hay reservas. Hacé una desde la página de Reservas para verla acá.</p></Card>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shown.map((r) => {
          const ok = r.status === 'confirmada'
          return (
            <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ok ? C.gold : 'rgba(255,255,255,0.08)'}`, padding: '16px 18px', opacity: ok ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <div style={{ fontFamily: f.serif, fontSize: 22, color: C.cream }}>{fmt(r.date)} · {r.time} hs</div>
                <div style={{ fontFamily: f.sans, fontSize: 11, color: C.gold, letterSpacing: '0.14em' }}>{r.code}</div>
              </div>
              <div style={{ fontFamily: f.sans, fontSize: 13, color: C.subtle, margin: '6px 0 12px', lineHeight: 1.6 }}>
                <b style={{ color: C.cream, fontWeight: 600 }}>{r.name}</b> · {r.party} personas · {tableById(r.tableId)?.label ?? r.tableId} · <a href={`tel:${r.phone}`} style={{ color: C.gold }}>{r.phone}</a>
                {r.notes && <><br />Nota: {r.notes}</>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn small variant={ok ? 'danger' : 'outline'} onClick={() => setList(setReservationStatus(r.id, ok ? 'cancelada' : 'confirmada'))}>{ok ? 'Cancelar' : 'Reactivar'}</Btn>
                <Btn small variant="ghost" onClick={() => { if (confirm('¿Eliminar esta reserva?')) setList(deleteReservation(r.id)) }}>Eliminar</Btn>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'menu',      label: 'Carta',        icon: UtensilsCrossed },
  { id: 'promos',    label: 'Promos',       icon: Tag },
  { id: 'galeria',   label: 'Galería',      icon: Images },
  { id: 'imagenes',  label: 'Imágenes',     icon: ImageIcon },
  { id: 'pedidos',   label: 'Delivery / Take Away', icon: Bike },
  { id: 'club',      label: 'Joakina Club', icon: Gem },
  { id: 'reservas',  label: 'Reservas',     icon: CalendarDays },
  { id: 'info',      label: 'Información',  icon: Info },
]

function AdminPanel() {
  const { data, toastVisible, resetAll } = useSite()
  const [section, setSection] = useState('dashboard')
  const [sideOpen, setSideOpen] = useState(false)

  const SECTIONS = {
    dashboard: <Dashboard data={data} setSection={setSection} />,
    menu:      <MenuEditor />,
    promos:    <PromosEditor />,
    galeria:   <GaleriaEditor />,
    imagenes:  <ImagenesEditor />,
    pedidos:   <PedidosEditor />,
    club:      <AdminClub />,
    reservas:  <ReservasEditor />,
    info:      <InfoEditor />,
  }

  const Sidebar = () => (
    <div style={{ width: 220, flexShrink: 0, background: C.bg, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Brand */}
      <div style={{ padding: '28px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: f.serif, fontSize: 16, color: C.cream, letterSpacing: '0.1em', lineHeight: 1.2 }}>JOAKINA SUSHI</div>
        <div style={{ fontFamily: f.sans, fontSize: 10, color: C.gold, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>Panel Admin</div>
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => { setSection(n.id); setSideOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 20px', background: section === n.id ? 'rgba(198,166,107,0.08)' : 'transparent', border: 'none', borderLeft: `3px solid ${section === n.id ? C.gold : 'transparent'}`, color: section === n.id ? C.gold : C.muted, fontFamily: f.sans, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (section !== n.id) { e.currentTarget.style.color = C.cream; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' } }}
            onMouseLeave={e => { if (section !== n.id) { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent' } }}>
            <n.icon size={17} strokeWidth={1.3} />
            {n.label}
          </button>
        ))}
      </nav>
      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontFamily: f.sans, fontSize: 11, color: C.muted, textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = C.cream}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}>
          <ArrowUpRight size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Ver sitio público
        </a>
        <button onClick={() => { if (confirm('¿Restaurar todos los datos al estado original?')) resetAll() }} style={{ fontFamily: f.sans, fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.05em' }}>
          <RotateCcw size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Restaurar datos
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: f.sans }}>
      {/* Desktop sidebar */}
      <div className="admin-sidebar"><Sidebar /></div>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSideOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000 }} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.25 }} style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 1001 }}>
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSideOpen(true)} className="admin-hamburger" style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20, padding: '4px 6px', display: 'none' }}><MenuIcon size={22} strokeWidth={1.3} /></button>
            <span style={{ fontFamily: f.sans, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
              {NAV.find(n => n.id === section)?.label ?? 'Dashboard'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ fontFamily: f.sans, fontSize: 11, color: C.muted }}>En línea</span>
          </div>
        </div>

        {/* Section content */}
        <div style={{ flex: 1, padding: '40px 32px', overflowY: 'auto', maxWidth: 1100 }}>
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              {SECTIONS[section]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Toast visible={toastVisible} />

      <style>{`
        @media (min-width: 769px) { .admin-sidebar { display: block; } .admin-hamburger { display: none !important; } }
        @media (max-width: 768px)  { .admin-sidebar { display: none; } .admin-hamburger { display: block !important; } }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════
export default function Admin() {
  const [pass, setPass]       = useState('')
  const [auth, setAuth]       = useState(() => !REQUIRE_PASSWORD || sessionStorage.getItem('jsl_admin') === '1')
  const [err, setErr]         = useState(false)
  const [show, setShow]       = useState(false)

  const login = (e) => {
    e.preventDefault()
    if (pass === PASS) { sessionStorage.setItem('jsl_admin', '1'); setAuth(true) }
    else { setErr(true); setPass(''); setTimeout(() => setErr(false), 2200) }
  }

  if (auth) return <AdminPanel />

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontFamily: f.sans, fontSize: 10, letterSpacing: '0.4em', color: C.gold, textTransform: 'uppercase', marginBottom: 12 }}>Panel de administración</p>
          <div style={{ color: C.cream, marginBottom: 12 }}><Isotype size={56} /></div>
          <h1 style={{ fontFamily: f.serif, fontSize: 38, color: C.cream, fontWeight: 500, lineHeight: 1 }}>Joakina Sushi</h1>
        </div>

        <Card accent>
          <form onSubmit={login}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••••"
                  onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = err ? '#ef4444' : C.border}
                  style={{ ...base, borderColor: err ? '#ef4444' : C.border, paddingRight: 44 }} autoFocus />
                <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <AnimatePresence>
                {err && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ fontFamily: f.sans, fontSize: 12, color: '#ef4444', marginTop: 8 }}>
                    Contraseña incorrecta
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <Btn type="submit" variant="gold" full>Ingresar al panel</Btn>
          </form>
        </Card>

        <p style={{ fontFamily: f.sans, fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 20 }}>
          Joakina Sushi · Sushi Art
        </p>
      </motion.div>
    </div>
  )
}
