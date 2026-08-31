// F62 · MRL grid card (2026-08-06)
// Refactor visual · adopta el look de las Product Catalog cards
// (ProductCatalogCardV2) para unificar el visual language entre las 2
// tabs del catalog. Preserva prop signature actual (manufacturer + onClick)
// + agrega opcional onToast para el feedback del Custom Library overlay.
//
// Estructura (espeja PC card):
//   - Wrapper article rounded-xl border bg-card hover:shadow-md
//   - Hero aspect-4/3 · manufacturer.heroImage (object-cover + scale on
//     hover) con fallback a color block (bgColor + label uppercase
//     centrado usando textColor) para brands sin heroImage
//   - Hover overlay top-right · círculo Custom Library (Check icon fill on
//     saved · reusa useMyBinders del hook global) con toast Undo opcional
//   - Body 3 rows · type chip + brand tags · brand name + tagline ·
//     counts + palette dots decorativos
//   - Footer · CTA primary full-width "Browse products →" que dispara
//     el mismo onClick que el body (navigate a ManufacturerPage)

import { Check, ArrowUpRight } from 'lucide-react'
import type { Manufacturer } from '../types'
import { useMyBinders } from '../browse/useMyBinders'
import type { ToastAction, ToastType } from '../../components/AuthToast'

interface ManufacturerCardProps {
  manufacturer: Manufacturer
  onClick: () => void
  /** F62 · toast dispatcher opcional · si viene, el click en el círculo
   *  Custom Library dispara un success toast con action Undo (mismo pattern
   *  que BinderLibraryV2 en el shelf view). */
  onToast?: (type: ToastType, message: string, action?: ToastAction) => void
}

// F62 · mismo pattern del ProductCatalogCardV2.tsx:82 · overlay pattern
// Airbnb/Pinterest · opacity 0 default · 100 on hover · fallback touch
// via `[@media(hover:none)]:opacity-100`.
const HOVER_OVERLAY_CLS =
  'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-200'

// F62 · filtro de tags relevantes para el chip · matchea los mismos que
// se muestran en el sidebar filter del MRL (my binders excluido · es el
// overlay ahora). Case insensitive.
const RELEVANT_TAGS = ['GSA', 'QuickShip', 'CET', 'CIL'] as const

function filterRelevantTags(tags: string[] | undefined): string[] {
  if (!tags || tags.length === 0) return []
  return tags.filter((t) =>
    RELEVANT_TAGS.some((r) => r.toLowerCase() === t.toLowerCase()),
  )
}

function typeLabel(type: Manufacturer['type']): string {
  if (type === 'products') return 'Products'
  if (type === 'materials') return 'Materials'
  return 'Both'
}

export default function ManufacturerCard({ manufacturer, onClick, onToast }: ManufacturerCardProps) {
  const totalProducts = manufacturer.categories.reduce((acc, c) => acc + c.products.length, 0)
  const totalCategories = manufacturer.categories.length
  const { isInMyBinders, toggleBinder } = useMyBinders()
  const saved = isInMyBinders(manufacturer.id)
  const relevantTags = filterRelevantTags(manufacturer.tags)
  const hasHeroImage = !!manufacturer.heroImage

  const handleToggleMyBinders = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const wasSaved = saved
    toggleBinder(manufacturer.id)
    if (!onToast) return
    // Nielsen H3 · user control + freedom · toast con Undo.
    const message = wasSaved
      ? `Removed ${manufacturer.name} from Custom Library`
      : `Added ${manufacturer.name} to Custom Library`
    onToast('success', message, {
      label: 'Undo',
      onClick: () => toggleBinder(manufacturer.id),
    })
  }

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    // Evita re-fire si el click vino del overlay button (que ya hace stopPropagation).
    if ((e.target as HTMLElement).closest('[data-manufacturer-overlay]')) return
    onClick()
  }

  return (
    <article
      onClick={handleCardClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card hover:border-foreground/30 hover:shadow-md transition-all cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
    >
      {/* Hero · aspect-4/3 · heroImage con fallback al color block */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {hasHeroImage ? (
          <img
            src={manufacturer.heroImage}
            alt={`${manufacturer.name} hero`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Fallback si la imagen falla · hidea la img y deja el bg fallback visible.
              (e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          // Fallback · color block escalado con label uppercase centrado.
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-90"
            style={{ backgroundColor: manufacturer.bgColor }}
          >
            <span
              className="text-xl md:text-2xl font-bold uppercase tracking-wide"
              style={{ color: manufacturer.textColor }}
            >
              {manufacturer.binderLabel ?? manufacturer.name.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Video duration badge · bottom-right cuando heroIsVideo */}
        {manufacturer.heroIsVideo && manufacturer.heroDuration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {manufacturer.heroDuration}
          </span>
        )}

        {/* Hover overlay · círculo Custom Library top-right */}
        <button
          type="button"
          data-manufacturer-overlay
          onClick={handleToggleMyBinders}
          aria-label={saved ? `Remove ${manufacturer.name} from Custom Library` : `Add ${manufacturer.name} to Custom Library`}
          aria-pressed={saved}
          title={saved ? 'In Custom Library' : 'Add to Custom Library'}
          className={`${HOVER_OVERLAY_CLS} absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            saved
              ? 'bg-primary border-primary-foreground text-primary-foreground'
              : 'bg-card/95 border-card text-muted-foreground hover:text-foreground'
          }`}
        >
          <Check className={`h-4 w-4 ${saved ? 'opacity-100' : 'opacity-60'}`} strokeWidth={saved ? 3 : 2} />
        </button>
      </div>

      {/* Body · 3 rows compactas */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {/* Row 1 · type chip + brand tags */}
        <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
          <span className="inline-flex items-center rounded-md bg-muted/70 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-muted-foreground">
            {typeLabel(manufacturer.type)}
          </span>
          {relevantTags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Row 2 · brand name + tagline */}
        <div>
          <h3 className="text-sm font-bold leading-tight text-foreground truncate">
            {manufacturer.name}
          </h3>
          {manufacturer.tagline && (
            <p className="mt-0.5 text-[11px] italic text-muted-foreground truncate">
              {manufacturer.tagline}
            </p>
          )}
        </div>

        {/* Row 3 · counts prominentes + palette dots */}
        <div className="mt-auto flex items-center justify-between pt-1.5 border-t border-border">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-foreground tabular-nums leading-none">
              {totalProducts}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {totalProducts === 1 ? 'product' : 'products'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {totalCategories} {totalCategories === 1 ? 'cat' : 'cats'}
            </span>
            {/* Palette dots decorativos · aria-hidden porque son solo visuales */}
            <div className="flex items-center gap-0.5" aria-hidden="true">
              <span
                className="h-2.5 w-2.5 rounded-full border border-border/60"
                style={{ backgroundColor: manufacturer.bgColor }}
              />
              {manufacturer.accentColor && (
                <span
                  className="h-2.5 w-2.5 rounded-full border border-border/60"
                  style={{ backgroundColor: manufacturer.accentColor }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer · CTA primary full-width */}
      <div className="border-t border-border bg-muted/20 p-2">
        <button
          type="button"
          data-manufacturer-overlay
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Browse products
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  )
}
