import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'
import { instagramUrl } from '../lib/format'
import PageHero from '../components/PageHero'
import Photo from '../components/Photo'
import { InstagramIcon } from '../components/icons'

export default function Galeria() {
  const { data } = useSite()
  const [cat, setCat] = useState('Todas')
  const [index, setIndex] = useState(null)
  useTitle('Galería', 'Fotografías de los platos de Joakina Sushi.')

  const photos = useMemo(() => data.gallery.filter((p) => p.visible !== false), [data.gallery])
  const cats = useMemo(() => ['Todas', ...new Set(photos.map((p) => p.cat))], [photos])
  const shown = cat === 'Todas' ? photos : photos.filter((p) => p.cat === cat)

  useEffect(() => {
    if (index === null) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setIndex(null)
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % shown.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + shown.length) % shown.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, shown.length])

  return (
    <>
      <PageHero eyebrow="Galería" title="Sushi art" image={data.images.experience1} />
      <nav className="tabs" aria-label="Filtrar fotos">
        <div className="tabs__inner">
          {cats.map((c) => <button key={c} className={cat === c ? 'is-on' : ''} onClick={() => { setCat(c); setIndex(null) }}>{c}</button>)}
        </div>
      </nav>
      <section className="section">
        <div className="wrap gallery">
          {shown.map((photo, i) => (
            <button key={photo.id} className={`gallery__item gallery__item--${(i % 6) + 1}`} onClick={() => setIndex(i)} aria-label={`Ampliar ${photo.title}`}>
              <Photo src={photo.src} alt={photo.title} sizes="(max-width: 700px) 100vw, 40vw" />
              <span>{photo.title}</span>
            </button>
          ))}
        </div>
        {data.info.instagram && (
          <p className="gallery__ig">
            <a className="btn btn--line" href={instagramUrl(data.info.instagram)} target="_blank" rel="noopener noreferrer"><InstagramIcon /> Instagram</a>
          </p>
        )}
      </section>

      <AnimatePresence>
        {index !== null && shown[index] && (
          <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label={shown[index].title}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIndex(null)}>
            <button className="icon-btn lightbox__close" aria-label="Cerrar"><X size={26} strokeWidth={1.2} /></button>
            <button className="icon-btn lightbox__prev" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); setIndex((index - 1 + shown.length) % shown.length) }}><ChevronLeft size={30} strokeWidth={1} /></button>
            <motion.img key={shown[index].id} src={shown[index].src} alt={shown[index].title} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} />
            <button className="icon-btn lightbox__next" aria-label="Siguiente" onClick={(e) => { e.stopPropagation(); setIndex((index + 1) % shown.length) }}><ChevronRight size={30} strokeWidth={1} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
