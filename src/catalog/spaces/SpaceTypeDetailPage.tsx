import { useState } from 'react'
import { ChevronLeft, CheckCircle2, ChevronDown } from 'lucide-react'
import { settingsForSpaceType } from '../data/spaceTypes'
import { findProductStub, PRODUCT_STUBS } from '../data/productGroups'
import type { SpaceType, SpaceTypeSetting } from '../types'
import SpaceBundleCard from './SpaceBundleCard'
import ProductIcon from './ProductIcon'
import { useQuote } from '../../quote/QuoteContext'

interface Props {
    spaceType: SpaceType
    onBack: () => void
    onViewSelection: () => void
}

// Fase 3 · Detail page redesigned · para cada setting muestra:
//   1. SpaceBundleCard (rendering + config numerada + notes + Add all)
//   2. Grid "Bundle products" con ProductIcon + code + name + price range
//      (replicando la sección de product cards del widget MillerKnoll).
export default function SpaceTypeDetailPage({ spaceType, onBack, onViewSelection }: Props) {
    const settings = settingsForSpaceType(spaceType.id)
    const { addBundle } = useQuote()

    const [toast, setToast] = useState<{ code: string; itemCount: number } | null>(null)
    // Fase 3.1 · state del variant expander en las mini cards de Bundle products.
    // Key = `${settingId}-${itemIndex}` (unique por card).
    const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set())

    const toggleVariants = (key: string) => {
        setExpandedVariants(prev => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }

    const handleAdd = (setting: SpaceTypeSetting) => {
        addBundle(setting)
        const itemCount = setting.bundle.items.reduce((s, i) => s + i.qty, 0)
        setToast({ code: setting.code, itemCount })
        setTimeout(() => setToast(null), 4000)
    }

    return (
        <div className="space-y-8 relative">
            {/* Breadcrumb + back */}
            <div>
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Space Types
                </button>
                <div className="flex items-start gap-3">
                    <div className="text-4xl">{spaceType.icon}</div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-foreground">{spaceType.name}</h1>
                            <div className="flex flex-wrap gap-1">
                                {spaceType.spaceProfile.map(sp => (
                                    <span
                                        key={sp}
                                        className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                                    >
                                        {sp}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                            {spaceType.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Por cada setting: card grande + grid de bundle products */}
            <div className="space-y-10">
                {settings.map(setting => (
                    <section key={setting.id} className="space-y-4">
                        <SpaceBundleCard
                            setting={setting}
                            spaceType={spaceType}
                            onAddToSelection={handleAdd}
                        />

                        {/* Bundle products grid · mini cards por item del bundle */}
                        <div>
                            <div className="flex items-baseline justify-between mb-3 px-1">
                                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {setting.code} · Bundle products
                                </h3>
                                <span className="text-[10px] text-muted-foreground">
                                    {setting.bundle.items.length} {setting.bundle.items.length === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {setting.bundle.items.map((bi, idx) => {
                                    const stub = findProductStub(bi.itemId)
                                    if (!stub) return null
                                    const priceMid = Math.round((stub.priceEstimateMin + stub.priceEstimateMax) / 2)
                                    // Fase 3.1 · variantes del mismo ProductGroup (silver schema · relación 1-a-N).
                                    // Excluye el default para el count del badge "+N variants".
                                    const variantsInGroup = PRODUCT_STUBS.filter(
                                        s => s.productGroupCode === bi.productGroupCode && s.id !== bi.itemId
                                    )
                                    const cardKey = `${setting.id}-${idx}`
                                    const isExpanded = expandedVariants.has(cardKey)
                                    return (
                                        <div
                                            key={cardKey}
                                            className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors"
                                        >
                                            <div className="relative">
                                                <ProductIcon productGroupCode={bi.productGroupCode} size="md" />
                                                {variantsInGroup.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleVariants(cardKey)}
                                                        className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-card/90 backdrop-blur border border-border/60 px-2 py-0.5 text-[10px] font-bold text-foreground shadow-sm hover:bg-card hover:border-primary/60 transition-colors"
                                                        title={`${variantsInGroup.length} variants available in ${bi.productGroupCode}`}
                                                    >
                                                        +{variantsInGroup.length} variants
                                                        <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="p-2.5 space-y-1.5">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-[10px] font-bold text-foreground">
                                                        {stub.productItemCode}
                                                    </span>
                                                    {stub.manufacturerHint && (
                                                        <span className="text-[9px] text-muted-foreground truncate">
                                                            {stub.manufacturerHint}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                                                    {stub.name}
                                                </h4>
                                                <div className="flex items-baseline justify-between pt-1 border-t border-border">
                                                    <span className="text-[10px] text-muted-foreground">from</span>
                                                    <span className="text-xs font-bold text-foreground">
                                                        ${priceMid.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Variant expander · inline · sin cambiar el default del bundle-add */}
                                            {isExpanded && variantsInGroup.length > 0 && (
                                                <div className="border-t border-border bg-muted/30 p-2 space-y-1.5">
                                                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                                        Also in {bi.productGroupCode}
                                                    </p>
                                                    {variantsInGroup.map(v => {
                                                        const vPrice = Math.round((v.priceEstimateMin + v.priceEstimateMax) / 2)
                                                        return (
                                                            <div key={v.id} className="flex items-start justify-between gap-2 text-[11px]">
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="font-bold text-foreground">{v.productItemCode}</span>
                                                                        {v.manufacturerHint && (
                                                                            <span className="text-[9px] text-muted-foreground truncate">
                                                                                {v.manufacturerHint}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-foreground/80 truncate">{v.name}</p>
                                                                </div>
                                                                <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                                                                    ${vPrice.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                    <p className="text-[9px] text-muted-foreground italic pt-1 border-t border-border/60">
                                                        Add uses default (silver schema · single ProductItem)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </section>
                ))}
            </div>

            {settings.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground">No settings configured for this space type yet.</p>
                </div>
            )}

            {/* Toast · confirmación con CTA a la selection */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-foreground" />
                    <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-bold text-foreground">
                            {toast.itemCount} items added from {toast.code}
                        </span>
                        <button
                            type="button"
                            onClick={onViewSelection}
                            className="self-start text-xs font-semibold text-foreground underline hover:no-underline"
                        >
                            View My Selection →
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
