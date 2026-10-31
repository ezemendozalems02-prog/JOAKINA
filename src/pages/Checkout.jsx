import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, ShoppingBag } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useCart } from '../context/CartContext'
import { useTitle } from '../lib/useTitle'
import { formatPrice, splitList, whatsappUrl } from '../lib/format'
import { computeTotals, createOrder } from '../lib/orders'
import { useClub } from '../club/ClubContext'
import { previewOrderPoints } from '../club/store'
import { CartLine } from '../components/Cart'
import ModeSwitch from '../components/ModeSwitch'
import { WhatsAppIcon } from '../components/icons'

function buildMessage({ code, items, subtotal, totals, form, mode, memberNumber }) {
  const lines = items.map((i) => {
    const name = [i.name, i.units, i.option].filter(Boolean).join(' · ')
    return `• ${i.qty}x ${name} (${formatPrice(i.price * i.qty)})`
  })
  const totalLine = mode !== 'delivery' ? `Total: ${formatPrice(totals.total)}`
    : totals.toCoordinate ? `Total: ${formatPrice(subtotal)} + envío a coordinar`
      : `Total: ${formatPrice(totals.total)}${totals.fee ? ` (incluye envío ${formatPrice(totals.fee)})` : ' (envío gratis)'}`
  return [
    `Hola Joakina Sushi! Quiero hacer el pedido ${code}:`,
    '',
    ...lines,
    '',
    totalLine,
    '',
    `Nombre: ${form.name}`,
    memberNumber ? `Socio Joakina Club: ${memberNumber}` : '',
    `Teléfono: ${form.phone}`,
    `Entrega: ${mode === 'delivery' ? 'Delivery' : 'Take away (retiro en el local)'}`,
    mode === 'delivery' ? `Dirección: ${form.address}` : '',
    `Pago: ${form.payment}`,
    form.notes ? `Aclaraciones: ${form.notes}` : '',
  ].filter((line, index, all) => line !== '' || all[index - 1] !== '').join('\n')
}

function Confirmation({ order, whatsappLink }) {
  return (
    <section className="wrap confirm">
      <motion.span className="confirm__mark" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Check size={30} strokeWidth={1.2} /></motion.span>
      <p className="eyebrow">Pedido {order.code}</p>
      <h1>Tu pedido está listo</h1>
      <p className="lead">Lo abrimos en WhatsApp con todos los datos. Envialo desde ahí para que lo recibamos y te confirmemos.</p>
      {order.memberId
        ? <p className="club-banner" style={{ margin: 0 }}><b>¡Excelente! Tu pedido fue registrado.</b><small>Cuando lo recibas, vas a recibir tus puntos de Joakina Club.</small></p>
        : <p className="club-banner" style={{ margin: 0 }}><b>¿Querés sumar puntos con tus próximos pedidos?</b><small>Sumate gratis a Joakina Club. Este pedido se hizo como invitado y no acredita puntos.</small><span className="row"><Link className="btn btn--line" to="/club/registro">Quiero sumarme</Link></span></p>}
      <a className="btn btn--gold" href={whatsappLink} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Abrir WhatsApp de nuevo</a>
      <Link className="link-btn" to="/menu">Volver a la carta</Link>
    </section>
  )
}

export default function Checkout() {
  const { data: { info } } = useSite()
  const { items, subtotal, mode, clear, service, allowed } = useCart()
  const { summary } = useClub()
  const payments = splitList(info.payments)
  const [form, setForm] = useState({ name: summary ? `${summary.member.firstName} ${summary.member.lastName}` : '', phone: summary?.member.phone ?? '', address: '', payment: payments[0] ?? '', notes: '' })
  const preview = summary ? previewOrderPoints(summary.member.id, subtotal) : null
  const [done, setDone] = useState(null)
  useTitle('Finalizar pedido')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const totals = computeTotals(service, mode, subtotal)
  const minOrder = mode === 'delivery' ? Number(service.delivery.minOrder) || 0 : 0
  const missing = minOrder > subtotal ? minOrder - subtotal : 0
  const current = service[mode]

  const submit = (e) => {
    e.preventDefault()
    if (missing > 0) return
    const order = createOrder({
      mode, items, subtotal, fee: totals.fee, total: totals.total, toCoordinate: totals.toCoordinate,
      customer: { name: form.name, phone: form.phone, address: mode === 'delivery' ? form.address : '' },
      payment: form.payment, notes: form.notes, memberId: summary?.member.id ?? null,
    })
    const link = whatsappUrl(info.whatsapp, buildMessage({ code: order.code, items, subtotal, totals, form, mode, memberNumber: summary?.member.number }))
    window.open(link, '_blank', 'noopener')
    setDone({ order, link })
    clear()
  }

  if (done) return <Confirmation order={done.order} whatsappLink={done.link} />

  if (allowed.length === 0) {
    return (
      <section className="wrap confirm">
        <ShoppingBag size={32} strokeWidth={1} />
        <h1>Pedidos pausados</h1>
        <p className="lead">Por el momento no estamos tomando pedidos online. Escribinos y te ayudamos.</p>
        <a className="btn btn--gold" href={whatsappUrl(info.whatsapp)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Escribir por WhatsApp</a>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="wrap confirm">
        <ShoppingBag size={32} strokeWidth={1} />
        <h1>Tu pedido está vacío</h1>
        <Link className="btn btn--gold" to="/takeaway">Ver productos</Link>
      </section>
    )
  }

  return (
    <div className="wrap checkout">
      <header className="checkout__head">
        <p className="eyebrow">Último paso</p>
        <h1>Finalizar pedido</h1>
      </header>

      <form className="checkout__form" onSubmit={submit}>
        {summary ? (
          preview.total > 0 && (
            <div className="club-banner">
              <b>¡Este pedido te suma {preview.total.toLocaleString('es-AR')} puntos a Joakina Club!</b>
              <small>{preview.lines.map((l) => `${l.label}: +${l.points.toLocaleString('es-AR')}`).join(' · ')}. Se acreditan cuando el pedido se entrega.</small>
            </div>
          )
        ) : (
          <div className="club-banner">
            <b>Sumá puntos con este pedido</b>
            <small>Iniciá sesión o registrate en Joakina Club para vincular tus compras. Si seguís como invitado, no se acreditan puntos.</small>
            <div className="row">
              <Link className="btn btn--gold" to="/club/registro?next=/checkout">Quiero sumarme</Link>
              <Link className="btn btn--line" to="/club/login?next=/checkout">Ya soy socio</Link>
            </div>
          </div>
        )}
        <fieldset>
          <legend><span>1</span> Tus datos</legend>
          <label>Nombre<input required autoComplete="name" value={form.name} onChange={set('name')} /></label>
          <label>Teléfono<input required type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set('phone')} /></label>
        </fieldset>

        <fieldset>
          <legend><span>2</span> Entrega</legend>
          <ModeSwitch form />
          {mode === 'delivery'
            ? <label>Dirección de entrega<input required autoComplete="street-address" value={form.address} onChange={set('address')} /></label>
            : <p className="hint">Retirás en {info.address}.</p>}
          {current.note && <p className="hint">{current.note}</p>}
          {missing > 0 && <p className="form-error" role="alert">El pedido mínimo para delivery es {formatPrice(minOrder)}. Te faltan {formatPrice(missing)}.</p>}
        </fieldset>

        <fieldset>
          <legend><span>3</span> Pago</legend>
          <div className="pay">
            {payments.map((p) => (
              <label key={p} className={form.payment === p ? 'is-on' : ''}>
                <input type="radio" name="payment" value={p} checked={form.payment === p} onChange={set('payment')} required />
                {p}
              </label>
            ))}
          </div>
          <p className="hint">El pago se coordina con el local al confirmar por WhatsApp.</p>
          <label>Aclaraciones (opcional)<textarea rows={2} value={form.notes} onChange={set('notes')} /></label>
        </fieldset>

        <aside className="summary" aria-label="Resumen del pedido">
          <h2>Resumen</h2>
          <ul>{items.map((item) => <CartLine key={item.key} item={item} />)}</ul>
          <div className="total total--sub"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          {mode === 'delivery' && (
            <div className="total total--sub"><span>Envío</span><span>{totals.toCoordinate ? 'A coordinar' : totals.free || !totals.fee ? 'Gratis' : formatPrice(totals.fee)}</span></div>
          )}
          <div className="total"><span>Total</span><strong>{formatPrice(totals.total)}</strong></div>
          <button type="submit" className="btn btn--gold btn--full" disabled={missing > 0}><WhatsAppIcon /> Confirmar por WhatsApp</button>
        </aside>
      </form>
    </div>
  )
}
