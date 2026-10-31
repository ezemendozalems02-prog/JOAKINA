import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, CalendarDays, ChefHat, Fish, Layers } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'
import { formatPrice } from '../lib/format'
import Photo from '../components/Photo'
import Reveal from '../components/Reveal'
import { ProductCard } from '../components/Product'

const EASE = [0.22, 1, 0.36, 1]
// Con la intro en pantalla los textos del hero esperan a que termine.
const introDelay = () => {
  try { return sessionStorage.getItem('joakina_intro') === '1' ? 0 : 1.5 } catch { return 1.5 }
}

function Hero({ image }) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 800], [0, 120])
  const [delay] = useState(introDelay)
  const rise = (step) => ({
    initial: { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay: delay + step, ease: EASE },
  })
  return (
    <section className="hero">
      <motion.div className="hero__media" style={{ y }}>
        <Photo className="hero__img" src={image} alt="Niguiris sobre una tabla oscura" priority />
      </motion.div>
      <div className="hero__shade" />
      <div className="wrap hero__inner">
        <motion.p className="eyebrow" {...rise(0.1)}>Sushi Art · Japanese Experience</motion.p>
        <motion.h1 {...rise(0.2)}>JOAKINA <em>Sushi</em></motion.h1>
        <motion.span className="hero__rule" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: delay + 0.4, ease: EASE }} />
        <motion.p className="hero__quote" {...rise(0.45)}>“El arte de disfrutar el sushi.”</motion.p>
        <motion.div className="hero__cta" {...rise(0.6)}>
          <Link className="btn btn--gold" to="/menu">Explorar carta</Link>
          <Link className="btn btn--line" to="/takeaway">Hacer mi pedido</Link>
        </motion.div>
      </div>
      <a className="scroll-cue" href="#experiencia" aria-label="Bajar a la experiencia"><span /></a>
    </section>
  )
}

function Experience({ images }) {
  const blocks = [
    { n: '01', title: 'Sushi Art', text: 'La esencia de nuestra propuesta.', image: images.experience1, Icon: Fish, to: '/menu#combinados' },
    { n: '02', title: 'Combinados', text: 'Selecciones pensadas para compartir.', image: images.experience2, Icon: Layers, to: '/menu#combinados' },
    { n: '03', title: 'Cocina japonesa', text: 'Sabores, texturas y preparaciones especiales.', image: images.experience3, Icon: ChefHat, to: '/menu#principales' },
  ]
  return (
    <section id="experiencia" className="section experience">
      <div className="wrap">
        <Reveal className="experience__head">
          <h2>Una experiencia,<br /><em>otro nivel.</em></h2>
          <p className="lead">Descubrí nuestra propuesta gastronómica, una selección de sabores japoneses elaborados para disfrutar cada momento.</p>
        </Reveal>
        <div className="experience__grid">
          {blocks.map(({ n, title, text, image, Icon, to }, i) => (
            <Reveal key={n} delay={i * 0.12} y={40} className={`exp exp--${i + 1}`}>
              <Link to={to}>
                <Photo src={image} alt={title} sizes="(max-width: 800px) 100vw, 40vw" />
                <div className="exp__body">
                  <Icon size={22} strokeWidth={1.1} />
                  <span className="exp__num">{n}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Featured({ menu }) {
  const products = Object.values(menu).flatMap((category) =>
    category.items.filter((p) => p.featured && p.visible !== false).map((product) => ({ product, category: category.label })))
  if (!products.length) return null
  return (
    <section className="section section--alt">
      <div className="wrap">
        <Reveal className="section__head">
          <p className="eyebrow">De la carta</p>
          <h2>Destacados</h2>
          <Link className="text-link" to="/menu">Ver carta completa <ArrowRight size={15} strokeWidth={1.3} /></Link>
        </Reveal>
      </div>
      <div className="rail">
        {products.map(({ product, category }) => <ProductCard key={product.id} product={product} category={category} />)}
      </div>
    </section>
  )
}

function Combos({ image, menu }) {
  const combos = menu.combinados?.items.filter((p) => p.visible !== false) ?? []
  return (
    <section className="combos-home">
      <Photo className="combos-home__img" src={image} alt="Bandeja de sushi para compartir" sizes="(max-width: 800px) 100vw, 62vw" />
      <Reveal className="combos-home__text">
        <p className="eyebrow">Nuestros combinados</p>
        <h2>Selecciones pensadas para <em>compartir.</em></h2>
        <p className="lead">{menu.combinados?.intro}</p>
        <ul>
          {combos.slice(0, 4).map((c) => (
            <li key={c.id}><span>{c.name} <small>{c.units}</small></span><b>{formatPrice(c.price)}</b></li>
          ))}
        </ul>
        <Link className="btn btn--gold" to="/menu#combinados">Descubrir combinados</Link>
      </Reveal>
    </section>
  )
}

function Promos({ promos }) {
  const visible = promos.filter((p) => p.visible !== false)
  if (!visible.length) return null
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="section__head"><p className="eyebrow">Promociones</p><h2>Del día</h2></Reveal>
        <ul className="promos">
          {visible.map((p) => <li key={p.id}><span>{p.label}</span><b>{formatPrice(p.price)}</b></li>)}
        </ul>
      </div>
    </section>
  )
}

function Reservation({ image }) {
  return (
    <section className="reserve">
      <Photo className="reserve__img" src={image} />
      <div className="reserve__shade" />
      <Reveal className="reserve__inner">
        <CalendarDays size={26} strokeWidth={1} />
        <h2>Tu próxima experiencia <em>comienza acá.</em></h2>
        <Link className="btn btn--gold" to="/contacto">Reservar mesa</Link>
      </Reveal>
    </section>
  )
}

export default function Home() {
  const { data } = useSite()
  useTitle('', 'Joakina Sushi: sushi art y cocina japonesa. Combinados, entradas y platos principales para pedir online, con delivery o retiro, y reservas de mesa.')
  return (
    <>
      <Hero image={data.images.hero} />
      <Experience images={data.images} />
      <Featured menu={data.menu} />
      <Combos image={data.images.combinados} menu={data.menu} />
      <Promos promos={data.promos} />
      <Reservation image={data.images.reservas} />
    </>
  )
}
