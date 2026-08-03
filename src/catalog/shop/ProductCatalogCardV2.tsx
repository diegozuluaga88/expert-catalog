import { Star, Heart, Sparkles, Plus, Sliders, Ban, History, MapPin, Package, FolderPlus } from 'lucide-react'
import type { ItemStatus, Product } from '../types'
import { resolveInternalSku, resolveItemStatus } from '../browse/catalogSku'
import { useCatalogs } from '../data/catalogs'
import { useQuote } from '../../quote/QuoteContext'
import { inferProductGroupCode } from '../data/productGroups'
import { settingsUsingProductGroup } from '../data/spaceTypes'
import { formatPrice } from '../data/catalogues'

// F50 · Wave 3.c · v2 · duplicado de ProductCatalogCard.tsx. V1 queda intocada.
// Único cambio funcional vs v1: el CTA "Add to Selection" pasa a ser dos
// acciones separadas · "Add" (agrega directo con las opciones default) y
// "Configure" (abre el panel de detalle para ajustar variants). El disparador
// ambiguo del v1 (un solo botón que abría el panel siempre) queda resuelto:
// el usuario elige explícitamente qué quiere hacer.
//
// Referencia legacy de v1:
// Etapa 8.2 — Card de producto del "Product Catalog" (Figma Dashboard 1285:10432).

function ItemStatusBadge({ status }: { status: ItemStatus }) {
  if (status === 'active') return null
  if (status === 'discontinued') {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Discontinued
      </span>
    )
  }
  // 'discrepancy' · catalog out of sync
  return (
    <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
      Out of sync
    </span>
  )
}

interface ProductCatalogCardV2Props {
  product: Product
  selected: boolean
  favorite: boolean
  onToggleSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  /** F50 · Wave 3.c · configurar variants (color/finish/qty) antes de agregar.
   *  Abre el panel de detalle · comportamiento del CTA único de v1. */
  onConfigure: (product: Product) => void
  /** F50 · Wave 3.c · agregar directo con opciones default · 1-click.
   *  No abre el panel. */
  onQuickAdd: (product: Product) => void
  /** F50 · Wave 4.b · pedir un swatch físico · solo aparece cuando el producto
   *  es material (product.isMaterial). Si el prop no llega, el botón no se
   *  renderea (fallback seguro). */
  onRequestSwatch?: (product: Product) => void
  /** Opcional (Showroom Etapa 9): abrir el detalle rico al clic en imagen/nombre. */
  onOpen?: (product: Product) => void
  /** F50 · Etapa 10.d · agregar el producto a un project via modal. Si el
   *  prop no llega, el botón no se renderea (fallback seguro para v1). */
  onAddToProject?: (product: Product) => void
}

export default function ProductCatalogCardV2({
  product,
  selected,
  favorite,
  onToggleSelect,
  onToggleFavorite,
  onConfigure,
  onQuickAdd,
  onRequestSwatch,
  onOpen,
  onAddToProject,
}: ProductCatalogCardV2Props) {
  // Reactive itemStatus · re-rendea cuando se sincroniza el catalog asociado
  const catalogs = useCatalogs()
  const itemStatus = resolveItemStatus(product, catalogs)
  const isDiscontinued = itemStatus === 'discontinued'
  // Phase 4 Fix #13b · Previously quoted history info (per tenant)
  const { quotedHistory } = useQuote()
  const historyEntry = quotedHistory.get(product.id)
  // Fase 3 · badge "Used in N settings" · infiere el ProductGroup del product
  // (name/category) y busca en cuántos Space Type Settings aparece. Si no se
  // puede inferir o no aparece en ningún setting, no se muestra badge.
  const inferredGroupCode = inferProductGroupCode(product)
  const settingsUsingThis = inferredGroupCode ? settingsUsingProductGroup(inferredGroupCode) : []
  const usedInCount = settingsUsingThis.length
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 ${
        isDiscontinued
          ? 'border-border/60 opacity-75 grayscale-[40%]'
          : 'border-border hover:border-foreground/20 hover:shadow-sm'
      }`}
      aria-disabled={isDiscontinued}
    >
      {/* Discontinued diagonal ribbon · capa visual sobre la imagen */}
      {isDiscontinued && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 overflow-hidden">
          <div className="origin-top-right translate-x-[30%] translate-y-2 rotate-45 bg-foreground px-10 py-1 text-[10px] font-bold uppercase tracking-wider text-background shadow-lg">
            Discontinued
          </div>
        </div>
      )}
      {/* Phase 4 Fix #13b · Previously quoted floating badge top-right (cuando no discontinued) */}
      {!isDiscontinued && historyEntry && (
        <span
          className="pointer-events-none absolute right-12 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground shadow-sm backdrop-blur"
          title={`Previously selected ${historyEntry.occurrences} ${historyEntry.occurrences === 1 ? 'time' : 'times'} · ${historyEntry.totalUnits} total units`}
        >
          <History className="h-2.5 w-2.5" />
          Previously selected
        </span>
      )}
      {/* Image + select + favorite */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.images[0]}
          alt={product.name}
          onClick={() => !isDiscontinued && onOpen?.(product)}
          className={`h-full w-full object-cover transition-transform duration-300 ${
            isDiscontinued
              ? 'cursor-not-allowed'
              : `${onOpen ? 'cursor-pointer' : ''} group-hover:scale-105`
          }`}
          loading="lazy"
        />
        <button
          type="button"
          onClick={() => onToggleSelect(product.id)}
          disabled={isDiscontinued}
          aria-label={selected ? 'Deselect product' : 'Select product'}
          className={`absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
            isDiscontinued ? 'cursor-not-allowed opacity-50' : ''
          } ${
            selected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card/80 backdrop-blur'
          }`}
        >
          {selected && <span className="text-[11px] font-bold leading-none">✓</span>}
        </button>
        <button
          type="button"
          onClick={() => onToggleFavorite(product.id)}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-card/80 text-foreground backdrop-blur transition-colors hover:bg-card"
        >
          <Heart className={`h-4 w-4 ${favorite ? 'fill-destructive text-destructive' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {product.popular && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Often selected for similar projects
          </span>
        )}

        {/* Fase 3 · Space Type Settings usage badge · cross-nav pointer al
            catálogo de bundles (no click handler · el detail panel del producto
            expone la lista completa clickable). */}
        {usedInCount > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground w-fit"
            title={`This product ({${inferredGroupCode}}) appears in ${usedInCount} Space Type Setting${usedInCount === 1 ? '' : 's'} · ${settingsUsingThis.map(s => s.code).join(', ')}`}
          >
            <MapPin className="h-2.5 w-2.5" />
            Used in {usedInCount} setting{usedInCount === 1 ? '' : 's'}
          </span>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{product.brand}</span>
            <span
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground"
              title={`Internal SKU · click on product to view manufacturer SKU as well`}
            >
              <span className="text-[9px] font-sans font-bold uppercase tracking-wide text-muted-foreground">SKU</span>
              {resolveInternalSku(product)}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-foreground">
            <Star className="h-3 w-3 fill-foreground" />
            {product.dealerRating?.toFixed(1)} <span className="text-muted-foreground">Dealer Rated</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <h3
            onClick={() => onOpen?.(product)}
            className={`text-sm font-bold leading-tight text-foreground ${
              onOpen ? 'cursor-pointer hover:text-foreground/80' : ''
            }`}
          >
            {product.name}
          </h3>
          <ItemStatusBadge status={itemStatus} />
        </div>
        {product.leadTime && <p className="text-xs text-muted-foreground">{product.leadTime}</p>}

        {/* Colorways */}
        {product.colorways.length > 0 && (
          <div className="flex items-center gap-1.5">
            {product.colorways.slice(0, 5).map((c) => (
              <span
                key={c.code}
                title={c.name}
                className="h-3.5 w-3.5 rounded-full border border-border"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA · listPrice strikethrough + savings tooltip explica origen */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="leading-tight">
            {/* Fase P1.2 · formatPrice resuelve el símbolo desde product.currencyId
                (fallback USD). Prepara la UI para catalogues multi-currency sin
                hardcode del "$". */}
            {product.listPrice && product.price && product.listPrice > product.price && (
              <span
                className="flex items-baseline gap-1.5"
                title={`Manufacturer list price ${formatPrice(product.listPrice, product.currencyId)} · your dealer discount applied`}
              >
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.listPrice, product.currencyId)}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  Save {Math.round(((product.listPrice - product.price) / product.listPrice) * 100)}%
                </span>
              </span>
            )}
            <span className="text-base font-bold text-foreground">
              {formatPrice(product.price, product.currencyId)}
            </span>
            {product.listPrice && product.price && product.listPrice > product.price && (
              <span className="block text-[10px] text-muted-foreground">
                Dealer price · list {formatPrice(product.listPrice, product.currencyId)}
              </span>
            )}
          </div>
          {/* F50 · Wave 3.c · v2 · 2 CTAs separados. Add (primary) agrega con
              defaults en 1 click. Configure (outline) abre el panel para elegir
              variants. Cuando el producto está discontinuado, se muestra un
              solo botón "Unavailable" deshabilitado.
              F50 · Wave 4.b · si el producto es material y el consumer pasó
              onRequestSwatch, el botón primario cambia a "Request swatch"
              (con ícono de package) — la solicitud de muestra tiene prioridad
              en el flujo de finishes (P5 del PRD). El botón Configure sigue
              disponible por si el usuario quiere ver más info del material. */}
          {isDiscontinued ? (
            <button
              type="button"
              disabled
              title="Discontinued · quoting disabled"
              className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground cursor-not-allowed"
            >
              <Ban className="h-3.5 w-3.5" /> Unavailable
            </button>
          ) : product.isMaterial && onRequestSwatch ? (
            <div className="inline-flex gap-1">
              {onAddToProject && (
                <button
                  type="button"
                  onClick={() => onAddToProject(product)}
                  title="Add to a project"
                  aria-label="Add to a project"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onConfigure(product)}
                title="View material details"
                aria-label="View material details"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Sliders className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRequestSwatch(product)}
                title="Request a physical swatch of this material"
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Package className="h-3.5 w-3.5" /> Request swatch
              </button>
            </div>
          ) : (
            <div className="inline-flex gap-1">
              {onAddToProject && (
                <button
                  type="button"
                  onClick={() => onAddToProject(product)}
                  title="Add to a project"
                  aria-label="Add to a project"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onConfigure(product)}
                title="Configure · pick color, finish, quantity"
                aria-label="Configure and add"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Sliders className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onQuickAdd(product)}
                title="Add with default options · 1-click"
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
