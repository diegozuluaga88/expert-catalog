// Phase 2 Fix #5 — Amazon-style PDP como SIDE PANEL (no full-page navigation).
// Stakeholder de producto pidió específicamente "modal o panel lateral · NO navegación
// que rompa el flujo del módulo desde donde se abrió". Reemplaza el patrón previo del
// ShowroomPage que swapeba toda la vista cuando detailId !== null.
//
// Layout · split 60/40 desktop · stack en mobile · buy box sticky a la derecha (Amazon
// pattern) · tabs eliminados → secciones inline scrollables.
//
// Variants visibles · consume getProductVariants() + computeLineItemTotals() de Fix #9.
// Por ahora "Add to Quote" sigue enviando solo el product al RequestQuoteModal legacy
// (las selecciones se preservarán en Fix #11 cuando refactor el modal).

import { useEffect, useMemo, useState } from 'react'
import {
    ArrowUpRight, ChevronDown, ChevronRight, ChevronUp, Download, ExternalLink,
    Heart, Sparkles, Star, X, Copy, CheckCircle2,
} from 'lucide-react'
import type { Category, Manufacturer, Product } from '../types'
import ColorwaySwatch from '../components/ColorwaySwatch'
import { resolveInternalSku, resolveManufacturerSku, resolveItemStatus } from './catalogSku'
import { getProductVariants } from '../data/productVariants'
import { computeLineItemTotals, formatLeadTime } from '../../quote/helpers'

interface ProductDetailPanelProps {
    open: boolean
    manufacturer: Manufacturer | undefined
    category: Category | undefined
    product: Product | undefined
    onClose: () => void
    onAddToQuote: (product: Product) => void
    /** Optional · open the legacy fullpage route (router not assumed) */
    onOpenFullPage?: (productId: string) => void
}

export default function ProductDetailPanel({
    open, manufacturer, category, product, onClose, onAddToQuote, onOpenFullPage,
}: ProductDetailPanelProps) {
    // Buy box state · selecciones de variants (live price + lead time)
    const [qty, setQty] = useState(1)
    const [colorwayCode, setColorwayCode] = useState<string | undefined>()
    const [finishId, setFinishId] = useState<string | undefined>()
    const [fabricId, setFabricId] = useState<string | undefined>()
    const [materialTierId, setMaterialTierId] = useState<string | undefined>()
    const [skuCopied, setSkuCopied] = useState<'mfr' | 'internal' | null>(null)

    // Reset selections cuando cambia el product
    useEffect(() => {
        if (product) {
            setQty(1)
            setColorwayCode(product.colorways[0]?.code)
            const variants = getProductVariants(product)
            setFinishId(variants.finishes?.[0]?.id)
            setFabricId(variants.fabricOptions?.find(f => f.type === 'standard')?.id ?? variants.fabricOptions?.[0]?.id)
            setMaterialTierId(variants.materialTiers?.[0]?.id)
        }
    }, [product])

    // Lock scroll del body cuando el panel está open
    useEffect(() => {
        if (open) {
            const original = document.body.style.overflow
            document.body.style.overflow = 'hidden'
            return () => { document.body.style.overflow = original }
        }
    }, [open])

    const variants = useMemo(() => product ? getProductVariants(product) : {}, [product])
    const totals = useMemo(() => {
        if (!product) return null
        return computeLineItemTotals(product, { qty, colorwayCode, finishId, fabricId, materialTierId })
    }, [product, qty, colorwayCode, finishId, fabricId, materialTierId])

    if (!product) return null

    const itemStatus = resolveItemStatus(product)
    const mfrSku = resolveManufacturerSku(product)
    const internalSku = resolveInternalSku(product)
    const savingsPct = product.listPrice && product.price
        ? Math.round(((product.listPrice - product.price) / product.listPrice) * 100)
        : 0

    const handleCopy = async (text: string, which: 'mfr' | 'internal') => {
        try {
            await navigator.clipboard.writeText(text)
            setSkuCopied(which)
            setTimeout(() => setSkuCopied(null), 1500)
        } catch {
            // noop · clipboard might be blocked
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
                    open ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-hidden="true"
            />

            {/* Side panel */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label={`${product.name} details`}
                className={`fixed right-0 top-0 z-50 h-screen w-full max-w-5xl overflow-hidden bg-background shadow-2xl transition-transform duration-300 lg:w-[75vw] ${
                    open ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex h-full flex-col">
                    {/* Sticky header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
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
                        <div className="flex items-center gap-2">
                            {onOpenFullPage && (
                                <button
                                    type="button"
                                    onClick={() => onOpenFullPage(product.id)}
                                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    title="Open in full page"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Full page
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                aria-label="Close panel"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Hero zone · brand · name · SKU · rating · itemStatus */}
                        <div className="px-6 pt-6 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        {product.brand}
                                    </span>
                                    <h1 className="mt-1 text-2xl font-bold text-foreground">{product.name}</h1>
                                    {/* SKU row · MFR + Internal · copy buttons */}
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(mfrSku, 'mfr')}
                                            className="group inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-foreground hover:bg-muted transition-colors"
                                            title="Copy MFR SKU"
                                        >
                                            <span className="text-[10px] font-sans font-bold uppercase tracking-wide text-muted-foreground">MFR</span>
                                            {mfrSku}
                                            {skuCopied === 'mfr'
                                                ? <CheckCircle2 className="h-3 w-3 text-foreground" />
                                                : <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(internalSku, 'internal')}
                                            className="group inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-foreground hover:bg-muted transition-colors"
                                            title="Copy Internal SKU"
                                        >
                                            <span className="text-[10px] font-sans font-bold uppercase tracking-wide text-muted-foreground">Internal</span>
                                            {internalSku}
                                            {skuCopied === 'internal'
                                                ? <CheckCircle2 className="h-3 w-3 text-foreground" />
                                                : <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />}
                                        </button>
                                        {itemStatus !== 'active' && (
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                                itemStatus === 'discontinued'
                                                    ? 'bg-muted text-muted-foreground'
                                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                            }`}>
                                                {itemStatus === 'discontinued' ? 'Discontinued' : 'Catalog out of sync'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {product.dealerRating && (
                                        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                                            <Star className="h-3.5 w-3.5 fill-foreground" />
                                            {product.dealerRating.toFixed(1)}
                                            <span className="text-xs text-muted-foreground">Dealer Rated</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {product.popular && (
                                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Often selected for similar projects
                                </p>
                            )}
                        </div>

                        {/* Split layout · gallery left · buy box right (sticky en desktop) */}
                        <div className="grid grid-cols-1 gap-6 px-6 pb-6 lg:grid-cols-[3fr_2fr]">
                            <div>
                                <Gallery product={product} />
                                {/* Colorways debajo de la galería */}
                                {product.colorways.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                                            Colorways ({product.colorways.length})
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {product.colorways.map(c => (
                                                <button
                                                    key={c.code}
                                                    type="button"
                                                    onClick={() => setColorwayCode(c.code)}
                                                    aria-pressed={colorwayCode === c.code}
                                                    title={`${c.name} · ${c.code}`}
                                                    className={`group flex flex-col items-center gap-1 rounded-lg p-1 transition-all ${
                                                        colorwayCode === c.code ? 'ring-2 ring-primary' : 'hover:bg-muted'
                                                    }`}
                                                >
                                                    <ColorwaySwatch hex={c.hex} size="md" />
                                                    <span className="text-[10px] font-mono text-muted-foreground">{c.code}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Buy box · sticky en desktop */}
                            <div className="lg:sticky lg:top-20 lg:self-start">
                                <BuyBox
                                    product={product}
                                    qty={qty}
                                    setQty={setQty}
                                    finishId={finishId}
                                    setFinishId={setFinishId}
                                    fabricId={fabricId}
                                    setFabricId={setFabricId}
                                    materialTierId={materialTierId}
                                    setMaterialTierId={setMaterialTierId}
                                    totals={totals}
                                    savingsPct={savingsPct}
                                    onAddToQuote={() => onAddToQuote(product)}
                                />
                            </div>
                        </div>

                        {/* Below the fold · secciones inline (no tabs) */}
                        <div className="border-t border-border bg-muted/30 px-6 py-6 space-y-6">
                            <Section title="Description" defaultOpen>
                                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                                {product.standardFeatures && product.standardFeatures.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">About this item</h4>
                                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                                            {product.standardFeatures.slice(0, 5).map(f => (
                                                <li key={f} className="flex gap-2"><span className="text-foreground">•</span>{f}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </Section>

                            <MaterialsSection product={product} />

                            <Section title="Specifications" defaultOpen={false}>
                                <InfoTable data={{ ...product.specs, ...product.performance }} />
                            </Section>

                            {product.cleaning && (
                                <Section title="Care & Maintenance" defaultOpen={false}>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{product.cleaning}</p>
                                </Section>
                            )}

                            {product.documents && product.documents.length > 0 && (
                                <Section title="Documents" defaultOpen={false}>
                                    <ul className="space-y-2">
                                        {product.documents.map(d => (
                                            <li key={d.name}>
                                                <a className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                                                    <Download className="h-4 w-4 text-muted-foreground" />
                                                    {d.name}
                                                    <span className="ml-1 text-xs text-muted-foreground uppercase">{d.type}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}

/* ─── Internal components ──────────────────────────────────────────────── */

function Gallery({ product }: { product: Product }) {
    const [activeIdx, setActiveIdx] = useState(0)
    const allImages = [...product.images, ...(product.galleries ?? [])]
    return (
        <div>
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <img
                    src={allImages[activeIdx]}
                    alt={`${product.name} ${activeIdx + 1}`}
                    className="h-full w-full object-cover"
                />
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

interface BuyBoxProps {
    product: Product
    qty: number
    setQty: (q: number) => void
    finishId: string | undefined
    setFinishId: (id: string | undefined) => void
    fabricId: string | undefined
    setFabricId: (id: string | undefined) => void
    materialTierId: string | undefined
    setMaterialTierId: (id: string | undefined) => void
    totals: ReturnType<typeof computeLineItemTotals> | null
    savingsPct: number
    onAddToQuote: () => void
}

function BuyBox({
    product, qty, setQty, finishId, setFinishId, fabricId, setFabricId,
    materialTierId, setMaterialTierId, totals, savingsPct, onAddToQuote,
}: BuyBoxProps) {
    const variants = getProductVariants(product)
    if (!totals) return null

    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            {/* Price block */}
            <div className="mb-4">
                <div className="flex items-baseline gap-2">
                    {product.listPrice && product.listPrice > totals.unitPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                            ${product.listPrice.toLocaleString()}
                        </span>
                    )}
                    <span className="text-3xl font-bold text-foreground">
                        ${totals.unitPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">per unit</span>
                </div>
                {savingsPct > 0 && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        Save {savingsPct}%
                    </span>
                )}
                {totals.nextVolumeTier && (
                    <p className="mt-2 text-xs text-foreground">
                        💡 Add <span className="font-bold">{totals.nextVolumeTier.qtyNeeded}</span> more to save{' '}
                        <span className="font-bold">${totals.nextVolumeTier.savings.toLocaleString()}</span> on this order
                    </p>
                )}
            </div>

            {/* Variant selectors · solo si el product tiene */}
            {variants.finishes && variants.finishes.length > 0 && (
                <VariantGroup label={`Finish · ${variants.finishes.find(f => f.id === finishId)?.name ?? ''}`}>
                    <div className="flex flex-wrap gap-2">
                        {variants.finishes.map(f => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setFinishId(f.id)}
                                aria-pressed={finishId === f.id}
                                title={`${f.name}${f.priceModifier > 0 ? ` · +$${f.priceModifier}` : ''}`}
                                className={`group flex flex-col items-center gap-1 rounded-lg p-1 transition-all ${
                                    finishId === f.id ? 'ring-2 ring-primary' : 'hover:bg-muted'
                                }`}
                            >
                                <span className="h-7 w-7 rounded-md border border-border" style={{ backgroundColor: f.swatch }} />
                                {f.priceModifier > 0 && (
                                    <span className="text-[10px] font-semibold text-muted-foreground">+${f.priceModifier}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </VariantGroup>
            )}

            {variants.fabricOptions && variants.fabricOptions.length > 0 && (
                <VariantGroup label="Fabric">
                    <select
                        value={fabricId ?? ''}
                        onChange={(e) => setFabricId(e.target.value || undefined)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                    >
                        {variants.fabricOptions.map(f => (
                            <option key={f.id} value={f.id}>
                                {f.name}{f.priceModifier > 0 ? ` · +$${f.priceModifier}` : ''}{f.type === 'special' ? ' (premium)' : ''}
                            </option>
                        ))}
                    </select>
                    {variants.fabricOptions.find(f => f.id === fabricId)?.type === 'special' && (
                        <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                            ⚠ Premium fabric · additional cost + extended lead time
                        </p>
                    )}
                </VariantGroup>
            )}

            {variants.materialTiers && variants.materialTiers.length > 1 && (
                <VariantGroup label="Material tier">
                    <div className="flex gap-2">
                        {variants.materialTiers.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setMaterialTierId(t.id)}
                                aria-pressed={materialTierId === t.id}
                                className={`flex-1 rounded-lg border-2 px-2 py-2 text-xs font-medium transition-colors ${
                                    materialTierId === t.id
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-input bg-background text-foreground hover:bg-muted'
                                }`}
                            >
                                <div>{t.name}</div>
                                {t.priceModifier > 0 && (
                                    <div className={`text-[10px] mt-0.5 ${materialTierId === t.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                        +${t.priceModifier}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </VariantGroup>
            )}

            {/* Quantity stepper */}
            <VariantGroup label="Quantity">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input text-foreground hover:bg-muted transition-colors"
                        aria-label="Decrease quantity"
                    >−</button>
                    <input
                        type="number"
                        value={qty}
                        min={1}
                        onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="h-9 w-16 rounded-lg border border-input bg-background text-center text-sm font-semibold text-foreground focus:border-ring focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => setQty(qty + 1)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input text-foreground hover:bg-muted transition-colors"
                        aria-label="Increase quantity"
                    >+</button>
                </div>
            </VariantGroup>

            {/* Totals + lead time */}
            <div className="my-4 space-y-1 border-y border-border py-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-foreground">${totals.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Estimated lead time</span>
                    <span className="font-medium text-foreground">{formatLeadTime(totals.leadTimeDays)}</span>
                </div>
            </div>

            {/* CTAs */}
            <button
                type="button"
                onClick={onAddToQuote}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
                Add to Quote
                <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
                type="button"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
                <Heart className="h-4 w-4" />
                Save for later
            </button>

            {/* Trust line */}
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Sold by {product.brand} · Free returns within 30 days
            </p>
        </div>
    )
}

function VariantGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-3">
            <h4 className="mb-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">{label}</h4>
            {children}
        </div>
    )
}

function Section({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen ?? false)
    return (
        <div className="rounded-xl border border-border bg-card">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {open && <div className="border-t border-border px-4 py-4">{children}</div>}
        </div>
    )
}

function MaterialsSection({ product }: { product: Product }) {
    const variants = getProductVariants(product)
    const hasContent = variants.fabricOptions || variants.finishes || product.material || product.upholstery
    if (!hasContent) return null

    const standardCount = variants.fabricOptions?.filter(f => f.type === 'standard').length ?? 0
    const specialCount = variants.fabricOptions?.filter(f => f.type === 'special').length ?? 0

    return (
        <Section title="Materials & Finishes" defaultOpen>
            {variants.fabricOptions && (
                <>
                    <p className="text-xs text-muted-foreground mb-3">
                        Available: <span className="font-semibold text-foreground">{standardCount} standard</span>
                        {specialCount > 0 && (
                            <>, <span className="font-semibold text-amber-700 dark:text-amber-400">{specialCount} premium</span> (additional cost)</>
                        )}
                    </p>
                    <ul className="space-y-1.5">
                        {variants.fabricOptions.map(f => (
                            <li key={f.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-medium text-foreground">{f.name}</span>
                                    {f.type === 'special' && (
                                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                            Premium
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                                    {f.priceModifier > 0 ? <span className="font-semibold text-foreground">+${f.priceModifier}</span> : 'Included'}
                                    {f.leadTimeAdjust > 0 && <span className="block">+{f.leadTimeAdjust} days lead</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            {!variants.fabricOptions && (product.material || product.upholstery) && (
                <div className="text-sm text-muted-foreground space-y-1">
                    {product.material && <div>Material: <span className="text-foreground font-medium">{product.material}</span></div>}
                    {product.upholstery && <div>Upholstery: <span className="text-foreground font-medium">{product.upholstery}</span></div>}
                </div>
            )}
        </Section>
    )
}

function InfoTable({ data }: { data: Record<string, string> }) {
    return (
        <table className="w-full text-sm">
            <tbody>
                {Object.entries(data).map(([key, val]) => (
                    <tr key={key} className="border-b border-border last:border-0">
                        <td className="py-2.5 pr-4 font-semibold text-foreground uppercase text-xs tracking-wide w-52 shrink-0 align-top">
                            {key}
                        </td>
                        <td className="py-2.5 text-muted-foreground leading-relaxed">{val}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
