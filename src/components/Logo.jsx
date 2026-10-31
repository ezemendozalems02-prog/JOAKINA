/**
 * Isotipo: el corte de un maki visto de frente. El anillo es la nori, abierta
 * donde cae un grano de arroz, y dentro una J trazada como una pincelada.
 * Usa currentColor, así funciona sobre fondos negros y blancos.
 */
export function Isotype({ size = 40, accent = 'var(--gold)', className, animated = false }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="Joakina Sushi">
      <path className={animated ? 'iso-ring' : undefined} pathLength="1" d="M50 10.6A28 28 0 1 0 58.3 22.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path className={animated ? 'iso-j' : undefined} fill="currentColor" d="M32.4 13.5 40 13c-.9 1-1.2 2.2-1.3 4l-.5 23c-.2 9-7.2 13-13.7 11-3.5-1-5.5-4-4.7-6.5 2.2 3 5.2 4 8.2 3.5 4-.6 6-4 5.9-9l.9-22c0-1.8-.9-3-2.4-3.5Z" />
      <circle className={animated ? 'iso-dot' : undefined} cx="54.9" cy="15.9" r="2.1" fill={accent} />
    </svg>
  )
}

export default function Logo({ size = 34, tagline = 'Sushi Art' }) {
  return (
    <span className="logo">
      <Isotype size={size} />
      <span className="logo__text">
        <span className="logo__name">JOAKINA</span>
        <span className="logo__tag">{tagline}</span>
      </span>
    </span>
  )
}
