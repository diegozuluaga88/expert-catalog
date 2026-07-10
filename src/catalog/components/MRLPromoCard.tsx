// MRL Fase 5 · MRLPromoCard.
// Rediseño (2026-07-10) · composición editorial · imagen y texto DENTRO
// del mismo canvas de la card (como los slots reales de myresourcelibrary.com
// tipo Versteel · Caliber Flip & Nest · advertise-here), no imagen-arriba /
// texto-abajo tipo card web genérica.
//
// Átomos del DS Strata usados (todos vía tokens Tailwind):
// - `bg-card` `bg-background` `bg-primary`             · superficies
// - `border-border` `border-primary`                   · borde
// - `text-foreground` `text-muted-foreground`          · texto
// - `text-background` `text-primary-foreground`        · texto sobre superficie oscura
// - `bg-primary/15` `bg-foreground/10`                 · pills / glass overlay
// - `bg-gradient-to-t from-background/...`             · legibilidad sobre imagen
//
// No hay clases raw (`bg-teal-500`, `text-white`) · no hay hex hardcodeados
// dentro del JSX · dark mode automático via tokens.

import { ArrowRight } from 'lucide-react'

export type MRLPromoVariant = 'product' | 'event' | 'house'

interface MRLPromoCardProps {
  variant: MRLPromoVariant
  title: string
  /** Copy corto (1-2 líneas). */
  description?: string
  /** Micro-eyebrow arriba del título (fechas del event · brand · categoría). */
  eyebrow?: string
  /** Label del CTA · defaults según variant. */
  ctaLabel?: string
  /** URL opcional de la imagen background. Si no viene, se dibuja un gradient
   *  neutro que respeta los tokens del DS. */
  imageUrl?: string
  /** Texto en columna vertical decorativa (estilo "VERSTEEL" del referente).
   *  Solo aplica a variant='product'. Si no viene, la card no lo dibuja. */
  verticalBrand?: string
  /** Alt para la imagen · si no viene, se marca aria-hidden. */
  imageAlt?: string
}

const ASPECT: Record<MRLPromoVariant, string> = {
  product: 'aspect-[4/5]',
  event: 'aspect-[4/5]',
  house: 'aspect-[4/3]',
}

export default function MRLPromoCard({
  variant,
  title,
  description,
  eyebrow,
  ctaLabel,
  imageUrl,
  verticalBrand,
  imageAlt,
}: MRLPromoCardProps) {
  /* ─── HOUSE · self-promo sin imagen ─────────────────────────────────── */
  if (variant === 'house') {
    return (
      <article
        className={`relative flex flex-col justify-between overflow-hidden rounded-xl border border-primary bg-primary p-5 text-primary-foreground ${ASPECT.house}`}
      >
        {eyebrow && (
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
            {eyebrow}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-bold leading-tight">{title}</h3>
          {description && (
            <p className="text-xs leading-relaxed opacity-80">{description}</p>
          )}
          <button
            type="button"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary-foreground/40 px-3.5 py-1.5 text-xs font-semibold hover:bg-primary-foreground/10 transition-colors"
          >
            {ctaLabel ?? 'Tell me more'}
            <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </button>
        </div>
      </article>
    )
  }

  /* ─── PRODUCT / EVENT · imagen background + overlay editorial ───────── */
  return (
    <article
      className={`group/promo relative overflow-hidden rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg dark:hover:shadow-glow-md transition-all ${ASPECT[variant]}`}
    >
      {/* Imagen background · ocupa toda la superficie */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={imageAlt ?? ''}
          aria-hidden={imageAlt ? undefined : true}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/promo:scale-105"
          draggable={false}
        />
      ) : (
        // Fallback · gradient neutro con tokens del DS (respeta dark mode).
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted to-primary/20" />
      )}

      {/* Gradient de legibilidad · funciona en light y dark porque usa el
          token `background` que hace swap. La imagen queda vista arriba y
          va oscureciéndose hacia abajo para que el texto lea siempre. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-background via-background/85 to-transparent"
      />
      {/* Halo top opcional · solo cuando hay eyebrow · da fondo semi-plano
          detrás del pill para que se lea sobre imágenes claras. */}
      {eyebrow && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/50 to-transparent"
        />
      )}

      {/* Vertical brand column (Versteel-like) · solo product */}
      {variant === 'product' && verticalBrand && (
        <div
          aria-hidden="true"
          className="absolute right-3 top-3 bottom-24 flex items-start justify-end pointer-events-none"
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/70"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {verticalBrand}
          </span>
        </div>
      )}

      {/* Content stack · anclado abajo, encima del gradient */}
      <div className="relative z-10 flex h-full flex-col justify-end p-5 gap-2">
        {eyebrow && (
          <span className="inline-flex w-fit items-center rounded-full bg-foreground/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-foreground backdrop-blur-sm">
            {eyebrow}
          </span>
        )}
        <h3 className="text-base font-bold text-foreground leading-tight">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
        <button
          type="button"
          className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:bg-foreground/85 transition-colors"
        >
          {ctaLabel ?? (variant === 'event' ? 'Learn more' : 'Explore')}
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </div>
    </article>
  )
}
