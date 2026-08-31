// F71b · Notifications hub (2026-08-07)
// ─────────────────────────────────────────────────
// Store persistente per-tenant en localStorage, sincronizado entre
// instancias del hook via CustomEvent (sin librería de state management).
//
// MRL scope cleanup (2026-08-27) · Capa 2d · este hub nació para surface
// los eventos shipped/delivered del sample flow. Sample Ordering se movió
// a Phase 2 (Decision Log NEW-7, repetido tres veces por Jeff) y el SOW v5
// §22 lo lista Out of Scope, así que el productor de eventos se retiró.
//
// El mecanismo se conserva porque el scope sí lo reclama para otra fuente:
// NEW-10 confirma "notifications when viewers access a shared project"
// como requisito del Project Tool. `pushNotification` es el punto de
// inyección que ese flujo va a usar.
//
// Hoy el hub queda sin productor · se llena cuando se construya el
// Project Tool (Etapa 6.6 del plan).
//
// Non-goals · browser Notification API real, push notifications,
// preferencias por tipo · scope prototype mock.

import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../../TenantContext'

export type NotificationKind = 'info'

export interface Notification {
    id: string
    kind: NotificationKind
    title: string
    body?: string
    /** Metadata útil para deep-link al recurso que originó la notificación. */
    requestId?: string
    productImage?: string
    createdAt: string
    read: boolean
}

const STORAGE_KEY = 'catalog-notifications-'
const READ_TS_KEY = 'catalog-notifications-read-ts-'
const MAX_NOTIFICATIONS = 50

export const NOTIFICATION_CHANGE_EVENT = 'catalog:notification-change'

interface NotificationChangeDetail {
    tenantSlug: string
}

function loadNotifications(tenantSlug: string): Notification[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY + tenantSlug)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed as Notification[]
    } catch {
        return []
    }
}

function saveNotifications(tenantSlug: string, notifs: Notification[]) {
    try {
        localStorage.setItem(STORAGE_KEY + tenantSlug, JSON.stringify(notifs))
    } catch { /* noop */ }
}

function generateId(): string {
    return `notif_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export interface UseNotificationsReturn {
    notifications: Notification[]
    unreadCount: number
    markRead: (id: string) => void
    markAllRead: () => void
    clearAll: () => void
    pushNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
}

export function useNotifications(): UseNotificationsReturn {
    const { currentTenant } = useTenant()
    const tenantSlug = (currentTenant as unknown as string) || 'default'

    const [notifications, setNotifications] = useState<Notification[]>(() => loadNotifications(tenantSlug))

    // Rehidrata al cambiar de tenant.
    useEffect(() => {
        setNotifications(loadNotifications(tenantSlug))
    }, [tenantSlug])

    // Sync entre instancias del hook via CustomEvent.
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<NotificationChangeDetail>).detail
            if (detail?.tenantSlug === tenantSlug) {
                setNotifications(loadNotifications(tenantSlug))
            }
        }
        window.addEventListener(NOTIFICATION_CHANGE_EVENT, handler)
        return () => window.removeEventListener(NOTIFICATION_CHANGE_EVENT, handler)
    }, [tenantSlug])

    // F72.3 · cross-tab sync via native storage event (fires on other tabs when
    // localStorage changes in this tab). Solo react a nuestro key del tenant
    // activo · el bell count se actualiza sin reload.
    useEffect(() => {
        const targetKey = STORAGE_KEY + tenantSlug
        const handler = (e: StorageEvent) => {
            if (e.key === targetKey) {
                setNotifications(loadNotifications(tenantSlug))
            }
        }
        window.addEventListener('storage', handler)
        return () => window.removeEventListener('storage', handler)
    }, [tenantSlug])

    const markRead = useCallback((id: string) => {
        const current = loadNotifications(tenantSlug)
        const next = current.map((n) => (n.id === id ? { ...n, read: true } : n))
        saveNotifications(tenantSlug, next)
        window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGE_EVENT, {
            detail: { tenantSlug },
        }))
    }, [tenantSlug])

    const markAllRead = useCallback(() => {
        const current = loadNotifications(tenantSlug)
        const next = current.map((n) => ({ ...n, read: true }))
        saveNotifications(tenantSlug, next)
        try {
            localStorage.setItem(READ_TS_KEY + tenantSlug, new Date().toISOString())
        } catch { /* noop */ }
        window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGE_EVENT, {
            detail: { tenantSlug },
        }))
    }, [tenantSlug])

    const clearAll = useCallback(() => {
        saveNotifications(tenantSlug, [])
        window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGE_EVENT, {
            detail: { tenantSlug },
        }))
    }, [tenantSlug])

    const pushNotification = useCallback((n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
        const current = loadNotifications(tenantSlug)
        const newNotif: Notification = {
            ...n,
            id: generateId(),
            createdAt: new Date().toISOString(),
            read: false,
        }
        const next = [newNotif, ...current].slice(0, MAX_NOTIFICATIONS)
        saveNotifications(tenantSlug, next)
        window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGE_EVENT, {
            detail: { tenantSlug },
        }))
    }, [tenantSlug])

    const unreadCount = notifications.filter((n) => !n.read).length

    return {
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        clearAll,
        pushNotification,
    }
}
