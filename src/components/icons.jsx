// Lucide ya no incluye marcas: estos dos iconos siguen su mismo trazo fino.
const base = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round',
  strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true,
}

export const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} {...base}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5h.01" />
  </svg>
)

export const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} {...base}>
    <path d="M3.5 20.5l1.3-4.7a8.5 8.5 0 1 1 3.4 3.4z" />
    <path d="M9 8.5c-.6.6-.8 1.500-.3 2.700a7 7 0 0 0 4.100 4.100c1.200.5 2.100.3 2.700-.3l.5-.9-2-1.200-.9.8a4.500 4.500 0 0 1-2.300-2.300l.8-.9-1.200-2z" />
  </svg>
)
