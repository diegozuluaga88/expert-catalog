// Zero-results de la Library (2026-08-28)
// ────────────────────────────────────────
// Reemplaza el "No manufacturers found · Try adjusting your filters or
// search", que era literalmente el callejón sin salida que Jeff dice no
// querer: "We never want to have a Zero result or dead end" (SEARCH-11).
// Hallazgo H4-4 del UX-REVIEW, severidad 4.
//
// El SOW v5 §9.1 especifica cinco salidas. Esta implementación las cubre
// con datos del seed real · nada inventado:
//
//   1. Alternativas · qué filtro concreto dejó la lista vacía, quitable
//      de un clic. Se calcula recomputando sin cada filtro, no se adivina.
//   2. Corrección ortográfica · match más cercano por distancia de
//      edición contra los nombres reales de la librería activa.
//   3. Taxonomía relacionada · categorías que sí devuelven marcas.
//   4. Conceptos más amplios · quitar todos los filtros.
//   5. "Not currently indexed" · cuando nada de lo anterior aplica, se
//      dice explícitamente en vez de fingir que el término no existe.
//
// Un buen mensaje de error tiene tres partes —qué pasó, por qué, y cómo
// salir— y el anterior solo tenía la primera (Nielsen H9).

import { PackageSearch, Search, Tag, LayoutGrid, BookMarked, RotateCcw } from 'lucide-react'
import type { Manufacturer } from '../types'
import { matchesCategoryAlias } from '../data/categoryAliases'

interface LibraryEmptyStateProps {
    /** Lista completa de la librería activa, sin filtrar. */
    baseList: Manufacturer[]
    search: string
    selectedCategory: string | null
    activeTags: Set<string>
    showMyBindersOnly: boolean
    myBinderIds: Set<string>
    /** Nombres de categoría candidatos del sidebar, para sugerir alternativas. */
    categoryCandidates: string[]
    onClearSearch: () => void
    onClearCategory: () => void
    onClearTags: () => void
    onClearBinders: () => void
    onClearAll: () => void
    onSelectCategory: (name: string) => void
}

/** Distancia de Levenshtein · para la corrección ortográfica. Implementada
 *  acá porque es ~20 líneas y no justifica una dependencia. */
function editDistance(a: string, b: string): number {
    const m = a.length
    const n = b.length
    if (m === 0) return n
    if (n === 0) return m
    let prev = Array.from({ length: n + 1 }, (_, j) => j)
    for (let i = 1; i <= m; i++) {
        const curr = [i]
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
        }
        prev = curr
    }
    return prev[n]
}

export default function LibraryEmptyState({
    baseList,
    search,
    selectedCategory,
    activeTags,
    showMyBindersOnly,
    myBinderIds,
    categoryCandidates,
    onClearSearch,
    onClearCategory,
    onClearTags,
    onClearBinders,
    onClearAll,
    onSelectCategory,
}: LibraryEmptyStateProps) {
    // ── Aplica todos los filtros salvo el que se pase en `skip`.
    const countWithout = (skip: 'search' | 'category' | 'tags' | 'binders') =>
        baseList.filter(m => {
            const okSearch = skip === 'search' || search === '' || m.name.toLowerCase().includes(search.toLowerCase())
            const okCategory = skip === 'category' || selectedCategory === null
                || matchesCategoryAlias(m.categories.map(c => c.name), selectedCategory)
            const okTags = skip === 'tags' || activeTags.size === 0 || (m.tags?.some(t => activeTags.has(t)) ?? false)
            const okBinders = skip === 'binders' || !showMyBindersOnly || myBinderIds.has(m.id)
            return okSearch && okCategory && okTags && okBinders
        }).length

    // ── 1 · Qué filtro concreto está dejando la lista vacía. Solo se
    //      ofrece quitar los que de verdad desbloquean resultados.
    const culprits: { key: string; label: string; count: number; Icon: typeof Search; onClear: () => void }[] = []
    if (search !== '' && countWithout('search') > 0) {
        culprits.push({ key: 'search', label: `Search “${search}”`, count: countWithout('search'), Icon: Search, onClear: onClearSearch })
    }
    if (selectedCategory && countWithout('category') > 0) {
        culprits.push({ key: 'category', label: `Category “${selectedCategory}”`, count: countWithout('category'), Icon: LayoutGrid, onClear: onClearCategory })
    }
    if (activeTags.size > 0 && countWithout('tags') > 0) {
        culprits.push({ key: 'tags', label: activeTags.size === 1 ? '1 tag filter' : `${activeTags.size} tag filters`, count: countWithout('tags'), Icon: Tag, onClear: onClearTags })
    }
    if (showMyBindersOnly && countWithout('binders') > 0) {
        culprits.push({ key: 'binders', label: 'Custom Library only', count: countWithout('binders'), Icon: BookMarked, onClear: onClearBinders })
    }

    // ── 2 · Corrección ortográfica contra los nombres reales.
    const q = search.trim().toLowerCase()
    let didYouMean: Manufacturer | null = null
    if (q.length >= 3 && culprits.every(c => c.key !== 'search')) {
        let best: { m: Manufacturer; d: number } | null = null
        for (const m of baseList) {
            const name = m.name.toLowerCase()
            // Distancia sobre el prefijo del mismo largo · así "camria"
            // encuentra "Camira" sin que el largo del nombre lo penalice.
            const d = editDistance(q, name.slice(0, q.length))
            if (d <= Math.max(1, Math.floor(q.length / 3)) && (!best || d < best.d)) best = { m, d }
        }
        didYouMean = best?.m ?? null
    }

    // ── 3 · Categorías que sí devuelven marcas · taxonomía relacionada.
    const workingCategories = categoryCandidates
        .map(name => ({
            name,
            count: baseList.filter(m => matchesCategoryAlias(m.categories.map(c => c.name), name)).length,
        }))
        .filter(c => c.count > 0 && c.name !== selectedCategory)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)

    const anyFilterActive = search !== '' || selectedCategory !== null || activeTags.size > 0 || showMyBindersOnly
    // ── 5 · Nada de lo anterior desbloquea · el término no está indexado.
    const notIndexed = culprits.length === 0 && !didYouMean && q.length > 0

    return (
        <div className="mx-auto max-w-lg py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <PackageSearch className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>

            <h3 className="text-base font-bold text-foreground">
                {q ? <>No results for “{search}”</> : 'No manufacturers match these filters'}
            </h3>

            {notIndexed && (
                <p className="mt-2 text-sm text-muted-foreground">
                    “{search}” isn’t in this library yet. It may be indexed under a different
                    name, or not carried at all.
                </p>
            )}

            {/* 2 · Corrección ortográfica */}
            {didYouMean && (
                <p className="mt-2 text-sm text-muted-foreground">
                    Did you mean{' '}
                    <button
                        type="button"
                        onClick={() => onClearSearch()}
                        className="font-semibold text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                    >
                        {didYouMean.name}
                    </button>
                    ?
                </p>
            )}

            {/* 1 · Qué filtro lo causó · cada uno quitable, con el resultado que desbloquea */}
            {culprits.length > 0 && (
                <div className="mt-5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Remove a filter
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {culprits.map(({ key, label, count, Icon, onClear }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={onClear}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted hover:border-primary/50"
                            >
                                <Icon className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                                <span>{label}</span>
                                <span className="text-muted-foreground tabular-nums">→ {count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 3 · Taxonomía relacionada */}
            {workingCategories.length > 0 && (
                <div className="mt-5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Browse these instead
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {workingCategories.map(({ name, count }) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => onSelectCategory(name)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted hover:border-primary/50"
                            >
                                <span>{name}</span>
                                <span className="text-muted-foreground tabular-nums">{count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 4 · Concepto más amplio · quitar todo */}
            {anyFilterActive && (
                <button
                    type="button"
                    onClick={onClearAll}
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    Clear all filters
                </button>
            )}
        </div>
    )
}
