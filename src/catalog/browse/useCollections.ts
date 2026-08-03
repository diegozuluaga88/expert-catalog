// F50 · Wave 6 · v2 · hook de colecciones (P7 del PRD).
//
// Reemplaza al `useState<Set<string>>` de favoritos-flat del ShowroomPageV2
// por un modelo persistido de colecciones nombradas.
//
// Data model · una colección tiene:
//   · id · slug estable, único por-tenant
//   · name · display name editable
//   · productIds · lista de product ids que le pertenecen
//   · color · hex opcional para el chip visual del sidebar
//   · createdAt · ISO timestamp
//
// Persistencia · localStorage por-tenant. Sigue el patrón de
// useSampleRequests + expert-hub-quotes-{tenantSlug}. Un producto puede
// pertenecer a N colecciones al mismo tiempo.
//
// Migration · si al montar el hook detecta la key legacy
// `catalog-favorites-{tenant}`, la migra a una colección default "Favorites"
// y borra la key legacy · zero data loss para dealers existentes.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTenant } from '../../TenantContext'

export interface Collection {
    id: string
    name: string
    productIds: string[]
    color?: string
    createdAt: string
}

const STORAGE_KEY_PREFIX = 'catalog-collections-'
const LEGACY_FAV_KEY_PREFIX = 'catalog-favorites-'

function loadCollections(tenantSlug: string): Collection[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + tenantSlug)
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) return parsed as Collection[]
        }
        // Migration desde la key legacy de favoritos flat · una sola vez.
        const legacy = localStorage.getItem(LEGACY_FAV_KEY_PREFIX + tenantSlug)
        if (legacy) {
            try {
                const ids = JSON.parse(legacy)
                if (Array.isArray(ids) && ids.length > 0) {
                    const migrated: Collection = {
                        id: generateId(),
                        name: 'Favorites',
                        productIds: ids.filter((v) => typeof v === 'string'),
                        createdAt: new Date().toISOString(),
                    }
                    localStorage.removeItem(LEGACY_FAV_KEY_PREFIX + tenantSlug)
                    return [migrated]
                }
            } catch {
                /* legacy corrupto · ignorar */
            }
        }
        return []
    } catch {
        return []
    }
}

function saveCollections(tenantSlug: string, collections: Collection[]) {
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug, JSON.stringify(collections))
    } catch {
        /* private mode or quota full · noop */
    }
}

function generateId(): string {
    return `col_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

export interface UseCollectionsReturn {
    collections: Collection[]
    /** Set con todos los productIds que pertenecen a al menos una colección (para el heart-toggle). */
    savedProductIds: Set<string>
    createCollection: (name: string, color?: string) => Collection
    renameCollection: (id: string, name: string) => void
    deleteCollection: (id: string) => void
    addToCollection: (collectionId: string, productId: string) => void
    removeFromCollection: (collectionId: string, productId: string) => void
    /** Toggle rápido · si el producto está en ≥1 colección, lo saca de todas.
     *  Si no está en ninguna, lo agrega a la colección default (o crea una). */
    toggleSaved: (productId: string) => void
    /** Devuelve los ids de las colecciones que contienen este productId. */
    collectionsFor: (productId: string) => string[]
}

const DEFAULT_COLLECTION_NAME = 'Favorites'

export function useCollections(): UseCollectionsReturn {
    const { currentTenant } = useTenant()
    const tenantSlug = (currentTenant as unknown as string) || 'default'
    const [collections, setCollections] = useState<Collection[]>(() => loadCollections(tenantSlug))

    useEffect(() => {
        setCollections(loadCollections(tenantSlug))
    }, [tenantSlug])

    useEffect(() => {
        saveCollections(tenantSlug, collections)
    }, [tenantSlug, collections])

    const savedProductIds = useMemo(() => {
        const s = new Set<string>()
        collections.forEach((c) => c.productIds.forEach((id) => s.add(id)))
        return s
    }, [collections])

    const createCollection = useCallback((name: string, color?: string): Collection => {
        const trimmed = name.trim() || 'Untitled collection'
        const newCollection: Collection = {
            id: generateId(),
            name: trimmed,
            productIds: [],
            color,
            createdAt: new Date().toISOString(),
        }
        setCollections((prev) => [newCollection, ...prev])
        return newCollection
    }, [])

    const renameCollection = useCallback((id: string, name: string) => {
        const trimmed = name.trim()
        if (!trimmed) return
        setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)))
    }, [])

    const deleteCollection = useCallback((id: string) => {
        setCollections((prev) => prev.filter((c) => c.id !== id))
    }, [])

    const addToCollection = useCallback((collectionId: string, productId: string) => {
        setCollections((prev) =>
            prev.map((c) => {
                if (c.id !== collectionId) return c
                if (c.productIds.includes(productId)) return c
                return { ...c, productIds: [...c.productIds, productId] }
            }),
        )
    }, [])

    const removeFromCollection = useCallback((collectionId: string, productId: string) => {
        setCollections((prev) =>
            prev.map((c) =>
                c.id !== collectionId ? c : { ...c, productIds: c.productIds.filter((p) => p !== productId) },
            ),
        )
    }, [])

    const toggleSaved = useCallback((productId: string) => {
        setCollections((prev) => {
            const belongsSomewhere = prev.some((c) => c.productIds.includes(productId))
            if (belongsSomewhere) {
                return prev.map((c) => ({ ...c, productIds: c.productIds.filter((p) => p !== productId) }))
            }
            if (prev.length === 0) {
                return [
                    {
                        id: generateId(),
                        name: DEFAULT_COLLECTION_NAME,
                        productIds: [productId],
                        createdAt: new Date().toISOString(),
                    },
                ]
            }
            const targetId = prev[0].id
            return prev.map((c) =>
                c.id !== targetId ? c : { ...c, productIds: [...c.productIds, productId] },
            )
        })
    }, [])

    const collectionsFor = useCallback(
        (productId: string) => collections.filter((c) => c.productIds.includes(productId)).map((c) => c.id),
        [collections],
    )

    return {
        collections,
        savedProductIds,
        createCollection,
        renameCollection,
        deleteCollection,
        addToCollection,
        removeFromCollection,
        toggleSaved,
        collectionsFor,
    }
}
