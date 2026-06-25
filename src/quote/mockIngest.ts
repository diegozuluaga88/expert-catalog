// Phase 5 Fix #14 — Mock data + helpers para el doc ingest flow.
// 3 sample docs (Quote/PO/ACK) con line items pre-mapeados a la catalog database.
// Cada line indica explícitamente su match status para evitar el costo de
// implementar matching real (esto es una demo · OCR + fuzzy match son out of
// scope para iter 1).

export type DocType = 'quote' | 'po' | 'ack'

export type MatchStatus = 'matched' | 'discrepancy' | 'no-match' | 'special-order'

export interface MockExtractedLine {
    lineNumber: number
    rawDescription: string
    rawSku: string | null
    qty: number
    /** Resultado pre-computado del matching para demo · Strata "AI" lo determinó */
    matchStatus: MatchStatus
    /** Product ID al que matchea (UNIFIED_PRODUCTS id format · ej. allsteel__acuity).
     *  Set cuando matchStatus === 'matched' o 'discrepancy'. */
    matchedProductId?: string
    /** Razón del discrepancy · "SKU mismatch", "Variant unavailable", etc. */
    discrepancyReason?: string
    /** Product IDs de sugerencias cuando no match · max 3 */
    substituteSuggestionIds?: string[]
}

export interface MockIngestedDoc {
    id: string
    filename: string
    docType: DocType
    vendor: string
    /** Total monetario estimado por el doc fuente (para banner copy) */
    estimatedTotal: number
    lines: MockExtractedLine[]
}

const PO_AC_887: MockIngestedDoc = {
    id: 'PO-2026-AC-887',
    filename: 'PO-2026-AC-887.pdf',
    docType: 'po',
    vendor: 'Allsteel · Procurement',
    estimatedTotal: 28420,
    lines: [
        {
            lineNumber: 1,
            rawDescription: 'Acuity Task Chair · Black mesh · 4D adjustable',
            rawSku: 'ALS-AC-001',
            qty: 12,
            matchStatus: 'matched',
            matchedProductId: 'allsteel__acuity',
        },
        {
            lineNumber: 2,
            rawDescription: 'Calibrate Systems Casegoods · Natural maple',
            rawSku: 'AIS-CL-7',
            qty: 4,
            matchStatus: 'discrepancy',
            matchedProductId: 'ais__calibrate',
            discrepancyReason: 'SKU mismatch · catalog has AIS-CLB-007',
        },
        {
            lineNumber: 3,
            rawDescription: 'Axyl Stacking Chair · Yellow upholstery',
            rawSku: 'ALR-AX-Y2',
            qty: 6,
            matchStatus: 'matched',
            matchedProductId: 'allermuir__axyl',
        },
        {
            lineNumber: 4,
            rawDescription: 'Legacy Bastille Antique Series',
            rawSku: 'ALR-BAS-LX',
            qty: 2,
            matchStatus: 'no-match',
            substituteSuggestionIds: ['allermuir__famiglia', 'allsteel__acuity'],
        },
        {
            lineNumber: 5,
            rawDescription: 'Famiglia Lounge · 3-seater',
            rawSku: 'ALR-FAM-3S',
            qty: 3,
            matchStatus: 'matched',
            matchedProductId: 'allermuir__famiglia',
        },
        {
            lineNumber: 6,
            rawDescription: 'COM panel · client-supplied fabric',
            rawSku: null,
            qty: 1,
            matchStatus: 'special-order',
        },
        {
            lineNumber: 7,
            rawDescription: 'Kite Sofa · 2-seat configurable',
            rawSku: 'ALR-KS-02',
            qty: 2,
            matchStatus: 'matched',
            matchedProductId: 'allermuir__kite-sofa',
        },
        {
            lineNumber: 8,
            rawDescription: 'Hive Ottoman · Sage tone',
            rawSku: 'ALR-HO-SG',
            qty: 4,
            matchStatus: 'discrepancy',
            matchedProductId: 'allermuir__hive-ottoman',
            discrepancyReason: 'Product flagged as Discontinued · sub recommended',
        },
    ],
}

const Q_MK_4421: MockIngestedDoc = {
    id: 'Q-2026-MK-4421',
    filename: 'Q-2026-MK-4421.pdf',
    docType: 'quote',
    vendor: 'Miller Knoll Quote Generator',
    estimatedTotal: 14250,
    lines: [
        {
            lineNumber: 1,
            rawDescription: 'Acuity Mid-back · grade B fabric',
            rawSku: 'ALS-AC-MB-B',
            qty: 8,
            matchStatus: 'matched',
            matchedProductId: 'allsteel__acuity',
        },
        {
            lineNumber: 2,
            rawDescription: 'Calibrate Pedestal · Walnut finish',
            rawSku: 'AIS-CL-WN',
            qty: 4,
            matchStatus: 'matched',
            matchedProductId: 'ais__calibrate',
        },
        {
            lineNumber: 3,
            rawDescription: 'Generic Visitor Chair Series 200',
            rawSku: 'GEN-VC-200',
            qty: 6,
            matchStatus: 'no-match',
            substituteSuggestionIds: ['allsteel__acuity', 'ais__calibrate'],
        },
        {
            lineNumber: 4,
            rawDescription: 'Kite Sofa · 3-seat · navy',
            rawSku: 'ALR-KS-03N',
            qty: 1,
            matchStatus: 'matched',
            matchedProductId: 'allermuir__kite-sofa',
        },
        {
            lineNumber: 5,
            rawDescription: 'Famiglia Modular Lounge',
            rawSku: null,
            qty: 2,
            matchStatus: 'discrepancy',
            matchedProductId: 'allermuir__famiglia',
            discrepancyReason: 'No SKU in source doc · matched by name',
        },
    ],
}

const ACK_AS_103: MockIngestedDoc = {
    id: 'ACK-2026-AS-103',
    filename: 'ACK-2026-AS-103.xml',
    docType: 'ack',
    vendor: 'Allsteel ACK Service',
    estimatedTotal: 9870,
    lines: [
        {
            lineNumber: 1,
            rawDescription: 'Acuity Task · approved with sub',
            rawSku: 'ALS-AC-S',
            qty: 10,
            matchStatus: 'matched',
            matchedProductId: 'allsteel__acuity',
        },
        {
            lineNumber: 2,
            rawDescription: 'Axyl Stacking · partial fulfillment',
            rawSku: 'ALR-AX-PF',
            qty: 6,
            matchStatus: 'discrepancy',
            matchedProductId: 'allermuir__axyl',
            discrepancyReason: 'ACK shows 6 of 10 confirmed · 4 backorder',
        },
        {
            lineNumber: 3,
            rawDescription: 'Hive Ottoman · 2 units',
            rawSku: 'ALR-HO',
            qty: 2,
            matchStatus: 'discrepancy',
            matchedProductId: 'allermuir__hive-ottoman',
            discrepancyReason: 'Product is now discontinued · sub recommended',
        },
    ],
}

export const MOCK_INGEST_DOCS: Record<string, MockIngestedDoc> = {
    'PO-2026-AC-887': PO_AC_887,
    'Q-2026-MK-4421': Q_MK_4421,
    'ACK-2026-AS-103': ACK_AS_103,
}

export const MOCK_DOC_IDS = Object.keys(MOCK_INGEST_DOCS)

export function getMockDoc(id: string): MockIngestedDoc | undefined {
    return MOCK_INGEST_DOCS[id]
}

/** Genera un docType readable para label · "Purchase Order" / "Quote" / "Acknowledgement" */
export function docTypeLabel(t: DocType): string {
    if (t === 'po') return 'Purchase Order'
    if (t === 'quote') return 'Quote'
    return 'Acknowledgement'
}
