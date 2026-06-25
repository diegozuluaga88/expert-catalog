// Phase 3 Fix #11 — Mini-cart drawer slide-in (Amazon pattern · refinado).
//
// Iteración 2 post Diego review:
//  - Hover real · onMouseEnter pausa el auto-dismiss, onMouseLeave restart
//  - Muestra TODOS los items del activeDraft (no solo el último batch) ·
//    los recién agregados con badge "NEW" y bg-primary/5 highlight
//  - Footer · "X new items · Y total in cart · $Z" claro · accumulación visible

import { useEffect, useState } from 'react'
import { ArrowUpRight, CheckCircle2, Minus, Pencil, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { useQuote } from './QuoteContext'

interface MiniCartDrawerProps {
    onViewQuote: (draftId: string) => void
}

export default function MiniCartDrawer({ onViewQuote }: MiniCartDrawerProps) {
    const { lastAdded, clearLastAdded, activeDraft, updateItem, removeItem, startEditingItem } = useQuote()
    const [hovering, setHovering] = useState(false)
    // Diego ask · drawer puede reabrirse via FAB cuando ya no hay lastAdded
    const [manuallyOpened, setManuallyOpened] = useState(false)
    const showDrawer = !!lastAdded || manuallyOpened

    // Auto-dismiss 8s · solo cuando triggered by lastAdded (no si manuallyOpened) ·
    // pausa con hover, restart cuando sale el mouse.
    useEffect(() => {
        if (!lastAdded || hovering || manuallyOpened) return
        const timer = setTimeout(() => clearLastAdded(), 8000)
        return () => clearTimeout(timer)
    }, [lastAdded, hovering, manuallyOpened, clearLastAdded])

    const handleClose = () => {
        clearLastAdded()
        setManuallyOpened(false)
    }

    // FAB cuando drawer closed pero el cart tiene items · click → reabre el drawer
    const cartHasItems = activeDraft && activeDraft.items.length > 0
    if (!showDrawer) {
        if (!cartHasItems) return null
        const totalUnits = activeDraft.items.reduce((s, it) => s + it.qty, 0)
        return (
            <button
                type="button"
                onClick={() => setManuallyOpened(true)}
                className="fixed bottom-6 right-6 z-[70] inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-2xl transition-all hover:scale-105 hover:bg-primary/90 animate-in slide-in-from-bottom-2 fade-in duration-200"
                aria-label={`Open quote cart · ${totalUnits} units`}
                title="Open quote cart"
            >
                <ShoppingCart className="h-5 w-5" />
                <span>{totalUnits}</span>
                <span className="ml-1 text-xs opacity-90">in cart</span>
            </button>
        )
    }

    if (!activeDraft) return null

    // Cuando viene de FAB (manuallyOpened sin lastAdded), no hay items "just added"
    const justAddedIds = new Set(lastAdded?.addedItems.map(i => i.id) ?? [])
    const allItems = activeDraft.items
    const totalInCart = allItems.reduce((s, it) => s + it.qty, 0)
    const totalPriceInCart = allItems.reduce((s, it) => s + it.totalPrice, 0)
    const justAddedCount = lastAdded?.itemCount ?? 0

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-[70] w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {/* Header · cambia copy según si es post-add o manual reopen */}
            <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
                <div className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-foreground">
                    {lastAdded ? <CheckCircle2 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">
                        {lastAdded
                            ? `+${justAddedCount} ${justAddedCount === 1 ? 'line added' : 'lines added'}`
                            : 'Your quote cart'}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                        {lastAdded ? 'to' : ''} <span className="font-semibold text-foreground">{activeDraft.name}</span>
                        <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                            {activeDraft.buyerInfo.tenant.name}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Items list · ALL items del activeDraft · max 4 visible · scroll si más */}
            <div className="max-h-64 overflow-y-auto border-b border-border bg-background">
                <ul className="divide-y divide-border">
                    {allItems.slice(0, 4).map(item => {
                        const isJustAdded = justAddedIds.has(item.id)
                        const handleQtyChange = (delta: number) => {
                            const newQty = Math.max(1, item.qty + delta)
                            updateItem(activeDraft.id, item.id, {
                                qty: newQty,
                                totalPrice: item.unitPrice * newQty,
                            })
                        }
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
                                    <div className="text-[10px] font-semibold text-foreground">${item.totalPrice.toLocaleString()}</div>
                                </div>
                                {/* Qty stepper + edit + delete · inline */}
                                <div className="flex items-center gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => handleQtyChange(-1)}
                                        disabled={item.qty <= 1}
                                        className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="min-w-[28px] text-center text-xs font-bold text-foreground">{item.qty}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleQtyChange(1)}
                                        className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        aria-label="Increase quantity"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => startEditingItem(activeDraft.id, item)}
                                        className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                                        aria-label="Edit variants"
                                        title="Edit variants (color, finish, fabric…)"
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(activeDraft.id, item.id)}
                                        className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                        aria-label="Remove from quote"
                                        title="Remove from quote"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
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
                    onClick={() => { onViewQuote(activeDraft.id); handleClose() }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                    View Quote
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Hover hint · solo aplica si auto-dismiss está activo (lastAdded mode) */}
            {lastAdded && !manuallyOpened && hovering && (
                <div className="bg-muted/50 px-4 py-1 text-center text-[10px] text-muted-foreground">
                    Auto-close paused while hovering
                </div>
            )}
        </div>
    )
}
