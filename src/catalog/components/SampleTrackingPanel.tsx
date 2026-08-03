// F50 · sample flow (MRL + Product Catalog · 2026-08-03) · v2 · widget
// permanente del sidebar que muestra el estado de las sample requests
// del dealer sin necesidad de abrir el slide-over completo.
//
// Diseño compacto pensado para vivir en un sidebar angosto (~14rem):
//   · Header colapsable con "Sample requests" + badge total (draft +
//     in-flight)
//   · Draft section (si hay draftItems) · pill con conteo + CTA
//     "Review" que abre el slide-over
//   · In-flight section (pending + shipped) · últimos 3 con thumbnail
//     chico, name truncated, status chip
//   · Recently delivered (últimos 2) · si aplica
//   · Footer link "View all" que abre el slide-over completo
//
// Skills · Nielsen H1 (Visibility of status · el dealer siempre ve el
// estado sin buscar) + Refactoring UI · Hierarchy (compacto y jerárquico).

import { useState } from 'react'
import { ChevronDown, ChevronRight, Package, Truck, CheckCircle2, Clock } from 'lucide-react'
import { useSampleRequests } from '../browse/useSampleRequests'
import type { SampleRequest } from '../browse/useSampleRequests'

interface SampleTrackingPanelProps {
    /** Abre el slide-over completo · lo maneja el consumer (ShowroomPageV2 o LibraryPageV2). */
    onOpenTracking: () => void
    /** Cuando true, el header arranca colapsado (útil si el sidebar ya está muy lleno). */
    defaultCollapsed?: boolean
}

export default function SampleTrackingPanel({ onOpenTracking, defaultCollapsed = false }: SampleTrackingPanelProps) {
    const { draftItems, requests } = useSampleRequests()
    const [collapsed, setCollapsed] = useState(defaultCollapsed)

    const draftUnits = draftItems.reduce((s, it) => s + it.qty, 0)
    const pending = requests.filter((r) => r.status === 'pending')
    const shipped = requests.filter((r) => r.status === 'shipped')
    const delivered = requests.filter((r) => r.status === 'delivered')
    const inFlight = [...pending, ...shipped] // pending primero, luego shipped
    const totalCount = draftUnits + inFlight.length
    const isEmpty = draftItems.length === 0 && requests.length === 0

    return (
        <div className="border-t border-border">
            <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                aria-expanded={!collapsed}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    Sample requests
                    {totalCount > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                            {totalCount}
                        </span>
                    )}
                </span>
                {collapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                )}
            </button>

            {!collapsed && (
                <div className="px-4 pb-3 space-y-2">
                    {isEmpty ? (
                        <p className="text-[11px] text-muted-foreground leading-snug">
                            Click <span className="font-semibold text-foreground">Request sample</span> on any material to start a draft.
                        </p>
                    ) : (
                        <>
                            {/* Draft section */}
                            {draftItems.length > 0 && (
                                <div className="rounded-md border border-dashed border-foreground/30 bg-muted/30 p-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                                            <Clock className="h-3 w-3" aria-hidden="true" />
                                            Draft
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {draftItems.length} {draftItems.length === 1 ? 'material' : 'materials'} · {draftUnits} {draftUnits === 1 ? 'unit' : 'units'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onOpenTracking}
                                        className="mt-1.5 w-full rounded bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                        Review & submit
                                    </button>
                                </div>
                            )}

                            {/* In flight (pending + shipped) · últimos 3 */}
                            {inFlight.length > 0 && (
                                <SectionList
                                    label="In flight"
                                    count={inFlight.length}
                                    items={inFlight.slice(0, 3)}
                                    onClickItem={onOpenTracking}
                                />
                            )}

                            {/* Recently delivered · últimos 2 */}
                            {delivered.length > 0 && (
                                <SectionList
                                    label="Delivered"
                                    count={delivered.length}
                                    items={delivered.slice(0, 2)}
                                    onClickItem={onOpenTracking}
                                    muted
                                />
                            )}

                            <button
                                type="button"
                                onClick={onOpenTracking}
                                className="w-full text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors pt-1"
                            >
                                View all →
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

/* ─── Section list ─────────────────────────────────────────────── */

interface SectionListProps {
    label: string
    count: number
    items: SampleRequest[]
    onClickItem: () => void
    muted?: boolean
}

function SectionList({ label, count, items, onClickItem, muted }: SectionListProps) {
    return (
        <div>
            <div className={`mb-1 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>
                <span>{label}</span>
                <span className="normal-case tracking-normal text-muted-foreground">
                    {count > items.length ? `${items.length} of ${count}` : count}
                </span>
            </div>
            <ul className="space-y-1">
                {items.map((r) => (
                    <li key={r.id}>
                        <button
                            type="button"
                            onClick={onClickItem}
                            className="group flex w-full items-center gap-2 rounded-md p-1 text-left hover:bg-muted transition-colors"
                        >
                            <div className="h-7 w-7 shrink-0 overflow-hidden rounded bg-muted">
                                <img src={r.productImage} alt={r.productName} className="h-full w-full object-cover" loading="lazy" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-foreground truncate leading-tight">{r.productName}</p>
                                <p className="text-[10px] text-muted-foreground truncate leading-tight">{r.productBrand}</p>
                            </div>
                            <StatusChip status={r.status} />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function StatusChip({ status }: { status: SampleRequest['status'] }) {
    if (status === 'pending') {
        return (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/15 px-1 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:text-amber-400">
                <Package className="h-2.5 w-2.5" aria-hidden="true" />
                Pending
            </span>
        )
    }
    if (status === 'shipped') {
        return (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-blue-500/15 px-1 py-0.5 text-[9px] font-bold uppercase text-blue-700 dark:text-blue-400">
                <Truck className="h-2.5 w-2.5" aria-hidden="true" />
                Shipped
            </span>
        )
    }
    return (
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/15 px-1 py-0.5 text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
            Delivered
        </span>
    )
}
