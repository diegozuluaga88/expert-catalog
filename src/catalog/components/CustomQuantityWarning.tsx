// Advertencia de cantidad en ítem custom · US-013 (2026-08-28)
// ────────────────────────────────────────────────────────────
// El criterio de aceptación: "los flujos de pedido o export muestran una
// advertencia cuando un ítem marcado se solicita en una cantidad por
// encima de un umbral configurable".
//
// ── Por qué es inline y no un diálogo
//
// Krug es explícito en que los usuarios hacen clic a través de los
// diálogos de confirmación sin leerlos — y este aviso existe justamente
// para el caso en que alguien está actuando en piloto automático. Un
// modal descartable sería peor que nada: entrena a descartar.
//
// Así que vive **junto al control de cantidad**, aparece al cruzar el
// umbral y **se queda mientras la cantidad siga alta**. No bloquea: el
// criterio pide advertir, no impedir, y una configuración custom en
// volumen puede ser perfectamente correcta.
//
// ── Contra la fatiga de alarma
//
// El propio questionnaire de discovery plantea el riesgo: *"how often
// can it flag a legitimately standard bulk order before Jen/Amy start
// ignoring it?"* La defensa no es avisar menos, es que el aviso **diga
// algo que se pueda accionar**: qué tiene de custom este ítem y qué hay
// que confirmar. Un aviso genérico repetido se vuelve invisible; uno
// que nombra la razón, no tanto.

import { AlertTriangle } from 'lucide-react'
import type { Product } from '../types'
import { quantityWarning } from '../data/customItems'

interface CustomQuantityWarningProps {
    product: Product
    quantity: number
    /** `inline` para filas de tabla · `block` para paneles y modales. */
    variant?: 'inline' | 'block'
}

export default function CustomQuantityWarning({
    product,
    quantity,
    variant = 'block',
}: CustomQuantityWarningProps) {
    const warning = quantityWarning(product, quantity)
    if (!warning) return null

    if (variant === 'inline') {
        return (
            <p role="status" className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-foreground">
                <AlertTriangle className="mt-px h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>
                    <span className="font-semibold">Over {warning.threshold} units. </span>
                    <span className="text-muted-foreground">{warning.message}</span>
                </span>
            </p>
        )
    }

    return (
        <div
            role="status"
            className="mt-2 flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2"
        >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
            <div>
                <p className="text-xs font-semibold text-foreground">
                    Over {warning.threshold} units of a {warning.level === 'custom' ? 'custom' : 'partially custom'} item
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{warning.message}</p>
            </div>
        </div>
    )
}
