import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bike, Check, ShoppingBag } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useCart } from '../context/CartContext'
import { useTitle } from '../lib/useTitle'
import { formatPrice, splitList, whatsappUrl } from '../lib/format'
import { CartLine } from '../components/Cart'
import { WhatsAppIcon } from '../components/icons'

function buildMessage({ items, subtotal, form, mode }) {
  const lines = items.map((i) => {
    const name = [i.name, i.units, i.option].filter(Boolean).join(' · ')
    return `• ${i.qty}x ${name} (${formatPrice(i.price * i.qty)})`
  })
  return [
    'Hola Joakina Sushi! Quiero hacer un pedido:',
    '',
    ...lines,
    '',
    `Total: ${formatPrice(subtotal)}${mode === 'delivery' ? ' + envío a coordinar' : ''}`,
    '',
    `Nombre: ${form.name}`,
    `Teléfono: ${form.phone}`,
    `Entrega: ${mode === 'delivery' ? 'Delivery' : 'Retiro por el local'}`,
    mode === 'delivery' ? `Dirección: ${form.address}` : '',
    `Pago: ${form.payment}`,
    form.notes ? `Aclaraciones: ${form.notes}` : '',
  ].filter((line, index, all) => line !== '' || all[index - 1] !== '').join('\n')
}

function Confirmation({ whatsappLink }) {
  return (
    <section className="wrap confirm">
      <motion.span className="confirm__mark" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Check size={30} strokeWidth={1.2} /></motion.span>
      <h1>Tu pedido está listo</h1>
      <p className="lead">Lo abrimos en WhatsApp con todos los datos. Envialo desde ahí para que lo recibamos y te confirmemos.</p>
      <a className="btn btn--gold" href={whatsappLink} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Abrir WhatsApp de nuevo</a>
      <Link className="link-btn" to="/menu">Volver a la carta</Link>
    </section>
  )
}

export default function Checkout() {
  const { data: { info } } = useSite()
  const { items, subtotal, mode, setMode, clear } = useCart()
  const payments = splitList(info.payments)
  const [form, setForm] = useState({ name: '', phone: '', address: '', payment: payments[0] ?? '', notes: '' })
  const [sentLink, setSentLink] = useState(null)
  useTitle('Finalizar pedido')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const link = whatsappUrl(info.whatsapp, buildMessage({ items, subtotal, form, mode }))
    window.open(link, '_blank', 'noopener')
    setSentLink(link)
    clear()
  }

  if (sentLink) return <Confirmation whatsappLink={sentLink} />

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
        <fieldset>
          <legend><span>1</span> Tus datos</legend>
          <label>Nombre<input required autoComplete="name" value={form.name} onChange={set('name')} /></label>
          <label>Teléfono<input required type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set('phone')} /></label>
        </fieldset>

        <fieldset>
          <legend><span>2</span> Entrega</legend>
          <div className="mode-switch mode-switch--form" role="radiogroup" aria-label="Modalidad de entrega">
            <button type="button" role="radio" aria-checked={mode === 'retiro'} className={mode === 'retiro' ? 'is-on' : ''} onClick={() => setMode('retiro')}>
              <ShoppingBag size={18} strokeWidth={1.2} /> Retiro por el local
            </button>
            <button type="button" role="radio" aria-checked={mode === 'delivery'} className={mode === 'delivery' ? 'is-on' : ''} onClick={() => setMode('delivery')}>
              <Bike size={18} strokeWidth={1.2} /> Delivery
            </button>
          </div>
          {mode === 'delivery'
            ? <label>Dirección de entrega<input required autoComplete="street-address" value={form.address} onChange={set('address')} /></label>
            : <p className="hint">Retirás en {info.address}.</p>}
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
          {mode === 'delivery' && <div className="total total--sub"><span>Envío</span><span>A coordinar</span></div>}
          <div className="total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div>
          <button type="submit" className="btn btn--gold btn--full"><WhatsAppIcon /> Confirmar por WhatsApp</button>
        </aside>
      </form>
    </div>
  )
}
