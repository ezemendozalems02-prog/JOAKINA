import { Clock, MapPin, Phone } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'
import { whatsappUrl } from '../lib/format'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import BookingDemo from '../components/BookingDemo'
import { WhatsAppIcon } from '../components/icons'

export default function Contacto() {
  const { data: { info, images } } = useSite()
  useTitle('Reservas', 'Reservá tu mesa en Joakina Sushi: elegí día, horario y mesa. Horarios, dirección y contacto.')

  return (
    <>
      <PageHero eyebrow="Reservas" title="Tu próxima experiencia comienza acá." image={images.reservas} />

      <section className="section">
        <div className="wrap booking">
          <div className="booking__form">
            <h2>Reservar mesa</h2>
            <p className="lead">Elegí cuántos son, el día y la mesa que más te guste.</p>
            <BookingDemo />
          </div>

          <Reveal delay={0.1} className="booking__info">
            <ul className="info-list">
              <li><Clock size={19} strokeWidth={1.2} /><div>{info.hours.map((h) => <p key={h.day}>{h.day} <b>{h.time}</b></p>)}</div></li>
              <li><MapPin size={19} strokeWidth={1.2} /><a href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{info.address}</a></li>
              <li><Phone size={19} strokeWidth={1.2} /><a href={`tel:+${info.whatsapp}`}>{info.phone}</a></li>
              <li><WhatsAppIcon size={19} /><a href={whatsappUrl(info.whatsapp)} target="_blank" rel="noopener noreferrer">Escribinos por WhatsApp</a></li>
            </ul>
            <iframe className="map" title="Ubicación de Joakina Sushi" loading="lazy"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(info.address)}&output=embed`} />
          </Reveal>
        </div>
      </section>
    </>
  )
}
