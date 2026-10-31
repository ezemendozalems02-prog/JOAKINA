import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Isotype } from './Logo'

const KEY = 'joakina_intro'

function alreadySeen() {
  try { return sessionStorage.getItem(KEY) === '1' } catch { return false }
}

export default function Preloader() {
  const [visible, setVisible] = useState(() => !alreadySeen() && !window.location.pathname.startsWith('/admin'))

  useEffect(() => {
    if (!visible) return undefined
    const timer = setTimeout(() => {
      setVisible(false)
      try { sessionStorage.setItem(KEY, '1') } catch { /* sin sessionStorage la intro se repite */ }
    }, 1500)
    return () => clearTimeout(timer)
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="preloader" exit={{ opacity: 0 }} transition={{ duration: 0.6 }} role="status" aria-label="Cargando Joakina Sushi">
          <Isotype size={76} animated />
          <motion.p className="preloader__name" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}>JOAKINA</motion.p>
          <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }}>Sushi Art</motion.p>
          <span className="preloader__bar"><span /></span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
