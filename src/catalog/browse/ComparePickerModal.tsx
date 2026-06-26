// Picker overlay para seleccionar productos a comparar contra el current product.
// Diego: "en el modal de detalle del producto deberíamos habilitar también la
// funcionalidad de comparar partiendo el elemento que se esté revisando y
// mostrando al otro una lista de elementos para seleccionar y luego comparar".
//
// Flow · Click "Compare with..." en BuyBox → este picker overlay aparece encima
// del detail modal · user pickea hasta 3 productos (CompareModal soporta 4 cols)
// → click Compare → cierra picker + abre CompareModal con [current, ...picked].

import { useMemo, useState } from 'react'
import { Check, GitCompareArrows, Search, Sparkles, Star, X } from 'lucide-react'
import type { Product } from '../types'
import { UNIFIED_PRODUCTS } from '../showroom/data/unifiedProducts'
import { getRelatedProducts } from '../related'
import { resolveInternalSku } from './catalogSku'

const MAX_COMPARE = 3

interface ComparePickerModalProps {
    open: boolean
    currentProduct: Product
    onClose: () => void
    onConfirm: (selected: Product[]) => void
}

export default function ComparePickerModal({ open, currentProduct, onClose, onConfirm }: ComparePickerModalProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [search, setSearch] = useState('')

    const related = useMemo(() => getRelatedProducts(currentProduct), [currentProduct])

    // Concat curated suggestions (dedup) · primer lugar de la lista
    const curated = useMemo(() => {
        const seen = new Set([currentProduct.id])
        const out: Product[] = []
        for (const bucket of [related.complementary, related.betterPrice, related.fasterDelivery]) {
            for (const p of bucket.products) {
                if (seen.has(p.id)) continue
                seen.add(p.id)
                out.push(p)
            }
        }
        return out
    }, [related, currentProduct.id])

    // Para "Search all" · todos los productos no curated y no current
    const allOthers = useMemo(() => {
        const curatedIds = new Set(curated.map(p => p.id))
        return UNIFIED_PRODUCTS.filter(p => p.id !== currentProduct.id && !curatedIds.has(p.id))
    }, [curated, currentProduct.id])

    const q = search.trim().toLowerCase()
    const filteredOthers = q
        ? allOthers.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.brand ?? '').toLowerCase().includes(q) ||
            (p.category ?? '').toLowerCase().includes(q) ||
            resolveInternalSku(p).toLowerCase().includes(q)
        )
        : allOthers.slice(0, 20)

    const toggle = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id)
            if (prev.length >= MAX_COMPARE) return prev
            return [...prev, id]
        })
    }

    const handleConfirm = () => {
        const picked = selectedIds
            .map(id => UNIFIED_PRODUCTS.find(p => p.id === id))
            .filter((p): p is Product => !!p)
        onConfirm(picked)
        setSelectedIds([])
        setSearch('')
    }

    const handleClose = () => {
        setSelectedIds([])
        setSearch('')
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={handleClose}>
            <div
                className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-border p-5">
                    <div>
                        <h2 className="flex items-center gap-2 font-brand text-lg font-bold text-foreground">
                            <GitCompareArrows className="h-5 w-5 text-foreground" />
                            Compare with…
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Pick up to {MAX_COMPARE} products to compare against
                            <span className="ml-1 font-semibold text-foreground">{currentProduct.name}</span>
                        </p>
                    </div>
                    <button type="button" onClick={handleClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="flex-shrink-0 border-b border-border bg-muted/20 px-5 py-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, brand, SKU, or category…"
                            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                        />
                    </div>
                </div>

                {/* List · curated arriba si no hay search · all results si hay search */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                    {!q && curated.length > 0 && (
                        <div className="mb-4">
                            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground">
                                <Sparkles className="h-3.5 w-3.5" />
                                Strata recommends comparing
                            </h3>
                            <ul className="space-y-1.5">
                                {curated.map(p => (
                                    <PickerRow key={p.id} product={p} checked={selectedIds.includes(p.id)} disabled={!selectedIds.includes(p.id) && selectedIds.length >= MAX_COMPARE} onToggle={() => toggle(p.id)} />
                                ))}
                            </ul>
                        </div>
                    )}
                    <div>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            {q ? `Results · ${filteredOthers.length}` : 'Other products'}
                        </h3>
                        <ul className="space-y-1.5">
                            {filteredOthers.map(p => (
                                <PickerRow key={p.id} product={p} checked={selectedIds.includes(p.id)} disabled={!selectedIds.includes(p.id) && selectedIds.length >= MAX_COMPARE} onToggle={() => toggle(p.id)} />
                            ))}
                            {filteredOthers.length === 0 && (
                                <li className="rounded-lg border border-dashed border-border bg-background px-3 py-6 text-center text-sm text-muted-foreground">
                                    No products match your search.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Footer · count + Compare CTA */}
                <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-5 py-3">
                    <div className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{selectedIds.length}</span> of {MAX_COMPARE} selected · plus
                        <span className="ml-1 font-semibold text-foreground">{currentProduct.name}</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={selectedIds.length === 0}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                    >
                        <GitCompareArrows className="h-4 w-4" />
                        Compare {selectedIds.length + 1} products
                    </button>
                </div>
            </div>
        </div>
    )
}

interface PickerRowProps {
    product: Product
    checked: boolean
    disabled: boolean
    onToggle: () => void
}

function PickerRow({ product, checked, disabled, onToggle }: PickerRowProps) {
    return (
        <li>
            <button
                type="button"
                onClick={onToggle}
                disabled={disabled}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    checked
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background hover:border-foreground/30 hover:bg-muted/50'
                }`}
            >
                <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                    checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
                }`}>
                    {checked && <Check className="h-3 w-3" />}
                </span>
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{product.brand}</span>
                        {product.dealerRating && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Star className="h-2.5 w-2.5 fill-foreground text-foreground" />
                                {product.dealerRating.toFixed(1)}
                            </span>
                        )}
                    </div>
                    <div className="truncate text-sm font-semibold text-foreground">{product.name}</div>
                </div>
                <div className="text-right text-xs">
                    <div className="font-bold text-foreground">${product.price?.toLocaleString() ?? '—'}</div>
                    {product.leadTime && <div className="text-muted-foreground">{product.leadTime}</div>}
                </div>
            </button>
        </li>
    )
}
