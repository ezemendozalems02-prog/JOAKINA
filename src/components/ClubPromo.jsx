import { Link } from 'react-router-dom'
import { Coins, Gift, Sparkles, Store, Tag } from 'lucide-react'
import Reveal from './Reveal'
import { useClub } from '../club/ClubContext'
import { MemberCard } from '../club/ui'
import { publicCatalog } from '../club/store'

const BENEFITS = [
  [Coins, 'Acumulá puntos con tus compras.'],
  [Gift, 'Canjeá puntos por sushi y productos gratis.'],
  [Tag, 'Accedé a promociones exclusivas.'],
  [Store, 'Conseguí recompensas por tus visitas.'],
  [Sparkles, 'Desbloqueá beneficios especiales.'],
]

/** Bloque promocional de Joakina Club en la página de inicio. */
export default function ClubPromo() {
  const { summary } = useClub()
  const levels = publicCatalog().config.levels
  // Tarjeta de ejemplo para quien todavía no es socio.
  const sample = { member: { firstName: 'Tu', lastName: 'nombre', number: 'JC-0000' }, level: levels[1] ?? levels[0], balance: 2450 }
  return (
    <section className="club-promo" aria-labelledby="club-promo-title">
      <div className="wrap club-promo__grid">
        <Reveal>
          <p className="eyebrow">Joakina Club</p>
          <h2 id="club-promo-title">¿Querés ser parte de <em>Joakina Club?</em></h2>
          <p className="lead">Registrate gratis, acumulá puntos con cada pedido y desbloqueá beneficios exclusivos pensados para vos.</p>
          <ul>{BENEFITS.map(([Icon, text]) => <li key={text}><Icon size={19} strokeWidth={1.2} />{text}</li>)}</ul>
          <div className="club-cta">
            {summary ? <Link className="btn btn--gold" to="/club/mi-cuenta">Ir a mi cuenta</Link> : (
              <>
                <Link className="btn btn--gold" to="/club/registro">Quiero sumarme</Link>
                <Link className="btn btn--line" to="/club/login">Ya soy socio</Link>
              </>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.12} className="club-promo__card">
          <MemberCard summary={summary ?? sample} />
          <p className="eyebrow" style={{ textAlign: 'center' }}>Cada pedido tiene su recompensa.</p>
        </Reveal>
      </div>
    </section>
  )
}
