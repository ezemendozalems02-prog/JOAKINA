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
