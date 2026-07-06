// Fase 3.1 · ProductIcon (rebuild 2026-07-06)
// Foto real del ProductGroup como base + fallback al icon Lucide si la img
// falla (404 / mala / no populada). Mismo pattern que SpaceRendering.
// Convención: /public/images/products/{productGroupCode-lowercase}.jpg

import { useState } from 'react'
import { Armchair, Table, Lamp, Package, Warehouse, Monitor, Sparkles, Box, LayoutPanelTop } from 'lucide-react'
import { PRODUCT_TYPES, findProductGroupByCode, productImageUrl } from '../data/productGroups'

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

/** Deriva el productType name a partir de un productGroupCode. */
export function productTypeForCode(productGroupCode: string): string | undefined {
    const group = findProductGroupByCode(productGroupCode)
    if (!group) return undefined
    return PRODUCT_TYPES.find(pt => pt.id === group.productTypeId)?.name
}

interface Props {
    productGroupCode: string
    /** Tamaño del contenedor. Default 'md'. */
    size?: 'sm' | 'md' | 'lg'
    className?: string
    /** Override imageUrl · si se pasa, se usa este en vez del path derivado. */
    imageUrl?: string
}

const SIZE_STYLES = {
    sm: { container: 'h-16', icon: 'h-6 w-6' },
    md: { container: 'h-28', icon: 'h-10 w-10' },
    lg: { container: 'h-36', icon: 'h-14 w-14' },
} as const

export default function ProductIcon({ productGroupCode, size = 'md', className = '', imageUrl }: Props) {
    const typeName = productTypeForCode(productGroupCode)
    const Icon = (typeName && TYPE_TO_ICON[typeName]) || Box
    const sz = SIZE_STYLES[size]
    const src = imageUrl ?? productImageUrl(productGroupCode)
    const [imgFailed, setImgFailed] = useState(false)

    return (
        <div
            className={`relative w-full ${sz.container} overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted/30 to-card flex items-center justify-center ${className}`}
        >
            {/* Foto real · si falla, se activa el fallback y se oculta la img */}
            {!imgFailed && (
                <img
                    src={src}
                    alt={`${productGroupCode} product photo`}
                    loading="lazy"
                    onError={() => setImgFailed(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}

            {/* Fallback · icon Lucide del productType (comportamiento anterior a Fase 3.1) */}
            {imgFailed && (
                <Icon className={`${sz.icon} text-foreground/40 relative z-10`} strokeWidth={1.25} />
            )}

            {/* Code overlay bottom-left · pill semi-transparente sobre la foto */}
            <span className="absolute bottom-1.5 left-1.5 z-20 rounded-md bg-card/85 backdrop-blur px-1.5 py-0.5 text-[9px] font-bold text-foreground border border-border/60">
                {productGroupCode}
            </span>
        </div>
    )
}
