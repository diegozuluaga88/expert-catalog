// Phase 3 Fix #12 — /quotes section · lista de drafts + detail view inline.
// Diego: "tener un espacio específico para las quotes". Esta page va a estar
// accesible desde el topbar nav (Fix #13) y desde el MiniCartDrawer "View Quote".
//
// Layout · 2-col 30/70 desktop · sidebar list de drafts left, detail right.
// Tabs en sidebar: Drafts (active) / Submitted / Activity log (defer Phase 5).

import { useState } from 'react'
import {
    ArrowLeft, CheckCircle2, FileText, Plus, Sparkles, Trash2, Upload, X,
    ChevronRight,
} from 'lucide-react'
import { useQuote, type QuoteDraft, type QuoteLineItem } from './QuoteContext'
import { formatLeadTime } from './helpers'

type QuoteSection = 'drafts' | 'submitted'

interface QuotesPageProps {
    /** Callback al cerrar la page · vuelve a Catalog */
    onBack?: () => void
}

export default function QuotesPage({ onBack }: QuotesPageProps) {
    const {
        drafts, activeDrafts, submittedDrafts, activeDraftId, activeDraft,
        buyerInfo, setActiveDraft, createDraft, deleteDraft, removeItem,
        updateItem, submitDraft,
    } = useQuote()

    const [section, setSection] = useState<QuoteSection>('drafts')
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [submittedRef, setSubmittedRef] = useState<string | null>(null)

    const visibleDrafts = section === 'drafts' ? activeDrafts : submittedDrafts
    const selectedDraft = activeDraft && visibleDrafts.find(d => d.id === activeDraftId)
        ? activeDraft
        : visibleDrafts[0]

    const handleSubmit = () => {
        if (!selectedDraft) return
        const ref = submitDraft(selectedDraft.id)
        setSubmittedRef(ref)
    }

    const handleDelete = (id: string) => {
        deleteDraft(id)
        setConfirmDeleteId(null)
    }

    const handleNewDraft = () => {
        const d = createDraft()
        setActiveDraft(d.id)
    }

    // Confirmation overlay post-submit
    if (submittedRef) {
        return <SubmittedConfirmation refNumber={submittedRef} tenantName={buyerInfo.tenant.name} onDone={() => { setSubmittedRef(null); setSection('submitted') }} onBack={onBack} />
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card px-6 py-4">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" aria-label="Back">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    )}
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-foreground">Quotes</h1>
                        <p className="text-xs text-muted-foreground">
                            All quotes for <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground ${buyerInfo.tenant.badgeColor}`}>{buyerInfo.tenant.name}</span>
                        </p>
                    </div>
                    <button type="button" onClick={handleNewDraft} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                        New empty draft
                    </button>
                </div>

                {/* Section tabs */}
                <div className="mt-4 flex gap-1" role="tablist">
                    <SectionTab label="Drafts" count={activeDrafts.length} active={section === 'drafts'} onClick={() => setSection('drafts')} />
                    <SectionTab label="Submitted" count={submittedDrafts.length} active={section === 'submitted'} onClick={() => setSection('submitted')} />
                </div>
            </div>

            {/* Body · 2-col layout */}
            <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[320px_1fr]">
                {/* Sidebar · drafts list */}
                <aside className="space-y-2">
                    {visibleDrafts.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
                            <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
                            <p className="mt-2 text-sm font-medium text-foreground">No {section} yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {section === 'drafts'
                                    ? 'Add products from the showroom or create an empty draft.'
                                    : 'Submitted quotes will appear here.'}
                            </p>
                        </div>
                    ) : (
                        visibleDrafts.map(d => (
                            <DraftListItem
                                key={d.id}
                                draft={d}
                                selected={selectedDraft?.id === d.id}
                                onClick={() => setActiveDraft(d.id)}
                                onDelete={section === 'drafts' ? () => setConfirmDeleteId(d.id) : undefined}
                                confirmDelete={confirmDeleteId === d.id}
                                onCancelDelete={() => setConfirmDeleteId(null)}
                                onConfirmDelete={() => handleDelete(d.id)}
                            />
                        ))
                    )}
                </aside>

                {/* Detail · selected draft */}
                <main>
                    {selectedDraft ? (
                        <DraftDetail
                            draft={selectedDraft}
                            isSubmitted={section === 'submitted'}
                            onSubmit={handleSubmit}
                            onUpdateItem={(itemId, patch) => updateItem(selectedDraft.id, itemId, patch)}
                            onRemoveItem={(itemId) => removeItem(selectedDraft.id, itemId)}
                        />
                    ) : (
                        <div className="rounded-xl border border-border bg-card p-12 text-center">
                            <p className="text-sm text-muted-foreground">Select a quote to view details.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function SectionTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
            {label}
            <span className={`inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
                {count}
            </span>
        </button>
    )
}

interface DraftListItemProps {
    draft: QuoteDraft
    selected: boolean
    onClick: () => void
    onDelete?: () => void
    confirmDelete: boolean
    onCancelDelete: () => void
    onConfirmDelete: () => void
}

function DraftListItem({ draft, selected, onClick, onDelete, confirmDelete, onCancelDelete, onConfirmDelete }: DraftListItemProps) {
    const itemCount = draft.items.length
    const unitCount = draft.items.reduce((s, it) => s + it.qty, 0)
    const total = draft.items.reduce((s, it) => s + it.totalPrice, 0)

    return (
        <div className={`group relative rounded-xl border bg-card transition-all ${
            selected ? 'border-primary shadow-sm ring-2 ring-primary/20' : 'border-border hover:border-foreground/20'
        }`}>
            <button
                type="button"
                onClick={onClick}
                className="block w-full p-3 text-left"
            >
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {draft.source === 'ingest' ? <Sparkles className="h-3 w-3" /> : null}
                    <span className="font-mono uppercase tracking-wide">{draft.referenceNumber}</span>
                    {draft.status === 'submitted' && (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Submitted</span>
                    )}
                </div>
                <div className="mt-0.5 truncate text-sm font-bold text-foreground">{draft.name}</div>
                <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{itemCount} {itemCount === 1 ? 'line' : 'lines'} · {unitCount} units</span>
                    <span className="font-semibold text-foreground">${total.toLocaleString()}</span>
                </div>
            </button>
            {onDelete && (
                <>
                    {confirmDelete ? (
                        <div className="border-t border-border bg-destructive/10 px-3 py-2">
                            <p className="mb-1.5 text-[11px] font-medium text-destructive">Delete this draft?</p>
                            <div className="flex gap-1.5">
                                <button type="button" onClick={onConfirmDelete} className="flex-1 rounded bg-destructive px-2 py-1 text-[11px] font-bold text-destructive-foreground hover:bg-destructive/90">Yes</button>
                                <button type="button" onClick={onCancelDelete} className="flex-1 rounded border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button type="button" onClick={onDelete} className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100" aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </>
            )}
        </div>
    )
}

interface DraftDetailProps {
    draft: QuoteDraft
    isSubmitted: boolean
    onSubmit: () => void
    onUpdateItem: (itemId: string, patch: Partial<QuoteLineItem>) => void
    onRemoveItem: (itemId: string) => void
}

function DraftDetail({ draft, isSubmitted, onSubmit, onUpdateItem, onRemoveItem }: DraftDetailProps) {
    const total = draft.items.reduce((s, it) => s + it.totalPrice, 0)
    const totalUnits = draft.items.reduce((s, it) => s + it.qty, 0)
    const maxLead = Math.max(0, ...draft.items.map(it => it.leadTimeDays))
    const { buyerInfo } = draft

    return (
        <div className="space-y-4">
            {/* Source · ingest banner */}
            {draft.source === 'ingest' && draft.sourceDocRef && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-primary/5 px-4 py-2 text-sm">
                    <Sparkles className="h-4 w-4 text-foreground" />
                    <span className="text-foreground">
                        Generated from <span className="font-semibold">{draft.sourceDocRef}</span>
                    </span>
                </div>
            )}

            {/* Buyer info card · autofilled (Diego ask · fill once, show pre-filled) */}
            <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-foreground">Buyer information</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Auto-filled from your user + tenant profile · edit in account settings.</p>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <BuyerField label="Contact" value={`${buyerInfo.user.fullName} · ${buyerInfo.user.title}`} />
                    <BuyerField label="Email" value={buyerInfo.user.email} />
                    <BuyerField label="Phone" value={buyerInfo.user.phone} />
                    <BuyerField label="Legal entity" value={buyerInfo.tenant.legalName} />
                    <BuyerField label="Industry" value={buyerInfo.tenant.industry} />
                    <BuyerField label="Tax ID" value={buyerInfo.tenant.taxId} />
                    <BuyerField label="Billing address" value={`${buyerInfo.tenant.billingAddress.line1}, ${buyerInfo.tenant.billingAddress.city}, ${buyerInfo.tenant.billingAddress.state} ${buyerInfo.tenant.billingAddress.zip}`} colSpan={2} />
                </div>
            </div>

            {/* Items list */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="border-b border-border bg-muted/30 px-4 py-2">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-foreground">Line items ({draft.items.length})</h2>
                </div>
                {draft.items.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">This draft is empty · add products from the showroom.</p>
                ) : (
                    <ul className="divide-y divide-border">
                        {draft.items.map(item => (
                            <li key={item.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 p-3">
                                <div className="h-16 w-16 overflow-hidden rounded-md bg-muted">
                                    <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{item.productBrand}</span>
                                    </div>
                                    <div className="truncate text-sm font-bold text-foreground">{item.productName}</div>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                        {item.colorwayHex && <span className="inline-block h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: item.colorwayHex }} />}
                                        {item.colorwayName && <span>{item.colorwayName}</span>}
                                        {item.finishName && <span>· {item.finishName}</span>}
                                        {item.fabricName && <span>· {item.fabricName}</span>}
                                        {item.fabricIsPremium && <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1 text-amber-700 dark:text-amber-400">premium</span>}
                                        {item.materialTierName && item.materialTierName !== 'Standard' && <span>· {item.materialTierName}</span>}
                                    </div>
                                    <div className="mt-1 text-[10px] text-muted-foreground">Ships in {formatLeadTime(item.leadTimeDays)}</div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="text-right">
                                        {!isSubmitted ? (
                                            <input
                                                type="number"
                                                value={item.qty}
                                                min={1}
                                                onChange={(e) => onUpdateItem(item.id, { qty: Math.max(1, parseInt(e.target.value, 10) || 1), totalPrice: item.unitPrice * Math.max(1, parseInt(e.target.value, 10) || 1) })}
                                                className="h-8 w-16 rounded border border-input bg-background text-center text-sm font-semibold text-foreground focus:border-ring focus:outline-none"
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold text-foreground">×{item.qty}</span>
                                        )}
                                        <div className="mt-1 text-xs text-muted-foreground">@ ${item.unitPrice.toLocaleString()}</div>
                                        <div className="text-base font-bold text-foreground">${item.totalPrice.toLocaleString()}</div>
                                    </div>
                                    {!isSubmitted && (
                                        <button type="button" onClick={() => onRemoveItem(item.id)} className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Remove">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Totals + submit */}
            {draft.items.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="grid grid-cols-3 gap-4 border-b border-border pb-3">
                        <Stat label="Total units" value={`${totalUnits}`} />
                        <Stat label="Estimated lead" value={formatLeadTime(maxLead)} />
                        <Stat label="Quote total" value={`$${total.toLocaleString()}`} highlight />
                    </div>
                    {!isSubmitted ? (
                        <button type="button" onClick={onSubmit} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                            <CheckCircle2 className="h-4 w-4" />
                            Submit quote request
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                            This quote was submitted · reference {draft.referenceNumber}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

function BuyerField({ label, value, colSpan }: { label: string; value: string; colSpan?: number }) {
    return (
        <div className={colSpan === 2 ? 'sm:col-span-2' : ''}>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="text-sm text-foreground">{value}</dd>
        </div>
    )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className={`mt-0.5 text-lg font-bold text-foreground ${highlight ? '' : ''}`}>{value}</div>
        </div>
    )
}

/* ─── Confirmation overlay ──────────────────────────────────── */

function SubmittedConfirmation({ refNumber, tenantName, onDone, onBack }: { refNumber: string; tenantName: string; onDone: () => void; onBack?: () => void }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-foreground">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Quote submitted</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Your quote for <span className="font-semibold text-foreground">{tenantName}</span> has been sent · we'll be in touch within 24 hours.
                </p>
                <div className="mt-4 rounded-lg bg-muted/40 px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Reference number</div>
                    <div className="text-base font-mono font-bold text-foreground">{refNumber}</div>
                </div>
                <div className="mt-6 flex gap-2">
                    <button type="button" onClick={onDone} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                        View submitted
                    </button>
                    {onBack && (
                        <button type="button" onClick={onBack} className="flex-1 rounded-lg border border-input px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                            Back to Catalog
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
