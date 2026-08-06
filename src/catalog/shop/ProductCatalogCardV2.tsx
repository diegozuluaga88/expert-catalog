import { Star, Heart, Plus, Ban, History, Package, FolderPlus, ArrowUpRight } from 'lucide-react'
import type { ItemStatus, Product } from '../types'
import { resolveInternalSku, resolveItemStatus } from '../browse/catalogSku'
import { useCatalogs } from '../data/catalogs'
import { useQuote } from '../../quote/QuoteContext'
import { formatPrice } from '../data/catalogues'

// F53 · Refactor de card (2026-08-04) · consolidación de acciones +
// jerarquía visual. Cambios vs v2 previa:
//   · UN solo CTA primario "Add" (full-width) que abre el detail
//     panel · elimina el duplicado sliders/Configure + el pill
//     quick-add (que en UX se pisaban con Configure). El "add real"
//     vive dentro del panel.
//   · 4 rows fijas en el body (antes hasta 8 opcionales). Eliminados
//     los chips "Often selected" (Sparkles) + "Used in N settings"
//     (MapPin) + row de lead time separada + segunda línea del
//     precio "Dealer price · list $X" · pasan al detail panel.
//   · Overlays del hero (checkbox select + favorite + add-to-project)
//     ahora on-hover only · pattern Airbnb/Pinterest. Fallback en
//     touch devices via @media(hover:none).
//   · Callbacks simplificados · onOpen (era onConfigure · nombre más
//     claro para "abre detail panel") + eliminados onConfigure y
//     onQuickAdd. Preservados onToggleSelect, onToggleFavorite,
//     onAddToProject?, onRequestSwatch? (materials).

function ItemStatusBadge({ status }: { status: ItemStatus }) {
  if (status === 'active') return null
  if (status === 'discontinued') {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Discontinued
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
      Out of sync
    </span>
  )
}

// Prioriza el tag más útil para el user · single-tag policy.
function pickPrimaryTag(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null
  const priority = ['Best Seller', 'New', 'Quick Ship', 'Textile']
  for (const p of priority) {
    if (tags.some((t) => t.toLowerCase() === p.toLowerCase())) return p
  }
  return tags[0]
}

interface ProductCatalogCardV2Props {
  product: Product
  selected: boolean
  favorite: boolean
  onToggleSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  /** Primary CTA · abre el detail panel donde vive el add real
   *  con variants + qty. Single entry point post-F53. */
  onOpen: (product: Product) => void
  /** F51 · A.3 · pedir swatch físico · solo materials · si no llega
   *  el CTA principal sigue siendo "Add" apuntando al detail panel. */
  onRequestSwatch?: (product: Product) => void
  /** F50 · Etapa 10.d · agregar el producto a un project via modal.
   *  Cuando llega, aparece el icon FolderPlus on hover en el overlay
   *  del hero. Fallback seguro: si no llega, no se renderea. */
  onAddToProject?: (product: Product) => void
  /** F59 · click en el brand name (row 1 del body) abre el brand profile
   *  slide-over. Si no llega, el brand name queda como span read-only. */
  onBrandClick?: (brandName: string) => void
  /** F66.3 · dealer pricing override · cuando el user activa Contract Pricing
   *  (o Special Auth) en tenant preferences, el consumer computa el precio
   *  final aplicando las rules y lo pasa acá. Si viene set, la card muestra
   *  finalPrice en vez de product.price y el savings % de las rules en vez
   *  del list-vs-price discount original. Si no viene, comportamiento legacy. */
  dealerPricing?: { finalPrice: number; savingsPct: number; rulesApplied: string[] } | null
  /** F66.5 · el product satisface TODAS las tag-based preferences activas
   *  del tenant (GSA, LEED, FSC, etc). Cuando true, muestra un pequeño
   *  badge "Matches your prefs" cerca del precio. Cuando false o null, no
   *  se muestra (nothing to communicate). */
  matchesPreferences?: boolean
}

/* F53 · className compartido para los overlays on-hover del hero.
 * Airbnb/Pinterest pattern · opacity 0 default · 100 en hover.
 * Fallback touch: `[@media(hover:none)]:opacity-100` mantiene los
 * overlays visibles en devices sin hover capability. */
// F57.1 · a11y fix · antes `focus-visible:opacity-100` vivía en el div
// contenedor no-focusable · nunca disparaba. Cambio a `group-focus-within`
// para que Tab en cualquier button interno haga el overlay visible
// (checkbox select, favorite, add-to-project). Sin esto, keyboard users
// no ven los botones cuando llegan a ellos con Tab.
const HOVER_OVERLAY_CLS =
  'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-200'

export default function ProductCatalogCardV2({
  product,
  selected,
  favorite,
  onToggleSelect,
  onToggleFavorite,
  onOpen,
  onRequestSwatch,
  onAddToProject,
  onBrandClick,
  dealerPricing,
  matchesPreferences,
}: ProductCatalogCardV2Props) {
  const catalogs = useCatalogs()
  const itemStatus = resolveItemStatus(product, catalogs)
  const isDiscontinued = itemStatus === 'discontinued'
  const { quotedHistory } = useQuote()
  const historyEntry = quotedHistory.get(product.id)

  const hasDiscount = !!(product.listPrice && product.price && product.listPrice > product.price)
  const discountPct = hasDiscount
    ? Math.round(((product.listPrice! - product.price!) / product.listPrice!) * 100)
    : 0
  const primaryTag = pickPrimaryTag(product.tags)

  // F66.3 · dealer pricing override · si el consumer pasa dealerPricing
  // (Contract Pricing / Special Auth activos), lo priorizamos sobre el
  // list-vs-price discount original del catalog.
  const displayPrice = dealerPricing?.finalPrice ?? product.price
  const displaySavingsPct = dealerPricing?.savingsPct ?? discountPct
  const showSavings = (dealerPricing && dealerPricing.savingsPct > 0) || hasDiscount

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 ${
        isDiscontinued
          ? 'border-border/60 opacity-75 grayscale-[40%]'
          : 'border-border hover:border-foreground/30 hover:shadow-md cursor-grab active:cursor-grabbing'
      }`}
      aria-disabled={isDiscontinued}
      // F51 · B.1 · drag-from-binder preservado · el card sigue
      // siendo draggable al ProjectsPage (dataTransfer product-id).
      draggable={!isDiscontinued}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-product-id', product.id)
        e.dataTransfer.effectAllowed = 'copy'
      }}
    >
      {/* Discontinued diagonal ribbon · siempre visible (crítico). */}
      {isDiscontinued && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 overflow-hidden">
          <div className="origin-top-right translate-x-[30%] translate-y-2 rotate-45 bg-foreground px-10 py-1 text-[10px] font-bold uppercase tracking-wider text-background shadow-lg">
            Discontinued
          </div>
        </div>
      )}

      {/* Hero image + overlays on-hover (checkbox select, favorite,
          add-to-project). El add real vive en el CTA "Add" del footer ·
          keyboard users no dependen del click de la imagen.
          F57.4 · a11y · onClick de imagen removido (era decorativo · el
          único entry point válido es el CTA "Add" del footer, que sí es
          keyboard focusable). Sighted-mouse conserva el CTA como acción
          discoverable · keyboard conserva el mismo CTA como único path
          consistente. */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.images[0]}
          alt={product.name}
          className={`h-full w-full object-cover transition-transform duration-300 ${
            isDiscontinued ? 'cursor-not-allowed' : 'group-hover:scale-105'
          }`}
          loading="lazy"
        />

        {!isDiscontinued && historyEntry && (
          <span
            className="pointer-events-none absolute left-3 bottom-3 z-10 inline-flex items-center gap-1 rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background shadow-sm backdrop-blur"
            title={`Previously selected ${historyEntry.occurrences} ${historyEntry.occurrences === 1 ? 'time' : 'times'} · ${historyEntry.totalUnits} total units`}
          >
            <History className="h-2.5 w-2.5" />
            Previously selected
          </span>
        )}

        {/* Overlay top-left · checkbox select (on hover). */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSelect(product.id) }}
          disabled={isDiscontinued}
          aria-label={selected ? 'Deselect product' : 'Select product'}
          className={`absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded border transition-colors ${HOVER_OVERLAY_CLS} ${
            selected
              ? 'border-foreground bg-foreground text-background opacity-100'
              : 'border-border bg-card/85 backdrop-blur'
          } ${isDiscontinued ? 'cursor-not-allowed opacity-30' : ''}`}
        >
          {selected && <span className="text-[11px] font-bold leading-none">✓</span>}
        </button>

        {/* Overlay top-right · favorite + add-to-project (on hover). */}
        <div className={`absolute right-3 top-3 flex items-center gap-1.5 ${HOVER_OVERLAY_CLS} ${
          favorite ? 'opacity-100' : ''
        }`}>
          {onAddToProject && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddToProject(product) }}
              aria-label="Add to a project"
              title="Add to a project"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-card/85 text-foreground backdrop-blur transition-colors hover:bg-card"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id) }}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-card/85 text-foreground backdrop-blur transition-colors hover:bg-card"
          >
            <Heart className={`h-4 w-4 ${favorite ? 'fill-destructive text-destructive' : ''}`} />
          </button>
        </div>
      </div>

      {/* Body · 4 rows fijas. */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Row 1 · metadata compacta · brand · SKU · rating (todos en
            una sola línea horizontal para eliminar el hueco visual
            asimétrico anterior). */}
        <div className="flex items-center gap-2 text-xs">
          {/* F59 · brand name clickeable si viene onBrandClick · abre el
              brand profile slide-over sin sacar al user del catálogo. */}
          {onBrandClick ? (
            <button
              type="button"
              onClick={() => onBrandClick(product.brand ?? '')}
              className="truncate text-muted-foreground hover:text-foreground hover:underline transition-colors focus-visible:outline-none focus-visible:text-foreground focus-visible:underline"
              title={`View ${product.brand} brand profile`}
            >
              {product.brand}
            </button>
          ) : (
            <span className="text-muted-foreground truncate">{product.brand}</span>
          )}
          <span
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground"
            title="Internal SKU · click on product to view manufacturer SKU as well"
          >
            {resolveInternalSku(product)}
          </span>
          {product.dealerRating != null && (
            <span className="ml-auto flex items-center gap-0.5 text-foreground tabular-nums">
              <Star className="h-3 w-3 fill-foreground" />
              {product.dealerRating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Row 2 · nombre + status inline si aplica.
            F57.4 · a11y · sin onClick decorativo · el CTA "Add" del
            footer es el único entry point al detail panel. */}
        <div className="flex items-start gap-2">
          <h3
            className="text-sm font-bold leading-tight text-foreground"
          >
            {product.name}
          </h3>
          <ItemStatusBadge status={itemStatus} />
        </div>

        {/* Row 3 · variants (colorway dots + un solo tag prominente). */}
        {(product.colorways.length > 0 || primaryTag) && (
          <div className="flex items-center gap-2">
            {product.colorways.length > 0 && (
              <div className="flex items-center gap-1">
                {product.colorways.slice(0, 5).map((c) => (
                  <span
                    key={c.code}
                    title={c.name}
                    className="h-3.5 w-3.5 rounded-full border border-border"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                {product.colorways.length > 5 && (
                  <span className="ml-0.5 text-[10px] text-muted-foreground tabular-nums">
                    +{product.colorways.length - 5}
                  </span>
                )}
              </div>
            )}
            {primaryTag && (
              <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {primaryTag}
              </span>
            )}
          </div>
        )}

        {/* Row 4 · footer con precio compacto (1 línea) + CTA único
            full-width. Save% chip inline con el precio para ahorrar
            espacio vertical. Tooltip on hover del precio muestra el
            list price · antes ocupaba una línea extra. */}
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <div
            className="flex items-baseline gap-2"
            title={dealerPricing
              ? `With your pricing rules: ${formatPrice(displayPrice, product.currencyId)} · ${dealerPricing.rulesApplied.join(' + ')} applied · list ${formatPrice(product.price, product.currencyId)}`
              : hasDiscount
                ? `Dealer price ${formatPrice(product.price, product.currencyId)} · list ${formatPrice(product.listPrice!, product.currencyId)} · your dealer discount applied`
                : `Dealer price ${formatPrice(product.price, product.currencyId)}`}
          >
            <span className="text-base font-bold text-foreground tabular-nums">
              {formatPrice(displayPrice, product.currencyId)}
            </span>
            {showSavings && displaySavingsPct > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Save {displaySavingsPct}%
              </span>
            )}
            {dealerPricing && dealerPricing.rulesApplied.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground"
                title={dealerPricing.rulesApplied.join(' + ')}>
                Rules
              </span>
            )}
            {/* F66.5 · soft-match badge · el product satisface todas las
                tag-based preferences activas del tenant (GSA/LEED/FSC/etc). */}
            {matchesPreferences && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400"
                title="Matches all your active buying preferences (compliance & sustainability)"
              >
                ✓ Match
              </span>
            )}
          </div>

          {/* CTA único full-width. Discontinued · disabled. Material +
              onRequestSwatch · "Request sample" (P5 del PRD). Default ·
              "Add" que abre el detail panel (add real vive ahí). */}
          {isDiscontinued ? (
            <button
              type="button"
              disabled
              title="Discontinued · quoting disabled"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-bold text-muted-foreground cursor-not-allowed"
            >
              <Ban className="h-3.5 w-3.5" /> Unavailable
            </button>
          ) : product.isMaterial && onRequestSwatch ? (
            <button
              type="button"
              onClick={() => onRequestSwatch(product)}
              title="Request a physical sample of this material"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Package className="h-3.5 w-3.5" /> Request sample
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpen(product)}
              title="Add · pick variants and quantity in the detail panel"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add
              <ArrowUpRight className="h-3 w-3 opacity-70" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
