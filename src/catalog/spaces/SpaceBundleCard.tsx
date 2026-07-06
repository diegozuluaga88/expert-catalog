import { Plus, Info } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SpaceType, SpaceTypeSetting } from '../types'
import { findProductStub } from '../data/productGroups'
import { formatPrice, formatPriceRange } from '../data/catalogues'
import SpaceRendering from './SpaceRendering'

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

interface Props {
    setting: SpaceTypeSetting
    spaceType: SpaceType
    onAddToSelection: (setting: SpaceTypeSetting) => void
}

// Fase 3 · Card 2-col inspirado en el widget MillerKnoll/Steelcase
// "Possible Space Configuration". Layout:
//   ┌───────────────┬────────────────────────────────┐
//   │  RENDERING    │  {CODE} Configuration          │
//   │  con hotspots │  ① CODE - Name           x1   │
//   │  numerados    │  ② CODE - Name           x1   │
//   │               │  ③ CODE - Name           x1   │
//   │               │  Estimated Cost $X - $Y        │
//   └───────────────┴────────────────────────────────┘
//   Notes de uso + botón "Add all N items to Selection"
export default function SpaceBundleCard({ setting, spaceType, onAddToSelection }: Props) {
    const { code, name, description, notes, bundle } = setting
    const totalItems = bundle.items.reduce((sum, i) => sum + i.qty, 0)
    // Fase P1.2 · Currency resolvable via bundle.currencyId (nuevo) o bundle.currency
    // (legacy 'USD'). formatPrice/Range agregan símbolo apropiado.
    const currencyId = bundle.currencyId ?? bundle.currency
    const costRangeText = formatPriceRange(bundle.estimatedCostMin, bundle.estimatedCostMax, currencyId)

    return (
        <article className={cn('flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors')}>
            {/* Header · code + name + description */}
            <div className="border-b border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="inline-flex items-center rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                                {code}
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground truncate">{name}</h3>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>

            {/* Cuerpo · 2-col: rendering + configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {/* Left · foto real del SpaceType + hotspots numerados overlay */}
                <SpaceRendering
                    imageUrl={spaceType.imageUrl}
                    fallbackIcon={spaceType.icon ?? '🏢'}
                    itemCount={bundle.items.length}
                    label={`${name} · ${bundle.items.length}-item configuration rendering`}
                />

                {/* Right · configuration list · badges circulares numerados */}
                <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-foreground mb-3">
                        {code} Configuration
                    </h4>
                    <ol className="space-y-2 flex-1">
                        {bundle.items.map((bi, idx) => {
                            const stub = findProductStub(bi.itemId)
                            return (
                                <li key={idx} className="flex items-start gap-2.5 text-xs">
                                    {/* Badge circular numerado · réplica del widget */}
                                    <span className="mt-0.5 inline-flex items-center justify-center h-5 w-5 flex-shrink-0 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                        {idx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline gap-1.5 flex-wrap">
                                            <span className="font-bold text-foreground underline decoration-dotted underline-offset-2">
                                                {bi.productGroupCode}
                                            </span>
                                            <span className="text-muted-foreground">·</span>
                                            <span className="text-foreground">
                                                {stub?.name ?? 'Missing product'}
                                            </span>
                                            <span className="ml-auto text-muted-foreground font-semibold">×{bi.qty}</span>
                                        </div>
                                        {stub?.manufacturerHint && (
                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                {stub.manufacturerHint}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ol>

                    {/* Estimated Cost prominent · separador */}
                    <div className="mt-3 pt-3 border-t border-border flex items-baseline justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Estimated Cost
                        </span>
                        <span className="text-base font-bold text-foreground">
                            {costRangeText}
                        </span>
                    </div>
                </div>
            </div>

            {/* Notes de uso · fondo sutil */}
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

            {/* Footer · Add all to selection */}
            <div className="border-t border-border bg-muted/20 p-3">
                <button
                    type="button"
                    onClick={() => onAddToSelection(setting)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add all {totalItems} items to Selection
                    <span className="ml-auto opacity-90">{costRangeText}</span>
                </button>
            </div>
        </article>
    )
}
