// Indicador de ítem custom · US-013 (2026-08-28)
// ──────────────────────────────────────────────
// El criterio de aceptación pide que el indicador sea visible en
// **resultados de búsqueda, vistas de lista y paquetes exportados** —
// no solo en el registro. Por eso es un componente propio y no una
// marca dibujada dentro de una pantalla: el mismo badge viaja con el
// ítem a todas partes.
//
// Dos tamaños porque los sitios donde aparece tienen densidades muy
// distintas: `sm` para tarjetas y filas de lista, `md` para la página
// de producto, donde es una de las primeras cosas que hay que ver.
//
// No usa color como único canal — lleva ícono y palabra. En una tarjeta
// pequeña el color se pierde contra la imagen del producto, y el punto
// de este indicador es que nadie lo pase por alto.

import { Wrench } from 'lucide-react'
import type { Product } from '../types'
import { customLevel, CUSTOM_LABEL, CUSTOM_EXPLANATION } from '../data/customItems'

interface CustomItemBadgeProps {
    product: Product
    size?: 'sm' | 'md'
    /** Sobre imagen · agrega fondo sólido para que se lea encima de la foto. */
    onImage?: boolean
}

export default function CustomItemBadge({ product, size = 'sm', onImage = false }: CustomItemBadgeProps) {
    const level = customLevel(product)
    if (level === 'standard') return null

    const label = CUSTOM_LABEL[level]

    const base = onImage
        ? 'bg-background/95 border-border backdrop-blur'
        : 'bg-muted border-border'

    return (
        <span
            title={CUSTOM_EXPLANATION[level]}
            className={
                size === 'md'
                    ? `inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold text-foreground ${base}`
                    : `inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold text-foreground ${base}`
            }
        >
            <Wrench className={size === 'md' ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'} aria-hidden="true" />
            {label}
        </span>
    )
}
