// F59 · Brand profile slide-over (2026-08-05)
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
// Layout · slide desde la derecha · panel narrower que un modal centrado
// (max-w-3xl) para respetar la naturaleza "look up rápido" del Product
// Catalog · el user puede cerrar y volver al grid sin perder scroll.

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import type { Category, Manufacturer } from '../types'
import ManufacturerHero from './ManufacturerHero'
import ManufacturerInfoBarV2 from './ManufacturerInfoBarV2'
import CategoryCard from './CategoryCard'
import { enrichManufacturerForDetail } from '../data/mockBrandFallbacks'

interface BrandProfileSlideOverProps {
    /** null = closed · Manufacturer = abre el slide-over con esa marca. */
    manufacturer: Manufacturer | null
    onClose: () => void
    /** Opcional · click en una category card. Si no viene, el click
     *  simplemente cierra el slide-over (categories quedan como visual
     *  mirror del MRL sin acción). En el futuro se puede wire a un
     *  category filter del ShowroomPageV2. */
    onSelectCategory?: (category: Category) => void
}

export default function BrandProfileSlideOver({
    manufacturer: raw, onClose, onSelectCategory,
}: BrandProfileSlideOverProps) {
    const open = raw !== null
    // Aplica fallbacks mock a fields vacíos (misma manera que ManufacturerPage).
    const manufacturer = raw ? enrichManufacturerForDetail(raw) : null

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

                                    {/* Body · scroll */}
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="px-5 py-5 space-y-6">
                                            <ManufacturerHero manufacturer={manufacturer} />

                                            {/* Logo/name + description blocks */}
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

                                            {/* InfoBar v2 · stack (incluye Your dealer relationship del F52+F58c) */}
                                            <ManufacturerInfoBarV2 manufacturer={manufacturer} layout="stack" />

                                            {/* Categories grid · espejo del MRL. En Product Catalog el
                                                click cierra el slide-over (fallback) o dispara callback
                                                opcional si el consumer lo pasa. */}
                                            {manufacturer.categories.length > 0 && (
                                                <div>
                                                    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                                                        Product categories
                                                    </h3>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {manufacturer.categories.map(cat => (
                                                            <CategoryCard
                                                                key={cat.id}
                                                                category={cat}
                                                                manufacturer={manufacturer}
                                                                onClick={() => {
                                                                    if (onSelectCategory) {
                                                                        onSelectCategory(cat)
                                                                    } else {
                                                                        onClose()
                                                                    }
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}
