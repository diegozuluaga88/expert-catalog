// MRL Fase 5 (2026-07-09) · MRLPromoCard · card individual de sponsor slot
// para el aside derecho del MRL. Inspirado en los ad cards del referente
// (myresourcelibrary.com) pero desacoplado de brands reales.
//
// Soporta 3 variantes según el ad slot type:
// - 'product'  · foto de producto/scene + título + descripción + CTA
// - 'event'    · imagen ilustrada/gradient + eyebrow date + título + CTA
// - 'house'    · self-promo del MRL · fondo primario/lime · CTA outline

import { ArrowRight } from 'lucide-react'

export type MRLPromoVariant = 'product' | 'event' | 'house'

interface MRLPromoCardProps {
  variant: MRLPromoVariant
  title: string
  /** Copy corto (2-3 líneas máximo). */
  description?: string
  /** Micro-eyebrow arriba del título (ej. fechas del event). */
  eyebrow?: string
  /** Label del CTA · defaults según variant. */
  ctaLabel?: string
  /** URL opcional de la imagen top. Si no, se dibuja un gradient. */
  imageUrl?: string
  /** Solo variantes con imagen · fallback gradient colors. */
  fallbackFrom?: string
  fallbackTo?: string
}

export default function MRLPromoCard({
  variant,
  title,
  description,
  eyebrow,
  ctaLabel,
  imageUrl,
  fallbackFrom = 'bg-primary/40',
  fallbackTo = 'bg-primary',
}: MRLPromoCardProps) {
  if (variant === 'house') {
    // Self-promo · fondo primario · Nielsen H8 · legible sin imagen.
    return (
      <article className="rounded-xl border border-primary bg-primary p-5 text-primary-foreground">
        {eyebrow && (
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
            {eyebrow}
          </div>
        )}
        <h3 className="text-base font-bold leading-tight mb-2">{title}</h3>
        {description && (
          <p className="text-xs leading-relaxed opacity-80 mb-3">{description}</p>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-foreground/40 px-3 py-1.5 text-xs font-semibold hover:bg-primary-foreground/10 transition-colors"
        >
          {ctaLabel ?? 'Tell me more'}
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </article>
    )
  }

  // Variantes 'product' y 'event' comparten shell.
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all">
      {/* Imagen top · aspect-video */}
      <div className="relative w-full aspect-video overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${fallbackFrom} to ${fallbackTo}`} />
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {eyebrow && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {eyebrow}
          </div>
        )}
        <h3 className="text-sm font-bold text-foreground leading-tight mb-1">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          {ctaLabel ?? (variant === 'event' ? 'Learn more' : 'Explore')}
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </div>
    </article>
  )
}
