// F50 · Etapa 4 (refactor 2026-08-03) · v2 · Vista de sample requests
// con pattern "My Selection" · Draft arriba (batch en construcción) +
// Sent abajo (samples ya enviados con tracking).
//
// Diego ask · en vez del modal 3-step de submit directo, el user va
// agregando materiales al draft desde el catálogo con 1 click, y desde
// este panel ajusta qty por material, valida el ship-to global, y hace
// submit batch.
//
// Skills · Nielsen H1 (Visibility of status) + Refactoring UI · Hierarchy
// (sections claras: qué falta enviar vs qué está en camino).

import { useEffect, useState } from 'react'
import { Package, Truck, CheckCircle2, X, ExternalLink, Plus, Minus, Send, MapPin, Pencil, Trash2, ChevronDown, Store, LibraryBig } from 'lucide-react'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
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
    Input,
    Field,
    Label,
} from 'strata-design-system'
import { useSampleRequests, type SampleRequest, type SampleRequestStatus, type DraftSampleItem, type SampleRequestShipTo } from '../browse/useSampleRequests'
import { useDialogs } from '../../components/dialogs/DialogsContext'

interface SampleTrackingSlideOverProps {
    open: boolean
    onClose: () => void
    /** Toast callback opcional para notificar submit batch al padre. */
    onSubmitted?: (count: number) => void
    /** F50 · Add-another-material · navega al Product Catalog con taxonomy
     *  = Materials pre-seteado. El consumer cierra el slide-over y setea el
     *  reopen-flag para que se re-abra cuando el user agregue al draft. */
    onBrowseCatalog?: () => void
    /** F50 · Add-another-material · navega al MRL Library. Idem reopen-flag. */
    onBrowseMRL?: () => void
    /** F50 · Add-another-material · contexto actual del user cuando se abrió
     *  el slide-over. Si ya está en una vista de materiales, en vez de un
     *  dropdown con 2 opciones se muestra un botón directo que solo cierra
     *  el slide-over (y mantiene el contexto). Si viene de otra vista
     *  (My Selection · My Projects) sí se muestra el dropdown para elegir. */
    currentContext?: 'catalog-materials' | 'catalog-other' | 'mrl' | 'other'
    /** F72.3 · deep-link scroll · cuando el slide-over se abre desde el
     *  Action Center con notificación de un request específico, scroll el
     *  card correspondiente en vista + highlight momentáneo. */
    focusRequestId?: string | null
}

export default function SampleTrackingSlideOver({ open, onClose, onSubmitted, onBrowseCatalog, onBrowseMRL, currentContext = 'other', focusRequestId }: SampleTrackingSlideOverProps) {
    const {
        requests,
        draftItems,
        draftShipTo,
        updateDraftQty,
        removeFromDraft,
        clearDraft,
        updateDraftShipTo,
        submitDraft,
        deleteRequest,
        advanceStatus,
    } = useSampleRequests()
    const { confirm } = useDialogs()

    const [editingShipTo, setEditingShipTo] = useState(false)
    const [draftShipToLocal, setDraftShipToLocal] = useState<SampleRequestShipTo>(draftShipTo)

    // F72.3 · deep-link scroll cuando llega focusRequestId (típicamente desde
    // el Action Center). Defer al próximo tick para que el slide-over ya haya
    // renderado el DOM · scroll suave y usa location.hash para el :target ring.
    useEffect(() => {
        if (!open || !focusRequestId) return
        const timer = window.setTimeout(() => {
            const el = document.getElementById(`sample-request-${focusRequestId}`)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                window.history.replaceState(null, '', `#sample-request-${focusRequestId}`)
            }
        }, 250)
        return () => window.clearTimeout(timer)
    }, [open, focusRequestId])

    // Cuando cambia el draftShipTo externo, sincroniza el local (si no se
    // está editando activamente).
    if (!editingShipTo && (
        draftShipToLocal.line1 !== draftShipTo.line1 ||
        draftShipToLocal.city !== draftShipTo.city ||
        draftShipToLocal.state !== draftShipTo.state ||
        draftShipToLocal.zip !== draftShipTo.zip
    )) {
        setDraftShipToLocal(draftShipTo)
    }

    // Agrupa los requests por status
    const pending = requests.filter((r) => r.status === 'pending')
    const shipped = requests.filter((r) => r.status === 'shipped')
    const delivered = requests.filter((r) => r.status === 'delivered')

    const draftUnits = draftItems.reduce((s, it) => s + it.qty, 0)
    const canSubmit = draftItems.length > 0 &&
        draftShipTo.line1.trim() && draftShipTo.city.trim() &&
        draftShipTo.state.trim() && draftShipTo.zip.trim()

    const handleSubmitDraft = () => {
        const created = submitDraft()
        onSubmitted?.(created.length)
    }

    const handleClearDraft = async () => {
        if (draftItems.length === 0) return
        const ok = await confirm({
            title: `Clear the sample draft?`,
            description: `${draftItems.length} ${draftItems.length === 1 ? 'material' : 'materials'} (${draftUnits} ${draftUnits === 1 ? 'unit' : 'units'}) will be removed from the draft. This can't be undone.`,
            confirmLabel: 'Clear draft',
            danger: true,
        })
        if (ok) clearDraft()
    }

    return (
        <SlideOver open={open} onClose={onClose}>
            <SlideOverHeader onClose={onClose}>
                <SlideOverTitle>Sample requests</SlideOverTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                    {draftItems.length === 0 && requests.length === 0
                        ? "You haven't requested any samples yet."
                        : `${draftItems.length > 0 ? `${draftUnits} in draft · ` : ''}${pending.length} pending · ${shipped.length} shipped · ${delivered.length} delivered`}
                </p>
            </SlideOverHeader>

            <SlideOverBody>
                {draftItems.length === 0 && requests.length === 0 ? (
                    <EmptyState>
                        <EmptyStateIcon>
                            <Package className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                        </EmptyStateIcon>
                        <EmptyStateTitle>No sample requests yet</EmptyStateTitle>
                        <EmptyStateDescription>
                            Browse Materials and click "Request sample" on any material card to build your draft.
                        </EmptyStateDescription>
                        {/* F52 · CTA contextual · si el consumer pasó los callbacks
                            y el user está en una vista de browsing, mostramos un
                            botón directo al destino más razonable según el
                            currentContext. En 'mrl' → MRL Library. En cualquier
                            otro contexto → Product Catalog · Materials tab. Sin
                            callbacks no renderiza (fallback silencioso). */}
                        {(onBrowseCatalog || onBrowseMRL) && (
                            <div className="mt-4 flex justify-center">
                                {currentContext === 'mrl' && onBrowseMRL ? (
                                    <button
                                        type="button"
                                        onClick={onBrowseMRL}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                        <LibraryBig className="h-3.5 w-3.5" />
                                        Browse MRL Library
                                    </button>
                                ) : onBrowseCatalog ? (
                                    <button
                                        type="button"
                                        onClick={onBrowseCatalog}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                        <Store className="h-3.5 w-3.5" />
                                        Browse Product Catalog · Materials
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </EmptyState>
                ) : (
                    <div className="space-y-6">
                        {/* ─── DRAFT (top) ────────────────────────────── */}
                        {draftItems.length > 0 && (
                            <section className="rounded-xl border-2 border-dashed border-foreground/30 bg-muted/30 p-3">
                                <header className="mb-3 flex items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">Draft · not sent yet</h3>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            {draftItems.length} {draftItems.length === 1 ? 'material' : 'materials'} · {draftUnits} {draftUnits === 1 ? 'sample' : 'samples'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClearDraft}
                                        title="Clear draft"
                                        className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        Clear
                                    </button>
                                </header>

                                <ul className="mb-3 space-y-2">
                                    {draftItems.map((item) => (
                                        <DraftRow
                                            key={item.id}
                                            item={item}
                                            onQtyChange={(q) => updateDraftQty(item.id, q)}
                                            onRemove={() => removeFromDraft(item.id)}
                                        />
                                    ))}
                                </ul>

                                {/* Ship-to global */}
                                <div className="mb-3 rounded-md border border-border bg-card p-2.5">
                                    <div className="mb-1.5 flex items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            <MapPin className="h-3 w-3" aria-hidden="true" />
                                            Ship to
                                        </span>
                                        {!editingShipTo && (
                                            <button
                                                type="button"
                                                onClick={() => setEditingShipTo(true)}
                                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Pencil className="h-3 w-3" />
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                    {editingShipTo ? (
                                        <div className="space-y-2">
                                            <Field>
                                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Street address</Label>
                                                <Input
                                                    value={draftShipToLocal.line1}
                                                    onChange={(e) => setDraftShipToLocal({ ...draftShipToLocal, line1: e.target.value })}
                                                    className="text-sm"
                                                />
                                            </Field>
                                            <div className="grid grid-cols-3 gap-2">
                                                <Field>
                                                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">City</Label>
                                                    <Input
                                                        value={draftShipToLocal.city}
                                                        onChange={(e) => setDraftShipToLocal({ ...draftShipToLocal, city: e.target.value })}
                                                        className="text-sm"
                                                    />
                                                </Field>
                                                <Field>
                                                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">State</Label>
                                                    <Input
                                                        value={draftShipToLocal.state}
                                                        onChange={(e) => setDraftShipToLocal({ ...draftShipToLocal, state: e.target.value })}
                                                        className="text-sm"
                                                    />
                                                </Field>
                                                <Field>
                                                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Zip</Label>
                                                    <Input
                                                        value={draftShipToLocal.zip}
                                                        onChange={(e) => setDraftShipToLocal({ ...draftShipToLocal, zip: e.target.value })}
                                                        className="text-sm"
                                                    />
                                                </Field>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setDraftShipToLocal(draftShipTo)
                                                        setEditingShipTo(false)
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        updateDraftShipTo(draftShipToLocal)
                                                        setEditingShipTo(false)
                                                    }}
                                                >
                                                    Save address
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-foreground leading-snug">
                                            {draftShipTo.line1}<br />
                                            {draftShipTo.city}, {draftShipTo.state} {draftShipTo.zip}
                                        </p>
                                    )}
                                </div>

                                {/* F50 · Add-another-material · si el user ya
                                    está en una vista de materiales (MRL o
                                    Product Catalog · Materials), botón
                                    directo que solo cierra el slide-over
                                    (mantiene el contexto donde estaba). Si
                                    viene de otra vista, dropdown con 2
                                    opciones para elegir. El auto-reopen del
                                    slide-over cuando el user agrega al
                                    draft lo maneja el CatalogPageV2 vía
                                    reopen-flag. */}
                                {(() => {
                                    if (!onBrowseCatalog && !onBrowseMRL) return null

                                    // Ya está en una vista de materiales · botón directo
                                    if (currentContext === 'catalog-materials' && onBrowseCatalog) {
                                        return (
                                            <button
                                                type="button"
                                                onClick={onBrowseCatalog}
                                                className="mb-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted hover:text-foreground"
                                            >
                                                <Store className="h-3.5 w-3.5" />
                                                Continue browsing Product Catalog
                                            </button>
                                        )
                                    }
                                    if (currentContext === 'mrl' && onBrowseMRL) {
                                        return (
                                            <button
                                                type="button"
                                                onClick={onBrowseMRL}
                                                className="mb-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted hover:text-foreground"
                                            >
                                                <LibraryBig className="h-3.5 w-3.5" />
                                                Continue browsing MRL Library
                                            </button>
                                        )
                                    }

                                    // Otra vista · dropdown con las 2 opciones
                                    return (
                                        <div className="mb-2">
                                            <Menu as="div" className="relative w-full">
                                                <MenuButton
                                                    type="button"
                                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted hover:text-foreground"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Add another material
                                                    <ChevronDown className="h-3 w-3" />
                                                </MenuButton>
                                                <MenuItems
                                                    anchor="bottom"
                                                    className="z-[100] mt-1 w-[--button-width] origin-top rounded-md border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
                                                >
                                                    {onBrowseCatalog && (
                                                        <MenuItem>
                                                            {({ focus }) => (
                                                                <button
                                                                    type="button"
                                                                    onClick={onBrowseCatalog}
                                                                    className={`flex w-full items-start gap-2 rounded px-2 py-2 text-left text-xs transition-colors ${
                                                                        focus ? 'bg-muted' : ''
                                                                    }`}
                                                                >
                                                                    <Store className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                                                    <span className="min-w-0 flex-1">
                                                                        <span className="block font-semibold text-foreground">Browse Product Catalog</span>
                                                                        <span className="block text-[10px] text-muted-foreground">Materials tab · grid con filtros</span>
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    )}
                                                    {onBrowseMRL && (
                                                        <MenuItem>
                                                            {({ focus }) => (
                                                                <button
                                                                    type="button"
                                                                    onClick={onBrowseMRL}
                                                                    className={`flex w-full items-start gap-2 rounded px-2 py-2 text-left text-xs transition-colors ${
                                                                        focus ? 'bg-muted' : ''
                                                                    }`}
                                                                >
                                                                    <LibraryBig className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                                                    <span className="min-w-0 flex-1">
                                                                        <span className="block font-semibold text-foreground">Browse MRL Library</span>
                                                                        <span className="block text-[10px] text-muted-foreground">Manufacturers de materials</span>
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    )}
                                                </MenuItems>
                                            </Menu>
                                        </div>
                                    )
                                })()}

                                <Button
                                    onClick={handleSubmitDraft}
                                    disabled={!canSubmit || editingShipTo}
                                    className="w-full"
                                >
                                    <Send className="mr-1.5 h-4 w-4" />
                                    Submit {draftUnits} {draftUnits === 1 ? 'sample' : 'samples'}
                                </Button>
                            </section>
                        )}

                        {/* ─── SENT (below) ───────────────────────────── */}
                        {pending.length > 0 && (
                            <StatusGroup title="Pending" count={pending.length} status="pending" requests={pending} onDelete={deleteRequest} onAdvance={advanceStatus} />
                        )}
                        {shipped.length > 0 && (
                            <StatusGroup title="Shipped" count={shipped.length} status="shipped" requests={shipped} onDelete={deleteRequest} onAdvance={advanceStatus} />
                        )}
                        {delivered.length > 0 && (
                            <StatusGroup title="Delivered" count={delivered.length} status="delivered" requests={delivered} onDelete={deleteRequest} onAdvance={advanceStatus} />
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

/* ─── Draft row ─────────────────────────────────────────────────── */

interface DraftRowProps {
    item: DraftSampleItem
    onQtyChange: (qty: number) => void
    onRemove: () => void
}

function DraftRow({ item, onQtyChange, onRemove }: DraftRowProps) {
    return (
        <li className="group flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{item.productBrand}</p>
                <p className="text-xs font-bold text-foreground truncate">{item.productName}</p>
                {item.colorwayName && (
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                        {item.colorwayHex && (
                            <span
                                className="inline-block h-2.5 w-2.5 rounded-sm border border-border"
                                style={{ backgroundColor: item.colorwayHex }}
                                aria-hidden="true"
                            />
                        )}
                        <span>{item.colorwayName}</span>
                    </div>
                )}
            </div>
            {/* Qty stepper */}
            <div className="inline-flex items-center gap-0.5 rounded-md border border-border">
                <button
                    type="button"
                    onClick={() => onQtyChange(item.qty - 1)}
                    disabled={item.qty <= 1}
                    aria-label="Decrease qty"
                    className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-[24px] text-center text-xs font-bold tabular-nums text-foreground">{item.qty}</span>
                <button
                    type="button"
                    onClick={() => onQtyChange(item.qty + 1)}
                    aria-label="Increase qty"
                    className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${item.productName} from draft`}
                title="Remove from draft"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
            >
                <Trash2 className="h-3 w-3" />
            </button>
        </li>
    )
}

/* ─── Sent groups (mismo pattern anterior) ──────────────────────── */

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
        <li
            className="group rounded-xl border border-border bg-card p-3 target:ring-2 target:ring-primary target:ring-offset-2 target:ring-offset-background"
            id={`sample-request-${request.id}`}
            data-request-id={request.id}
        >
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
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>{formatTimestamp(request)}</span>
                        <span>·</span>
                        <span>{request.shipTo.city}, {request.shipTo.state} {request.shipTo.zip}</span>
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
                                title="Simulate a carrier update (mock)"
                                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Mark as {request.status === 'pending' ? 'shipped' : 'delivered'}
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
