import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'
import { whatsappUrl } from '../lib/format'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import { ComboFeature, ProductRow } from '../components/Product'

const TAB_OFFSET = 150

export default function Menu() {
  const { data } = useSite()
  const { hash } = useLocation()
  useTitle('Carta', 'Carta de Joakina Sushi: combinados, entradas, platos principales y adicionales, con precios y fotos.')

  const categories = useMemo(() => Object.entries(data.menu)
    .map(([key, value]) => ({ key, ...value, items: value.items.filter((i) => i.visible !== false) }))
    .filter((c) => c.items.length), [data.menu])

  const [active, setActive] = useState(categories[0]?.key)

  const scrollTo = (key) => {
    const el = document.getElementById(key)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - TAB_OFFSET + 30, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!hash) return undefined
    const timer = setTimeout(() => scrollTo(hash.slice(1)), 120)
    return () => clearTimeout(timer)
  }, [hash])

  useEffect(() => {
    const onScroll = () => {
      const current = categories.findLast((c) => {
        const el = document.getElementById(c.key)
        return el && el.getBoundingClientRect().top <= TAB_OFFSET
      })
      if (current) setActive(current.key)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [categories])

  return (
    <>
      <PageHero eyebrow="Joakina Sushi" title="La carta" image={data.images.combinados} />

      <nav className="tabs" aria-label="Categorías de la carta">
        <div className="tabs__inner">
          {categories.map((c) => (
            <button key={c.key} className={active === c.key ? 'is-on' : ''} onClick={() => scrollTo(c.key)}>{c.label}</button>
          ))}
        </div>
      </nav>

      {categories.map((category, i) => (
        <section key={category.key} id={category.key} className={`menu-sec ${category.key === 'combinados' ? 'menu-sec--combos' : ''}`}>
          <div className="wrap">
            <Reveal className="menu-sec__head">
              <span className="menu-sec__num">{String(i + 1).padStart(2, '0')}</span>
              <h2>{category.key === 'combinados' ? 'Nuestros combinados' : category.label}</h2>
              {category.intro && <p className="lead">{category.intro}</p>}
            </Reveal>
            {category.key === 'combinados' ? (
              <div className="combo-list">
                {category.items.map((product, index) => <ComboFeature key={product.id} product={product} index={index} />)}
              </div>
            ) : (
              <div className="rows">
                {category.items.map((product) => <ProductRow key={product.id} product={product} />)}
              </div>
            )}
          </div>
        </section>
      ))}

      <section className="closing">
        <p>¿Tenés preguntas sobre la carta o alergias?</p>
        <div>
          <Link className="btn btn--gold" to="/takeaway">Hacer mi pedido</Link>
          <a className="btn btn--line" href={whatsappUrl(data.info.whatsapp)} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>
        </div>
      </section>
    </>
  )
}
