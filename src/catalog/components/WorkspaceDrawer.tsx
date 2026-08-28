// F50 · sample flow (unificación 2026-08-03) · v2 · widget flotante
// unificado que reemplaza el MiniCartDrawer (My Selection) y el
// SampleMiniDrawer (samples) para evitar que dos drawers floten al
// mismo bottom-right y se monten/superpongan.
//
// Diego ask · dentro del paraguas "My workspace" (nombre del drawer),
// tabs internas para Selection y Samples. Si solo hay contenido de uno,
// la tab bar se oculta y va directo a ese content. Si hay ambos, tabs
// visibles con la última actividad como active por default.
//
// Diseño · summary + CTA (no duplica el listado completo). El editing
// pesado del cart vive en el sub-tab "My Selection" (QuotesPageV2) ·
// el editing pesado del samples flow vive en el SampleTrackingSlideOver.
// Este drawer es el quick-view desde cualquier vista v2.
//
// Auto-open y auto-dismiss del cart pattern (lastAdded) preservado.
// Samples no auto-open · el user va al FAB para verlas.

import { useEffect, useState } from 'react'
import {
    ArrowUpRight,
    CheckCircle2,
    ListChecks,
    Package,
    Clock,
    Truck,
    X,
} from 'lucide-react'
import { useQuote } from '../../quote/QuoteContext'
import { useSampleRequests, type SampleRequest } from '../browse/useSampleRequests'
import CartContent from '../../quote/CartContent'

interface WorkspaceDrawerProps {
    /** Callback para navegar al sub-tab My Selection (QuotesPageV2).
     *  MRL scope cleanup (2026-08-27) · Capa 2b · pasa a opcional · el tab
     *  My Selection se retiró (MRL no cotiza) y con `hideCart` esta prop
     *  no se usa. El carrito completo sale con quote/ en la Capa 2c. */
    onViewSelection?: () => void
    /** Callback para abrir el SampleTrackingSlideOver. */
    onOpenSampleTracking: () => void
    /** F65 · scope cleanup · cuando true, la sección Selection del cart
     *  queda oculta (no cart items en el badge count, no tab Selection).
     *  Se usa cuando el user está en Library tab (mode='browse') · el
     *  cart/quote flow es Strata superset (Products tab scope). Sample
     *  requests siguen visibles porque el sample flow SÍ está in-scope
     *  para Library (finishes sample per PRD). */
    hideCart?: boolean
}

type TabKey = 'selection' | 'samples'

export default function WorkspaceDrawer({ onViewSelection, onOpenSampleTracking, hideCart = false }: WorkspaceDrawerProps) {
    const { activeDraft, lastAdded, clearLastAdded } = useQuote()
    const { draftItems, requests } = useSampleRequests()

    const [manuallyOpened, setManuallyOpened] = useState(false)
    const [activeTab, setActiveTab] = useState<TabKey>('selection')
    const [hovering, setHovering] = useState(false)
    const [recentlyAdded, setRecentlyAdded] = useState(false)
    const [hasOpenDialog, setHasOpenDialog] = useState(false)

    // MutationObserver · esconde el drawer cuando hay un Dialog abierto
    // para no tapar el "Next/Submit" de otros modales (mismo patrón que
    // MiniCartDrawer usaba antes).
    useEffect(() => {
        const check = () => setHasOpenDialog(!!document.querySelector('[role="dialog"]'))
        check()
        const observer = new MutationObserver(check)
        observer.observe(document.body, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    // Auto-open al agregar al cart · activa la tab Selection.
    // Auto-dismiss 20s si no hovering (pattern del MiniCartDrawer).
    useEffect(() => {
        if (!lastAdded) return
        setActiveTab('selection')
        setRecentlyAdded(true)
        const pulseTimer = setTimeout(() => setRecentlyAdded(false), 5000)
        const dismissTimer = hovering || manuallyOpened
            ? null
            : setTimeout(() => clearLastAdded(), 20000)
        return () => {
            clearTimeout(pulseTimer)
            if (dismissTimer) clearTimeout(dismissTimer)
        }
    }, [lastAdded, hovering, manuallyOpened, clearLastAdded])

    /* ─── Derived state ──────────────────────────────────────────── */

    // F65 · hideCart force cart-related state a "empty" (aunque haya items
    // en el QuoteContext) · el FAB no cuenta cart items + drawer no muestra
    // tab Selection. Los items reales del cart no se pierden · quedan en
    // localStorage · vuelven a aparecer cuando el user cambia a Products tab.
    const cartHasItems = !hideCart && !!(activeDraft && activeDraft.items.length > 0)
    const cartUnits = hideCart ? 0 : (activeDraft?.items.reduce((s, it) => s + it.qty, 0) ?? 0)

    const draftUnits = draftItems.reduce((s, it) => s + it.qty, 0)
    const pending = requests.filter((r) => r.status === 'pending')
    const shipped = requests.filter((r) => r.status === 'shipped')
    const delivered = requests.filter((r) => r.status === 'delivered')
    const inFlight = [...pending, ...shipped]
    const samplesTotal = draftUnits + inFlight.length
    const samplesHasContent = samplesTotal > 0 || delivered.length > 0

    const totalBadge = cartUnits + samplesTotal
    const showDrawer = !!lastAdded || manuallyOpened
    const anyContent = cartHasItems || samplesHasContent

    // Auto-switch a la tab con content si la actual está vacía
    useEffect(() => {
        if (activeTab === 'selection' && !cartHasItems && samplesHasContent) {
            setActiveTab('samples')
        }
        if (activeTab === 'samples' && !samplesHasContent && cartHasItems) {
            setActiveTab('selection')
        }
    }, [activeTab, cartHasItems, samplesHasContent])

    const handleClose = () => {
        clearLastAdded()
        setManuallyOpened(false)
    }

    /* ─── Guards ────────────────────────────────────────────────── */

    if (hasOpenDialog) return null
    if (!anyContent) return null

    /* ─── FAB (collapsed) ───────────────────────────────────────── */

    if (!showDrawer) {
        return (
            <button
                type="button"
                onClick={() => setManuallyOpened(true)}
                className={`fixed bottom-6 right-6 z-[80] inline-flex items-center gap-2 rounded-full bg-primary px-5 py-4 text-base font-bold text-primary-foreground shadow-2xl transition-all hover:scale-105 hover:bg-primary/90 animate-in slide-in-from-bottom-2 fade-in duration-200 ${
                    recentlyAdded ? 'scale-110 ring-4 ring-primary/40 animate-pulse' : ''
                }`}
                aria-label={`Open workspace · ${totalBadge} in progress`}
                title="My workspace"
            >
                <ListChecks className="h-6 w-6" />
                <span className="tabular-nums">{totalBadge}</span>
                <span className="text-xs opacity-90">in workspace</span>
            </button>
        )
    }

    /* ─── Drawer (expanded) ─────────────────────────────────────── */

    const showTabs = cartHasItems && samplesHasContent

    return (
        <div
            role="status"
            aria-live="polite"
            // F56.2 · mobile fix · antes `right-6 w-full max-w-sm` calculaba
            // ancho a 100vw en mobile chico y clippeaba el borde izquierdo.
            // Ahora `left-6 right-6 max-w-sm mx-auto` da margin uniforme en
            // mobile y respeta el max en desktop.
            className="fixed bottom-6 left-6 right-6 z-[80] max-w-sm mx-auto sm:left-auto sm:right-6 sm:mx-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
                <div className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-foreground">
                    {lastAdded ? <CheckCircle2 className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">
                        {lastAdded ? `+${lastAdded.itemCount} added to selection` : 'My workspace'}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                        {cartHasItems && `${cartUnits} in selection`}
                        {cartHasItems && samplesHasContent && ' · '}
                        {samplesHasContent && `${samplesTotal} sample${samplesTotal === 1 ? '' : 's'}`}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Tabs (solo cuando hay ambos) */}
            {showTabs && (
                <div className="flex border-b border-border bg-muted/30" role="tablist">
                    <TabButton
                        active={activeTab === 'selection'}
                        onClick={() => setActiveTab('selection')}
                        label="Selection"
                        count={cartUnits}
                    />
                    <TabButton
                        active={activeTab === 'samples'}
                        onClick={() => setActiveTab('samples')}
                        label="Samples"
                        count={samplesTotal}
                    />
                </div>
            )}

            {/* Content · Selection · reusa el content COMPLETO del cart
                (items list con qty stepper + edit variants + delete inline
                + clear all + footer con totals + View Selection CTA) que
                antes vivía en el MiniCartDrawer. Se preserva el mismo look
                and feel que el user ya conocía. */}
            {(activeTab === 'selection' || !showTabs) && cartHasItems && (
                <CartContent
                    justAddedIds={lastAdded ? new Set(lastAdded.addedItems.map((i) => i.id)) : undefined}
                    onViewSelection={() => {
                        onViewSelection?.()
                        handleClose()
                    }}
                />
            )}

            {/* Content · Samples */}
            {(activeTab === 'samples' || !showTabs) && samplesHasContent && (
                <SamplesSummary
                    draftItems={draftItems.length}
                    draftUnits={draftUnits}
                    inFlight={inFlight}
                    delivered={delivered}
                    onOpenTracking={() => {
                        onOpenSampleTracking()
                        handleClose()
                    }}
                />
            )}
        </div>
    )
}

/* ─── Tab button ────────────────────────────────────────────────── */

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors ${
                active
                    ? 'border-b-2 border-foreground text-foreground bg-card'
                    : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
            {label}
            <span className={`inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
            }`}>
                {count}
            </span>
        </button>
    )
}

/* ─── Samples summary tab ───────────────────────────────────────── */

interface SamplesSummaryProps {
    draftItems: number
    draftUnits: number
    inFlight: SampleRequest[]
    delivered: SampleRequest[]
    onOpenTracking: () => void
}

function SamplesSummary({ draftItems, draftUnits, inFlight, delivered, onOpenTracking }: SamplesSummaryProps) {
    return (
        <div className="px-4 py-3 space-y-3">
            {/* Draft */}
            {draftItems > 0 && (
                <div className="rounded-md border border-dashed border-foreground/30 bg-muted/30 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            Draft · not sent
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {draftItems} {draftItems === 1 ? 'material' : 'materials'} · {draftUnits} {draftUnits === 1 ? 'unit' : 'units'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onOpenTracking}
                        className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Review & submit
                    </button>
                </div>
            )}

            {/* In flight · máx 2 (compact) */}
            {inFlight.length > 0 && (
                <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                        In flight ({inFlight.length})
                    </p>
                    <ul className="space-y-1">
                        {inFlight.slice(0, 2).map((r) => (
                            <li key={r.id}>
                                <button
                                    type="button"
                                    onClick={onOpenTracking}
                                    className="flex w-full items-center gap-2 rounded-md p-1 text-left hover:bg-muted transition-colors"
                                >
                                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-muted">
                                        <img src={r.productImage} alt={r.productName} className="h-full w-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-foreground truncate leading-tight">{r.productName}</p>
                                        <p className="text-[10px] text-muted-foreground truncate leading-tight">{r.productBrand}</p>
                                    </div>
                                    <StatusChip status={r.status} />
                                </button>
                            </li>
                        ))}
                    </ul>
                    {inFlight.length > 2 && (
                        <p className="mt-1 text-center text-[10px] italic text-muted-foreground">
                            +{inFlight.length - 2} more · view all below
                        </p>
                    )}
                </div>
            )}

            {/* Delivered summary compact */}
            {delivered.length > 0 && draftItems === 0 && inFlight.length === 0 && (
                <div className="text-center text-[11px] text-muted-foreground py-2">
                    {delivered.length} {delivered.length === 1 ? 'sample' : 'samples'} delivered recently
                </div>
            )}

            <button
                type="button"
                onClick={onOpenTracking}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
            >
                View all requests
                <ArrowUpRight className="h-3 w-3" />
            </button>
        </div>
    )
}

function StatusChip({ status }: { status: SampleRequest['status'] }) {
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
