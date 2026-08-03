// F51 · A.1 · P6 Inspiration Gallery · greenfield.
//
// Modelo de "installation" · foto de un espacio real (o rendering) con
// hotspots que apuntan a productos del catálogo. Cada tag lleva coords
// relativas (xPct/yPct 0-100) para pintar el círculo sobre la imagen
// respetando aspect ratio. Persist localStorage per-tenant siguiendo el
// pattern de useCollections + useProjects.
//
// Mock seed · al primer mount (sin data persisted), sembramos 6 mock
// installations con imágenes de /public/images/spaces/ y tags apuntando
// a productos reales del UNIFIED_PRODUCTS. Determinístico · mismo mount
// = mismo seed.
//
// El PRD dice que el fail original de esta feature fue no conseguir
// content de design firms · el "designFirm" gating queda como campo
// opcional + stub en el upload flow, no como bloqueante.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTenant } from '../../TenantContext'
import { UNIFIED_PRODUCTS } from '../showroom/data/unifiedProducts'

export interface InstallationTag {
    productId: string
    xPct: number
    yPct: number
    note?: string
}

export interface Installation {
    id: string
    imageUrl: string
    imageAspect?: number
    title: string
    designFirm?: string
    roomType?: string
    tags: InstallationTag[]
    addedAt: string
}

const STORAGE_KEY_PREFIX = 'catalog-installations-'

function generateId(): string {
    return `ins_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

function safeParse(raw: string | null): Installation[] | null {
    if (!raw) return null
    try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return null
        return parsed as Installation[]
    } catch {
        return null
    }
}

const SEED_KEY = '__seeded__'
const SEED_TITLES = [
    { image: '/images/spaces/focus-room.jpg', title: 'Focus room · financial services HQ', designFirm: 'Perkins&Will', roomType: 'Focus Room' },
    { image: '/images/spaces/work-cafe.jpg', title: 'Work café · downtown campus', designFirm: 'Gensler', roomType: 'Work Cafe' },
    { image: '/images/spaces/huddle-room.jpg', title: 'Huddle room · tech unicorn floor', designFirm: 'HOK', roomType: 'Huddle Room' },
    { image: '/images/spaces/meeting-room.jpg', title: 'Boardroom · law firm remodel', designFirm: 'IA Interior Architects', roomType: 'Meeting Room' },
    { image: '/images/spaces/reception.jpg', title: 'Reception lobby · healthcare HQ', designFirm: 'Corgan', roomType: 'Reception' },
    { image: '/images/spaces/front-porch.jpg', title: 'Neighborhood porch · agency loft', designFirm: 'M Moser', roomType: 'Front Porch' },
]

function seedInstallations(): Installation[] {
    const now = new Date().toISOString()
    // Determinístico · agarra los primeros N productos para no depender del
    // orden ni de IDs frágiles. 3 tags por installation, distribuidos en la
    // imagen con offsets escalonados.
    const pool = UNIFIED_PRODUCTS.slice(0, 30)
    return SEED_TITLES.map((seed, i) => {
        const tagSpots = [
            { xPct: 22, yPct: 55 },
            { xPct: 55, yPct: 40 },
            { xPct: 78, yPct: 65 },
        ]
        const tags: InstallationTag[] = tagSpots.map((spot, j) => {
            const pick = pool[(i * 3 + j) % pool.length]
            return {
                productId: pick.id,
                xPct: spot.xPct,
                yPct: spot.yPct,
            }
        })
        return {
            id: generateId(),
            imageUrl: seed.image,
            imageAspect: 16 / 10,
            title: seed.title,
            designFirm: seed.designFirm,
            roomType: seed.roomType,
            tags,
            addedAt: now,
        }
    })
}

function loadInstallations(tenantSlug: string): Installation[] {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + tenantSlug)
    const parsed = safeParse(raw)
    if (parsed) return parsed
    // Primer mount · sembrar mock + marcar seeded para no re-sembrar tras clear.
    const seeded = localStorage.getItem(STORAGE_KEY_PREFIX + tenantSlug + SEED_KEY)
    if (seeded === '1') return []
    const seed = seedInstallations()
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug + SEED_KEY, '1')
        localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug, JSON.stringify(seed))
    } catch {
        /* private mode · noop */
    }
    return seed
}

function saveInstallations(tenantSlug: string, installations: Installation[]) {
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug, JSON.stringify(installations))
    } catch {
        /* private mode · noop */
    }
}

export interface CreateInstallationInput {
    imageUrl: string
    title: string
    designFirm?: string
    roomType?: string
    imageAspect?: number
    tags?: InstallationTag[]
}

export interface UseInstallationsReturn {
    installations: Installation[]
    createInstallation: (input: CreateInstallationInput) => Installation
    updateInstallation: (id: string, patch: Partial<Omit<Installation, 'id' | 'addedAt'>>) => void
    deleteInstallation: (id: string) => void
    addTag: (installationId: string, tag: InstallationTag) => void
    removeTag: (installationId: string, tagIndex: number) => void
    updateTag: (installationId: string, tagIndex: number, patch: Partial<InstallationTag>) => void
}

export function useInstallations(): UseInstallationsReturn {
    const { currentTenant } = useTenant()
    const tenantSlug = (currentTenant as unknown as string) || 'default'
    const [installations, setInstallations] = useState<Installation[]>(() => loadInstallations(tenantSlug))

    useEffect(() => {
        setInstallations(loadInstallations(tenantSlug))
    }, [tenantSlug])

    useEffect(() => {
        saveInstallations(tenantSlug, installations)
    }, [tenantSlug, installations])

    const createInstallation = useCallback((input: CreateInstallationInput): Installation => {
        const created: Installation = {
            id: generateId(),
            imageUrl: input.imageUrl,
            title: input.title.trim() || 'Untitled installation',
            designFirm: input.designFirm?.trim() || undefined,
            roomType: input.roomType?.trim() || undefined,
            imageAspect: input.imageAspect,
            tags: input.tags ?? [],
            addedAt: new Date().toISOString(),
        }
        setInstallations((prev) => [created, ...prev])
        return created
    }, [])

    const updateInstallation = useCallback((id: string, patch: Partial<Omit<Installation, 'id' | 'addedAt'>>) => {
        setInstallations((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
    }, [])

    const deleteInstallation = useCallback((id: string) => {
        setInstallations((prev) => prev.filter((it) => it.id !== id))
    }, [])

    const addTag = useCallback((installationId: string, tag: InstallationTag) => {
        setInstallations((prev) => prev.map((it) => (
            it.id === installationId ? { ...it, tags: [...it.tags, tag] } : it
        )))
    }, [])

    const removeTag = useCallback((installationId: string, tagIndex: number) => {
        setInstallations((prev) => prev.map((it) => (
            it.id === installationId ? { ...it, tags: it.tags.filter((_, i) => i !== tagIndex) } : it
        )))
    }, [])

    const updateTag = useCallback((installationId: string, tagIndex: number, patch: Partial<InstallationTag>) => {
        setInstallations((prev) => prev.map((it) => (
            it.id !== installationId ? it : {
                ...it,
                tags: it.tags.map((t, i) => (i === tagIndex ? { ...t, ...patch } : t)),
            }
        )))
    }, [])

    return useMemo(() => ({
        installations,
        createInstallation,
        updateInstallation,
        deleteInstallation,
        addTag,
        removeTag,
        updateTag,
    }), [installations, createInstallation, updateInstallation, deleteInstallation, addTag, removeTag, updateTag])
}
