// F50 · Etapa 7 (P4) · v2 · duplicado de ManufacturerInfoBar.tsx con una
// sección extra "Your dealer relationship" al top que muestra los datos
// privados negociados entre el dealer logueado y el manufacturer que está
// viendo. V1 queda intocada.
//
// La sección solo aparece cuando existe una relación registrada para
// (dealerSlug, manufacturerSlug). Si no hay data, el infoBar se comporta
// exactamente igual que v1 (solo las 4 secciones legacy).
//
// Cambios vs v1:
//   1. Nueva sección "Your dealer relationship" (DealerRelationshipSection)
//      con discount tier, freight terms, primary rep, account manager
//      opcional, credit limit opcional, notas opcionales y timestamp del
//      último update.
//   2. Import del `useTenant()` para saber quién es el dealer logueado.
//   3. Import de `getDealerRelationship` para hacer el lookup.
//
// Skills · Nielsen H1 (Visibility of status · timestamp) + Refactoring UI
// (Hierarchy · sección propia con acento visual porque es la más importante
// para el dealer).

import { ArrowTopRightOnSquareIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { CreditCard, Truck, Percent, MessageSquare, Clock, UserCog, Handshake, Pencil, Check, X as XIcon } from 'lucide-react'
import type { Manufacturer } from '../types'
import { useState } from 'react'
import { useTenant } from '../../TenantContext'
import {
    getDealerRelationship,
    formatRelativeDate,
    applyRelationshipOverride,
    toDealerSlug,
    type DealerRelationship,
    type DealerRep,
} from '../data/dealerRelationships'
import RepDashboardSlideOver from './RepDashboardSlideOver'

type InfoBarSection = 'relationship' | 'filter' | 'resources' | 'links' | 'contacts'

interface ManufacturerInfoBarV2Props {
    manufacturer: Manufacturer
    /** Idem v1 · `'stack'` (default) vertical con separadores · `'grid'` full-width. */
    layout?: 'stack' | 'grid'
    /** F60 · restringe qué sections renderizar · undefined = todas (backwards
     *  compat para MRL). Útil para el BrandProfileSlideOver que renderea
     *  cada section dentro de collapsibles separados. */
    only?: readonly InfoBarSection[]
    /** F60 · si true, no aplica el container border/bg · ideal cuando el
     *  consumer ya tiene su propio wrapper (ej. collapsible del slide-over).
     *  Sigue conservando el layout vertical con divide entre sections. */
    bare?: boolean
}

const FILTER_LABELS = ['Standard', 'GSA', 'QS'] as const

export default function ManufacturerInfoBarV2({ manufacturer, layout = 'stack', only, bare = false }: ManufacturerInfoBarV2Props) {
    const { currentTenant } = useTenant()
    const relationship = getDealerRelationship(currentTenant, manufacturer.id)

    const filterOpts = manufacturer.filterOptions?.filter((o) =>
        FILTER_LABELS.some((l) => l.toLowerCase() === o.toLowerCase()),
    ) ?? []

    // F60 · includes helper · si `only` viene set, filtra secciones.
    const includes = (s: InfoBarSection) => !only || only.includes(s)

    const showFilter = includes('filter') && filterOpts.length > 0
    const showResources = includes('resources') && (manufacturer.brandResources?.length ?? 0) > 0
    const showLinks = includes('links') && (manufacturer.links?.length ?? 0) > 0
    const showContacts = includes('contacts') && (manufacturer.contacts?.length ?? 0) > 0
    const showRelationship = includes('relationship') && relationship !== null

    if (!showFilter && !showResources && !showLinks && !showContacts && !showRelationship) {
        return null
    }

    const isStack = layout === 'stack'
    const containerClass = bare
        ? isStack
            ? 'flex flex-col divide-y divide-border'
            : 'grid gap-6 md:grid-cols-2 lg:grid-cols-4'
        : isStack
            ? 'mt-6 rounded-xl border border-border bg-card/50 p-5 flex flex-col divide-y divide-border'
            : 'mt-10 rounded-xl border border-border bg-card/50 p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4'
    const sectionPadClass = isStack ? 'py-4 first:pt-0 last:pb-0' : ''

    return (
        <section aria-label="Brand information" className={containerClass}>
            {showRelationship && (
                <div className={sectionPadClass}>
                    <DealerRelationshipSection
                        relationship={relationship!}
                        dealerName={currentTenant}
                        manufacturerName={manufacturer.name}
                    />
                </div>
            )}
            {showFilter && <div className={sectionPadClass}><FilterSection options={filterOpts} /></div>}
            {showResources && <div className={sectionPadClass}><ResourcesSection resources={manufacturer.brandResources!} /></div>}
            {showLinks && <div className={sectionPadClass}><LinksSection links={manufacturer.links!} /></div>}
            {showContacts && <div className={sectionPadClass}><ContactsSection contacts={manufacturer.contacts!} /></div>}
        </section>
    )
}

/* ─── Section header ─────────────────────────────────────────────────── */

function SectionHeader({ label, accent }: { label: string; accent?: boolean }) {
    // Diego a11y ask · el accent brand color (lima) sobre fondos claros
    // no cumple contraste. El acento se comunica con weight (bold) + color
    // foreground, no con el brand color en el texto.
    return (
        <h3
            className={`${accent ? 'text-[11px] font-bold text-foreground' : 'text-[10px] font-semibold text-muted-foreground'} uppercase tracking-widest mb-3`}
        >
            {label}
        </h3>
    )
}

/* ─── Dealer relationship (v2 new) ───────────────────────────────────── */

function DealerRelationshipSection({
    relationship,
    dealerName,
    manufacturerName,
}: {
    relationship: DealerRelationship
    dealerName: string
    manufacturerName: string
}) {
    const { discountTier, freightTerms, primaryRep, accountManager, creditLimitUsd, notes, lastUpdatedAt } = relationship
    const [repDashboardOpen, setRepDashboardOpen] = useState(false)

    // F65.3 · inline edit state · applica override via applyRelationshipOverride
    // sobre los 4 fields overrideables (discountTier, freightTerms, notes,
    // creditLimitUsd). Reps quedan readonly · los cambia el rep desde el
    // RepDashboardSlideOver. Enter edit con el pencil icon del header.
    const [editing, setEditing] = useState(false)
    const [draftDiscount, setDraftDiscount] = useState<string>(String(discountTier))
    const [draftFreight, setDraftFreight] = useState<string>(freightTerms)
    const [draftCredit, setDraftCredit] = useState<string>(creditLimitUsd?.toString() ?? '')
    const [draftNotes, setDraftNotes] = useState<string>(notes ?? '')

    const enterEdit = () => {
        setDraftDiscount(String(discountTier))
        setDraftFreight(freightTerms)
        setDraftCredit(creditLimitUsd?.toString() ?? '')
        setDraftNotes(notes ?? '')
        setEditing(true)
    }
    const cancelEdit = () => setEditing(false)

    const discountNum = Number.parseInt(draftDiscount, 10)
    const creditNum = draftCredit.trim() === '' ? undefined : Number.parseInt(draftCredit.replace(/[,$\s]/g, ''), 10)
    const isDiscountValid = Number.isFinite(discountNum) && discountNum >= 0 && discountNum <= 100
    const isCreditValid = creditNum === undefined || (Number.isFinite(creditNum) && creditNum >= 0)
    const isFreightValid = draftFreight.trim() !== ''
    const canSave = isDiscountValid && isCreditValid && isFreightValid

    const handleSave = () => {
        if (!canSave) return
        applyRelationshipOverride(toDealerSlug(dealerName), relationship.manufacturerSlug, {
            discountTier: discountNum,
            freightTerms: draftFreight.trim(),
            notes: draftNotes.trim() || undefined,
            creditLimitUsd: creditNum,
        })
        setEditing(false)
    }

    return (
        <div>
            <div className="mb-2 flex items-baseline justify-between gap-2 flex-wrap">
                <SectionHeader label="Your dealer relationship" accent />
                <div className="flex items-center gap-2">
                    <span
                        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                        title={`Last updated on ${new Date(lastUpdatedAt).toLocaleDateString()}`}
                    >
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        Updated {formatRelativeDate(lastUpdatedAt)}
                    </span>
                    {/* F65.3 · Edit toggle · aparece en el header row · click enter
                        edit mode · click cancel exit. Solo visible cuando NO editing. */}
                    {!editing && (
                        <button
                            type="button"
                            onClick={enterEdit}
                            aria-label="Edit dealer relationship"
                            title="Edit terms · notes editable freely, other fields update the local override"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Pencil className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>
            {/* MRL scope cleanup (2026-08-28) · se retiró el chip
                "Restricted · Dealer Admin · Sales Rep · Purchaser".
                Anunciaba una restricción por rol que no existe · su propio
                comentario lo admitía ("demo purposes · no enforcement real")
                y era un <div> con un title, sin filtrar nada.
                Hallazgo H3-1 del UX-REVIEW, severidad 3 · la visibilidad del
                estado del sistema es peor cuando miente que cuando falta:
                enseña al usuario que los indicadores de permiso no
                significan nada (Nielsen H1).
                Vuelve cuando exista gating real · ROLE-1 define la matriz y
                ROLE-9 exige que el enforcement viva en la capa de datos, no
                en la UI. La línea de abajo se conserva porque sí es cierta:
                describe el alcance del dato, no un permiso. */}
            <p className="mb-3 text-[11px] text-muted-foreground">
                Private info for <span className="font-semibold text-foreground">{dealerName}</span> with this manufacturer. Not visible to other dealers.
            </p>

            {/* F65.3 · Discount + freight + credit · display o inputs según edit mode */}
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
                {editing ? (
                    <MetricEditInput
                        icon={<Percent className="h-3.5 w-3.5" />}
                        label="Discount tier"
                        value={draftDiscount}
                        onChange={setDraftDiscount}
                        suffix="% off list"
                        type="number"
                        invalid={!isDiscountValid}
                    />
                ) : (
                    <MetricChip
                        icon={<Percent className="h-3.5 w-3.5" />}
                        label="Discount tier"
                        value={`${discountTier}% off list`}
                    />
                )}
                {editing ? (
                    <MetricEditInput
                        icon={<Truck className="h-3.5 w-3.5" />}
                        label="Freight terms"
                        value={draftFreight}
                        onChange={setDraftFreight}
                        placeholder="e.g. Prepay & add, FOB origin"
                        type="text"
                        invalid={!isFreightValid}
                    />
                ) : (
                    <MetricChip
                        icon={<Truck className="h-3.5 w-3.5" />}
                        label="Freight terms"
                        value={freightTerms}
                    />
                )}
                {editing ? (
                    <MetricEditInput
                        icon={<CreditCard className="h-3.5 w-3.5" />}
                        label="Credit limit"
                        value={draftCredit}
                        onChange={setDraftCredit}
                        prefix="$"
                        placeholder="Optional"
                        type="text"
                        invalid={!isCreditValid}
                    />
                ) : creditLimitUsd !== undefined ? (
                    <MetricChip
                        icon={<CreditCard className="h-3.5 w-3.5" />}
                        label="Credit limit"
                        value={`$${creditLimitUsd.toLocaleString()}`}
                    />
                ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <RepCard label="Primary rep" rep={primaryRep} highlight />
                {accountManager && <RepCard label="Account manager" rep={accountManager} />}
            </div>
            {editing && (
                <p className="mt-2 text-[10px] text-muted-foreground italic">
                    Rep info is managed by the manufacturer's rep · use the Rep dashboard preview below to see how it's updated.
                </p>
            )}

            {/* Notes · display o textarea según edit mode */}
            {editing ? (
                <div className="mt-3 rounded-md border border-primary/40 bg-primary/5 p-2.5 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                        <span className="text-[10px] text-muted-foreground">Only your team sees this</span>
                    </div>
                    <textarea
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="Add internal notes · rebate terms, contact preferences, project history, etc."
                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-y"
                    />
                    <p className="text-[10px] text-muted-foreground text-right tabular-nums">
                        {draftNotes.length} / 500
                    </p>
                </div>
            ) : notes ? (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2.5 text-[11px] text-foreground/85">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span>{notes}</span>
                </div>
            ) : null}

            {/* F65.3 · Edit mode Save/Cancel bar · aparece solo en edit mode */}
            {editing && (
                <div className="mt-3 flex items-center gap-2 justify-end border-t border-border pt-3">
                    <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                        <XIcon className="h-3.5 w-3.5" />
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!canSave}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="h-3.5 w-3.5" />
                        Save changes
                    </button>
                </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
                {/* F58b.3 · link contextual al modal My Setup · tab Manufacturers.
                    Antes navegaba al MyDealerInfoPage top-level; ahora abre el
                    modal consolidado con filtro pre-seteado al manufacturer
                    actual · el CatalogPageV2 shell escucha el event. */}
                <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('expert-hub:open-setup-modal', {
                        detail: { tab: 'manufacturers', filterByBrands: [manufacturerName] },
                    }))}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    title="Open My Setup · filtered to this manufacturer"
                >
                    <Handshake className="h-3 w-3" />
                    See all my terms →
                </button>
                <span className="text-[11px] text-muted-foreground">·</span>
                <button
                    type="button"
                    onClick={() => setRepDashboardOpen(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    title="Preview the rep-side view of this relationship"
                >
                    <UserCog className="h-3 w-3" />
                    Are you the rep? View dashboard preview →
                </button>
            </div>

            <RepDashboardSlideOver
                open={repDashboardOpen}
                onClose={() => setRepDashboardOpen(false)}
                repEmail={primaryRep.email}
                repName={primaryRep.name}
            />
        </div>
    )
}

function MetricChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-lg border border-border bg-background p-2.5">
            <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="text-muted-foreground" aria-hidden="true">{icon}</span>
                {label}
            </div>
            <div className="text-sm font-bold text-foreground">{value}</div>
        </div>
    )
}

/* F65.3 · Edit variant del MetricChip · misma silhouette (rounded-lg border
 * bg-background p-2.5) pero con input editable + validation state. Suffix
 * (ej. "% off list") o prefix (ej. "$") opcionales para preservar el
 * formato display. */
function MetricEditInput({
    icon, label, value, onChange, suffix, prefix, placeholder, type, invalid,
}: {
    icon: React.ReactNode
    label: string
    value: string
    onChange: (v: string) => void
    suffix?: string
    prefix?: string
    placeholder?: string
    type: 'text' | 'number'
    invalid?: boolean
}) {
    return (
        <div className={`rounded-lg border ${invalid ? 'border-destructive' : 'border-primary/40'} bg-primary/5 p-2.5`}>
            <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="text-muted-foreground" aria-hidden="true">{icon}</span>
                {label}
            </div>
            <div className="flex items-baseline gap-1">
                {prefix && <span className="text-sm font-bold text-foreground">{prefix}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    min={type === 'number' ? 0 : undefined}
                    max={type === 'number' ? 100 : undefined}
                    className="w-full min-w-0 flex-1 rounded border border-input bg-background px-1.5 py-0.5 text-sm font-bold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                />
                {suffix && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{suffix}</span>}
            </div>
        </div>
    )
}

function RepCard({ label, rep, highlight }: { label: string; rep: DealerRep; highlight?: boolean }) {
    return (
        <div
            className={`rounded-lg border p-3 ${
                highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'
            }`}
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                {rep.lastContactAt && (
                    <span
                        className="text-[10px] text-muted-foreground"
                        title={`Last contact on ${new Date(rep.lastContactAt).toLocaleDateString()}`}
                    >
                        Last contact {formatRelativeDate(rep.lastContactAt)}
                    </span>
                )}
            </div>
            <p className="text-sm font-bold text-foreground leading-tight">{rep.name}</p>
            <p className="mb-2 text-xs text-muted-foreground">{rep.title}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                <a
                    href={`mailto:${rep.email}`}
                    className="group inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline underline-offset-4 decoration-border decoration-1 hover:decoration-primary hover:decoration-2 transition-all"
                >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors shrink-0">
                        <EnvelopeIcon className="w-3 h-3 text-foreground" strokeWidth={2.5} />
                    </span>
                    <span className="truncate max-w-[180px]">{rep.email}</span>
                </a>
                <a
                    href={`tel:${rep.phone}`}
                    className="group inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline underline-offset-4 decoration-border decoration-1 hover:decoration-primary hover:decoration-2 transition-all"
                >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors shrink-0">
                        <PhoneIcon className="w-3 h-3 text-foreground" strokeWidth={2.5} />
                    </span>
                    <span>{rep.phone}</span>
                </a>
            </div>
        </div>
    )
}

/* ─── Filter (mock · idéntico a v1) ──────────────────────────────────── */

function FilterSection({ options }: { options: string[] }) {
    const [selected, setSelected] = useState<string>(options[0] ?? 'Standard')
    return (
        <div>
            <SectionHeader label="Filter" />
            <div className="flex flex-col gap-1.5">
                {options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="brand-filter-v2"
                            checked={selected === opt}
                            onChange={() => setSelected(opt)}
                            className="w-3.5 h-3.5 accent-primary shrink-0"
                        />
                        <span className="text-sm text-foreground/85 group-hover:text-foreground transition-colors">
                            {opt}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    )
}

/* ─── Brand Resources (idéntico a v1) ────────────────────────────────── */

function ResourcesSection({ resources }: { resources: NonNullable<Manufacturer['brandResources']> }) {
    return (
        <div>
            <SectionHeader label="Brand Resources" />
            <ul className="flex flex-col gap-1.5">
                {resources.map((r, i) => (
                    <li key={i}>
                        <a
                            href={r.href ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline underline-offset-4 decoration-border decoration-1 hover:decoration-primary hover:decoration-2 transition-all"
                        >
                            <span className="truncate">{r.name}</span>
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors shrink-0">
                                <ArrowTopRightOnSquareIcon className="w-3 h-3 text-foreground" strokeWidth={2.5} />
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

/* ─── Links (idéntico a v1) ──────────────────────────────────────────── */

function LinksSection({ links }: { links: NonNullable<Manufacturer['links']> }) {
    return (
        <div>
            <SectionHeader label="Links" />
            <ul className="flex flex-col gap-1.5">
                {links.map((l, i) => (
                    <li key={i}>
                        <a
                            href={l.href ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline underline-offset-4 decoration-border decoration-1 hover:decoration-primary hover:decoration-2 transition-all"
                        >
                            <span className="truncate">{l.name}</span>
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors shrink-0">
                                <ArrowTopRightOnSquareIcon className="w-3 h-3 text-foreground" strokeWidth={2.5} />
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

/* ─── Contacts públicos del manufacturer (idéntico a v1) ─────────────── */

function ContactsSection({ contacts }: { contacts: NonNullable<Manufacturer['contacts']> }) {
    return (
        <div>
            <SectionHeader label="Manufacturer contacts" />
            <ul className="flex flex-col gap-3">
                {contacts.map((c, i) => (
                    <li key={i}>
                        <p className="text-sm font-semibold text-foreground leading-tight">{c.name}</p>
                        <p className="text-xs text-muted-foreground mb-1">{c.title}</p>
                        {c.email && (
                            <a
                                href={`mailto:${c.email}`}
                                className="group inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline underline-offset-4 decoration-border decoration-1 hover:decoration-primary hover:decoration-2 transition-all"
                            >
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors shrink-0">
                                    <EnvelopeIcon className="w-3 h-3 text-foreground" strokeWidth={2.5} />
                                </span>
                                <span className="truncate">{c.email}</span>
                            </a>
                        )}
                        {c.phone && (
                            <a
                                href={`tel:${c.phone}`}
                                className="group mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline underline-offset-4 decoration-border decoration-1 hover:decoration-primary hover:decoration-2 transition-all"
                            >
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors shrink-0">
                                    <PhoneIcon className="w-3 h-3 text-foreground" strokeWidth={2.5} />
                                </span>
                                <span>{c.phone}</span>
                            </a>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}
