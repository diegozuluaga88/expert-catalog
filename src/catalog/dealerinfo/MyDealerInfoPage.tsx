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
import { Handshake, Phone, Mail, Calendar, AlertTriangle, Send, Building2, User, Pencil, X, Check, Plus, Trash2, Lock } from 'lucide-react'
import { useTenant } from '../../TenantContext'
import {
    getRelationshipsForDealer,
    formatRelativeDate,
    toDealerSlug,
    submitUpdateRequest,
    DEALER_REL_CHANGE_EVENT,
    applyRelationshipOverride,
    addCustomRelationship,
    removeCustomRelationship,
    isCustomRelationship,
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
    // F58c.3 · add-new form state · cuando true renderiza AddRelationshipCard
    // en el top del grid en vez del CTA. Solo aplica en variant='full'.
    const [addingNew, setAddingNew] = useState(false)

    const handleAskRep = (rel: DealerRelationship) => {
        submitUpdateRequest(dealerSlug, rel.manufacturerSlug)
        setAskedManufacturers((prev) => new Set(prev).add(rel.manufacturerSlug))
        addToast('success', `Update request sent to ${rel.primaryRep.name} · they will refresh your info.`)
    }

    // F58c.2 · Save de notes editadas por el dealer · usa el override layer
    // existente (applyRelationshipOverride ya soporta el field notes).
    const handleSaveNotes = (rel: DealerRelationship, newNotes: string) => {
        applyRelationshipOverride(dealerSlug, rel.manufacturerSlug, { notes: newNotes.trim() || undefined })
        addToast('success', `Notes saved for ${rel.manufacturerSlug} · visible only to your team.`)
    }

    // F58c.3 · Save del add-new form · persist como custom relationship.
    const handleAddRelationship = (input: DealerRelationship) => {
        const ok = addCustomRelationship(input)
        if (ok) {
            addToast('success', `${input.manufacturerSlug} added to your setup.`)
            setAddingNew(false)
        } else {
            addToast('error', `A relationship for ${input.manufacturerSlug} already exists.`)
        }
    }

    const handleRemoveCustom = (rel: DealerRelationship) => {
        removeCustomRelationship(dealerSlug, rel.manufacturerSlug)
        addToast('info', `${rel.manufacturerSlug} removed from your setup.`)
    }

    const isContextual = variant === 'contextual'
    const avgDiscount = relationships.length > 0
        ? Math.round(relationships.reduce((s, r) => s + r.discountTier, 0) / relationships.length)
        : 0

    // F58c.3 · manufacturers disponibles para agregar · excluye los que ya
    // tienen relationship activa para este dealer.
    const usedManufacturerSlugs = new Set(relationships.map(r => r.manufacturerSlug))
    const availableManufacturers = MANUFACTURERS.filter(m => !usedManufacturerSlugs.has(m.id))

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
                <header className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold text-foreground leading-tight flex items-center gap-2">
                            <Handshake className="h-6 w-6 text-muted-foreground" />
                            My dealer info
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                            Your negotiated terms with each manufacturer · discounts, freight, primary rep, credit limit.
                            This information is private to <span className="font-semibold text-foreground">{tenantDisplay}</span> and
                            updated by your reps · you can edit notes and add new manufacturers yourself.
                        </p>
                    </div>
                    {!addingNew && (
                        <button
                            type="button"
                            onClick={() => setAddingNew(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
                            title="Add a new manufacturer relationship"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add manufacturer
                        </button>
                    )}
                </header>
            )}

            {relationships.length === 0 && !addingNew ? (
                isContextual ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                        No dealer terms on file for the brands in this scope.
                    </div>
                ) : (
                    <EmptyState tenantDisplay={tenantDisplay} onAdd={() => setAddingNew(true)} />
                )
            ) : (
                <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}
                >
                    {addingNew && !isContextual && (
                        <AddRelationshipCard
                            dealerSlug={dealerSlug}
                            availableManufacturers={availableManufacturers}
                            onCancel={() => setAddingNew(false)}
                            onSave={handleAddRelationship}
                        />
                    )}
                    {relationships.map((rel) => (
                        <DealerRelationshipCard
                            key={rel.manufacturerSlug}
                            relationship={rel}
                            alreadyAsked={askedManufacturers.has(rel.manufacturerSlug)}
                            isCustom={isCustomRelationship(dealerSlug, rel.manufacturerSlug)}
                            onAskRep={() => handleAskRep(rel)}
                            onSaveNotes={(notes) => handleSaveNotes(rel, notes)}
                            onRemoveCustom={() => handleRemoveCustom(rel)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

/* ─── Empty state ───────────────────────────────────────────────────── */

function EmptyState({ tenantDisplay, onAdd }: { tenantDisplay: string; onAdd?: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-16 text-center">
            <Handshake className="h-10 w-10 text-muted-foreground" />
            <div>
                <h3 className="text-base font-bold text-foreground">No dealer relationships set up yet</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md">
                    Your reps haven't loaded discount and freight terms for {tenantDisplay} yet ·
                    ask them to set up your profile, or add a manufacturer yourself.
                </p>
            </div>
            {onAdd && (
                <button
                    type="button"
                    onClick={onAdd}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add manufacturer
                </button>
            )}
        </div>
    )
}

/* ─── Card ──────────────────────────────────────────────────────────── */

interface DealerRelationshipCardProps {
    relationship: DealerRelationship
    alreadyAsked: boolean
    /** F58c.1 · custom (dealer-added) permite Delete inline · SEED no. */
    isCustom: boolean
    onAskRep: () => void
    /** F58c.2 · save de notes editadas por el dealer (via override layer). */
    onSaveNotes: (notes: string) => void
    /** F58c.1 · elimina la custom relationship (SEED no puede eliminarse). */
    onRemoveCustom: () => void
}

function DealerRelationshipCard({
    relationship, alreadyAsked, isCustom, onAskRep, onSaveNotes, onRemoveCustom,
}: DealerRelationshipCardProps) {
    const manufacturer = MANUFACTURERS.find((m) => m.id === relationship.manufacturerSlug)
    // Fallback capitalizado · si el slug del SEED no matchea con ningún
    // MANUFACTURERS.id (ej. "egan", "kimball" no están en el registry),
    // capitalizamos el slug para no mostrar "egan" en minúscula.
    const manufacturerName = manufacturer?.name
        ?? relationship.manufacturerSlug.replace(/(^|-)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
    const outdatedDays = daysSince(relationship.lastUpdatedAt)
    const isOutdated = outdatedDays > OUTDATED_DAYS

    // F58c.2 · edit mode per card · toggle. Solo notes es editable directo;
    // los otros fields muestran un tooltip explicativo + botón Request change
    // que dispara el mismo submitUpdateRequest del footer.
    const [editing, setEditing] = useState(false)
    const [draftNotes, setDraftNotes] = useState(relationship.notes ?? '')
    const [confirmRemove, setConfirmRemove] = useState(false)

    const enterEdit = () => {
        setDraftNotes(relationship.notes ?? '')
        setEditing(true)
    }
    const cancelEdit = () => {
        setDraftNotes(relationship.notes ?? '')
        setEditing(false)
        setConfirmRemove(false)
    }
    const saveEdit = () => {
        onSaveNotes(draftNotes)
        setEditing(false)
    }
    const notesChanged = (draftNotes.trim() || undefined) !== (relationship.notes ?? undefined)

    return (
        <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {/* Manufacturer stripe · gana botón Edit/Cancel a la derecha */}
            <header
                className="flex items-center gap-3 px-4 py-3"
                style={{
                    backgroundColor: manufacturer?.bgColor ?? 'var(--muted)',
                    color: manufacturer?.textColor ?? 'inherit',
                }}
            >
                <Building2 className="h-4 w-4 opacity-80" />
                <h3 className="text-base font-bold">{manufacturerName}</h3>
                {isCustom && (
                    <span className="inline-flex items-center rounded-full bg-black/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        Custom
                    </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    -{relationship.discountTier}%
                </span>
                {editing ? (
                    <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/20 hover:bg-black/30 transition-colors"
                        aria-label="Cancel edit"
                        title="Cancel edit"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={enterEdit}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/20 hover:bg-black/30 transition-colors"
                        aria-label="Edit notes"
                        title="Edit notes · request changes for terms"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                )}
            </header>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-3 p-4">
                {/* Discount + freight + credit · en edit mode muestra hint
                    "Locked · request change" en fields no self-editables. */}
                <div className="grid grid-cols-2 gap-3">
                    <MetricBlock label="Discount" value={`${relationship.discountTier}%`} large locked={editing} />
                    <MetricBlock label="Freight" value={relationship.freightTerms} locked={editing} />
                    {relationship.creditLimitUsd !== undefined && (
                        <MetricBlock
                            label="Credit limit"
                            value={currencyFormat(relationship.creditLimitUsd)}
                            locked={editing}
                        />
                    )}
                    <MetricBlock
                        label="Last updated"
                        value={formatRelativeDate(relationship.lastUpdatedAt)}
                        warning={isOutdated}
                    />
                </div>

                {/* F58c.2 · Notes · en edit mode → textarea; display mode → texto plano.
                    En display mode y vacío, el placeholder invita a agregar notas propias. */}
                {editing ? (
                    <div className="rounded-md border border-primary/40 bg-primary/5 p-2.5 space-y-1.5">
                        <div className="flex items-baseline justify-between">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Notes
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                                Only your team sees this
                            </span>
                        </div>
                        <textarea
                            value={draftNotes}
                            onChange={(e) => setDraftNotes(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="Add internal notes about this manufacturer · rebate terms, contact preferences, project history, etc."
                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-y"
                        />
                        <p className="text-[10px] text-muted-foreground text-right tabular-nums">
                            {draftNotes.length} / 500
                        </p>
                    </div>
                ) : relationship.notes ? (
                    <div className="rounded-md border border-border bg-muted/30 p-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                        <p className="mt-1 text-xs text-foreground leading-snug">{relationship.notes}</p>
                    </div>
                ) : null}

                {/* Reps · read-only siempre · en edit mode aparece un hint */}
                <div className="space-y-2">
                    <RepBlock label="Primary rep" rep={relationship.primaryRep} locked={editing} />
                    {relationship.accountManager && (
                        <RepBlock label="Account manager" rep={relationship.accountManager} locked={editing} />
                    )}
                </div>

                {/* Outdated banner */}
                {isOutdated && !editing && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-400/40 bg-amber-500/10 p-2.5 text-[11px] text-foreground">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                        <span className="leading-snug">
                            This info was last refreshed {outdatedDays} days ago · terms may have changed.
                        </span>
                    </div>
                )}

                {/* F58c.2 · edit-mode hint · aclara que discount/freight/credit
                    requieren rep confirmation · el user pide via el Ask CTA. */}
                {editing && (
                    <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
                        <Lock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">
                            You can freely edit notes · to change discount, freight, credit or rep info, use
                            "Ask {relationship.primaryRep.name.split(' ')[0]} to update" below.
                        </span>
                    </div>
                )}
            </div>

            {/* Footer · varia según edit mode */}
            <footer className="border-t border-border bg-muted/30 p-3 space-y-2">
                {editing ? (
                    <>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={saveEdit}
                                disabled={!notesChanged}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Check className="h-3.5 w-3.5" />
                                Save notes
                            </button>
                        </div>
                        {isCustom && (
                            confirmRemove ? (
                                <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px]">
                                    <span className="text-destructive font-semibold">Remove this manufacturer?</span>
                                    <button
                                        type="button"
                                        onClick={onRemoveCustom}
                                        className="ml-auto text-destructive font-bold hover:underline"
                                    >
                                        Yes
                                    </button>
                                    <span className="text-muted-foreground">·</span>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmRemove(false)}
                                        className="text-muted-foreground hover:underline"
                                    >
                                        No
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setConfirmRemove(true)}
                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[11px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    Remove manufacturer
                                </button>
                            )
                        )}
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={onAskRep}
                        disabled={alreadyAsked}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="h-3.5 w-3.5" />
                        {alreadyAsked ? 'Update requested' : `Ask ${relationship.primaryRep.name.split(' ')[0]} to update`}
                    </button>
                )}
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
    /** F58c.2 · en edit mode los fields non-notes muestran un lock icon
     *  aclarando que no son self-editables (se cambian via Ask CTA). */
    locked?: boolean
}

function MetricBlock({ label, value, large, warning, locked }: MetricBlockProps) {
    return (
        <div className={locked ? 'opacity-70' : undefined}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                {label}
                {locked && <Lock className="h-2.5 w-2.5" aria-label="Locked · request change to update" />}
            </p>
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

function RepBlock({ label, rep, locked }: { label: string; rep: DealerRep; locked?: boolean }) {
    return (
        <div className={`rounded-md border border-border bg-background p-2.5 ${locked ? 'opacity-70' : ''}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                {label}
                {locked && <Lock className="h-2.5 w-2.5" aria-label="Locked · request change to update" />}
            </p>
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

/* ─── AddRelationshipCard (F58c.3) ──────────────────────────────────── */

interface AddRelationshipCardProps {
    dealerSlug: string
    availableManufacturers: typeof MANUFACTURERS
    onCancel: () => void
    onSave: (rel: DealerRelationship) => void
}

/** Card en modo "form" que aparece al top del grid cuando el user hace
 *  click en "+ Add manufacturer". Mismo silhouette visual que las cards
 *  existentes para consistencia (dashed border para distinguir edit-mode). */
function AddRelationshipCard({ dealerSlug, availableManufacturers, onCancel, onSave }: AddRelationshipCardProps) {
    const [manufacturerSlug, setManufacturerSlug] = useState<string>(availableManufacturers[0]?.id ?? '')
    const [customManufacturerName, setCustomManufacturerName] = useState('')
    // Si no hay manufacturers "libres" en el registry, el user puede escribir
    // uno free-text · útil para brands no listadas.
    const useCustomName = manufacturerSlug === '__custom__'
    const [discountTier, setDiscountTier] = useState<string>('30')
    const [freightTerms, setFreightTerms] = useState('Prepay & add')
    const [creditLimit, setCreditLimit] = useState('')
    const [notes, setNotes] = useState('')
    // Primary rep · required · mock del CRM contact
    const [repName, setRepName] = useState('')
    const [repTitle, setRepTitle] = useState('Territory Sales Manager')
    const [repEmail, setRepEmail] = useState('')
    const [repPhone, setRepPhone] = useState('')

    const discountNum = Number.parseInt(discountTier, 10)
    const creditNum = creditLimit.trim() === '' ? undefined : Number.parseInt(creditLimit.replace(/[,$\s]/g, ''), 10)
    const isDiscountValid = Number.isFinite(discountNum) && discountNum >= 0 && discountNum <= 100
    const isCreditValid = creditNum === undefined || (Number.isFinite(creditNum) && creditNum >= 0)
    const finalManufacturerSlug = useCustomName
        ? customManufacturerName.trim().toLowerCase().replace(/\s+/g, '-')
        : manufacturerSlug
    const finalManufacturerLabel = useCustomName
        ? customManufacturerName.trim()
        : (availableManufacturers.find(m => m.id === manufacturerSlug)?.name ?? manufacturerSlug)

    const canSave = !!finalManufacturerSlug
        && !!finalManufacturerLabel
        && isDiscountValid
        && isCreditValid
        && freightTerms.trim() !== ''
        && repName.trim() !== ''
        && repEmail.trim() !== ''

    const handleSubmit = () => {
        if (!canSave) return
        onSave({
            dealerSlug,
            manufacturerSlug: finalManufacturerSlug,
            discountTier: discountNum,
            freightTerms: freightTerms.trim(),
            notes: notes.trim() || undefined,
            primaryRep: {
                name: repName.trim(),
                title: repTitle.trim() || 'Sales Rep',
                email: repEmail.trim(),
                phone: repPhone.trim() || '',
            },
            creditLimitUsd: creditNum,
            lastUpdatedAt: new Date().toISOString(),
        })
    }

    return (
        <article className="flex flex-col overflow-hidden rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 shadow-sm">
            <header className="flex items-center gap-2 px-4 py-3 border-b border-primary/20 bg-primary/10">
                <Plus className="h-4 w-4 text-foreground" />
                <h3 className="text-base font-bold text-foreground">Add manufacturer</h3>
                <button
                    type="button"
                    onClick={onCancel}
                    className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/10 transition-colors"
                    aria-label="Cancel"
                    title="Cancel"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </header>

            <div className="flex flex-1 flex-col gap-3 p-4">
                {/* Manufacturer picker */}
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                        Manufacturer <span className="text-destructive">*</span>
                    </label>
                    <select
                        value={manufacturerSlug}
                        onChange={(e) => setManufacturerSlug(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground focus:border-ring focus:outline-none"
                    >
                        {availableManufacturers.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                        <option value="__custom__">Other · type name manually…</option>
                    </select>
                    {useCustomName && (
                        <input
                            type="text"
                            value={customManufacturerName}
                            onChange={(e) => setCustomManufacturerName(e.target.value)}
                            placeholder="Manufacturer name"
                            className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                        />
                    )}
                </div>

                {/* Terms · discount + freight + credit */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                            Discount % <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={discountTier}
                            onChange={(e) => setDiscountTier(e.target.value)}
                            className={`h-9 w-full rounded-md border ${isDiscountValid ? 'border-input' : 'border-destructive'} bg-background px-2 text-sm text-foreground focus:border-ring focus:outline-none tabular-nums`}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                            Freight <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            value={freightTerms}
                            onChange={(e) => setFreightTerms(e.target.value)}
                            placeholder="e.g. Prepay & add, FOB destination"
                            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                            Credit limit (USD)
                        </label>
                        <input
                            type="text"
                            value={creditLimit}
                            onChange={(e) => setCreditLimit(e.target.value)}
                            placeholder="Optional · e.g. 150000"
                            className={`h-9 w-full rounded-md border ${isCreditValid ? 'border-input' : 'border-destructive'} bg-background px-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none tabular-nums`}
                        />
                    </div>
                </div>

                {/* Primary rep · required */}
                <div className="rounded-md border border-border bg-background p-2.5 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Primary rep <span className="text-destructive">*</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            value={repName}
                            onChange={(e) => setRepName(e.target.value)}
                            placeholder="Rep name *"
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                        />
                        <input
                            type="text"
                            value={repTitle}
                            onChange={(e) => setRepTitle(e.target.value)}
                            placeholder="Title (e.g. Territory Sales Manager)"
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                        />
                        <input
                            type="email"
                            value={repEmail}
                            onChange={(e) => setRepEmail(e.target.value)}
                            placeholder="Email *"
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                        />
                        <input
                            type="tel"
                            value={repPhone}
                            onChange={(e) => setRepPhone(e.target.value)}
                            placeholder="Phone (optional)"
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                        />
                    </div>
                </div>

                {/* Notes · optional */}
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                        Notes (optional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="Rebate terms, contact preferences, project history…"
                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-y"
                    />
                </div>
            </div>

            <footer className="border-t border-primary/20 bg-primary/5 p-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex flex-1 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSave}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Check className="h-3.5 w-3.5" />
                    Add manufacturer
                </button>
            </footer>
        </article>
    )
}
