import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { MotionConfig, motion } from 'framer-motion'
import { SiteProvider } from './context/SiteContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Cart from './components/Cart'
import Preloader from './components/Preloader'
import Home from './pages/Home'

const Nosotros = lazy(() => import('./pages/Nosotros'))
const Menu = lazy(() => import('./pages/Menu'))
const Galeria = lazy(() => import('./pages/Galeria'))
const Contacto = lazy(() => import('./pages/Contacto'))
const Admin = lazy(() => import('./pages/Admin'))
const TakeAway = lazy(() => import('./pages/TakeAway'))
const Checkout = lazy(() => import('./pages/Checkout'))

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => { if (!hash) window.scrollTo(0, 0) }, [pathname, hash])
  return null
}

function PublicLayout() {
  const { pathname } = useLocation()
  return (
    <>
      <ScrollToTop />
      <Preloader />
      <Navbar />
      <motion.main key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
        <Suspense fallback={<div className="route-loading" />}>
          <Routes>
            <Route path="/"              element={<Home />} />
            <Route path="/nosotros"      element={<Nosotros />} />
            <Route path="/nuestra-selva" element={<Navigate to="/nosotros" replace />} />
            <Route path="/menu"          element={<Menu />} />
            <Route path="/galeria"       element={<Galeria />} />
            <Route path="/contacto"      element={<Contacto />} />
            <Route path="/takeaway"      element={<TakeAway />} />
            <Route path="/checkout"      element={<Checkout />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.main>
      <Footer />
      <Cart />
    </>
  )
}

function AppRoutes() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  if (isAdmin) {
    return (
      <Suspense fallback={<div className="route-loading" />}>
        <Routes><Route path="/admin" element={<Admin />} /></Routes>
      </Suspense>
    )
  }
  return <PublicLayout />
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SiteProvider>
        <CartProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </SiteProvider>
    </MotionConfig>
  )
}
