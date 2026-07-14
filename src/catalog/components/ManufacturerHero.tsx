// MRL Detail Fase D5 (2026-07-10) · ManufacturerHero.
//
// Extrae el bloque hero-media del ManufacturerPage para dejar el flujo
// principal limpio. Aporta:
// - Botones flotantes top-right: expand (modal fullscreen) + download
//   (mock, dispara el asset href download).
// - Overlay tagline con backdrop-blur (WCAG legibilidad).
// - Modal fullscreen que muestra la imagen completa con background dim.
//
// Todos los tokens semánticos · sin `text-white`/`from-black`/hex JSX.

import { useState } from 'react'
import { ArrowsPointingOutIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { PlayIcon } from '@heroicons/react/24/solid'
import type { Manufacturer } from '../types'

interface ManufacturerHeroProps {
  manufacturer: Manufacturer
}

export default function ManufacturerHero({ manufacturer }: ManufacturerHeroProps) {
  const [expanded, setExpanded] = useState(false)
  const hasImage = Boolean(manufacturer.heroImage)

  return (
    <>
      <div
        className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border group/hero"
        style={{ backgroundColor: manufacturer.bgColor }}
      >
        {hasImage && (
          <img
            src={manufacturer.heroImage}
            alt={manufacturer.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Floating action buttons · top-right · aparecen siempre pero con
            hover state que mejora affordance en imágenes claras. */}
        {hasImage && (
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="Expand hero image"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <a
              href={manufacturer.heroImage}
              download
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download hero image"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
            >
              <ArrowDownTrayIcon className="h-4 w-4" strokeWidth={2.5} />
            </a>
          </div>
        )}

        {/* Overlay tagline · glass pill sobre imagen con backdrop-blur.
            Fondo foreground/50 garantiza contraste WCAG del text-background. */}
        {manufacturer.heroTagline && (
          <div className="absolute inset-x-0 bottom-0 p-5">
            <span className="inline-block rounded-lg bg-foreground/50 backdrop-blur-sm px-4 py-2 text-sm font-medium text-background">
              {manufacturer.heroTagline}
            </span>
          </div>
        )}

        {/* Video overlay · si el brand marca heroIsVideo, la portada se
            renderiza como thumbnail de video con play icon central + duration
            badge (mock del referente MRL · Artcobell/Tayco). Diego decisión
            2026-07-10 · el video vive SOLO en el hero, no en category cards. */}
        {manufacturer.heroIsVideo && hasImage && (
          <>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-foreground/25 group-hover/hero:bg-foreground/15 transition-colors pointer-events-none"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm shadow-lg ring-1 ring-border transition-transform duration-300 group-hover/hero:scale-110">
                <PlayIcon className="h-7 w-7 text-foreground translate-x-0.5" />
              </span>
            </div>
            {manufacturer.heroDuration && (
              <div className="absolute bottom-3 right-3 inline-flex items-center rounded bg-foreground/80 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-background tabular-nums shadow-md">
                {manufacturer.heroDuration}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fullscreen modal · Nielsen H3 · user control (close button + esc
          via click en el backdrop). */}
      {expanded && hasImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${manufacturer.name} · hero image`}
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/85 backdrop-blur-sm p-6 cursor-pointer"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(false)
            }}
            aria-label="Close fullscreen"
            className="absolute top-6 right-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground shadow-lg hover:opacity-90 transition-opacity"
          >
            <XMarkIcon className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <img
            src={manufacturer.heroImage}
            alt={manufacturer.name}
            className="max-h-full max-w-full object-contain rounded-lg cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
