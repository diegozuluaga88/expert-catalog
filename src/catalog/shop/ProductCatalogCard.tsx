import { Star, Heart, Sparkles, ArrowUpRight, Ban } from 'lucide-react'
import type { ItemStatus, Product } from '../types'
import { resolveInternalSku, resolveItemStatus } from '../browse/catalogSku'
import { useCatalogs } from '../data/catalogs'

// Etapa 8.2 — Card de producto del "Product Catalog" (Figma Dashboard 1285:10432).
// DS-compliant: tokens semánticos; lima solo en el CTA. Swatches usan el hex del dato.
//
// Phase 2 Fix #6 — SKU interno visible debajo del brand (monospace, muted).
// Phase 2 Fix #6b — itemStatus badge visible siempre cuando NO sea 'active'.

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

interface ProductCatalogCardProps {
  product: Product
  selected: boolean
  favorite: boolean
  onToggleSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  onRequestQuote: (product: Product) => void
  /** Opcional (Showroom Etapa 9): abrir el detalle rico al clic en imagen/nombre. */
  onOpen?: (product: Product) => void
}

export default function ProductCatalogCard({
  product,
  selected,
  favorite,
  onToggleSelect,
  onToggleFavorite,
  onRequestQuote,
  onOpen,
}: ProductCatalogCardProps) {
  // Reactive itemStatus · re-rendea cuando se sincroniza el catalog asociado
  const catalogs = useCatalogs()
  const itemStatus = resolveItemStatus(product, catalogs)
  const isDiscontinued = itemStatus === 'discontinued'
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
            {product.listPrice && product.price && product.listPrice > product.price && (
              <span
                className="flex items-baseline gap-1.5"
                title={`Manufacturer list price $${product.listPrice.toLocaleString()} · your dealer discount applied`}
              >
                <span className="text-xs text-muted-foreground line-through">
                  ${product.listPrice.toLocaleString()}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  Save {Math.round(((product.listPrice - product.price) / product.listPrice) * 100)}%
                </span>
              </span>
            )}
            <span className="text-base font-bold text-foreground">
              ${product.price?.toLocaleString()}
            </span>
            {product.listPrice && product.price && product.listPrice > product.price && (
              <span className="block text-[10px] text-muted-foreground">
                Dealer price · list ${product.listPrice.toLocaleString()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => !isDiscontinued && onRequestQuote(product)}
            disabled={isDiscontinued}
            title={isDiscontinued ? 'Discontinued · quoting disabled' : 'Request a quote'}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              isDiscontinued
                ? 'cursor-not-allowed bg-muted text-muted-foreground'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isDiscontinued ? <><Ban className="h-3.5 w-3.5" /> Unavailable</> : <>Request Quote <ArrowUpRight className="h-3.5 w-3.5" /></>}
          </button>
        </div>
      </div>
    </article>
  )
}
