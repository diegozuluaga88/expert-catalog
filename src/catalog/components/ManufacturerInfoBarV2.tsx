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
import { CreditCard, Truck, Percent, MessageSquare, Clock, UserCog } from 'lucide-react'
import type { Manufacturer } from '../types'
import { useState } from 'react'
import { useTenant } from '../../TenantContext'
import {
    getDealerRelationship,
    formatRelativeDate,
    type DealerRelationship,
    type DealerRep,
} from '../data/dealerRelationships'
import RepDashboardSlideOver from './RepDashboardSlideOver'

interface ManufacturerInfoBarV2Props {
    manufacturer: Manufacturer
    /** Idem v1 · `'stack'` (default) vertical con separadores · `'grid'` full-width. */
    layout?: 'stack' | 'grid'
}

const FILTER_LABELS = ['Standard', 'GSA', 'QS'] as const

export default function ManufacturerInfoBarV2({ manufacturer, layout = 'stack' }: ManufacturerInfoBarV2Props) {
    const { currentTenant } = useTenant()
    const relationship = getDealerRelationship(currentTenant, manufacturer.id)

    const filterOpts = manufacturer.filterOptions?.filter((o) =>
        FILTER_LABELS.some((l) => l.toLowerCase() === o.toLowerCase()),
    ) ?? []
    const hasFilter = filterOpts.length > 0
    const hasResources = (manufacturer.brandResources?.length ?? 0) > 0
    const hasLinks = (manufacturer.links?.length ?? 0) > 0
    const hasContacts = (manufacturer.contacts?.length ?? 0) > 0
    const hasRelationship = relationship !== null

    if (!hasFilter && !hasResources && !hasLinks && !hasContacts && !hasRelationship) {
        return null
    }

    const isStack = layout === 'stack'
    const containerClass = isStack
        ? 'mt-6 rounded-xl border border-border bg-card/50 p-5 flex flex-col divide-y divide-border'
        : 'mt-10 rounded-xl border border-border bg-card/50 p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4'
    const sectionPadClass = isStack ? 'py-4 first:pt-0 last:pb-0' : ''

    return (
        <section aria-label="Brand information" className={containerClass}>
            {hasRelationship && (
                <div className={sectionPadClass}>
                    <DealerRelationshipSection relationship={relationship!} dealerName={currentTenant} />
                </div>
            )}
            {hasFilter && <div className={sectionPadClass}><FilterSection options={filterOpts} /></div>}
            {hasResources && <div className={sectionPadClass}><ResourcesSection resources={manufacturer.brandResources!} /></div>}
            {hasLinks && <div className={sectionPadClass}><LinksSection links={manufacturer.links!} /></div>}
            {hasContacts && <div className={sectionPadClass}><ContactsSection contacts={manufacturer.contacts!} /></div>}
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
}: {
    relationship: DealerRelationship
    dealerName: string
}) {
    const { discountTier, freightTerms, primaryRep, accountManager, creditLimitUsd, notes, lastUpdatedAt } = relationship
    const [repDashboardOpen, setRepDashboardOpen] = useState(false)
    return (
        <div>
            <div className="mb-3 flex items-baseline justify-between gap-2">
                <SectionHeader label="Your dealer relationship" accent />
                <span
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                    title={`Last updated on ${new Date(lastUpdatedAt).toLocaleDateString()}`}
                >
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    Updated {formatRelativeDate(lastUpdatedAt)}
                </span>
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
                Private info for <span className="font-semibold text-foreground">{dealerName}</span> with this manufacturer. Not visible to other dealers.
            </p>

            {/* Discount + freight + credit · 3 chips lado a lado */}
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
                <MetricChip
                    icon={<Percent className="h-3.5 w-3.5" />}
                    label="Discount tier"
                    value={`${discountTier}% off list`}
                />
                <MetricChip
                    icon={<Truck className="h-3.5 w-3.5" />}
                    label="Freight terms"
                    value={freightTerms}
                />
                {creditLimitUsd !== undefined && (
                    <MetricChip
                        icon={<CreditCard className="h-3.5 w-3.5" />}
                        label="Credit limit"
                        value={`$${creditLimitUsd.toLocaleString()}`}
                    />
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <RepCard label="Primary rep" rep={primaryRep} highlight />
                {accountManager && <RepCard label="Account manager" rep={accountManager} />}
            </div>

            {notes && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2.5 text-[11px] text-foreground/85">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span>{notes}</span>
                </div>
            )}

            <button
                type="button"
                onClick={() => setRepDashboardOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                title="Preview the rep-side view of this relationship"
            >
                <UserCog className="h-3 w-3" />
                Are you the rep? View dashboard preview →
            </button>

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
