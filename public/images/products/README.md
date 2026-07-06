# Product photos · public/images/products/

Fotos de referencia por ProductGroup del catálogo. Cada archivo se llama por el `productGroupCode` en minúscula: `ch01.jpg`, `tb04.jpg`, `al13.jpg`, etc.

## Naming convention

`{productGroupCode-lowercase}.jpg` — servido por Vite/Vercel desde `/images/products/{code}.jpg`.

Ejemplo: el ProductGroup `CH15` (Chair, Stool Casual) usa `ch15.jpg`. Todas las variantes del grupo (`CH15.1`, `CH15.2`, `CH15.3`) comparten la misma foto (el bundle-add usa `stub.imageUrl` que apunta al file por code).

## Swap manual de fotos

Si una foto no representa bien el ProductGroup, reemplázala directamente:

1. Descarga la foto que quieras (Unsplash, Pexels, u otro origen con licencia libre).
2. Renómbrala al code correcto: `ch04.jpg`, `tb15.jpg`, etc.
3. Copia al directorio `public/images/products/` sobreescribiendo el archivo existente.
4. Recarga con `Ctrl+F5` en `localhost:8086`.

Sin cambios de código. La `img` es referenciada por path, no por hash.

## Fallback

Si la foto no carga (404, network fail, path incorrecto), `ProductIcon.tsx` renderiza un icon Lucide del `productType` correspondiente (Chair → Armchair, Table → Table, Lamp → Lamp, etc) con el code en badge overlay. Mismo pattern que `SpaceRendering.tsx`.

## Fuente actual

Fotos descargadas 2026-07-06 desde Unsplash CDN (`images.unsplash.com`) con query `?w=600&q=80&auto=format&fit=crop`. Licencia libre para uso comercial (Unsplash License).

Algunos codes tienen fotos "marginales" (photos de furniture-related pero no exactamente del sub-type):
- `tb04` · round meeting table → living room con round coffee table (marginal)
- `ch08` / `tb22` · comparten photo (marginal, ambos son "lounge chair-ish")
- Otros pueden refinarse manualmente sin tocar código.
