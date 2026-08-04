// F50 · Etapa 8 (P7 share) + F51 · B.3 · helpers compartidos para el
// grouping visual de una colección · antes vivían inline en ShowroomPageV2
// pero ahora también los consume CollectionShareView (la vista read-only
// del share link) · extracción sin cambio de comportamiento.

import type { ReactNode } from 'react'
import { LayoutGrid, Palette, Tag } from 'lucide-react'
import type { Product } from '../types'

export type CollectionGroupBy = 'flat' | 'color' | 'category'

/** Agrupa una lista de products por color (primer colorway) o category.
 *  El bucket sin valor ("Uncolored" / "Uncategorized") queda siempre al
 *  final del ordering alfabético. */
export function groupProductsBy(
    list: Product[],
    key: 'color' | 'category',
): Array<[string, Product[]]> {
    const groups = new Map<string, Product[]>()
    for (const p of list) {
        const groupKey =
            key === 'color'
                ? p.colorways?.[0]?.name ?? 'Uncolored'
                : p.category ?? 'Uncategorized'
        if (!groups.has(groupKey)) groups.set(groupKey, [])
        groups.get(groupKey)!.push(p)
    }
    const sortable: Array<[string, Product[]]> = Array.from(groups.entries())
    const bucket = key === 'color' ? 'Uncolored' : 'Uncategorized'
    sortable.sort(([a], [b]) => {
        if (a === bucket) return 1
        if (b === bucket) return -1
        return a.localeCompare(b)
    })
    return sortable
}

/** Toggle pill · Flat / By color / By category · presentacional puro. */
interface GroupByButtonProps {
    active: boolean
    onClick: () => void
    icon: ReactNode
    label: string
}

function GroupByButton({ active, onClick, icon, label }: GroupByButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
            {icon}
            {label}
        </button>
    )
}

interface CollectionGroupByToggleProps {
    value: CollectionGroupBy
    onChange: (value: CollectionGroupBy) => void
}

/** Barra de 3 botones · Flat · By color · By category. */
export function CollectionGroupByToggle({ value, onChange }: CollectionGroupByToggleProps) {
    return (
        <div
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-0.5"
            role="group"
            aria-label="Group products by"
        >
            <GroupByButton
                active={value === 'flat'}
                onClick={() => onChange('flat')}
                icon={<LayoutGrid className="h-3 w-3" />}
                label="Flat"
            />
            <GroupByButton
                active={value === 'color'}
                onClick={() => onChange('color')}
                icon={<Palette className="h-3 w-3" />}
                label="By color"
            />
            <GroupByButton
                active={value === 'category'}
                onClick={() => onChange('category')}
                icon={<Tag className="h-3 w-3" />}
                label="By category"
            />
        </div>
    )
}
