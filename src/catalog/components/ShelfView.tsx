// MRL Fase 4 (2026-07-09) · ShelfView refactor.
//
// Cambios vs versión anterior:
// - BINDERS_PER_SHELF de 14 → 8 · con 35 manufacturers ahora se ven 3 filas
//   por tab (Products) y 4 filas (Materials con los binderCount altos).
// - Textura brick suavizada · líneas horizontales `opacity-[0.015]` en vez
//   del pattern 2D que se leía como cuadrícula (Nielsen H2/H8).
// - Spacing entre binders aumentado (gap-2) + padding vertical mayor.
// - Chip de filtro activo (Nielsen H1 · visibility of system status) arriba
//   del primer shelf cuando `showMyBindersOnly === true`.
// - Filtra por `myBinderIds` cuando el flag está prendido · el wire real
//   del sidebar llega en Fase 6.

import { X } from 'lucide-react'
import type { Manufacturer } from '../types'
import BinderLibrary from './BinderLibrary'
import type { ToastAction, ToastType } from '../../components/AuthToast'

interface ShelfViewProps {
  manufacturers: Manufacturer[]
  onSelect: (m: Manufacturer) => void
  /** MRL Fase 3 · pipe hacia BinderLibrary para feedback del My Binders toggle. */
  onToast?: (type: ToastType, message: string, action?: ToastAction) => void
  /** MRL Fase 4 · si true, filtra el shelf a solo los IDs de My Binders. */
  showMyBindersOnly?: boolean
  /** MRL Fase 4 · Set de IDs guardados en My Binders (viene del hook a
   *  través de LibraryPage · Fase 6 lo wire desde el sidebar). */
  myBinderIds?: Set<string>
  /** MRL Fase 4 · callback del chip para limpiar el filtro. */
  onClearFilter?: () => void
}

const BINDERS_PER_SHELF = 8

export default function ShelfView({
  manufacturers,
  onSelect,
  onToast,
  showMyBindersOnly = false,
  myBinderIds,
  onClearFilter,
}: ShelfViewProps) {
  // Aplicar filtro My Binders si está activo · precede al expand por
  // binderCount para que las copias también se filtren correctamente.
  const filtered = showMyBindersOnly && myBinderIds
    ? manufacturers.filter(m => myBinderIds.has(m.id))
    : manufacturers

  // Expand manufacturers with multiple binders (e.g. Camira Fabrics with binderCount=4)
  const expanded: Array<{ manufacturer: Manufacturer; label: string; index: number }> = []
  for (const m of filtered) {
    const count = m.binderCount ?? 1
    if (count > 1) {
      for (let i = 0; i < count; i++) {
        expanded.push({ manufacturer: m, label: `${m.binderLabel ?? m.name} ${i + 1}`, index: i })
      }
    } else {
      expanded.push({ manufacturer: m, label: m.binderLabel ?? m.name, index: 0 })
    }
  }

  // Split into rows
  const rows: typeof expanded[] = []
  for (let i = 0; i < expanded.length; i += BINDERS_PER_SHELF) {
    rows.push(expanded.slice(i, i + BINDERS_PER_SHELF))
  }

  const filterCount = filtered.length

  return (
    <div className="space-y-4">
      {/* Chip de filtro activo · Nielsen H1 · visibility of system status */}
      {showMyBindersOnly && (
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-foreground">
          <span>Filtered · My Binders ({filterCount})</span>
          {onClearFilter && (
            <button
              type="button"
              onClick={onClearFilter}
              aria-label="Clear My Binders filter"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="relative">
          {/* Shelf background · brick sutil */}
          <div className="relative bg-muted/30 border border-border/60 rounded-lg px-6 pt-8 pb-4 overflow-hidden">
            {/* Textura brick sutil · solo líneas horizontales (Nielsen H2 · match real world · H8 · aesthetic).
                Fase 7 · usar `hsl(var(--foreground))` en vez de #000 para respetar dark mode del DS. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_24px,var(--foreground)_24px,var(--foreground)_25px)]"
            />

            {/* Binders row */}
            <div className="flex items-end gap-2 flex-wrap min-h-[240px] relative z-10">
              {row.map((item, i) => (
                <BinderLibrary
                  key={`${item.manufacturer.id}-${item.index}-${i}`}
                  manufacturer={item.manufacturer}
                  label={item.label}
                  onClick={() => onSelect(item.manufacturer)}
                  onToast={onToast}
                />
              ))}
            </div>
          </div>

          {/* Shelf plank · madera warm · gradient decorativo intencional (no forma
              parte del DS · replica la metáfora de estantería del referente MRL).
              Los tonos son constantes visuales del prop de estantería, análogos
              a los `bgColor`/`textColor` del seed de manufacturers. */}
          <div className="h-3 bg-gradient-to-b from-[#c8a96e] to-[#a07850] rounded-b-sm shadow-md" />
        </div>
      ))}

      {/* Empty state cuando el filtro deja 0 · Nielsen H8 aesthetic */}
      {rows.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <p className="text-sm font-medium text-foreground">No binders to show</p>
          <p className="text-xs text-muted-foreground mt-1">
            {showMyBindersOnly
              ? 'You haven\'t saved any binders to My Binders yet · click the circle on any binder to add it.'
              : 'Try adjusting your search or category filter.'}
          </p>
        </div>
      )}
    </div>
  )
}
