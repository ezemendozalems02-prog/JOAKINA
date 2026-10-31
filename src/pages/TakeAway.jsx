import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import { useCart } from '../context/CartContext'
import { useTitle } from '../lib/useTitle'
import { formatPrice, whatsappUrl } from '../lib/format'
import PageHero from '../components/PageHero'
import ModeSwitch from '../components/ModeSwitch'
import { ProductRow } from '../components/Product'

export default function TakeAway() {
  const { data } = useSite()
  const { mode, setMode, allowed, service } = useCart()
  const [params] = useSearchParams()
  const [category, setCategory] = useState('todos')
  useTitle('Pedir online', 'Armá tu pedido de Joakina Sushi y elegí delivery o take away.')

  const requestedMode = params.get('modo')
  useEffect(() => { if (requestedMode === 'delivery') setMode('delivery') }, [requestedMode, setMode])

  const categories = useMemo(() => Object.entries(data.menu)
    .map(([key, value]) => ({ key, label: value.label, items: value.items.filter((i) => i.visible !== false) }))
    .filter((c) => c.items.length), [data.menu])

  const shown = category === 'todos' ? categories : categories.filter((c) => c.key === category)
  const current = service[mode]
  const minOrder = mode === 'delivery' ? Number(current.minOrder) || 0 : 0

  return (
    <>
      <PageHero eyebrow="Pedí online" title="Armá tu pedido" image={data.images.experience3} />

      <div className="wrap">
        <ModeSwitch />
        {allowed.length === 0 ? (
          <p className="mode-note">Por el momento no estamos tomando pedidos online. <a href={whatsappUrl(data.info.whatsapp)} target="_blank" rel="noopener noreferrer">Escribinos por WhatsApp</a>.</p>
        ) : (
          (current.note || minOrder > 0) && (
            <p className="mode-note">{[current.note, minOrder > 0 ? `Pedido mínimo ${formatPrice(minOrder)}.` : ''].filter(Boolean).join(' ')}</p>
          )
        )}
      </div>

      <nav className="tabs" aria-label="Filtrar por categoría">
        <div className="tabs__inner">
          <button className={category === 'todos' ? 'is-on' : ''} onClick={() => setCategory('todos')}>Todos</button>
          {categories.map((c) => (
            <button key={c.key} className={category === c.key ? 'is-on' : ''} onClick={() => setCategory(c.key)}>{c.label}</button>
          ))}
        </div>
      </nav>

      <div className="wrap order-list">
        {shown.map((c) => (
          <section key={c.key}>
            <h2>{c.label}</h2>
            <div className="rows">
              {c.items.map((product) => <ProductRow key={product.id} product={product} />)}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
