import { Bike, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'

const MODES = [
  { key: 'retiro', label: 'Take away', Icon: ShoppingBag },
  { key: 'delivery', label: 'Delivery', Icon: Bike },
]

/** Selector Delivery / Take away. Respeta lo que el local tiene activado en el panel. */
export default function ModeSwitch({ form = false }) {
  const { mode, setMode, service } = useCart()
  return (
    <div className={`mode-switch ${form ? 'mode-switch--form' : ''}`} role="radiogroup" aria-label="Modalidad de entrega">
      {MODES.map(({ key, label, Icon }) => {
        const s = service[key]
        return (
          <button key={key} type="button" role="radio" aria-checked={mode === key} disabled={!s.enabled}
            className={mode === key ? 'is-on' : ''} onClick={() => setMode(key)}>
            <Icon size={18} strokeWidth={1.2} />
            <span>{label}{!s.enabled ? <small>No disponible</small> : s.minutes ? <small>{s.minutes}</small> : null}</span>
          </button>
        )
      })}
    </div>
  )
}
