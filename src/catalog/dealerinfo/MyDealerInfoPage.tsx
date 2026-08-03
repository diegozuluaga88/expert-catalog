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

export default function MyDealerInfoPage() {
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

    const relationships = useMemo(
        () => getRelationshipsForDealer(tenantDisplay),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tenantDisplay, tick],
    )

    const [askedManufacturers, setAskedManufacturers] = useState<Set<string>>(new Set())

    const handleAskRep = (rel: DealerRelationship) => {
        submitUpdateRequest(dealerSlug, rel.manufacturerSlug)
        setAskedManufacturers((prev) => new Set(prev).add(rel.manufacturerSlug))
        addToast('success', `Update request sent to ${rel.primaryRep.name} · they will refresh your info.`)
    }

    return (
        <div className="space-y-4">
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            {/* Header */}
            <header>
                <h1 className="text-2xl font-bold text-foreground leading-tight flex items-center gap-2">
                    <Handshake className="h-6 w-6 text-primary" />
                    My dealer info
                </h1>
                <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                    Your negotiated terms with each manufacturer · discounts, freight, primary rep, credit limit.
                    This information is private to <span className="font-semibold text-foreground">{tenantDisplay}</span> and
                    updated by your reps.
                </p>
            </header>

            {relationships.length === 0 ? (
                <EmptyState tenantDisplay={tenantDisplay} />
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
    const manufacturerName = manufacturer?.name ?? relationship.manufacturerSlug
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
                {/* Discount + freight + credit */}
                <div className="grid grid-cols-2 gap-3">
                    <MetricBlock label="Discount" value={`${relationship.discountTier}%`} accent="primary" />
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
    accent?: 'primary'
    warning?: boolean
}

function MetricBlock({ label, value, accent, warning }: MetricBlockProps) {
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`mt-0.5 text-sm font-bold leading-tight ${
                warning ? 'text-amber-700 dark:text-amber-400'
                : accent === 'primary' ? 'text-primary'
                : 'text-foreground'
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
                <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
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
                        <a href={`mailto:${rep.email}`} className="inline-flex items-center gap-1 hover:text-primary hover:underline">
                            <Mail className="h-3 w-3" />
                            {rep.email}
                        </a>
                        <a href={`tel:${rep.phone}`} className="inline-flex items-center gap-1 hover:text-primary hover:underline">
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
