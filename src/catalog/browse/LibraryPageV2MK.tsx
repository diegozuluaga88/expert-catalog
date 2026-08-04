// F51 · B.2 · P3 Miller Knoll mirror skeleton (behind ?mkPreview=1).
//
// El PRD nuevo dice literal · "Miller Knoll built its own version of MRL
// with a cleaner category-browse layout, and Jeff's instinct is to
// **mirror it rather than recreate from scratch**". Los screenshots
// reales están pendientes, así que este file es un scaffold para no
// arrancar de cero cuando lleguen. Estructura tipo Lululemon:
//   · Top navigation con categorías (dropdown hover-open)
//   · Grid visual grande de manufacturers · aire editorial · sin sidebar
//     de filtros primarios (los filtros van embebidos en el top nav)
//   · Muy pocos elementos secundarios · foco en la imagen del producto
//
// Cuando lleguen los screenshots reales, iterar sobre este skeleton
// (probablemente reemplazando el HERO placeholder y ajustando el nav).
//
// Se activa con `?mkPreview=1` en la URL — flag zero-cost para el flujo
// normal · el ecosistema classic queda intocado.

import { useState, useMemo } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { Manufacturer } from '../types'
import { PRODUCTS_MANUFACTURERS, MATERIALS_MANUFACTURERS } from '../data/manufacturers'

interface LibraryPageV2MKProps {
    onSelectManufacturer: (m: Manufacturer) => void
    /** Callback para volver al layout classic · el consumer decide (ej.
     *  remover el `?mkPreview` de la URL y refresh). */
    onBackToClassic?: () => void
}

type Tax = 'products' | 'materials'

export default function LibraryPageV2MK({ onSelectManufacturer, onBackToClassic }: LibraryPageV2MKProps) {
    const [activeTax, setActiveTax] = useState<Tax>('products')
    const [openCategoryMenu, setOpenCategoryMenu] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const manufacturers = activeTax === 'products' ? PRODUCTS_MANUFACTURERS : MATERIALS_MANUFACTURERS

    // Categorías derivadas · union de todos los category names de los
    // manufacturers de la taxonomy activa. Ordenadas alfabéticamente.
    const categories = useMemo(() => {
        const set = new Set<string>()
        manufacturers.forEach((m) => m.categories.forEach((c) => set.add(c.name)))
        return Array.from(set).sort()
    }, [manufacturers])

    const filtered = useMemo(() => {
        if (!selectedCategory) return manufacturers
        return manufacturers.filter((m) => m.categories.some((c) => c.name === selectedCategory))
    }, [manufacturers, selectedCategory])

    return (
        <div className="mx-auto max-w-7xl">
            {/* Preview banner · explicito que esto es scaffolding pendiente
                de screenshots reales de Miller Knoll. */}
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-3">
                <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">MK-style preview · scaffolding</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                        This is a placeholder Miller Knoll–inspired layout · category-first, image-heavy, no sidebar. Real screenshots from Jeff are pending; when they arrive we iterate on this skeleton.
                    </p>
                </div>
                {onBackToClassic && (
                    <button
                        type="button"
                        onClick={onBackToClassic}
                        className="rounded-md border border-input bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                    >
                        ← Classic layout
                    </button>
                )}
            </div>

            {/* Top nav · categorías + taxonomy toggle · estilo Lululemon */}
            <nav className="mb-8 flex flex-wrap items-center gap-6 border-b border-border pb-3">
                {/* Taxonomy toggle (Products / Materials) */}
                <div className="flex items-center gap-4">
                    {(['products', 'materials'] as const).map((tax) => (
                        <button
                            key={tax}
                            type="button"
                            onClick={() => { setActiveTax(tax); setSelectedCategory(null) }}
                            className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                                activeTax === tax
                                    ? 'text-foreground border-b-2 border-foreground pb-3 -mb-3'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tax === 'products' ? 'Furniture' : 'Materials'}
                        </button>
                    ))}
                </div>

                {/* Category dropdown · pattern Lululemon (hover-open, single-column) */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setOpenCategoryMenu((v) => !v)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-foreground/70 transition-colors"
                    >
                        {selectedCategory ?? 'Shop by category'}
                        <ChevronDown className={`h-4 w-4 transition-transform ${openCategoryMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {openCategoryMenu && (
                        <div className="absolute left-0 top-full mt-2 z-20 w-56 rounded-lg border border-border bg-card p-1 shadow-lg">
                            <button
                                type="button"
                                onClick={() => { setSelectedCategory(null); setOpenCategoryMenu(false) }}
                                className="block w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                All categories
                            </button>
                            <div className="my-1 border-t border-border" />
                            {categories.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => { setSelectedCategory(c); setOpenCategoryMenu(false) }}
                                    className={`block w-full rounded-md px-3 py-2 text-left text-xs transition-colors ${
                                        selectedCategory === c
                                            ? 'bg-muted text-foreground font-semibold'
                                            : 'text-foreground hover:bg-muted'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <span className="ml-auto text-xs text-muted-foreground">
                    {filtered.length} {filtered.length === 1 ? 'binder' : 'binders'}
                </span>
            </nav>

            {/* Hero placeholder · el punto donde iteraremos con los
                screenshots de Miller Knoll cuando lleguen. */}
            <section className="mb-10 overflow-hidden rounded-2xl border border-border bg-muted">
                <div className="grid gap-0 md:grid-cols-2 min-h-[260px]">
                    <div className="flex flex-col justify-center p-8 md:p-12">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Featured · placeholder
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-foreground leading-tight">
                            The way you spec, made simpler.
                        </h1>
                        <p className="mt-3 text-sm text-muted-foreground max-w-md">
                            Browse binders by category, quick-add to projects, request finish samples in three clicks. The MK-style layout is category-first and image-led · design brand narratives stay intact per binder.
                        </p>
                        <button
                            type="button"
                            className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-xs font-bold text-background hover:bg-foreground/90 transition-colors"
                        >
                            Explore featured binder
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="hidden md:block bg-[url('/images/spaces/reception.jpg')] bg-cover bg-center" />
                </div>
            </section>

            {/* Grid visual grande · manufacturer cards estilo Lululemon
                (imagen dominante, poco texto, sin filtros laterales). */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((m) => (
                    <BinderCardMK
                        key={m.id}
                        manufacturer={m}
                        onSelect={() => onSelectManufacturer(m)}
                    />
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
                    <p className="text-sm text-muted-foreground">No binders match this category.</p>
                </div>
            )}
        </div>
    )
}

/* ─── Card ──────────────────────────────────────────────────────────── */

interface BinderCardMKProps {
    manufacturer: Manufacturer
    onSelect: () => void
}

function BinderCardMK({ manufacturer, onSelect }: BinderCardMKProps) {
    const categoryPreview = manufacturer.categories.slice(0, 3).map((c) => c.name).join(' · ')
    return (
        <button
            type="button"
            onClick={onSelect}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:shadow-lg hover:-translate-y-0.5"
        >
            <div
                className="relative aspect-[4/3] overflow-hidden"
                style={{ backgroundColor: manufacturer.bgColor }}
            >
                {manufacturer.heroImage && (
                    <img
                        src={manufacturer.heroImage}
                        alt={manufacturer.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-lg font-bold text-white leading-tight">{manufacturer.name}</p>
                    {manufacturer.heroTagline && (
                        <p className="mt-0.5 text-[11px] text-white/85 line-clamp-1">{manufacturer.heroTagline}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-between gap-2 p-4">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                        {categoryPreview}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        {manufacturer.categories.length} {manufacturer.categories.length === 1 ? 'category' : 'categories'}
                    </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
        </button>
    )
}
