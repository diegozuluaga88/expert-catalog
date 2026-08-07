// F71b · Notification bell trigger (2026-08-07)
// F71b.1 refactor · alinea con el pattern visual del ActionCenter del DS:
// - Small red dot indicator (no badge con conteo · el conteo se ve dentro
//   del panel · misma decisión que el ActionCenter canonical)
// - Popover fixed centered top (95vw mobile · 600px lg) para acomodar el
//   panel más grande estilo Action Center
// - z-index alto para escapar del navbar sticky
//
// El click-outside/escape close se mantiene simple (sin HeadlessUI Popover
// para no acoplar el trigger al layout · el panel es responsivo por sí solo).

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from './useNotifications'
import NotificationsPanel from './NotificationsPanel'

export default function NotificationBell() {
    const { unreadCount } = useNotifications()
    const [open, setOpen] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (buttonRef.current?.contains(target)) return
            if (panelRef.current?.contains(target)) return
            setOpen(false)
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

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={unreadCount > 0 ? `Action center · ${unreadCount} unread` : 'Action center'}
                aria-expanded={open}
                className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                title="Action Center"
            >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background"
                        aria-hidden="true"
                    />
                )}
            </button>

            {open && (
                <>
                    {/* Backdrop · click cierra el panel (mobile-friendly).
                        Sin blur para no interferir con el resto del navbar. */}
                    <div
                        className="fixed inset-0 z-[79] bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-150"
                        aria-hidden="true"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        ref={panelRef}
                        className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[80] animate-in fade-in slide-in-from-top-2 duration-200"
                        role="dialog"
                        aria-label="Action Center"
                    >
                        <NotificationsPanel onClose={() => setOpen(false)} />
                    </div>
                </>
            )}
        </>
    )
}
