// F71b · Notifications dropdown panel (2026-08-07)
// ───────────────────────────────────────────────────
// Panel scrollable con la lista de notificaciones agrupadas por bucket
// temporal (Today · Yesterday · Earlier). Al click una notif se marca
// como read + se despacha un CustomEvent para que el consumer (ej. la
// tab activa) abra el SampleTrackingSlideOver con scroll al request.
//
// Skills · Nielsen H1 (Visibility of system status) + Refactoring UI
// Hierarchy (buckets temporales) + a11y (aria-live pending, focus trap
// via HeadlessUI Menu).

import { CheckCheck, Trash2, Package, Truck, Info, Bell as BellIcon } from 'lucide-react'
import { useNotifications, type Notification } from './useNotifications'

export const NOTIFICATION_CLICK_EVENT = 'catalog:notification-click'

export interface NotificationClickDetail {
    notification: Notification
}

interface NotificationsPanelProps {
    /** Cuando el user click en una notif · el consumer decide cómo abrir el
     *  slide-over (típicamente CatalogPageV2 escucha NOTIFICATION_CLICK_EVENT
     *  y despacha el open del SampleTrackingSlideOver). */
    onClose?: () => void
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
    const { notifications, markRead, markAllRead, clearAll } = useNotifications()

    const buckets = groupByBucket(notifications)
    const isEmpty = notifications.length === 0

    const handleClick = (n: Notification) => {
        if (!n.read) markRead(n.id)
        window.dispatchEvent(new CustomEvent<NotificationClickDetail>(
            NOTIFICATION_CLICK_EVENT,
            { detail: { notification: n } },
        ))
        onClose?.()
    }

    return (
        <div className="w-[360px] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={markAllRead}
                        disabled={isEmpty}
                        title="Mark all as read"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        Read all
                    </button>
                    <button
                        type="button"
                        onClick={clearAll}
                        disabled={isEmpty}
                        title="Clear all"
                        className="inline-flex items-center rounded-md px-1.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                        <BellIcon className="h-6 w-6 text-muted-foreground/50" aria-hidden="true" />
                        <p className="text-[13px] font-semibold text-foreground">You're all caught up</p>
                        <p className="text-[11px] text-muted-foreground max-w-[240px]">
                            Delivery events and important updates will show up here.
                        </p>
                    </div>
                ) : (
                    buckets.map((bucket) => (
                        <div key={bucket.label}>
                            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                                {bucket.label}
                            </div>
                            <ul>
                                {bucket.items.map((n) => (
                                    <li key={n.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleClick(n)}
                                            className={`group flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/40 last:border-b-0 ${!n.read ? 'bg-primary/[0.04]' : ''}`}
                                        >
                                            <NotificationIcon kind={n.kind} />
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-[12px] leading-snug text-foreground ${!n.read ? 'font-semibold' : 'font-medium'}`}>
                                                    {n.title}
                                                </p>
                                                {n.body && (
                                                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 truncate">
                                                        {n.body}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-muted-foreground/80 mt-1">
                                                    {formatRelative(n.createdAt)}
                                                </p>
                                            </div>
                                            {!n.read && (
                                                <span
                                                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                                                    aria-label="Unread"
                                                />
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>

            {/* Footer · disclaimer del prototype */}
            <div className="border-t border-border bg-muted/30 px-4 py-2">
                <p className="text-[10px] text-muted-foreground leading-snug">
                    Mock notifications · in production, delivery events sync from carrier webhooks.
                </p>
            </div>
        </div>
    )
}

/* ─── Icon per notification kind ───────────────────────────────── */

function NotificationIcon({ kind }: { kind: Notification['kind'] }) {
    if (kind === 'sample-shipped') {
        return (
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400">
                <Truck className="h-4 w-4" aria-hidden="true" />
            </span>
        )
    }
    if (kind === 'sample-delivered') {
        return (
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <Package className="h-4 w-4" aria-hidden="true" />
            </span>
        )
    }
    return (
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Info className="h-4 w-4" aria-hidden="true" />
        </span>
    )
}

/* ─── Bucket grouping ──────────────────────────────────────────── */

interface Bucket {
    label: string
    items: Notification[]
}

function groupByBucket(notifs: Notification[]): Bucket[] {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000
    const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000

    const today: Notification[] = []
    const yesterday: Notification[] = []
    const week: Notification[] = []
    const earlier: Notification[] = []

    for (const n of notifs) {
        const ts = new Date(n.createdAt).getTime()
        if (ts >= startOfToday) today.push(n)
        else if (ts >= startOfYesterday) yesterday.push(n)
        else if (ts >= startOfWeek) week.push(n)
        else earlier.push(n)
    }

    const out: Bucket[] = []
    if (today.length > 0) out.push({ label: 'Today', items: today })
    if (yesterday.length > 0) out.push({ label: 'Yesterday', items: yesterday })
    if (week.length > 0) out.push({ label: 'This week', items: week })
    if (earlier.length > 0) out.push({ label: 'Earlier', items: earlier })
    return out
}

/* ─── Relative time formatter ──────────────────────────────────── */

function formatRelative(iso: string): string {
    const then = new Date(iso).getTime()
    const now = Date.now()
    const diffSec = Math.floor((now - then) / 1000)
    if (diffSec < 60) return 'just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} min ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return `${diffDay}d ago`
    return new Date(iso).toLocaleDateString()
}
