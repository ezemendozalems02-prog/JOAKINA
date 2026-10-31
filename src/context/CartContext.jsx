/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSite } from './SiteContext'

const KEY = 'joakina_cart'
const CartContext = createContext(null)

function loadCart() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}

export function CartProvider({ children }) {
  const { data } = useSite()
  const [lines, setLines] = useState(loadCart)
  const [open, setOpen] = useState(false)
  const [chosenMode, setMode] = useState('retiro')
  const [lastAdded, setLastAdded] = useState(null)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)) } catch { /* almacenamiento no disponible */ }
  }, [lines])

  // Modalidades que el local tiene activadas en el panel. Si la elegida se desactiva, pasa a la otra.
  const service = data.service
  const allowed = ['retiro', 'delivery'].filter((key) => service[key]?.enabled)
  const mode = allowed.includes(chosenMode) ? chosenMode : (allowed[0] ?? chosenMode)

  // Precio, nombre y foto salen siempre de la carta vigente, no del carrito guardado.
  const items = useMemo(() => {
    const products = Object.values(data.menu).flatMap((category) => category.items)
    return lines.flatMap((line) => {
      const product = products.find((p) => p.id === line.id && p.visible !== false)
      if (!product) return []
      return [{ ...line, name: product.name, units: product.units, image: product.image, price: Number(product.price) || 0 }]
    })
  }, [lines, data.menu])

  const add = useCallback((product, option = '') => {
    const key = `${product.id}::${option}`
    setLines((prev) => (prev.some((l) => l.key === key)
      ? prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
      : [...prev, { key, id: product.id, option, qty: 1 }]))
    setLastAdded({ name: product.name, option, at: Date.now() })
  }, [])

  const setQty = useCallback((key, delta) => {
    setLines((prev) => prev
      .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
      .filter((l) => l.qty > 0))
  }, [])

  const remove = useCallback((key) => setLines((prev) => prev.filter((l) => l.key !== key)), [])
  const clear = useCallback(() => setLines([]), [])

  useEffect(() => {
    if (!lastAdded) return undefined
    const timer = setTimeout(() => setLastAdded(null), 2200)
    return () => clearTimeout(timer)
  }, [lastAdded])

  const count = items.reduce((sum, i) => sum + i.qty, 0)
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0)

  const value = { items, count, subtotal, add, setQty, remove, clear, open, setOpen, mode, setMode, allowed, service, lastAdded }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
