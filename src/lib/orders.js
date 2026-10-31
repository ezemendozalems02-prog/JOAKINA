/**
 * Pedidos de delivery y take away (DEMO).
 * Se guardan en localStorage (clave joakina_orders), igual que las reservas.
 * Para pasar a producción hay que reemplazar load/save por llamadas a una API.
 */
const KEY = 'joakina_orders'

export const MODE_LABEL = { retiro: 'Take away', delivery: 'Delivery' }
export const ACTIVE = ['nuevo', 'preparando', 'listo']
export const NEXT = { nuevo: 'preparando', preparando: 'listo', listo: 'entregado' }

export const statusLabel = (status, mode) => ({
  nuevo: 'Nuevo',
  preparando: 'Preparando',
  listo: mode === 'delivery' ? 'En camino' : 'Listo para retirar',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}[status])

/** Costo de envío según la configuración. `toCoordinate`: no hay tarifa cargada. */
export function computeTotals(service, mode, subtotal) {
  if (mode !== 'delivery') return { fee: 0, free: false, toCoordinate: false, total: subtotal }
  const d = service.delivery
  const freeFrom = Number(d.freeFrom) || 0
  const free = freeFrom > 0 && subtotal >= freeFrom
  const hasFee = String(d.fee ?? '').trim() !== ''
  const fee = free || !hasFee ? 0 : Number(d.fee) || 0
  return { fee, free, toCoordinate: !free && !hasFee, total: subtotal + fee }
}

export function loadOrders() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}

function persist(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* sin almacenamiento la demo no guarda */ }
  return list
}

export function createOrder({ mode, items, subtotal, fee, total, toCoordinate, customer, payment, notes }) {
  const order = {
    id: `o_${Date.now()}`,
    code: `P-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    status: 'nuevo',
    mode,
    items: items.map((i) => ({ name: i.name, units: i.units, option: i.option, qty: i.qty, price: i.price })),
    subtotal, fee, total, toCoordinate: !!toCoordinate, customer, payment, notes,
  }
  persist([...loadOrders(), order])
  return order
}

export function setOrderStatus(id, status) {
  return persist(loadOrders().map((o) => (o.id === id ? { ...o, status } : o)))
}

export function deleteOrder(id) {
  return persist(loadOrders().filter((o) => o.id !== id))
}
