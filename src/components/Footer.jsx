import { Link } from 'react-router-dom'
import { Clock, MapPin, Phone } from 'lucide-react'
import { Isotype } from './Logo'
import { InstagramIcon, WhatsAppIcon } from './icons'
import { useSite } from '../context/SiteContext'
import { instagramUrl, whatsappUrl } from '../lib/format'

export default function Footer() {
  const { data: { info } } = useSite()
  return (
    <footer className="footer">
      <div className="wrap footer__top">
        <div className="footer__brand">
          <Isotype size={64} />
          <p className="footer__name">JOAKINA</p>
          <p className="eyebrow">Sushi Art</p>
        </div>

        <nav className="footer__col" aria-label="Pie de página">
          <h2 className="eyebrow">Navegación</h2>
          <Link to="/menu">Carta</Link>
          <Link to="/takeaway">Pedidos</Link>
          <Link to="/takeaway?modo=delivery">Delivery</Link>
          <Link to="/contacto">Reservas</Link>
        </nav>

        <div className="footer__col">
          <h2 className="eyebrow">Horarios</h2>
          {info.hours.map((h) => (
            <p className="footer__line" key={h.day}><Clock size={15} strokeWidth={1.3} /><span>{h.day}<br /><b>{h.time}</b></span></p>
          ))}
        </div>

        <div className="footer__col">
          <h2 className="eyebrow">Contacto</h2>
          <a className="footer__line" href={info.mapsUrl} target="_blank" rel="noopener noreferrer"><MapPin size={15} strokeWidth={1.3} /><span>{info.address}</span></a>
          <a className="footer__line" href={`tel:+${info.whatsapp}`}><Phone size={15} strokeWidth={1.3} /><span>{info.phone}</span></a>
          <a className="footer__line" href={whatsappUrl(info.whatsapp)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={15} /><span>WhatsApp</span></a>
          {info.instagram && (
            <a className="footer__line" href={instagramUrl(info.instagram)} target="_blank" rel="noopener noreferrer"><InstagramIcon size={15} /><span>Instagram</span></a>
          )}
        </div>
      </div>
      <div className="wrap footer__bottom">
        <p>© {new Date().getFullYear()} Joakina Sushi</p>
        <p><a href="/img/creditos.txt" target="_blank" rel="noopener noreferrer">Créditos de fotos</a></p>
      </div>
    </footer>
  )
}
