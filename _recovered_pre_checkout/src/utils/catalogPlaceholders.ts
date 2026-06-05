/** Imagen neutra (SVG) cuando no hay foto en catálogo — sin datos ficticios de fincas/rutas. */
export const CATALOG_IMAGE_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600" role="img" aria-label="Sin imagen">
<defs>
<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" style="stop-color:#ecfdf5"/>
<stop offset="55%" style="stop-color:#e0f2fe"/>
<stop offset="100%" style="stop-color:#f0fdf4"/>
</linearGradient>
</defs>
<rect width="960" height="600" fill="url(#bg)"/>
<g fill="none" stroke="#059669" stroke-width="2.5" opacity="0.35">
<path d="M280 400 L480 220 L680 400 Z"/>
<circle cx="480" cy="380" r="48"/>
</g>
<text x="480" y="520" text-anchor="middle" fill="#0f766e" font-family="ui-sans-serif,system-ui,sans-serif" font-size="15" font-weight="500">Sin foto disponible</text>
</svg>`
  );
