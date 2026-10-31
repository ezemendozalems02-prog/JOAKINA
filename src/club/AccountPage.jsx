import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Gift, LogOut, Share2 } from 'lucide-react'
import { useTitle } from '../lib/useTitle'
import { useClub } from './ClubContext'
import { ClubError, changePassword, missionsFor, publicCatalog, updateProfile } from './store'
import { EmptyState, Field, LevelProgress, MemberCard, Skeleton, TYPE_ICON, fmt, fmtDate, useSkeleton } from './ui'
import { MyRedemptions } from './RewardsPage'
import { MissionCard } from './MissionsPage'
import { TYPES } from './engine'

function Activity({ entries }) {
  if (!entries.length) return <EmptyState title="Todavía no hay movimientos">Tus pedidos, visitas y canjes aparecen acá.</EmptyState>
  return (
    <ul className="actv">
      {entries.map((e) => {
        const Icon = TYPE_ICON[e.type] ?? Gift
        return (
          <li key={e.id}>
            <span className="actv__ico"><Icon size={18} strokeWidth={1.2} /></span>
            <div><strong>{TYPES[e.type]?.label}</strong><small>{e.note ? `${e.note} · ` : ''}{fmtDate(e.createdAt)}</small></div>
            <b className={e.points < 0 ? 'is-neg' : ''}>{e.points > 0 ? '+' : ''}{fmt(e.points)}</b>
          </li>
        )
      })}
    </ul>
  )
}

function Profile({ summary }) {
  const { token, refresh, notify } = useClub()
  const m = summary.member
  const [form, setForm] = useState({ firstName: m.firstName, lastName: m.lastName, phone: m.phone, birthDate: m.birthDate })
  const [errors, setErrors] = useState({})
  const [pw, setPw] = useState({ current: '', next: '' })
  const [pwErrors, setPwErrors] = useState({})
  const set = (f) => (e) => setForm((x) => ({ ...x, [f]: e.target.value }))
  const link = `${window.location.origin}/club/registro?ref=${m.referralCode}`

  const save = (e) => {
    e.preventDefault(); setErrors({})
    try { updateProfile(token, form); refresh(); notify('Datos actualizados.') } catch (err) { if (err instanceof ClubError) setErrors(err.fields || { firstName: err.message }) }
  }
  const savePw = async (e) => {
    e.preventDefault(); setPwErrors({})
    try { await changePassword(token, pw.current, pw.next); setPw({ current: '', next: '' }); notify('Contraseña actualizada.') } catch (err) { if (err instanceof ClubError) setPwErrors(err.fields || { current: err.message }) }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(link); notify('Enlace de invitación copiado.') } catch { notify(link) } }

  return (
    <div style={{ display: 'grid', gap: 40 }}>
      <form className="cform" onSubmit={save}>
        <div className="cform__two">
          <Field label="Nombre" error={errors.firstName}><input required value={form.firstName} onChange={set('firstName')} /></Field>
          <Field label="Apellido" error={errors.lastName}><input required value={form.lastName} onChange={set('lastName')} /></Field>
        </div>
        <Field label="Email" hint="El email identifica tu cuenta y no se puede cambiar."><input value={m.email} disabled /></Field>
        <Field label="Teléfono" error={errors.phone}><input required type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Fecha de nacimiento" error={errors.birthDate} hint={m.birthDate ? 'No se puede modificar. Pedile al local que la corrija.' : 'Cargala para recibir tu regalo de cumpleaños. Después no se puede modificar.'}>
          <input type="date" value={form.birthDate} onChange={set('birthDate')} disabled={!!m.birthDate} />
        </Field>
        <button className="btn btn--gold" type="submit">Guardar mis datos</button>
      </form>

      <div className="club-banner" style={{ margin: 0 }}>
        <b>Invitá a un amigo</b>
        <small>Cuando tu invitado complete su primera compra, ganás {fmt(publicCatalog().config.referralPoints)} puntos. Tu código: <strong style={{ color: 'var(--gold)' }}>{m.referralCode}</strong></small>
        <div className="row"><button className="btn btn--line" type="button" onClick={copy}><Share2 size={15} strokeWidth={1.4} /> Copiar enlace de invitación</button></div>
      </div>

      <form className="cform" onSubmit={savePw}>
        <h3 style={{ fontSize: 28 }}>Cambiar contraseña</h3>
        <Field label="Contraseña actual" error={pwErrors.current}><input required type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((x) => ({ ...x, current: e.target.value }))} /></Field>
        <Field label="Contraseña nueva" error={pwErrors.next} hint="Al menos 8 caracteres, con letras y números."><input required type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((x) => ({ ...x, next: e.target.value }))} /></Field>
        <button className="btn btn--line" type="submit">Actualizar contraseña</button>
      </form>
    </div>
  )
}

export default function AccountPage() {
  const { summary, logout, refresh } = useClub()
  const loading = useSkeleton()
  const [tab, setTab] = useState('recompensas')
  const missions = useMemo(() => (summary ? missionsFor(summary.member.id) : []), [summary])
  useTitle('Mi cuenta · Joakina Club')

  if (!summary) return <Navigate to="/club/login?next=/club/mi-cuenta" replace />

  const catalog = publicCatalog()
  const affordable = catalog.rewards.filter((r) => r.points <= summary.balance)
  const nextReward = catalog.rewards.filter((r) => r.points > summary.balance).sort((a, b) => a.points - b.points)[0]
  const tabs = [['recompensas', 'Mis recompensas'], ['actividad', 'Mi actividad'], ['misiones', 'Mis desafíos'], ['datos', 'Mis datos']]

  return (
    <div className="wrap acct">
      <div className="acct__side">
        {loading ? <Skeleton style={{ aspectRatio: '1.586', maxWidth: 440 }} /> : <MemberCard summary={summary} />}
        {loading ? <Skeleton style={{ height: 130 }} /> : <LevelProgress summary={summary} />}
        <div className="cstats" aria-label="Mis puntos">
          <div><b>{fmt(summary.balance)}</b><small>Disponibles</small></div>
          <div><b>{fmt(summary.lifetime)}</b><small>Acumulados</small></div>
          <div><b>{fmt(summary.spent)}</b><small>Utilizados</small></div>
        </div>
        <ul className="clevel" data-level={summary.level.id} style={{ listStyle: 'none' }}>
          <li style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--lv)', paddingBottom: 6 }}>Tus beneficios · {summary.level.name}</li>
          {summary.level.perks.map((p) => <li key={p}>· {p}</li>)}
        </ul>
      </div>

      <div>
        <p className="eyebrow">Mi cuenta</p>
        <h1>Hola, {summary.member.firstName}.</h1>
        <div className="ctabs" role="tablist">
          {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>{l}</button>)}
        </div>

        {loading ? <Skeleton style={{ height: 260 }} /> : (
          <>
            {tab === 'recompensas' && (
              <div style={{ display: 'grid', gap: 28 }}>
                {nextReward
                  ? <div className="lprog"><div className="lprog__head"><span>Próxima recompensa: <b>{nextReward.name}</b></span><span>{fmt(nextReward.points - summary.balance)} pts</span></div><div className="lprog__bar"><span style={{ width: `${(summary.balance / nextReward.points) * 100}%` }} /></div></div>
                  : <p className="notice">¡Ya alcanzás todas las recompensas del catálogo!</p>}
                <p style={{ color: 'var(--muted)' }}>Podés canjear hoy <b style={{ color: 'var(--ivory)' }}>{affordable.length}</b> {affordable.length === 1 ? 'recompensa' : 'recompensas'}. <Link to="/club/recompensas" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Ver el catálogo</Link></p>
                <div><h3 style={{ fontSize: 28, marginBottom: 14 }}>Mis canjes</h3><MyRedemptions redemptions={summary.redemptions} onChange={refresh} /></div>
              </div>
            )}
            {tab === 'actividad' && <Activity entries={summary.entries} />}
            {tab === 'misiones' && (
              <div className="missions" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
                {missions.map((m) => <MissionCard key={m.id} mission={m} />)}
                <Link className="link-btn" to="/club/misiones" style={{ justifySelf: 'start' }}>Ver todos los desafíos</Link>
              </div>
            )}
            {tab === 'datos' && <Profile summary={summary} />}
          </>
        )}

        <button className="link-btn" onClick={logout} style={{ marginTop: 44 }}><LogOut size={14} strokeWidth={1.4} style={{ verticalAlign: -2 }} /> Cerrar sesión</button>
      </div>
    </div>
  )
}

