// F51 · A.2 · P4 Internal Info · left-tab dedicado del dealer.
//
// Hoy la info dealer↔manufacturer vive scoped al ManufacturerInfoBarV2
// (dentro del detalle de cada manufacturer). El PRD nuevo la pide como
// left tab dedicado · single-pane con TODA la info del dealer para todos
// sus manufacturers · Jeff: "no other platform would do this".
//
// Consume los helpers ya existentes en data/dealerRelationships.ts.
// Preserva la sección scoped al ManufacturerInfoBarV2 (útil in-context).
//
// Botón "Ask my rep to update" registra la solicitud en localStorage
// `dealer-info-update-requests-{dealerSlug}` para preparar el A.4 (rep
// dashboard con inbox de update-requests).

import { useEffect, useMemo, useState } from 'react'
import { Handshake, Phone, Mail, Calendar, AlertTriangle, Send, Building2, User } from 'lucide-react'
import { useTenant } from '../../TenantContext'
import {
    getRelationshipsForDealer,
    formatRelativeDate,
    toDealerSlug,
    submitUpdateRequest,
    DEALER_REL_CHANGE_EVENT,
    type DealerRelationship,
    type DealerRep,
} from '../data/dealerRelationships'
import { MANUFACTURERS } from '../data/manufacturers'
import { useToast, ToastContainer } from '../../components/AuthToast'

const OUTDATED_DAYS = 180

function daysSince(iso: string): number {
    try {
        const then = new Date(iso).getTime()
        const now = new Date().getTime()
        return Math.max(0, Math.floor((now - then) / 86400000))
    } catch {
        return 0
    }
}

function currencyFormat(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(n)
}

interface MyDealerInfoPageProps {
    /** F52 · variant='contextual' esconde el header full y muestra summary
     *  compacto ("N brands used · avg X% off"). Ideal para embed en modal
     *  desde in-project. Default 'full' preserva el behavior anterior. */
    variant?: 'full' | 'contextual'
    /** F52 · filtro por brand names para el modo contextual. Se matchea
     *  contra MANUFACTURERS.name → id → relationship.manufacturerSlug.
     *  Si no viene, se muestran todas las relationships del tenant. */
    filterByBrands?: string[]
}

export default function MyDealerInfoPage({ variant = 'full', filterByBrands }: MyDealerInfoPageProps = {}) {
    const { currentTenant } = useTenant()
    const tenantDisplay = (currentTenant as unknown as string) || ''
    const dealerSlug = toDealerSlug(tenantDisplay)
    const { toasts, addToast, dismissToast } = useToast()

    // F51 · A.4 · rehidrata al recibir el evento del rep dashboard (cuando
    // un rep aplica un bulk update). Tick para forzar el re-run del useMemo.
    const [tick, setTick] = useState(0)
    useEffect(() => {
        const handler = () => setTick((t) => t + 1)
        window.addEventListener(DEALER_REL_CHANGE_EVENT, handler)
        return () => window.removeEventListener(DEALER_REL_CHANGE_EVENT, handler)
    }, [])

    const allRelationships = useMemo(
        () => getRelationshipsForDealer(tenantDisplay),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tenantDisplay, tick],
    )

    // F52 · si el consumer pasó filterByBrands, matcheamos brand-name
    // (case-insensitive) contra MANUFACTURERS.name para derivar los ids
    // permitidos, y filtramos las relationships por esos. Los brands que
    // no están en el registry MANUFACTURERS se ignoran silenciosamente.
    const relationships = useMemo(() => {
        if (!filterByBrands || filterByBrands.length === 0) return allRelationships
        const allowedIds = new Set<string>()
        const wantedNames = new Set(filterByBrands.map((b) => b.toLowerCase()))
        MANUFACTURERS.forEach((m) => {
            if (wantedNames.has(m.name.toLowerCase())) allowedIds.add(m.id)
        })
        // También matcheamos si el filterByBrands trae directamente el
        // slug (útil cuando UNIFIED_PRODUCTS.brand no matchea un
        // MANUFACTURERS.name pero sí el id).
        filterByBrands.forEach((b) => allowedIds.add(b.toLowerCase()))
        return allRelationships.filter((r) => allowedIds.has(r.manufacturerSlug))
    }, [allRelationships, filterByBrands])

    const [askedManufacturers, setAskedManufacturers] = useState<Set<string>>(new Set())

    const handleAskRep = (rel: DealerRelationship) => {
        submitUpdateRequest(dealerSlug, rel.manufacturerSlug)
        setAskedManufacturers((prev) => new Set(prev).add(rel.manufacturerSlug))
        addToast('success', `Update request sent to ${rel.primaryRep.name} · they will refresh your info.`)
    }

    const isContextual = variant === 'contextual'
    const avgDiscount = relationships.length > 0
        ? Math.round(relationships.reduce((s, r) => s + r.discountTier, 0) / relationships.length)
        : 0

    return (
        <div className="space-y-4">
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            {/* Header · varia según variant. Full muestra title global,
                contextual muestra summary compacto del subset filtrado. */}
            {isContextual ? (
                <header className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Your terms for this scope
                    </p>
                    <p className="mt-0.5 text-sm text-foreground">
                        <span className="font-bold">{relationships.length}</span>{' '}
                        {relationships.length === 1 ? 'brand' : 'brands'}
                        {relationships.length > 0 && (
                            <>
                                {' · avg '}
                                <span className="font-bold tabular-nums">{avgDiscount}%</span>{' off list'}
                            </>
                        )}
                    </p>
                </header>
            ) : (
                <header>
                    <h1 className="text-2xl font-bold text-foreground leading-tight flex items-center gap-2">
                        <Handshake className="h-6 w-6 text-muted-foreground" />
                        My dealer info
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                        Your negotiated terms with each manufacturer · discounts, freight, primary rep, credit limit.
                        This information is private to <span className="font-semibold text-foreground">{tenantDisplay}</span> and
                        updated by your reps.
                    </p>
                </header>
            )}

            {relationships.length === 0 ? (
                isContextual ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                        No dealer terms on file for the brands in this scope.
                    </div>
                ) : (
                    <EmptyState tenantDisplay={tenantDisplay} />
                )
            ) : (
                <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}
                >
                    {relationships.map((rel) => (
                        <DealerRelationshipCard
                            key={rel.manufacturerSlug}
                            relationship={rel}
                            alreadyAsked={askedManufacturers.has(rel.manufacturerSlug)}
                            onAskRep={() => handleAskRep(rel)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

/* ─── Empty state ───────────────────────────────────────────────────── */

function EmptyState({ tenantDisplay }: { tenantDisplay: string }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-16 text-center">
            <Handshake className="h-10 w-10 text-muted-foreground" />
            <div>
                <h3 className="text-base font-bold text-foreground">No dealer relationships set up yet</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md">
                    Your reps haven't loaded discount and freight terms for {tenantDisplay} yet.
                    Contact your primary rep to set up your dealer profile.
                </p>
            </div>
        </div>
    )
}

/* ─── Card ──────────────────────────────────────────────────────────── */

interface DealerRelationshipCardProps {
    relationship: DealerRelationship
    alreadyAsked: boolean
    onAskRep: () => void
}

function DealerRelationshipCard({ relationship, alreadyAsked, onAskRep }: DealerRelationshipCardProps) {
    const manufacturer = MANUFACTURERS.find((m) => m.id === relationship.manufacturerSlug)
    // Fallback capitalizado · si el slug del SEED no matchea con ningún
    // MANUFACTURERS.id (ej. "egan", "kimball" no están en el registry),
    // capitalizamos el slug para no mostrar "egan" en minúscula.
    const manufacturerName = manufacturer?.name
        ?? relationship.manufacturerSlug.replace(/(^|-)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
    const outdatedDays = daysSince(relationship.lastUpdatedAt)
    const isOutdated = outdatedDays > OUTDATED_DAYS

    return (
        <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {/* Manufacturer stripe */}
            <header
                className="flex items-center gap-3 px-4 py-3"
                style={{
                    backgroundColor: manufacturer?.bgColor ?? 'var(--muted)',
                    color: manufacturer?.textColor ?? 'inherit',
                }}
            >
                <Building2 className="h-4 w-4 opacity-80" />
                <h3 className="text-base font-bold">{manufacturerName}</h3>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    -{relationship.discountTier}%
                </span>
            </header>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-3 p-4">
                {/* Discount + freight + credit · valores en foreground · peso y
                    tamaño distinguen jerarquía · NO color primary (Rule DS). */}
                <div className="grid grid-cols-2 gap-3">
                    <MetricBlock label="Discount" value={`${relationship.discountTier}%`} large />
                    <MetricBlock label="Freight" value={relationship.freightTerms} />
                    {relationship.creditLimitUsd !== undefined && (
                        <MetricBlock
                            label="Credit limit"
                            value={currencyFormat(relationship.creditLimitUsd)}
                        />
                    )}
                    <MetricBlock
                        label="Last updated"
                        value={formatRelativeDate(relationship.lastUpdatedAt)}
                        warning={isOutdated}
                    />
                </div>

                {/* Notes */}
                {relationship.notes && (
                    <div className="rounded-md border border-border bg-muted/30 p-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                        <p className="mt-1 text-xs text-foreground leading-snug">{relationship.notes}</p>
                    </div>
                )}

                {/* Reps */}
                <div className="space-y-2">
                    <RepBlock label="Primary rep" rep={relationship.primaryRep} />
                    {relationship.accountManager && (
                        <RepBlock label="Account manager" rep={relationship.accountManager} />
                    )}
                </div>

                {/* Outdated banner */}
                {isOutdated && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-400/40 bg-amber-500/10 p-2.5 text-[11px] text-foreground">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                        <span className="leading-snug">
                            This info was last refreshed {outdatedDays} days ago · terms may have changed.
                        </span>
                    </div>
                )}
            </div>

            {/* Footer · ask rep */}
            <footer className="border-t border-border bg-muted/30 p-3">
                <button
                    type="button"
                    onClick={onAskRep}
                    disabled={alreadyAsked}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="h-3.5 w-3.5" />
                    {alreadyAsked ? 'Update requested' : `Ask ${relationship.primaryRep.name.split(' ')[0]} to update`}
                </button>
            </footer>
        </article>
    )
}

/* ─── Metric block ──────────────────────────────────────────────────── */

interface MetricBlockProps {
    label: string
    value: string
    /** Jerarquiza el valor con tamaño (18px) · sin usar branded color. */
    large?: boolean
    warning?: boolean
}

function MetricBlock({ label, value, large, warning }: MetricBlockProps) {
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`mt-0.5 font-bold leading-tight tabular-nums ${
                large ? 'text-lg' : 'text-sm'
            } ${
                warning ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
            }`}>
                {value}
            </p>
        </div>
    )
}

/* ─── Rep block ─────────────────────────────────────────────────────── */

function RepBlock({ label, rep }: { label: string; rep: DealerRep }) {
    return (
        <div className="rounded-md border border-border bg-background p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="mt-1 flex items-start gap-2">
                {/* Rep avatar · neutro sobre card claro · NO branded color en fill. */}
                <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {rep.photoUrl ? (
                        <img src={rep.photoUrl} alt={rep.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                        <User className="h-4 w-4" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{rep.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{rep.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                        {/* Hover state usa foreground (no primary) para respetar la regla en fondos claros. */}
                        <a href={`mailto:${rep.email}`} className="inline-flex items-center gap-1 hover:text-foreground hover:underline">
                            <Mail className="h-3 w-3" />
                            {rep.email}
                        </a>
                        <a href={`tel:${rep.phone}`} className="inline-flex items-center gap-1 hover:text-foreground hover:underline">
                            <Phone className="h-3 w-3" />
                            {rep.phone}
                        </a>
                        {rep.lastContactAt && (
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Last contact {formatRelativeDate(rep.lastContactAt)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
