// F50 · Etapa 9 (P1 search) · v2 · command palette style search.
//
// Modal centrado con input al top y resultados agrupados debajo. Se abre
// con `/` desde el catálogo (ver ShowroomPageV2). Integra:
//   · Historial persistido por-cliente (useSearchHistory)
//   · Parser NL de la query (nlSearchParser) → chip "Understood" con
//     botón "Apply filters" que aplica los filtros extraídos al showroom
//   · Reranker mock que sube productos de brands ya guardadas en las
//     colecciones + productos vistos recientemente
//   · Placeholder de visual search (botón cámara · abre VisualSearchModal)
//
// Los resultados se agrupan en 4 secciones:
//   1. Products (matches por nombre + brand + category en UNIFIED_PRODUCTS)
//   2. Brands (matches por nombre del manufacturer)
//   3. Categories (matches por nombre de categoría)
//   4. Recent + suggestions (cuando el input está vacío)
//
// Skills · Nielsen H6 (Recognition · muestra recientes) + Norman
// Discoverability (atajo `/` en la UI) + Refactoring UI · Depth.

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    Search,
    X,
    Clock,
    Sparkles,
    Camera,
    Wand2,
    ArrowUpRight,
    Trash2,
    Eye,
} from 'lucide-react'
import type { Product, Manufacturer } from '../types'
import { useSearchHistory } from './useSearchHistory'
import { useSessionActivity } from './useSessionActivity'
import { parseNaturalQuery, hasStructuredHints, type ParsedQuery } from './nlSearchParser'
import { useMyBinders } from '../browse/useMyBinders'

export interface SearchApplyFilters {
    text: string
    category?: string
    tags?: string[]
    minPrice?: number
    maxPrice?: number
    maxLeadWeeks?: number
}

interface SearchCommandPaletteProps {
    open: boolean
    onClose: () => void
    products: Product[]
    manufacturers: Manufacturer[]
    /** Se llama cuando el user apply los filtros parseados NL · el consumidor
     *  wire los sets del ShowroomPageV2 y cierra el palette. */
    onApplyStructuredFilters: (filters: SearchApplyFilters) => void
    /** Se llama cuando el user solo quiere plain-text search sin filtros
     *  estructurados. El consumidor setea `setSearch(query)`. */
    onApplyFreeText: (text: string) => void
    /** Se llama al elegir un producto de los resultados · el consumidor
     *  abre el detail. */
    onOpenProduct: (productId: string) => void
    /** Se llama al elegir una brand de los resultados. */
    onOpenBrand: (brandName: string) => void
    /** Se llama al elegir una categoría de los resultados. */
    onOpenCategory: (category: string) => void
    /** Se llama para abrir el visual search stub. Cuando `showVisualSearch`
     *  es false, este handler no se invoca (el botón cámara se oculta). */
    onOpenVisualSearch?: () => void
    /** F50 · Etapa 9 (extensión MRL) · si false, oculta el botón cámara de
     *  visual search. Default true. Se pasa false desde LibraryPageV2 porque
     *  el visual search apunta a productos y el MRL indexa por fabricante. */
    showVisualSearch?: boolean
    /** Placeholder personalizable. Default apropiado para Product Catalog. */
    placeholder?: string
    /** F50 · Etapa 9 (integración search unificado) · si el palette se abre
     *  desde un input inline que ya tiene texto (search actual del showroom
     *  o library), lo pre-carga para no forzar retype. Se aplica cada vez
     *  que `open` cambia de false a true. */
    initialQuery?: string
}

const MAX_PER_GROUP = 5

export default function SearchCommandPalette({
    open,
    onClose,
    products,
    manufacturers,
    onApplyStructuredFilters,
    onApplyFreeText,
    onOpenProduct,
    onOpenBrand,
    onOpenCategory,
    onOpenVisualSearch,
    showVisualSearch = true,
    placeholder = 'Search products, brands, categories · try "chairs under $500 quickship"',
    initialQuery = '',
}: SearchCommandPaletteProps) {
    const [query, setQuery] = useState(initialQuery)
    const { history, push: pushHistory, remove: removeHistory, clear: clearHistory } = useSearchHistory()
    const { viewedProductIds, recordView } = useSessionActivity()
    const { myBinderIds } = useMyBinders()

    // F50 · Etapa 9 (integración) · cuando el palette se abre, pre-carga
    // initialQuery (típicamente el search actual del showroom/library). Al
    // cerrar, resetea a vacío para que la próxima apertura re-hidrate
    // desde el prop.
    useEffect(() => {
        if (open) {
            setQuery(initialQuery)
        } else {
            setQuery('')
        }
    }, [open, initialQuery])

    // Brands guardadas · la Custom Library del usuario (ROLE-7).
    //
    // Antes se derivaban de `useCollections().savedProductIds`, y ese set
    // quedó permanentemente vacío al retirar el Showroom: era la única
    // superficie donde se podían guardar productos. O sea que el ranking
    // personalizado —y el aviso "Ranked by your saved brands"— existían
    // pero nunca se activaban (UX-REVIEW · H3-2).
    //
    // La fuente correcta es directa y es la que el scope nombra: las
    // marcas que el usuario guardó en su Custom Library. Derivar marcas
    // desde productos guardados era el rodeo, no el concepto.
    const savedBrands = useMemo(() => {
        const set = new Set<string>()
        for (const m of manufacturers) {
            if (myBinderIds.has(m.id)) set.add(m.name)
        }
        return set
    }, [manufacturers, myBinderIds])

    // Recent viewed product objects (para render en el bloque de recents).
    const recentViewed = useMemo(() => {
        return viewedProductIds
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is Product => !!p)
            .slice(0, MAX_PER_GROUP)
    }, [viewedProductIds, products])

    const parsed: ParsedQuery = useMemo(() => parseNaturalQuery(query), [query])
    const structured = hasStructuredHints(parsed)
    // Solo el freeText residual va como plain text match. Antes usaba fallback
    // al query completo cuando el parser consumía todo (ej: "chairs under $500"
    // dejaba freeText vacío y caía al query original que no matchea nada).
    const effectiveText = parsed.freeText.toLowerCase().trim()

    // Filtro base de products (usando ya los hints estructurados, así los
    // resultados en vivo respetan la interpretación NL).
    const productResults = useMemo(() => {
        if (query.trim() === '') return []
        const list = products.filter((p) => {
            if (effectiveText) {
                const hay = `${p.name} ${p.brand ?? ''} ${p.category ?? ''}`.toLowerCase()
                if (!hay.includes(effectiveText)) return false
            }
            if (parsed.category && p.category !== parsed.category) return false
            if (parsed.tags.length > 0 && !(parsed.tags.some((t) => p.tags?.includes(t)))) return false
            if (parsed.minPrice !== undefined && (p.price ?? 0) < parsed.minPrice) return false
            if (parsed.maxPrice !== undefined && (p.price ?? Number.MAX_SAFE_INTEGER) > parsed.maxPrice) return false
            return true
        })
        // Session-aware reranker mock · empuja arriba productos de brands
        // guardadas y productos vistos recientemente.
        const viewedRank = new Map<string, number>()
        viewedProductIds.forEach((id, i) => viewedRank.set(id, viewedProductIds.length - i))
        list.sort((a, b) => {
            const savedA = a.brand && savedBrands.has(a.brand) ? 2 : 0
            const savedB = b.brand && savedBrands.has(b.brand) ? 2 : 0
            const viewA = viewedRank.get(a.id) ?? 0
            const viewB = viewedRank.get(b.id) ?? 0
            return (savedB + viewB) - (savedA + viewA)
        })
        return list.slice(0, MAX_PER_GROUP)
    }, [query, products, effectiveText, parsed, viewedProductIds, savedBrands])

    const brandResults = useMemo(() => {
        if (query.trim() === '') return []
        // Match por nombre (existing) + brands que tienen la category detectada
        // por el NL parser en su lineup (útil para MRL donde products=[] y sin
        // esto una query como "chairs under $500" no devolvería nada).
        const set = new Map<string, Manufacturer>()
        if (effectiveText) {
            manufacturers
                .filter((m) => m.name.toLowerCase().includes(effectiveText))
                .forEach((m) => set.set(m.id, m))
        }
        if (parsed.category) {
            manufacturers
                .filter((m) => m.categories?.some((c) => c.name === parsed.category))
                .forEach((m) => set.set(m.id, m))
        }
        return Array.from(set.values()).slice(0, MAX_PER_GROUP)
    }, [query, effectiveText, manufacturers, parsed.category])

    const categoryResults = useMemo(() => {
        if (query.trim() === '') return []
        const set = new Set<string>()
        // Category detectada por el NL parser · siempre entra primero.
        if (parsed.category) set.add(parsed.category)
        // Categories que matchean el freeText en el catálogo de productos.
        if (effectiveText) {
            for (const p of products) {
                if (p.category && p.category.toLowerCase().includes(effectiveText)) {
                    set.add(p.category)
                }
            }
            // Fallback · categories declaradas por los manufacturers (útil para
            // MRL donde products=[]).
            for (const m of manufacturers) {
                for (const c of m.categories ?? []) {
                    if (c.name.toLowerCase().includes(effectiveText)) set.add(c.name)
                }
            }
        }
        return Array.from(set).slice(0, MAX_PER_GROUP)
    }, [query, effectiveText, parsed.category, products, manufacturers])

    const hasAnyResult = productResults.length + brandResults.length + categoryResults.length > 0

    const commitAndClose = () => {
        pushHistory(query)
        onClose()
    }

    const handleApplyStructured = () => {
        pushHistory(query)
        onApplyStructuredFilters({
            text: parsed.freeText,
            category: parsed.category,
            tags: parsed.tags,
            minPrice: parsed.minPrice,
            maxPrice: parsed.maxPrice,
            maxLeadWeeks: parsed.maxLeadWeeks,
        })
        onClose()
    }

    const handleApplyFreeText = () => {
        pushHistory(query)
        onApplyFreeText(query)
        onClose()
    }

    return (
        <Transition show={open} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-[80]">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-150"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-start justify-center p-4 pt-[10vh]">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-150"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-100"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-card shadow-2xl overflow-hidden">
                            {/* Header · input + camera + close */}
                            <div className="flex items-center gap-2 border-b border-border px-4">
                                <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            if (structured) handleApplyStructured()
                                            else handleApplyFreeText()
                                        }
                                    }}
                                    placeholder={placeholder}
                                    className="flex-1 bg-transparent py-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                                    aria-label="Search catalog"
                                />
                                {showVisualSearch && onOpenVisualSearch && (
                                    <button
                                        type="button"
                                        onClick={onOpenVisualSearch}
                                        aria-label="Visual search (upload an image)"
                                        title="Visual search · upload an image to find similar products"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close search"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* NL Understood chips + Apply CTA */}
                            {structured && (
                                <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-4 py-2.5">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                                        <Wand2 className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                                        Understood
                                    </span>
                                    {parsed.understood.map((chip, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center rounded-full border border-primary/30 bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground"
                                        >
                                            {chip}
                                        </span>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleApplyStructured}
                                        className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                        Apply filters
                                        <ArrowUpRight className="h-3 w-3" />
                                    </button>
                                </div>
                            )}

                            {/* Body · resultados o empty state */}
                            <div className="scrollbar-mrl max-h-[60vh] overflow-y-auto p-3">
                                {query.trim() === '' ? (
                                    /* Empty state · recientes + productos vistos */
                                    <div className="space-y-4">
                                        {history.length > 0 && (
                                            <Section
                                                title="Recent searches"
                                                icon={<Clock className="h-3 w-3" />}
                                                trailing={
                                                    <button
                                                        type="button"
                                                        onClick={clearHistory}
                                                        className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        Clear
                                                    </button>
                                                }
                                            >
                                                {history.map((q) => (
                                                    <div key={q} className="group flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuery(q)}
                                                            className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
                                                        >
                                                            <Clock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                                                            <span className="truncate">{q}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeHistory(q)}
                                                            aria-label={`Remove "${q}" from recent`}
                                                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </Section>
                                        )}
                                        {recentViewed.length > 0 && (
                                            <Section title="Recently viewed" icon={<Eye className="h-3 w-3" />}>
                                                {recentViewed.map((p) => (
                                                    <ProductRow
                                                        key={p.id}
                                                        product={p}
                                                        onSelect={() => {
                                                            recordView(p.id)
                                                            onOpenProduct(p.id)
                                                            commitAndClose()
                                                        }}
                                                    />
                                                ))}
                                            </Section>
                                        )}
                                        {history.length === 0 && recentViewed.length === 0 && (
                                            <div className="py-8 text-center text-sm text-muted-foreground">
                                                Start typing to search products, brands, or categories.<br />
                                                <span className="text-xs">
                                                    Try <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">chairs under $500</kbd>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : hasAnyResult ? (
                                    /* Resultados · agrupados */
                                    <div className="space-y-4">
                                        {productResults.length > 0 && (
                                            <Section
                                                title="Products"
                                                icon={<Sparkles className="h-3 w-3" />}
                                                trailing={
                                                    savedBrands.size > 0 && (
                                                        <span className="text-[10px] text-muted-foreground italic">
                                                            Ranked by your saved brands + recent views
                                                        </span>
                                                    )
                                                }
                                            >
                                                {productResults.map((p) => (
                                                    <ProductRow
                                                        key={p.id}
                                                        product={p}
                                                        savedBrand={p.brand ? savedBrands.has(p.brand) : false}
                                                        onSelect={() => {
                                                            pushHistory(query)
                                                            recordView(p.id)
                                                            onOpenProduct(p.id)
                                                            onClose()
                                                        }}
                                                    />
                                                ))}
                                            </Section>
                                        )}
                                        {brandResults.length > 0 && (
                                            <Section title="Brands">
                                                {brandResults.map((m) => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => {
                                                            pushHistory(query)
                                                            onOpenBrand(m.name)
                                                            onClose()
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
                                                    >
                                                        <div
                                                            className="h-5 w-5 shrink-0 rounded"
                                                            style={{ background: m.bgColor, color: m.textColor }}
                                                            aria-hidden="true"
                                                        />
                                                        <span className="font-semibold truncate">{m.name}</span>
                                                    </button>
                                                ))}
                                            </Section>
                                        )}
                                        {categoryResults.length > 0 && (
                                            <Section title="Categories">
                                                {categoryResults.map((c) => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => {
                                                            pushHistory(query)
                                                            onOpenCategory(c)
                                                            onClose()
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
                                                    >
                                                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold uppercase text-muted-foreground">
                                                            {c[0]}
                                                        </span>
                                                        <span className="font-semibold truncate">{c}</span>
                                                    </button>
                                                ))}
                                            </Section>
                                        )}
                                    </div>
                                ) : (
                                    /* Sin resultados */
                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                        No results for "<span className="font-semibold text-foreground">{query}</span>".<br />
                                        <button
                                            type="button"
                                            onClick={handleApplyFreeText}
                                            className="mt-2 inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent transition-colors"
                                        >
                                            Search anyway with "{query}"
                                            <ArrowUpRight className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Footer · hints */}
                            <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-3">
                                    <span>
                                        <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">↑↓</kbd> navigate
                                    </span>
                                    <span>
                                        <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">Enter</kbd> select
                                    </span>
                                    <span>
                                        <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">Esc</kbd> close
                                    </span>
                                </div>
                                <span>
                                    Open with <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">/</kbd>
                                </span>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}

/* ─── Presentational ────────────────────────────────────────────────── */

function Section({
    title,
    icon,
    trailing,
    children,
}: {
    title: string
    icon?: React.ReactNode
    trailing?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <section>
            <div className="mb-1 flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {icon}
                <span>{title}</span>
                {trailing && <span className="ml-auto normal-case tracking-normal">{trailing}</span>}
            </div>
            <ul className="space-y-0.5">
                {Array.isArray(children)
                    ? (children as React.ReactNode[]).map((c, i) => <li key={i}>{c}</li>)
                    : <li>{children}</li>}
            </ul>
        </section>
    )
}

function ProductRow({
    product,
    savedBrand,
    onSelect,
}: {
    product: Product
    savedBrand?: boolean
    onSelect: () => void
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-muted transition-colors"
        >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                    {product.brand}
                    {savedBrand && (
                        <span className="ml-1.5 inline-flex items-center rounded-sm bg-primary px-1 py-0 text-[9px] font-bold uppercase text-primary-foreground">
                            Saved
                        </span>
                    )}
                </p>
                <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
            </div>
            {product.price !== undefined && (
                <span className="shrink-0 text-xs font-semibold text-foreground">${product.price.toLocaleString()}</span>
            )}
        </button>
    )
}
