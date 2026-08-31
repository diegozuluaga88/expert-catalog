// F50 · Wave 2 · v2 · duplicado de ShelfView.tsx. V1 queda intocada.
// Cambios vs v1:
//   · Wave 2.a · textura brick-wall del fondo del estante REMOVIDA por
//     completo (Laura: "very, very dated"). El estante ahora es una
//     superficie plana con `bg-muted/30`.
//   · Wave 2.c · empty state legacy (texto plano) reemplazado por el
//     componente EmptyState del design system, con ilustración de ícono
//     y CTA "Clear filter" cuando aplica.
//   · Importa BinderLibraryV2 para propagar Wave 2.e (save-binder al
//     100% de opacidad).
//
// Referencia legacy de v1:
// MRL Fase 4 (2026-07-09) · ShelfView refactor.

import { X, LibraryBig } from 'lucide-react'
import type { Manufacturer } from '../types'
import BinderLibrary from './BinderLibraryV2'
import type { ToastAction, ToastType } from '../../components/AuthToast'
import { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription, EmptyStateActions } from 'strata-design-system'

interface ShelfViewV2Props {
  manufacturers: Manufacturer[]
  onSelect: (m: Manufacturer) => void
  /** MRL Fase 3 · pipe hacia BinderLibrary para feedback del Custom Library toggle. */
  onToast?: (type: ToastType, message: string, action?: ToastAction) => void
  /** MRL Fase 4 · si true, filtra el shelf a solo los IDs de Custom Library. */
  showMyBindersOnly?: boolean
  /** MRL Fase 4 · Set de IDs guardados en Custom Library (viene del hook a
   *  través de LibraryPage · Fase 6 lo wire desde el sidebar). */
  myBinderIds?: Set<string>
  /** MRL Fase 4 · callback del chip para limpiar el filtro. */
  onClearFilter?: () => void
}

const BINDERS_PER_SHELF = 8

export default function ShelfViewV2({
  manufacturers,
  onSelect,
  onToast,
  showMyBindersOnly = false,
  myBinderIds,
  onClearFilter,
}: ShelfViewV2Props) {
  // Aplicar filtro Custom Library si está activo · precede al expand por
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
          <span>Filtered · Custom Library ({filterCount})</span>
          {onClearFilter && (
            <button
              type="button"
              onClick={onClearFilter}
              aria-label="Clear Custom Library filter"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="relative">
          {/* F50 · Wave 2.a · brick-wall texture REMOVIDA (Laura: "very, very
              dated"). El fondo del estante es ahora una superficie plana. */}
          <div className="relative bg-muted/30 border border-border/60 rounded-lg px-6 pt-8 pb-4 overflow-hidden">
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

          {/* Shelf plank · madera warm · preservada como constante visual
              del estante (no es la textura de fondo sino el "borde" del
              anaquel · Laura no la marcó como dated). */}
          <div className="h-3 bg-gradient-to-b from-[#c8a96e] to-[#a07850] rounded-b-sm shadow-md" />
        </div>
      ))}

      {/* F50 · Wave 2.c · empty state con ilustración + CTA. Reemplaza el
          texto plano legacy · reusa EmptyState del design system. */}
      {rows.length === 0 && (
        <EmptyState>
          <EmptyStateIcon>
            <LibraryBig className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </EmptyStateIcon>
          <EmptyStateTitle>No binders to show</EmptyStateTitle>
          <EmptyStateDescription>
            {showMyBindersOnly
              ? "You haven't saved any binders to Custom Library yet · click the circle on any binder to add it."
              : 'Try adjusting your search or category filter.'}
          </EmptyStateDescription>
          {showMyBindersOnly && onClearFilter && (
            <EmptyStateActions>
              <button
                type="button"
                onClick={onClearFilter}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Show all binders
              </button>
            </EmptyStateActions>
          )}
        </EmptyState>
      )}
    </div>
  )
}
