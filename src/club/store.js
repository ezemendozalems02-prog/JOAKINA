/**
 * JOAKINA CLUB — capa de servicio.
 *
 * Es el "backend" de la demo: toda regla, validación y cálculo vive acá y las pantallas
 * sólo piden acciones. Nunca se confía en puntos enviados desde la interfaz.
 *
 * Persistencia DEMO: un único documento en localStorage (joakina_club_db). Cada operación
 * se ejecuta en una transacción: se trabaja sobre una copia y sólo se guarda si todo salió bien.
 * Para pasar a producción hay que reemplazar loadDb/writeDb por una base de datos real
 * (el resto de la lógica se mantiene) y proteger las funciones de administración con login.
 */
import { loadOrders, onOrdersChanged } from '../lib/orders'
import { TYPES, levelFor, purchasePoints, totals } from './engine'
import { buildSeed } from './seed'

export const DB_KEY = 'joakina_club_db'
export const SESSION_KEY = 'joakina_club_session'
export const CHANGE_EVENT = 'joakina-club-changed'
const SESSION_DAYS = 30
const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 10

export class ClubError extends Error {
  constructor(message, fields) { super(message); this.name = 'ClubError'; this.fields = fields }
}
const fail = (message, fields) => { throw new ClubError(message, fields) }

// ───────────────────────── Persistencia y transacciones ─────────────────────────
function readDb() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) } catch { return null }
}

function writeDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function loadDb() {
  let db = readDb()
  if (!db) { db = buildSeed(); writeDb(db) }
  return db
}

/** Ejecuta fn sobre una copia. Si lanza un error no se guarda nada (rollback). */
function transaction(fn) {
  const db = structuredClone(loadDb())
  const result = fn(db)
  writeDb(db)
  return result
}

const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
const nowIso = () => new Date().toISOString()
const norm = (s) => String(s ?? '').trim()
const normEmail = (s) => norm(s).toLowerCase()
const money = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`
const SAFE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const randomCode = (len) => Array.from({ length: len }, () => SAFE[Math.floor(Math.random() * SAFE.length)]).join('')

// ───────────────────────── Contraseñas y sesiones ─────────────────────────
async function hashPassword(password, salt) {
  const text = `${salt}:${password}`
  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  let h = 2166136261 // sin crypto.subtle (http sin certificado): hash de respaldo sólo para la demo
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) }
  return `fnv-${(h >>> 0).toString(16)}`
}

function newToken() {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function passwordProblem(password) {
  if (String(password).length < 8) return 'Usá al menos 8 caracteres.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Combiná letras y números.'
  return ''
}

function requireMember(db, token) {
  const session = token ? db.sessions[token] : null
  if (!session || session.expires < Date.now()) fail('Tu sesión venció. Iniciá sesión de nuevo.')
  const member = db.members.find((m) => m.id === session.memberId)
  if (!member || member.status !== 'activo') fail('Tu cuenta no está disponible.')
  return member
}

// ───────────────────────── Historial (ledger) ─────────────────────────
const entriesOf = (db, memberId) => db.ledger.filter((e) => e.memberId === memberId)
const balanceOf = (db, memberId) => totals(entriesOf(db, memberId)).balance

/** Claves de movimientos vigentes (no revertidos). Sirve para evitar acreditar dos veces. */
function activeKeys(db) {
  const reversed = new Set(db.ledger.filter((e) => e.reverses).map((e) => e.reverses))
  const map = new Map()
  for (const e of db.ledger) if (e.key && !reversed.has(e.id)) map.set(e.key, e)
  return map
}

function addEntry(db, { memberId, type, points, note, key, ref, actor, auto, reverses, branchId }) {
  if (!TYPES[type]) fail('Tipo de movimiento inválido.')
  if (!Number.isInteger(points)) fail('Los puntos deben ser un número entero.')
  if (key && activeKeys(db).has(key)) return null // ya acreditado: idempotencia
  if (balanceOf(db, memberId) + points < 0) fail('El saldo no puede quedar negativo.')
  const entry = {
    id: uid('e'), memberId, type, points, note: note || '', key: key || null, ref: ref || null,
    by: actor || 'sistema', group: auto ? 'auto' : null, reverses: reverses || null,
    branchId: branchId || null, createdAt: nowIso(),
  }
  db.ledger.push(entry)
  const member = db.members.find((m) => m.id === memberId)
  if (member) member.lastActivityAt = entry.createdAt
  return entry
}

// ───────────────────────── Resúmenes ─────────────────────────
function buildSummary(db, member) {
  const entries = entriesOf(db, member.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const t = totals(entries)
  const lvl = levelFor(db.config.levels, t.lifetime)
  const { salt, passHash, demoPassword, ...safe } = member
  void salt; void passHash; void demoPassword
  return { member: safe, ...t, ...lvl, entries, redemptions: db.redemptions.filter((r) => r.memberId === member.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }
}

export const getConfig = () => structuredClone(loadDb().config)
export const getSession = () => { try { return localStorage.getItem(SESSION_KEY) } catch { return null } }
export const setSession = (token) => { try { token ? localStorage.setItem(SESSION_KEY, token) : localStorage.removeItem(SESSION_KEY) } catch { /* sin almacenamiento */ } }

export function summaryForToken(token) {
  const db = loadDb()
  try { return buildSummary(db, requireMember(db, token)) } catch { return null }
}

export function summaryForMember(memberId) {
  const db = loadDb()
  const member = db.members.find((m) => m.id === memberId)
  return member ? buildSummary(db, member) : null
}

export const publicCatalog = () => {
  const db = loadDb()
  return { rewards: db.rewards.filter((r) => r.enabled), missions: db.missions.filter((m) => m.enabled), config: db.config }
}

// ───────────────────────── Registro, ingreso y perfil ─────────────────────────
function validateRegistration(input) {
  const fields = {}
  const firstName = norm(input.firstName); const lastName = norm(input.lastName)
  const email = normEmail(input.email); const phone = norm(input.phone).replace(/[^\d+]/g, '')
  if (firstName.length < 2) fields.firstName = 'Ingresá tu nombre.'
  if (lastName.length < 2) fields.lastName = 'Ingresá tu apellido.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fields.email = 'Ingresá un email válido.'
  if (phone.replace(/\D/g, '').length < 8 || phone.replace(/\D/g, '').length > 15) fields.phone = 'Ingresá un teléfono válido.'
  const pw = passwordProblem(input.password); if (pw) fields.password = pw
  const birthDate = norm(input.birthDate)
  if (birthDate) {
    const d = new Date(`${birthDate}T12:00:00`)
    if (Number.isNaN(d.getTime()) || d > new Date() || d.getFullYear() < 1900) fields.birthDate = 'Ingresá una fecha válida.'
  }
  if (Object.keys(fields).length) fail('Revisá los datos marcados.', fields)
  return { firstName, lastName, email, phone, birthDate }
}

export async function registerMember(input, { ref = '', branchId = 'principal' } = {}) {
  const clean = validateRegistration(input)
  const salt = randomCode(12)
  const passHash = await hashPassword(input.password, salt)
  return transaction((db) => {
    if (db.members.some((m) => m.email === clean.email)) fail('Ya existe una cuenta con ese email. Iniciá sesión.', { email: 'Este email ya está registrado.' })
    const referrer = ref ? db.members.find((m) => m.referralCode === norm(ref).toUpperCase()) : null
    let referralCode = randomCode(7)
    while (db.members.some((m) => m.referralCode === referralCode)) referralCode = randomCode(7)
    const member = {
      id: uid('m'), number: `JC-${String(db.counters.member++).padStart(4, '0')}`, ...clean,
      salt, passHash, referralCode, referredBy: referrer?.id ?? null, demo: false, status: 'activo',
      createdAt: nowIso(), lastActivityAt: nowIso(), seenAt: nowIso(), branchId,
    }
    db.members.push(member)
    const welcome = db.missions.find((m) => m.trigger === 'register' && m.enabled)
    if (welcome && welcome.points > 0) {
      addEntry(db, { memberId: member.id, type: 'bienvenida', points: welcome.points, note: 'Bienvenida a Joakina Club', key: `welcome:${member.id}`, branchId })
    }
    member.seenAt = nowIso() // la bienvenida se celebra en pantalla, no como aviso de "puntos nuevos"
    const token = newToken()
    db.sessions[token] = { memberId: member.id, expires: Date.now() + SESSION_DAYS * 86400000 }
    return { token, welcomePoints: welcome?.enabled ? welcome.points : 0, memberId: member.id }
  })
}

export async function login(email, password) {
  const e = normEmail(email)
  const db = loadDb()
  const member = db.members.find((m) => m.email === e)
  const attempts = db.attempts[e]
  if (attempts?.until > Date.now()) fail(`Demasiados intentos. Probá de nuevo en ${Math.ceil((attempts.until - Date.now()) / 60000)} minutos.`)
  const expected = member ? (member.passHash ?? (member.demoPassword ? await hashPassword(member.demoPassword, member.salt) : null)) : null
  const given = member ? await hashPassword(String(password), member.salt) : null
  if (!member || !expected || given !== expected) {
    transaction((d) => {
      const a = d.attempts[e] ?? { n: 0 }
      a.n += 1
      if (a.n >= MAX_ATTEMPTS) { a.until = Date.now() + LOCK_MINUTES * 60000; a.n = 0 }
      d.attempts[e] = a
    })
    fail('Email o contraseña incorrectos.')
  }
  if (member.status !== 'activo') fail('Tu cuenta no está disponible. Consultá en el local.')
  return transaction((d) => {
    delete d.attempts[e]
    for (const [t, s] of Object.entries(d.sessions)) if (s.expires < Date.now()) delete d.sessions[t]
    const token = newToken()
    d.sessions[token] = { memberId: member.id, expires: Date.now() + SESSION_DAYS * 86400000 }
    return token
  })
}

export function logout(token) {
  if (!token) return
  transaction((db) => { delete db.sessions[token] })
}

export function updateProfile(token, patch) {
  return transaction((db) => {
    const member = requireMember(db, token)
    const fields = {}
    const firstName = norm(patch.firstName ?? member.firstName); const lastName = norm(patch.lastName ?? member.lastName)
    const phone = norm(patch.phone ?? member.phone).replace(/[^\d+]/g, '')
    if (firstName.length < 2) fields.firstName = 'Ingresá tu nombre.'
    if (lastName.length < 2) fields.lastName = 'Ingresá tu apellido.'
    if (phone.replace(/\D/g, '').length < 8) fields.phone = 'Ingresá un teléfono válido.'
    let birthDate = member.birthDate
    if (patch.birthDate !== undefined && norm(patch.birthDate) !== member.birthDate) {
      if (member.birthDate) fields.birthDate = 'La fecha de nacimiento no se puede modificar. Pedile al local que la corrija.'
      else {
        const d = new Date(`${norm(patch.birthDate)}T12:00:00`)
        if (Number.isNaN(d.getTime()) || d > new Date() || d.getFullYear() < 1900) fields.birthDate = 'Ingresá una fecha válida.'
        else birthDate = norm(patch.birthDate)
      }
    }
    if (Object.keys(fields).length) fail('Revisá los datos marcados.', fields)
    Object.assign(member, { firstName, lastName, phone, birthDate })
    return true
  })
}

export async function changePassword(token, current, next) {
  const db = loadDb()
  const member = requireMember(db, token)
  const expected = member.passHash ?? (member.demoPassword ? await hashPassword(member.demoPassword, member.salt) : null)
  if ((await hashPassword(String(current), member.salt)) !== expected) fail('La contraseña actual no es correcta.', { current: 'No coincide.' })
  const problem = passwordProblem(next)
  if (problem) fail(problem, { next: problem })
  const salt = randomCode(12)
  const passHash = await hashPassword(next, salt)
  return transaction((d) => {
    const m = d.members.find((x) => x.id === member.id)
    Object.assign(m, { salt, passHash, demoPassword: null })
    return true
  })
}

/** Marca como vistos los movimientos y devuelve cuántos puntos se sumaron desde la última visita. */
export function consumeNewPoints(token) {
  return transaction((db) => {
    const member = requireMember(db, token)
    const since = member.seenAt || member.createdAt
    const gained = entriesOf(db, member.id).filter((e) => e.createdAt > since && e.points > 0).reduce((s, e) => s + e.points, 0)
    member.seenAt = nowIso()
    return gained
  })
}

// ───────────────────────── Pedidos → puntos ─────────────────────────
/**
 * Concilia los pedidos con el historial. Es idempotente: se puede llamar las veces que haga falta.
 * - Pedido ENTREGADO con socio asociado → acredita compra y bonificaciones (una sola vez).
 * - Pedido que deja de estar entregado (cancelado, reabierto, eliminado) → revierte lo acreditado.
 * Sólo se tocan pedidos que ya tienen un socio asociado: no hay acreditaciones retroactivas.
 */
export function reconcileOrders() {
  const orders = loadOrders().filter((o) => o.memberId)
  const probe = loadDb()
  if (!orders.length && !probe.ledger.some((e) => e.group === 'auto')) return 0
  return transaction((db) => {
    const cfg = db.config
    const missionBy = (trigger) => db.missions.find((m) => m.trigger === trigger)
    const desired = new Map()
    const byMember = new Map()
    for (const o of orders) {
      if (o.status !== 'entregado' || !db.members.some((m) => m.id === o.memberId)) continue
      byMember.set(o.memberId, [...(byMember.get(o.memberId) ?? []), o])
    }
    for (const [memberId, list] of byMember) {
      const member = db.members.find((m) => m.id === memberId)
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((o, i) => {
        const pos = i + 1
        const ref = { orderId: o.id, code: o.code }
        const add = (key, type, who, points, note, mission) => desired.set(key, { memberId: who, type, points, note, ref, mission })
        add(`order:${o.id}:compra`, 'compra', memberId, purchasePoints(cfg, o.subtotal), `Pedido ${o.code} · ${money(o.subtotal)}`)
        const first = missionBy('first_order'); if (first && pos === 1) add(`order:${o.id}:first`, 'primera_compra', memberId, first.points, 'Bonificación por tu primera compra', first)
        const nth = missionBy('every_n_orders'); if (nth && nth.target > 0 && pos % nth.target === 0) add(`order:${o.id}:nth`, 'pedidos_n', memberId, nth.points, `Pedido número ${pos}`, nth)
        const total = missionBy('orders_total'); if (total && pos === total.target) add(`order:${o.id}:total`, 'pedidos_total', memberId, total.points, `Llegaste a ${pos} pedidos`, total)
        const ref2 = missionBy('referral'); const referrer = member.referredBy && db.members.find((m) => m.id === member.referredBy)
        if (ref2 && referrer && pos === 1) add(`order:${o.id}:referral`, 'referido', referrer.id, cfg.referralPoints ?? ref2.points, `${member.firstName} hizo su primera compra`, ref2)
      })
    }
    let changes = 0
    const active = activeKeys(db)
    for (const [key, spec] of desired) {
      if (active.has(key) || spec.points <= 0) continue
      if (spec.mission && !spec.mission.enabled) continue
      if (addEntry(db, { ...spec, key, auto: true })) changes += 1
    }
    for (const [key, entry] of active) {
      if (entry.group !== 'auto' || desired.has(key)) continue
      const give = Math.min(entry.points, Math.max(0, balanceOf(db, entry.memberId))) // el saldo nunca queda negativo
      const partial = give < entry.points ? ` (se revirtieron ${give} de ${entry.points}: el resto ya se había canjeado)` : ''
      addEntry(db, { memberId: entry.memberId, type: 'reversa', points: -give, note: `Pedido ${entry.ref?.code ?? ''} ya no está entregado${partial}`, reverses: entry.id, ref: entry.ref })
      changes += 1
    }
    return changes
  })
}

/** Puntos acreditados hoy por un pedido (vigentes), para mostrar en el panel. */
export function orderPoints(orderId) {
  const db = loadDb()
  let sum = 0
  for (const e of activeKeys(db).values()) if (e.group === 'auto' && e.ref?.orderId === orderId && e.type !== 'referido') sum += e.points
  return sum
}

/** Puntos que sumaría un pedido, para mostrar en el checkout. Sólo informativo. */
export function previewOrderPoints(memberId, subtotal) {
  const db = loadDb()
  const delivered = loadOrders().filter((o) => o.memberId === memberId && o.status === 'entregado').length
  const lines = []
  const base = purchasePoints(db.config, subtotal)
  if (base > 0) lines.push({ label: 'Por tu compra', points: base })
  const first = db.missions.find((m) => m.trigger === 'first_order' && m.enabled)
  if (first && delivered === 0) lines.push({ label: 'Primera compra', points: first.points })
  const nth = db.missions.find((m) => m.trigger === 'every_n_orders' && m.enabled)
  if (nth && nth.target > 0 && (delivered + 1) % nth.target === 0) lines.push({ label: `Pedido número ${delivered + 1}`, points: nth.points })
  return { lines, total: lines.reduce((s, l) => s + l.points, 0), base }
}

// ───────────────────────── Desafíos ─────────────────────────
export function missionsFor(memberId) {
  const db = loadDb()
  const member = db.members.find((m) => m.id === memberId)
  const delivered = loadOrders().filter((o) => o.memberId === memberId && o.status === 'entregado').length
  const keys = activeKeys(db)
  const referrals = db.members.filter((m) => m.referredBy === memberId).length
  const year = new Date().getFullYear()
  return db.missions.filter((m) => m.enabled).map((m) => {
    const base = { ...m, current: 0, status: 'abierta', action: null }
    switch (m.trigger) {
      case 'register': return { ...base, current: 1, status: 'completada' }
      case 'first_order': return { ...base, current: Math.min(delivered, 1), status: delivered ? 'completada' : 'abierta' }
      case 'every_n_orders': return { ...base, current: delivered % m.target, status: delivered && delivered % m.target === 0 ? 'completada' : 'abierta', recurring: true, doneTimes: Math.floor(delivered / m.target) }
      case 'orders_total': return { ...base, current: Math.min(delivered, m.target), status: delivered >= m.target ? 'completada' : 'abierta' }
      case 'referral': return { ...base, current: referrals, status: referrals ? 'completada' : 'abierta', recurring: true }
      case 'birthday': {
        const claimed = keys.has(`birthday:${memberId}:${year}`)
        const month = Number(member?.birthDate?.slice(5, 7)) === new Date().getMonth() + 1
        return { ...base, status: claimed ? 'completada' : month ? 'reclamable' : member?.birthDate ? 'proximamente' : 'sin_fecha', action: month && !claimed ? 'claim_birthday' : null }
      }
      case 'manual': return { ...base, status: keys.has(`mission:${m.id}:${memberId}`) ? 'completada' : 'validacion' }
      default: return base
    }
  })
}

export function claimBirthday(token) {
  return transaction((db) => {
    const member = requireMember(db, token)
    const mission = db.missions.find((m) => m.trigger === 'birthday' && m.enabled)
    if (!mission) fail('Este regalo no está disponible por el momento.')
    if (!member.birthDate) fail('Cargá tu fecha de nacimiento en Mis datos para reclamar tu regalo.')
    const now = new Date()
    if (Number(member.birthDate.slice(5, 7)) !== now.getMonth() + 1) fail('Tu regalo está disponible durante el mes de tu cumpleaños.')
    const entry = addEntry(db, { memberId: member.id, type: 'cumple', points: mission.points, note: 'Regalo de cumpleaños', key: `birthday:${member.id}:${now.getFullYear()}` })
    if (!entry) fail('Ya reclamaste tu regalo de este año.')
    return mission.points
  })
}

// ───────────────────────── Recompensas y canjes ─────────────────────────
function uniqueCode(db) {
  let code
  do { code = `JC-${randomCode(6)}` } while (db.redemptions.some((r) => r.code === code))
  return code
}

export function redeemReward(token, rewardId) {
  return transaction((db) => {
    const member = requireMember(db, token)
    const reward = db.rewards.find((r) => r.id === rewardId)
    if (!reward || !reward.enabled) fail('Esta recompensa no está disponible.')
    const balance = balanceOf(db, member.id)
    if (balance < reward.points) fail(`Te faltan ${(reward.points - balance).toLocaleString('es-AR')} puntos para canjear esta recompensa.`)
    const id = uid('rd')
    const code = uniqueCode(db)
    const redemption = { id, code, memberId: member.id, rewardId, rewardName: reward.name, rewardImage: reward.image, points: reward.points, status: 'pendiente', createdAt: nowIso() }
    db.redemptions.push(redemption)
    addEntry(db, { memberId: member.id, type: 'canje', points: -reward.points, note: `${reward.name} · código ${code}`, key: `redeem:${id}`, ref: { redemptionId: id } })
    return redemption
  })
}

function cancelInDb(db, redemption, actor, reason) {
  if (redemption.status !== 'pendiente') fail(redemption.status === 'utilizado' ? 'Este canje ya fue utilizado y no se puede cancelar.' : 'Este canje ya estaba cancelado.')
  redemption.status = 'cancelado'; redemption.cancelledAt = nowIso(); redemption.cancelledBy = actor; redemption.cancelReason = reason || ''
  addEntry(db, { memberId: redemption.memberId, type: 'canje_cancelado', points: redemption.points, note: `Reintegro · ${redemption.rewardName}`, key: `refund:${redemption.id}`, ref: { redemptionId: redemption.id }, actor })
}

export function cancelMyRedemption(token, id) {
  return transaction((db) => {
    const member = requireMember(db, token)
    const redemption = db.redemptions.find((r) => r.id === id && r.memberId === member.id)
    if (!redemption) fail('No encontramos ese canje.')
    cancelInDb(db, redemption, 'socio', 'Cancelado por el socio')
    return true
  })
}

// ───────────────────────── Administración ─────────────────────────
const actorName = (a) => norm(a) || 'Administrador'

export function adminCancelRedemption(id, reason, actor) {
  return transaction((db) => {
    const redemption = db.redemptions.find((r) => r.id === id)
    if (!redemption) fail('No encontramos ese canje.')
    cancelInDb(db, redemption, actorName(actor), reason)
    return true
  })
}

export function lookupRedemption(code) {
  const db = loadDb()
  const redemption = db.redemptions.find((r) => r.code === norm(code).toUpperCase())
  if (!redemption) return null
  const member = db.members.find((m) => m.id === redemption.memberId)
  return { redemption, member: member ? { id: member.id, number: member.number, name: `${member.firstName} ${member.lastName}`, demo: member.demo } : null }
}

export function validateRedemption(code, actor) {
  return transaction((db) => {
    const redemption = db.redemptions.find((r) => r.code === norm(code).toUpperCase())
    if (!redemption) fail('Código inexistente.')
    if (redemption.status === 'utilizado') fail(`Este código ya fue utilizado el ${new Date(redemption.usedAt).toLocaleDateString('es-AR')}.`)
    if (redemption.status === 'cancelado') fail('Este código fue cancelado y no es válido.')
    redemption.status = 'utilizado'; redemption.usedAt = nowIso(); redemption.usedBy = actorName(actor)
    return redemption
  })
}

export function adjustPoints(memberId, delta, reason, actor) {
  const points = Number(delta)
  if (!Number.isInteger(points) || points === 0) fail('Ingresá una cantidad de puntos entera y distinta de cero.')
  if (Math.abs(points) > 100000) fail('La cantidad máxima por ajuste es 100.000 puntos.')
  if (norm(reason).length < 3) fail('Indicá el motivo del ajuste.')
  return transaction((db) => {
    if (!db.members.some((m) => m.id === memberId)) fail('Socio inexistente.')
    return addEntry(db, { memberId, type: 'ajuste', points, note: norm(reason), actor: actorName(actor) })
  })
}

export function registerVisit(memberId, { actor, branchId = 'principal', source = 'panel' } = {}) {
  return transaction((db) => {
    const member = db.members.find((m) => m.id === memberId)
    if (!member) fail('Socio inexistente.')
    if (!db.config.branches.some((b) => b.id === branchId)) fail('Sucursal inexistente.')
    const day = new Date().toISOString().slice(0, 10)
    const entry = addEntry(db, { memberId, type: 'visita', points: db.config.visitPoints, note: 'Visita al local', key: `visit:${memberId}:${day}:${branchId}`, actor: actorName(actor), branchId })
    if (!entry) fail('Esta visita ya fue registrada hoy.')
    db.visits.push({ id: uid('v'), memberId, branchId, source, by: actorName(actor), createdAt: nowIso() })
    return db.config.visitPoints
  })
}

export function awardMission(memberId, missionId, actor) {
  return transaction((db) => {
    const mission = db.missions.find((m) => m.id === missionId)
    if (!mission || mission.trigger !== 'manual') fail('Este desafío no se otorga manualmente.')
    if (!db.members.some((m) => m.id === memberId)) fail('Socio inexistente.')
    const entry = addEntry(db, { memberId, type: 'mision', points: mission.points, note: mission.name, key: `mission:${mission.id}:${memberId}`, actor: actorName(actor) })
    if (!entry) fail('Este socio ya completó el desafío.')
    return mission.points
  })
}

export async function resetMemberPassword(memberId, tempPassword) {
  const problem = passwordProblem(tempPassword)
  if (problem) fail(problem)
  const salt = randomCode(12)
  const passHash = await hashPassword(tempPassword, salt)
  return transaction((db) => {
    const member = db.members.find((m) => m.id === memberId)
    if (!member) fail('Socio inexistente.')
    Object.assign(member, { salt, passHash, demoPassword: null })
    for (const [t, s] of Object.entries(db.sessions)) if (s.memberId === memberId) delete db.sessions[t]
    return true
  })
}

export function setMemberStatus(memberId, status) {
  return transaction((db) => {
    const member = db.members.find((m) => m.id === memberId)
    if (!member) fail('Socio inexistente.')
    member.status = status === 'activo' ? 'activo' : 'suspendido'
    return true
  })
}

export function saveReward(input) {
  const name = norm(input.name); const points = Number(input.points)
  if (name.length < 2) fail('Ingresá el nombre de la recompensa.')
  if (!Number.isInteger(points) || points < 1) fail('Los puntos necesarios deben ser un entero mayor a cero.')
  return transaction((db) => {
    const data = { name, description: norm(input.description), points, image: norm(input.image), enabled: !!input.enabled }
    if (input.id) {
      const reward = db.rewards.find((r) => r.id === input.id)
      if (!reward) fail('Recompensa inexistente.')
      Object.assign(reward, data)
    } else db.rewards.push({ id: uid('r'), ...data })
    return true
  })
}

export const deleteReward = (id) => transaction((db) => { db.rewards = db.rewards.filter((r) => r.id !== id); return true })

export function saveMission(input) {
  const name = norm(input.name); const points = Number(input.points); const target = Number(input.target) || 1
  if (name.length < 2) fail('Ingresá el nombre del desafío.')
  if (!Number.isInteger(points) || points < 0) fail('Los puntos deben ser un entero mayor o igual a cero.')
  if (!Number.isInteger(target) || target < 1) fail('La meta debe ser un entero mayor a cero.')
  return transaction((db) => {
    if (input.id) {
      const mission = db.missions.find((m) => m.id === input.id)
      if (!mission) fail('Desafío inexistente.')
      Object.assign(mission, { name, description: norm(input.description), points, target, enabled: !!input.enabled })
    } else db.missions.push({ id: uid('m'), system: false, trigger: 'manual', name, description: norm(input.description), points, target: 1, enabled: !!input.enabled })
    return true
  })
}

export function deleteMission(id) {
  return transaction((db) => {
    const mission = db.missions.find((m) => m.id === id)
    if (mission?.system) fail('Los desafíos del sistema no se pueden eliminar. Podés desactivarlos.')
    db.missions = db.missions.filter((m) => m.id !== id)
    return true
  })
}

export function updateConfig(patch) {
  return transaction((db) => {
    const c = db.config
    const int = (v, label, min = 0) => { const n = Number(v); if (!Number.isInteger(n) || n < min) fail(`${label}: ingresá un número entero válido.`); return n }
    if (patch.blockAmount !== undefined) c.blockAmount = int(patch.blockAmount, 'Monto por bloque', 1)
    if (patch.pointsPerBlock !== undefined) c.pointsPerBlock = int(patch.pointsPerBlock, 'Puntos por bloque')
    if (patch.visitPoints !== undefined) c.visitPoints = int(patch.visitPoints, 'Puntos por visita')
    if (patch.referralPoints !== undefined) c.referralPoints = int(patch.referralPoints, 'Puntos por referido')
    if (patch.googleReviewUrl !== undefined) {
      const url = norm(patch.googleReviewUrl)
      if (url && !/^https:\/\//i.test(url)) fail('El enlace de Google debe empezar con https://')
      c.googleReviewUrl = url
    }
    if (patch.branches) {
      const branches = patch.branches.map((b) => ({ id: norm(b.id).toLowerCase().replace(/[^a-z0-9-]/g, '-'), name: norm(b.name) }))
      if (!branches.length || branches.some((b) => !b.id || !b.name)) fail('Cada sucursal necesita un nombre.')
      if (new Set(branches.map((b) => b.id)).size !== branches.length) fail('Hay sucursales con el mismo identificador.')
      c.branches = branches
    }
    if (patch.levels) {
      const levels = patch.levels.map((l) => ({ ...l, min: int(l.min, `Mínimo de ${l.name}`), name: norm(l.name) || 'NIVEL' }))
      if (levels[0].min !== 0) fail('El primer nivel debe empezar en 0 puntos.')
      for (let i = 1; i < levels.length; i += 1) if (levels[i].min <= levels[i - 1].min) fail('Los niveles deben ir en orden creciente de puntos.')
      c.levels = levels
    }
    return true
  })
}

const inScope = (m, scope) => scope === 'todos' || (scope === 'demo' ? m.demo : !m.demo)

export function adminMembers(scope = 'todos') {
  const db = loadDb()
  return db.members.filter((m) => inScope(m, scope)).map((m) => buildSummary(db, m)).sort((a, b) => b.member.createdAt.localeCompare(a.member.createdAt))
}

export function adminOverview(scope = 'todos') {
  const db = loadDb()
  const members = db.members.filter((m) => inScope(m, scope))
  const ids = new Set(members.map((m) => m.id))
  const summaries = members.map((m) => buildSummary(db, m))
  const month = Date.now() - 30 * 86400000
  const redemptions = db.redemptions.filter((r) => ids.has(r.memberId))
  return {
    members: members.length,
    active: members.filter((m) => m.lastActivityAt && new Date(m.lastActivityAt).getTime() > month).length,
    issued: summaries.reduce((s, x) => s + x.lifetime, 0),
    redeemed: summaries.reduce((s, x) => s + x.spent, 0),
    delivered: redemptions.filter((r) => r.status === 'utilizado').length,
    pending: redemptions.filter((r) => r.status === 'pendiente').length,
    newMembers: members.filter((m) => new Date(m.createdAt).getTime() > month).length,
  }
}

export function adminLedger(scope = 'todos', memberId = '') {
  const db = loadDb()
  const ids = new Set(db.members.filter((m) => inScope(m, scope)).map((m) => m.id))
  const names = Object.fromEntries(db.members.map((m) => [m.id, `${m.firstName} ${m.lastName}`]))
  return db.ledger.filter((e) => ids.has(e.memberId) && (!memberId || e.memberId === memberId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((e) => ({ ...e, memberName: names[e.memberId] }))
}

export function adminRedemptions(scope = 'todos') {
  const db = loadDb()
  const names = Object.fromEntries(db.members.map((m) => [m.id, m]))
  return db.redemptions.filter((r) => names[r.memberId] && inScope(names[r.memberId], scope))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => ({ ...r, memberName: `${names[r.memberId].firstName} ${names[r.memberId].lastName}`, memberNumber: names[r.memberId].number, demo: names[r.memberId].demo }))
}

export const adminCatalog = () => { const db = loadDb(); return { rewards: db.rewards, missions: db.missions, config: db.config } }

export function deleteDemoData() {
  return transaction((db) => {
    const demo = new Set(db.members.filter((m) => m.demo).map((m) => m.id))
    db.members = db.members.filter((m) => !demo.has(m.id))
    db.ledger = db.ledger.filter((e) => !demo.has(e.memberId))
    db.redemptions = db.redemptions.filter((r) => !demo.has(r.memberId))
    db.visits = db.visits.filter((v) => !demo.has(v.memberId))
    for (const [t, s] of Object.entries(db.sessions)) if (demo.has(s.memberId)) delete db.sessions[t]
    return demo.size
  })
}

export function restoreDemoData() {
  const seed = buildSeed()
  return transaction((db) => {
    const has = new Set(db.members.map((m) => m.id))
    for (const m of seed.members) if (!has.has(m.id)) db.members.push(m)
    const ledgerIds = new Set(db.ledger.map((e) => e.id))
    db.ledger.push(...seed.ledger.filter((e) => !ledgerIds.has(e.id)))
    const rdIds = new Set(db.redemptions.map((r) => r.id))
    db.redemptions.push(...seed.redemptions.filter((r) => !rdIds.has(r.id)))
    db.counters.member = Math.max(db.counters.member, seed.counters.member)
    return true
  })
}

export function resetClubDb() { writeDb(buildSeed()) }

// Cuando un pedido cambia de estado, se concilian los puntos de inmediato.
onOrdersChanged(() => { try { reconcileOrders() } catch { /* se reintenta en la próxima conciliación */ } })
