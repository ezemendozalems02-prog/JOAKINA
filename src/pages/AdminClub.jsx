import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Copy, Save } from 'lucide-react'
import { Btn, Card, C, Divider, Inp, SectionHeader, Sel, Txt, f } from './adminUi'
import { TYPES } from '../club/engine'
import { LevelBadge, fmt, fmtDate } from '../club/ui'
import {
  adminCancelRedemption, adminCatalog, adminLedger, adminMembers, adminOverview, adminRedemptions, adjustPoints,
  awardMission, deleteDemoData, deleteMission, deleteReward, lookupRedemption, registerVisit, resetMemberPassword,
  restoreDemoData, saveMission, saveReward, setMemberStatus, summaryForMember, updateConfig, validateRedemption,
} from '../club/store'

const box = { background: C.card, border: `1px solid ${C.border}`, padding: '16px 18px' }
const label = { fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.muted }
const small = { fontFamily: f.sans, fontSize: 12, color: C.muted, lineHeight: 1.6 }
const dateTime = (iso) => new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const DemoBadge = () => <span style={{ fontFamily: f.sans, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', padding: '2px 7px', background: 'rgba(212,162,76,0.16)', color: '#d4a24c', marginLeft: 8 }}>DEMO</span>

function Chip({ on, onClick, children }) {
  return <button onClick={onClick} style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '9px 14px', border: `1px solid ${on ? C.gold : C.border}`, color: on ? C.gold : C.muted, background: 'transparent', cursor: 'pointer' }}>{children}</button>
}

const Switch = ({ on, onClick, yes = 'Activo', no = 'Inactivo' }) => (
  <button onClick={onClick} aria-pressed={on} style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '9px 14px', border: 'none', cursor: 'pointer', background: on ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)', color: on ? '#4ade80' : '#ef4444' }}>{on ? `● ${yes}` : `○ ${no}`}</button>
)

// ───────────────────────── Validar códigos de canje ─────────────────────────
function CodeValidator({ run, actor, tick }) {
  const [code, setCode] = useState('')
  const [found, setFound] = useState(undefined)
  const current = useMemo(() => (found ? lookupRedemption(found.redemption.code) : found), [found, tick])
  const search = (e) => { e.preventDefault(); setFound(lookupRedemption(code) ?? null) }
  return (
    <Card accent style={{ padding: '20px 22px' }}>
      <p style={{ ...label, color: C.gold, marginBottom: 12 }}>Validar código de canje</p>
      <form onSubmit={search} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="JC-XXXXXX" aria-label="Código de canje" style={{ flex: '1 1 200px', minHeight: 46, padding: '10px 14px', background: C.input, border: `1px solid ${C.border}`, color: C.cream, fontFamily: 'monospace', fontSize: 16, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 0 }} />
        <Btn type="submit">Buscar</Btn>
      </form>
      {found === null && <p style={{ ...small, color: '#e1a49d', marginTop: 12 }}>Código inexistente.</p>}
      {current && (
        <div style={{ ...box, marginTop: 14, background: C.input }}>
          <div style={{ fontFamily: f.serif, fontSize: 22, color: C.cream }}>{current.redemption.rewardName}</div>
          <p style={small}>{current.member?.name} · {current.member?.number}{current.member?.demo && <DemoBadge />} · {fmt(current.redemption.points)} pts · {dateTime(current.redemption.createdAt)}</p>
          {current.redemption.status === 'pendiente' ? (
            <div style={{ marginTop: 12 }}><Btn onClick={() => run(() => validateRedemption(current.redemption.code, actor), 'Código validado: canje marcado como utilizado.')}><Check size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Marcar como utilizado</Btn></div>
          ) : (
            <p style={{ ...small, marginTop: 10, color: current.redemption.status === 'utilizado' ? '#d4a24c' : '#e1a49d' }}>
              {current.redemption.status === 'utilizado' ? `Ya fue utilizado el ${dateTime(current.redemption.usedAt)} (${current.redemption.usedBy}). No se puede usar de nuevo.` : 'Este canje fue cancelado y no es válido.'}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

function Ledger({ entries, showMember = true }) {
  if (!entries.length) return <Card><p style={small}>Sin movimientos.</p></Card>
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {entries.map((e) => (
        <div key={e.id} style={{ ...box, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '12px 16px' }}>
          <div>
            <div style={{ fontFamily: f.sans, fontSize: 13, color: C.cream }}>{TYPES[e.type]?.label}{showMember && e.memberName ? ` · ${e.memberName}` : ''}</div>
            <div style={small}>{e.note ? `${e.note} · ` : ''}{dateTime(e.createdAt)} · por {e.by}</div>
          </div>
          <div style={{ fontFamily: f.serif, fontSize: 22, color: e.points < 0 ? C.muted : C.gold }}>{e.points > 0 ? '+' : ''}{fmt(e.points)}</div>
        </div>
      ))}
    </div>
  )
}

function ManualAdjust({ memberId, members, run, actor }) {
  const [who, setWho] = useState(memberId || members?.[0]?.member.id || '')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const apply = (sign) => run(() => adjustPoints(who, sign * Math.abs(Number(amount)), reason, actor), (r) => `Movimiento registrado: ${r.points > 0 ? '+' : ''}${fmt(r.points)} puntos.`).then((r) => { if (r) { setAmount(''); setReason('') } })
  return (
    <Card>
      <p style={{ ...label, color: C.gold, marginBottom: 14 }}>Ajuste manual de puntos</p>
      {!memberId && <Sel label="Socio" value={who} onChange={(e) => setWho(e.target.value)} options={members.map(({ member }) => ({ value: member.id, label: `${member.firstName} ${member.lastName} · ${member.number}${member.demo ? ' (demo)' : ''}` }))} />}
      <Inp label="Cantidad de puntos" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ej: 150" />
      <Inp label="Motivo (obligatorio)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Cortesía por demora en el pedido" hint={`Queda registrado con tu nombre (${actor}), la fecha y el motivo.`} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Btn onClick={() => apply(1)}>Acreditar</Btn>
        <Btn variant="danger" onClick={() => apply(-1)}>Descontar</Btn>
      </div>
    </Card>
  )
}

// ───────────────────────── Resumen ─────────────────────────
function Overview({ scope, tick, run, actor }) {
  const o = useMemo(() => adminOverview(scope), [scope, tick])
  const recent = useMemo(() => adminLedger(scope).slice(0, 8), [scope, tick])
  const tiles = [['Total de socios', o.members], ['Socios activos (30 días)', o.active], ['Puntos emitidos', fmt(o.issued)], ['Puntos canjeados', fmt(o.redeemed)], ['Recompensas entregadas', o.delivered], ['Canjes pendientes', o.pending], ['Nuevos registros (30 días)', o.newMembers]]
  return (
    <div style={{ display: 'grid', gap: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {tiles.map(([l, v]) => (
          <div key={l} style={{ ...box, borderTop: `2px solid ${C.gold}` }}>
            <div style={{ fontFamily: f.serif, fontSize: 34, color: C.gold, lineHeight: 1 }}>{v}</div>
            <div style={{ ...small, marginTop: 6 }}>{l}</div>
          </div>
        ))}
      </div>
      <CodeValidator run={run} actor={actor} tick={tick} />
      <div><p style={{ ...label, marginBottom: 12 }}>Últimos movimientos</p><Ledger entries={recent} /></div>
    </div>
  )
}

// ───────────────────────── Clientes ─────────────────────────
function MemberDetail({ id, back, tick, run, actor }) {
  const s = useMemo(() => summaryForMember(id), [id, tick])
  const catalog = useMemo(() => adminCatalog(), [tick])
  const [branch, setBranch] = useState('principal')
  const [mission, setMission] = useState('')
  const [pw, setPw] = useState('')
  if (!s) return <Card><p style={small}>Socio inexistente.</p><Btn variant="outline" onClick={back}>Volver</Btn></Card>
  const m = s.member
  const manual = catalog.missions.filter((x) => x.trigger === 'manual')
  const info = [['Email', m.email], ['Teléfono', m.phone], ['Número de socio', m.number], ['Registro', fmtDate(m.createdAt)], ['Última actividad', m.lastActivityAt ? dateTime(m.lastActivityAt) : '—'], ['Nacimiento', m.birthDate || '—'], ['Código de invitación', m.referralCode], ['Estado', m.status]]
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div><Btn variant="ghost" small onClick={back}><ArrowLeft size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Clientes</Btn></div>
      <Card accent>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'baseline' }}>
          <div style={{ fontFamily: f.serif, fontSize: 32, color: C.cream }}>{m.firstName} {m.lastName}{m.demo && <DemoBadge />}</div>
          <LevelBadge level={s.level} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, margin: '18px 0' }}>
          {[['Disponibles', fmt(s.balance)], ['Históricos', fmt(s.lifetime)], ['Utilizados', fmt(s.spent)]].map(([l, v]) => <div key={l}><div style={{ fontFamily: f.serif, fontSize: 30, color: C.gold }}>{v}</div><div style={small}>{l}</div></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px 20px' }}>
          {info.map(([l, v]) => <div key={l}><span style={label}>{l}</span><div style={{ fontFamily: f.sans, fontSize: 13, color: C.cream, wordBreak: 'break-word' }}>{v}</div></div>)}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <Card>
          <p style={{ ...label, color: C.gold, marginBottom: 14 }}>Registrar visita</p>
          <p style={{ ...small, marginBottom: 14 }}>El personal confirma que el socio está en el local. Suma {fmt(catalog.config.visitPoints)} puntos y se registra una vez por día y sucursal.</p>
          <Sel label="Sucursal" value={branch} onChange={(e) => setBranch(e.target.value)} options={catalog.config.branches.map((b) => ({ value: b.id, label: b.name }))} />
          <Btn onClick={() => run(() => registerVisit(id, { actor, branchId: branch, source: 'panel' }), (p) => `Visita registrada: +${fmt(p)} puntos.`)}>Registrar visita</Btn>
        </Card>
        <ManualAdjust memberId={id} run={run} actor={actor} />
        <Card>
          <p style={{ ...label, color: C.gold, marginBottom: 14 }}>Otorgar desafío</p>
          {manual.length ? (
            <>
              <Sel label="Desafío manual" value={mission || manual[0].id} onChange={(e) => setMission(e.target.value)} options={manual.map((x) => ({ value: x.id, label: `${x.name} (+${x.points})` }))} />
              <Btn onClick={() => run(() => awardMission(id, mission || manual[0].id, actor), (p) => `Desafío otorgado: +${fmt(p)} puntos.`)}>Otorgar</Btn>
            </>
          ) : <p style={small}>No hay desafíos manuales. Creá uno en la pestaña Desafíos.</p>}
        </Card>
        <Card>
          <p style={{ ...label, color: C.gold, marginBottom: 14 }}>Cuenta</p>
          <Inp label="Contraseña temporal" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mínimo 8, con letras y números" hint="Cierra las sesiones abiertas del socio." />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn variant="outline" onClick={() => run(() => resetMemberPassword(id, pw), 'Contraseña restablecida.').then((r) => r && setPw(''))}>Restablecer contraseña</Btn>
            <Btn variant={m.status === 'activo' ? 'danger' : 'outline'} onClick={() => run(() => setMemberStatus(id, m.status === 'activo' ? 'suspendido' : 'activo'), 'Estado actualizado.')}>{m.status === 'activo' ? 'Suspender' : 'Reactivar'}</Btn>
          </div>
        </Card>
      </div>

      <div><p style={{ ...label, marginBottom: 12 }}>Movimientos</p><Ledger entries={s.entries.map((e) => ({ ...e }))} showMember={false} /></div>
    </div>
  )
}

function Members({ scope, tick, run, actor }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState('')
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return adminMembers(scope).filter(({ member: m }) => !needle || [m.firstName, m.lastName, m.email, m.phone, m.number].join(' ').toLowerCase().includes(needle))
  }, [scope, tick, q])
  if (sel) return <MemberDetail id={sel} back={() => setSel('')} tick={tick} run={run} actor={actor} />
  return (
    <div>
      <Inp label="Buscar por nombre, email, teléfono o número de socio" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej: Valentina, JC-0001" />
      <p style={{ ...small, marginBottom: 14 }}>{list.length} {list.length === 1 ? 'socio' : 'socios'}</p>
      {!list.length && <Card><p style={small}>No hay socios en esta vista.</p></Card>}
      <div style={{ display: 'grid', gap: 8 }}>
        {list.map((s) => (
          <button key={s.member.id} onClick={() => setSel(s.member.id)} style={{ ...box, textAlign: 'left', cursor: 'pointer', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px 16px', alignItems: 'center' }}>
            <div><div style={{ fontFamily: f.serif, fontSize: 21, color: C.cream }}>{s.member.firstName} {s.member.lastName}{s.member.demo && <DemoBadge />}</div><div style={small}>{s.member.number} · {s.member.status}</div></div>
            <div style={{ ...small, wordBreak: 'break-word' }}>{s.member.email}<br />{s.member.phone}</div>
            <div><span style={{ fontFamily: f.serif, fontSize: 24, color: C.gold }}>{fmt(s.balance)}</span><div style={small}>{fmt(s.lifetime)} históricos</div></div>
            <div><LevelBadge level={s.level} /></div>
            <div style={small}>Registro {fmtDate(s.member.createdAt)}<br />Actividad {s.member.lastActivityAt ? fmtDate(s.member.lastActivityAt) : '—'}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ───────────────────────── Puntos ─────────────────────────
function PointsTab({ scope, tick, run, actor }) {
  const [q, setQ] = useState('')
  const members = useMemo(() => adminMembers(scope), [scope, tick])
  const entries = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return adminLedger(scope).filter((e) => !needle || `${e.memberName} ${e.note} ${TYPES[e.type]?.label} ${e.by}`.toLowerCase().includes(needle)).slice(0, 120)
  }, [scope, tick, q])
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {members.length ? <ManualAdjust members={members} run={run} actor={actor} key={members.length} /> : <Card><p style={small}>No hay socios en esta vista.</p></Card>}
      <div>
        <Inp label="Buscar movimientos" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, motivo, tipo o administrador" />
        <Ledger entries={entries} />
      </div>
    </div>
  )
}

// ───────────────────────── Recompensas y desafíos ─────────────────────────
function RewardRow({ reward, run, isNew }) {
  const [d, setD] = useState(reward)
  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }))
  return (
    <div style={{ ...box, display: 'grid', gridTemplateColumns: 'minmax(0, 120px) minmax(0, 1fr)', gap: 18, opacity: d.enabled ? 1 : 0.6 }}>
      <div>{d.image ? <img src={d.image} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', border: `1px solid ${C.border}` }} onError={(e) => { e.target.style.visibility = 'hidden' }} /> : <div style={{ aspectRatio: '4/3', border: `1px dashed ${C.border}` }} />}</div>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
          <Inp label="Nombre" value={d.name} onChange={set('name')} />
          <Inp label="Puntos necesarios" type="number" value={d.points} onChange={set('points')} />
        </div>
        <Txt label="Descripción" value={d.description} onChange={set('description')} rows={2} />
        <Inp label="Imagen (ruta o URL)" value={d.image} onChange={set('image')} mono placeholder="/img/gyoza.webp" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Switch on={d.enabled} onClick={() => setD((x) => ({ ...x, enabled: !x.enabled }))} yes="Disponible" no="No disponible" />
          <Btn small onClick={() => run(() => saveReward(d), 'Recompensa guardada.').then((r) => r && isNew && setD(reward))}><Save size={13} style={{ verticalAlign: -2, marginRight: 6 }} />{isNew ? 'Crear' : 'Guardar'}</Btn>
          {!isNew && <Btn small variant="ghost" onClick={() => { if (confirm('¿Eliminar esta recompensa? Los canjes ya hechos se conservan.')) run(() => deleteReward(d.id), 'Recompensa eliminada.') }}>Eliminar</Btn>}
        </div>
      </div>
    </div>
  )
}

function Rewards({ tick, run }) {
  const { rewards } = useMemo(() => adminCatalog(), [tick])
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {rewards.map((r) => <RewardRow key={`${r.id}-${tick}`} reward={r} run={run} />)}
      <Divider label="Nueva recompensa" />
      <RewardRow key={`new-${tick}`} isNew reward={{ name: '', description: '', points: 1000, image: '', enabled: true }} run={run} />
    </div>
  )
}

const TRIGGER_LABEL = { register: 'Automático · al registrarse', first_order: 'Automático · primer pedido entregado', every_n_orders: 'Automático · cada N pedidos entregados', orders_total: 'Automático · al llegar a N pedidos', birthday: 'Mes de cumpleaños · el socio lo reclama', referral: 'Automático · primera compra del invitado', manual: 'Manual · lo valida el personal' }

function MissionRow({ mission, run, isNew }) {
  const [d, setD] = useState(mission)
  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }))
  const counted = ['every_n_orders', 'orders_total'].includes(d.trigger)
  return (
    <div style={{ ...box, opacity: d.enabled ? 1 : 0.6 }}>
      <p style={{ ...label, color: C.gold, marginBottom: 12 }}>{isNew ? 'Nuevo desafío manual' : TRIGGER_LABEL[d.trigger]}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
        <Inp label="Nombre" value={d.name} onChange={set('name')} />
        <Inp label="Puntos que otorga" type="number" value={d.points} onChange={set('points')} />
        {counted && <Inp label="Meta (cantidad de pedidos)" type="number" value={d.target} onChange={set('target')} />}
      </div>
      <Txt label="Descripción" value={d.description} onChange={set('description')} rows={2} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Switch on={d.enabled} onClick={() => setD((x) => ({ ...x, enabled: !x.enabled }))} yes="Activa" no="Desactivada" />
        <Btn small onClick={() => run(() => saveMission(d), 'Desafío guardado.').then((r) => r && isNew && setD(mission))}><Save size={13} style={{ verticalAlign: -2, marginRight: 6 }} />{isNew ? 'Crear' : 'Guardar'}</Btn>
        {!isNew && !d.system && <Btn small variant="ghost" onClick={() => { if (confirm('¿Eliminar este desafío?')) run(() => deleteMission(d.id), 'Desafío eliminado.') }}>Eliminar</Btn>}
      </div>
    </div>
  )
}

function Missions({ tick, run }) {
  const { missions } = useMemo(() => adminCatalog(), [tick])
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {missions.map((m) => <MissionRow key={`${m.id}-${tick}`} mission={m} run={run} />)}
      <Divider label="Nuevo desafío" />
      <MissionRow key={`new-${tick}`} isNew mission={{ name: '', description: '', points: 100, target: 1, enabled: true, trigger: 'manual', system: false }} run={run} />
    </div>
  )
}

// ───────────────────────── Canjes ─────────────────────────
function Redemptions({ scope, tick, run, actor }) {
  const [state, setState] = useState('pendiente')
  const list = useMemo(() => adminRedemptions(scope).filter((r) => state === 'todos' || r.status === state), [scope, tick, state])
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <CodeValidator run={run} actor={actor} tick={tick} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[['pendiente', 'Pendientes'], ['utilizado', 'Utilizados'], ['cancelado', 'Cancelados'], ['todos', 'Todos']].map(([k, l]) => <Chip key={k} on={state === k} onClick={() => setState(k)}>{l}</Chip>)}
      </div>
      {!list.length && <Card><p style={small}>No hay canjes en esta vista.</p></Card>}
      <div style={{ display: 'grid', gap: 8 }}>
        {list.map((r) => (
          <div key={r.id} data-redemption={r.code} style={{ ...box, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px 16px', alignItems: 'center' }}>
            <div><div style={{ fontFamily: f.serif, fontSize: 21, color: C.cream }}>{r.rewardName}</div><div style={small}>{r.memberName}{r.demo && <DemoBadge />} · {r.memberNumber}</div></div>
            <div><span style={{ fontFamily: 'monospace', fontSize: 15, color: C.gold, letterSpacing: '0.08em' }}>{r.code}</span><div style={small}>{fmt(r.points)} pts · {dateTime(r.createdAt)}</div></div>
            <div style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: r.status === 'pendiente' ? C.gold : r.status === 'utilizado' ? '#4ade80' : '#ef4444' }}>{r.status}{r.usedAt ? ` · ${fmtDate(r.usedAt)}` : ''}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {r.status === 'pendiente' && <Btn small onClick={() => run(() => validateRedemption(r.code, actor), 'Código validado.')}>Marcar utilizado</Btn>}
              {r.status === 'pendiente' && <Btn small variant="danger" onClick={() => { if (confirm('¿Cancelar este canje y reintegrar los puntos al socio?')) run(() => adminCancelRedemption(r.id, 'Cancelado por el local', actor), 'Canje cancelado: puntos reintegrados.') }}>Cancelar</Btn>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ───────────────────────── Configuración ─────────────────────────
function Config({ tick, run }) {
  const catalog = useMemo(() => adminCatalog(), [tick])
  const c = catalog.config
  const [d, setD] = useState({ blockAmount: c.blockAmount, pointsPerBlock: c.pointsPerBlock, visitPoints: c.visitPoints, referralPoints: c.referralPoints, googleReviewUrl: c.googleReviewUrl })
  const [levels, setLevels] = useState(() => c.levels.map((l) => ({ ...l })))
  const [branches, setBranches] = useState(() => c.branches.map((b) => ({ ...b })))
  const bonusIds = ['register', 'first_order', 'every_n_orders', 'orders_total', 'birthday']
  const [bonus, setBonus] = useState(() => Object.fromEntries(catalog.missions.filter((m) => bonusIds.includes(m.trigger)).map((m) => [m.id, { points: m.points, target: m.target }])))
  const [nfcBranch, setNfcBranch] = useState(c.branches[0]?.id ?? 'principal')
  const [mesa, setMesa] = useState('')
  const [copied, setCopied] = useState('')
  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }))
  const origin = window.location.origin
  const nfcUrl = `${origin}/club?suc=${nfcBranch}${mesa ? `&mesa=${encodeURIComponent(mesa)}` : ''}`
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 1500) } catch { /* sin portapapeles */ } }
  const saveBonus = async () => {
    for (const m of catalog.missions.filter((x) => bonus[x.id])) {
      const b = bonus[m.id]
      if (Number(b.points) !== m.points || Number(b.target) !== m.target) await run(() => saveMission({ ...m, points: Number(b.points), target: Number(b.target) }), 'Bonificaciones guardadas.')
    }
  }
  const links = [['Entrada del club (NFC)', '/club'], ['Registro', '/club/registro'], ['Ingreso', '/club/login'], ['Mi cuenta', '/club/mi-cuenta'], ['Recompensas', '/club/recompensas'], ['Desafíos', '/club/misiones']]

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <Card>
        <p style={{ ...label, color: C.gold, marginBottom: 14 }}>Acumulación</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
          <Inp label="Cada $ (monto de compra)" type="number" value={d.blockAmount} onChange={set('blockAmount')} hint="Ej: 1000" />
          <Inp label="Suma puntos" type="number" value={d.pointsPerBlock} onChange={set('pointsPerBlock')} hint="Ej: 10. Sólo bloques completos." />
          <Inp label="Puntos por visita" type="number" value={d.visitPoints} onChange={set('visitPoints')} />
          <Inp label="Puntos por referido" type="number" value={d.referralPoints} onChange={set('referralPoints')} />
        </div>
        <Inp label="Enlace de Google para reseñas (opcional)" value={d.googleReviewUrl} onChange={set('googleReviewUrl')} mono placeholder="https://g.page/..." hint="Es una invitación a opinar: no suma ni condiciona puntos." />
        <Btn onClick={() => run(() => updateConfig(d), 'Configuración guardada. Los puntos ya acreditados no se modifican.')}><Save size={14} style={{ verticalAlign: -2, marginRight: 8 }} />Guardar acumulación</Btn>
      </Card>

      <Card>
        <p style={{ ...label, color: C.gold, marginBottom: 14 }}>Bienvenida y bonificaciones</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 16px' }}>
          {catalog.missions.filter((m) => bonus[m.id]).map((m) => (
            <div key={m.id}>
              <Inp label={`${m.name} (puntos)`} type="number" value={bonus[m.id].points} onChange={(e) => setBonus((b) => ({ ...b, [m.id]: { ...b[m.id], points: e.target.value } }))} />
              {['every_n_orders', 'orders_total'].includes(m.trigger) && <Inp label="Cantidad de pedidos" type="number" value={bonus[m.id].target} onChange={(e) => setBonus((b) => ({ ...b, [m.id]: { ...b[m.id], target: e.target.value } }))} />}
            </div>
          ))}
        </div>
        <Btn onClick={saveBonus}><Save size={14} style={{ verticalAlign: -2, marginRight: 8 }} />Guardar bonificaciones</Btn>
        <p style={{ ...small, marginTop: 10 }}>Los puntos por vencimiento no están implementados: los puntos no vencen.</p>
      </Card>

      <Card>
        <p style={{ ...label, color: C.gold, marginBottom: 14 }}>Niveles</p>
        <div style={{ display: 'grid', gap: 14 }}>
          {levels.map((l, i) => (
            <div key={l.id} style={{ ...box, background: C.input }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 16px' }}>
                <Inp label={`Nivel ${i + 1} · nombre`} value={l.name} onChange={(e) => setLevels((x) => x.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} />
                <Inp label="Puntos históricos desde" type="number" value={l.min} onChange={(e) => setLevels((x) => x.map((y, j) => (j === i ? { ...y, min: e.target.value } : y)))} />
              </div>
              <Inp label="Descripción" value={l.description} onChange={(e) => setLevels((x) => x.map((y, j) => (j === i ? { ...y, description: e.target.value } : y)))} />
              <Txt label="Beneficios (uno por línea)" rows={3} value={l.perks.join('\n')} onChange={(e) => setLevels((x) => x.map((y, j) => (j === i ? { ...y, perks: e.target.value.split('\n') } : y)))} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}><Btn onClick={() => run(() => updateConfig({ levels: levels.map((l) => ({ ...l, perks: l.perks.map((p) => p.trim()).filter(Boolean) })) }), 'Niveles guardados.')}><Save size={14} style={{ verticalAlign: -2, marginRight: 8 }} />Guardar niveles</Btn></div>
        <p style={{ ...small, marginTop: 10 }}>El nivel se calcula con los puntos históricos: gastar puntos no hace perder un nivel.</p>
      </Card>

      <Card>
        <p style={{ ...label, color: C.gold, marginBottom: 14 }}>Sucursales</p>
        {branches.map((b, i) => (
          <div key={b.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'end' }}>
            <Inp label={`Identificador: ${b.id}`} value={b.name} onChange={(e) => setBranches((x) => x.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} />
            {branches.length > 1 && <div style={{ marginBottom: 18 }}><Btn small variant="ghost" onClick={() => setBranches((x) => x.filter((_, j) => j !== i))}>Quitar</Btn></div>}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn variant="dashed" onClick={() => setBranches((x) => [...x, { id: `sucursal-${x.length + 1}`, name: `Sucursal ${x.length + 1}` }])}>+ Agregar sucursal</Btn>
          <Btn onClick={() => run(() => updateConfig({ branches }), 'Sucursales guardadas.')}>Guardar sucursales</Btn>
        </div>
      </Card>

      <Card>
        <p style={{ ...label, color: C.gold, marginBottom: 14 }}>Enlaces para NFC y QR</p>
        <p style={{ ...small, marginBottom: 14 }}>Abrir el enlace nunca suma puntos: sirve de puerta de entrada. Las visitas las confirma el personal desde el perfil del socio. Podés grabar enlaces distintos por sucursal o por mesa.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
          <Sel label="Sucursal" value={nfcBranch} onChange={(e) => setNfcBranch(e.target.value)} options={c.branches.map((b) => ({ value: b.id, label: b.name }))} />
          <Inp label="Mesa (opcional)" value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Ej: 5" />
        </div>
        {[['Enlace para grabar en el NFC', nfcUrl], ...links.map(([l, p]) => [l, origin + p])].map(([l, url]) => (
          <div key={l} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
            <div><span style={label}>{l}</span><div style={{ fontFamily: 'monospace', fontSize: 12, color: C.cream, wordBreak: 'break-all' }}>{url}</div></div>
            <Btn small variant="outline" onClick={() => copy(url)}>{copied === url ? <Check size={13} /> : <Copy size={13} />}</Btn>
          </div>
        ))}
      </Card>

      <Card>
        <p style={{ ...label, color: C.gold, marginBottom: 12 }}>Datos de demostración</p>
        <p style={{ ...small, marginBottom: 14 }}>Los socios de ejemplo están marcados como DEMO y se pueden ocultar con el filtro de arriba. Eliminarlos no toca a los socios reales.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn variant="danger" onClick={() => { if (confirm('¿Eliminar los socios, movimientos y canjes de demostración?')) run(() => deleteDemoData(), (n) => `Se eliminaron ${n} socios demo.`) }}>Eliminar datos demo</Btn>
          <Btn variant="outline" onClick={() => run(() => restoreDemoData(), 'Datos demo restaurados.')}>Restaurar datos demo</Btn>
        </div>
      </Card>
    </div>
  )
}

// ───────────────────────── Sección principal ─────────────────────────
const TABS = [['resumen', 'Resumen'], ['clientes', 'Clientes'], ['puntos', 'Puntos'], ['recompensas', 'Recompensas'], ['desafios', 'Desafíos'], ['canjes', 'Canjes'], ['config', 'Configuración']]

export default function AdminClub() {
  const [tab, setTab] = useState('resumen')
  const [scope, setScope] = useState('todos')
  const [tick, setTick] = useState(0)
  const [flash, setFlash] = useState(null)
  const [actor, setActor] = useState(() => { try { return sessionStorage.getItem('joakina_admin_name') || 'Administrador' } catch { return 'Administrador' } })
  const timer = useRef(null)

  const run = useCallback(async (fn, ok) => {
    try {
      const result = await fn()
      setTick((t) => t + 1)
      setFlash({ ok: true, text: typeof ok === 'function' ? ok(result) : ok })
      return result ?? true
    } catch (e) {
      setFlash({ ok: false, text: e.message || 'No se pudo completar la acción.' })
      return undefined
    } finally {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setFlash(null), 5000)
    }
  }, [])

  const props = { scope, tick, run, actor }
  return (
    <div>
      <SectionHeader eyebrow="Fidelización" title="Joakina Club" subtitle="Socios, puntos, recompensas y canjes. Demo: los datos se guardan en este navegador y todavía no hay login de administrador." />

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 18 }}>
        <div style={{ flex: '1 1 220px' }}>
          <Inp label="Tu nombre (queda en el historial)" value={actor} onChange={(e) => { setActor(e.target.value); try { sessionStorage.setItem('joakina_admin_name', e.target.value) } catch { /* sin almacenamiento */ } }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {[['todos', 'Todos'], ['reales', 'Reales'], ['demo', 'Demo']].map(([k, l]) => <Chip key={k} on={scope === k} onClick={() => setScope(k)}>{l}</Chip>)}
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 26, overflowX: 'auto' }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: tab === k ? C.gold : C.muted, background: 'none', border: 'none', borderBottom: tab === k ? `2px solid ${C.gold}` : '2px solid transparent', padding: '13px 16px', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1, flex: 'none' }}>{l}</button>
        ))}
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div role="status" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 20, padding: '12px 16px', border: `1px solid ${flash.ok ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.5)'}`, background: flash.ok ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)', color: flash.ok ? '#86efac' : '#fca5a5', fontFamily: f.sans, fontSize: 13 }}>
            {flash.text}
          </motion.div>
        )}
      </AnimatePresence>

      {tab === 'resumen' && <Overview {...props} />}
      {tab === 'clientes' && <Members {...props} />}
      {tab === 'puntos' && <PointsTab {...props} />}
      {tab === 'recompensas' && <Rewards {...props} />}
      {tab === 'desafios' && <Missions {...props} />}
      {tab === 'canjes' && <Redemptions {...props} />}
      {tab === 'config' && <Config {...props} />}
    </div>
  )
}
