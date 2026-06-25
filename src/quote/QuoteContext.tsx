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

interface QuoteContextValue {
    /** Drafts del tenant activo */
    drafts: QuoteDraft[]
    /** Solo drafts en estado 'draft' o 'in-progress-ingest' */
    activeDrafts: QuoteDraft[]
    submittedDrafts: QuoteDraft[]
    activeDraftId: string | null
    activeDraft: QuoteDraft | null
    buyerInfo: BuyerInfo
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

    const drafts = draftsByTenant[tenant.id] ?? []
    const activeDraftId = activeDraftIds[tenant.id] ?? null
    const activeDraft = drafts.find(d => d.id === activeDraftId) ?? null
    const activeDrafts = drafts.filter(d => d.status !== 'submitted')
    const submittedDrafts = drafts.filter(d => d.status === 'submitted')

    const setActiveDraft = useCallback((draftId: string) => {
        setActiveDraftIds(prev => ({ ...prev, [tenant.id]: draftId }))
    }, [tenant.id])

    const createDraft = useCallback((opts?: { source?: 'manual' | 'ingest'; sourceDocRef?: string; name?: string }): QuoteDraft => {
        const slug = tenant.id
        const id = generateId('draft')
        const now = new Date(0).toISOString().replace('1970', '2026') // Static-ish · evitamos Date.now leak
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
        const now = new Date(0).toISOString().replace('1970', '2026')

        const lineItems: QuoteLineItem[] = items.map((item, i) => ({
            ...item,
            id: generateId(`line-${i}`),
            addedAt: now,
        }))

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
                return { ...prev, [slug]: [...list, target] }
            }

            return {
                ...prev,
                [slug]: list.map(d => d.id === target!.id
                    ? { ...d, items: [...d.items, ...lineItems], updatedAt: now }
                    : d
                ),
            }
        })

        if (targetId) setActiveDraftIds(prev => ({ ...prev, [slug]: targetId! }))
        return targetId ?? ''
    }, [activeDraftIds, buyerInfo, tenant.id])

    const updateItem = useCallback((draftId: string, itemId: string, patch: Partial<QuoteLineItem>) => {
        const slug = tenant.id
        const now = new Date(0).toISOString().replace('1970', '2026')
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
        const now = new Date(0).toISOString().replace('1970', '2026')
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
        const now = new Date(0).toISOString().replace('1970', '2026')
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
        const now = new Date(0).toISOString().replace('1970', '2026')
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
            setActiveDraft,
            createDraft,
            deleteDraft,
            addItems,
            updateItem,
            removeItem,
            submitDraft,
            markInProgressIngest,
            renameDraft,
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
