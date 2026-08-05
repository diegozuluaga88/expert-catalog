// F58a.3 · SpacePhotoCard (2026-08-05)
// Alternate a SpaceBundleCard cuando el setting tiene una foto real +
// imageOverlay con coords precisas · absorbe el UI del ex
// InstallationDetailModal. Se usa por defecto en settings con
// isUserUpload=true. El toggle Bundle/Photo del SpaceTypeDetailPage
// decide cuál renderizar.
//
// Layout · 2 columnas · imagen full a la izq con hotspots numerados
// posicionados a los xPct/yPct exactos + lista de tagged products a la
// der (lookup en UNIFIED_PRODUCTS). Notas + designFirm en el fondo del
// bloque · footer "Add all" comparte pattern con SpaceBundleCard para
// consistencia.

import { useState } from 'react'
import { Plus, Info } from 'lucide-react'
import type { SpaceType, SpaceTypeSetting } from '../types'
import { UNIFIED_PRODUCTS } from '../showroom/data/unifiedProducts'
import { formatPriceRange } from '../data/catalogues'

interface Props {
    setting: SpaceTypeSetting
    spaceType: SpaceType
    onAddToSelection: (setting: SpaceTypeSetting) => void
    /** Callback opcional · click en un hotspot navega al product binder. */
    onNavigateToProduct?: (productId: string) => void
}

export default function SpacePhotoCard({ setting, spaceType, onAddToSelection, onNavigateToProduct }: Props) {
    const { code, name, description, notes, bundle, imageUrl, designFirm } = setting
    const overlays = bundle.imageOverlay ?? []
    const totalItems = bundle.items.reduce((sum, i) => sum + i.qty, 0)
    // Uploads sin cost estimate (0-0) · en ese caso ocultamos el range en el footer.
    const hasCostEstimate = bundle.estimatedCostMin > 0 || bundle.estimatedCostMax > 0
    const costRangeText = hasCostEstimate
        ? formatPriceRange(bundle.estimatedCostMin, bundle.estimatedCostMax, bundle.currencyId)
        : null

    const [hoveredTag, setHoveredTag] = useState<number | null>(null)
    const [imgFailed, setImgFailed] = useState(false)

    return (
        <article className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors">
            <div className="border-b border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="inline-flex items-center rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                                {code}
                            </span>
                            {designFirm && (
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                                    {designFirm}
                                </span>
                            )}
                        </div>
                        <h3 className="text-sm font-bold text-foreground truncate">{name}</h3>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 p-4">
                {/* Left · foto + hotspots a los xPct/yPct exactos */}
                <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                    {imageUrl && !imgFailed ? (
                        <img
                            src={imageUrl}
                            alt={`${name} installation photo`}
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={() => setImgFailed(true)}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/40 to-card">
                            <span className="text-6xl opacity-30 select-none" role="img" aria-hidden="true">
                                {spaceType.icon ?? '🏢'}
                            </span>
                        </div>
                    )}
                    {overlays.map((tag, i) => {
                        const product = UNIFIED_PRODUCTS.find(p => p.id === tag.productId)
                        const label = product?.name ?? 'Product'
                        const active = hoveredTag === i
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onNavigateToProduct?.(tag.productId)}
                                onMouseEnter={() => setHoveredTag(i)}
                                onMouseLeave={() => setHoveredTag(null)}
                                onFocus={() => setHoveredTag(i)}
                                onBlur={() => setHoveredTag(null)}
                                aria-label={`Tag ${i + 1} · ${label}`}
                                title={label}
                                className={`absolute -translate-x-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-lg ring-2 ring-white transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60 ${active ? 'bg-primary text-primary-foreground scale-125' : 'bg-white text-foreground hover:scale-110'}`}
                                style={{ left: `${tag.xPct}%`, top: `${tag.yPct}%` }}
                            >
                                {i + 1}
                            </button>
                        )
                    })}
                    {overlays.length === 0 && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-1.5 text-[11px] text-white text-center">
                            No products tagged yet · edit to add
                        </div>
                    )}
                </div>

                {/* Right · tagged products list */}
                <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-foreground mb-3">
                        {code} · Tagged products
                    </h4>
                    <ol className="space-y-2 flex-1">
                        {overlays.map((tag, i) => {
                            const product = UNIFIED_PRODUCTS.find(p => p.id === tag.productId)
                            const active = hoveredTag === i
                            return (
                                <li key={i}>
                                    <button
                                        type="button"
                                        onClick={() => onNavigateToProduct?.(tag.productId)}
                                        onMouseEnter={() => setHoveredTag(i)}
                                        onMouseLeave={() => setHoveredTag(null)}
                                        onFocus={() => setHoveredTag(i)}
                                        onBlur={() => setHoveredTag(null)}
                                        className={`flex w-full items-start gap-2 rounded-md p-1.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'bg-primary/10' : 'hover:bg-muted'}`}
                                    >
                                        <span className={`mt-0.5 inline-flex items-center justify-center h-5 w-5 flex-shrink-0 rounded-full text-[10px] font-bold transition-colors ${active ? 'bg-primary text-primary-foreground scale-110' : 'bg-primary text-primary-foreground'}`}>
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            {product?.brand && (
                                                <div className="text-[10px] text-muted-foreground truncate">{product.brand}</div>
                                            )}
                                            <div className="text-xs font-semibold text-foreground truncate">
                                                {product?.name ?? 'Product not found'}
                                            </div>
                                            {tag.note && (
                                                <div className="text-[10px] text-muted-foreground italic mt-0.5">{tag.note}</div>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            )
                        })}
                        {overlays.length === 0 && (
                            <li className="text-xs text-muted-foreground italic">No tags yet.</li>
                        )}
                    </ol>

                    {costRangeText && (
                        <div className="mt-3 pt-3 border-t border-border flex items-baseline justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Estimated Cost
                            </span>
                            <span className="text-base font-bold text-foreground">{costRangeText}</span>
                        </div>
                    )}
                </div>
            </div>

            {notes && notes.length > 0 && (
                <div className="border-t border-border bg-muted/30 px-4 py-3">
                    <div className="flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <ul className="space-y-1 text-[11px] text-muted-foreground leading-relaxed">
                            {notes.map((n, i) => (
                                <li key={i}>{n}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className="border-t border-border bg-muted/20 p-3">
                <button
                    type="button"
                    onClick={() => onAddToSelection(setting)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add all {totalItems} items to Selection
                    {costRangeText && <span className="ml-auto opacity-90">{costRangeText}</span>}
                </button>
            </div>
        </article>
    )
}
