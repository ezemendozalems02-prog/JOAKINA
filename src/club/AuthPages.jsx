import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserRound } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'
import { whatsappUrl } from '../lib/format'
import PageHero from '../components/PageHero'
import { useClub } from './ClubContext'
import { ClubError, adminMembers } from './store'
import { Celebration, Field, MemberCard, fmt } from './ui'

/** Sólo se aceptan rutas internas como destino de retorno. */
export const safeNext = (value, fallback) => (value && value.startsWith('/') && !value.startsWith('//') ? value : fallback)

function PasswordInput({ value, onChange, autoComplete, id }) {
  const [show, setShow] = useState(false)
  return (
    <span className="pw">
      <input id={id} required type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={onChange} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{show ? <EyeOff size={18} strokeWidth={1.3} /> : <Eye size={18} strokeWidth={1.3} />}</button>
    </span>
  )
}

export function Register() {
  const { data } = useSite()
  const { register, summary } = useClub()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'), '')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', birthDate: '', ref: params.get('ref') || '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  useTitle('Sumate a Joakina Club')
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErrors({}); setError('')
    try {
      const result = await register(form, { ref: form.ref })
      setDone(result)
    } catch (err) {
      if (err instanceof ClubError) { setErrors(err.fields || {}); setError(err.message) } else setError('No pudimos crear tu cuenta. Probá de nuevo.')
    } finally { setBusy(false) }
  }

  if (done && summary) {
    return (
      <section className="wrap confirm" style={{ position: 'relative' }}>
        <Celebration show />
        <p className="eyebrow">Joakina Club</p>
        <h1>¡Bienvenido a Joakina Club!</h1>
        <p className="lead">Ya sos parte de nuestra comunidad. Tu próxima experiencia viene con recompensa.</p>
        {done.welcomePoints > 0 && <p className="club-banner" style={{ margin: 0, textAlign: 'center' }}><b>+{fmt(done.welcomePoints)} puntos de bienvenida</b></p>}
        <MemberCard summary={summary} />
        <div className="club-cta" style={{ justifyContent: 'center' }}>
          <Link className="btn btn--gold" to={next || '/takeaway'}>{next ? 'Continuar con mi pedido' : 'Hacer mi pedido'}</Link>
          <Link className="btn btn--line" to="/club/mi-cuenta">Ver mi cuenta</Link>
        </div>
      </section>
    )
  }

  if (summary) {
    return (
      <section className="wrap confirm">
        <UserRound size={32} strokeWidth={1} />
        <h1>Ya sos socio</h1>
        <p className="lead">Estás dentro de Joakina Club como {summary.member.firstName}.</p>
        <Link className="btn btn--gold" to="/club/mi-cuenta">Ir a mi cuenta</Link>
      </section>
    )
  }

  return (
    <>
      <PageHero eyebrow="Joakina Club" title="Quiero sumarme" text="Registrate gratis y recibí puntos de bienvenida." image={data.images.reservas} />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 620 }}>
          <form className="cform" onSubmit={submit} noValidate>
            <div className="cform__two">
              <Field label="Nombre" error={errors.firstName}><input id="reg-first" required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} /></Field>
              <Field label="Apellido" error={errors.lastName}><input id="reg-last" required autoComplete="family-name" value={form.lastName} onChange={set('lastName')} /></Field>
            </div>
            <Field label="Email" error={errors.email}><input id="reg-email" required type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} /></Field>
            <Field label="Teléfono" error={errors.phone}><input id="reg-phone" required type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Contraseña" error={errors.password} hint="Al menos 8 caracteres, con letras y números."><PasswordInput id="reg-pass" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
            <Field label="Fecha de nacimiento (opcional)" error={errors.birthDate} hint="Para tu regalo de cumpleaños. No se puede modificar después."><input id="reg-birth" type="date" autoComplete="bday" value={form.birthDate} onChange={set('birthDate')} /></Field>
            <Field label="Código de invitación (opcional)"><input id="reg-ref" value={form.ref} onChange={set('ref')} autoCapitalize="characters" /></Field>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn--gold btn--full" type="submit" disabled={busy}>{busy ? 'Creando tu cuenta…' : 'Crear mi cuenta'}</button>
            <p className="hint" style={{ textAlign: 'center' }}>¿Ya tenés cuenta? <Link to={`/club/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Iniciá sesión</Link></p>
          </form>
        </div>
      </section>
    </>
  )
}

export function Login() {
  const { data } = useSite()
  const { login, summary } = useClub()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'), '/club/mi-cuenta')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [demo] = useState(() => { try { return adminMembers('demo') } catch { return [] } })
  useTitle('Ingresar a Joakina Club')

  const attempt = async (email, password) => {
    setBusy(true); setError('')
    try { await login(email, password); navigate(next, { replace: true }) } catch (err) { setError(err instanceof ClubError ? err.message : 'No pudimos iniciar sesión.') } finally { setBusy(false) }
  }

  if (summary) {
    return (
      <section className="wrap confirm">
        <UserRound size={32} strokeWidth={1} />
        <h1>Ya iniciaste sesión</h1>
        <p className="lead">Hola, {summary.member.firstName}.</p>
        <Link className="btn btn--gold" to={next}>Continuar</Link>
      </section>
    )
  }

  return (
    <>
      <PageHero eyebrow="Joakina Club" title="Ya soy socio" text="Ingresá con tu email y contraseña." image={data.images.reservas} />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <form className="cform" onSubmit={(e) => { e.preventDefault(); attempt(form.email, form.password) }}>
            <Field label="Email"><input id="login-email" required type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Contraseña"><PasswordInput id="login-pass" autoComplete="current-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></Field>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn--gold btn--full" type="submit" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
            <button type="button" className="link-btn" onClick={() => setForgot((v) => !v)}>¿Olvidaste tu contraseña?</button>
            {forgot && (
              <motion.p className="notice" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                Todavía no podemos enviar correos de recuperación. Escribinos y el local te genera una contraseña temporal.{' '}
                <a href={whatsappUrl(data.info.whatsapp, 'Hola Joakina Sushi! Necesito recuperar mi contraseña de Joakina Club.')} target="_blank" rel="noopener noreferrer">Pedirla por WhatsApp</a>
              </motion.p>
            )}
            <p className="hint" style={{ textAlign: 'center' }}>¿Todavía no sos socio? <Link to={`/club/registro${next !== '/club/mi-cuenta' ? `?next=${encodeURIComponent(next)}` : ''}`} style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Sumate gratis</Link></p>
          </form>

          {demo.length > 0 && (
            <div className="demo-note" style={{ display: 'grid', marginTop: 34 }}>
              <span><b>DEMO</b> &nbsp;Probá con un socio de ejemplo (contraseña <code>demo1234</code>):</span>
              <span className="chips" style={{ marginTop: 6 }}>
                {demo.map(({ member }) => <button key={member.id} type="button" className="chip" disabled={busy} onClick={() => attempt(member.email, 'demo1234')}>{member.firstName}</button>)}
              </span>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
