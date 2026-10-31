import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bike, ShoppingBag } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useCart } from '../context/CartContext'
import { useTitle } from '../lib/useTitle'
import PageHero from '../components/PageHero'
import { ProductRow } from '../components/Product'

export default function TakeAway() {
  const { data } = useSite()
  const { mode, setMode } = useCart()
  const [params] = useSearchParams()
  const [category, setCategory] = useState('todos')
  useTitle('Pedir online', 'Armá tu pedido de Joakina Sushi y elegí delivery o retiro por el local.')

  const requestedMode = params.get('modo')
  useEffect(() => { if (requestedMode === 'delivery') setMode('delivery') }, [requestedMode, setMode])

  const categories = useMemo(() => Object.entries(data.menu)
    .map(([key, value]) => ({ key, label: value.label, items: value.items.filter((i) => i.visible !== false) }))
    .filter((c) => c.items.length), [data.menu])

  const shown = category === 'todos' ? categories : categories.filter((c) => c.key === category)

  return (
    <>
      <PageHero eyebrow="Pedí online" title="Armá tu pedido" image={data.images.experience3} />

      <div className="wrap mode-switch" role="radiogroup" aria-label="Modalidad de entrega">
        <button role="radio" aria-checked={mode === 'retiro'} className={mode === 'retiro' ? 'is-on' : ''} onClick={() => setMode('retiro')}>
          <ShoppingBag size={18} strokeWidth={1.2} /> Retiro por el local
        </button>
        <button role="radio" aria-checked={mode === 'delivery'} className={mode === 'delivery' ? 'is-on' : ''} onClick={() => setMode('delivery')}>
          <Bike size={18} strokeWidth={1.2} /> Delivery
        </button>
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
