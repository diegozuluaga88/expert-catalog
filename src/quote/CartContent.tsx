// F50 · unificación workspace (2026-08-03) · v2 · content del cart
// extraído del MiniCartDrawer para poder reusarlo dentro del
// WorkspaceDrawer.tab Selection. Mismo funcionamiento inline (qty
// stepper, edit variants, delete, clear all, view selection CTA) que
// tenía el MiniCartDrawer · sin el FAB ni el header del wrapper (esos
// los pone el WorkspaceDrawer).

import { useState } from 'react'
import { ArrowUpRight, Minus, Pencil, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { useQuote } from './QuoteContext'
import { formatPrice } from '../catalog/data/catalogues'

interface CartContentProps {
    /** Callback para el CTA "View Selection" · el consumer decide dónde navegar. */
    onViewSelection: () => void
    /** Ids de items recién agregados (para pintar highlight bg-primary/5).
     *  Opcional · si no viene, no se marca ningún item. */
    justAddedIds?: Set<string>
}

export default function CartContent({ onViewSelection, justAddedIds }: CartContentProps) {
    const { activeDraft, updateItem, removeItem, startEditingItem, clearDraftItems } = useQuote()
    const [confirmClear, setConfirmClear] = useState(false)

    if (!activeDraft || activeDraft.items.length === 0) {
        return (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No items in selection yet. Add products from the catalog.
            </div>
        )
    }

    const allItems = activeDraft.items
    const totalInCart = allItems.reduce((s, it) => s + it.qty, 0)
    const totalPriceInCart = allItems.reduce((s, it) => s + it.totalPrice, 0)

    const handleClearAll = () => {
        clearDraftItems(activeDraft.id)
        setConfirmClear(false)
    }

    return (
        <>
            {/* Items list · máx 4 visible · scroll si más */}
            <div className="max-h-64 overflow-y-auto border-b border-border bg-background">
                <ul className="divide-y divide-border">
                    {allItems.slice(0, 4).map((item) => {
                        const isJustAdded = justAddedIds?.has(item.id) ?? false
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
                                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                                    {item.productImage ? (
                                        <img
                                            src={item.productImage}
                                            alt={item.productName}
                                            className="h-full w-full object-cover"
                                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                                        />
                                    ) : (
                                        <span className="text-[9px] font-bold text-muted-foreground">
                                            {item.productName.slice(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="truncate text-xs font-semibold text-foreground">{item.productName}</span>
                                        {isJustAdded && (
                                            <span className="inline-flex items-center rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">New</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap">
                                        {item.colorwayHex && (
                                            <span className="inline-block h-2.5 w-2.5 rounded-sm border border-border" style={{ backgroundColor: item.colorwayHex }} />
                                        )}
                                        <span>{item.colorwayName ?? '—'}</span>
                                        {item.settingCode && (
                                            <span
                                                className="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-foreground"
                                                title={`Added from ${item.settingName ?? item.settingCode}`}
                                            >
                                                {item.settingCode}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] font-semibold text-foreground">{formatPrice(item.totalPrice)}</div>
                                </div>
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
                        + {allItems.length - 4} more in selection
                    </p>
                )}
            </div>

            {/* Clear all confirmation (inline) */}
            {confirmClear && (
                <div className="flex items-center gap-2 border-t border-border bg-destructive/10 px-4 py-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-destructive" />
                    <span className="flex-1 text-xs font-medium text-foreground">
                        Clear all {allItems.length} {allItems.length === 1 ? 'line' : 'lines'}?
                    </span>
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="rounded bg-destructive px-2.5 py-1 text-[11px] font-bold text-destructive-foreground hover:bg-destructive/90"
                    >
                        Yes, clear
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="rounded border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Footer · totals + Clear all + CTA */}
            <div className="flex items-center justify-between gap-3 bg-card px-4 py-3">
                <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Selection total</div>
                    <div className="text-base font-bold text-foreground">{formatPrice(totalPriceInCart)}</div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{totalInCart} {totalInCart === 1 ? 'unit' : 'units'} · {allItems.length} {allItems.length === 1 ? 'line' : 'lines'}</span>
                        {!confirmClear && allItems.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setConfirmClear(true)}
                                className="font-medium text-muted-foreground underline transition-colors hover:text-destructive"
                                title="Remove all items from this quote draft"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onViewSelection}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                    View Selection
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </>
    )
}
