import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Gift } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'
import Photo from '../components/Photo'
import PageHero from '../components/PageHero'
import { useClub } from './ClubContext'
import { ClubError, cancelMyRedemption, publicCatalog, redeemReward } from './store'
import { Celebration, EmptyState, Modal, Skeleton, fmt, fmtDate, useSkeleton } from './ui'

export function RewardCard({ reward, balance, onRedeem }) {
  const logged = balance !== null
  const missing = logged ? Math.max(0, reward.points - balance) : reward.points
  return (
    <article className={`rcard ${logged && missing > 0 ? 'is-locked' : ''}`}>
      <div className="rcard__media">
        <Photo src={reward.image} alt={reward.name} sizes="(max-width: 700px) 92vw, 30vw" />
        <span className="rcard__cost">{fmt(reward.points)} pts</span>
      </div>
      <div className="rcard__body">
        <h3>{reward.name}</h3>
        <p>{reward.description}</p>
        {onRedeem && (
          <div className="rcard__foot">
            {logged && (
              <>
                <div className="rbar" aria-hidden="true"><span style={{ width: `${Math.min(100, (balance / reward.points) * 100)}%` }} /></div>
                <span className="rcard__need">{missing > 0 ? `Te faltan ${fmt(missing)} puntos` : '¡Ya podés canjearla!'}</span>
              </>
            )}
            {logged
              ? <button className="btn btn--gold btn--full" disabled={missing > 0} onClick={() => onRedeem(reward)}>Canjear</button>
              : <Link className="btn btn--line btn--full" to="/club/login?next=/club/recompensas">Iniciá sesión para canjear</Link>}
          </div>
        )}
      </div>
    </article>
  )
}

export function MyRedemptions({ redemptions, onChange }) {
  const { token, notify } = useClub()
  const [copied, setCopied] = useState('')
  const copy = async (code) => {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 1600) } catch { notify(`Tu código: ${code}`) }
  }
  const cancel = (r) => {
    if (!confirm(`¿Cancelar el canje de ${r.rewardName}? Te devolvemos ${fmt(r.points)} puntos.`)) return
    try { cancelMyRedemption(token, r.id); notify('Canje cancelado: puntos reintegrados.'); onChange?.() } catch (e) { notify(e.message) }
  }
  if (!redemptions.length) return <EmptyState icon={Gift} title="Todavía no canjeaste nada">Cuando canjees una recompensa, su código aparece acá.</EmptyState>
  return (
    <div className="redlist">
      {redemptions.map((r) => (
        <div className="red" key={r.id}>
          <img src={r.rewardImage} alt="" width="64" height="64" loading="lazy" />
          <div>
            <h4>{r.rewardName}<span className={`chip-st is-${r.status}`}>{r.status}</span></h4>
            <small style={{ color: 'var(--muted)' }}>{fmt(r.points)} pts · {fmtDate(r.createdAt)}</small><br />
            {r.status === 'pendiente' && (
              <>
                <span className="code">{r.code}<button onClick={() => copy(r.code)} aria-label={`Copiar código ${r.code}`}>{copied === r.code ? <Check size={16} /> : <Copy size={16} strokeWidth={1.3} />}</button></span><br />
                <button className="link-btn" onClick={() => cancel(r)}>Cancelar canje</button>
              </>
            )}
            {r.status === 'utilizado' && <small style={{ color: 'var(--muted)' }}>Usado el {fmtDate(r.usedAt)}</small>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RewardsPage() {
  const { data } = useSite()
  const { summary, token, refresh, notify } = useClub()
  const loading = useSkeleton()
  const catalog = useMemo(() => publicCatalog(), [summary])
  const [pick, setPick] = useState(null)
  const [won, setWon] = useState(null)
  const [error, setError] = useState('')
  useTitle('Canjeá tus puntos', 'Canjeá tus puntos de Joakina Club por bebidas, entradas, sushi y beneficios exclusivos.')

  const confirm = () => {
    try {
      const redemption = redeemReward(token, pick.id)
      setPick(null); setWon(redemption); setError(''); refresh()
    } catch (e) { setError(e instanceof ClubError ? e.message : 'No pudimos realizar el canje.'); refresh() }
  }

  return (
    <>
      <PageHero eyebrow="Joakina Club" title="Canjeá tus puntos" text={summary ? undefined : 'Registrate para empezar a sumar.'} image={data.images.combinados} />
      <section className="section">
        <div className="wrap">
          {summary && <p className="notice" style={{ margin: '0 0 28px' }}>Tenés <b style={{ color: 'var(--gold)' }}>{fmt(summary.balance)} puntos</b> disponibles.</p>}
          <div className="crewards">
            {loading
              ? [0, 1, 2].map((i) => <Skeleton key={i} style={{ height: 380 }} />)
              : catalog.rewards.map((reward) => <RewardCard key={reward.id} reward={reward} balance={summary ? summary.balance : null} onRedeem={(r) => { setError(''); setPick(r) }} />)}
          </div>
          {!loading && !catalog.rewards.length && <EmptyState icon={Gift} title="Pronto, nuevas recompensas" />}

          {summary && (
            <div style={{ marginTop: 70 }}>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: 20 }}>Mis canjes</h2>
              <MyRedemptions redemptions={summary.redemptions} onChange={refresh} />
            </div>
          )}
        </div>
      </section>

      <Modal open={!!pick} onClose={() => setPick(null)} title={`¿Canjear ${pick?.name}?`}>
        {pick && summary && (
          <>
            <p>Se descuentan <b style={{ color: 'var(--gold)' }}>{fmt(pick.points)} puntos</b> de tu saldo. Te quedan {fmt(summary.balance - pick.points)}.</p>
            {error && <p className="form-error" role="alert" style={{ marginTop: 14 }}>{error}</p>}
            <div className="row">
              <button className="btn btn--line" onClick={() => setPick(null)}>Volver</button>
              <button className="btn btn--gold" onClick={confirm}>Confirmar canje</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!won} onClose={() => { setWon(null); notify('Canje guardado en Mis canjes.') }} label="Canje realizado">
        <Celebration show={!!won} />
        {won && (
          <>
            <p className="eyebrow">¡Canje realizado!</p>
            <h2>{won.rewardName}</h2>
            <p>Mostrá este código en el local para usar tu beneficio:</p>
            <span className="cmodal__code">{won.code}</span>
            <p style={{ fontSize: 13 }}>También lo encontrás en <b>Mis canjes</b>. Se puede usar una sola vez.</p>
            <div className="row"><button className="btn btn--gold" onClick={() => setWon(null)}>Listo</button></div>
          </>
        )}
      </Modal>
    </>
  )
}
