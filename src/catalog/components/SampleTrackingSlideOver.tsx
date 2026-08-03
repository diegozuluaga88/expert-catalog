// F50 · Wave 4.c · v2 · Vista de tracking de solicitudes de muestra.
//
// Slide-over que muestra las solicitudes de muestra activas del dealer,
// agrupadas por status (pending / shipped / delivered). Cada solicitud
// tiene su chip de status, la dirección de envío, y (cuando aplica) el
// número de tracking del carrier.
//
// Como el backend real de tracking todavía no existe, este slide-over
// también expone un botón "Simulate" que avanza el status manualmente
// (pending → shipped → delivered). En producción esto llegaría vía polling
// o notificaciones push · el botón se remueve cuando exista backend.
//
// Skills · Nielsen H1 (visibility of system status) + Norman Feedback.

import { Package, Truck, CheckCircle2, X, ExternalLink } from 'lucide-react'
import {
    SlideOver,
    SlideOverHeader,
    SlideOverTitle,
    SlideOverBody,
    Button,
    EmptyState,
    EmptyStateIcon,
    EmptyStateTitle,
    EmptyStateDescription,
} from 'strata-design-system'
import { useSampleRequests, type SampleRequest, type SampleRequestStatus } from '../browse/useSampleRequests'

interface SampleTrackingSlideOverProps {
    open: boolean
    onClose: () => void
}

export default function SampleTrackingSlideOver({ open, onClose }: SampleTrackingSlideOverProps) {
    const { requests, deleteRequest, advanceStatus } = useSampleRequests()

    // Agrupa las requests por status · orden preferido: pending → shipped → delivered
    const pending = requests.filter((r) => r.status === 'pending')
    const shipped = requests.filter((r) => r.status === 'shipped')
    const delivered = requests.filter((r) => r.status === 'delivered')

    return (
        <SlideOver open={open} onClose={onClose}>
            <SlideOverHeader onClose={onClose}>
                <SlideOverTitle>Sample requests</SlideOverTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                    {requests.length === 0
                        ? 'You have no active swatch requests.'
                        : `${pending.length} pending · ${shipped.length} shipped · ${delivered.length} delivered`}
                </p>
            </SlideOverHeader>

            <SlideOverBody>
                {requests.length === 0 ? (
                    <EmptyState>
                        <EmptyStateIcon>
                            <Package className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                        </EmptyStateIcon>
                        <EmptyStateTitle>No sample requests yet</EmptyStateTitle>
                        <EmptyStateDescription>
                            Browse Materials in the Product Catalog and click "Request swatch" on any material card.
                        </EmptyStateDescription>
                    </EmptyState>
                ) : (
                    <div className="space-y-6">
                        {pending.length > 0 && (
                            <StatusGroup
                                title="Pending"
                                count={pending.length}
                                status="pending"
                                requests={pending}
                                onDelete={deleteRequest}
                                onAdvance={advanceStatus}
                            />
                        )}
                        {shipped.length > 0 && (
                            <StatusGroup
                                title="Shipped"
                                count={shipped.length}
                                status="shipped"
                                requests={shipped}
                                onDelete={deleteRequest}
                                onAdvance={advanceStatus}
                            />
                        )}
                        {delivered.length > 0 && (
                            <StatusGroup
                                title="Delivered"
                                count={delivered.length}
                                status="delivered"
                                requests={delivered}
                                onDelete={deleteRequest}
                                onAdvance={advanceStatus}
                            />
                        )}
                    </div>
                )}
            </SlideOverBody>

            <div className="border-t border-border bg-card px-6 py-4">
                <Button variant="outline" onClick={onClose} className="w-full">
                    Close
                </Button>
            </div>
        </SlideOver>
    )
}

interface StatusGroupProps {
    title: string
    count: number
    status: SampleRequestStatus
    requests: SampleRequest[]
    onDelete: (id: string) => void
    onAdvance: (id: string) => void
}

function StatusGroup({ title, count, status, requests, onDelete, onAdvance }: StatusGroupProps) {
    return (
        <section>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <StatusIcon status={status} />
                {title}
                <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
                    {count}
                </span>
            </h3>
            <ul className="space-y-2">
                {requests.map((r) => (
                    <RequestRow key={r.id} request={r} onDelete={onDelete} onAdvance={onAdvance} />
                ))}
            </ul>
        </section>
    )
}

function StatusIcon({ status }: { status: SampleRequestStatus }) {
    if (status === 'pending') return <Package className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
    if (status === 'shipped') return <Truck className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
}

interface RequestRowProps {
    request: SampleRequest
    onDelete: (id: string) => void
    onAdvance: (id: string) => void
}

function RequestRow({ request, onDelete, onAdvance }: RequestRowProps) {
    const canAdvance = request.status !== 'delivered'
    return (
        <li className="group rounded-xl border border-border bg-card p-3">
            <div className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    <img src={request.productImage} alt={request.productName} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{request.productBrand}</p>
                            <p className="truncate text-sm font-bold text-foreground">{request.productName}</p>
                            {request.colorwayName && (
                                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    {request.colorwayHex && (
                                        <span
                                            className="inline-block h-2.5 w-2.5 rounded-sm border border-border"
                                            style={{ backgroundColor: request.colorwayHex }}
                                            aria-hidden="true"
                                        />
                                    )}
                                    <span>{request.colorwayName}</span>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => onDelete(request.id)}
                            aria-label="Cancel request"
                            title="Cancel request"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>
                            {formatTimestamp(request)}
                        </span>
                        <span>·</span>
                        <span>
                            {request.shipTo.city}, {request.shipTo.state} {request.shipTo.zip}
                        </span>
                    </div>

                    {request.status === 'shipped' && request.carrierTracking && (
                        <div className="mt-2 flex items-center gap-2 rounded-md bg-blue-500/10 px-2 py-1 text-[11px]">
                            <Truck className="h-3 w-3 text-blue-600 shrink-0" aria-hidden="true" />
                            <span className="font-mono text-foreground">{request.carrierTracking}</span>
                            <button
                                type="button"
                                aria-label="Open tracking link"
                                title="Open tracking link"
                                className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                            >
                                <ExternalLink className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {canAdvance && (
                        <div className="mt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={() => onAdvance(request.id)}
                                title="Simulate carrier update (backend stub)"
                                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Simulate → {request.status === 'pending' ? 'shipped' : 'delivered'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </li>
    )
}

function formatTimestamp(request: SampleRequest): string {
    if (request.status === 'delivered' && request.deliveredAt) {
        return `Delivered ${formatDate(request.deliveredAt)}`
    }
    if (request.status === 'shipped' && request.shippedAt) {
        return `Shipped ${formatDate(request.shippedAt)}`
    }
    return `Requested ${formatDate(request.requestedAt)}`
}

function formatDate(iso: string): string {
    try {
        const d = new Date(iso)
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
        return iso.slice(0, 10)
    }
}
