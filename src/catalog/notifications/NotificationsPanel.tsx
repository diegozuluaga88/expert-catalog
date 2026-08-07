// F71b · Action Center panel (2026-08-07)
// F71b.1 refactor (2026-08-07) · adopta el pattern visual del componente
// ActionCenter del Strata DS (packages/strata-ds/.../notifications/ActionCenter.tsx)
// para no duplicar el paradigma de notificaciones que ya existe en el system.
// ─────────────────────────────────────────────────────────────────────
// Diferencias con la versión DS canonical:
// - Usa lucide icons (standard del expert-catalog) en vez de @heroicons
// - Notificaciones vienen del hook local useNotifications (per-tenant en
//   localStorage + bridge con SAMPLE_STATUS_CHANGE_EVENT), no de mockNotifications
//   estático del DS package
// - Filter tabs reducidos a los kinds que este proyecto emite hoy
//   (All + Delivery + Info) · el pattern permite agregar más sin refactor
//
// Skills · Refactoring UI (hierarchy · header/tabs/list/footer) + Nielsen
// H2 (Match system to real world · Action Center es vocab que el user ya
// reconoce del DS).

import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import {
    Search as SearchIcon,
    X as XIcon,
    LayoutGrid,
    Truck,
    Package,
    Info as InfoIcon,
    Bell as BellIcon,
    ArrowRight,
    CheckCheck,
    Trash2,
} from 'lucide-react'
import { useNotifications, type Notification } from './useNotifications'

export const NOTIFICATION_CLICK_EVENT = 'catalog:notification-click'

export interface NotificationClickDetail {
    notification: Notification
}

interface FilterTab {
    id: string
    label: string
    icon: React.ElementType
    colorTheme: {
        activeBg: string
        activeText: string
        activeBorder: string
        badgeBg: string
        badgeText: string
    }
    filter: (n: Notification) => boolean
}

interface NotificationsPanelProps {
    onClose?: () => void
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
    const { notifications, markRead, markAllRead, clearAll } = useNotifications()
    const [activeTab, setActiveTab] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)

    const tabs: FilterTab[] = [
        {
            id: 'all',
            label: 'All',
            icon: LayoutGrid,
            colorTheme: {
                activeBg: 'bg-zinc-800 dark:bg-white/10',
                activeText: 'text-white',
                activeBorder: 'border-white/10',
                badgeBg: 'bg-white/20',
                badgeText: 'text-white',
            },
            filter: () => true,
        },
        {
            id: 'delivery',
            label: 'Delivery',
            icon: Truck,
            colorTheme: {
                activeBg: 'bg-emerald-500/15',
                activeText: 'text-emerald-600 dark:text-emerald-400',
                activeBorder: 'border-emerald-500/20',
                badgeBg: 'bg-emerald-500/20',
                badgeText: 'text-emerald-600 dark:text-emerald-400',
            },
            filter: (n) => n.kind === 'sample-shipped' || n.kind === 'sample-delivered',
        },
        {
            id: 'info',
            label: 'Info',
            icon: InfoIcon,
            colorTheme: {
                activeBg: 'bg-blue-500/15',
                activeText: 'text-blue-600 dark:text-blue-400',
                activeBorder: 'border-blue-500/20',
                badgeBg: 'bg-blue-500/20',
                badgeText: 'text-blue-600 dark:text-blue-400',
            },
            filter: (n) => n.kind === 'info',
        },
    ]

    const filtered = useMemo(() => {
        const currentTab = tabs.find((t) => t.id === activeTab)
        const q = searchQuery.toLowerCase()
        return notifications
            .filter((n) => currentTab?.filter(n))
            .filter((n) =>
                q === '' ||
                n.title.toLowerCase().includes(q) ||
                (n.body ?? '').toLowerCase().includes(q),
            )
    }, [notifications, activeTab, searchQuery])

    const isEmpty = notifications.length === 0
    const unreadTotal = notifications.filter((n) => !n.read).length

    const handleClick = (n: Notification) => {
        if (!n.read) markRead(n.id)
        window.dispatchEvent(new CustomEvent<NotificationClickDetail>(
            NOTIFICATION_CLICK_EVENT,
            { detail: { notification: n } },
        ))
        onClose?.()
    }

    return (
        <div className="w-[95vw] lg:w-[600px] max-h-[80vh] rounded-3xl overflow-hidden flex flex-col bg-zinc-100 dark:bg-zinc-900/85 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Action Center</h3>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={markAllRead}
                            disabled={isEmpty}
                            title="Mark all as read"
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Read all
                        </button>
                        <button
                            type="button"
                            onClick={clearAll}
                            disabled={isEmpty}
                            title="Clear all"
                            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setSearchOpen((v) => !v)}
                            title="Search"
                            aria-pressed={searchOpen}
                            className={clsx(
                                'p-1.5 rounded-full transition-colors',
                                searchOpen
                                    ? 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10',
                            )}
                        >
                            <SearchIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            title="Close"
                            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        >
                            <XIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {/* Search input (collapsible) */}
                {searchOpen && (
                    <div className="mb-3 flex items-center gap-2 rounded-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 px-3 py-1.5">
                        <SearchIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search notifications..."
                            autoFocus
                            className="flex-1 bg-transparent text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Clear search"
                            >
                                <XIcon className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Filter tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const count = notifications.filter((n) => tab.filter(n) && !n.read).length
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
                                    isActive
                                        ? `${tab.colorTheme.activeBg} ${tab.colorTheme.activeText} ${tab.colorTheme.activeBorder}`
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-200',
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>{tab.label}</span>
                                {count > 0 && (
                                    <span className={clsx(
                                        'inline-flex items-center justify-center rounded-full px-1.5 min-w-[18px] h-[18px] text-[10px] font-bold',
                                        isActive ? tab.colorTheme.badgeBg + ' ' + tab.colorTheme.badgeText : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300',
                                    )}>
                                        {count > 9 ? '9+' : count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 pb-4 space-y-2 scrollbar-minimal">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400">
                        <BellIcon className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {isEmpty ? 'No notifications yet' : 'No matches in this filter'}
                        </p>
                        <p className="text-xs mt-1">
                            {isEmpty ? "You're all caught up!" : 'Try another tab or clear the search.'}
                        </p>
                    </div>
                ) : (
                    filtered.map((n) => (
                        <NotificationRow key={n.id} notification={n} onOpen={() => handleClick(n)} />
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/20 backdrop-blur-md flex items-center justify-between shrink-0">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {filtered.length} {filtered.length === 1 ? 'action' : 'actions'}
                </p>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {unreadTotal > 0 ? (
                        <span className="inline-flex items-center gap-1.5 font-bold text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            {unreadTotal} unread
                        </span>
                    ) : (
                        <span>Mock data · delivery events sync from carrier in prod</span>
                    )}
                </p>
            </div>
        </div>
    )
}

/* ─── Notification row ─────────────────────────────────────────── */

interface NotificationRowProps {
    notification: Notification
    onOpen: () => void
}

function NotificationRow({ notification: n, onOpen }: NotificationRowProps) {
    const badge = kindBadge(n.kind)
    return (
        <div
            className={clsx(
                'group relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer',
                !n.read
                    ? 'bg-white dark:bg-zinc-800 border-transparent hover:border-black/10 dark:hover:border-white/10 hover:shadow-md'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-transparent hover:border-black/10 dark:hover:border-white/10',
            )}
            onClick={onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
        >
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={clsx(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                            badge.classes,
                        )}>
                            <badge.Icon className="w-3 h-3" aria-hidden="true" />
                            {badge.label}
                        </span>
                        {!n.read && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                                New
                            </span>
                        )}
                    </div>
                    <h4 className={clsx(
                        'text-sm text-gray-900 dark:text-white truncate',
                        !n.read ? 'font-semibold' : 'font-medium',
                    )}>
                        {n.title}
                    </h4>
                    {n.body && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                            {n.body}
                        </p>
                    )}
                    <div className="mt-1.5 text-[10px] flex items-center gap-2 text-gray-400 dark:text-gray-500 font-mono">
                        {n.requestId && <><span>#{n.requestId.slice(-6).toUpperCase()}</span><span>•</span></>}
                        <span>{formatRelative(n.createdAt)}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpen() }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                >
                    View
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </button>
            </div>

            {!n.read && (
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary" aria-hidden="true" />
            )}
        </div>
    )
}

/* ─── Kind badge mapping ───────────────────────────────────────── */

function kindBadge(kind: Notification['kind']): { label: string; classes: string; Icon: React.ElementType } {
    if (kind === 'sample-shipped') {
        return {
            label: 'Shipped',
            classes: 'text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400',
            Icon: Truck,
        }
    }
    if (kind === 'sample-delivered') {
        return {
            label: 'Delivered',
            classes: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400',
            Icon: Package,
        }
    }
    return {
        label: 'Info',
        classes: 'text-gray-600 bg-gray-500/10 border-gray-500/20 dark:text-gray-400',
        Icon: InfoIcon,
    }
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
