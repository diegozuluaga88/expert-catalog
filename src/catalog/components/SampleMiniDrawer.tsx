// F50 · sample flow (MRL adapt · 2026-08-03) · v2 · widget flotante
// bottom-right para acceder al tracking desde cualquier vista del
// catálogo v2 (incluyendo las deep MRL pages donde no hay sidebar).
//
// Replica el pattern del MiniCartDrawer (My Selection) · un floating
// FAB con badge que expand a un mini panel de tracking. Cuando el user
// quiere el detalle completo, hay un CTA "View all" que abre el
// SampleTrackingSlideOver existente.
//
// Convive con MiniCartDrawer usando offsetBottom · el consumer decide
// si va en bottom-6 (default) o más arriba para dejar espacio al cart.
//
// Se oculta cuando hay un Dialog abierto (mismo pattern que
// MiniCartDrawer · evita tapar el "Next/Submit" de modales).

import { useEffect, useState } from 'react'
import { Package, X, CheckCircle2, Truck, Clock, ArrowUpRight } from 'lucide-react'
import { useSampleRequests, type SampleRequest } from '../browse/useSampleRequests'

interface SampleMiniDrawerProps {
    /** Abre el SampleTrackingSlideOver completo · el consumer lo maneja. */
    onOpenTracking: () => void
    /** Margen extra desde el bottom (px) · el default 24 (bottom-6). Se usa
     *  para dejar espacio al MiniCartDrawer cuando ambos coexisten. */
    offsetBottom?: number
}

export default function SampleMiniDrawer({ onOpenTracking, offsetBottom = 24 }: SampleMiniDrawerProps) {
    const { draftItems, requests } = useSampleRequests()
    const [expanded, setExpanded] = useState(false)
    const [hasOpenDialog, setHasOpenDialog] = useState(false)

    // Detecta cuando un HeadlessUI Dialog está abierto · misma técnica que
    // MiniCartDrawer usa para no tapar el "Next/Submit" de otros modales.
    useEffect(() => {
        const check = () => setHasOpenDialog(!!document.querySelector('[role="dialog"]'))
        check()
        const observer = new MutationObserver(check)
        observer.observe(document.body, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    const draftUnits = draftItems.reduce((s, it) => s + it.qty, 0)
    const pending = requests.filter((r) => r.status === 'pending')
    const shipped = requests.filter((r) => r.status === 'shipped')
    const delivered = requests.filter((r) => r.status === 'delivered')
    const inFlight = [...pending, ...shipped]
    const totalCount = draftUnits + inFlight.length

    // No mostrar nada si no hay actividad ni draft.
    if (hasOpenDialog) return null
    if (totalCount === 0 && delivered.length === 0) return null

    // FAB collapsed
    if (!expanded) {
        return (
            <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label={`Open sample requests · ${totalCount} in progress`}
                title="Sample requests"
                className="fixed right-6 z-[80] inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-4 text-base font-bold text-background shadow-2xl transition-all hover:scale-105 hover:bg-foreground/90 animate-in slide-in-from-bottom-2 fade-in duration-200"
                style={{ bottom: `${offsetBottom}px` }}
            >
                <Package className="h-6 w-6" />
                {totalCount > 0 ? (
                    <>
                        <span className="tabular-nums">{totalCount}</span>
                        <span className="text-xs opacity-90">
                            {draftUnits > 0 && inFlight.length > 0
                                ? 'samples'
                                : draftUnits > 0
                                    ? 'in draft'
                                    : 'in flight'}
                        </span>
                    </>
                ) : (
                    <span className="text-xs opacity-90">samples</span>
                )}
            </button>
        )
    }

    // Drawer expanded
    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed right-6 z-[80] w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
            style={{ bottom: `${offsetBottom}px` }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
                <div className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                    <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">Sample requests</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                        {draftUnits > 0 && `${draftUnits} in draft · `}
                        {pending.length > 0 && `${pending.length} pending · `}
                        {shipped.length > 0 && `${shipped.length} shipped · `}
                        {delivered.length > 0 && `${delivered.length} delivered`}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Draft */}
            {draftItems.length > 0 && (
                <div className="border-b border-border bg-muted/30 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            Draft · not sent
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {draftItems.length} {draftItems.length === 1 ? 'material' : 'materials'} · {draftUnits} {draftUnits === 1 ? 'unit' : 'units'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setExpanded(false)
                            onOpenTracking()
                        }}
                        className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Review & submit
                    </button>
                </div>
            )}

            {/* In flight list · máx 3 */}
            {inFlight.length > 0 && (
                <div className="max-h-52 overflow-y-auto border-b border-border bg-background">
                    <div className="px-4 pt-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                        In flight ({inFlight.length})
                    </div>
                    <ul className="divide-y divide-border">
                        {inFlight.slice(0, 3).map((r) => (
                            <RequestMini key={r.id} request={r} onClick={() => {
                                setExpanded(false)
                                onOpenTracking()
                            }} />
                        ))}
                    </ul>
                    {inFlight.length > 3 && (
                        <p className="px-4 py-2 text-[10px] italic text-muted-foreground">
                            +{inFlight.length - 3} more · click below for full list
                        </p>
                    )}
                </div>
            )}

            {/* Delivered (últimos 2) */}
            {delivered.length > 0 && (
                <div className="border-b border-border bg-background">
                    <div className="px-4 pt-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Recently delivered
                    </div>
                    <ul className="divide-y divide-border">
                        {delivered.slice(0, 2).map((r) => (
                            <RequestMini key={r.id} request={r} onClick={() => {
                                setExpanded(false)
                                onOpenTracking()
                            }} muted />
                        ))}
                    </ul>
                </div>
            )}

            {/* Footer · CTA para abrir el slide-over completo */}
            <div className="bg-card px-4 py-3">
                <button
                    type="button"
                    onClick={() => {
                        setExpanded(false)
                        onOpenTracking()
                    }}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                >
                    View all requests
                    <ArrowUpRight className="h-3 w-3" />
                </button>
            </div>
        </div>
    )
}

interface RequestMiniProps {
    request: SampleRequest
    onClick: () => void
    muted?: boolean
}

function RequestMini({ request, onClick, muted }: RequestMiniProps) {
    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-muted transition-colors ${muted ? 'opacity-70' : ''}`}
            >
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                    <img src={request.productImage} alt={request.productName} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">{request.productBrand}</p>
                    <p className="text-xs font-semibold text-foreground truncate leading-tight">{request.productName}</p>
                </div>
                <StatusChipMini status={request.status} />
            </button>
        </li>
    )
}

function StatusChipMini({ status }: { status: SampleRequest['status'] }) {
    if (status === 'pending') {
        return (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:text-amber-400">
                <Package className="h-2.5 w-2.5" aria-hidden="true" />
                Pending
            </span>
        )
    }
    if (status === 'shipped') {
        return (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-700 dark:text-blue-400">
                <Truck className="h-2.5 w-2.5" aria-hidden="true" />
                Shipped
            </span>
        )
    }
    return (
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
            Delivered
        </span>
    )
}
