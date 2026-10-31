import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Target } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'
import PageHero from '../components/PageHero'
import { useClub } from './ClubContext'
import { ClubError, claimBirthday, consumeNewPoints, missionsFor, publicCatalog, summaryForToken } from './store'
import { Celebration, EmptyState, Modal, Skeleton, acknowledgeLevel, fmt, useSkeleton } from './ui'

const STATE = {
  completada: 'Completado', abierta: 'En progreso', reclamable: '¡Podés reclamarlo!', validacion: 'Lo valida el personal del local',
  proximamente: 'Disponible en el mes de tu cumpleaños', sin_fecha: 'Cargá tu fecha de nacimiento en Mis datos',
}
const COUNTED = ['first_order', 'every_n_orders', 'orders_total']

export function MissionCard({ mission, onClaim }) {
  const done = mission.status === 'completada' && !mission.recurring
  const showBar = COUNTED.includes(mission.trigger)
  const target = mission.target || 1
  return (
    <article className={`mission ${done ? 'is-done' : ''}`}>
      <div className="mission__top">
        <h3>{mission.name}</h3>
        <span className="pts">+{fmt(mission.points)}</span>
      </div>
      <p>{mission.description}</p>
      {showBar && (
        <>
          <div className="rbar" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={mission.current} aria-label={mission.name}><span style={{ width: `${Math.min(100, (mission.current / target) * 100)}%` }} /></div>
          <span className="mission__state">{mission.current} de {target}{mission.recurring && mission.doneTimes ? ` · completado ${mission.doneTimes} ${mission.doneTimes === 1 ? 'vez' : 'veces'}` : ''}</span>
        </>
      )}
      {!showBar && <span className="mission__state">{STATE[mission.status]}</span>}
      {mission.action === 'claim_birthday' && <button className="btn btn--gold" onClick={onClaim}>Reclamar mi regalo</button>}
    </article>
  )
}

export default function MissionsPage() {
  const { data } = useSite()
  const { summary, token, refresh, notify } = useClub()
  const loading = useSkeleton()
  const [won, setWon] = useState(0)
  const [levelName, setLevelName] = useState('')
  const catalog = useMemo(() => publicCatalog(), [summary])
  const missions = useMemo(
    () => (summary ? missionsFor(summary.member.id) : catalog.missions.map((m) => ({ ...m, current: 0, status: 'abierta' }))),
    [summary, catalog],
  )
  useTitle('Desafíos Joakina', 'Completá desafíos y ganá puntos extra en Joakina Club.')

  const claim = () => {
    try {
      const before = summary.index
      const points = claimBirthday(token); consumeNewPoints(token)
      const after = summaryForToken(token)
      // Si el regalo hace subir de nivel, se avisa en este mismo modal (un solo festejo).
      if (after && after.index > before) { acknowledgeLevel(after.member.id, after.index); setLevelName(after.level.name) }
      setWon(points); refresh()
    } catch (e) { notify(e instanceof ClubError ? e.message : 'No pudimos reclamar el regalo.') }
  }
  const reviewUrl = catalog.config.googleReviewUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Joakina Sushi')}`

  return (
    <>
      <PageHero eyebrow="Joakina Club" title="Desafíos Joakina" text="Acciones que te suman puntos extra." image={data.images.experience1} />
      <section className="section">
        <div className="wrap">
          {!summary && <p className="notice" style={{ margin: '0 0 28px' }}>Registrate para empezar a completar desafíos. <Link to="/club/registro">Sumarme gratis</Link></p>}
          <div className="missions">
            {loading
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} style={{ height: 150 }} />)
              : missions.map((m) => <MissionCard key={m.id} mission={m} onClaim={claim} />)}
          </div>
          {!loading && !missions.length && <EmptyState icon={Target} title="Pronto, nuevos desafíos" />}

          <article className="mission" style={{ marginTop: 34 }}>
            <h3>Dejá tu opinión en Google</h3>
            <p>Si querés, contanos cómo fue tu experiencia. Es totalmente opcional y <b>no suma ni condiciona puntos</b>: tu opinión es libre y honesta.</p>
            <a className="btn btn--line" href={reviewUrl} target="_blank" rel="noopener noreferrer" style={{ justifySelf: 'start' }}>Ver el perfil de Google <ExternalLink size={14} strokeWidth={1.4} /></a>
          </article>
        </div>
      </section>

      <Modal open={won > 0} onClose={() => { setWon(0); setLevelName('') }} label="Regalo de cumpleaños">
        <Celebration show={won > 0} />
        <p className="eyebrow">¡Feliz cumpleaños!</p>
        <h2>+{fmt(won)} puntos</h2>
        <p>Es tu regalo de Joakina. ¡A disfrutarlo!</p>
        {levelName && <p style={{ marginTop: 10 }}>¡Y además subiste a <b style={{ color: 'var(--gold)' }}>{levelName}</b>!</p>}
        <div className="row"><button className="btn btn--gold" onClick={() => { setWon(0); setLevelName('') }}>Gracias</button></div>
      </Modal>
    </>
  )
}
