// Mock "transaction verification" database — mirrors catalogMock.ts but keyed by
// order / acknowledgment number. In a real build this would resolve whether the
// transaction is reconciled against the Orderbahn system of record. Used by
// TransactionVerifyPill to show a Verified check or a Sync action next to the
// order number. A mix of verified / unverified so the demo shows both states.

export interface TransactionStatus {
    verified: boolean
}

export const TRANSACTION_DB: Record<string, TransactionStatus> = {
    // Orders (recentOrders)
    '#ORD-2055': { verified: true },
    '#ORD-2054': { verified: false },
    '#ORD-2053': { verified: true },
    '#ORD-2051': { verified: false },
    '#ORD-2049': { verified: true },
    '#ORD-2048': { verified: false },
    // Acknowledgments (recentAcknowledgments)
    'Acknowledgement-8839': { verified: true },
    'Acknowledgement-8840': { verified: false },
    // Detail-page identifiers
    '#PO-1029': { verified: false },
    '#ORD-7829': { verified: false },
    '#ACK-3099': { verified: false },
    // OCR document ids (DocumentReviewModal) — reconciled docs are verified in
    // Orderbahn; pending / in-progress docs default to unverified (show Sync).
    'OCR-007': { verified: true },
    'OCR-008': { verified: true },
    'OCR-009': { verified: true },
    'OCR-010': { verified: true },
    'OCR-011': { verified: true },
}

/**
 * Lookup verification status for a transaction id. Unknown ids default to
 * verified=false so the Sync action is always available in the demo.
 */
export function getTransactionStatus(id: string): TransactionStatus {
    return TRANSACTION_DB[id] ?? { verified: false }
}
