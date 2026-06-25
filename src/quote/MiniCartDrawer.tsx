// Phase 3 Fix #11 — Mini-cart drawer slide-in (Amazon pattern · refinado).
//
// Iteración 2 post Diego review:
//  - Hover real · onMouseEnter pausa el auto-dismiss, onMouseLeave restart
//  - Muestra TODOS los items del activeDraft (no solo el último batch) ·
//    los recién agregados con badge "NEW" y bg-primary/5 highlight
//  - Footer · "X new items · Y total in cart · $Z" claro · accumulación visible

import { useEffect, useState } from 'react'
import { ArrowUpRight, CheckCircle2, X } from 'lucide-react'
import { useQuote } from './QuoteContext'

interface MiniCartDrawerProps {
    onViewQuote: (draftId: string) => void
}

export default function MiniCartDrawer({ onViewQuote }: MiniCartDrawerProps) {
    const { lastAdded, clearLastAdded, activeDraft } = useQuote()
    const [hovering, setHovering] = useState(false)

    // Auto-dismiss 8s · pausa con hover, restart cuando sale el mouse.
    useEffect(() => {
        if (!lastAdded || hovering) return
        const timer = setTimeout(() => clearLastAdded(), 8000)
        return () => clearTimeout(timer)
    }, [lastAdded, hovering, clearLastAdded])

    if (!lastAdded || !activeDraft) return null

    const justAddedIds = new Set(lastAdded.addedItems.map(i => i.id))
    const allItems = activeDraft.items
    const totalInCart = allItems.reduce((s, it) => s + it.qty, 0)
    const totalPriceInCart = allItems.reduce((s, it) => s + it.totalPrice, 0)
    const justAddedCount = lastAdded.itemCount

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-[70] w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {/* Header · just added count + tenant badge + close */}
            <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
                <div className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">
                        +{justAddedCount} {justAddedCount === 1 ? 'line added' : 'lines added'}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                        to <span className="font-semibold text-foreground">{activeDraft.name}</span>
                        <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                            {lastAdded.tenantName}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => clearLastAdded()}
                    className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Items list · ALL items del activeDraft · max 4 visible · scroll si más */}
            <div className="max-h-64 overflow-y-auto border-b border-border bg-background">
                <ul className="divide-y divide-border">
                    {allItems.slice(0, 4).map(item => {
                        const isJustAdded = justAddedIds.has(item.id)
                        return (
                            <li key={item.id} className={`flex items-center gap-3 px-4 py-2.5 ${
                                isJustAdded ? 'bg-primary/5' : ''
                            }`}>
                                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                    <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="truncate text-xs font-semibold text-foreground">{item.productName}</span>
                                        {isJustAdded && (
                                            <span className="inline-flex items-center rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">New</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        {item.colorwayHex && (
                                            <span className="inline-block h-2.5 w-2.5 rounded-sm border border-border" style={{ backgroundColor: item.colorwayHex }} />
                                        )}
                                        <span>{item.colorwayName ?? '—'}</span>
                                        {item.fabricIsPremium && <span className="rounded-full bg-amber-500/15 px-1 text-amber-700 dark:text-amber-400">premium</span>}
                                    </div>
                                </div>
                                <div className="text-right text-xs">
                                    <div className="font-semibold text-foreground">×{item.qty}</div>
                                    <div className="text-muted-foreground">${item.totalPrice.toLocaleString()}</div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
                {allItems.length > 4 && (
                    <p className="border-t border-border bg-muted/40 px-4 py-1.5 text-center text-[10px] text-muted-foreground">
                        + {allItems.length - 4} more in cart
                    </p>
                )}
            </div>

            {/* Footer · totals + CTA */}
            <div className="flex items-center justify-between gap-3 bg-card px-4 py-3">
                <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Cart total</div>
                    <div className="text-base font-bold text-foreground">${totalPriceInCart.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">
                        {totalInCart} {totalInCart === 1 ? 'unit' : 'units'} · {allItems.length} {allItems.length === 1 ? 'line' : 'lines'}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => { onViewQuote(lastAdded.draftId); clearLastAdded() }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                    View Quote
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Hover hint · subtle indicator */}
            {hovering && (
                <div className="bg-muted/50 px-4 py-1 text-center text-[10px] text-muted-foreground">
                    Auto-close paused while hovering
                </div>
            )}
        </div>
    )
}
