// F64 · TabIntroBanner (2026-08-06)
// Banner sutil al top del tab que explica la distinción del 2-tab strategy:
//   - Library · legacy · discovery + sample + Binders (alinea PRD literal)
//   - Products · Strata Preview · superset con spec + quote + admin rules
//
// UX · dismissible per-session (localStorage flag) para no molestar en uso
// repetido. Aparece 1a vez que el user entra al tab en la session · click X
// esconde permanentemente hasta que abra el browser de nuevo.
//
// Alinea con el user's decision de "dismissible per-session · once per session"
// del F64 approval.

import { useState, useEffect } from 'react'
import { X, LibraryBig } from 'lucide-react'

type BannerVariant = 'library'

interface TabIntroBannerProps {
    variant: BannerVariant
}

/** Storage key per-variant · per-session flag para dismiss.
 *  sessionStorage (no localStorage) porque queremos que reaparezca al
 *  próximo browser session · demo-friendly, no permanente. */
const STORAGE_KEY = (v: BannerVariant) => `tab-intro-banner-dismissed-${v}`

// MRL scope cleanup (2026-08-27) · la variante 'products' salió con su tab.
// La de library mencionaba sample requests, que se movieron a Phase 2
// (Decision Log NEW-7 · SOW §22), y "favorites", que es vocabulario nuestro.
const COPY: Record<BannerVariant, { title: string; body: string; Icon: typeof LibraryBig }> = {
    library: {
        title: 'The MRL you know · modernized',
        body: 'Browse manufacturer binders and drill into their products. Keep the brands you work with in your Custom Library via the ♥ on any binder.',
        Icon: LibraryBig,
    },
}

export default function TabIntroBanner({ variant }: TabIntroBannerProps) {
    // Init from sessionStorage · SSR-safe check.
    const [dismissed, setDismissed] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true
        try {
            return window.sessionStorage.getItem(STORAGE_KEY(variant)) === '1'
        } catch { return false }
    })

    // Re-check on variant change · aparece fresh cuando el user cambia de tab
    // por primera vez en la session.
    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            const isDismissed = window.sessionStorage.getItem(STORAGE_KEY(variant)) === '1'
            setDismissed(isDismissed)
        } catch { /* noop */ }
    }, [variant])

    const handleDismiss = () => {
        setDismissed(true)
        try { window.sessionStorage.setItem(STORAGE_KEY(variant), '1') } catch { /* noop */ }
    }

    if (dismissed) return null

    const { title, body, Icon } = COPY[variant]

    return (
        <div
            role="note"
            aria-label={`${variant} tab introduction`}
            className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 mb-4"
        >
            <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-card border border-border">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{body}</p>
            </div>
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss introduction"
                title="Dismiss · won't show again this session"
                className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}
