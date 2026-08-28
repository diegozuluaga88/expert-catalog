// Find Similar · sección de la página de producto (2026-08-28)
// ────────────────────────────────────────────────────────────
// SOW v5 §9.1 · "cada página de detalle de producto debe soportar una
// acción Find Similar". La lógica y sus límites viven en findSimilar.ts.
//
// Decisiones de diseño
//
// 1 · **El porqué va visible, no en un tooltip.** §9.4 pide "Why did
//     this match?" en lenguaje entendible. Un tooltip lo esconde detrás
//     de hover, que en móvil no existe. Las razones son chips bajo cada
//     resultado.
//
// 2 · **La marca se muestra siempre.** Lo valioso de Find Similar es lo
//     que el usuario no encuentra navegando: el producto equivalente de
//     otra marca. Si no se ve de quién es, el resultado no sirve para
//     decidir.
//
// 3 · **Lo que no está indexado se dice.** Cuatro de las ocho señales
//     del SOW no tienen dato detrás. Una línea al pie lo declara. Es el
//     modelo de evidencia de §9.4 — el usuario tiene que poder saber
//     sobre qué se calculó el match. Callarlo lo haría parecer completo.
//
// 4 · **Descontinuado se marca y va al final** (guardrail §9.2). El
//     orden lo garantiza findSimilar; acá solo se etiqueta.
//
// Jerarquía (Refactoring UI): imagen > nombre > marca > razones. Las
// razones son el nivel más bajo — explican, no compiten.

import { Sparkles } from 'lucide-react'
import type { Product, Manufacturer, Category } from '../types'
import { findSimilar, SIGNALS_NOT_INDEXED, type SimilarMatch } from './findSimilar'

interface SimilarProductsProps {
    product: Product
    category: Category
    manufacturer: Manufacturer
    /** Navega al producto elegido. Recibe el contexto completo porque el
     *  match puede ser de otra marca y otra categoría. */
    onSelect: (m: SimilarMatch) => void
}

export default function SimilarProducts({ product, category, manufacturer, onSelect }: SimilarProductsProps) {
    const matches = findSimilar(product, category, manufacturer)

    // Sin resultados no se renderea un bloque vacío · en una página de
    // producto un "no encontramos nada parecido" no aporta ninguna salida.
    if (matches.length === 0) return null

    const crossBrandCount = matches.filter(m => m.crossBrand).length

    return (
        <section aria-labelledby="similar-heading" className="mt-12 border-t border-border pt-8">
            <div className="mb-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h2 id="similar-heading" className="text-base font-bold text-foreground">
                    Similar products
                </h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
                {crossBrandCount > 0
                    ? `Matched across the whole library · ${crossBrandCount} from other brands.`
                    : 'Matched across the whole library.'}
            </p>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {matches.map(match => (
                    <li key={match.product.id}>
                        <SimilarCard match={match} onSelect={onSelect} />
                    </li>
                ))}
            </ul>

            {/* Modelo de evidencia · qué NO entró en el cálculo. */}
            <p className="mt-5 text-xs text-muted-foreground">
                Matched on product type, specs, finishes and manufacturer text.{' '}
                {SIGNALS_NOT_INDEXED.join(', ').replace(/, ([^,]*)$/, ' and $1')} aren’t indexed yet.
            </p>
        </section>
    )
}

function SimilarCard({ match, onSelect }: { match: SimilarMatch; onSelect: (m: SimilarMatch) => void }) {
    const { product, manufacturer, reasons, discontinued } = match
    const image = product.images?.[0]

    return (
        <button
            type="button"
            onClick={() => onSelect(match)}
            className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-primary/50"
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                {image ? (
                    <img
                        src={image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : null}
                {discontinued && (
                    <span className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Discontinued
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col p-3">
                <p className="text-sm font-semibold leading-snug text-foreground">{product.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{manufacturer.name}</p>

                {/* "Why did this match?" · §9.4, visible y sin hover. */}
                {reasons.length > 0 && (
                    <ul className="mt-2.5 flex flex-wrap gap-1">
                        {reasons.slice(0, 3).map(r => (
                            <li
                                key={r.label}
                                className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            >
                                {r.label}
                                {r.detail && <span className="opacity-70"> · {r.detail}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </button>
    )
}
