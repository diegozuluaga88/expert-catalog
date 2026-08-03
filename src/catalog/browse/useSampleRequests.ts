// F50 · Wave 4 · v2 · hook de solicitudes de muestra (swatches).
//
// Este hook maneja las solicitudes de muestra que hace el dealer al
// fabricante. Es v2-only (la versión actual no tiene UI para esto). Persiste
// por-tenant en localStorage, igual que el patrón de borradores del contexto
// de cotizaciones.
//
// Data model · una solicitud tiene:
//   · producto solicitado (material · id + name + brand + image + swatch)
//   · dirección de envío al momento del pedido
//   · status ('pending' → 'shipped' → 'delivered')
//   · timestamps de cada transición
//   · carrier tracking opcional (llega cuando el swatch se despacha)
//
// Nota · el backend real que recibiría estas requests todavía no existe.
// Por ahora las solicitudes se guardan localmente y son inspeccionables
// desde la vista de tracking. Cuando exista backend, el createRequest
// llamará al endpoint apropiado y los estados llegarán vía polling o
// notificaciones push.

import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../../TenantContext'

export interface SampleRequestShipTo {
    line1: string
    city: string
    state: string
    zip: string
}

export type SampleRequestStatus = 'pending' | 'shipped' | 'delivered'

export interface SampleRequest {
    id: string
    productId: string
    productName: string
    productBrand?: string
    productImage: string
    colorwayName?: string
    colorwayHex?: string
    shipTo: SampleRequestShipTo
    status: SampleRequestStatus
    requestedAt: string
    shippedAt?: string
    deliveredAt?: string
    carrierTracking?: string
}

const STORAGE_KEY_PREFIX = 'catalog-sample-requests-'

function loadRequests(tenantSlug: string): SampleRequest[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + tenantSlug)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed as SampleRequest[]
    } catch {
        return []
    }
}

function saveRequests(tenantSlug: string, requests: SampleRequest[]) {
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug, JSON.stringify(requests))
    } catch {
        /* private mode or quota full · noop */
    }
}

function generateId(): string {
    return `sr_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

export interface CreateSampleRequestInput {
    productId: string
    productName: string
    productBrand?: string
    productImage: string
    colorwayName?: string
    colorwayHex?: string
    shipTo: SampleRequestShipTo
}

export interface UseSampleRequestsReturn {
    requests: SampleRequest[]
    pendingCount: number
    createRequest: (input: CreateSampleRequestInput) => SampleRequest
    deleteRequest: (id: string) => void
    /** Testing helper · avanza el status manualmente. En producción esto
     *  vendría del backend vía polling/websocket. */
    advanceStatus: (id: string) => void
}

// F50 · Etapa 11 (P5 polish) · CustomEvent pub/sub para sincronizar el
// state entre múltiples instancias del hook (bug pre-existente · dos
// consumers del hook mantenían state independiente y perdían sync al
// hacer transitions desde una instancia). Los consumers que quieran
// disparar notificaciones al advance escuchan el evento en window.
export const SAMPLE_STATUS_CHANGE_EVENT = 'catalog:sample-status-change'

export interface SampleStatusChangeDetail {
    request: SampleRequest
    previousStatus: SampleRequestStatus
    tenantSlug: string
}

export function useSampleRequests(): UseSampleRequestsReturn {
    const { currentTenant } = useTenant()
    // Deriva un slug estable del tenant activo · fallback a "default" si
    // el tenant no tiene un identificador serializable.
    const tenantSlug = (currentTenant as unknown as string) || 'default'
    const [requests, setRequests] = useState<SampleRequest[]>(() => loadRequests(tenantSlug))

    // Rehidrata al cambiar de tenant
    useEffect(() => {
        setRequests(loadRequests(tenantSlug))
    }, [tenantSlug])

    // Persiste cada cambio
    useEffect(() => {
        saveRequests(tenantSlug, requests)
    }, [tenantSlug, requests])

    // F50 · Etapa 11 · escucha cambios de status disparados por otras
    // instancias del hook (bug pre-existente donde el badge count no se
    // actualizaba al avanzar el status desde el SlideOver). Cuando llega
    // un evento del mismo tenant, recarga el state desde localStorage.
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<SampleStatusChangeDetail>).detail
            if (!detail) return
            if (detail.tenantSlug === tenantSlug) {
                setRequests(loadRequests(tenantSlug))
            }
        }
        window.addEventListener(SAMPLE_STATUS_CHANGE_EVENT, handler)
        return () => window.removeEventListener(SAMPLE_STATUS_CHANGE_EVENT, handler)
    }, [tenantSlug])

    const createRequest = useCallback((input: CreateSampleRequestInput): SampleRequest => {
        const newRequest: SampleRequest = {
            id: generateId(),
            ...input,
            status: 'pending',
            requestedAt: new Date().toISOString(),
        }
        setRequests((prev) => [newRequest, ...prev])
        return newRequest
    }, [])

    const deleteRequest = useCallback((id: string) => {
        setRequests((prev) => prev.filter((r) => r.id !== id))
    }, [])

    const advanceStatus = useCallback((id: string) => {
        setRequests((prev) => {
            const next = prev.map((r) => {
                if (r.id !== id) return r
                if (r.status === 'pending') {
                    return {
                        ...r,
                        status: 'shipped' as SampleRequestStatus,
                        shippedAt: new Date().toISOString(),
                        carrierTracking: `1Z${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
                    }
                }
                if (r.status === 'shipped') {
                    return { ...r, status: 'delivered' as SampleRequestStatus, deliveredAt: new Date().toISOString() }
                }
                return r
            })
            // Fire pub/sub event · dispara toast rico + sincroniza el
            // state entre otras instancias del hook. Se hace después del
            // update local para que los listeners lean del localStorage
            // ya persistido (persist ocurre en el useEffect).
            const previous = prev.find((r) => r.id === id)
            const updated = next.find((r) => r.id === id)
            if (previous && updated && previous.status !== updated.status) {
                // requestAnimationFrame para que la persistencia (useEffect
                // que corre después del setState) tenga chance de escribir
                // localStorage antes de que los listeners lo relean.
                requestAnimationFrame(() => {
                    saveRequests(tenantSlug, next)
                    const detail: SampleStatusChangeDetail = {
                        request: updated,
                        previousStatus: previous.status,
                        tenantSlug,
                    }
                    window.dispatchEvent(new CustomEvent(SAMPLE_STATUS_CHANGE_EVENT, { detail }))
                })
            }
            return next
        })
    }, [tenantSlug])

    const pendingCount = requests.filter((r) => r.status !== 'delivered').length

    return { requests, pendingCount, createRequest, deleteRequest, advanceStatus }
}
