/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import { DEFAULT_DATA } from '../data/siteData'

export { DEFAULT_DATA }

const SiteContext = createContext(null)
// Clave nueva: los datos guardados del sitio anterior no se mezclan con la carta de Joakina.
const KEY = 'joakina_data'

function load() {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null } catch { return null }
}

function deepMerge(base, over) {
  const r = { ...base }
  for (const k of Object.keys(over)) {
    if (over[k] !== null && typeof over[k] === 'object' && !Array.isArray(over[k])) {
      r[k] = deepMerge(base[k] || {}, over[k])
    } else {
      r[k] = over[k]
    }
  }
  return r
}

export function SiteProvider({ children }) {
  const [data, setData] = useState(() => {
    const saved = load()
    return saved ? deepMerge(DEFAULT_DATA, saved) : DEFAULT_DATA
  })
  const [toastVisible, setToastVisible] = useState(false)

  const persist = useCallback((next) => {
    setData(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* almacenamiento no disponible */ }
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2400)
  }, [])

  const updateInfo    = useCallback((info)    => persist({ ...data, info }),    [data, persist])
  const updateImages  = useCallback((images)  => persist({ ...data, images }),  [data, persist])
  const updateMenu    = useCallback((menu)    => persist({ ...data, menu }),    [data, persist])
  const updateGallery = useCallback((gallery) => persist({ ...data, gallery }), [data, persist])
  const updatePromos  = useCallback((promos)  => persist({ ...data, promos }),  [data, persist])
  const updateService = useCallback((service) => persist({ ...data, service }), [data, persist])
  const resetAll      = useCallback(() => {
    try { localStorage.removeItem(KEY) } catch { /* almacenamiento no disponible */ }
    setData(DEFAULT_DATA)
  }, [])

  const save = { updateInfo, updateImages, updateMenu, updateGallery, updatePromos, updateService, resetAll }

  return (
    <SiteContext.Provider value={{ data, ...save, toastVisible }}>
      {children}
    </SiteContext.Provider>
  )
}

export function useSite() {
  return useContext(SiteContext)
}
