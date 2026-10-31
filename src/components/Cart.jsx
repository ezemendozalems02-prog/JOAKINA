import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../lib/format'

export function QtyControl({ item }) {
  const { setQty } = useCart()
  return (
    <div className="qty">
      <button onClick={() => setQty(item.key, -1)} aria-label={`Quitar uno de ${item.name}`}><Minus size={14} strokeWidth={1.5} /></button>
      <span aria-live="polite">{item.qty}</span>
      <button onClick={() => setQty(item.key, 1)} aria-label={`Sumar uno de ${item.name}`}><Plus size={14} strokeWidth={1.5} /></button>
    </div>
  )
}

export function CartLine({ item }) {
  const { remove } = useCart()
  return (
    <li className="line">
      <img src={item.image} alt="" width="64" height="64" loading="lazy" />
      <div className="line__body">
        <p className="line__name">{item.name}</p>
        <p className="units">{[item.option, item.units].filter(Boolean).join(' · ')}</p>
        <QtyControl item={item} />
      </div>
      <div className="line__side">
        <button className="icon-btn" onClick={() => remove(item.key)} aria-label={`Eliminar ${item.name}`}><Trash2 size={16} strokeWidth={1.3} /></button>
        <span className="price">{formatPrice(item.price * item.qty)}</span>
      </div>
    </li>
  )
}

function CartDrawer() {
  const { items, count, subtotal, open, setOpen, clear } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, setOpen])

  const go = (path) => { setOpen(false); navigate(path) }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside className="drawer" role="dialog" aria-modal="true" aria-label="Tu pedido"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
            <header className="drawer__head">
              <div>
                <p className="eyebrow">Tu pedido</p>
                <p className="drawer__title">{count} {count === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar pedido"><X size={22} strokeWidth={1.3} /></button>
            </header>

            {items.length === 0 ? (
              <div className="drawer__empty">
                <ShoppingBag size={32} strokeWidth={1} />
                <p>Tu pedido está vacío.</p>
                <button className="btn btn--line" onClick={() => go('/takeaway')}>Ver productos</button>
              </div>
            ) : (
              <>
                <ul className="drawer__list">{items.map((item) => <CartLine key={item.key} item={item} />)}</ul>
                <footer className="drawer__foot">
                  <div className="total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                  <button className="btn btn--gold btn--full" onClick={() => go('/checkout')}>Continuar pedido</button>
                  <button className="link-btn" onClick={clear}>Vaciar pedido</button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/** Visible desde cualquier sección en cuanto hay algo en el pedido. */
function FloatingCart() {
  const { count, subtotal, setOpen, lastAdded } = useCart()
  const { pathname } = useLocation()
  const hidden = pathname === '/checkout' || count === 0
  return (
    <>
      <AnimatePresence>
        {lastAdded && pathname !== '/checkout' && (
          <motion.p key="toast" className="toast" role="status" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <Check size={15} strokeWidth={1.6} /> {lastAdded.name}{lastAdded.option ? ` · ${lastAdded.option}` : ''}
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!hidden && (
          <motion.button className="fab" onClick={() => setOpen(true)} aria-label={`Ver pedido, ${count} productos`}
            initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 90, opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
            <motion.span key={count} className="fab__count" initial={{ scale: 1.5 }} animate={{ scale: 1 }}>{count}</motion.span>
            <span className="fab__label">Ver pedido</span>
            <span className="fab__total">{formatPrice(subtotal)}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}

export default function Cart() {
  return (
    <>
      <FloatingCart />
      <CartDrawer />
    </>
  )
}
