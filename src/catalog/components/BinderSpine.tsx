// MRL Fase 3 (2026-07-09) · BinderSpine refactor.
// Cambios vs versión anterior:
// - Prop `size?: 'sm' | 'md' | 'lg'` con clases Tailwind (adiós inline styles).
// - Prop opcional `tagline` para el subtext del referente (ej. "CONTRACT",
//   "Systems Casegoods") · Nielsen H2 · match real world.
// - Nombre debajo del binder ELIMINADO · Nielsen H8 · aesthetic +
//   H6 · recognition. En vez, tooltip on hover con `manufacturer.name`.
// - Círculo pasa a stateful (My Binders) con hitbox amplio (Fitts).
// - Shadow-glow DS-aligned al hover (dark mode).
//
// Tooltip pattern · CSS-only (group-hover) espejo del TabInfoTooltip
// existente · el bundle instalado del strata-design-system no expone
// Radix Tooltip en este proyecto.

import { Check } from 'lucide-react'
import type { Manufacturer } from '../types'

interface BinderSpineProps {
  manufacturer: Manufacturer
  onClick: () => void
  label?: string
  /** MRL Fase 3 · override del size que viene de `manufacturer.size`. */
  size?: 'sm' | 'md' | 'lg'
  /** MRL Fase 3 · estado "en My Binders" para el fill del círculo. */
  isInMyBinders?: boolean
  /** MRL Fase 3 · callback del toggle · dispara `stopPropagation`. */
  onToggleBinder?: (id: string) => void
}

/* ═════════════════════════════════════════════════════════════════════
   Size tokens · Tailwind classes puras (no inline).
   MRL Fase 3 revisión (2026-07-09) · Diego ask · el height es constante
   entre todos los tamaños para mantener la ilusión de estantería alineada.
   Solo el `spineWidth` varía · versión previa alteraba también el height
   y se veía inconsistente ("flotantes" los sm, sobresaltados los lg).
   ═════════════════════════════════════════════════════════════════════ */

interface SizeTokens {
  spineWidth: string
  labelSize: string
  taglineSize: string
}

const SPINE_HEIGHT = 'h-56'  // 224px · alto único para todos los tamaños
const LABEL_MAX_HEIGHT = 168 // px · cap del texto vertical dentro del spine

const SIZE_TOKENS: Record<'sm' | 'md' | 'lg', SizeTokens> = {
  sm: { spineWidth: 'w-11', labelSize: 'text-[10px]', taglineSize: 'text-[7px]' },
  md: { spineWidth: 'w-14', labelSize: 'text-[11px]', taglineSize: 'text-[8px]' },
  lg: { spineWidth: 'w-16', labelSize: 'text-[12px]', taglineSize: 'text-[9px]' },
}

export default function BinderSpine({
  manufacturer,
  onClick,
  label,
  size,
  isInMyBinders = false,
  onToggleBinder,
}: BinderSpineProps) {
  const effectiveSize = size ?? manufacturer.size ?? 'md'
  const tokens = SIZE_TOKENS[effectiveSize]
  const displayLabel = label ?? manufacturer.binderLabel ?? manufacturer.name

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (onToggleBinder) onToggleBinder(manufacturer.id)
  }

  return (
    // Outer group · el tooltip se abre al hover del binder completo.
    // `hover:z-50` sube el binder entero (incluidos sus tooltips) por encima
    // de los binders adyacentes en el shelf · sin esto el tooltip del círculo
    // se ve "recortado" por el binder siguiente en el DOM (Diego report
    // 2026-07-10).
    <div className="group/binder relative flex flex-col items-center hover:z-50">
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={`Open ${manufacturer.name} catalog`}
        className={`relative flex flex-col items-center cursor-pointer ${tokens.spineWidth}`}
      >
        {/* Binder body · height constante para todos los tamaños */}
        <div
          className={`relative flex items-center justify-center w-full rounded-t-sm shadow-md transition-all duration-200 group-hover/binder:scale-105 group-hover/binder:shadow-lg dark:group-hover/binder:shadow-glow-md group-hover/binder:-translate-y-1 ${SPINE_HEIGHT}`}
          style={{ backgroundColor: manufacturer.bgColor }}
        >
          {/* Spine binding detail (left strip) */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 rounded-tl-sm opacity-30"
            style={{ backgroundColor: manufacturer.textColor }}
          />

          {/* Vertical label + optional tagline */}
          <div className="flex items-center justify-center gap-1.5 px-1">
            <span
              className={`${tokens.labelSize} font-semibold tracking-widest uppercase select-none leading-tight text-center`}
              style={{
                writingMode: 'vertical-lr',
                transform: 'rotate(180deg)',
                color: manufacturer.textColor,
                maxHeight: LABEL_MAX_HEIGHT,
                overflow: 'hidden',
              }}
            >
              {displayLabel}
            </span>
            {manufacturer.tagline && (
              <span
                className={`${tokens.taglineSize} font-medium uppercase tracking-widest select-none leading-tight opacity-70`}
                style={{
                  writingMode: 'vertical-lr',
                  transform: 'rotate(180deg)',
                  color: manufacturer.textColor,
                  maxHeight: LABEL_MAX_HEIGHT * 0.7,
                  overflow: 'hidden',
                }}
              >
                {manufacturer.tagline}
              </span>
            )}
          </div>

          {/* Bottom circle · stateful My Binders toggle.
              Hitbox amplio (p-2) para Fitts · círculo visible se queda w-5 h-5. */}
          <button
            type="button"
            onClick={handleToggleClick}
            aria-label={isInMyBinders ? `Remove ${manufacturer.name} from favorites` : `Add ${manufacturer.name} to favorites`}
            className="group/dot absolute bottom-1 left-1/2 -translate-x-1/2 p-2 rounded-full"
            style={{ color: manufacturer.textColor }}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                isInMyBinders
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-transparent opacity-40 group-hover/dot:opacity-100'
              }`}
              style={{
                borderColor: isInMyBinders ? undefined : 'currentColor',
              }}
            >
              {isInMyBinders && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>

            {/* Dot mini tooltip · aparece solo al hover del círculo */}
            <span
              role="tooltip"
              className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-[70] whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background opacity-0 invisible transition-opacity duration-150 delay-200 group-hover/dot:opacity-100 group-hover/dot:visible"
            >
              {isInMyBinders ? 'Remove from favorites' : 'Add to favorites'}
            </span>
          </button>
        </div>

        {/* Binder bottom tab */}
        <div
          className="w-full h-2 rounded-b-sm"
          style={{ backgroundColor: manufacturer.bgColor, filter: 'brightness(0.8)' }}
        />
      </div>

      {/* Binder tooltip · aparece al hover del binder completo.
          Muestra el name (Nielsen H6 · recognition rather than recall). */}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-[65] whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background opacity-0 invisible transition-all duration-150 delay-200 group-hover/binder:opacity-100 group-hover/binder:visible"
      >
        {manufacturer.name}
      </span>
    </div>
  )
}
