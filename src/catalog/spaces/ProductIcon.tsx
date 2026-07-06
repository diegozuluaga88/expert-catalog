// Fase 3 · ProductIcon (2026-07-06)
// Icon determinístico por productType · reemplaza el imageUrl vacío de los
// ProductStubs. Cada productType mapea a un icon Lucide + gradient background
// consistente con el DS. Se ve como "placeholder de catálogo" sin depender
// de assets externos.

import { Armchair, Table, Lamp, Package, Warehouse, Monitor, Sparkles, Box, LayoutPanelTop } from 'lucide-react'
import { PRODUCT_GROUPS, PRODUCT_TYPES, findProductGroupByCode } from '../data/productGroups'

// Fallback: si el productType no matchea, usamos Box.
const TYPE_TO_ICON: Record<string, typeof Armchair> = {
    Chair: Armchair,
    Table: Table,
    Lamp: Lamp,
    Storage: Package,
    Panel: LayoutPanelTop,
    Casegood: Warehouse,
    Screen: Monitor,
    Accessory: Sparkles,
}

/** Deriva el productType name a partir de un productGroupCode.
 *  Cadena productGroupCode → ProductGroup.productTypeId → ProductType.name. */
export function productTypeForCode(productGroupCode: string): string | undefined {
    const group = findProductGroupByCode(productGroupCode)
    if (!group) return undefined
    return PRODUCT_TYPES.find(pt => pt.id === group.productTypeId)?.name
}

interface Props {
    productGroupCode: string
    /** Tamaño del contenedor cuadrado. Default 'md'. */
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const SIZE_STYLES = {
    sm: { container: 'h-16', icon: 'h-6 w-6' },
    md: { container: 'h-28', icon: 'h-10 w-10' },
    lg: { container: 'h-36', icon: 'h-14 w-14' },
} as const

export default function ProductIcon({ productGroupCode, size = 'md', className = '' }: Props) {
    const typeName = productTypeForCode(productGroupCode)
    const Icon = (typeName && TYPE_TO_ICON[typeName]) || Box
    const sz = SIZE_STYLES[size]

    return (
        <div
            className={`relative w-full ${sz.container} overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted/30 to-card flex items-center justify-center ${className}`}
        >
            <Icon className={`${sz.icon} text-foreground/40`} strokeWidth={1.25} />
            {/* Code overlay bottom-left · badge estilo pill */}
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-card/85 backdrop-blur px-1.5 py-0.5 text-[9px] font-bold text-foreground border border-border/60">
                {productGroupCode}
            </span>
        </div>
    )
}
