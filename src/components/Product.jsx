import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Photo from './Photo'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../lib/format'

function useAddToCart(product) {
  const { add } = useCart()
  const [option, setOption] = useState(product.options?.[0] ?? '')
  const [added, setAdded] = useState(false)
  const submit = () => {
    add(product, option)
    setAdded(true)
    setTimeout(() => setAdded(false), 1100)
  }
  return { option, setOption, added, submit }
}

function Options({ product, option, setOption }) {
  if (!product.options?.length) return null
  return (
    <div className="options" role="radiogroup" aria-label={`Opción de ${product.name}`}>
      {product.options.map((value) => (
        <button key={value} type="button" role="radio" aria-checked={option === value}
          className={option === value ? 'is-on' : ''} onClick={() => setOption(value)}>
          {value}
        </button>
      ))}
    </div>
  )
}

function AddLabel({ added, label = 'Agregar' }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={added ? 'ok' : 'add'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
        {added ? <Check size={15} strokeWidth={1.6} /> : <Plus size={15} strokeWidth={1.6} />}
        {added ? 'Agregado' : label}
      </motion.span>
    </AnimatePresence>
  )
}

/** Tarjeta vertical: destacados de la home. */
export function ProductCard({ product, category }) {
  const { option, setOption, added, submit } = useAddToCart(product)
  return (
    <article className="pcard">
      <div className="pcard__media">
        <Photo src={product.image} alt={product.name} sizes="(max-width: 700px) 78vw, 30vw" />
        <span className="tag">{category}</span>
      </div>
      <div className="pcard__body">
        <h3>{product.name}</h3>
        {product.units && <p className="units">{product.units}</p>}
        <p className="desc">{product.description}</p>
        <Options product={product} option={option} setOption={setOption} />
        <div className="pcard__foot">
          <span className="price">{formatPrice(product.price)}</span>
          <button className={`add ${added ? 'is-added' : ''}`} onClick={submit} aria-label={`Agregar ${product.name} al pedido`}>
            <AddLabel added={added} />
          </button>
        </div>
      </div>
    </article>
  )
}

/** Fila horizontal: carta y pedido online, pensada para recorrer con el pulgar. */
export function ProductRow({ product, category }) {
  const { option, setOption, added, submit } = useAddToCart(product)
  return (
    <article className="prow">
      <Photo className="prow__media" src={product.image} alt={product.name} sizes="(max-width: 700px) 112px, 180px" />
      <div className="prow__body">
        <div className="prow__head">
          <h3>{product.name}</h3>
          <span className="price">{formatPrice(product.price)}</span>
        </div>
        {(product.units || category) && <p className="units">{[category, product.units].filter(Boolean).join(' · ')}</p>}
        {product.description && <p className="desc">{product.description}</p>}
        <Options product={product} option={option} setOption={setOption} />
        <button className={`add ${added ? 'is-added' : ''}`} onClick={submit} aria-label={`Agregar ${product.name} al pedido`}>
          <AddLabel added={added} />
        </button>
      </div>
    </article>
  )
}

/** Pieza grande: combinados, con la bandeja como protagonista. */
export function ComboFeature({ product, index }) {
  const { added, submit } = useAddToCart(product)
  return (
    <article className={`combo ${index % 2 ? 'combo--flip' : ''}`}>
      <div className="combo__media">
        <Photo src={product.image} alt={`Combinado ${product.name}, ${product.units}`} sizes="(max-width: 800px) 100vw, 58vw" />
      </div>
      <div className="combo__body">
        <span className="combo__num">{String(index + 1).padStart(2, '0')}</span>
        <h3>{product.name}</h3>
        <p className="units">{product.units}</p>
        <p className="desc">{product.description}</p>
        <div className="combo__foot">
          <span className="price price--lg">{formatPrice(product.price)}</span>
          <button className={`add ${added ? 'is-added' : ''}`} onClick={submit} aria-label={`Agregar combinado ${product.name} de ${product.units} al pedido`}>
            <AddLabel added={added} />
          </button>
        </div>
      </div>
    </article>
  )
}
