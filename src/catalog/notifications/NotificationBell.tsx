// F71b · Notification bell + badge (2026-08-07)
// ────────────────────────────────────────────────
// Drop-in reemplazo del Bell estático del Navbar. Muestra badge con conteo
// de unread + abre el NotificationsPanel en un popover click-outside-close.
//
// No usa HeadlessUI Menu porque el panel tiene su propia scroll area + focus
// interactivo (Read all, Clear all, list items) que se rompe con Menu.Item.
// Click-outside implementado con listener mousedown + ref.

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from './useNotifications'
import NotificationsPanel from './NotificationsPanel'

export default function NotificationBell() {
    const { unreadCount } = useNotifications()
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [open])

    const displayCount = unreadCount > 9 ? '9+' : String(unreadCount)

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={unreadCount > 0 ? `Notifications · ${unreadCount} unread` : 'Notifications'}
                aria-expanded={open}
                className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                title="Notifications"
            >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground border-2 border-background"
                        aria-hidden="true"
                    >
                        {displayCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full z-[80] mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <NotificationsPanel onClose={() => setOpen(false)} />
                </div>
            )}
        </div>
    )
}
