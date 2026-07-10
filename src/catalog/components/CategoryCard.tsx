// MRL Detail Fase D3 (2026-07-10) · CategoryCard polimórfica.
//
// Renderiza una category card con uno de los 5 estilos visuales observados
// en myresourcelibrary.com. El estilo se decide via `manufacturer.categoryCardStyle`:
//
//   photo         → foto full-bleed (cardImage o fallback a products[0].images[0]).
//   brand-typo    → fondo con `manufacturer.bgColor`, typo huge uppercase de
//                   `category.name` en `manufacturer.textColor`.
//   blob-outline  → círculo grande con `cardColor` de fondo, SVG paths outline
//                   (cardIconSvg) en blanco encima.
//   line-icon     → SVG lineal grande centrado en `text-primary` o
//                   `text-foreground/60`.
//   silhouette    → silueta SVG grande en `manufacturer.accentColor`.
//
// Fallback · si no se pasa `manufacturer` o su `categoryCardStyle` es
// undefined, cae a `photo` con placeholder.
//
// Todas las variantes comparten el shell: aspect-square, rounded-lg, border,
// hover ring-primary/30, label debajo (Nielsen H6 · recognition).

import { PlayIcon } from '@heroicons/react/24/solid'
import type { Category, Manufacturer, CategoryCardVariant } from '../types'

/* Fallbacks de emergencia · en teoría nunca se ejecutan porque:
 * - brand-typo requiere manufacturer.bgColor/textColor (required en el type)
 * - blob-outline requiere que el editor provea cardColor
 * Pero se dejan para que el componente sea robusto si algún day-1 seed
 * llega incompleto. Referencian tokens del DS via CSS variable. */
const FALLBACK_BG = 'var(--card)'
const FALLBACK_TEXT = 'var(--card-foreground)'
const FALLBACK_BLOB = 'var(--primary)'

interface CategoryCardProps {
  category: Category
  /** Manufacturer para leer `categoryCardStyle` + colors. Opcional para
   *  retrocompat con lugares que no lo tienen (fallback a variant 'photo'). */
  manufacturer?: Manufacturer
  onClick: () => void
  /** Estado seleccionado · aplica ring lime (Nielsen H1). */
  selected?: boolean
}

export default function CategoryCard({ category, manufacturer, onClick, selected = false }: CategoryCardProps) {
  const variant: CategoryCardVariant = manufacturer?.categoryCardStyle ?? 'photo'

  return (
    <button
      onClick={onClick}
      aria-label={`Browse ${category.name}`}
      className="group flex flex-col items-stretch text-left w-full"
    >
      {/* Shell común · aspect-square + rounded + border + hover ring. La
          variante decide el contenido interno. */}
      <div
        className={`group relative aspect-square rounded-lg overflow-hidden bg-card border transition-all duration-200 ${
          selected
            ? 'border-primary ring-2 ring-primary/30'
            : 'border-border hover:border-primary/60 hover:ring-2 hover:ring-primary/30'
        }`}
      >
        {variant === 'photo' && <PhotoVariant category={category} />}
        {variant === 'brand-typo' && <BrandTypoVariant category={category} manufacturer={manufacturer} />}
        {variant === 'blob-outline' && <BlobOutlineVariant category={category} />}
        {variant === 'line-icon' && <LineIconVariant category={category} />}
        {variant === 'silhouette' && <SilhouetteVariant category={category} manufacturer={manufacturer} />}
      </div>

      {/* Label · debajo de la card, centrado */}
      <div className="mt-2 text-center">
        <p className="text-sm font-medium text-foreground leading-snug">
          {category.name}
        </p>
        {category.cardSubtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {category.cardSubtitle}
          </p>
        )}
      </div>
    </button>
  )
}

/* ─── Variant renders ─────────────────────────────────────────────────── */

function PhotoVariant({ category }: { category: Category }) {
  // Prioridad · cardImage explícito → primera imagen del primer producto →
  // placeholder gradient neutro.
  const src = category.cardImage ?? category.products?.[0]?.images?.[0]

  return (
    <>
      {src ? (
        <img
          src={src}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted to-primary/20" />
      )}

      {/* Overlay video · marca la card como módulo de video · replica los
          thumbnails con play + duration del referente (Artcobell, Tayco). */}
      {category.isVideo && <VideoOverlay duration={category.videoDuration} />}
    </>
  )
}

function VideoOverlay({ duration }: { duration?: string }) {
  return (
    <>
      {/* Scrim sutil para que el play icon lea sobre cualquier foto */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/10 transition-colors"
      />

      {/* Play icon central · pill circular con backdrop-blur */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm shadow-md ring-1 ring-border transition-transform duration-300 group-hover:scale-110">
          <PlayIcon className="h-6 w-6 text-foreground translate-x-0.5" />
        </span>
      </div>

      {/* Duration badge · esquina inferior derecha, glass pill.
          Formato "MM:SS" · mock display. */}
      {duration && (
        <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-foreground/75 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-semibold text-background tabular-nums">
          {duration}
        </div>
      )}
    </>
  )
}

function BrandTypoVariant({ category, manufacturer }: { category: Category; manufacturer?: Manufacturer }) {
  // Fondo · color del brand (data-driven, patrón ya establecido para
  // bgColor/textColor). Sin fallback obligatorio a token porque cuando
  // esta variante se elige explícitamente, el editor debe proveer colors.
  const bgColor = manufacturer?.bgColor ?? FALLBACK_BG
  const textColor = manufacturer?.textColor ?? FALLBACK_TEXT

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-4 py-6 text-center"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {category.cardSubtitle && (
        <div className="text-[9px] font-bold uppercase tracking-widest opacity-70 mb-2">
          {category.cardSubtitle}
        </div>
      )}
      <div className="text-xl font-black uppercase tracking-tight leading-none">
        {category.name}
      </div>
    </div>
  )
}

function BlobOutlineVariant({ category }: { category: Category }) {
  // Círculo grande con cardColor + outline SVG blanco encima.
  const color = category.cardColor ?? FALLBACK_BLOB // fallback primary token
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="rounded-full flex items-center justify-center"
        style={{ backgroundColor: color, width: '78%', height: '78%' }}
      >
        <svg
          viewBox="0 0 80 80"
          className="w-3/5 h-3/5 text-primary-foreground"
          fill="none"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: category.cardIconSvg ?? '' }}
        />
      </div>
    </div>
  )
}

function LineIconVariant({ category }: { category: Category }) {
  // SVG grande centrado en fondo `bg-card`. Color foreground/60 para no
  // dominar visualmente · el hover ring aporta el color primary.
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-card">
      <svg
        viewBox="0 0 80 80"
        className="w-1/2 h-1/2 text-foreground/60 group-hover:text-foreground transition-colors"
        fill="none"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: category.cardIconSvg ?? '' }}
      />
    </div>
  )
}

function SilhouetteVariant({ category, manufacturer }: { category: Category; manufacturer?: Manufacturer }) {
  // Silueta grande fill=currentColor pintada con `manufacturer.accentColor`
  // (inline style, data-driven).
  const color = manufacturer?.accentColor ?? 'currentColor'
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-card">
      <svg
        viewBox="0 0 80 80"
        className="w-3/5 h-3/5 transition-transform duration-300 group-hover:scale-105"
        aria-hidden="true"
        style={{ color }}
        dangerouslySetInnerHTML={{ __html: category.cardIconSvg ?? '' }}
      />
    </div>
  )
}
