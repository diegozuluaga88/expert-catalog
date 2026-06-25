// Phase 2 Fix #5 — Product detail modal · iteración 3 (Diego review).
// Cambios:
//  - Fixed size · h-[88vh] + max-w-6xl (constant width + height entre productos)
//  - Image thumbnail visible en sticky identity row (siempre a la vista)
//  - Quote tab PRIMERO (default) · Overview pasa a 2do
//  - **Multi-line quote builder** · cliente puede agregar N líneas con variants
//    distintos (10 black + 5 slate premium leather + 3 olive COM) y agregar
//    todas al quote como elementos separados. Inspirado en Amazon Business
//    "Quick Order" multi-line entry.

import React, { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    ArrowUpRight, Ban, ChevronRight, Copy, CheckCircle2, Download, Heart,
    Plus, Sparkles, Star, Trash2, X,
} from 'lucide-react'
import type { Category, FabricOption, Finish, Manufacturer, MaterialTier, Product } from '../types'
import { resolveInternalSku, resolveManufacturerSku, resolveItemStatus } from './catalogSku'
import { getProductVariants } from '../data/productVariants'
import { useCatalogs } from '../data/catalogs'
import { computeLineItemTotals, formatLeadTime } from '../../quote/helpers'
import { useQuote, type EditingItemState, type QuoteLineItem } from '../../quote/QuoteContext'

type DetailTab = 'quote' | 'overview' | 'variants' | 'specs' | 'resources'

interface QuoteLine {
    id: string
    qty: number
    colorwayCode?: string
    finishId?: string
    fabricId?: string
    materialTierId?: string
}

interface ProductDetailPanelProps {
    open: boolean
    manufacturer: Manufacturer | undefined
    category: Category | undefined
    product: Product | undefined
    onClose: () => void
    /** Cuando set, panel arranca en modo Update con la config del item prellenada */
    editingItem?: EditingItemState
}

function makeDefaultLine(product: Product): QuoteLine {
    const variants = getProductVariants(product)
    return {
        id: `line-${Math.floor(Math.random() * 1e9).toString(36)}`,
        qty: 1,
        colorwayCode: product.colorways[0]?.code,
        finishId: variants.finishes?.[0]?.id,
        fabricId:
            variants.fabricOptions?.find(f => f.type === 'standard')?.id ??
            variants.fabricOptions?.[0]?.id,
        materialTierId: variants.materialTiers?.[0]?.id,
    }
}

export default function ProductDetailPanel({
    open, manufacturer, category, product, onClose, editingItem,
}: ProductDetailPanelProps) {
    const { addItems, updateItem, quotedHistory, buyerInfo } = useQuote()
    const isEditMode = !!editingItem
    const [lines, setLines] = useState<QuoteLine[]>([])
    const [skuCopied, setSkuCopied] = useState<'mfr' | 'internal' | null>(null)
    const [activeTab, setActiveTab] = useState<DetailTab>('quote')

    useEffect(() => {
        if (product) {
            if (editingItem) {
                // Edit mode · pre-fill 1 line with the existing item's variants
                setLines([{
                    id: `edit-${editingItem.item.id}`,
                    qty: editingItem.item.qty,
                    colorwayCode: editingItem.item.colorwayCode,
                    finishId: editingItem.item.finishId,
                    fabricId: editingItem.item.fabricId,
                    materialTierId: editingItem.item.materialTierId,
                }])
            } else {
                setLines([makeDefaultLine(product)])
            }
            setActiveTab('quote')
        }
    }, [product, editingItem])

    const catalogs = useCatalogs()
    const variants = useMemo(() => product ? getProductVariants(product) : {}, [product])

    // Bug fix · todos los hooks que dependen de `product` deben guardear que
    // product existe · sino al renderizar el modal cerrado con product=undefined,
    // computeLineItemTotals(undefined, ...) crashea y se pone toda la app en
    // blanco. NO mover el `if (!product)` arriba de los hooks (rules of hooks).
    const lineTotals = useMemo(
        () => product
            ? lines.map(line => computeLineItemTotals(product, {
                qty: line.qty,
                colorwayCode: line.colorwayCode,
                finishId: line.finishId,
                fabricId: line.fabricId,
                materialTierId: line.materialTierId,
            }))
            : [],
        [product, lines]
    )

    const totalUnits = lines.reduce((s, l) => s + l.qty, 0)
    const totalPrice = lineTotals.reduce((s, t) => s + t.totalPrice, 0)
    const maxLeadDays = lineTotals.length > 0 ? Math.max(0, ...lineTotals.map(t => t.leadTimeDays)) : 0

    if (!product) return null

    const itemStatus = resolveItemStatus(product, catalogs)
    const isDiscontinued = itemStatus === 'discontinued'
    const isDiscrepancy = itemStatus === 'discrepancy'
    const mfrSku = resolveManufacturerSku(product)
    const internalSku = resolveInternalSku(product)
    const heroImage = product.images[0]

    const handleCopy = async (text: string, which: 'mfr' | 'internal') => {
        try {
            await navigator.clipboard.writeText(text)
            setSkuCopied(which)
            setTimeout(() => setSkuCopied(null), 1500)
        } catch { /* clipboard blocked */ }
    }

    const addLine = () => {
        if (!product) return
        const last = lines[lines.length - 1]
        // Nueva línea hereda el config de la última (UX faster · usually changing 1-2 fields)
        setLines([...lines, { ...last, id: `line-${Math.floor(Math.random() * 1e9).toString(36)}`, qty: 1 }])
    }
    const removeLine = (id: string) => {
        if (lines.length <= 1) return
        setLines(lines.filter(l => l.id !== id))
    }
    const updateLine = (id: string, patch: Partial<QuoteLine>) => {
        setLines(lines.map(l => l.id === id ? { ...l, ...patch } : l))
    }

    /** Construye QuoteLineItem patch desde una line del builder */
    const buildItemPatch = (line: QuoteLine, idx: number): Omit<QuoteLineItem, 'id' | 'addedAt'> | null => {
        if (!product) return null
        const totals = lineTotals[idx]
        if (!totals) return null
        const colorway = product.colorways.find(c => c.code === line.colorwayCode)
        const finish = variants.finishes?.find(f => f.id === line.finishId)
        const fabric = variants.fabricOptions?.find(f => f.id === line.fabricId)
        const tier = variants.materialTiers?.find(t => t.id === line.materialTierId)
        return {
            productId: product.id,
            productName: product.name,
            productBrand: product.brand,
            productImage: product.images[0],
            qty: line.qty,
            colorwayCode: colorway?.code,
            colorwayName: colorway?.name,
            colorwayHex: colorway?.hex,
            finishId: finish?.id,
            finishName: finish?.name,
            fabricId: fabric?.id,
            fabricName: fabric?.name,
            fabricIsPremium: fabric?.type === 'special',
            materialTierId: tier?.id,
            materialTierName: tier?.name,
            unitPrice: totals.unitPrice,
            totalPrice: totals.totalPrice,
            leadTimeDays: totals.leadTimeDays,
        }
    }

    /** Transforma cada line en QuoteLineItem · llama addItems o updateItem según modo */
    const handleAddToQuote = () => {
        if (!product || isDiscontinued) return
        if (isEditMode && editingItem) {
            // Edit mode · solo 1 line · update del existing item (replace en su lugar)
            const patch = buildItemPatch(lines[0], 0)
            if (patch) updateItem(editingItem.draftId, editingItem.item.id, patch)
        } else {
            // Normal mode · append new lines
            const items = lines
                .map((line, idx) => buildItemPatch(line, idx))
                .filter((it): it is Omit<QuoteLineItem, 'id' | 'addedAt'> => it !== null)
            addItems(items)
        }
        onClose()
    }

    return (
        <Transition show={open} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        {/* Fixed size · h-[88vh] + max-w-6xl consistent entre productos */}
                        <Dialog.Panel className="relative flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                            {/* Breadcrumb row */}
                            <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-6 py-2.5">
                                <nav className="flex items-center gap-1.5 truncate text-xs text-muted-foreground" aria-label="Breadcrumb">
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
                                    <span className="truncate font-semibold text-foreground">{product.name}</span>
                                </nav>
                                <button type="button" onClick={onClose} className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Close">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Sticky identity · thumbnail + name + SKUs + status (Diego ask) */}
                            <div className="flex flex-shrink-0 items-start gap-4 border-b border-border bg-card px-6 py-3">
                                {/* Image thumbnail · siempre visible · click → tab Overview para ver galería completa */}
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('overview')}
                                    className="group relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border transition-all hover:ring-foreground/30"
                                    title="View full gallery"
                                    aria-label="View full gallery"
                                >
                                    <img src={heroImage} alt={product.name} className="h-full w-full object-cover" />
                                    <span className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                                        <span className="m-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Gallery</span>
                                    </span>
                                </button>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</span>
                                        <ItemStatusInlinePill status={itemStatus} />
                                    </div>
                                    <h1 className="mt-0.5 text-xl font-bold leading-tight text-foreground">{product.name}</h1>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                        <SkuChip label="MFR" value={mfrSku} copied={skuCopied === 'mfr'} onCopy={() => handleCopy(mfrSku, 'mfr')} />
                                        <SkuChip label="Internal" value={internalSku} copied={skuCopied === 'internal'} onCopy={() => handleCopy(internalSku, 'internal')} />
                                        <span className="text-[10px] font-mono text-muted-foreground/80" title="Product ID">ID · {product.id}</span>
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

                            {isDiscontinued && (
                                <div className="flex flex-shrink-0 items-center gap-3 border-b border-border bg-muted/80 px-6 py-2 text-sm">
                                    <Ban className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <span className="flex-1">
                                        <span className="font-semibold text-foreground">Discontinued.</span>
                                        <span className="ml-1 text-muted-foreground">Visible for historical reference only · quoting disabled.</span>
                                    </span>
                                </div>
                            )}
                            {isDiscrepancy && (
                                <div className="flex flex-shrink-0 items-center gap-3 border-b border-border bg-amber-500/10 px-6 py-2 text-sm">
                                    <Sparkles className="h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-400" />
                                    <span className="flex-1 text-foreground">
                                        <span className="font-semibold">Catalog out of sync.</span>
                                        <span className="ml-1 text-muted-foreground">Sync {product.brand} from Manage Catalogs for the latest data.</span>
                                    </span>
                                </div>
                            )}
                            {/* Phase 4 Fix #13b · Previously quoted banner para este tenant */}
                            {(() => {
                                const entry = quotedHistory.get(product.id)
                                if (!entry) return null
                                return (
                                    <div className="flex flex-shrink-0 items-center gap-3 border-b border-border bg-primary/5 px-6 py-2 text-sm">
                                        <Star className="h-4 w-4 flex-shrink-0 fill-foreground text-foreground" />
                                        <span className="flex-1 text-foreground">
                                            <span className="font-semibold">Previously quoted for {buyerInfo.tenant.name}.</span>
                                            <span className="ml-1 text-muted-foreground">
                                                {entry.occurrences} {entry.occurrences === 1 ? 'line' : 'lines'} · {entry.totalUnits} units across history
                                            </span>
                                        </span>
                                    </div>
                                )
                            })()}

                            {/* Tabs · Quote first (Diego ask) */}
                            <div className="flex-shrink-0 border-b border-border bg-muted/20 px-6">
                                <div className="flex gap-0 overflow-x-auto" role="tablist" aria-label="Product details">
                                    <TabButton label="Quote" active={activeTab === 'quote'} onClick={() => setActiveTab('quote')} primary />
                                    <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                                    <TabButton label="Variants & Materials" active={activeTab === 'variants'} onClick={() => setActiveTab('variants')} />
                                    <TabButton label="Specifications" active={activeTab === 'specs'} onClick={() => setActiveTab('specs')} />
                                    <TabButton label="Resources" active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
                                </div>
                            </div>

                            {/* Tab content · scrolls in fixed-height container */}
                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                {activeTab === 'quote' && (
                                    <QuoteTab
                                        product={product}
                                        lines={lines}
                                        lineTotals={lineTotals}
                                        totalUnits={totalUnits}
                                        totalPrice={totalPrice}
                                        maxLeadDays={maxLeadDays}
                                        variants={variants}
                                        disabled={isDiscontinued}
                                        addLine={addLine}
                                        removeLine={removeLine}
                                        updateLine={updateLine}
                                        onAddToQuote={handleAddToQuote}
                                        isEditMode={isEditMode}
                                    />
                                )}
                                {activeTab === 'overview' && <OverviewTab product={product} />}
                                {activeTab === 'variants' && <VariantsTab product={product} variants={variants} />}
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

/* ─── Pieces ──────────────────────────────────────────────────── */

function ItemStatusInlinePill({ status }: { status: ReturnType<typeof resolveItemStatus> }) {
    if (status === 'active') return null
    if (status === 'discontinued') {
        return <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Discontinued</span>
    }
    return <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Out of sync</span>
}

function SkuChip({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
    return (
        <button type="button" onClick={onCopy} className="group inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-mono text-foreground transition-colors hover:bg-muted" title={`Copy ${label} SKU`}>
            <span className="text-[9px] font-sans font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
            {value}
            {copied ? <CheckCircle2 className="h-3 w-3 text-foreground" /> : <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />}
        </button>
    )
}

function TabButton({ label, active, onClick, disabled, primary }: { label: string; active: boolean; onClick: () => void; disabled?: boolean; primary?: boolean }) {
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
                        : `border-transparent ${primary ? 'font-semibold text-foreground' : 'text-muted-foreground'} hover:border-border hover:text-foreground`
            }`}
        >
            {label}
        </button>
    )
}

/* ─── Quote tab · multi-line builder (Amazon Business Quick Order pattern) ─── */

interface QuoteTabProps {
    product: Product
    lines: QuoteLine[]
    lineTotals: ReturnType<typeof computeLineItemTotals>[]
    totalUnits: number
    totalPrice: number
    maxLeadDays: number
    variants: ReturnType<typeof getProductVariants>
    disabled: boolean
    addLine: () => void
    removeLine: (id: string) => void
    updateLine: (id: string, patch: Partial<QuoteLine>) => void
    onAddToQuote: () => void
    /** Edit mode · single line · CTA cambia a Update */
    isEditMode?: boolean
}

function QuoteTab({ product, lines, lineTotals, totalUnits, totalPrice, maxLeadDays, variants, disabled, addLine, removeLine, updateLine, onAddToQuote, isEditMode }: QuoteTabProps) {
    return (
        <div className="space-y-5">
            {/* Intro · adapta a edit mode */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-foreground">{isEditMode ? 'Edit item variants' : 'Build your quote'}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {isEditMode
                            ? 'Change color, finish, fabric or material tier · qty edit. Updates the existing line item in your quote.'
                            : 'Need different variants? Add multiple lines for different colors, finishes, or materials in the same quote.'}
                    </p>
                </div>
                {product.listPrice && product.price && (
                    <div className="text-right">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">List price</div>
                        <div className="text-sm font-medium text-muted-foreground line-through">${product.listPrice.toLocaleString()}</div>
                        <div className="text-lg font-bold text-foreground">${product.price.toLocaleString()}<span className="ml-1 text-xs font-medium text-muted-foreground">/ unit (base)</span></div>
                    </div>
                )}
            </div>

            {/* Line items */}
            <ul className="space-y-3">
                {lines.map((line, idx) => (
                    <li key={line.id}>
                        <QuoteLineEditor
                            product={product}
                            line={line}
                            totals={lineTotals[idx]}
                            variants={variants}
                            disabled={disabled}
                            canRemove={lines.length > 1}
                            index={idx + 1}
                            onChange={(patch) => updateLine(line.id, patch)}
                            onRemove={() => removeLine(line.id)}
                        />
                    </li>
                ))}
            </ul>

            {/* Add line · hidden en edit mode (1 single line) */}
            {!isEditMode && (
                <button
                    type="button"
                    onClick={addLine}
                    disabled={disabled}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Add another line for different variants
                </button>
            )}

            {/* Totals + CTA */}
            <div className="rounded-xl border border-border bg-background p-4">
                <div className="grid grid-cols-3 gap-4 border-b border-border pb-3">
                    <Stat label="Total units" value={`${totalUnits}`} />
                    <Stat label="Estimated lead" value={formatLeadTime(maxLeadDays)} sub={lines.length > 1 ? `max across ${lines.length} lines` : undefined} />
                    <Stat label={isEditMode ? 'New line total' : 'Quote total'} value={`$${totalPrice.toLocaleString()}`} highlight />
                </div>
                <button
                    type="button"
                    onClick={onAddToQuote}
                    disabled={disabled}
                    title={disabled ? 'Discontinued · quoting disabled' : (isEditMode ? 'Update the existing item with new variants' : `Add ${lines.length} line${lines.length === 1 ? '' : 's'} to your quote`)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                >
                    {disabled
                        ? <><Ban className="h-4 w-4" /> Discontinued</>
                        : isEditMode
                            ? <>Update item <ArrowUpRight className="h-4 w-4" /></>
                            : <>Add {lines.length} {lines.length === 1 ? 'line' : 'lines'} to Quote <ArrowUpRight className="h-4 w-4" /></>
                    }
                </button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Sold by {product.brand} · Free returns within 30 days
                </p>
            </div>
        </div>
    )
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
    return (
        <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className={`mt-0.5 text-lg font-bold ${highlight ? 'text-foreground' : 'text-foreground'}`}>{value}</div>
            {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
        </div>
    )
}

interface QuoteLineEditorProps {
    product: Product
    line: QuoteLine
    totals: ReturnType<typeof computeLineItemTotals>
    variants: ReturnType<typeof getProductVariants>
    disabled: boolean
    canRemove: boolean
    index: number
    onChange: (patch: Partial<QuoteLine>) => void
    onRemove: () => void
}

function QuoteLineEditor({ product, line, totals, variants, disabled, canRemove, index, onChange, onRemove }: QuoteLineEditorProps) {
    const selectedColorway = product.colorways.find(c => c.code === line.colorwayCode)
    const selectedFabric = variants.fabricOptions?.find(f => f.id === line.fabricId)
    const isPremiumFabric = selectedFabric?.type === 'special'
    return (
        <div className="rounded-xl border border-border bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">{index}</span>
                    <span className="text-sm font-semibold text-foreground">Line {index}</span>
                    {selectedColorway && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: selectedColorway.hex }} />
                            {selectedColorway.name}
                        </span>
                    )}
                    {isPremiumFabric && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Premium fabric</span>
                    )}
                </div>
                {canRemove && (
                    <button type="button" onClick={onRemove} disabled={disabled} className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30" title="Remove this line" aria-label="Remove line">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Colorway selector · swatch picker visual (Diego ask · ver color en la lista) */}
                {product.colorways.length > 0 && (
                    <LineField label={`Colorway · ${selectedColorway?.name ?? '—'}`}>
                        <div className="flex flex-wrap gap-1.5 rounded-lg border border-input bg-background p-2">
                            {product.colorways.map(c => {
                                const isSel = line.colorwayCode === c.code
                                return (
                                    <button
                                        key={c.code}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => onChange({ colorwayCode: c.code })}
                                        aria-pressed={isSel}
                                        title={`${c.name} · ${c.code}`}
                                        className={`group relative h-7 w-7 flex-shrink-0 rounded border-2 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                                            isSel
                                                ? 'border-primary ring-2 ring-primary/30 scale-105'
                                                : 'border-border/60 hover:border-foreground/40'
                                        }`}
                                        style={{ backgroundColor: c.hex }}
                                    >
                                        <span className="sr-only">{c.name}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </LineField>
                )}

                {/* Finish */}
                {variants.finishes && variants.finishes.length > 0 && (
                    <LineField label="Finish">
                        <select disabled={disabled} value={line.finishId ?? ''} onChange={(e) => onChange({ finishId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
                            {variants.finishes.map(f => (
                                <option key={f.id} value={f.id}>{f.name}{f.priceModifier > 0 ? ` · +$${f.priceModifier}` : ''}</option>
                            ))}
                        </select>
                    </LineField>
                )}

                {/* Fabric */}
                {variants.fabricOptions && variants.fabricOptions.length > 0 && (
                    <LineField label="Fabric">
                        <select disabled={disabled} value={line.fabricId ?? ''} onChange={(e) => onChange({ fabricId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
                            {variants.fabricOptions.map(f => (
                                <option key={f.id} value={f.id}>
                                    {f.name}{f.priceModifier > 0 ? ` · +$${f.priceModifier}` : ''}{f.type === 'special' ? ' (premium)' : ''}
                                </option>
                            ))}
                        </select>
                    </LineField>
                )}

                {/* Material tier */}
                {variants.materialTiers && variants.materialTiers.length > 1 && (
                    <LineField label="Material tier">
                        <select disabled={disabled} value={line.materialTierId ?? ''} onChange={(e) => onChange({ materialTierId: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
                            {variants.materialTiers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}{t.priceModifier > 0 ? ` · +$${t.priceModifier}` : ''}</option>
                            ))}
                        </select>
                    </LineField>
                )}
            </div>

            {/* Qty + line total + lead */}
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
                <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Quantity</div>
                    <div className="mt-1 flex items-center gap-2">
                        <button type="button" disabled={disabled} onClick={() => onChange({ qty: Math.max(1, line.qty - 1) })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" aria-label="Decrease">−</button>
                        <input
                            type="number"
                            value={line.qty}
                            min={1}
                            disabled={disabled}
                            onChange={(e) => onChange({ qty: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                            className="h-9 w-16 rounded-lg border border-input bg-background text-center text-sm font-semibold text-foreground focus:border-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <button type="button" disabled={disabled} onClick={() => onChange({ qty: line.qty + 1 })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" aria-label="Increase">+</button>
                    </div>
                </div>
                <div className="flex flex-wrap items-baseline gap-4 text-right">
                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Unit</div>
                        <div className="text-sm font-semibold text-foreground">${totals.unitPrice.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Line total</div>
                        <div className="text-lg font-bold text-foreground">${totals.totalPrice.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Ships in</div>
                        <div className="text-sm font-medium text-foreground">{formatLeadTime(totals.leadTimeDays)}</div>
                    </div>
                </div>
            </div>
            {totals.nextVolumeTier && (
                <p className="mt-2 text-xs text-foreground">
                    💡 Add <span className="font-bold">{totals.nextVolumeTier.qtyNeeded}</span> more to save{' '}
                    <span className="font-bold">${totals.nextVolumeTier.savings.toLocaleString()}</span> on this line
                </p>
            )}
        </div>
    )
}

function LineField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
            {children}
        </div>
    )
}

/* ─── Other tabs (Overview / Variants / Specs / Resources) ──── */

function OverviewTab({ product }: { product: Product }) {
    const allImages = [...product.images, ...(product.galleries ?? [])]
    const [activeIdx, setActiveIdx] = useState(0)
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                    <img src={allImages[activeIdx]} alt={`${product.name} ${activeIdx + 1}`} className="h-full w-full object-cover" />
                </div>
                {allImages.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {allImages.map((src, i) => (
                            <button key={i} type="button" onClick={() => setActiveIdx(i)} aria-label={`View image ${i + 1}`} className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${activeIdx === i ? 'border-primary' : 'border-transparent hover:border-border'}`}>
                                <img src={src} alt="" className="h-16 w-20 object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="space-y-5">
                <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Description</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
                </div>
                {product.tags && product.tags.length > 0 && (
                    <div>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Tags</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {product.tags.map(t => <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{t}</span>)}
                        </div>
                    </div>
                )}
                {product.standardFeatures && product.standardFeatures.length > 0 && (
                    <div>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Standard features</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {product.standardFeatures.map(f => <li key={f} className="flex gap-2"><span className="mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-foreground" />{f}</li>)}
                        </ul>
                    </div>
                )}
                {product.optionalFeatures && product.optionalFeatures.length > 0 && (
                    <div>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Optional features</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {product.optionalFeatures.map(f => <li key={f} className="flex gap-2"><span className="mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground" />{f}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

function VariantsTab({ product, variants }: { product: Product; variants: ReturnType<typeof getProductVariants> }) {
    const hasContent = variants.finishes || variants.fabricOptions || variants.materialTiers || product.material || product.upholstery
    if (!hasContent) return <p className="text-sm text-muted-foreground">No variant options for this product.</p>
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <p className="lg:col-span-2 text-sm text-muted-foreground">
                Browse all variant options available. To select specific variants per line, go to the <span className="font-semibold text-foreground">Quote</span> tab.
            </p>
            {variants.finishes && variants.finishes.length > 0 && (
                <section>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Finishes ({variants.finishes.length})</h3>
                    <div className="flex flex-wrap gap-3">
                        {variants.finishes.map((f: Finish) => (
                            <div key={f.id} className="flex flex-col items-center gap-1 rounded-lg p-1.5">
                                <span className="h-12 w-12 rounded-md border border-border" style={{ backgroundColor: f.swatch }} />
                                <span className="text-xs font-medium text-foreground">{f.name}</span>
                                {f.priceModifier > 0 && <span className="text-[10px] font-semibold text-muted-foreground">+${f.priceModifier}</span>}
                            </div>
                        ))}
                    </div>
                </section>
            )}
            {variants.fabricOptions && variants.fabricOptions.length > 0 && (
                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">Fabric options</h3>
                        <span className="text-[11px] text-muted-foreground">
                            {variants.fabricOptions.filter((f: FabricOption) => f.type === 'standard').length} standard
                            {variants.fabricOptions.filter((f: FabricOption) => f.type === 'special').length > 0 && (
                                <>, <span className="font-semibold text-amber-700 dark:text-amber-400">{variants.fabricOptions.filter((f: FabricOption) => f.type === 'special').length} premium</span></>
                            )}
                        </span>
                    </div>
                    <ul className="space-y-1.5">
                        {variants.fabricOptions.map((f: FabricOption) => (
                            <li key={f.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                                <span className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">{f.name}</span>
                                    {f.type === 'special' && <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Premium</span>}
                                </span>
                                <span className="text-right text-xs text-muted-foreground">
                                    {f.priceModifier > 0 ? <span className="font-semibold text-foreground">+${f.priceModifier}</span> : 'Included'}
                                    {f.leadTimeAdjust > 0 && <span className="block">+{f.leadTimeAdjust} days</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            {variants.materialTiers && variants.materialTiers.length > 1 && (
                <section>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Material tier</h3>
                    <div className="space-y-2">
                        {variants.materialTiers.map((t: MaterialTier) => (
                            <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                                <span className="font-medium text-foreground">{t.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {t.priceModifier > 0 ? <span className="font-semibold text-foreground">+${t.priceModifier}</span> : 'Base'}
                                    {t.leadTimeAdjust > 0 && <span className="block">+{t.leadTimeAdjust} days lead</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
            {(product.material || product.upholstery) && (
                <section>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Materials info</h3>
                    <dl className="space-y-1.5 text-sm">
                        {product.material && <div className="flex gap-2"><dt className="font-semibold text-foreground w-24">Material:</dt><dd className="text-muted-foreground">{product.material}</dd></div>}
                        {product.upholstery && <div className="flex gap-2"><dt className="font-semibold text-foreground w-24">Upholstery:</dt><dd className="text-muted-foreground">{product.upholstery}</dd></div>}
                    </dl>
                </section>
            )}
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
