# expert-catalog — prototipo MRL

Prototipo de catálogo para el programa **MRL** (*My Resource Library*), construido sobre el Strata Design System.

> 📸 El estado previo al recorte de scope está congelado en **[`mrl-exploration`](https://github.com/diegozuluaga88/mrl-exploration)**. Este repo es el que recibe el trabajo.

---

## Alcance

El prototipo se organiza alrededor de las **cinco áreas del MVP** que nombró Jeff en el SOW v5: *Search, new Library/Binder UX, new Reporting, Project Tool y Dealer Left Tab*.

Hoy cubre dos superficies:

- **Library** — el árbol de binders y el estante, navegación `Library → Binder → Category → Product`
- **My Projects** — el Project Tool, con rooms, zones e items

En agosto de 2026 se retiraron 168 archivos que venían del proyecto del que se copió y no tenían respaldo en ninguna fuente del cliente: tracking de OCR, transacciones, órdenes, acknowledgements, cotización, generative UI, y la V1 del catálogo.

## Documentación

La fuente de verdad vive en `strata-docs/09-mrl-uwh/`:

| Documento | Para qué |
|---|---|
| `STATUS.md` | **Empezar acá** · estado vivo: etapas, qué falta, bloqueos y quién los destraba |
| `SCOPE-CONSOLIDATED.md` | Qué se construye y qué no, con fuente por fila |
| `PROPOSAL.md` | La versión nueva, por las cinco áreas de Jeff |
| `UX-REVIEW.md` | Revisión heurística con severidad |
| `IMPLEMENTATION.md` | El recorte ejecutado, con sus números |

## Correr el proyecto

```bash
npm install
npm run dev              # http://localhost:8086
npm run build
npm run scan:security    # obligatorio antes de commitear
```

Requiere `npm install` también dentro de `packages/strata-ds` — el design system vendorizado usa Tailwind v4 mientras la raíz usa v3. Si el build falla con `postcss-import: Unknown word "use strict"`, casi siempre es `node_modules` desactualizado, no el repo.

## Antes de commitear

⚠️ **Este repositorio tuvo tres inyecciones de payload ofuscado.** Hay un scanner y un hook de pre-commit.

- **Nunca `git add -A`.** Stagear archivo por archivo.
- Revisar el diff de cualquier `.mjs`, `.cjs`, `postcss.config` o script de build antes de agregarlo.
- `npm run build` regenera seis archivos de tokens en `packages/strata-ds/` con diff vacío — solo cambio de CRLF. Descartar con `git checkout -- packages/`.

## Design System

Las reglas están en `CLAUDE.md` y en el MCP server `strata-ds`. Regla de oro: **tokens semánticos siempre** (`bg-background`, `text-foreground`, `text-success`), nunca colores hardcodeados ni clases Tailwind raw para estados.
