/**
 * JOAKINA CLUB — reglas puras (sin almacenamiento ni interfaz).
 * Todo lo que acá se calcula sale de datos guardados, nunca de valores enviados por la pantalla.
 */

/** Tipos de movimiento del historial. kind decide cómo cuenta para saldo, nivel y "utilizados". */
export const TYPES = {
  bienvenida: { label: 'Puntos de bienvenida', kind: 'earn' },
  compra: { label: 'Pedido realizado', kind: 'earn' },
  primera_compra: { label: 'Bonificación por tu primera compra', kind: 'earn' },
  pedidos_n: { label: 'Bonificación por pedidos completados', kind: 'earn' },
  pedidos_total: { label: 'Bonificación por pedidos acumulados', kind: 'earn' },
  referido: { label: 'Amigo invitado', kind: 'earn' },
  cumple: { label: 'Regalo de cumpleaños', kind: 'earn' },
  visita: { label: 'Puntos por visita', kind: 'earn' },
  mision: { label: 'Desafío completado', kind: 'earn' },
  ajuste: { label: 'Ajuste del local', kind: 'adjust' },
  canje: { label: 'Canje de recompensa', kind: 'spend' },
  canje_cancelado: { label: 'Canje cancelado (reintegro)', kind: 'refund' },
  reversa: { label: 'Reversión de puntos', kind: 'reverse' },
}

export const DEFAULT_LEVELS = [
  { id: 'new', name: 'NEW MEMBER', min: 0, description: 'Tu primer paso en el club.', perks: ['Acumulá puntos en cada pedido', 'Accedé al catálogo de canjes'] },
  { id: 'lover', name: 'SUSHI LOVER', min: 1000, description: 'Ya sabés lo que te gusta.', perks: ['Promociones exclusivas para socios', 'Bonificaciones de los desafíos'] },
  { id: 'fan', name: 'SUSHI FAN', min: 3000, description: 'Un cliente de la casa.', perks: ['Novedades de la carta antes que nadie', 'Sorpresas en fechas especiales'] },
  { id: 'vip', name: 'JOAKINA VIP', min: 6000, description: 'La experiencia completa.', perks: ['Beneficio exclusivo Joakina VIP', 'Atención prioritaria en reservas'] },
]

export const DEFAULT_CONFIG = {
  blockAmount: 1000, // cada $1.000...
  pointsPerBlock: 10, // ...suma 10 puntos
  visitPoints: 50,
  referralPoints: 300,
  googleReviewUrl: '',
  branches: [{ id: 'principal', name: 'Joakina Sushi' }],
  levels: DEFAULT_LEVELS,
}

/** Cada misión es una regla de bonificación. `system`: no se puede borrar, sólo desactivar. */
export const DEFAULT_MISSIONS = [
  { id: 'm_register', system: true, trigger: 'register', name: 'Registrate en Joakina Club', description: 'Sumate gratis y recibí tus puntos de bienvenida.', points: 200, target: 1, enabled: true },
  { id: 'm_first', system: true, trigger: 'first_order', name: 'Realizá tu primera compra', description: 'Tu primer pedido entregado suma una bonificación extra.', points: 300, target: 1, enabled: true },
  { id: 'm_nth', system: true, trigger: 'every_n_orders', name: 'Completá 3 pedidos', description: 'Por cada tercer pedido entregado ganás puntos extra.', points: 200, target: 3, enabled: true },
  { id: 'm_five', system: true, trigger: 'orders_total', name: 'Cumplí 5 pedidos', description: 'Llegá a 5 pedidos entregados y desbloqueá tu bonificación.', points: 500, target: 5, enabled: true },
  { id: 'm_share', system: false, trigger: 'manual', name: 'Compartí tu experiencia', description: 'Compartí tu experiencia con Joakina y mostrá tu publicación en el local. La valida el personal.', points: 150, target: 1, enabled: true },
  { id: 'm_birthday', system: true, trigger: 'birthday', name: 'Cumplí años con Joakina', description: 'Reclamá tu regalo durante el mes de tu cumpleaños.', points: 500, target: 1, enabled: true },
  { id: 'm_referral', system: true, trigger: 'referral', name: 'Invitá a un amigo', description: 'Ganás puntos cuando tu invitado completa su primera compra.', points: 300, target: 1, enabled: true },
]

export const DEFAULT_REWARDS = [
  { id: 'r_bebida', name: 'Bebida gratis', description: 'Una bebida a elección para acompañar tu pedido.', points: 500, image: '/img/reward-bebida.webp', enabled: true },
  { id: 'r_entrada', name: 'Entrada seleccionada', description: 'Una entrada seleccionada por el local.', points: 800, image: '/img/gyoza.webp', enabled: true },
  { id: 'r_2p', name: '2 piezas de sushi', description: 'Dos piezas de sushi para sumar a tu pedido.', points: 1200, image: '/img/gal-1.webp', enabled: true },
  { id: 'r_4p', name: '4 piezas de sushi', description: 'Cuatro piezas de sushi, a elección del sushi man.', points: 2000, image: '/img/exp-sushi.webp', enabled: true },
  { id: 'r_combo', name: 'Combo especial', description: 'Un combo especial a elección del sushi man.', points: 3500, image: '/img/combo-especial-12.webp', enabled: true },
  { id: 'r_vip', name: 'Beneficio exclusivo Joakina VIP', description: 'Un beneficio reservado para los socios VIP, definido por el local.', points: 5000, image: '/img/combo-premium.webp', enabled: true },
]

/** Puntos por una compra: cada bloque completo de dinero suma puntos (sin redondear hacia arriba). */
export function purchasePoints(config, amount) {
  const block = Number(config.blockAmount) || 0
  if (block <= 0 || !(amount > 0)) return 0
  return Math.floor(amount / block) * (Number(config.pointsPerBlock) || 0)
}

/** Saldo, puntos históricos (definen el nivel) y puntos utilizados, a partir del historial. */
export function totals(entries) {
  let balance = 0
  let lifetime = 0
  let spent = 0
  for (const e of entries) {
    balance += e.points
    const kind = TYPES[e.type]?.kind
    if (kind === 'earn' || kind === 'reverse') lifetime += e.points
    else if (kind === 'adjust' && e.points > 0) lifetime += e.points
    if (kind === 'spend' || kind === 'refund') spent -= e.points
  }
  return { balance, lifetime: Math.max(0, lifetime), spent }
}

/** Nivel según puntos históricos: gastar puntos nunca baja de nivel. */
export function levelFor(levels, lifetime) {
  const sorted = [...levels].sort((a, b) => a.min - b.min)
  let index = 0
  sorted.forEach((level, i) => { if (lifetime >= level.min) index = i })
  const level = sorted[index]
  const next = sorted[index + 1] ?? null
  const progress = next ? Math.min(1, (lifetime - level.min) / (next.min - level.min)) : 1
  return { index, level, next, progress, remaining: next ? Math.max(0, next.min - lifetime) : 0 }
}
