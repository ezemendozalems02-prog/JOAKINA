import { DEFAULT_CONFIG, DEFAULT_MISSIONS, DEFAULT_REWARDS } from './engine'

/**
 * Datos de DEMOSTRACIÓN. Todos los socios creados acá llevan demo: true y se
 * distinguen siempre de los clientes reales. Contraseña de los socios demo: demo1234.
 */
const DAY = 86400000
const ago = (days, hours = 0) => new Date(Date.now() - days * DAY - hours * 3600000).toISOString()

export function buildSeed() {
  const now = new Date()
  const db = {
    version: 1,
    config: structuredClone(DEFAULT_CONFIG),
    missions: structuredClone(DEFAULT_MISSIONS),
    rewards: structuredClone(DEFAULT_REWARDS),
    members: [], ledger: [], redemptions: [], visits: [], sessions: {}, attempts: {}, keys: {},
    counters: { member: 1 },
  }

  const member = (n, firstName, lastName, extra) => {
    const id = `demo_m${n}`
    db.members.push({
      id, number: `JC-${String(db.counters.member++).padStart(4, '0')}`, firstName, lastName,
      email: `${firstName.toLowerCase()}@joakina.demo`, phone: `11555000${n}0${n}`, birthDate: '',
      salt: 'demo-salt', passHash: null, demoPassword: 'demo1234', referralCode: `DEMO${n}${n}${n}`,
      referredBy: null, demo: true, status: 'activo', seenAt: new Date().toISOString(), ...extra,
    })
    return id
  }
  const entry = (memberId, type, points, daysAgo, note, extra = {}) => {
    const id = `demo_e${db.ledger.length + 1}`
    db.ledger.push({ id, memberId, type, points, note, by: 'demo', createdAt: ago(daysAgo), ...extra })
    const m = db.members.find((x) => x.id === memberId)
    if (!m.lastActivityAt || m.lastActivityAt < ago(daysAgo)) m.lastActivityAt = ago(daysAgo)
  }
  const redemption = (memberId, n, rewardId, status, daysAgo, usedDays) => {
    const reward = DEFAULT_REWARDS.find((r) => r.id === rewardId)
    const id = `demo_rd${n}`
    db.redemptions.push({
      id, code: `JC-DEMO${n}${n}`, memberId, rewardId, rewardName: reward.name, rewardImage: reward.image,
      points: reward.points, status, createdAt: ago(daysAgo), ...(status === 'utilizado' ? { usedAt: ago(usedDays), usedBy: 'demo' } : {}),
    })
    entry(memberId, 'canje', -reward.points, daysAgo, `${reward.name} · código JC-DEMO${n}${n}`, { ref: { redemptionId: id } })
  }

  // Valentina — SUSHI FAN, saldo 2.450
  const v = member(1, 'Valentina', 'Demo', { birthDate: '1994-03-12', createdAt: ago(120) })
  entry(v, 'bienvenida', 200, 120, 'Bienvenida a Joakina Club')
  entry(v, 'compra', 320, 100, 'Pedido P-DEMO1 · $32.000'); entry(v, 'primera_compra', 300, 100, 'Primera compra')
  entry(v, 'compra', 480, 80, 'Pedido P-DEMO2 · $48.000')
  entry(v, 'compra', 610, 60, 'Pedido P-DEMO3 · $61.500'); entry(v, 'pedidos_n', 200, 60, 'Pedido número 3')
  entry(v, 'compra', 790, 35, 'Pedido P-DEMO4 · $79.500')
  for (const d of [90, 55, 30, 12]) entry(v, 'visita', 50, d, 'Visita al local')
  entry(v, 'cumple', 500, 250, 'Regalo de cumpleaños'); entry(v, 'mision', 150, 45, 'Compartí tu experiencia')
  redemption(v, 1, 'r_bebida', 'utilizado', 28, 26)
  redemption(v, 2, 'r_entrada', 'pendiente', 3)

  // Martín — SUSHI LOVER
  const m = member(2, 'Martín', 'Demo', { createdAt: ago(75) })
  entry(m, 'bienvenida', 200, 75, 'Bienvenida a Joakina Club')
  entry(m, 'compra', 580, 70, 'Pedido P-DEMO5 · $58.000'); entry(m, 'primera_compra', 300, 70, 'Primera compra')
  entry(m, 'compra', 640, 40, 'Pedido P-DEMO6 · $64.000')
  entry(m, 'compra', 410, 15, 'Pedido P-DEMO7 · $41.000'); entry(m, 'pedidos_n', 200, 15, 'Pedido número 3')
  redemption(m, 3, 'r_entrada', 'utilizado', 10, 8)

  // Camila — NEW MEMBER, cumple este mes (para probar el regalo)
  member(3, 'Camila', 'Demo', { birthDate: `1996-${String(now.getMonth() + 1).padStart(2, '0')}-15`, createdAt: ago(20) })
  entry('demo_m3', 'bienvenida', 200, 20, 'Bienvenida a Joakina Club')
  entry('demo_m3', 'compra', 250, 14, 'Pedido P-DEMO8 · $25.000'); entry('demo_m3', 'primera_compra', 300, 14, 'Primera compra')

  // Joaquín — JOAKINA VIP
  const j = member(4, 'Joaquín', 'Demo', { createdAt: ago(200) })
  entry(j, 'bienvenida', 200, 200, 'Bienvenida a Joakina Club')
  ;[[190, 790], [160, 610], [130, 740], [100, 820], [70, 690], [40, 580]].forEach(([d, p], i) => entry(j, 'compra', p, d, `Pedido P-DEMO${9 + i}`))
  entry(j, 'primera_compra', 300, 190, 'Primera compra'); entry(j, 'pedidos_n', 200, 130, 'Pedido número 3')
  entry(j, 'pedidos_total', 500, 70, 'Pedido número 5'); entry(j, 'referido', 300, 100, 'Camila Demo hizo su primera compra')
  for (const d of [150, 110, 80, 50, 20, 5]) entry(j, 'visita', 50, d, 'Visita al local')
  entry(j, 'cumple', 500, 300, 'Regalo de cumpleaños')
  redemption(j, 4, 'r_combo', 'pendiente', 6)

  db.visits.push({ id: 'demo_v1', memberId: v, branchId: 'principal', source: 'demo', createdAt: ago(12) })
  return db
}
