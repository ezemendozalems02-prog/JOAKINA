import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu as MenuIcon, ShoppingBag, X } from 'lucide-react'
import Logo from './Logo'
import { useCart } from '../context/CartContext'

const links = [
  { label: 'Inicio', to: '/' },
  { label: 'Carta', to: '/menu' },
  { label: 'Pedir online', to: '/takeaway' },
  { label: 'Reservas', to: '/contacto' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Galería', to: '/galeria' },
]

function BagButton() {
  const { count, setOpen } = useCart()
  return (
    <button className="bag-btn" onClick={() => setOpen(true)} aria-label={`Abrir pedido, ${count} productos`}>
      <ShoppingBag size={20} strokeWidth={1.4} />
      {count > 0 && (
        <motion.span key={count} className="bag-btn__count" initial={{ scale: 0.4 }} animate={{ scale: 1 }}>{count}</motion.span>
      )}
    </button>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [openFor, setOpenFor] = useState(null)
  const { pathname } = useLocation()
  // El menú queda abierto sólo en la ruta donde se abrió: navegar lo cierra.
  const open = openFor === pathname

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <header className={`nav ${scrolled || pathname !== '/' ? 'is-solid' : ''}`}>
        <div className="nav__inner">
          <Link to="/" aria-label="Joakina Sushi, inicio"><Logo /></Link>
          <nav className="nav__links" aria-label="Principal">
            {links.slice(1).map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
          </nav>
          <div className="nav__actions">
            <BagButton />
            <button className="nav__burger" onClick={() => setOpenFor(open ? null : pathname)} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open}>
              {open ? <X size={24} strokeWidth={1.3} /> : <MenuIcon size={24} strokeWidth={1.3} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav className="mobile-menu" aria-label="Menú móvil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {links.map((l, i) => (
              <motion.div key={l.to} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05, duration: 0.5 }}>
                <NavLink to={l.to} end onClick={() => setOpenFor(null)}>
                  <span>0{i + 1}</span>{l.label}
                </NavLink>
              </motion.div>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}
