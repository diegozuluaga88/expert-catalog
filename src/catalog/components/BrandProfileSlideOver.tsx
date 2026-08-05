// F59 · Brand profile slide-over (2026-08-05)
// F60 · Layout 2-column mirror del MRL + category multi-select con Apply.
// F60.1 · Refactor de layout · vuelve a single-column (2-col aplastaba el
// dealer relationship en col-span-2 y dejaba huecos en el categories grid)
// + collapsibles para segmentar Brand resources / Links / Contacts (que
// son secundarios) + categories reubicadas al final del panel donde el
// user espera encontrar la acción (Apply footer inmediatamente debajo).
//
// Alternate al swap full-page de ManufacturerPage cuando el user hace
// click en un brand desde el Product Catalog. Preserva el flow de
// curación (sidebar filter + product grid siguen visibles atrás con
// backdrop opaco) y absorbe el mismo contenido del MRL espejo · reusa
// ManufacturerHero + ManufacturerInfoBarV2 + CategoryCard.
//
// Triggers wireados en ShowroomPageV2:
//  - Info icon en cada brand row del filter sidebar
//  - Brand name clickeable en cada product card del grid
//  - Botón "View brand profile" cuando exactamente 1 brand está seleccionada
//
// Orden del body (single-column top-to-bottom):
//   1. Hero + logo + descripción · always visible
//   2. Your dealer relationship (F52+F58c · key info) · always visible
//   3. Collapsible "Brand resources & links" · collapsed default
//   4. Collapsible "Manufacturer contacts" · collapsed default
//   5. Product categories grid · always visible al final
//   6. Apply footer sticky (solo cuando onApplyFilters viene)

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Check, ChevronDown, ChevronRight } from 'lucide-react'
import type { Category, Manufacturer } from '../types'
import ManufacturerHero from './ManufacturerHero'
import ManufacturerInfoBarV2 from './ManufacturerInfoBarV2'
import CategoryCard from './CategoryCard'
import { enrichManufacturerForDetail } from '../data/mockBrandFallbacks'

interface BrandProfileSlideOverProps {
    /** null = closed · Manufacturer = abre el slide-over con esa marca. */
    manufacturer: Manufacturer | null
    onClose: () => void
    /** Legacy · fallback cuando `onApplyFilters` no viene. Click en una
     *  category card llama a este callback (o cierra el slide-over si
     *  tampoco viene). Con onApplyFilters presente, las cards entran en
     *  modo multi-select y este callback no se usa. */
    onSelectCategory?: (category: Category) => void
    /** F60 · handler para Apply · el consumer (ShowroomPageV2) hace union
     *  del brand + categorías al filter state. Si viene set, el slide-over
     *  activa el modo multi-select + renderiza el footer sticky con Cancel
     *  y Apply buttons. Si no viene, categories vuelven al modo legacy. */
    onApplyFilters?: (brandName: string, categoryNames: string[]) => void
}

export default function BrandProfileSlideOver({
    manufacturer: raw, onClose, onSelectCategory, onApplyFilters,
}: BrandProfileSlideOverProps) {
    const open = raw !== null
    const manufacturer = raw ? enrichManufacturerForDetail(raw) : null
    const multiSelectMode = !!onApplyFilters

    // F60 · multi-select state · reset cuando cambia el target manufacturer
    // (open de otro brand · o close). Fresh state cada vez que se abre.
    const [selectedCategoryNames, setSelectedCategoryNames] = useState<Set<string>>(new Set())
    useEffect(() => {
        setSelectedCategoryNames(new Set())
    }, [manufacturer?.id])

    const toggleCategory = (name: string) => {
        setSelectedCategoryNames(prev => {
            const next = new Set(prev)
            if (next.has(name)) next.delete(name)
            else next.add(name)
            return next
        })
    }

    const handleCategoryClick = (cat: Category) => {
        if (multiSelectMode) {
            toggleCategory(cat.name)
            return
        }
        if (onSelectCategory) onSelectCategory(cat)
        else onClose()
    }

    const handleApply = () => {
        if (!manufacturer || !onApplyFilters) return
        onApplyFilters(manufacturer.name, Array.from(selectedCategoryNames))
        setSelectedCategoryNames(new Set())
    }

    const handleCancel = () => {
        setSelectedCategoryNames(new Set())
        onClose()
    }

    const selectedCount = selectedCategoryNames.size

    // F60.1 · Descubrimiento de qué secciones secundarias tienen data,
    // para no renderizar collapsibles vacíos.
    const hasResources = (manufacturer?.brandResources?.length ?? 0) > 0
    const hasLinks = (manufacturer?.links?.length ?? 0) > 0
    const hasContacts = (manufacturer?.contacts?.length ?? 0) > 0
    const hasResourcesOrLinks = hasResources || hasLinks

    return (
        <Transition show={open} as={Fragment} appear>
            <Dialog onClose={onClose} className="relative z-50">
                {/* Backdrop */}
                <Transition.Child as={Fragment}
                    enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>

                {/* Panel container · flex al borde derecho */}
                <div className="fixed inset-0 flex justify-end">
                    <Transition.Child as={Fragment}
                        enter="transform transition ease-in-out duration-300"
                        enterFrom="translate-x-full" enterTo="translate-x-0"
                        leave="transform transition ease-in-out duration-200"
                        leaveFrom="translate-x-0" leaveTo="translate-x-full"
                    >
                        <Dialog.Panel className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden bg-background shadow-2xl">
                            {manufacturer && (
                                <>
                                    {/* Header · sticky · brand name + close */}
                                    <header className="flex items-center gap-3 border-b border-border bg-card px-5 py-3 z-10">
                                        <Dialog.Title className="min-w-0 flex-1 text-sm font-bold text-foreground truncate">
                                            {manufacturer.name}
                                        </Dialog.Title>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Brand profile
                                        </span>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            aria-label="Close brand profile"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </header>

                                    {/* Body · single-column full-width, top-to-bottom */}
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="px-5 py-5 space-y-5">

                                            {/* 1. Hero */}
                                            <ManufacturerHero manufacturer={manufacturer} />

                                            {/* 2. Logo + name + description blocks */}
                                            <div className="flex flex-col">
                                                {manufacturer.logo ? (
                                                    <img
                                                        src={manufacturer.logo}
                                                        alt={`${manufacturer.name} logo`}
                                                        className="h-9 w-auto object-contain mb-3 self-start"
                                                    />
                                                ) : (
                                                    <h2 className="text-xl font-bold text-foreground uppercase tracking-tight mb-3">
                                                        {manufacturer.name}
                                                    </h2>
                                                )}
                                                {manufacturer.descriptionBlocks && manufacturer.descriptionBlocks.length > 0 ? (
                                                    <div className="flex flex-col gap-3">
                                                        {manufacturer.descriptionBlocks.map((block, i) => (
                                                            <div key={i}>
                                                                {block.heading && (
                                                                    <h3 className="font-semibold text-foreground mb-1 text-sm">{block.heading}</h3>
                                                                )}
                                                                <p className="text-foreground/85 leading-relaxed text-sm">
                                                                    {block.body}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-foreground/85 leading-relaxed text-sm">
                                                        {manufacturer.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* 3. Your dealer relationship · key info · siempre visible.
                                                Full-width single-col deja respirar los 3 metric chips
                                                (Discount · Freight · Credit) horizontalmente. */}
                                            <ManufacturerInfoBarV2
                                                manufacturer={manufacturer}
                                                layout="stack"
                                                only={['relationship']}
                                            />

                                            {/* 4. Collapsible · Brand resources & Links (secundario) */}
                                            {hasResourcesOrLinks && (
                                                <CollapsibleSection
                                                    title="Brand resources & links"
                                                    subtitle={[
                                                        hasResources ? `${manufacturer.brandResources!.length} resources` : null,
                                                        hasLinks ? `${manufacturer.links!.length} links` : null,
                                                    ].filter(Boolean).join(' · ')}
                                                    defaultOpen={false}
                                                >
                                                    <ManufacturerInfoBarV2
                                                        manufacturer={manufacturer}
                                                        layout="stack"
                                                        only={['resources', 'links', 'filter']}
                                                        bare
                                                    />
                                                </CollapsibleSection>
                                            )}

                                            {/* 5. Collapsible · Manufacturer contacts (secundario) */}
                                            {hasContacts && (
                                                <CollapsibleSection
                                                    title="Manufacturer contacts"
                                                    subtitle={`${manufacturer.contacts!.length} ${manufacturer.contacts!.length === 1 ? 'contact' : 'contacts'}`}
                                                    defaultOpen={false}
                                                >
                                                    <ManufacturerInfoBarV2
                                                        manufacturer={manufacturer}
                                                        layout="stack"
                                                        only={['contacts']}
                                                        bare
                                                    />
                                                </CollapsibleSection>
                                            )}

                                            {/* 6. Product categories · al final · main interactive area */}
                                            {manufacturer.categories.length > 0 ? (
                                                <div>
                                                    <div className="flex items-baseline justify-between mb-3">
                                                        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                                            Product categories
                                                        </h3>
                                                        {multiSelectMode && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {selectedCount > 0
                                                                    ? `${selectedCount} selected`
                                                                    : 'Tap to select · then Apply below'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {manufacturer.categories.map(cat => (
                                                            <CategoryCard
                                                                key={cat.id}
                                                                category={cat}
                                                                manufacturer={manufacturer}
                                                                selected={multiSelectMode && selectedCategoryNames.has(cat.name)}
                                                                onClick={() => handleCategoryClick(cat)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
                                                    No categories configured for this brand yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* F60 · Footer sticky-bottom · solo cuando el slide-over está en
                                        multi-select mode (onApplyFilters presente). Cancel siempre
                                        habilitado · Apply disabled hasta que haya ≥1 category. */}
                                    {multiSelectMode && (
                                        <footer className="flex items-center justify-between gap-3 border-t border-border bg-card px-5 py-3">
                                            <div className="text-[11px] text-muted-foreground">
                                                {selectedCount > 0 ? (
                                                    <span>
                                                        Filter <span className="font-bold text-foreground">{manufacturer.name}</span> by{' '}
                                                        <span className="font-bold text-foreground">{selectedCount}</span>{' '}
                                                        {selectedCount === 1 ? 'category' : 'categories'}
                                                    </span>
                                                ) : (
                                                    <span>Select one or more product categories to filter the catalog</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleCancel}
                                                    className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleApply}
                                                    disabled={selectedCount === 0}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                    {selectedCount === 0
                                                        ? 'Apply'
                                                        : `Apply · ${selectedCount} ${selectedCount === 1 ? 'category' : 'categories'}`}
                                                </button>
                                            </div>
                                        </footer>
                                    )}
                                </>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}

// F60.1 · CollapsibleSection helper · same pattern as InspirationPanel /
// ManageSetupPanel (MRL sidebar widgets) para consistencia visual del app.
// Card wrapper + button header con chevron · panel expandable con contenido.
interface CollapsibleSectionProps {
    title: string
    subtitle?: string
    defaultOpen?: boolean
    children: React.ReactNode
}

function CollapsibleSection({ title, subtitle, defaultOpen = false, children }: CollapsibleSectionProps) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    {subtitle && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
                    )}
                </div>
                {open ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                )}
            </button>
            {open && (
                <div className="border-t border-border px-4 py-4">
                    {children}
                </div>
            )}
        </div>
    )
}
