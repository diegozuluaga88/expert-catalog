import { useState } from 'react'
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react'
import { getTransactionStatus } from './ocr/transactionMock'

interface TransactionVerifyPillProps {
    /** Order / acknowledgment number, e.g. "#ORD-2055" or "Acknowledgement-8839". */
    orderId: string
    /** Dense mode for cards/list rows: verified renders as an icon only. */
    compact?: boolean
}

type VerifyState = 'verified' | 'unverified' | 'syncing'

/**
 * Transaction-level verification indicator — the order/ACK counterpart to the
 * line-item CatalogVerifyPill. Shows a Verified check when the transaction is
 * reconciled against Orderbahn, or a Sync button that simulates synchronizing it
 * (→ verified). Sync stops propagation so it doesn't open the card/row detail.
 */
export default function TransactionVerifyPill({ orderId, compact }: TransactionVerifyPillProps) {
    const [state, setState] = useState<VerifyState>(
        getTransactionStatus(orderId).verified ? 'verified' : 'unverified'
    )

    const handleSync = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setState('syncing')
        // Simulated Orderbahn sync — real impl would call the reconcile endpoint.
        setTimeout(() => setState('verified'), 1200)
    }

    if (state === 'verified') {
        if (compact) {
            return (
                <CheckCircle2
                    className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0"
                    aria-label="Verified in Orderbahn"
                />
            )
        }
        return (
            <span
                title="Verified in Orderbahn"
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 whitespace-nowrap"
            >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified
            </span>
        )
    }

    if (state === 'syncing') {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground whitespace-nowrap">
                <Loader2 className="h-3 w-3 animate-spin" />
                Syncing…
            </span>
        )
    }

    return (
        <button
            onClick={handleSync}
            title="Sync this transaction with Orderbahn"
            aria-label="Sync transaction with Orderbahn"
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:brightness-95 transition-all shadow-sm whitespace-nowrap"
        >
            <Sparkles className="h-3 w-3" />
            Sync
        </button>
    )
}
