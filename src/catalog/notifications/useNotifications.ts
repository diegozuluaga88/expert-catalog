// F71b · Delivery notifications hub (2026-08-07)
// ─────────────────────────────────────────────────
// PRD P5 · Section 05 · el "10% restante" del sample flow · surface los
// eventos de shipped/delivered de forma persistente y clickeable (no solo
// toast one-shot). Este store vive en localStorage per-tenant y se sincroniza
// entre múltiples instancias del hook via CustomEvent (mismo patrón que
// useSampleRequests · sin librería de state management extra).
//
// Fuente de eventos · el hook escucha SAMPLE_STATUS_CHANGE_EVENT del
// useSampleRequests y crea una notificación por cada transición shipped
// o delivered. También expone `pushNotification` para que otros flows
// (ej. quote submitted, project shared) puedan inyectar sus propios eventos.
//
// Non-goals · browser Notification API real, push notifications,
// notification preferences per-type · scope prototype mock.

import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../../TenantContext'
import {
    SAMPLE_STATUS_CHANGE_EVENT,
    type SampleStatusChangeDetail,
} from '../browse/useSampleRequests'

export type NotificationKind = 'sample-shipped' | 'sample-delivered' | 'info'

export interface Notification {
    id: string
    kind: NotificationKind
    title: string
    body?: string
    /** Metadata útil para deep-link (ej. abrir el SampleTrackingSlideOver
     *  con scroll al request específico). */
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

/** Convierte un SampleStatusChangeDetail en una Notification. */
function notifFromSampleChange(detail: SampleStatusChangeDetail): Notification | null {
    const { request, previousStatus } = detail
    if (request.status === 'shipped' && previousStatus === 'pending') {
        const tracking = request.carrierTracking ? ` · tracking ${request.carrierTracking}` : ''
        return {
            id: generateId(),
            kind: 'sample-shipped',
            title: `Sample shipped · ${request.productName}`,
            body: `${request.productBrand ?? ''}${tracking}`,
            requestId: request.id,
            productImage: request.productImage,
            createdAt: new Date().toISOString(),
            read: false,
        }
    }
    if (request.status === 'delivered' && previousStatus === 'shipped') {
        const addr = request.shipTo?.line1
            ? ` at ${request.shipTo.line1}`
            : ''
        return {
            id: generateId(),
            kind: 'sample-delivered',
            title: `Sample delivered · ${request.productName}`,
            body: `${request.productBrand ?? ''}${addr}`,
            requestId: request.id,
            productImage: request.productImage,
            createdAt: new Date().toISOString(),
            read: false,
        }
    }
    return null
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

    // Sync entre instancias · el pub/sub imita el patrón de useSampleRequests.
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

    // Bridge · escucha SAMPLE_STATUS_CHANGE_EVENT y crea notifications.
    // Solo la primera instancia montada crea las notifs · las demás sincronizan
    // via NOTIFICATION_CHANGE_EVENT. Sin lock global · si dos instancias corren
    // el mismo bridge simultáneamente, ambas pushean; pero dedupemos por
    // requestId+kind en un rango corto (last 3s) para evitar el duplicado.
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<SampleStatusChangeDetail>).detail
            if (!detail || detail.tenantSlug !== tenantSlug) return
            const newNotif = notifFromSampleChange(detail)
            if (!newNotif) return

            const current = loadNotifications(tenantSlug)
            // Dedup · si ya existe una notif del mismo kind + requestId en los
            // últimos 3s, no la volvemos a crear (protege contra el race entre
            // instancias del hook · patrón usado también en useSampleRequests).
            const threeSecondsAgo = Date.now() - 3000
            const isDup = current.some((n) => {
                if (n.kind !== newNotif.kind || n.requestId !== newNotif.requestId) return false
                return new Date(n.createdAt).getTime() > threeSecondsAgo
            })
            if (isDup) return

            const next = [newNotif, ...current].slice(0, MAX_NOTIFICATIONS)
            saveNotifications(tenantSlug, next)
            window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGE_EVENT, {
                detail: { tenantSlug },
            }))
        }
        window.addEventListener(SAMPLE_STATUS_CHANGE_EVENT, handler)
        return () => window.removeEventListener(SAMPLE_STATUS_CHANGE_EVENT, handler)
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
