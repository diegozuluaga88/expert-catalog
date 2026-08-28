// Atributos de tres estados · Yes / No / Unknown (2026-08-28)
// ───────────────────────────────────────────────────────────
// SOW v5 §9.3. La lógica y la regla de evidencia viven en
// `data/productAttributes.ts`; acá solo está cómo se ven.
//
// ── Las tres decisiones de diseño, y por qué
//
// 1 · **Tres tratamientos, no dos y una ausencia.** `Unknown` se
//     renderiza igual de presente que los otros dos. Un hueco en blanco
//     se lee como "no lo tiene", y esa lectura es justo la que el SOW
//     prohíbe.
//
// 2 · **Nunca solo color.** Cada estado lleva ícono y palabra. Es
//     requisito WCAG, y en una audiencia de miles de profesionales A&D
//     el daltonismo no es un caso borde.
//     Además hay una razón práctica: el design system vendorizado **no
//     define tokens de `success`/`warning`** — solo `destructive`. Así
//     que el color no podría cargar el significado aunque quisiéramos.
//     Los tres estados se separan por forma, peso y palabra:
//       · Yes      → check, peso semibold, texto foreground
//       · No       → cruz, peso normal, texto atenuado
//       · Unknown  → interrogación, **borde punteado**, atenuado
//     El borde punteado es la señal que distingue "no sabemos" de "no"
//     sin depender de un solo canal.
//
// 3 · **`Unknown` es accionable.** Al abrirlo dice qué falta para
//     resolverlo, en vez de dejar al usuario en un callejón. Y los
//     resueltos dicen de dónde salieron — es el attribute evidence view
//     del §9.4 aplicado donde el usuario decide, no en una superficie
//     de admin.

import { useState } from 'react'
import { Check, X, HelpCircle, FileText, ChevronDown } from 'lucide-react'
import type { Product } from '../types'
import {
    verifiedAttributes,
    attributeSummary,
    EVIDENCE_LABEL,
    type VerifiedAttribute,
} from '../data/productAttributes'

interface VerifiedAttributesProps {
    product: Product
}

export default function VerifiedAttributes({ product }: VerifiedAttributesProps) {
    const attrs = verifiedAttributes(product)
    const summary = attributeSummary(attrs)

    if (attrs.length === 0) return null

    return (
        <section aria-labelledby="verified-attrs" className="mb-6">
            <div className="mb-1 flex items-baseline justify-between gap-3">
                <h3 id="verified-attrs" className="text-sm font-semibold text-foreground">
                    Verified attributes
                </h3>
                <p className="text-xs text-muted-foreground tabular-nums">
                    {summary.yes} confirmed · {summary.unknown} unknown
                </p>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
                Unknown means no data, not absence of the feature.
            </p>

            <ul className="divide-y divide-border rounded-lg border border-border">
                {attrs.map(attr => (
                    <li key={attr.id}>
                        <AttributeRow attr={attr} />
                    </li>
                ))}
            </ul>
        </section>
    )
}

function AttributeRow({ attr }: { attr: VerifiedAttribute }) {
    const [open, setOpen] = useState(false)

    const stateLabel = attr.state === 'yes' ? 'Yes' : attr.state === 'no' ? 'No' : 'Unknown'

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
                <StateMark state={attr.state} />

                <span className="flex-1 text-sm text-foreground">{attr.label}</span>

                <span
                    className={
                        attr.state === 'yes'
                            ? 'text-sm font-semibold text-foreground'
                            : 'text-sm text-muted-foreground'
                    }
                >
                    {stateLabel}
                </span>

                <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {/* Vista de evidencia · §9.4, en lenguaje llano y no en score. */}
            {open && (
                <div className="border-t border-border bg-muted/30 px-3 py-2.5 pl-11">
                    {attr.state === 'unknown' ? (
                        <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Not enough evidence. </span>
                            {attr.missing}
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {attr.value && (
                                <p className="text-xs text-foreground">{attr.value}</p>
                            )}
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {attr.source === 'manufacturer-document' && (
                                    <FileText className="h-3 w-3" aria-hidden="true" />
                                )}
                                Source: {attr.source ? EVIDENCE_LABEL[attr.source] : 'unrecorded'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/** La marca de estado. Forma distinta por estado, nunca solo color. */
function StateMark({ state }: { state: VerifiedAttribute['state'] }) {
    if (state === 'yes') {
        return (
            <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-foreground"
                aria-hidden="true"
            >
                <Check className="h-3 w-3 text-foreground" strokeWidth={3} />
            </span>
        )
    }

    if (state === 'no') {
        return (
            <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border"
                aria-hidden="true"
            >
                <X className="h-3 w-3 text-muted-foreground" strokeWidth={2.5} />
            </span>
        )
    }

    // Unknown · borde punteado. Es la única forma discontinua de las
    // tres, así que se distingue sin depender de color ni de leer.
    return (
        <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/60"
            aria-hidden="true"
        >
            <HelpCircle className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
        </span>
    )
}
