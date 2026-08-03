// F50 · Etapa 7 (P4) · v2 · placeholder honesto del rep dashboard.
//
// El PRD P4 forward vision (Jeff) pide un rol nuevo "Rep" con:
//   · vista consolidada de todos los dealers que atiende ese rep
//   · formulario de bulk update para poder actualizar discounts, freight,
//     contactos en todas las relaciones desde un solo lugar
//   · cadencia de email al rep con link firmado al dashboard
//   · cascade con timestamp a los dealers cuando algo cambia
//
// Este slide-over es un **mockup no funcional**. Muestra el shape que
// tendría el dashboard cuando exista el backend (lista de dealers + form
// de bulk update) pero el form está deshabilitado con un banner explícito
// "Pending PRD specifics + backend".
//
// La razón de renderizarlo aunque no funcione: dar a Jeff/Laura un
// artefacto visual concreto para reaccionar antes de definir los detalles
// (cadencia exacta, formato del email, conflict resolution). Es más útil
// que una lista de features en un doc.

import { X, ShieldAlert, Mail, ExternalLink } from 'lucide-react'
import {
    SlideOver,
    SlideOverHeader,
    SlideOverTitle,
    SlideOverBody,
    Button,
} from 'strata-design-system'
import {
    getRelationshipsForRep,
    formatRelativeDate,
    type DealerRelationship,
} from '../data/dealerRelationships'

interface RepDashboardSlideOverProps {
    open: boolean
    onClose: () => void
    /** Email del rep en foco · se usa para filtrar los dealers que atiende. */
    repEmail: string
    repName: string
}

export default function RepDashboardSlideOver({ open, onClose, repEmail, repName }: RepDashboardSlideOverProps) {
    const relationships = getRelationshipsForRep(repEmail)

    return (
        <SlideOver open={open} onClose={onClose}>
            <SlideOverHeader onClose={onClose}>
                <SlideOverTitle>Rep dashboard · preview</SlideOverTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                    Consolidated view of the dealers <span className="font-semibold text-foreground">{repName}</span> serves.
                </p>
            </SlideOverHeader>

            <SlideOverBody>
                {/* Honest banner · esto es un mockup no funcional. */}
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-[12px]">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                    <div>
                        <p className="font-semibold text-foreground">Preview · not functional yet</p>
                        <p className="mt-0.5 text-muted-foreground">
                            The rep role, bulk update form and email cadence are pending PRD specifics from Jeff and a real backend. This slide-over shows the shape it would take · nothing you submit here is persisted.
                        </p>
                    </div>
                </div>

                {relationships.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No dealers found for this rep in the mock seed.
                    </p>
                ) : (
                    <>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Dealers you serve ({relationships.length})
                        </h3>
                        <ul className="mb-6 space-y-2">
                            {relationships.map((r) => (
                                <DealerRow key={`${r.dealerSlug}-${r.manufacturerSlug}`} relationship={r} />
                            ))}
                        </ul>

                        {/* Bulk update form · disabled */}
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Bulk update
                        </h3>
                        <fieldset
                            disabled
                            className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 opacity-70"
                            title="Disabled · pending backend"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-foreground">Apply to</label>
                                <select className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-muted-foreground">
                                    <option>All dealers I serve</option>
                                    <option>Selected dealers only</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-foreground">New discount tier (%)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 42"
                                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-muted-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-foreground">Freight terms</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Prepay & add"
                                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-muted-foreground"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-foreground">Notify dealers</label>
                                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <input type="checkbox" className="accent-primary" defaultChecked />
                                    Send timestamped update notice
                                </label>
                            </div>
                            <button
                                type="button"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground"
                            >
                                Apply update
                            </button>
                        </fieldset>

                        {/* Ask for email cadence · disabled but shows the intent */}
                        <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-card p-3 text-[12px]">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <div>
                                <p className="font-semibold text-foreground">Email cadence · preview</p>
                                <p className="text-muted-foreground">
                                    Reps would receive a monthly (or bimonthly) email surfacing all dealers they serve + a signed link back to this dashboard. Format and frequency pending Jeff's spec.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </SlideOverBody>

            <div className="border-t border-border bg-card px-6 py-4">
                <Button variant="outline" onClick={onClose} className="w-full">
                    Close preview
                </Button>
            </div>
        </SlideOver>
    )
}

function DealerRow({ relationship }: { relationship: DealerRelationship }) {
    const { dealerSlug, manufacturerSlug, discountTier, freightTerms, lastUpdatedAt } = relationship
    // Formatea el slug de dealer a display name (best-effort).
    const dealerDisplay = dealerSlug
        .split('-')
        .map((s) => s.replace(/^./, (c) => c.toUpperCase()))
        .join(' ')
    return (
        <li className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{dealerDisplay}</p>
                    <p className="text-[11px] text-muted-foreground">
                        with {manufacturerSlug.replace(/^./, (c) => c.toUpperCase())}
                    </p>
                </div>
                <button
                    type="button"
                    aria-label="Open dealer detail"
                    title="Open dealer detail (preview)"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-50"
                >
                    <ExternalLink className="h-3 w-3" />
                </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground/85">
                <span><span className="font-semibold">{discountTier}%</span> off list</span>
                <span>·</span>
                <span>{freightTerms}</span>
                <span>·</span>
                <span className="text-muted-foreground">Updated {formatRelativeDate(lastUpdatedAt)}</span>
            </div>
        </li>
    )
}
