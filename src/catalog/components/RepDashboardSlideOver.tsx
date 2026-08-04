// F51 · A.4 · P4 rep cadence + cascade time-stamped · build funcional.
//
// Reemplaza al placeholder disabled del F50 · ahora el rep puede:
//   · aplicar bulk updates a discounts/freight/notes en los dealers que
//     atiende · persiste como overrides sobre el SEED y estampea
//     lastUpdatedAt = now
//   · resolver update-requests que sus dealers pidieron
//   · disparar el "monthly cadence email" (mock · toast + estampeo de
//     todas sus relationships)
//   · previsualizar el HTML del email de cadence
//
// Cascade time-stamped · cualquier cambio del rep dispara
// DEALER_REL_CHANGE_EVENT · MyDealerInfoPage escucha y refresca.
// Sin backend · todo persiste en localStorage bajo overrides + inbox.

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Mail, ExternalLink, Send, ClipboardCheck, MailCheck, Sparkles } from 'lucide-react'
import {
    SlideOver,
    SlideOverHeader,
    SlideOverTitle,
    SlideOverBody,
    Button,
} from 'strata-design-system'
import {
    getRelationshipsForRep,
    getUpdateRequestsForRep,
    clearUpdateRequest,
    applyRelationshipOverride,
    formatRelativeDate,
    DEALER_REL_CHANGE_EVENT,
    UPDATE_REQUESTS_CHANGE_EVENT,
    type DealerRelationship,
} from '../data/dealerRelationships'
import { MANUFACTURERS } from '../data/manufacturers'
import { useDialogs } from '../../components/dialogs/DialogsContext'
import { useToast, ToastContainer } from '../../components/AuthToast'

interface RepDashboardSlideOverProps {
    open: boolean
    onClose: () => void
    /** Email del rep en foco · se usa para filtrar los dealers que atiende. */
    repEmail: string
    repName: string
}

interface BulkUpdateForm {
    discountTier: string
    freightTerms: string
    notes: string
    scope: 'all' | 'selected'
}

const EMPTY_FORM: BulkUpdateForm = { discountTier: '', freightTerms: '', notes: '', scope: 'all' }

export default function RepDashboardSlideOver({ open, onClose, repEmail, repName }: RepDashboardSlideOverProps) {
    const { confirm } = useDialogs()
    const { toasts, addToast, dismissToast } = useToast()
    const [tick, setTick] = useState(0)

    // Rehidrata al recibir eventos de cambio (aunque sea el mismo slide-over
    // el que los dispara · así los sub-componentes se re-render).
    useEffect(() => {
        const handler = () => setTick((t) => t + 1)
        window.addEventListener(DEALER_REL_CHANGE_EVENT, handler)
        window.addEventListener(UPDATE_REQUESTS_CHANGE_EVENT, handler)
        return () => {
            window.removeEventListener(DEALER_REL_CHANGE_EVENT, handler)
            window.removeEventListener(UPDATE_REQUESTS_CHANGE_EVENT, handler)
        }
    }, [])

    const relationships = useMemo(
        () => getRelationshipsForRep(repEmail),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [repEmail, tick],
    )

    const inboxRequests = useMemo(
        () => getUpdateRequestsForRep(repEmail),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [repEmail, tick],
    )

    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
    const [form, setForm] = useState<BulkUpdateForm>(EMPTY_FORM)
    const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)

    const toggleSelected = (key: string) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const targetRels = useMemo(() => (
        form.scope === 'all'
            ? relationships
            : relationships.filter((r) => selectedKeys.has(`${r.dealerSlug}__${r.manufacturerSlug}`))
    ), [form.scope, relationships, selectedKeys])

    const canApply = targetRels.length > 0 && (
        form.discountTier.trim() !== '' ||
        form.freightTerms.trim() !== '' ||
        form.notes.trim() !== ''
    )

    const handleApply = async () => {
        if (!canApply) return
        const patch: Parameters<typeof applyRelationshipOverride>[2] = {}
        const disc = parseFloat(form.discountTier)
        if (form.discountTier.trim() !== '' && !isNaN(disc)) patch.discountTier = disc
        if (form.freightTerms.trim() !== '') patch.freightTerms = form.freightTerms.trim()
        if (form.notes.trim() !== '') patch.notes = form.notes.trim()

        const changesDesc = Object.keys(patch).join(', ')
        const ok = await confirm({
            title: `Apply update to ${targetRels.length} ${targetRels.length === 1 ? 'dealer' : 'dealers'}?`,
            description: `Fields to change: ${changesDesc}. This stamps a fresh lastUpdatedAt on each relationship and dealers will see the changes immediately.`,
            confirmLabel: `Apply to ${targetRels.length}`,
        })
        if (!ok) return

        for (const rel of targetRels) {
            applyRelationshipOverride(rel.dealerSlug, rel.manufacturerSlug, patch)
        }
        addToast('success', `Updated ${targetRels.length} ${targetRels.length === 1 ? 'relationship' : 'relationships'} · dealers notified.`)
        setForm(EMPTY_FORM)
        setSelectedKeys(new Set())
    }

    const handleCadenceEmail = async () => {
        if (relationships.length === 0) return
        const ok = await confirm({
            title: 'Send monthly update email?',
            description: `Simulates the monthly cadence email · stamps lastUpdatedAt = now on all ${relationships.length} relationships so dealers see the info is fresh.`,
            confirmLabel: 'Send + stamp',
        })
        if (!ok) return
        for (const rel of relationships) {
            applyRelationshipOverride(rel.dealerSlug, rel.manufacturerSlug, {})
        }
        addToast('success', `Monthly cadence email sent · ${relationships.length} dealer relationships stamped.`, {
            label: 'Preview email',
            onClick: () => setEmailPreviewOpen(true),
        })
    }

    const handleResolveRequest = (dealerSlug: string, manufacturerSlug: string) => {
        clearUpdateRequest(dealerSlug, manufacturerSlug)
        addToast('info', 'Update request resolved · removed from your inbox.')
    }

    return (
        <>
            <SlideOver open={open} onClose={onClose}>
                <SlideOverHeader onClose={onClose}>
                    <SlideOverTitle>Rep dashboard</SlideOverTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Manage the dealers <span className="font-semibold text-foreground">{repName}</span> serves · bulk updates, cadence email, inbox.
                    </p>
                </SlideOverHeader>

                <SlideOverBody>
                    <ToastContainer toasts={toasts} onDismiss={dismissToast} />

                    {relationships.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No dealers found for this rep in the mock seed.
                        </p>
                    ) : (
                        <>
                            {/* Cadence action */}
                            <section className="mb-5 rounded-xl border border-primary/40 bg-primary/5 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                            <MailCheck className="h-4 w-4 text-primary" />
                                            Monthly cadence email
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            One click sends the periodic update-notice email and stamps all your dealer relationships as fresh.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEmailPreviewOpen(true)}
                                        className="text-[11px] font-semibold text-primary hover:underline whitespace-nowrap"
                                    >
                                        Preview email
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCadenceEmail}
                                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    Send monthly update to {relationships.length} {relationships.length === 1 ? 'dealer' : 'dealers'}
                                </button>
                            </section>

                            {/* Inbox · update requests */}
                            {inboxRequests.length > 0 && (
                                <section className="mb-5">
                                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <ClipboardCheck className="h-3.5 w-3.5" />
                                        Inbox · dealers asking for updates ({inboxRequests.length})
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {inboxRequests.map((req) => {
                                            const rel = relationships.find(
                                                (r) => r.dealerSlug === req.dealerSlug && r.manufacturerSlug === req.manufacturerSlug,
                                            )
                                            const dealerDisplay = req.dealerSlug
                                                .split('-').map((s) => s.replace(/^./, (c) => c.toUpperCase())).join(' ')
                                            const manufacturerName = MANUFACTURERS.find((m) => m.id === req.manufacturerSlug)?.name ?? req.manufacturerSlug
                                            return (
                                                <li
                                                    key={`${req.dealerSlug}-${req.manufacturerSlug}-${req.requestedAt}`}
                                                    className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[11px]"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-foreground truncate">
                                                            {dealerDisplay} · {manufacturerName}
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            Asked {formatRelativeDate(req.requestedAt)}
                                                            {rel && ` · current tier ${rel.discountTier}%`}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResolveRequest(req.dealerSlug, req.manufacturerSlug)}
                                                        className="rounded-md border border-input bg-background px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-muted"
                                                    >
                                                        Resolve
                                                    </button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </section>
                            )}

                            {/* Dealers list · seleccionable */}
                            <section className="mb-5">
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Dealers you serve ({relationships.length})
                                </h3>
                                <ul className="space-y-2">
                                    {relationships.map((rel) => {
                                        const key = `${rel.dealerSlug}__${rel.manufacturerSlug}`
                                        const selected = selectedKeys.has(key)
                                        return (
                                            <DealerRow
                                                key={key}
                                                relationship={rel}
                                                selectable={form.scope === 'selected'}
                                                selected={selected}
                                                onToggleSelect={() => toggleSelected(key)}
                                            />
                                        )
                                    })}
                                </ul>
                            </section>

                            {/* Bulk update form · funcional */}
                            <section>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Bulk update
                                </h3>
                                <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-foreground">Apply to</label>
                                        <select
                                            value={form.scope}
                                            onChange={(e) => setForm({ ...form, scope: e.target.value as 'all' | 'selected' })}
                                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                                        >
                                            <option value="all">All dealers I serve ({relationships.length})</option>
                                            <option value="selected">Selected dealers only ({selectedKeys.size})</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-foreground">New discount tier (%)</label>
                                            <input
                                                type="number"
                                                value={form.discountTier}
                                                onChange={(e) => setForm({ ...form, discountTier: e.target.value })}
                                                placeholder="e.g. 42"
                                                min={0}
                                                max={100}
                                                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-foreground">Freight terms</label>
                                            <input
                                                type="text"
                                                value={form.freightTerms}
                                                onChange={(e) => setForm({ ...form, freightTerms: e.target.value })}
                                                placeholder="e.g. Prepay & add"
                                                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-foreground">Notes (replace)</label>
                                        <input
                                            type="text"
                                            value={form.notes}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                            placeholder="Optional free-text note"
                                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleApply}
                                        disabled={!canApply}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Apply update to {targetRels.length} {targetRels.length === 1 ? 'relationship' : 'relationships'}
                                    </button>
                                </div>
                            </section>
                        </>
                    )}
                </SlideOverBody>

                <div className="border-t border-border bg-card px-6 py-4">
                    <Button variant="outline" onClick={onClose} className="w-full">
                        Close
                    </Button>
                </div>
            </SlideOver>

            {/* Nested modal · email preview */}
            <EmailPreviewModal
                open={emailPreviewOpen}
                onClose={() => setEmailPreviewOpen(false)}
                repName={repName}
                relationships={relationships}
            />
        </>
    )
}

/* ─── Dealer row ────────────────────────────────────────────────────── */

interface DealerRowProps {
    relationship: DealerRelationship
    selectable: boolean
    selected: boolean
    onToggleSelect: () => void
}

function DealerRow({ relationship, selectable, selected, onToggleSelect }: DealerRowProps) {
    const { dealerSlug, manufacturerSlug, discountTier, freightTerms, lastUpdatedAt } = relationship
    const dealerDisplay = dealerSlug
        .split('-')
        .map((s) => s.replace(/^./, (c) => c.toUpperCase()))
        .join(' ')
    const manufacturerName = MANUFACTURERS.find((m) => m.id === manufacturerSlug)?.name ?? manufacturerSlug
    return (
        <li className={`rounded-lg border p-3 transition-colors ${
            selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
        }`}>
            <div className="mb-1 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                    {selectable && (
                        <input
                            type="checkbox"
                            checked={selected}
                            onChange={onToggleSelect}
                            className="mt-0.5 accent-primary"
                        />
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{dealerDisplay}</p>
                        <p className="text-[11px] text-muted-foreground">with {manufacturerName}</p>
                    </div>
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

/* ─── Email preview modal ───────────────────────────────────────────── */

interface EmailPreviewModalProps {
    open: boolean
    onClose: () => void
    repName: string
    relationships: DealerRelationship[]
}

function EmailPreviewModal({ open, onClose, repName, relationships }: EmailPreviewModalProps) {
    const dealerGroups = useMemo(() => {
        const map = new Map<string, DealerRelationship[]>()
        relationships.forEach((r) => {
            const existing = map.get(r.dealerSlug) ?? []
            existing.push(r)
            map.set(r.dealerSlug, existing)
        })
        return Array.from(map.entries())
    }, [relationships])

    return (
        <Transition show={open} as={Fragment} appear>
            <Dialog onClose={onClose} className="relative z-[100]">
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                            <header className="flex items-start justify-between gap-3 border-b border-border p-4">
                                <div>
                                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                        {/* Icon neutro · el header del modal está sobre card claro (Rule DS). */}
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        Email preview · monthly cadence
                                    </h2>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">This is what {repName} will receive · not sent to anyone.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                    aria-label="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </header>
                            <div className="flex-1 overflow-y-auto p-5">
                                <div className="rounded-xl border border-border bg-background p-6 font-sans text-sm text-foreground">
                                    <p className="text-xs text-muted-foreground">From · MRL Platform &lt;no-reply@mrl.example&gt;</p>
                                    <p className="text-xs text-muted-foreground">To · {repName.toLowerCase().replace(/\s+/g, '.')}@example.com</p>
                                    <p className="text-xs text-muted-foreground">Subject · Your monthly dealer info update</p>
                                    <hr className="my-3 border-border" />
                                    <p className="mb-3">Hi {repName.split(' ')[0]},</p>
                                    <p className="mb-3">Here's a quick view of the dealers you serve. Please review and update any terms that have changed since last month.</p>
                                    {/* F56.4 · mobile fix · tabla raw de 4 columnas se aplastaba en
                                        el slide-over max-w-2xl. Wrap con overflow-x-auto para
                                        que scrollee horizontal sin romper el layout del modal. */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-xs min-w-[420px]">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="py-1.5 text-left font-semibold">Dealer</th>
                                                    <th className="py-1.5 text-left font-semibold">Manufacturer</th>
                                                    <th className="py-1.5 text-right font-semibold">Discount</th>
                                                    <th className="py-1.5 text-left font-semibold">Freight</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dealerGroups.flatMap(([, rels]) => rels).map((r) => {
                                                    const dealerDisplay = r.dealerSlug
                                                        .split('-').map((s) => s.replace(/^./, (c) => c.toUpperCase())).join(' ')
                                                    const mfrName = MANUFACTURERS.find((m) => m.id === r.manufacturerSlug)?.name ?? r.manufacturerSlug
                                                    return (
                                                        <tr key={`${r.dealerSlug}-${r.manufacturerSlug}`} className="border-b border-border">
                                                            <td className="py-1.5 whitespace-nowrap">{dealerDisplay}</td>
                                                            <td className="py-1.5 whitespace-nowrap">{mfrName}</td>
                                                            <td className="py-1.5 text-right tabular-nums">{r.discountTier}%</td>
                                                            <td className="py-1.5 whitespace-nowrap">{r.freightTerms}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="mt-4 text-xs">
                                        <a href="#" className="text-primary underline">Open your rep dashboard →</a>
                                    </p>
                                    <hr className="my-3 border-border" />
                                    <p className="text-[10px] text-muted-foreground">MRL · Manufacturer Resource Library · you receive this because you're the primary rep for the accounts listed above.</p>
                                </div>
                            </div>
                            <footer className="border-t border-border p-4">
                                <Button variant="outline" onClick={onClose} className="w-full">Close preview</Button>
                            </footer>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}
