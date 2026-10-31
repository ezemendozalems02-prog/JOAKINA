import { useState } from 'react'
import { imageSrcSet } from '../lib/format'

/** Foto con skeleton hasta que carga. `sizes` describe su ancho real en pantalla. */
export default function Photo({ src, alt = '', sizes = '100vw', className = '', priority = false }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <span className={`photo ${loaded ? 'is-loaded' : ''} ${className}`}>
      <img
        src={src}
        srcSet={imageSrcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        ref={(el) => { if (el?.complete) setLoaded(true) }}
      />
    </span>
  )
}
