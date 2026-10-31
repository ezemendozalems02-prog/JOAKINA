import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { splitList, whatsappUrl } from '../lib/format'
import {
  CUSTOM_TABLE, MAX_PARTY, PLAN_ROWS, createReservation, dayStatus, eligibleTables, isClosed,
  isPast, isTableFree, loadReservations, nextDays, parseISO, setReservationStatus, tableById,
} from '../lib/reservations'
import './booking.css'

const PRESETS = [2, 4, 6]
const STATUS_TEXT = { ok: 'Hay lugar', few: 'Pocos lugares', full: 'Completo', closed: 'Cerrado' }

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const goTo = (id) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
const longDate = (iso) => new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseISO(iso))
const shortDay = (iso, part) => new Intl.DateTimeFormat('es-AR', part === 'wd' ? { weekday: 'short' } : { month: 'short' }).format(parseISO(iso)).replace('.', '')

function Chairs({ count, side }) {
  return <span className={`chairs chairs--${side}`} aria-hidden="true">{Array.from({ length: count }, (_, i) => <i key={i} />)}</span>
}

function Confirmation({ reservation, info, onNew, onCancel }) {
  const table = tableById(reservation.tableId)
  const cancelled = reservation.status === 'cancelada'
  const message = [
    `Hola Joakina Sushi! Reservé una mesa (código ${reservation.code}):`,
    `${longDate(reservation.date)}, ${reservation.time} hs`,
    `${reservation.party} personas · ${table?.label}`,
    `A nombre de ${reservation.name}`,
  ].join('\n')
  return (
    <motion.div className={`booking__ok ${cancelled ? 'is-cancelled' : ''}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <p className="eyebrow">{cancelled ? 'Reserva cancelada' : 'Reserva confirmada'}</p>
      <p className="code">{reservation.code}</p>
      <dl className="sum">
        <dt>Fecha</dt><dd>{cap(longDate(reservation.date))}</dd>
        <dt>Horario</dt><dd>{reservation.time} hs</dd>
        <dt>Mesa</dt><dd>{table?.label}</dd>
        <dt>Comensales</dt><dd>{reservation.party}</dd>
        <dt>Nombre</dt><dd>{reservation.name}</dd>
      </dl>
      <p className="hint">Demo: la reserva se guarda en este navegador y ya figura en el panel de administración.</p>
      <div className="row">
        {!cancelled && (
          <a className="btn btn--gold" href={whatsappUrl(info.whatsapp, message)} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a>
        )}
        {!cancelled && <button className="btn btn--line" onClick={onCancel}>Cancelar reserva</button>}
        <button className="btn btn--line" onClick={onNew}>Nueva reserva</button>
      </div>
    </motion.div>
  )
}

export default function BookingDemo() {
  const { data: { info } } = useSite()
  const times = useMemo(() => splitList(info.reservationTimes), [info.reservationTimes])
  const [days] = useState(() => nextDays(30))
  const [reservations, setReservations] = useState(loadReservations)
  const [party, setParty] = useState(2)
  const [custom, setCustom] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [tableId, setTableId] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', notes: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  const eligible = useMemo(() => eligibleTables(party), [party])
  const dayInfo = useMemo(
    () => Object.fromEntries(days.map((d) => [d, dayStatus(d, times, eligible, reservations, info.hours)])),
    [days, times, eligible, reservations, info.hours],
  )
  const slots = useMemo(() => (date ? times.map((t) => ({
    time: t,
    past: isPast(date, t),
    free: eligible.filter((tb) => isTableFree(date, t, tb, reservations)),
  })) : []), [date, times, eligible, reservations])

  const selected = tableId ? tableById(tableId) : null
  const eligibleIds = new Set(eligible.map((t) => t.id))
  const freeIds = new Set(slots.find((s) => s.time === time)?.free.map((t) => t.id))
  const resetFrom = (what) => {
    if (what === 'date') setDate('')
    if (what !== 'table') setTime('')
    setTableId('')
    setError('')
  }

  const choose = (value, isCustom = false) => { setParty(value); setCustom(isCustom); resetFrom('party'); setDate('') }
  const pickDate = (iso) => { setDate(iso); setTime(''); setTableId(''); setError(''); goTo('step-time') }
  const pickTime = (slot) => { setTime(slot.time); setTableId(slot.free[0]?.id ?? ''); setError(''); goTo('step-table') }
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const result = createReservation({ date, time, tableId, party, ...form })
    setReservations(loadReservations())
    if (!result.ok) { setError(result.error); setTime(''); setTableId(''); return }
    setDone(result.reservation)
  }

  const startOver = () => {
    setDone(null); setDate(''); setTime(''); setTableId(''); setError('')
    setForm({ name: '', phone: '', notes: '' })
  }

  const cancel = () => {
    setReservations(setReservationStatus(done.id, 'cancelada'))
    setDone({ ...done, status: 'cancelada' })
  }

  if (done) return <Confirmation reservation={done} info={info} onNew={startOver} onCancel={cancel} />

  const tooBig = party > MAX_PARTY
  const customFree = freeIds.has(CUSTOM_TABLE.id)
  const freeCount = eligible.filter((t) => freeIds.has(t.id)).length

  return (
    <div>
      <p className="demo-note"><b>DEMO</b><span>La disponibilidad es simulada y las reservas se guardan sólo en este navegador. Sirve para ver cómo funcionará el sistema real.</span></p>

      <div className="steps">
        <section className="step">
          <h3 className="step__title"><span>1</span>¿Cuántos son?</h3>
          <div className="chips" role="radiogroup" aria-label="Cantidad de comensales">
            {PRESETS.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={!custom && party === n} className={`chip ${!custom && party === n ? 'is-on' : ''}`} onClick={() => choose(n)}>{n} personas</button>
            ))}
            <button type="button" role="radio" aria-checked={custom} className={`chip ${custom ? 'is-on' : ''}`} onClick={() => choose(custom ? party : 8, true)}>Personalizado</button>
          </div>
          {custom && (
            <div className="stepper-row">
              <span>Cantidad de personas</span>
              <div className="qty">
                <button type="button" onClick={() => choose(Math.max(1, party - 1), true)} aria-label="Menos personas"><Minus size={14} strokeWidth={1.5} /></button>
                <span aria-live="polite">{party}</span>
                <button type="button" onClick={() => choose(Math.min(24, party + 1), true)} aria-label="Más personas"><Plus size={14} strokeWidth={1.5} /></button>
              </div>
            </div>
          )}
          {party > 10 && !tooBig && <p className="notice">Para {party} personas unimos la Mesa 9 y la Mesa 10 en una mesa a medida.</p>}
          {tooBig && (
            <p className="notice">Para grupos de más de {MAX_PARTY} personas armamos el salón a medida. <a href={whatsappUrl(info.whatsapp, `Hola Joakina Sushi! Quiero consultar una reserva para ${party} personas.`)} target="_blank" rel="noopener noreferrer">Consultanos por WhatsApp</a>.</p>
          )}
        </section>

        <section className="step" id="step-date" inert={tooBig}>
          <h3 className="step__title"><span>2</span>¿Qué día?</h3>
          <div className="days" role="radiogroup" aria-label="Fecha de la reserva">
            {days.map((d, i) => {
              const status = dayInfo[d]
              const blocked = status === 'closed' || status === 'full'
              return (
                <button key={d} type="button" role="radio" aria-checked={date === d} disabled={blocked} data-status={status}
                  className={`day ${date === d ? 'is-on' : ''}`} onClick={() => pickDate(d)}
                  aria-label={`${longDate(d)}: ${STATUS_TEXT[status]}`}>
                  <small>{i === 0 ? 'Hoy' : shortDay(d, 'wd')}</small>
                  <strong>{parseISO(d).getDate()}</strong>
                  <em>{status === 'closed' ? 'Cerrado' : shortDay(d, 'mo')}</em>
                  {status !== 'closed' && <i />}
                </button>
              )
            })}
          </div>
          <p className="legend"><span><i />Hay lugar</span><span className="is-few"><i />Pocos lugares</span><span className="is-full"><i />Completo o cerrado</span></p>
        </section>

        <section className="step" id="step-time" inert={!date}>
          <h3 className="step__title"><span>3</span>¿A qué hora?{date && <small>{longDate(date)}</small>}</h3>
          <div className="slots" role="radiogroup" aria-label="Horario">
            {slots.map((slot) => {
              const n = slot.free.length
              const unavailable = slot.past || n === 0
              return (
                <button key={slot.time} type="button" role="radio" aria-checked={time === slot.time} disabled={unavailable}
                  data-state={n === 1 ? 'last' : 'ok'} className={`slot ${time === slot.time ? 'is-on' : ''}`} onClick={() => pickTime(slot)}>
                  {slot.time}
                  <small>{slot.past ? 'Pasó' : n === 0 ? 'Completo' : n === 1 ? 'Última mesa' : `${n} mesas`}</small>
                </button>
              )
            })}
          </div>
        </section>

        <section className="step" id="step-table" inert={!time}>
          <h3 className="step__title"><span>4</span>Elegí tu mesa{selected && <small>{selected.label} · {selected.seats} lugares</small>}</h3>
          <p className="plan-info" aria-live="polite">
            {freeCount > 0 ? <><b>{freeCount}</b> {freeCount === 1 ? 'mesa libre' : 'mesas libres'} para {party} personas. Tocá una para elegirla.</> : 'No quedan mesas libres a esta hora.'}
          </p>
          <div className="plan" role="group" aria-label="Plano del salón">
            {PLAN_ROWS.map((row) => (
              <div className="plan__row" key={row.join()}>
                {row.map((id) => {
                  const t = tableById(id)
                  const isEligible = eligibleIds.has(t.id)
                  const free = freeIds.has(t.id)
                  const on = selected && (selected.id === t.id || selected.members?.includes(t.id))
                  const state = on ? 'is-on' : !isEligible ? 'is-dim' : free ? '' : 'is-busy'
                  const label = !isEligible ? 'no corresponde a este grupo' : free ? 'disponible' : 'ocupada'
                  return (
                    <button key={t.id} type="button" disabled={!isEligible || !free} aria-pressed={!!on}
                      aria-label={`${t.label}, ${t.seats} personas, ${label}`} className={`tbl tbl--${t.seats} ${state}`}
                      onClick={() => setTableId(t.id)}>
                      <Chairs count={Math.ceil(t.seats / 2)} side="top" />
                      <span className="tbl__n">{t.n}</span>
                      <span className="tbl__s">{t.seats} pers.</span>
                      <Chairs count={Math.floor(t.seats / 2)} side="bottom" />
                    </button>
                  )
                })}
              </div>
            ))}
            <p className="plan__door" aria-hidden="true">Entrada</p>
          </div>
          <p className="plan-legend"><span><i />Disponible</span><span className="is-on"><i />Tu mesa</span><span className="is-busy"><i />Ocupada</span><span className="is-dim"><i />No corresponde</span></p>
          {eligibleIds.has(CUSTOM_TABLE.id) && (
            <button type="button" disabled={!customFree} aria-pressed={tableId === CUSTOM_TABLE.id}
              className={`custom-pick ${tableId === CUSTOM_TABLE.id ? 'is-on' : ''}`} onClick={() => setTableId(CUSTOM_TABLE.id)}>
              <span>Mesa a medida<br /><small>Une la Mesa 9 y la 10 · hasta 16 personas</small></span>
              <span>{customFree ? 'Disponible' : 'Ocupada'}</span>
            </button>
          )}
          {tableId && <button type="button" className="btn btn--line btn--full next" onClick={() => goTo('step-form')}>Continuar con mis datos</button>}
        </section>

        <form className="step form" id="step-form" inert={!tableId} onSubmit={submit}>
          <h3 className="step__title"><span>5</span>Tus datos</h3>
          {selected && (
            <dl className="sum">
              <dt>Fecha</dt><dd>{cap(longDate(date))}</dd>
              <dt>Horario</dt><dd>{time} hs</dd>
              <dt>Mesa</dt><dd>{selected.label}</dd>
              <dt>Comensales</dt><dd>{party}</dd>
            </dl>
          )}
          <label>Nombre<input required autoComplete="name" value={form.name} onChange={set('name')} /></label>
          <label>Teléfono<input required type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} /></label>
          <label>Alergias o requerimientos (opcional)<textarea rows={2} value={form.notes} onChange={set('notes')} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn--gold btn--full">Confirmar reserva</button>
        </form>
      </div>
    </div>
  )
}
