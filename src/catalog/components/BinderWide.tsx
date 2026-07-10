// MRL Fase 3 revisión (2026-07-09) · BinderWide sin imagen.
//
// Diego ask · el height fijo de todos los binders + eliminar las imágenes
// centrales del wide. Ahora el wide se ve como un spine más ancho con logo
// horizontal centrado (patrón de los binders "DEKKO", "DECCA" del referente)
// en vez de un frame con foto. Mantiene coherencia con los spine narrow.

import { Check } from 'lucide-react'
import type { Manufacturer } from '../types'

interface BinderWideProps {
  manufacturer: Manufacturer
  onClick: () => void
  isInMyBinders?: boolean
  onToggleBinder?: (id: string) => void
}

const SPINE_HEIGHT = 'h-56'  // idéntico al de BinderSpine para alineación
const WIDE_WIDTH = 'w-24'    // 96px · ~1.7x el md (w-14) para presencia sin excederse

export default function BinderWide({
  manufacturer,
  onClick,
  isInMyBinders = false,
  onToggleBinder,
}: BinderWideProps) {
  const displayLabel = manufacturer.binderLabel ?? manufacturer.name

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
    // `hover:z-50` sube el binder + tooltip por encima de los adyacentes
    // (mismo fix que BinderSpine · Diego report 2026-07-10).
    <div className="group/binder relative flex flex-col items-center hover:z-50">
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={`Open ${manufacturer.name} catalog`}
        className={`relative flex flex-col items-center cursor-pointer ${WIDE_WIDTH}`}
      >
        {/* Wide body · height idéntico al spine, ancho mayor, logo horizontal
            centrado. Sin imagen central (decisión Diego 2026-07-09). */}
        <div
          className={`relative flex w-full flex-col items-center justify-between rounded-t-sm shadow-md transition-all duration-200 group-hover/binder:scale-105 group-hover/binder:shadow-lg dark:group-hover/binder:shadow-glow-md group-hover/binder:-translate-y-1 ${SPINE_HEIGHT} px-3 py-4`}
          style={{ backgroundColor: manufacturer.bgColor }}
        >
          {/* Left binding strip · mismo detalle que spine narrow */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 rounded-tl-sm opacity-30"
            style={{ backgroundColor: manufacturer.textColor }}
          />
          {/* Right binding strip · da la sensación de binder "grueso" */}
          <div
            className="absolute right-0 top-0 bottom-0 w-2 rounded-tr-sm opacity-30"
            style={{ backgroundColor: manufacturer.textColor }}
          />

          {/* Logo horizontal centrado */}
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <div
              className="text-[13px] font-bold uppercase tracking-widest leading-tight px-1"
              style={{ color: manufacturer.textColor }}
            >
              {displayLabel}
            </div>
            {manufacturer.tagline && (
              <div
                className="text-[8px] font-medium uppercase tracking-widest leading-tight opacity-70 px-1"
                style={{ color: manufacturer.textColor }}
              >
                {manufacturer.tagline}
              </div>
            )}
          </div>

          {/* Bottom circle · stateful (idéntico al de BinderSpine) */}
          <button
            type="button"
            onClick={handleToggleClick}
            aria-label={isInMyBinders ? `Remove ${manufacturer.name} from favorites` : `Add ${manufacturer.name} to favorites`}
            className="group/dot relative p-2 rounded-full"
            style={{ color: manufacturer.textColor }}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                isInMyBinders
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-transparent opacity-40 group-hover/dot:opacity-100'
              }`}
              style={{ borderColor: isInMyBinders ? undefined : 'currentColor' }}
            >
              {isInMyBinders && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-[70] whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background opacity-0 invisible transition-opacity duration-150 delay-200 group-hover/dot:opacity-100 group-hover/dot:visible"
            >
              {isInMyBinders ? 'Remove from favorites' : 'Add to favorites'}
            </span>
          </button>
        </div>

        {/* Bottom tab */}
        <div
          className="w-full h-2 rounded-b-sm"
          style={{ backgroundColor: manufacturer.bgColor, filter: 'brightness(0.8)' }}
        />
      </div>

      {/* Full binder tooltip on hover */}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-[65] whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background opacity-0 invisible transition-all duration-150 delay-200 group-hover/binder:opacity-100 group-hover/binder:visible"
      >
        {manufacturer.name}
      </span>
    </div>
  )
}
