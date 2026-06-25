import { Star, Heart, Sparkles, ArrowUpRight } from 'lucide-react'
import type { ItemStatus, Product } from '../types'
import { resolveInternalSku, resolveItemStatus } from '../browse/catalogSku'

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
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-foreground/20 hover:shadow-sm">
      {/* Image + select + favorite */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.images[0]}
          alt={product.name}
          onClick={() => onOpen?.(product)}
          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            onOpen ? 'cursor-pointer' : ''
          }`}
          loading="lazy"
        />
        <button
          type="button"
          onClick={() => onToggleSelect(product.id)}
          aria-label={selected ? 'Deselect product' : 'Select product'}
          className={`absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
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
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{product.brand}</span>
            <span className="font-mono text-[10px] text-muted-foreground/80" title={`Internal SKU: ${resolveInternalSku(product)}`}>
              SKU {resolveInternalSku(product)}
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
          <ItemStatusBadge status={resolveItemStatus(product)} />
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

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="leading-tight">
            {product.listPrice && product.listPrice > (product.price ?? 0) && (
              <span className="block text-xs text-muted-foreground line-through">
                ${product.listPrice.toLocaleString()}
              </span>
            )}
            <span className="text-base font-bold text-foreground">
              ${product.price?.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRequestQuote(product)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Request Quote
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}
