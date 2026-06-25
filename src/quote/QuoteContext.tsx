// Phase 3 Fix #8 — QuoteContext multi-draft tenant-aware.
//
// Architecture decisiones (post Diego plan review):
//  - Array de drafts por tenant (no single cart) · cliente B2B puede tener
//    múltiples quotes en paralelo (manual + ingested)
//  - Aislamiento por tenant · localStorage key = `expert-hub-quotes-{tenantSlug}`
//  - Cada draft tiene buyerInfo autofilled del user + tenant (Diego fill-once ask)
//  - sourceDocRef opcional · marca drafts generados por Phase 5 doc ingest
//  - Status · 'draft' | 'in-progress-ingest' | 'submitted'
//  - Active draft = el más reciente editado · cards "Add to Quote" agrega al
//    active draft. Si ninguno existe, crea uno manual default.

import {
    createContext, useCallback, useContext, useEffect, useMemo, useState,
    type ReactNode,
} from 'react'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../TenantContext'
import { getTenantMetadata, type TenantMetadata } from './tenantData'
import { getUserCompanyProfile, type UserCompanyProfile } from './userProfile'

export interface QuoteLineItem {
    id: string
    productId: string
    productName: string
    productBrand?: string
    productImage: string
    qty: number
    colorwayCode?: string
    colorwayName?: string
    colorwayHex?: string
    finishId?: string
    finishName?: string
    fabricId?: string
    fabricName?: string
    fabricIsPremium?: boolean
    materialTierId?: string
    materialTierName?: string
    unitPrice: number
    totalPrice: number
    leadTimeDays: number
    addedAt: string
    /** Phase 5 · si el item vino de un doc ingest, referencia al doc fuente */
    sourceDocRef?: string
}

export interface BuyerInfo {
    user: UserCompanyProfile
    tenant: TenantMetadata
}

export type QuoteDraftStatus = 'draft' | 'in-progress-ingest' | 'submitted'

export interface QuoteDraft {
    id: string
    name: string
    source: 'manual' | 'ingest'
    sourceDocRef?: string
    items: QuoteLineItem[]
    buyerInfo: BuyerInfo
    status: QuoteDraftStatus
    createdAt: string
    updatedAt: string
    /** Reference number user-friendly · `Q-2026-001-SPECIALT` */
    referenceNumber?: string
}

/** Resumen del último add · consumido por MiniCartDrawer para slide-in feedback. */
export interface LastAddedSummary {
    draftId: string
    draftName: string
    tenantName: string
    itemCount: number
    addedItems: QuoteLineItem[]
    addedAt: string
}

/** Estado de edición de un item · cuando set, App.tsx renderea el ProductDetailPanel
 * en modo "Update item" con la config prellenada. */
export interface EditingItemState {
    draftId: string
    item: QuoteLineItem
}

/** Phase 4 Fix #13b · Info de history quoted por tenant · usado para
 * badge "Previously quoted" en cards + sort "History first" + banner en detail. */
export interface QuotedHistoryEntry {
    productId: string
    /** Total de líneas (NO suma de qty) en drafts + submitted que contienen este product */
    occurrences: number
    /** Total de unidades sumadas */
    totalUnits: number
    /** Última fecha que se quoteó (ISO) · max updatedAt de drafts containing this product */
    lastQuotedAt: string
}

interface QuoteContextValue {
    /** Drafts del tenant activo */
    drafts: QuoteDraft[]
    /** Solo drafts en estado 'draft' o 'in-progress-ingest' */
    activeDrafts: QuoteDraft[]
    submittedDrafts: QuoteDraft[]
    activeDraftId: string | null
    activeDraft: QuoteDraft | null
    buyerInfo: BuyerInfo
    /** Última operación de add · null si nunca se agregó o se cerró el feedback */
    lastAdded: LastAddedSummary | null
    /** Item siendo editado (desde drawer) · null = no editando */
    editingItem: EditingItemState | null
    /** Map productId → history info · derived de drafts (active + submitted) del tenant */
    quotedHistory: Map<string, QuotedHistoryEntry>
    setActiveDraft: (draftId: string) => void
    createDraft: (opts?: { source?: 'manual' | 'ingest'; sourceDocRef?: string; name?: string }) => QuoteDraft
    deleteDraft: (draftId: string) => void
    /** Add lines · si draftId es null/undefined, usa el activeDraft (o crea uno manual). */
    addItems: (items: Omit<QuoteLineItem, 'id' | 'addedAt'>[], draftId?: string | null) => string
    updateItem: (draftId: string, itemId: string, patch: Partial<QuoteLineItem>) => void
    removeItem: (draftId: string, itemId: string) => void
    submitDraft: (draftId: string) => string
    markInProgressIngest: (draftId: string) => void
    renameDraft: (draftId: string, name: string) => void
    clearLastAdded: () => void
    startEditingItem: (draftId: string, item: QuoteLineItem) => void
    stopEditingItem: () => void
}

const QuoteContext = createContext<QuoteContextValue | undefined>(undefined)

const STORAGE_KEY_PREFIX = 'expert-hub-quotes-'

function generateId(prefix: string): string {
    const random = Math.floor(Math.random() * 1e9).toString(36)
    return `${prefix}-${random}`
}

function generateReferenceNumber(tenantSlug: string, draftCount: number): string {
    const seq = (draftCount + 1).toString().padStart(3, '0')
    const tenantPart = tenantSlug.toUpperCase().replace(/-/g, '').slice(0, 8)
    return `Q-2026-${seq}-${tenantPart}`
}

function loadDrafts(tenantSlug: string): QuoteDraft[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + tenantSlug)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed as QuoteDraft[]
    } catch {
        return []
    }
}

function saveDrafts(tenantSlug: string, drafts: QuoteDraft[]) {
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug, JSON.stringify(drafts))
    } catch {
        /* quota or disabled storage · noop */
    }
}

export function QuoteProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const { currentTenant } = useTenant()
    const tenant = getTenantMetadata(currentTenant)
    const userProfile = getUserCompanyProfile(user?.email, user?.user_metadata?.full_name)
    const buyerInfo: BuyerInfo = useMemo(() => ({ user: userProfile, tenant }), [userProfile, tenant])

    // Drafts per tenant · key del Record es tenant.id
    const [draftsByTenant, setDraftsByTenant] = useState<Record<string, QuoteDraft[]>>({})
    const [activeDraftIds, setActiveDraftIds] = useState<Record<string, string | null>>({})
    // Last added summary · activa el MiniCartDrawer slide-in
    const [lastAdded, setLastAdded] = useState<LastAddedSummary | null>(null)
    // Editing item · activa el panel en modo Update
    const [editingItem, setEditingItem] = useState<EditingItemState | null>(null)

    // Load drafts del tenant activo cuando cambia
    useEffect(() => {
        const slug = tenant.id
        if (draftsByTenant[slug] !== undefined) return
        const loaded = loadDrafts(slug)
        setDraftsByTenant(prev => ({ ...prev, [slug]: loaded }))
        const lastActive = loaded
            .filter(d => d.status !== 'submitted')
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
        setActiveDraftIds(prev => ({ ...prev, [slug]: lastActive?.id ?? null }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenant.id])

    // Persistir on change
    useEffect(() => {
        const slug = tenant.id
        const list = draftsByTenant[slug]
        if (list) saveDrafts(slug, list)
    }, [draftsByTenant, tenant.id])

    // Limpiar lastAdded feedback cuando cambia el tenant · evita mostrar
    // "X added to SPECIAL T" mientras el user ya está en otro tenant.
    useEffect(() => {
        setLastAdded(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenant.id])

    const drafts = draftsByTenant[tenant.id] ?? []
    const activeDraftId = activeDraftIds[tenant.id] ?? null
    const activeDraft = drafts.find(d => d.id === activeDraftId) ?? null
    // Más recientes al top · sort por updatedAt desc (Diego ask)
    const sortByUpdatedDesc = (a: QuoteDraft, b: QuoteDraft) => b.updatedAt.localeCompare(a.updatedAt)
    const activeDrafts = drafts.filter(d => d.status !== 'submitted').sort(sortByUpdatedDesc)
    const submittedDrafts = drafts.filter(d => d.status === 'submitted').sort(sortByUpdatedDesc)

    // Phase 4 Fix #13b · derived quoted history del tenant activo · usado por cards
    // (badge), showroom (sort), detail panel (banner).
    const quotedHistory = useMemo(() => {
        const map = new Map<string, QuotedHistoryEntry>()
        for (const d of drafts) {
            for (const item of d.items) {
                const existing = map.get(item.productId)
                if (existing) {
                    existing.occurrences += 1
                    existing.totalUnits += item.qty
                    if (d.updatedAt > existing.lastQuotedAt) existing.lastQuotedAt = d.updatedAt
                } else {
                    map.set(item.productId, {
                        productId: item.productId,
                        occurrences: 1,
                        totalUnits: item.qty,
                        lastQuotedAt: d.updatedAt,
                    })
                }
            }
        }
        return map
    }, [drafts])

    const setActiveDraft = useCallback((draftId: string) => {
        setActiveDraftIds(prev => ({ ...prev, [tenant.id]: draftId }))
    }, [tenant.id])

    const createDraft = useCallback((opts?: { source?: 'manual' | 'ingest'; sourceDocRef?: string; name?: string }): QuoteDraft => {
        const slug = tenant.id
        const id = generateId('draft')
        const now = new Date().toISOString() // Static-ish · evitamos Date.now leak
        const refNum = generateReferenceNumber(slug, drafts.length)
        const draft: QuoteDraft = {
            id,
            name: opts?.name ?? (opts?.source === 'ingest' && opts?.sourceDocRef
                ? `Ingested · ${opts.sourceDocRef}`
                : `Quote ${refNum}`),
            source: opts?.source ?? 'manual',
            sourceDocRef: opts?.sourceDocRef,
            items: [],
            buyerInfo,
            status: 'draft',
            createdAt: now,
            updatedAt: now,
            referenceNumber: refNum,
        }
        setDraftsByTenant(prev => ({
            ...prev,
            [slug]: [...(prev[slug] ?? []), draft],
        }))
        setActiveDraftIds(prev => ({ ...prev, [slug]: id }))
        return draft
    }, [buyerInfo, drafts.length, tenant.id])

    const deleteDraft = useCallback((draftId: string) => {
        const slug = tenant.id
        setDraftsByTenant(prev => ({
            ...prev,
            [slug]: (prev[slug] ?? []).filter(d => d.id !== draftId),
        }))
        setActiveDraftIds(prev => {
            if (prev[slug] === draftId) return { ...prev, [slug]: null }
            return prev
        })
    }, [tenant.id])

    const addItems = useCallback((items: Omit<QuoteLineItem, 'id' | 'addedAt'>[], draftId?: string | null): string => {
        const slug = tenant.id
        let targetId = draftId ?? activeDraftIds[slug]
        const now = new Date().toISOString()

        const lineItems: QuoteLineItem[] = items.map((item, i) => ({
            ...item,
            id: generateId(`line-${i}`),
            addedAt: now,
        }))

        let resultDraftName = ''
        setDraftsByTenant(prev => {
            const list = prev[slug] ?? []
            let target = targetId ? list.find(d => d.id === targetId && d.status !== 'submitted') : undefined

            // Si no hay active draft válido, creamos uno
            if (!target) {
                const id = generateId('draft')
                const refNum = generateReferenceNumber(slug, list.length)
                target = {
                    id,
                    name: `Quote ${refNum}`,
                    source: 'manual',
                    items: lineItems,
                    buyerInfo,
                    status: 'draft',
                    createdAt: now,
                    updatedAt: now,
                    referenceNumber: refNum,
                }
                targetId = id
                resultDraftName = target.name
                return { ...prev, [slug]: [...list, target] }
            }

            resultDraftName = target.name
            return {
                ...prev,
                [slug]: list.map(d => d.id === target!.id
                    ? { ...d, items: [...d.items, ...lineItems], updatedAt: now }
                    : d
                ),
            }
        })

        if (targetId) setActiveDraftIds(prev => ({ ...prev, [slug]: targetId! }))
        setLastAdded({
            draftId: targetId ?? '',
            draftName: resultDraftName,
            tenantName: tenant.name,
            itemCount: lineItems.length,
            addedItems: lineItems,
            addedAt: now,
        })
        return targetId ?? ''
    }, [activeDraftIds, buyerInfo, tenant.id, tenant.name])

    const clearLastAdded = useCallback(() => setLastAdded(null), [])

    const startEditingItem = useCallback((draftId: string, item: QuoteLineItem) => {
        setEditingItem({ draftId, item })
    }, [])

    const stopEditingItem = useCallback(() => setEditingItem(null), [])

    const updateItem = useCallback((draftId: string, itemId: string, patch: Partial<QuoteLineItem>) => {
        const slug = tenant.id
        const now = new Date().toISOString()
        setDraftsByTenant(prev => ({
            ...prev,
            [slug]: (prev[slug] ?? []).map(d => d.id === draftId
                ? {
                    ...d,
                    items: d.items.map(it => it.id === itemId ? { ...it, ...patch } : it),
                    updatedAt: now,
                }
                : d
            ),
        }))
    }, [tenant.id])

    const removeItem = useCallback((draftId: string, itemId: string) => {
        const slug = tenant.id
        const now = new Date().toISOString()
        setDraftsByTenant(prev => ({
            ...prev,
            [slug]: (prev[slug] ?? []).map(d => d.id === draftId
                ? { ...d, items: d.items.filter(it => it.id !== itemId), updatedAt: now }
                : d
            ),
        }))
    }, [tenant.id])

    const submitDraft = useCallback((draftId: string): string => {
        const slug = tenant.id
        const draft = (draftsByTenant[slug] ?? []).find(d => d.id === draftId)
        const refNum = draft?.referenceNumber ?? generateReferenceNumber(slug, drafts.length)
        const now = new Date().toISOString()
        setDraftsByTenant(prev => ({
            ...prev,
            [slug]: (prev[slug] ?? []).map(d => d.id === draftId
                ? { ...d, status: 'submitted' as QuoteDraftStatus, updatedAt: now }
                : d
            ),
        }))
        // Active draft puede quedar en submitted · clear active si era él
        if (activeDraftIds[slug] === draftId) {
            setActiveDraftIds(prev => ({ ...prev, [slug]: null }))
        }
        return refNum
    }, [activeDraftIds, drafts.length, draftsByTenant, tenant.id])

    const markInProgressIngest = useCallback((draftId: string) => {
        const slug = tenant.id
        setDraftsByTenant(prev => ({
            ...prev,
            [slug]: (prev[slug] ?? []).map(d => d.id === draftId
                ? { ...d, status: 'in-progress-ingest' as QuoteDraftStatus }
                : d
            ),
        }))
    }, [tenant.id])

    const renameDraft = useCallback((draftId: string, name: string) => {
        const slug = tenant.id
        const now = new Date().toISOString()
        setDraftsByTenant(prev => ({
            ...prev,
            [slug]: (prev[slug] ?? []).map(d => d.id === draftId
                ? { ...d, name, updatedAt: now }
                : d
            ),
        }))
    }, [tenant.id])

    return (
        <QuoteContext.Provider value={{
            drafts,
            activeDrafts,
            submittedDrafts,
            activeDraftId,
            activeDraft,
            buyerInfo,
            lastAdded,
            editingItem,
            quotedHistory,
            setActiveDraft,
            createDraft,
            deleteDraft,
            addItems,
            updateItem,
            removeItem,
            submitDraft,
            markInProgressIngest,
            renameDraft,
            clearLastAdded,
            startEditingItem,
            stopEditingItem,
        }}>
            {children}
        </QuoteContext.Provider>
    )
}

export function useQuote() {
    const context = useContext(QuoteContext)
    if (context === undefined) {
        throw new Error('useQuote must be used within a QuoteProvider')
    }
    return context
}
