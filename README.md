# Joakina Sushi

Sitio de Joakina Sushi. Aplicación React + Vite sin backend.

```bash
npm install
npm run dev      # desarrollo
npm run build    # producción, en dist/
```

- `src/data/siteData.js`: carta, datos del local e imágenes por defecto.
- `src/context/`: datos del sitio y carrito.
- `public/img/`: fotos en dos tamaños (`nombre.webp` y `nombre-480.webp`); créditos en `creditos.txt`.
- `public/brand/`: isotipo en SVG para fondos oscuros y claros.

Pedidos y reservas se envían por WhatsApp. El panel `/admin` guarda los cambios en el
navegador donde se editan: no llegan a los demás visitantes sin una base de datos.

## Joakina Club (fidelización)

Sistema de puntos, niveles, recompensas, desafíos y canjes, integrado con los pedidos.

- **Rutas públicas:** `/club`, `/club/registro`, `/club/login`, `/club/mi-cuenta`, `/club/recompensas`, `/club/misiones`.
  `/club?suc=principal&mesa=5` sirve para el NFC: sólo muestra el contexto, **nunca suma puntos**.
- **Panel:** `/admin` → *Joakina Club* (socios, puntos, recompensas, desafíos, canjes, configuración).
- **Código:** `src/club/engine.js` (reglas puras), `src/club/store.js` (servicio con transacciones,
  idempotencia y auditoría), `src/club/seed.js` (datos demo), pantallas en `src/club/` y `src/pages/AdminClub.jsx`.
- **Puntos de pedidos:** se acreditan sólo cuando el pedido pasa a *Entregado* y tiene un socio asociado;
  si deja de estar entregado se revierten. Los pedidos sin socio no generan puntos.
- **Datos demo:** socios marcados DEMO (contraseña `demo1234`); se pueden ocultar o borrar desde *Configuración*.

> **Demo:** la persistencia es `localStorage` (una sola base por navegador) y el panel todavía no tiene login.
> Para producción hay que reemplazar `loadDb`/`writeDb` de `store.js` por una base de datos real y proteger
> las funciones de administración. La lógica y las pantallas se mantienen.
