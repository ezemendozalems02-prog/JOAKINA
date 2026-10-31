import { Link } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import { Isotype } from '../components/Logo'

const VALUES = [
  { title: 'Sushi Art', text: 'El sushi es el protagonista de nuestra propuesta.' },
  { title: 'Para compartir', text: 'Combinados a elección del sushi man, con rolls especiales y rebozados.' },
  { title: 'Cocina japonesa', text: 'Sabores, texturas y preparaciones especiales.' },
]

export default function Nosotros() {
  const { data } = useSite()
  useTitle('Nosotros', 'Joakina Sushi es una experiencia gastronómica japonesa contemporánea, donde el sushi es protagonista.')
  return (
    <>
      <PageHero eyebrow="Nosotros" title="El arte de disfrutar el sushi." image={data.images.nosotros} />
      <section className="section">
        <div className="wrap about">
          <Reveal className="about__mark"><Isotype size={120} /></Reveal>
          <Reveal delay={0.1}>
            <h2>Una experiencia gastronómica japonesa contemporánea.</h2>
            <p className="lead">Joakina Sushi es una propuesta donde el sushi es protagonista: una selección de sabores japoneses elaborados para disfrutar cada momento.</p>
          </Reveal>
        </div>
        <div className="wrap values">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.1}>
              <span className="exp__num">0{i + 1}</span>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="closing">
        <p>Tu próxima experiencia comienza acá.</p>
        <div>
          <Link className="btn btn--gold" to="/menu">Explorar carta</Link>
          <Link className="btn btn--line" to="/contacto">Reservar mesa</Link>
        </div>
      </section>
    </>
  )
}
