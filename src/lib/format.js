export const formatPrice = (value) => `$${Number(value || 0).toLocaleString('es-AR')}`

export const whatsappUrl = (number, text) =>
  `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export const instagramUrl = (handle) => `https://instagram.com/${handle}`

export const splitList = (value) =>
  (Array.isArray(value) ? value : String(value || '').split(','))
    .map((entry) => entry.trim())
    .filter(Boolean)

/** Las imágenes propias de /img/ tienen una versión de 480px para celulares. */
export const imageSrcSet = (src) =>
  src?.startsWith('/img/') ? `${src.replace('.webp', '-480.webp')} 480w, ${src} 1200w` : undefined
