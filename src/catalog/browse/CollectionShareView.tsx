// F50 · Etapa 8 (P7 share) · v2 · vista read-only de una colección
// compartida por link. Se renderea cuando la URL trae `?share=...&sig=...`
// y el App detecta el param antes de montar el flujo principal.
//
// Comportamiento:
//   · Decodifica el payload de la URL y muestra los productos como grid
//     (imagen, brand, name, price) sin ninguna acción destructiva.
//   · Banner honesto arriba explicando que es una vista compartida, quién
//     la envió (opcional · nombre del dealer si lo ponemos en el payload
//     en futuro) y cuándo se generó.
//   · Botón "Import to my collections" · copia los productos a una
//     colección nueva en el useCollections del dealer que abre el link.
//     Solo aparece si hay un tenant activo.
//   · Si la firma no matchea o el payload es inválido, muestra un empty
//     state y CTA para volver al catálogo.
//
// Skills · Nielsen H10 (Help) + Norman Constraints (nada editable) +
// Refactoring UI (Depth · card grid limpio, sin distractions).

import { useMemo, useState } from 'react'
import { Share2, Download, AlertTriangle, Check, ArrowRight } from 'lucide-react'
import { Button, EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from 'strata-design-system'
import { decodeCollectionShareLink } from './collectionShareLink'
import { useCollections } from './useCollections'
import { UNIFIED_PRODUCTS } from '../showroom/data/unifiedProducts'
import type { Product } from '../types'
import { formatPrice } from '../data/catalogues'
// F51 · B.3 · toggle groupBy compartido con ShowroomPageV2 · agrupar
// una colección por color o category en la vista read-only del share.
import { CollectionGroupByToggle, groupProductsBy, type CollectionGroupBy } from './collectionGrouping'

interface CollectionShareViewProps {
    /** URLSearchParams del window · si el consumidor los pasa, no dependemos de window. */
    search?: URLSearchParams | string
    onExit: () => void
}

export default function CollectionShareView({ search, onExit }: CollectionShareViewProps) {
    const params = search ?? (typeof window !== 'undefined' ? window.location.search : '')
    const decoded = useMemo(() => decodeCollectionShareLink(params), [params])
    const { createCollection, addToCollection } = useCollections()
    const [imported, setImported] = useState(false)
    // F51 · B.3 · groupBy visual · mismo pattern del ShowroomPageV2.
    const [groupBy, setGroupBy] = useState<CollectionGroupBy>('flat')

    if (!decoded.ok) {
        return (
            <div className="mx-auto max-w-md px-6 py-16">
                <EmptyState>
                    <EmptyStateIcon>
                        <AlertTriangle className="h-6 w-6 text-amber-600" aria-hidden="true" />
                    </EmptyStateIcon>
                    <EmptyStateTitle>Shared collection unavailable</EmptyStateTitle>
                    <EmptyStateDescription>
                        {decoded.error === 'bad-signature'
                            ? 'The link signature does not match. It may have been truncated or altered.'
                            : decoded.error === 'unsupported-version'
                              ? 'This link was created with a newer version of the app.'
                              : 'The link is missing or malformed.'}
                    </EmptyStateDescription>
                </EmptyState>
                <div className="mt-6 flex justify-center">
                    <Button onClick={onExit}>Back to catalog</Button>
                </div>
            </div>
        )
    }

    const payload = decoded.payload!
    const products = payload.p
        .map((id) => UNIFIED_PRODUCTS.find((p) => p.id === id))
        .filter((p): p is Product => !!p)
    const missingCount = payload.p.length - products.length

    const handleImport = () => {
        const created = createCollection(`${payload.n} (imported)`)
        for (const id of payload.p) addToCollection(created.id, id)
        setImported(true)
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-6xl px-6 py-8">
                {/* Honest banner */}
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
                    <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">Shared collection · read-only</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            You're viewing a snapshot generated on {new Date(payload.t).toLocaleDateString()}. Actions like edit or reorder are disabled. This is a client-side link (mock signature) · when a real backend exists these links will be signed on the server and can be revoked.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onExit}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
                    >
                        Back to catalog
                        <ArrowRight className="h-3 w-3" />
                    </button>
                </div>

                {/* Header */}
                <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Shared collection
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-foreground">{payload.n}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {products.length} {products.length === 1 ? 'product' : 'products'}
                            {missingCount > 0 && (
                                <span className="ml-1 text-amber-700 dark:text-amber-400">
                                    · {missingCount} not found in current catalog
                                </span>
                            )}
                        </p>
                    </div>
                    <Button onClick={handleImport} disabled={imported}>
                        {imported ? (
                            <>
                                <Check className="mr-1.5 h-4 w-4" />
                                Imported
                            </>
                        ) : (
                            <>
                                <Download className="mr-1.5 h-4 w-4" />
                                Import to my collections
                            </>
                        )}
                    </Button>
                </header>

                {/* Grid o Empty */}
                {products.length === 0 ? (
                    <EmptyState>
                        <EmptyStateIcon>
                            <AlertTriangle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                        </EmptyStateIcon>
                        <EmptyStateTitle>No products found</EmptyStateTitle>
                        <EmptyStateDescription>
                            The shared collection references product IDs that don't exist in this catalog. They may have been renamed or removed.
                        </EmptyStateDescription>
                    </EmptyState>
                ) : (
                    <>
                        {/* F51 · B.3 · toggle groupBy · solo se muestra si el
                            grid tiene material para agrupar (>1 producto). */}
                        {products.length > 1 && (
                            <div className="mb-4 flex justify-end">
                                <CollectionGroupByToggle value={groupBy} onChange={setGroupBy} />
                            </div>
                        )}

                        {groupBy === 'flat' ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {products.map((p) => (
                                    <ReadonlyCard key={p.id} product={p} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {groupProductsBy(products, groupBy).map(([groupKey, groupProducts]) => (
                                    <section key={groupKey}>
                                        <header className="mb-3 flex items-baseline gap-2 border-b border-border pb-1">
                                            <h2 className="text-sm font-bold text-foreground">{groupKey}</h2>
                                            <span className="text-[11px] text-muted-foreground tabular-nums">
                                                {groupProducts.length} {groupProducts.length === 1 ? 'product' : 'products'}
                                            </span>
                                        </header>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {groupProducts.map((p) => (
                                                <ReadonlyCard key={p.id} product={p} />
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function ReadonlyCard({ product }: { product: Product }) {
    return (
        <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{product.brand}</p>
                <p className="text-sm font-bold text-foreground leading-tight">{product.name}</p>
                {product.price !== undefined && (
                    <p className="mt-auto text-xs font-semibold text-foreground">{formatPrice(product.price)}</p>
                )}
            </div>
        </article>
    )
}
