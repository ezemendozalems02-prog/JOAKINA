const PROTEIN_OPTIONS = ['Pollo', 'Lomo', 'Salmón', 'Langostinos']

const item = (id, name, description, price, image, extra = {}) => ({
  id, name, description, price, image, badge: '', visible: true, ...extra,
})

export const DEFAULT_DATA = {
  info: {
    name: 'JOAKINA SUSHI',
    tagline: 'Sushi Art · Japanese Experience',
    address: 'Thames 1786, Palermo, CABA',
    phone: '11 4444-5678',
    whatsapp: '541144445678',
    instagram: '',
    facebook: '',
    hours: [
      { day: 'Martes a Domingo', time: '09:00 — 00:00' },
      { day: 'Lunes', time: 'Cerrado' },
    ],
    mapsUrl: 'https://maps.google.com/?q=Thames+1786+Palermo+Buenos+Aires',
    payments: 'Efectivo, Transferencia',
    reservationTimes: '09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00, 21:00, 22:00',
  },

  images: {
    hero: '/img/hero.webp',
    experience1: '/img/exp-sushi.webp',
    experience2: '/img/exp-combinados.webp',
    experience3: '/img/exp-cocina.webp',
    combinados: '/img/combinados-feature.webp',
    reservas: '/img/reservas.webp',
    nosotros: '/img/nosotros.webp',
  },

  promos: [],

  menu: {
    combinados: {
      label: 'Combinados',
      intro: 'Son a elección del sushi man, con opciones de nuestros rolls especiales y rebozados.',
      items: [
        item('co1', 'Omakase', '16 especiales y 8 rebozadas.', '73500', '/img/combo-omakase.webp', { units: '24 unidades' }),
        item('co2', 'Especial', '16 especiales y 4 rebozadas.', '61500', '/img/combo-especial-20.webp', { units: '20 unidades' }),
        item('co3', 'Especial', '8 especiales y 4 rebozadas.', '40000', '/img/combo-especial-12.webp', { units: '12 unidades' }),
        item('co4', 'Omakase Premium', '8 piezas especiales, 8 rebozadas y 10 ebifuray (langostinos apanados).', '79000', '/img/combo-premium.webp', { units: '26 unidades', featured: true }),
        item('co5', 'Tradicional de Salmón', 'New York, Philadelphia, Sake Maki, Phila Maki y Niguiris.', '68000', '/img/combo-salmon.webp', { units: '20 unidades', featured: true }),
        item('co6', 'Vegetariano', '8 makis, 8 uramakis y 4 rebozadas.', '49500', '/img/combo-vegetariano.webp', { units: '20 unidades' }),
        item('co7', 'Joakina', '16 especiales, 10 uramakis y 4 rebozadas.', '79500', '/img/combo-joakina.webp', { units: '30 unidades', featured: true }),
        item('co8', 'Hot', '20 unidades rebozadas.', '56500', '/img/combo-hot.webp', { units: '20 unidades' }),
      ],
    },
    entradas: {
      label: 'Entradas',
      items: [
        item('en1', 'Yakitori', 'Pinchos de pollo rebozados con salsa Tomkatsu.', '21000', '/img/yakitori.webp', { units: '4 unidades' }),
        item('en2', 'Ebi Yakitori', 'Pinchos de langostinos grillados con salsa Teriyaki, acompañados con timbal de arroz.', '26000', '/img/ebi-yakitori.webp', { units: '8 unidades' }),
        item('en3', 'Gyoza', 'Empanaditas de cerdo al vapor selladas en plancha.', '21000', '/img/gyoza.webp', { units: '6 unidades', featured: true }),
        item('en4', 'Harumaki', 'Arrolladitos de carne o vegetales.', '18000', '/img/harumaki.webp', { units: '4 unidades', options: ['Carne', 'Vegetales'] }),
        item('en5', 'Tempura', 'Salmón y langostinos.', '26000', '/img/tempura.webp', { units: '10 unidades' }),
        item('en6', 'Ebi Furai', 'Langostinos apanados en su salsa.', '26000', '/img/ebi-furai.webp', { units: '5 unidades', featured: true }),
        item('en7', 'Satsu', 'Láminas de batatas fritas con salmón fresco acevichado.', '26000', '/img/satsu.webp', { units: '4 unidades' }),
        item('en8', 'Bakudan Ebii', 'Langostinos apanados, queso Philadelphia envuelto con lonjas de salmón fresco, coronado con salsa teriyaki y sésamo tostado.', '28000', '/img/bakudan.webp', { units: '5 unidades' }),
        item('en9', 'Rabas', 'Tiempo aproximado de preparación: 25 minutos.', '26000', '/img/rabas.webp'),
      ],
    },
    principales: {
      label: 'Platos principales',
      items: [
        item('pr1', 'Teriyaki', 'Salmón a la plancha con salsa teriyaki y gohan (arroz blanco).', '38000', '/img/teriyaki.webp', { featured: true }),
        item('pr2', 'Wok', 'Salteado de verduras al wok.', '28000', '/img/wok.webp', { options: PROTEIN_OPTIONS }),
        item('pr3', 'Yakimeshi', 'Arroz salteado con huevo y vegetales grillados.', '28000', '/img/yakimeshi.webp', { options: PROTEIN_OPTIONS }),
        item('pr4', 'Yakisoba', 'Fideos soba salteados con huevo y vegetales grillados.', '28000', '/img/yakisoba.webp', { options: PROTEIN_OPTIONS }),
      ],
    },
    adicionales: {
      label: 'Adicionales',
      items: [
        item('ad1', 'Shari', 'Arroz blanco avinagrado.', '7500', '/img/shari.webp'),
        item('ad2', 'Salsa', 'Teriyaki, agri-dulce o mostaza y miel.', '4500', '/img/salsa.webp', { options: ['Teriyaki', 'Agri-dulce', 'Mostaza y miel'] }),
        item('ad3', 'Wasabi', '', '3500', '/img/wasabi.webp'),
        item('ad4', 'Jengibre', '', '3500', '/img/jengibre.webp'),
      ],
    },
  },

  gallery: [
    { id: 'g1', src: '/img/gal-1.webp', title: 'Niguiris', cat: 'Sushi', visible: true },
    { id: 'g2', src: '/img/gal-2.webp', title: 'Rolls de salmón', cat: 'Sushi', visible: true },
    { id: 'g3', src: '/img/gal-3.webp', title: 'Bandeja para compartir', cat: 'Combinados', visible: true },
    { id: 'g4', src: '/img/gal-4.webp', title: 'Selección de sushi', cat: 'Combinados', visible: true },
    { id: 'g5', src: '/img/gal-5.webp', title: 'Rolls rebozados', cat: 'Sushi', visible: true },
    { id: 'g6', src: '/img/gal-6.webp', title: 'Salmón a la plancha', cat: 'Cocina', visible: true },
  ],
}
