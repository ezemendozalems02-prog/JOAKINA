export const formatPrice = (value) => `$${Number(value || 0).toLocaleString('es-AR')}`

export const whatsappUrl = (number, text) =>
  `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export const instagramUrl = (handle) => `https://instagram.com/${handle}`

export const splitList = (value) =>
  (Array.isArray(value) ? value : String(value || '').split(','))
    .map((entry) => entry.trim())
    .filter(Boolean)

/** Las fotos de /img/ tienen versiones de 480px (y 900px las anchas) para celulares. */
const WIDE = ['/img/hero.webp', '/img/reservas.webp']
export const imageSrcSet = (src) => {
  if (!src?.startsWith('/img/')) return undefined
  const small = `${src.replace('.webp', '-480.webp')} 480w`
  if (WIDE.includes(src)) return `${small}, ${src.replace('.webp', '-900.webp')} 900w, ${src} 2000w`
  return `${small}, ${src} 1200w`
}
