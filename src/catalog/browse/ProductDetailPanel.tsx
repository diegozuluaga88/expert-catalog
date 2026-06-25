// Phase 2 Fix #5 — Product detail modal · centered + tabs at top + sticky identity.
// Iteración 2 (Diego review):
//  - Sticky header con name + brand + SKUs + rating + status SIEMPRE visibles
//  - Tabs visibles desde el inicio (no después de scroll past hero)
//  - "Quote" como tab separado · ya no es panel sticky right
//  - Gallery integrado dentro del tab Overview
//  - Specs tab restaurado con specs + performance + dimensions completo

import React, { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    ArrowUpRight, Ban, ChevronRight, Copy, CheckCircle2, Download, Heart,
    Sparkles, Star, X,
} from 'lucide-react'
import type { Category, FabricOption, Finish, Manufacturer, MaterialTier, Product } from '../types'
import { resolveInternalSku, resolveManufacturerSku, resolveItemStatus } from './catalogSku'
import { getProductVariants } from '../data/productVariants'
import { useCatalogs } from '../data/catalogs'
import { computeLineItemTotals, formatLeadTime } from '../../quote/helpers'

type DetailTab = 'overview' | 'variants' | 'quote' | 'specs' | 'resources'

interface ProductDetailPanelProps {
    open: boolean
    manufacturer: Manufacturer | undefined
    category: Category | undefined
    product: Product | undefined
    onClose: () => void
    onAddToQuote: (product: Product) => void
}

export default function ProductDetailPanel({
    open, manufacturer, category, product, onClose, onAddToQuote,
}: ProductDetailPanelProps) {
    const [qty, setQty] = useState(1)
    const [colorwayCode, setColorwayCode] = useState<string | undefined>()
    const [finishId, setFinishId] = useState<string | undefined>()
    const [fabricId, setFabricId] = useState<string | undefined>()
    const [materialTierId, setMaterialTierId] = useState<string | undefined>()
    const [skuCopied, setSkuCopied] = useState<'mfr' | 'internal' | null>(null)
    const [activeTab, setActiveTab] = useState<DetailTab>('overview')

    useEffect(() => {
        if (product) {
            setQty(1)
            setColorwayCode(product.colorways[0]?.code)
            const variants = getProductVariants(product)
            setFinishId(variants.finishes?.[0]?.id)
            setFabricId(
                variants.fabricOptions?.find(f => f.type === 'standard')?.id ??
                variants.fabricOptions?.[0]?.id
            )
            setMaterialTierId(variants.materialTiers?.[0]?.id)
            setActiveTab('overview')
        }
    }, [product])

    const catalogs = useCatalogs()
    const variants = useMemo(() => product ? getProductVariants(product) : {}, [product])
    const totals = useMemo(() => {
        if (!product) return null
        return computeLineItemTotals(product, { qty, colorwayCode, finishId, fabricId, materialTierId })
    }, [product, qty, colorwayCode, finishId, fabricId, materialTierId])

    if (!product) return null

    const itemStatus = resolveItemStatus(product, catalogs)
    const isDiscontinued = itemStatus === 'discontinued'
    const isDiscrepancy = itemStatus === 'discrepancy'
    const mfrSku = resolveManufacturerSku(product)
    const internalSku = resolveInternalSku(product)

    const handleCopy = async (text: string, which: 'mfr' | 'internal') => {
        try {
            await navigator.clipboard.writeText(text)
            setSkuCopied(which)
            setTimeout(() => setSkuCopied(null), 1500)
        } catch { /* clipboard may be blocked */ }
    }

    return (
        <Transition show={open} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                            {/* ── Sticky breadcrumb row ────────────────────────────────── */}
                            <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
                                <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
                                    {manufacturer && (
                                        <>
                                            <span className="font-medium uppercase tracking-wide">{manufacturer.name}</span>
                                            <ChevronRight className="h-3 w-3" />
                                        </>
                                    )}
                                    {category && (
                                        <>
                                            <span className="uppercase tracking-wide">{category.name}</span>
                                            <ChevronRight className="h-3 w-3" />
                                        </>
                                    )}
                                    <span className="font-semibold text-foreground">{product.name}</span>
                                </nav>
                                <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Close">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* ── Sticky product identity · ALWAYS VISIBLE (Diego ask) ─── */}
                            <div className="border-b border-border bg-card px-6 py-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</span>
                                            <ItemStatusInlinePill status={itemStatus} />
                                        </div>
                                        <h1 className="mt-0.5 text-xl font-bold leading-tight text-foreground">{product.name}</h1>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <SkuChip label="MFR" value={mfrSku} copied={skuCopied === 'mfr'} onCopy={() => handleCopy(mfrSku, 'mfr')} />
                                            <SkuChip label="Internal" value={internalSku} copied={skuCopied === 'internal'} onCopy={() => handleCopy(internalSku, 'internal')} />
                                            <span className="text-[10px] font-mono text-muted-foreground/80" title="Product ID">
                                                ID · {product.id}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 text-right">
                                        {product.dealerRating && (
                                            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                                                <Star className="h-3.5 w-3.5 fill-foreground" />
                                                {product.dealerRating.toFixed(1)}
                                                <span className="text-xs text-muted-foreground">Dealer Rated</span>
                                            </span>
                                        )}
                                        {product.popular && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                Often selected
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Status banners (discontinued / discrepancy) ────────── */}
                            {isDiscontinued && (
                                <div className="flex items-center gap-3 border-b border-border bg-muted/80 px-6 py-2 text-sm">
                                    <Ban className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <span className="flex-1">
                                        <span className="font-semibold text-foreground">Discontinued.</span>
                                        <span className="ml-1 text-muted-foreground">Visible for historical reference only · quoting disabled.</span>
                                    </span>
                                </div>
                            )}
                            {isDiscrepancy && (
                                <div className="flex items-center gap-3 border-b border-border bg-amber-500/10 px-6 py-2 text-sm">
                                    <Sparkles className="h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-400" />
                                    <span className="flex-1 text-foreground">
                                        <span className="font-semibold">Catalog out of sync.</span>
                                        <span className="ml-1 text-muted-foreground">Some attributes may be stale · sync {product.brand} from Manage Catalogs.</span>
                                    </span>
                                </div>
                            )}

                            {/* ── Tabs (visible at top · Diego ask) ──────────────────── */}
                            <div className="border-b border-border bg-muted/20 px-6">
                                <div className="flex gap-0 overflow-x-auto" role="tablist" aria-label="Product details">
                                    <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                                    <TabButton label="Variants & Materials" active={activeTab === 'variants'} onClick={() => setActiveTab('variants')} disabled={!variants.fabricOptions && !variants.finishes && !product.material} />
                                    <TabButton label="Quote" active={activeTab === 'quote'} onClick={() => setActiveTab('quote')} highlight />
                                    <TabButton label="Specifications" active={activeTab === 'specs'} onClick={() => setActiveTab('specs')} />
                                    <TabButton label="Resources" active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
                                </div>
                            </div>

                            {/* ── Active tab content ─────────────────────────────────── */}
                            <div className="flex-1 overflow-y-auto px-6 py-6">
                                {activeTab === 'overview' && (
                                    <OverviewTab
                                        product={product}
                                        colorwayCode={colorwayCode}
                                        setColorwayCode={setColorwayCode}
                                    />
                                )}
                                {activeTab === 'variants' && (
                                    <VariantsTab
                                        product={product}
                                        finishes={variants.finishes}
                                        fabricOptions={variants.fabricOptions}
                                        materialTiers={variants.materialTiers}
                                        finishId={finishId}
                                        setFinishId={setFinishId}
                                        fabricId={fabricId}
                                        setFabricId={setFabricId}
                                        materialTierId={materialTierId}
                                        setMaterialTierId={setMaterialTierId}
                                    />
                                )}
                                {activeTab === 'quote' && totals && (
                                    <QuoteTab
                                        product={product}
                                        qty={qty}
                                        setQty={setQty}
                                        totals={totals}
                                        colorwayCode={colorwayCode}
                                        finishId={finishId}
                                        fabricId={fabricId}
                                        materialTierId={materialTierId}
                                        variants={variants}
                                        disabled={isDiscontinued}
                                        onAddToQuote={() => !isDiscontinued && onAddToQuote(product)}
                                        onGoToVariants={() => setActiveTab('variants')}
                                    />
                                )}
                                {activeTab === 'specs' && <SpecsTab product={product} />}
                                {activeTab === 'resources' && <ResourcesTab product={product} />}
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}

/* ─── Header pieces ──────────────────────────────────────────────── */

function ItemStatusInlinePill({ status }: { status: ReturnType<typeof resolveItemStatus> }) {
    if (status === 'active') return null
    if (status === 'discontinued') {
        return <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Discontinued</span>
    }
    return <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Out of sync</span>
}

function SkuChip({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
    return (
        <button
            type="button"
            onClick={onCopy}
            className="group inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-mono text-foreground transition-colors hover:bg-muted"
            title={`Copy ${label} SKU`}
        >
            <span className="text-[9px] font-sans font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
            {value}
            {copied
                ? <CheckCircle2 className="h-3 w-3 text-foreground" />
                : <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />}
        </button>
    )
}

function TabButton({ label, active, onClick, disabled, highlight }: { label: string; active: boolean; onClick: () => void; disabled?: boolean; highlight?: boolean }) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                disabled
                    ? 'cursor-not-allowed border-transparent text-muted-foreground/40'
                    : active
                        ? 'border-primary text-foreground'
                        : `border-transparent ${highlight ? 'text-foreground' : 'text-muted-foreground'} hover:border-border hover:text-foreground`
            }`}
        >
            {label}
            {highlight && !active && <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />}
        </button>
    )
}

/* ─── Tabs ─────────────────────────────────────────────────────── */

function OverviewTab({ product, colorwayCode, setColorwayCode }: {
    product: Product
    colorwayCode: string | undefined
    setColorwayCode: (code: string) => void
}) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Gallery + colorways */}
            <div>
                <Gallery product={product} />
                {product.colorways.length > 0 && (
                    <ColorwayPicker
                        colorways={product.colorways}
                        selected={colorwayCode}
                        onSelect={setColorwayCode}
                    />
                )}
            </div>

            {/* Description + features */}
            <div className="space-y-5">
                <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Description</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
                </div>

                {product.tags && product.tags.length > 0 && (
                    <div>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Tags</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {product.tags.map(t => (
                                <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{t}</span>
                            ))}
                        </div>
                    </div>
                )}

                {product.standardFeatures && product.standardFeatures.length > 0 && (
                    <div>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Standard features</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {product.standardFeatures.map(f => (
                                <li key={f} className="flex gap-2">
                                    <span className="mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-foreground" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {product.optionalFeatures && product.optionalFeatures.length > 0 && (
                    <div>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Optional features</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {product.optionalFeatures.map(f => (
                                <li key={f} className="flex gap-2">
                                    <span className="mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

function Gallery({ product }: { product: Product }) {
    const [activeIdx, setActiveIdx] = useState(0)
    const allImages = [...product.images, ...(product.galleries ?? [])]
    return (
        <div>
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <img src={allImages[activeIdx]} alt={`${product.name} ${activeIdx + 1}`} className="h-full w-full object-cover" />
            </div>
            {allImages.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {allImages.map((src, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setActiveIdx(i)}
                            aria-label={`View image ${i + 1}`}
                            className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                                activeIdx === i ? 'border-primary' : 'border-transparent hover:border-border'
                            }`}
                        >
                            <img src={src} alt="" className="h-16 w-20 object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function ColorwayPicker({ colorways, selected, onSelect }: {
    colorways: Product['colorways']
    selected: string | undefined
    onSelect: (code: string) => void
}) {
    const selectedCw = colorways.find(c => c.code === selected)
    return (
        <div className="mt-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">
                Colorways ({colorways.length})
                {selectedCw && <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground">· {selectedCw.name}</span>}
            </h3>
            <div className="flex flex-wrap gap-2">
                {colorways.map(c => (
                    <button
                        key={c.code}
                        type="button"
                        onClick={() => onSelect(c.code)}
                        aria-pressed={selected === c.code}
                        aria-label={`Select ${c.name}`}
                        title={`${c.name} · ${c.code}`}
                        className="group flex flex-col items-center gap-1"
                    >
                        <span
                            className={`block h-10 w-10 rounded-md border-2 shadow-sm transition-transform ${
                                selected === c.code
                                    ? 'border-primary ring-2 ring-primary/30 scale-105'
                                    : 'border-border/60 group-hover:border-foreground/30'
                            }`}
                            style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground">{c.code}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

interface VariantsTabProps {
    product: Product
    finishes: Finish[] | undefined
    fabricOptions: FabricOption[] | undefined
    materialTiers: MaterialTier[] | undefined
    finishId: string | undefined
    setFinishId: (id: string | undefined) => void
    fabricId: string | undefined
    setFabricId: (id: string | undefined) => void
    materialTierId: string | undefined
    setMaterialTierId: (id: string | undefined) => void
}

function VariantsTab({ product, finishes, fabricOptions, materialTiers, finishId, setFinishId, fabricId, setFabricId, materialTierId, setMaterialTierId }: VariantsTabProps) {
    const hasContent = finishes || fabricOptions || materialTiers || product.material || product.upholstery
    if (!hasContent) {
        return <p className="text-sm text-muted-foreground">No variant options configured for this product.</p>
    }
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {finishes && finishes.length > 0 && (
                <section>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Finishes ({finishes.length})</h3>
                    <div className="flex flex-wrap gap-3">
                        {finishes.map(f => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setFinishId(f.id)}
                                aria-pressed={finishId === f.id}
                                title={f.name}
                                className={`flex flex-col items-center gap-1 rounded-lg p-1.5 transition-all ${
                                    finishId === f.id ? 'ring-2 ring-primary' : 'hover:bg-muted'
                                }`}
                            >
                                <span className="h-12 w-12 rounded-md border border-border" style={{ backgroundColor: f.swatch }} />
                                <span className="text-xs font-medium text-foreground">{f.name}</span>
                                {f.priceModifier > 0 && (
                                    <span className="text-[10px] font-semibold text-muted-foreground">+${f.priceModifier}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {fabricOptions && fabricOptions.length > 0 && (
                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">Fabric options</h3>
                        <span className="text-[11px] text-muted-foreground">
                            {fabricOptions.filter(f => f.type === 'standard').length} standard
                            {fabricOptions.filter(f => f.type === 'special').length > 0 && (
                                <>, <span className="font-semibold text-amber-700 dark:text-amber-400">{fabricOptions.filter(f => f.type === 'special').length} premium</span></>
                            )}
                        </span>
                    </div>
                    <ul className="space-y-1.5">
                        {fabricOptions.map(f => (
                            <li key={f.id}>
                                <button
                                    type="button"
                                    onClick={() => setFabricId(f.id)}
                                    aria-pressed={fabricId === f.id}
                                    className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                                        fabricId === f.id ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted/50'
                                    }`}
                                >
                                    <span className="flex items-center gap-2 min-w-0">
                                        <span className="font-medium text-foreground truncate">{f.name}</span>
                                        {f.type === 'special' && (
                                            <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Premium</span>
                                        )}
                                    </span>
                                    <span className="text-right text-xs text-muted-foreground flex-shrink-0">
                                        {f.priceModifier > 0 ? <span className="font-semibold text-foreground">+${f.priceModifier}</span> : 'Included'}
                                        {f.leadTimeAdjust > 0 && <span className="block">+{f.leadTimeAdjust} days</span>}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {materialTiers && materialTiers.length > 1 && (
                <section>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Material tier</h3>
                    <div className="space-y-2">
                        {materialTiers.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setMaterialTierId(t.id)}
                                aria-pressed={materialTierId === t.id}
                                className={`flex w-full items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                                    materialTierId === t.id ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/50'
                                }`}
                            >
                                <span className="font-medium text-foreground">{t.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {t.priceModifier > 0 ? <span className="font-semibold text-foreground">+${t.priceModifier}</span> : 'Base'}
                                    {t.leadTimeAdjust > 0 && <span className="block">+{t.leadTimeAdjust} days lead</span>}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {(product.material || product.upholstery) && (
                <section>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Materials info</h3>
                    <dl className="space-y-1.5 text-sm">
                        {product.material && (
                            <div className="flex gap-2"><dt className="font-semibold text-foreground w-24">Material:</dt><dd className="text-muted-foreground">{product.material}</dd></div>
                        )}
                        {product.upholstery && (
                            <div className="flex gap-2"><dt className="font-semibold text-foreground w-24">Upholstery:</dt><dd className="text-muted-foreground">{product.upholstery}</dd></div>
                        )}
                    </dl>
                </section>
            )}
        </div>
    )
}

interface QuoteTabProps {
    product: Product
    qty: number
    setQty: (q: number) => void
    totals: NonNullable<ReturnType<typeof computeLineItemTotals>>
    colorwayCode: string | undefined
    finishId: string | undefined
    fabricId: string | undefined
    materialTierId: string | undefined
    variants: ReturnType<typeof getProductVariants>
    disabled: boolean
    onAddToQuote: () => void
    onGoToVariants: () => void
}

function QuoteTab({ product, qty, setQty, totals, colorwayCode, finishId, fabricId, materialTierId, variants, disabled, onAddToQuote, onGoToVariants }: QuoteTabProps) {
    const selectedColorway = product.colorways.find(c => c.code === colorwayCode)
    const selectedFinish = variants.finishes?.find(f => f.id === finishId)
    const selectedFabric = variants.fabricOptions?.find(f => f.id === fabricId)
    const selectedTier = variants.materialTiers?.find(t => t.id === materialTierId)
    const savingsPct = product.listPrice && product.price && product.listPrice > product.price
        ? Math.round(((product.listPrice - product.price) / product.listPrice) * 100)
        : 0

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
            {/* Selection summary */}
            <div className="space-y-4">
                <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Your selection</h3>
                    <dl className="rounded-xl border border-border bg-background divide-y divide-border">
                        <SelectionRow label="Quantity" value={`${qty} unit${qty === 1 ? '' : 's'}`} />
                        {selectedColorway && <SelectionRow label="Colorway" value={`${selectedColorway.name} · ${selectedColorway.code}`} swatch={selectedColorway.hex} />}
                        {selectedFinish && <SelectionRow label="Finish" value={selectedFinish.name} extra={selectedFinish.priceModifier > 0 ? `+$${selectedFinish.priceModifier}` : undefined} />}
                        {selectedFabric && <SelectionRow label="Fabric" value={selectedFabric.name} extra={selectedFabric.priceModifier > 0 ? `+$${selectedFabric.priceModifier}` : undefined} highlight={selectedFabric.type === 'special'} />}
                        {selectedTier && selectedTier.priceModifier > 0 && <SelectionRow label="Material tier" value={selectedTier.name} extra={`+$${selectedTier.priceModifier}`} />}
                    </dl>
                    <button
                        type="button"
                        onClick={onGoToVariants}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Change variants →
                    </button>
                </div>

                <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Quantity</h4>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={disabled} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-input text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" aria-label="Decrease quantity">−</button>
                        <input
                            type="number"
                            value={qty}
                            min={1}
                            disabled={disabled}
                            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="h-10 w-20 rounded-lg border border-input bg-background text-center text-base font-semibold text-foreground focus:border-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <button type="button" onClick={() => setQty(qty + 1)} disabled={disabled} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-input text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" aria-label="Increase quantity">+</button>
                        {totals.nextVolumeTier && (
                            <span className="ml-3 text-xs text-muted-foreground">
                                💡 Add {totals.nextVolumeTier.qtyNeeded} more to save ${totals.nextVolumeTier.savings.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Pricing & CTA */}
            <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
                <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                        {product.listPrice && product.listPrice > totals.unitPrice && (
                            <span className="text-sm text-muted-foreground line-through">${product.listPrice.toLocaleString()}</span>
                        )}
                        <span className="text-3xl font-bold text-foreground">${totals.unitPrice.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">/ unit</span>
                    </div>
                    {savingsPct > 0 && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400" title={`Manufacturer list $${product.listPrice?.toLocaleString()} · dealer discount applied`}>
                            Save {savingsPct}%
                        </span>
                    )}
                </div>

                <div className="my-4 space-y-1 border-y border-border py-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal ({qty})</span>
                        <span className="font-semibold text-foreground">${totals.totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estimated lead time</span>
                        <span className="font-medium text-foreground">{formatLeadTime(totals.leadTimeDays)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-1">
                        <span className="text-foreground">Total</span>
                        <span className="text-foreground">${totals.totalPrice.toLocaleString()}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onAddToQuote}
                    disabled={disabled}
                    title={disabled ? 'Discontinued · quoting disabled' : 'Add to your quote'}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                >
                    {disabled ? <><Ban className="h-4 w-4" /> Discontinued</> : <>Add to Quote <ArrowUpRight className="h-4 w-4" /></>}
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    title="Will go to your Favorites · accessible from the showroom sidebar"
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Heart className="h-4 w-4" />
                    Save to favorites
                </button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                    Sold by {product.brand} · Free returns within 30 days
                </p>
                <p className="mt-1 text-center text-[10px] text-muted-foreground/70">
                    Saved items appear in Favorites (showroom sidebar)
                </p>
            </div>
        </div>
    )
}

function SelectionRow({ label, value, swatch, extra, highlight }: { label: string; value: string; swatch?: string; extra?: string; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <span className="flex items-center gap-2 text-right">
                {swatch && <span className="h-4 w-4 rounded-sm border border-border" style={{ backgroundColor: swatch }} />}
                <span className={`font-medium ${highlight ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>{value}</span>
                {extra && <span className="text-xs font-semibold text-foreground">{extra}</span>}
            </span>
        </div>
    )
}

function SpecsTab({ product }: { product: Product }) {
    const hasSpecs = product.specs && Object.keys(product.specs).length > 0
    const hasPerf = product.performance && Object.keys(product.performance).length > 0
    const hasDim = !!product.dimensions
    if (!hasSpecs && !hasPerf && !hasDim) {
        return <p className="text-sm text-muted-foreground">No specifications available for this product.</p>
    }
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {hasSpecs && (
                <div>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Key specifications</h3>
                    <InfoTable data={product.specs} />
                </div>
            )}
            {hasPerf && (
                <div>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Performance & certifications</h3>
                    <InfoTable data={product.performance} />
                </div>
            )}
            {hasDim && product.dimensions && (
                <div>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Dimensions</h3>
                    <InfoTable data={product.dimensions as unknown as Record<string, string>} />
                </div>
            )}
        </div>
    )
}

function ResourcesTab({ product }: { product: Product }) {
    const hasDocs = product.documents && product.documents.length > 0
    const hasCleaning = !!product.cleaning
    if (!hasCleaning && !hasDocs) {
        return <p className="text-sm text-muted-foreground">No resources available for this product.</p>
    }
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {hasCleaning && (
                <div>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Care & Maintenance</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{product.cleaning}</p>
                </div>
            )}
            {hasDocs && (
                <div>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Documents</h3>
                    <ul className="space-y-2">
                        {product.documents.map(d => (
                            <li key={d.name}>
                                <a className="inline-flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                                    <Download className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <span className="flex-1 truncate">{d.name}</span>
                                    <span className="text-xs uppercase text-muted-foreground">{d.type}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

function InfoTable({ data }: { data: Record<string, string> }) {
    return (
        <table className="w-full text-sm">
            <tbody>
                {Object.entries(data).map(([key, val]) => (
                    <tr key={key} className="border-b border-border last:border-0">
                        <td className="w-40 py-2 pr-3 align-top text-xs font-semibold uppercase tracking-wide text-foreground">{key}</td>
                        <td className="py-2 text-sm leading-relaxed text-muted-foreground">{val}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
