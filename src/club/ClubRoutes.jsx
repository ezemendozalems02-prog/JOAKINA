import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Coins, Crown, Gift, Sparkles, Store, Tag } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'
import Photo from '../components/Photo'
import Reveal from '../components/Reveal'
import { useClub } from './ClubContext'
import { publicCatalog } from './store'
import { Celebration, LevelBadge, Modal, fmt } from './ui'
import { Login, Register } from './AuthPages'
import AccountPage from './AccountPage'
import RewardsPage, { RewardCard } from './RewardsPage'
import MissionsPage from './MissionsPage'

const BENEFITS = [
  { Icon: Coins, text: 'Acumulá puntos con tus compras.' },
  { Icon: Gift, text: 'Canjeá puntos por sushi y productos gratis.' },
  { Icon: Tag, text: 'Accedé a promociones exclusivas.' },
  { Icon: Store, text: 'Conseguí recompensas por tus visitas.' },
  { Icon: Sparkles, text: 'Desbloqueá beneficios especiales.' },
]

function readNfc(params) {
  const fromUrl = { suc: params.get('suc'), mesa: params.get('mesa') }
  try {
    if (fromUrl.suc || fromUrl.mesa) { sessionStorage.setItem('joakina_nfc', JSON.stringify(fromUrl)); return fromUrl }
    return JSON.parse(sessionStorage.getItem('joakina_nfc')) || {}
  } catch { return fromUrl }
}

function Landing() {
  const { data } = useSite()
  const { summary } = useClub()
  const catalog = useMemo(() => publicCatalog(), [])
  useTitle('Joakina Club', 'Joakina Club: registrate gratis, acumulá puntos con cada pedido y canjealos por sushi y beneficios exclusivos.')
  return (
    <>
      <section className="club-hero">
        <Photo className="club-hero__img" src={data.images.nosotros} priority />
        <div className="club-hero__shade" />
        <div className="wrap club-hero__inner">
          <p className="eyebrow">Club de beneficios</p>
          <motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>Joakina <em>Club</em></motion.h1>
          <p className="club-hero__quote">Cada pedido tiene su recompensa.</p>
          <p className="lead">Sumate a Joakina Club y empezá a disfrutar de beneficios exclusivos, acumulando puntos con cada pedido.</p>
          <div className="club-cta">
            {summary ? (
              <Link className="btn btn--gold" to="/club/mi-cuenta">Ir a mi cuenta</Link>
            ) : (
              <>
                <Link className="btn btn--gold" to="/club/registro">Quiero sumarme</Link>
                <Link className="btn btn--line" to="/club/login">Ya soy socio</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="section__head"><p className="eyebrow">Tus beneficios</p><h2>Más que un pedido.</h2></Reveal>
          <ul className="cbenefits">
            {BENEFITS.map(({ Icon, text }) => <li key={text}><Icon size={24} strokeWidth={1.1} /><p>{text}</p></li>)}
          </ul>
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap">
          <Reveal className="section__head"><p className="eyebrow">Así funciona</p><h2>Tres pasos.</h2></Reveal>
          <div className="csteps">
            {[['01', 'Registrate gratis', `Creá tu cuenta y recibí ${catalog.missions.find((m) => m.trigger === 'register')?.points ?? 200} puntos de bienvenida.`],
              ['02', 'Pedí y sumá', `Cada $${fmt(catalog.config.blockAmount)} de compra suma ${catalog.config.pointsPerBlock} puntos cuando recibís tu pedido.`],
              ['03', 'Canjeá tus puntos', 'Elegí tu recompensa y mostrá el código en el local.']].map(([n, t, d], i) => (
                <Reveal key={n} delay={i * 0.1}><div><b>{n}</b><h3>{t}</h3><p>{d}</p></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="section__head"><p className="eyebrow">Niveles</p><h2>Cada punto te lleva más lejos.</h2></Reveal>
          <div className="clevels">
            {catalog.config.levels.map((level, i) => (
              <Reveal key={level.id} delay={i * 0.08}>
                <div className="clevel" data-level={level.id}>
                  <h3>{level.name}</h3>
                  <small>{level.min === 0 ? 'Desde el primer día' : `Desde ${fmt(level.min)} puntos`}</small>
                  <ul>{level.perks.map((perk) => <li key={perk}>· {perk}</li>)}</ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap">
          <Reveal className="section__head"><p className="eyebrow">Canjeá tus puntos</p><h2>Recompensas.</h2></Reveal>
          <div className="crewards">
            {catalog.rewards.slice(0, 3).map((reward) => <RewardCard key={reward.id} reward={reward} balance={summary?.balance ?? null} />)}
          </div>
          <div className="cnext"><Link className="btn btn--line" to="/club/recompensas">Ver todas las recompensas</Link></div>
        </div>
      </section>
    </>
  )
}

/** Barra de navegación del club y contexto del NFC (sucursal / mesa). */
export default function ClubRoutes() {
  const { summary, logout } = useClub()
  const [params] = useSearchParams()
  const nfc = readNfc(params)
  const branch = publicCatalog().config.branches.find((b) => b.id === nfc.suc)
  const [levelUp, setLevelUp] = useState(null)
  const { syncPoints } = useClub()
  const memberId = summary?.member.id
  const levelIndex = summary?.index
  const level = summary?.level
  const lastEntry = summary?.entries[0]?.id

  // Avisa de puntos nuevos (por ejemplo un pedido que acaba de pasar a Entregado).
  useEffect(() => { if (memberId) syncPoints() }, [memberId, lastEntry, syncPoints])

  // Celebra la subida de nivel. Sólo es una preferencia visual: el nivel real sale de los puntos históricos.
  useEffect(() => {
    if (!memberId) return
    const key = `joakina_club_lvl_${memberId}`
    try {
      const stored = localStorage.getItem(key)
      if (stored === null) localStorage.setItem(key, String(levelIndex))
      else if (levelIndex > Number(stored)) { localStorage.setItem(key, String(levelIndex)); setTimeout(() => setLevelUp(level), 0) }
    } catch { /* sin almacenamiento no se celebra */ }
  }, [memberId, levelIndex, level])

  return (
    <>
      {(nfc.suc || nfc.mesa) && (
        <div className="nfc-strip">Estás en <b>{branch?.name ?? 'Joakina Sushi'}</b>{nfc.mesa ? <> · Mesa <b>{nfc.mesa}</b></> : null}. Pedile al personal que registre tu visita para sumar puntos.</div>
      )}
      <nav className="club-bar" aria-label="Joakina Club">
        <div className="club-bar__inner">
          <NavLink to="/club" end>Inicio</NavLink>
          <NavLink to="/club/mi-cuenta">Mi cuenta</NavLink>
          <NavLink to="/club/recompensas">Recompensas</NavLink>
          <NavLink to="/club/misiones">Desafíos</NavLink>
          <div className="club-bar__who">
            {summary ? (
              <><span>Hola, {summary.member.firstName}</span><LevelBadge level={summary.level} /><button onClick={logout}>Salir</button></>
            ) : (
              <><NavLink to="/club/login">Ingresar</NavLink><NavLink to="/club/registro">Sumarme</NavLink></>
            )}
          </div>
        </div>
      </nav>
      <Routes>
        <Route index element={<Landing />} />
        <Route path="registro" element={<Register />} />
        <Route path="login" element={<Login />} />
        <Route path="mi-cuenta" element={<AccountPage />} />
        <Route path="recompensas" element={<RewardsPage />} />
        <Route path="misiones" element={<MissionsPage />} />
        <Route path="*" element={<Navigate to="/club" replace />} />
      </Routes>

      <Modal open={!!levelUp} onClose={() => setLevelUp(null)} label="Subiste de nivel">
        <Celebration show={!!levelUp} />
        <Crown size={34} strokeWidth={1} style={{ color: 'var(--gold)', marginBottom: 10 }} />
        <p className="eyebrow">¡Subiste de nivel!</p>
        <h2>{levelUp?.name}</h2>
        <p>{levelUp?.description}</p>
        <div className="row"><button className="btn btn--gold" onClick={() => setLevelUp(null)}>Seguir sumando</button></div>
      </Modal>
    </>
  )
}
