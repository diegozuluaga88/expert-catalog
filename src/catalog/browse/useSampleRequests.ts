// F50 · Wave 4 · v2 · hook de solicitudes de muestra (samples).
//
// Este hook maneja el flujo completo de solicitudes de muestra que hace
// el dealer al fabricante. Diego ask (2026-08-03) · refactorizado al
// pattern de "My Selection" · en vez de submit directo por material, el
// user va construyendo un DRAFT de samples y hace submit batch.
//
// Data model · 2 buckets:
//   · draftItems · lista de materiales que el dealer quiere pedir · no
//     enviados todavía · el user puede editar qty por material o
//     eliminar antes de enviar.
//   · draftShipTo · dirección global del draft · autofill del tenant,
//     editable · aplica a todos los items al submit.
//   · requests · samples ya enviados con status (pending/shipped/
//     delivered) y timestamps · el listado histórico.
//
// Persist local por-cliente. Cuando exista backend, el submitDraft
// llamará al endpoint apropiado y los cambios de status llegarán vía
// polling/push.

import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../../TenantContext'
import { getTenantMetadata } from '../../quote/tenantData'

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

/** Item del draft · lo que el dealer va agregando antes de enviar. */
export interface DraftSampleItem {
    id: string
    productId: string
    productName: string
    productBrand?: string
    productImage: string
    colorwayName?: string
    colorwayHex?: string
    /** Cantidad de samples de este material · útil cuando el dealer
     *  necesita el mismo material para varios clientes/proyectos. */
    qty: number
    addedAt: string
}

const STORAGE_KEY_REQUESTS = 'catalog-sample-requests-'
const STORAGE_KEY_DRAFT_ITEMS = 'catalog-sample-draft-items-'
const STORAGE_KEY_DRAFT_SHIPTO = 'catalog-sample-draft-shipto-'

function loadRequests(tenantSlug: string): SampleRequest[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_REQUESTS + tenantSlug)
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
        localStorage.setItem(STORAGE_KEY_REQUESTS + tenantSlug, JSON.stringify(requests))
    } catch { /* noop */ }
}

function loadDraftItems(tenantSlug: string): DraftSampleItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_DRAFT_ITEMS + tenantSlug)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed as DraftSampleItem[]
    } catch {
        return []
    }
}

function saveDraftItems(tenantSlug: string, items: DraftSampleItem[]) {
    try {
        localStorage.setItem(STORAGE_KEY_DRAFT_ITEMS + tenantSlug, JSON.stringify(items))
    } catch { /* noop */ }
}

function loadDraftShipTo(tenantSlug: string, fallback: SampleRequestShipTo): SampleRequestShipTo {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_DRAFT_SHIPTO + tenantSlug)
        if (!raw) return fallback
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && 'line1' in parsed) return parsed as SampleRequestShipTo
        return fallback
    } catch {
        return fallback
    }
}

function saveDraftShipTo(tenantSlug: string, shipTo: SampleRequestShipTo) {
    try {
        localStorage.setItem(STORAGE_KEY_DRAFT_SHIPTO + tenantSlug, JSON.stringify(shipTo))
    } catch { /* noop */ }
}

function generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

export interface AddToDraftInput {
    productId: string
    productName: string
    productBrand?: string
    productImage: string
    colorwayName?: string
    colorwayHex?: string
    qty?: number
}

export interface UseSampleRequestsReturn {
    /** Samples ya enviados (pending/shipped/delivered). */
    requests: SampleRequest[]
    /** Samples que el dealer está armando pero no envió aún. */
    draftItems: DraftSampleItem[]
    /** Dirección de envío del draft · global · aplica a todos los items al submit. */
    draftShipTo: SampleRequestShipTo
    /** Conteo total para el badge del top: drafts + samples in-flight (pending/shipped). */
    pendingCount: number

    /* Draft APIs */
    addToDraft: (input: AddToDraftInput) => DraftSampleItem
    updateDraftQty: (itemId: string, qty: number) => void
    removeFromDraft: (itemId: string) => void
    clearDraft: () => void
    updateDraftShipTo: (shipTo: SampleRequestShipTo) => void
    /** Convierte todos los draftItems en SampleRequests con el shipTo global.
     *  Cada line del draft se expande según qty (qty 3 = 3 requests separados).
     *  Devuelve los requests creados. Limpia el draft al terminar. */
    submitDraft: () => SampleRequest[]

    /* Request APIs (legacy y para el tracking) */
    deleteRequest: (id: string) => void
    /** Testing helper · avanza el status manualmente. */
    advanceStatus: (id: string) => void
}

// F50 · Etapa 11 (P5 polish) · CustomEvent pub/sub para sincronizar el
// state entre múltiples instancias del hook. Los consumers escuchan
// este evento para disparar toasts al advance.
export const SAMPLE_STATUS_CHANGE_EVENT = 'catalog:sample-status-change'
// Nuevo evento (2026-08-03 refactor) · dispara cuando el draft cambia
// (add/remove/qty/submit/clear) para sincronizar entre instancias del hook.
export const SAMPLE_DRAFT_CHANGE_EVENT = 'catalog:sample-draft-change'

export interface SampleStatusChangeDetail {
    request: SampleRequest
    previousStatus: SampleRequestStatus
    tenantSlug: string
}

export interface SampleDraftChangeDetail {
    tenantSlug: string
}

export function useSampleRequests(): UseSampleRequestsReturn {
    const { currentTenant } = useTenant()
    const tenantSlug = (currentTenant as unknown as string) || 'default'
    const tenant = getTenantMetadata(currentTenant)

    const [requests, setRequests] = useState<SampleRequest[]>(() => loadRequests(tenantSlug))
    const [draftItems, setDraftItems] = useState<DraftSampleItem[]>(() => loadDraftItems(tenantSlug))
    const [draftShipTo, setDraftShipTo] = useState<SampleRequestShipTo>(() =>
        loadDraftShipTo(tenantSlug, tenant.billingAddress),
    )

    // Rehidrata al cambiar de tenant
    useEffect(() => {
        setRequests(loadRequests(tenantSlug))
        setDraftItems(loadDraftItems(tenantSlug))
        setDraftShipTo(loadDraftShipTo(tenantSlug, tenant.billingAddress))
    }, [tenantSlug, tenant.billingAddress])

    // Persiste cada cambio
    useEffect(() => { saveRequests(tenantSlug, requests) }, [tenantSlug, requests])
    useEffect(() => { saveDraftItems(tenantSlug, draftItems) }, [tenantSlug, draftItems])
    useEffect(() => { saveDraftShipTo(tenantSlug, draftShipTo) }, [tenantSlug, draftShipTo])

    // Pub/sub · sync entre instancias del hook (bug pre-existente).
    useEffect(() => {
        const statusHandler = (e: Event) => {
            const detail = (e as CustomEvent<SampleStatusChangeDetail>).detail
            if (detail?.tenantSlug === tenantSlug) setRequests(loadRequests(tenantSlug))
        }
        const draftHandler = (e: Event) => {
            const detail = (e as CustomEvent<SampleDraftChangeDetail>).detail
            if (detail?.tenantSlug === tenantSlug) {
                setDraftItems(loadDraftItems(tenantSlug))
                setDraftShipTo(loadDraftShipTo(tenantSlug, tenant.billingAddress))
            }
        }
        window.addEventListener(SAMPLE_STATUS_CHANGE_EVENT, statusHandler)
        window.addEventListener(SAMPLE_DRAFT_CHANGE_EVENT, draftHandler)
        return () => {
            window.removeEventListener(SAMPLE_STATUS_CHANGE_EVENT, statusHandler)
            window.removeEventListener(SAMPLE_DRAFT_CHANGE_EVENT, draftHandler)
        }
    }, [tenantSlug, tenant.billingAddress])

    const fireDraftEvent = useCallback(() => {
        requestAnimationFrame(() => {
            const detail: SampleDraftChangeDetail = { tenantSlug }
            window.dispatchEvent(new CustomEvent(SAMPLE_DRAFT_CHANGE_EVENT, { detail }))
        })
    }, [tenantSlug])

    /* ─── Draft APIs ─────────────────────────────────────────────── */

    const addToDraft = useCallback((input: AddToDraftInput): DraftSampleItem => {
        const qty = input.qty ?? 1
        let created: DraftSampleItem | null = null
        setDraftItems((prev) => {
            // Merge por productId + colorway · si ya está en el draft, incrementa qty.
            const existing = prev.find((it) =>
                it.productId === input.productId && it.colorwayName === input.colorwayName,
            )
            if (existing) {
                created = { ...existing, qty: existing.qty + qty }
                return prev.map((it) => (it.id === existing.id ? { ...it, qty: it.qty + qty } : it))
            }
            const item: DraftSampleItem = {
                id: generateId('sd'),
                productId: input.productId,
                productName: input.productName,
                productBrand: input.productBrand,
                productImage: input.productImage,
                colorwayName: input.colorwayName,
                colorwayHex: input.colorwayHex,
                qty,
                addedAt: new Date().toISOString(),
            }
            created = item
            return [item, ...prev]
        })
        fireDraftEvent()
        return created!
    }, [fireDraftEvent])

    const updateDraftQty = useCallback((itemId: string, qty: number) => {
        const clamped = Math.max(1, Math.min(99, Math.round(qty)))
        setDraftItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, qty: clamped } : it)))
        fireDraftEvent()
    }, [fireDraftEvent])

    const removeFromDraft = useCallback((itemId: string) => {
        setDraftItems((prev) => prev.filter((it) => it.id !== itemId))
        fireDraftEvent()
    }, [fireDraftEvent])

    const clearDraft = useCallback(() => {
        setDraftItems([])
        fireDraftEvent()
    }, [fireDraftEvent])

    const updateDraftShipTo = useCallback((shipTo: SampleRequestShipTo) => {
        setDraftShipTo(shipTo)
        fireDraftEvent()
    }, [fireDraftEvent])

    const submitDraft = useCallback((): SampleRequest[] => {
        const now = new Date().toISOString()
        const created: SampleRequest[] = []
        setDraftItems((prevDraft) => {
            if (prevDraft.length === 0) return prevDraft
            // Expandimos qty · cada unidad = 1 SampleRequest independiente.
            const newRequests: SampleRequest[] = []
            for (const item of prevDraft) {
                for (let i = 0; i < item.qty; i++) {
                    newRequests.push({
                        id: generateId('sr'),
                        productId: item.productId,
                        productName: item.productName,
                        productBrand: item.productBrand,
                        productImage: item.productImage,
                        colorwayName: item.colorwayName,
                        colorwayHex: item.colorwayHex,
                        shipTo: draftShipTo,
                        status: 'pending',
                        requestedAt: now,
                    })
                }
            }
            created.push(...newRequests)
            setRequests((prev) => [...newRequests, ...prev])
            return []
        })
        fireDraftEvent()
        return created
    }, [draftShipTo, fireDraftEvent])

    /* ─── Request APIs ───────────────────────────────────────────── */

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
            const previous = prev.find((r) => r.id === id)
            const updated = next.find((r) => r.id === id)
            if (previous && updated && previous.status !== updated.status) {
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

    // Badge count · draft items + in-flight (pending + shipped) requests.
    const draftUnits = draftItems.reduce((s, it) => s + it.qty, 0)
    const inFlight = requests.filter((r) => r.status !== 'delivered').length
    const pendingCount = draftUnits + inFlight

    return {
        requests,
        draftItems,
        draftShipTo,
        pendingCount,
        addToDraft,
        updateDraftQty,
        removeFromDraft,
        clearDraft,
        updateDraftShipTo,
        submitDraft,
        deleteRequest,
        advanceStatus,
    }
}
