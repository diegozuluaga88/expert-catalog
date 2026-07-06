import { Plus, MapPin, DollarSign, Info } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SpaceTypeSetting } from '../types'
import { findProductStub } from '../data/productGroups'

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

interface Props {
    setting: SpaceTypeSetting
    onAddToSelection: (setting: SpaceTypeSetting) => void
    /** Si true muestra card compacto (grid); si false muestra card full con notes de uso. */
    compact?: boolean
}

// Card de un Space Type Setting · muestra header (code + name), item list
// (grouped por productGroup con qty), estimated cost, notes, botón "Add all"
export default function SpaceBundleCard({ setting, onAddToSelection, compact = false }: Props) {
    const { code, name, description, notes, bundle } = setting

    const totalItems = bundle.items.reduce((sum, i) => sum + i.qty, 0)
    const costMin = bundle.estimatedCostMin.toLocaleString()
    const costMax = bundle.estimatedCostMax.toLocaleString()

    return (
        <article className={cn(
            'flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors',
            compact ? '' : 'h-full',
        )}>
            {/* Header · code + name + cost badge */}
            <div className="border-b border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                                {code}
                            </span>
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground truncate">{name}</h3>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Est. cost</span>
                        <span className="text-sm font-bold text-foreground">${costMin}–${costMax}</span>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>

            {/* Item list · grouped */}
            <div className="flex-1 p-4 space-y-2">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Bundle · {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </span>
                </div>
                <ul className="space-y-1.5">
                    {bundle.items.map((bi, idx) => {
                        const stub = findProductStub(bi.itemId)
                        if (!stub) {
                            return (
                                <li key={idx} className="flex items-center justify-between gap-2 text-xs text-destructive">
                                    <span>Missing · {bi.productGroupCode}</span>
                                </li>
                            )
                        }
                        return (
                            <li key={idx} className="flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="inline-flex items-center justify-center h-5 min-w-[24px] rounded bg-muted px-1.5 text-[10px] font-bold text-foreground">
                                        {bi.label ?? bi.productGroupCode}
                                    </span>
                                    <span className="text-foreground truncate">{stub.name}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {stub.manufacturerHint && (
                                        <span className="text-[10px] text-muted-foreground hidden sm:inline">{stub.manufacturerHint}</span>
                                    )}
                                    <span className="text-muted-foreground font-semibold">×{bi.qty}</span>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>

            {/* Notes de uso (solo en modo full) */}
            {!compact && notes && notes.length > 0 && (
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

            {/* Footer · Add all to selection */}
            <div className="border-t border-border bg-muted/20 p-3">
                <button
                    type="button"
                    onClick={() => onAddToSelection(setting)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add all {totalItems} items to Selection
                    <DollarSign className="h-3 w-3 opacity-70 ml-auto" />
                    <span className="opacity-90">{costMin}–{costMax}</span>
                </button>
            </div>
        </article>
    )
}
