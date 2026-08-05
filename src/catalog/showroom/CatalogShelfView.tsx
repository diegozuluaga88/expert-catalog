// F61 · CatalogShelfView (2026-08-06)
// Alternate al grid de ProductCatalogCardV2 en el Product Catalog. Renderea
// los brands del filtered set como binders verticales tipo estantería de
// biblioteca · mismo look que el MRL pero adaptado a la naturaleza del
// catálogo (sin volume expansion, sin My Binders).
//
// F61.1 · click en binder = drill-in · filtra a esa marca única + switch
// a grid view para que el user vea los productos inmediatamente. Antes
// era toggle sin cambiar de vista · el user reportó que "no vi productos".
// Ambos onClick del body y onToggleBinder del círculo disparan el mismo
// onSelectBrand · un solo path predecible.
//
// Reusa BinderSpineV2 / BinderWideV2 directamente (bypass del BinderLibraryV2
// wrapper que integra useMyBinders · concepto exclusivo del MRL). El
// checkmark visual del binder (isInMyBinders prop) se re-semantiza a
// "brand is currently in the filter" · útil cuando el user vuelve al shelf
// desde grid con un brand ya seleccionado.
//
// Layout · chunks de 8 binders por row · cada row wrappea los binders +
// wood shelf plank al fondo (mismo pattern visual de ShelfViewV2).

import { LibraryBig } from 'lucide-react'
import type { Manufacturer } from '../types'
import BinderSpineV2 from '../components/BinderSpineV2'
import BinderWideV2 from '../components/BinderWideV2'
import {
    EmptyState,
    EmptyStateIcon,
    EmptyStateTitle,
    EmptyStateDescription,
    EmptyStateActions,
} from 'strata-design-system'

interface CatalogShelfViewProps {
    /** Manufacturers ya filtrados + sorted por el consumer (ShowroomPageV2).
     *  El shelf no aplica filters internos · es un puro renderer de la lista
     *  que recibe. */
    manufacturers: Manufacturer[]
    /** Brands actualmente en el filter del sidebar · usado para el checkmark
     *  visual del binder cuando el user vuelve al shelf desde otra vista. */
    selectedBrands: Set<string>
    /** F61.1 · drill-in único · fires desde click en el binder body y desde
     *  click en el círculo (checkbox visual del BinderSpine). El consumer
     *  típicamente hace: set selectedBrands = {brandName} + switch a grid view
     *  + reset page · el user termina viendo los productos de esa marca. */
    onSelectBrand: (brandName: string) => void
    /** Callback opcional para el CTA "Clear filters" del empty state cuando
     *  el shelf queda vacío por filters muy específicos. */
    onClearFilters?: () => void
}

const BINDERS_PER_SHELF = 8

export default function CatalogShelfView({
    manufacturers,
    selectedBrands,
    onSelectBrand,
    onClearFilters,
}: CatalogShelfViewProps) {
    // Chunk en rows de BINDERS_PER_SHELF · no hay volume expansion (decisión
    // del user · 1 binder por brand en Product Catalog).
    const rows: Manufacturer[][] = []
    for (let i = 0; i < manufacturers.length; i += BINDERS_PER_SHELF) {
        rows.push(manufacturers.slice(i, i + BINDERS_PER_SHELF))
    }

    if (rows.length === 0) {
        return (
            <EmptyState>
                <EmptyStateIcon>
                    <LibraryBig className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                </EmptyStateIcon>
                <EmptyStateTitle>No brands match your filters</EmptyStateTitle>
                <EmptyStateDescription>
                    Try adjusting the search, category or price range filters to see brands here.
                </EmptyStateDescription>
                {onClearFilters && (
                    <EmptyStateActions>
                        <button
                            type="button"
                            onClick={onClearFilters}
                            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Clear filters
                        </button>
                    </EmptyStateActions>
                )}
            </EmptyState>
        )
    }

    return (
        <div className="space-y-4">
            {rows.map((row, rowIdx) => (
                <div key={rowIdx} className="relative">
                    <div className="relative bg-muted/30 border border-border/60 rounded-lg px-6 pt-8 pb-4 overflow-hidden">
                        <div className="flex items-end gap-2 flex-wrap min-h-[240px] relative z-10">
                            {row.map((m) => {
                                const selected = selectedBrands.has(m.name)
                                // Bypass BinderLibraryV2 (que integra useMyBinders del MRL)
                                // · render directo del componente que corresponde según
                                // manufacturer.variant.
                                if (m.variant === 'wide') {
                                    return (
                                        <BinderWideV2
                                            key={m.id}
                                            manufacturer={m}
                                            onClick={() => onSelectBrand(m.name)}
                                            isInMyBinders={selected}
                                            onToggleBinder={() => onSelectBrand(m.name)}
                                        />
                                    )
                                }
                                return (
                                    <BinderSpineV2
                                        key={m.id}
                                        manufacturer={m}
                                        onClick={() => onSelectBrand(m.name)}
                                        isInMyBinders={selected}
                                        onToggleBinder={() => onSelectBrand(m.name)}
                                        size="md"
                                    />
                                )
                            })}
                        </div>
                    </div>
                    {/* Shelf plank · madera warm · mismo pattern visual del MRL
                        para preservar la identidad de "estantería de biblioteca". */}
                    <div className="h-3 bg-gradient-to-b from-[#c8a96e] to-[#a07850] rounded-b-sm shadow-md" />
                </div>
            ))}
        </div>
    )
}
