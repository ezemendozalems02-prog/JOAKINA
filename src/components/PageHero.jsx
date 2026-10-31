import { motion } from 'framer-motion'
import Photo from './Photo'

/** Portada de páginas interiores. El h1 es el único por página. */
export default function PageHero({ eyebrow, title, text, image }) {
  return (
    <section className="page-hero">
      {image && <Photo className="page-hero__img" src={image} priority />}
      <div className="page-hero__shade" />
      <div className="wrap page-hero__inner">
        <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>{eyebrow}</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>{title}</motion.h1>
        {text && <motion.p className="lead" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>{text}</motion.p>}
      </div>
    </section>
  )
}
