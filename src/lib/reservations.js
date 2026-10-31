/**
 * Motor de reservas DEMO.
 * - "Base de datos": localStorage del navegador (clave joakina_reservations).
 * - La ocupación previa del salón es simulada y determinista: la misma fecha,
 *   mesa y horario dan siempre el mismo resultado, y varía según el día y la hora.
 * Para pasar a producción sólo hay que reemplazar load/save por llamadas a una API.
 */
const KEY = 'joakina_reservations'
const STAY = 120 // minutos que una reserva ocupa la mesa

// x, y, w, h en % del plano del salón.
export const TABLES = [
  { id: 'M1', n: 1, label: 'Mesa 1', seats: 2, x: 4, y: 5, w: 20, h: 17 },
  { id: 'M2', n: 2, label: 'Mesa 2', seats: 2, x: 28, y: 5, w: 20, h: 17 },
  { id: 'M3', n: 3, label: 'Mesa 3', seats: 2, x: 52, y: 5, w: 20, h: 17 },
  { id: 'M4', n: 4, label: 'Mesa 4', seats: 2, x: 76, y: 5, w: 20, h: 17 },
  { id: 'M5', n: 5, label: 'Mesa 5', seats: 4, x: 4, y: 28, w: 26, h: 17 },
  { id: 'M6', n: 6, label: 'Mesa 6', seats: 4, x: 37, y: 28, w: 26, h: 17 },
  { id: 'M7', n: 7, label: 'Mesa 7', seats: 4, x: 70, y: 28, w: 26, h: 17 },
  { id: 'M8', n: 8, label: 'Mesa 8', seats: 6, x: 4, y: 51, w: 32, h: 17 },
  { id: 'M9', n: 9, label: 'Mesa 9', seats: 6, x: 44, y: 51, w: 32, h: 17 },
  { id: 'M10', n: 10, label: 'Mesa 10', seats: 10, x: 22, y: 74, w: 56, h: 17 },
]

// Para grupos grandes se unen la Mesa 9 y la Mesa 10.
export const CUSTOM_TABLE = { id: 'MX', label: 'Mesa a medida', seats: 16, members: ['M9', 'M10'] }
export const MAX_PARTY = 16

const ALL = [...TABLES, CUSTOM_TABLE]
export const tableById = (id) => ALL.find((t) => t.id === id)
const members = (table) => table.members ?? [table.id]

const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
export const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0) }
export const nextDays = (count) => Array.from({ length: count }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i); return toISO(d)
})

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

/** Un día está cerrado si algún horario marcado "Cerrado" lo nombra (ej. "Lunes"). */
export function isClosed(iso, hours = []) {
  const name = WEEKDAYS[parseISO(iso).getDay()]
  return hours.some((h) => /cerrado/i.test(h.time) && norm(h.day).includes(name))
}

export function isPast(iso, time) {
  const now = new Date()
  const today = toISO(now)
  if (iso < today) return true
  return iso === today && toMinutes(time) <= now.getHours() * 60 + now.getMinutes()
}

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return ((h >>> 0) % 10000) / 10000
}

function simulatedBusy(iso, time, tableId) {
  const block = Math.floor(toMinutes(time) / STAY)
  const hour = block * 2
  const dow = parseISO(iso).getDay()
  let p = dow === 5 || dow === 6 ? 0.5 : dow === 0 ? 0.4 : 0.2
  if (hour >= 20) p += 0.2
  else if (hour >= 12 && hour < 16) p += 0.1
  else if (hour < 11) p -= 0.15
  const dayLoad = hash(iso)
  if (dayLoad > 0.88) p += 0.45 // algunos días el salón está casi completo
  else if (dayLoad < 0.15) p -= 0.1
  return hash(`${iso}|${tableId}|${block}`) < Math.min(0.96, Math.max(0.04, p))
}

export function isTableFree(iso, time, table, reservations) {
  const ids = members(table)
  if (ids.some((id) => simulatedBusy(iso, time, id))) return false
  return !reservations.some((r) => {
    if (r.status !== 'confirmada' || r.date !== iso) return false
    if (Math.abs(toMinutes(r.time) - toMinutes(time)) >= STAY) return false
    const booked = tableById(r.tableId)
    return booked && members(booked).some((id) => ids.includes(id))
  })
}

/** Mesas que le sirven a un grupo: alcanzan y no sobran más de 2 lugares. */
export function eligibleTables(party) {
  const fits = ALL.filter((t) => t.seats >= party)
  if (!fits.length) return []
  const smallest = Math.min(...fits.map((t) => t.seats))
  return fits.filter((t) => t.seats <= Math.max(party + 2, smallest))
}

export function dayStatus(iso, times, eligible, reservations, hours) {
  if (isClosed(iso, hours)) return 'closed'
  let pairs = 0
  let free = 0
  for (const time of times) {
    if (isPast(iso, time)) continue
    for (const table of eligible) {
      pairs += 1
      if (isTableFree(iso, time, table, reservations)) free += 1
    }
  }
  if (!free) return 'full'
  return free / pairs < 0.25 ? 'few' : 'ok'
}

export function loadReservations() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}

function persist(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* sin almacenamiento la demo no guarda */ }
  return list
}

export function createReservation({ date, time, tableId, party, name, phone, notes }) {
  const table = tableById(tableId)
  const current = loadReservations()
  if (!table || isPast(date, time) || !isTableFree(date, time, table, current)) {
    return { ok: false, error: 'Esa mesa se acaba de ocupar. Elegí otro horario o mesa.' }
  }
  const reservation = {
    id: `r_${Date.now()}`,
    code: `JK-${Math.floor(1000 + Math.random() * 9000)}`,
    date, time, tableId, party, name, phone, notes,
    status: 'confirmada',
    createdAt: new Date().toISOString(),
  }
  persist([...current, reservation])
  return { ok: true, reservation }
}

export function setReservationStatus(id, status) {
  return persist(loadReservations().map((r) => (r.id === id ? { ...r, status } : r)))
}

export function deleteReservation(id) {
  return persist(loadReservations().filter((r) => r.id !== id))
}
