// Phase 3 Fix #11 — Mini-cart drawer slide-in (Amazon pattern).
// Aparece tras un add via useQuote().addItems() · auto-dismiss después de 8s,
// puede pinearse / cerrarse manualmente. Slide-in from right · width ~400px.

import { useEffect, useState } from 'react'
import { ArrowUpRight, CheckCircle2, X } from 'lucide-react'
import { useQuote } from './QuoteContext'

interface MiniCartDrawerProps {
    /** Called cuando el user clickea "View Quote" · navega a /quotes/:draftId */
    onViewQuote: (draftId: string) => void
}

export default function MiniCartDrawer({ onViewQuote }: MiniCartDrawerProps) {
    const { lastAdded, clearLastAdded, activeDraft } = useQuote()
    const [pinned, setPinned] = useState(false)

    // Auto-dismiss después de 8s si no está pinned
    useEffect(() => {
        if (!lastAdded || pinned) return
        const timer = setTimeout(() => {
            clearLastAdded()
            setPinned(false)
        }, 8000)
        return () => clearTimeout(timer)
    }, [lastAdded, pinned, clearLastAdded])

    if (!lastAdded) return null

    const totalUnits = lastAdded.addedItems.reduce((s, it) => s + it.qty, 0)
    const totalPrice = lastAdded.addedItems.reduce((s, it) => s + it.totalPrice, 0)
    const draftTotalItems = activeDraft?.items.reduce((s, it) => s + it.qty, 0) ?? totalUnits
    const draftTotalPrice = activeDraft?.items.reduce((s, it) => s + it.totalPrice, 0) ?? totalPrice

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-[70] w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
            onMouseEnter={() => setPinned(true)}
        >
            {/* Header con checkmark + count */}
            <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">
                        {lastAdded.itemCount} {lastAdded.itemCount === 1 ? 'line' : 'lines'} added
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        to <span className="font-semibold text-foreground">{lastAdded.draftName}</span>
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                            {lastAdded.tenantName}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => { clearLastAdded(); setPinned(false) }}
                    className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Just-added items preview · max 3 */}
            <div className="border-b border-border bg-background px-4 py-3">
                <ul className="space-y-2">
                    {lastAdded.addedItems.slice(0, 3).map(item => (
                        <li key={item.id} className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-semibold text-foreground">{item.productName}</div>
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
                    ))}
                </ul>
                {lastAdded.addedItems.length > 3 && (
                    <p className="mt-2 text-[10px] text-muted-foreground">+ {lastAdded.addedItems.length - 3} more</p>
                )}
            </div>

            {/* Footer · totals + CTA */}
            <div className="flex items-center justify-between gap-3 bg-card px-4 py-3">
                <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Quote total</div>
                    <div className="text-sm font-bold text-foreground">${draftTotalPrice.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">{draftTotalItems} {draftTotalItems === 1 ? 'unit' : 'units'} in cart</div>
                </div>
                <button
                    type="button"
                    onClick={() => { onViewQuote(lastAdded.draftId); clearLastAdded(); setPinned(false) }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                    View Quote
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Pin indicator hint cuando hover · disable auto-dismiss */}
            {pinned && (
                <div className="bg-muted/50 px-4 py-1 text-center text-[10px] text-muted-foreground">
                    Pinned · won't auto-close
                </div>
            )}
        </div>
    )
}
