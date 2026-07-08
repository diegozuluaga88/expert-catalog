// Phase 5 Fix #14 — Doc ingest modal · Upload Quote/PO/ACK → AI mapping → draft.
// Diego: "agregar al lado de Import Catalog una opción de cotizar donde se sube
// un archivo de transacción · Strata ayuda a entender el archivo, revisar y
// comparar contra la base de datos · sugerir matches/substitutos · crear orden
// en la sección de selección".
//
// 4 steps: upload → processing → review (mapping table) → confirm.
// Inspirado en Amazon Business Quick Order multi-line + Strata DS processing
// pattern del CLC (5 phases).

import React, { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    ArrowUpRight, Ban, CheckCircle2, ChevronRight, FileText, Search, Server,
    Sparkles, Upload, X, AlertTriangle, XCircle, RefreshCw,
} from 'lucide-react'
import {
    MOCK_INGEST_DOCS, MOCK_DOC_IDS, getMockDoc, docTypeLabel,
    type DocType, type MockIngestedDoc, type MockExtractedLine, type MatchStatus,
} from './mockIngest'
import { findProductById } from '../catalog/productLookup'
import { getProductVariants } from '../catalog/data/productVariants'
import { computeLineItemTotals } from './helpers'
import { useQuote, type QuoteLineItem } from './QuoteContext'
import { formatPrice } from '../catalog/data/catalogues'
import { resolveLegacyFabricId } from '../catalog/data/finishes'

type IngestStep = 'upload' | 'processing' | 'review' | 'confirm'

type ProcessPhase = 'reading' | 'extracting' | 'matching' | 'identifying' | 'suggesting'

interface IngestQuoteModalProps {
    isOpen: boolean
    onClose: () => void
    /** Called después del confirm · navega a /quotes con el nuevo draft */
    onComplete?: (draftId: string) => void
}

/** Mutable line state durante el review · permite al user accept/skip/swap */
interface ReviewLine {
    raw: MockExtractedLine
    /** Resolved después de user action · null = skipped */
    resolvedProductId: string | null
    /** User accepted la sugerencia del AI o swap explícito */
    userResolution: 'accept' | 'substitute' | 'skip' | 'pending'
}

export default function IngestQuoteModal({ isOpen, onClose, onComplete }: IngestQuoteModalProps) {
    const { createDraft, addItems } = useQuote()
    const [step, setStep] = useState<IngestStep>('upload')
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
    const [docType, setDocType] = useState<DocType>('po')
    const [reviewLines, setReviewLines] = useState<ReviewLine[]>([])
    const [processPhase, setProcessPhase] = useState<ProcessPhase>('reading')
    const [progress, setProgress] = useState(0)

    // Reset al abrir
    useEffect(() => {
        if (isOpen) {
            setStep('upload')
            setSelectedDocId(null)
            setDocType('po')
            setReviewLines([])
            setProcessPhase('reading')
            setProgress(0)
        }
    }, [isOpen])

    const startProcessing = (docId: string) => {
        setSelectedDocId(docId)
        setStep('processing')
        setProgress(0)

        const phases: { phase: ProcessPhase; duration: number; progressCheck: number }[] = [
            { phase: 'reading', duration: 500, progressCheck: 20 },
            { phase: 'extracting', duration: 600, progressCheck: 40 },
            { phase: 'matching', duration: 700, progressCheck: 60 },
            { phase: 'identifying', duration: 500, progressCheck: 80 },
            { phase: 'suggesting', duration: 500, progressCheck: 100 },
        ]

        let idx = 0
        const runPhase = () => {
            if (idx >= phases.length) {
                // Build review state from mock data
                const doc = getMockDoc(docId)
                if (doc) {
                    setReviewLines(doc.lines.map(line => ({
                        raw: line,
                        resolvedProductId: line.matchedProductId ?? null,
                        userResolution: line.matchStatus === 'matched' ? 'accept' : 'pending',
                    })))
                }
                setStep('review')
                return
            }
            const current = phases[idx]
            setProcessPhase(current.phase)
            const interval = setInterval(() => {
                setProgress(prev => prev >= current.progressCheck ? prev : prev + 1)
            }, current.duration / 20)
            setTimeout(() => {
                clearInterval(interval)
                setProgress(current.progressCheck)
                idx++
                runPhase()
            }, current.duration)
        }
        runPhase()
    }

    const updateLineResolution = (lineNumber: number, resolution: ReviewLine['userResolution'], productId?: string | null) => {
        setReviewLines(prev => prev.map(l =>
            l.raw.lineNumber === lineNumber
                ? { ...l, userResolution: resolution, resolvedProductId: productId !== undefined ? productId : l.resolvedProductId }
                : l
        ))
    }

    const acceptAllMatches = () => {
        setReviewLines(prev => prev.map(l =>
            (l.raw.matchStatus === 'matched' || l.raw.matchStatus === 'discrepancy') && l.resolvedProductId
                ? { ...l, userResolution: 'accept' }
                : l
        ))
    }

    const substituteAllNoMatches = () => {
        setReviewLines(prev => prev.map(l => {
            if (l.raw.matchStatus === 'no-match' && l.raw.substituteSuggestionIds?.[0]) {
                return { ...l, userResolution: 'substitute', resolvedProductId: l.raw.substituteSuggestionIds[0] }
            }
            return l
        }))
    }

    const skipSpecialOrders = () => {
        setReviewLines(prev => prev.map(l =>
            l.raw.matchStatus === 'special-order'
                ? { ...l, userResolution: 'skip', resolvedProductId: null }
                : l
        ))
    }

    const mappedCount = reviewLines.filter(l => l.userResolution !== 'pending').length
    const totalCount = reviewLines.length
    const pendingCount = totalCount - mappedCount
    const acceptedCount = reviewLines.filter(l => l.userResolution === 'accept' || l.userResolution === 'substitute').length

    const handleCreateDraft = () => {
        const doc = selectedDocId ? getMockDoc(selectedDocId) : undefined
        if (!doc) return
        const draft = createDraft({ source: 'ingest', sourceDocRef: doc.id, name: `Ingested · ${doc.id}` })

        // Construir QuoteLineItem para cada line accepted/substituted
        const items: Omit<QuoteLineItem, 'id' | 'addedAt'>[] = []
        for (const line of reviewLines) {
            if (line.userResolution !== 'accept' && line.userResolution !== 'substitute') continue
            if (!line.resolvedProductId) continue
            const product = findProductById(line.resolvedProductId)
            if (!product) continue
            const variants = getProductVariants(product)
            const colorway = product.colorways[0]
            const finishId = variants.finishes?.[0]?.id
            const fabricId = variants.fabricOptions?.find(f => f.type === 'standard')?.id
            const materialTierId = variants.materialTiers?.[0]?.id
            // P1.4.d.iv (2026-07-08) · resolve legacy fabricId to silver FinishValue for dual-write.
            const silverFabric = resolveLegacyFabricId(fabricId)
            const totals = computeLineItemTotals(product, {
                qty: line.raw.qty,
                colorwayCode: colorway?.code,
                finishId,
                fabricId,
                finishValueIds: silverFabric ? [silverFabric.id] : undefined,
                materialTierId,
            })
            const finish = variants.finishes?.find(f => f.id === finishId)
            const fabric = variants.fabricOptions?.find(f => f.id === fabricId)
            const tier = variants.materialTiers?.find(t => t.id === materialTierId)
            items.push({
                productId: product.id,
                productName: product.name,
                productBrand: product.brand,
                productImage: product.images[0],
                qty: line.raw.qty,
                colorwayCode: colorway?.code,
                colorwayName: colorway?.name,
                colorwayHex: colorway?.hex,
                finishId: finish?.id,
                finishName: finish?.name,
                fabricId: fabric?.id,
                fabricName: fabric?.name,
                fabricIsPremium: fabric?.type === 'special',
                materialTierId: tier?.id,
                materialTierName: tier?.name,
                unitPrice: totals.unitPrice,
                totalPrice: totals.totalPrice,
                leadTimeDays: totals.leadTimeDays,
                sourceDocRef: doc.id,
                // P1.4.d.iv · silver-canonical fabric selection.
                ...(silverFabric && {
                    finishValueIds: [silverFabric.id],
                    finishValueLabels: [`Fabric Finish: ${silverFabric.finishValueName}${silverFabric.price > 0 ? ` +${formatPrice(silverFabric.price, silverFabric.currencyId)}` : ''}`],
                    finishPriceModifier: silverFabric.price,
                }),
            })
        }
        if (items.length > 0) addItems(items, draft.id)
        onClose()
        onComplete?.(draft.id)
    }

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={step === 'processing' ? () => {} : onClose} className="relative z-50">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                            {/* Header */}
                            <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-6 py-3">
                                <Dialog.Title className="flex items-center gap-2 text-base font-bold text-foreground">
                                    <Sparkles className="h-5 w-5 text-foreground" />
                                    Upload Quote / PO / ACK
                                    <span className="ml-2 text-xs font-medium text-muted-foreground">· Strata maps it to your catalog</span>
                                </Dialog.Title>
                                {step !== 'processing' && (
                                    <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Close">
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </div>

                            {/* Step indicator */}
                            <div className="flex flex-shrink-0 items-center justify-center gap-2 border-b border-border bg-muted/30 px-6 py-2 text-xs">
                                <StepBadge label="Upload" active={step === 'upload'} done={step !== 'upload'} />
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                <StepBadge label="Processing" active={step === 'processing'} done={step === 'review' || step === 'confirm'} />
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                <StepBadge label="Review mapping" active={step === 'review'} done={step === 'confirm'} />
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                <StepBadge label="Confirm" active={step === 'confirm'} done={false} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                {step === 'upload' && (
                                    <UploadStep
                                        docType={docType}
                                        setDocType={setDocType}
                                        onSelectSample={startProcessing}
                                    />
                                )}
                                {step === 'processing' && (
                                    <ProcessingStep phase={processPhase} progress={progress} docId={selectedDocId} />
                                )}
                                {step === 'review' && selectedDocId && (
                                    <ReviewStep
                                        doc={getMockDoc(selectedDocId)!}
                                        reviewLines={reviewLines}
                                        onUpdateLine={updateLineResolution}
                                        onAcceptAll={acceptAllMatches}
                                        onSubstituteAll={substituteAllNoMatches}
                                        onSkipSpecial={skipSpecialOrders}
                                    />
                                )}
                                {step === 'confirm' && selectedDocId && (
                                    <ConfirmStep
                                        doc={getMockDoc(selectedDocId)!}
                                        reviewLines={reviewLines}
                                        acceptedCount={acceptedCount}
                                    />
                                )}
                            </div>

                            {/* Footer · contextual CTAs */}
                            {step === 'review' && (
                                <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-6 py-3">
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-bold text-foreground">{mappedCount}</span> of {totalCount} lines mapped
                                        {pendingCount > 0 && (
                                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                                {pendingCount} pending
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setStep('confirm')}
                                        disabled={acceptedCount === 0}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                                    >
                                        Continue to confirm
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                            {step === 'confirm' && (
                                <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-6 py-3">
                                    <button type="button" onClick={() => setStep('review')} className="text-sm text-muted-foreground hover:text-foreground">← Back to review</button>
                                    <button
                                        type="button"
                                        onClick={handleCreateDraft}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                                    >
                                        Create draft quote
                                        <ArrowUpRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}

/* ─── Step indicator ────────────────────────────────────────── */

function StepBadge({ label, active, done }: { label: string; active: boolean; done: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            active
                ? 'bg-primary text-primary-foreground'
                : done
                    ? 'text-foreground'
                    : 'text-muted-foreground/60'
        }`}>
            {done && <CheckCircle2 className="h-3 w-3" />}
            {label}
        </span>
    )
}

/* ─── Step 1 · Upload ────────────────────────────────────────── */

// Mapping docType → sample doc id que se simula al clickear la drop zone.
// Si user cambia docType y luego dropea, va al sample correspondiente.
const DOC_TYPE_SAMPLE: Record<DocType, string> = {
    po: 'PO-2026-AC-887',
    quote: 'Q-2026-MK-4421',
    ack: 'ACK-2026-AS-103',
}

function UploadStep({ docType, setDocType, onSelectSample }: {
    docType: DocType
    setDocType: (t: DocType) => void
    onSelectSample: (docId: string) => void
}) {
    const dropZoneSampleId = DOC_TYPE_SAMPLE[docType]
    const dropZoneSample = MOCK_INGEST_DOCS[dropZoneSampleId]
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-foreground">Upload a transaction document</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Strata reads your existing Quote, Purchase Order, or Acknowledgement and maps it line-by-line to your connected catalogs. Premium fabrics, special-orders, and substitutes are flagged for review.
                </p>
            </div>

            {/* Doc type · 3 button cards */}
            <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Document type</h3>
                <div className="grid grid-cols-3 gap-3">
                    <DocTypeCard label="Quote" value="quote" active={docType === 'quote'} onClick={() => setDocType('quote')} />
                    <DocTypeCard label="Purchase Order" value="po" active={docType === 'po'} onClick={() => setDocType('po')} />
                    <DocTypeCard label="Acknowledgement" value="ack" active={docType === 'ack'} onClick={() => setDocType('ack')} />
                </div>
            </div>

            {/* Drop zone · clickable · simula upload del sample correspondiente al docType activo */}
            <button
                type="button"
                onClick={() => onSelectSample(dropZoneSampleId)}
                className="group block w-full rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-all hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
                <Upload className="mx-auto h-10 w-10 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">Drop a {docType === 'ack' ? 'XML' : 'PDF, CSV, or XML'} here · or <span className="text-foreground underline decoration-dotted underline-offset-2">click to simulate</span></p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Click to simulate upload of <span className="font-mono font-bold text-foreground">{dropZoneSample.filename}</span> · {dropZoneSample.lines.length} lines · Strata will parse + map
                </p>
            </button>

            {/* Sample picker · alternativa explícita */}
            <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Or pick a specific sample document</h3>
                <div className="space-y-2">
                    {MOCK_DOC_IDS.map(id => {
                        const doc = MOCK_INGEST_DOCS[id]
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => onSelectSample(id)}
                                className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition-all hover:border-primary hover:bg-primary/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-foreground">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-mono text-sm font-bold text-foreground">{doc.id}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {docTypeLabel(doc.docType)} · {doc.lines.length} lines · est. {formatPrice(doc.estimatedTotal)}
                                        </div>
                                    </div>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function DocTypeCard({ label, active, onClick }: { label: string; value: DocType; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all ${
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background text-foreground hover:bg-muted/50'
            }`}
        >
            {label}
        </button>
    )
}

/* ─── Step 2 · Processing ────────────────────────────────── */

function ProcessingStep({ phase, progress, docId }: { phase: ProcessPhase; progress: number; docId: string | null }) {
    const info: Record<ProcessPhase, { label: string; detail: string }> = {
        reading: { label: 'Reading document', detail: 'Parsing pages and structure…' },
        extracting: { label: 'Extracting line items', detail: 'Identifying SKUs, descriptions, quantities…' },
        matching: { label: 'Matching against catalog', detail: 'Cross-referencing connected catalogs…' },
        identifying: { label: 'Identifying discrepancies', detail: 'Flagging variant mismatches and missing items…' },
        suggesting: { label: 'Suggesting substitutes', detail: 'Ranking alternatives by price · lead time · brand…' },
    }
    const current = info[phase]
    return (
        <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-xl shadow-primary/20">
                    <Sparkles className="h-8 w-8 animate-pulse text-foreground" />
                </div>
            </div>
            <h3 className="text-lg font-bold text-foreground">{current.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{current.detail}</p>
            {docId && <p className="mt-2 font-mono text-xs text-muted-foreground/70">{docId}</p>}

            {/* Progress bar */}
            <div className="mt-6 w-full max-w-sm">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{progress}% complete</div>
            </div>
        </div>
    )
}

/* ─── Step 3 · Review mapping table ──────────────────────── */

interface ReviewStepProps {
    doc: MockIngestedDoc
    reviewLines: ReviewLine[]
    onUpdateLine: (lineNumber: number, resolution: ReviewLine['userResolution'], productId?: string | null) => void
    onAcceptAll: () => void
    onSubstituteAll: () => void
    onSkipSpecial: () => void
}

function ReviewStep({ doc, reviewLines, onUpdateLine, onAcceptAll, onSubstituteAll, onSkipSpecial }: ReviewStepProps) {
    return (
        <div className="space-y-4">
            {/* Source banner */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-primary/5 px-4 py-3 text-sm">
                <FileText className="h-5 w-5 text-foreground" />
                <div className="flex-1">
                    <div className="font-mono text-sm font-bold text-foreground">{doc.filename}</div>
                    <div className="text-xs text-muted-foreground">
                        {docTypeLabel(doc.docType)} · {doc.vendor} · {doc.lines.length} lines extracted
                    </div>
                </div>
            </div>

            {/* Bulk actions toolbar */}
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onAcceptAll} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Accept all matches
                </button>
                <button type="button" onClick={onSubstituteAll} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                    <RefreshCw className="h-3.5 w-3.5" /> Apply Strata substitutes
                </button>
                <button type="button" onClick={onSkipSpecial} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                    <Ban className="h-3.5 w-3.5" /> Skip special-orders
                </button>
            </div>

            {/* Lines table */}
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {reviewLines.map(line => (
                    <ReviewLineRow key={line.raw.lineNumber} line={line} onUpdate={onUpdateLine} />
                ))}
            </ul>
        </div>
    )
}

function ReviewLineRow({ line, onUpdate }: { line: ReviewLine; onUpdate: ReviewStepProps['onUpdateLine'] }) {
    const product = line.resolvedProductId ? findProductById(line.resolvedProductId) : undefined
    const suggestions = line.raw.substituteSuggestionIds?.map(id => findProductById(id)).filter(Boolean) ?? []

    return (
        <li className={`flex items-start gap-3 p-3 ${
            line.userResolution === 'skip' ? 'bg-muted/30 opacity-60' : 'bg-card'
        }`}>
            {/* Line number + status icon */}
            <div className="flex flex-col items-center gap-1">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">#{line.raw.lineNumber}</span>
                <MatchStatusIcon status={line.raw.matchStatus} />
            </div>

            {/* Raw extracted info */}
            <div className="min-w-0 flex-1">
                <div className="text-xs font-mono text-muted-foreground">{line.raw.rawSku ?? '— no SKU —'}</div>
                <div className="text-sm font-semibold text-foreground">{line.raw.rawDescription}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">qty <span className="font-bold text-foreground">{line.raw.qty}</span></div>
            </div>

            {/* Right side · resolution */}
            <div className="flex w-72 flex-col gap-1.5">
                {line.raw.matchStatus === 'matched' && product && (
                    <ResolvedProductCard product={product} variant="matched" />
                )}
                {line.raw.matchStatus === 'discrepancy' && product && (
                    <>
                        <ResolvedProductCard product={product} variant="discrepancy" reason={line.raw.discrepancyReason} />
                    </>
                )}
                {line.raw.matchStatus === 'no-match' && (
                    <>
                        {line.resolvedProductId && product ? (
                            <ResolvedProductCard product={product} variant="substituted" />
                        ) : (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-foreground">
                                <div className="flex items-center gap-1 text-destructive font-semibold"><XCircle className="h-3 w-3" /> No match in catalog</div>
                                {suggestions.length > 0 && (
                                    <div className="mt-1.5 space-y-1">
                                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Strata suggests:</div>
                                        {suggestions.map(s => s && (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => onUpdate(line.raw.lineNumber, 'substitute', s.id)}
                                                className="block w-full rounded border border-border bg-card px-2 py-1 text-left text-xs text-foreground hover:border-primary hover:bg-primary/5"
                                            >
                                                ↻ Use <span className="font-bold">{s.name}</span> · {s.brand}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
                {line.raw.matchStatus === 'special-order' && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-foreground">
                        <div className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3 w-3" /> Special order item</div>
                        <p className="mt-0.5 text-muted-foreground">Cannot auto-match · skip or add manually after creation</p>
                    </div>
                )}

                {/* Resolution actions */}
                <div className="flex gap-1.5">
                    {line.userResolution === 'pending' && line.resolvedProductId && (
                        <button type="button" onClick={() => onUpdate(line.raw.lineNumber, 'accept')} className="inline-flex flex-1 items-center justify-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90">
                            <CheckCircle2 className="h-3 w-3" /> Use match
                        </button>
                    )}
                    {(line.userResolution === 'accept' || line.userResolution === 'substitute') && (
                        <span className="inline-flex flex-1 items-center justify-center gap-1 rounded bg-primary/15 px-2 py-1 text-[11px] font-bold text-foreground">
                            <CheckCircle2 className="h-3 w-3" /> {line.userResolution === 'substitute' ? 'Substituted' : 'Accepted'}
                        </span>
                    )}
                    <button type="button" onClick={() => onUpdate(line.raw.lineNumber, 'skip', null)} className="inline-flex items-center justify-center gap-1 rounded border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                        {line.userResolution === 'skip' ? '✓ Skipped' : 'Skip'}
                    </button>
                </div>
            </div>
        </li>
    )
}

function MatchStatusIcon({ status }: { status: MatchStatus }) {
    if (status === 'matched') return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    if (status === 'discrepancy') return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
    if (status === 'no-match') return <XCircle className="h-4 w-4 text-destructive" />
    return <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
}

function ResolvedProductCard({ product, variant, reason }: { product: NonNullable<ReturnType<typeof findProductById>>; variant: 'matched' | 'discrepancy' | 'substituted'; reason?: string }) {
    const bg = variant === 'matched' ? 'border-emerald-500/30 bg-emerald-500/5' : variant === 'discrepancy' ? 'border-amber-500/30 bg-amber-500/5' : 'border-primary/30 bg-primary/5'
    return (
        <div className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${bg}`}>
            <img src={product.images[0]} alt={product.name} className="h-8 w-8 flex-shrink-0 rounded object-cover" />
            <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-foreground">{product.name}</div>
                <div className="truncate text-[10px] text-muted-foreground">{product.brand}</div>
                {reason && <div className="mt-0.5 truncate text-[10px] text-amber-700 dark:text-amber-400" title={reason}>⚠ {reason}</div>}
            </div>
        </div>
    )
}

/* ─── Step 4 · Confirm ────────────────────────────────── */

function ConfirmStep({ doc, reviewLines, acceptedCount }: { doc: MockIngestedDoc; reviewLines: ReviewLine[]; acceptedCount: number }) {
    const skippedCount = reviewLines.filter(l => l.userResolution === 'skip').length
    const substitutedCount = reviewLines.filter(l => l.userResolution === 'substitute').length
    return (
        <div className="mx-auto max-w-md space-y-4 py-6 text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-foreground">
                <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-foreground">Ready to create draft quote</h2>
                <p className="mt-1 text-sm text-muted-foreground">From <span className="font-mono font-semibold text-foreground">{doc.id}</span></p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 text-left">
                <ul className="space-y-2 text-sm">
                    <SummaryRow icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Lines accepted" value={`${acceptedCount}`} />
                    {substitutedCount > 0 && <SummaryRow icon={<RefreshCw className="h-4 w-4 text-foreground" />} label="Substituted by Strata" value={`${substitutedCount}`} />}
                    {skippedCount > 0 && <SummaryRow icon={<Ban className="h-4 w-4 text-muted-foreground" />} label="Skipped" value={`${skippedCount}`} />}
                    <SummaryRow icon={<FileText className="h-4 w-4 text-foreground" />} label="Source doc" value={doc.id} mono />
                </ul>
            </div>

            <p className="text-xs text-muted-foreground">
                A new draft will appear at the top of <span className="font-semibold text-foreground">My Selection</span> with the source doc reference. You can edit any line variants from there.
            </p>
        </div>
    )
}

function SummaryRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
    return (
        <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">{icon}{label}</span>
            <span className={`font-bold text-foreground ${mono ? 'font-mono' : ''}`}>{value}</span>
        </li>
    )
}
