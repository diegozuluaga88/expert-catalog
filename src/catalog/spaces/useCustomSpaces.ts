// Fase 5 · useCustomSpaces hook (2026-07-06)
// Store per-tenant de SpaceTypeSettings creados por el dealer (isCustom: true).
// Persist en localStorage con key `expert-hub-custom-spaces-{tenantSlug}`
// (mismo pattern que QuoteContext.drafts).
//
// Los custom se mezclan con los seed en el grid principal via
// `mergeCustomIntoSettings()` · el resto de la UI no distingue seed vs custom
// excepto por el badge "Custom" y las acciones inline (edit/duplicate/delete).
//
// F58a.2 · consolidación con ex-módulo Inspiration · agregada migration
// one-shot que lee la legacy key `catalog-installations-{tenantSlug}` y
// convierte cada Installation a un SpaceTypeSetting con isCustom + isUserUpload
// + imageOverlay. Después borra la key legacy · zero data loss.

import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../../TenantContext'
import type { SpaceTypeSetting, SpaceBundle } from '../types'
import { SPACE_TYPE_SETTINGS } from '../data/spaceTypes'

const STORAGE_PREFIX = 'expert-hub-custom-spaces'
const LEGACY_INSTALLATIONS_PREFIX = 'catalog-installations'

/** F58a.2 · shape del legacy Installation (ex-módulo Inspiration).
 *  Preservado solo aquí para la migración one-shot · después de correr,
 *  ninguna otra parte del código necesita este tipo. */
interface LegacyInstallation {
    id: string
    imageUrl: string
    imageAspect?: number
    title: string
    designFirm?: string
    roomType?: string
    tags: Array<{ productId: string; xPct: number; yPct: number; note?: string }>
    addedAt: string
}

/** F58a.2 · mapping heurístico roomType → SpaceType.id. Los strings del
 *  Inspiration UploadModal coincidían literal con los names de SPACE_TYPES. */
function roomTypeToSpaceTypeId(roomType: string | undefined): string {
    if (!roomType) return 'sp-other'
    const normalized = roomType.toLowerCase().trim()
    const map: Record<string, string> = {
        'focus room': 'sp-focus-room',
        'work cafe': 'sp-work-cafe',
        'huddle room': 'sp-huddle-room',
        'meeting room': 'sp-meeting-room',
        'front porch': 'sp-front-porch',
        'reception': 'sp-reception',
        'cafeteria': 'sp-cafeteria',
        'training room': 'sp-training-room',
        'phone booth': 'sp-phone-booth',
        'wellness room': 'sp-wellness-room',
    }
    return map[normalized] ?? 'sp-other'
}

/** F58a.2 · migración one-shot Installation → SpaceTypeSetting. Ejecuta 1 vez
 *  al primer mount por tenant · si hay data en la legacy key la convierte y
 *  la borra. Zero data loss. */
function migrateFromLegacyInstallations(tenantSlug: string): SpaceTypeSetting[] {
    if (typeof window === 'undefined') return []
    const legacyKey = `${LEGACY_INSTALLATIONS_PREFIX}-${tenantSlug}`
    try {
        const raw = window.localStorage.getItem(legacyKey)
        if (!raw) return []
        const installations = JSON.parse(raw) as LegacyInstallation[]
        if (!Array.isArray(installations) || installations.length === 0) {
            window.localStorage.removeItem(legacyKey)
            return []
        }
        const migrated: SpaceTypeSetting[] = installations.map((inst, idx) => {
            const settingId = `migrated-${inst.id}`
            const bundleItems = inst.tags.map((t, i) => ({
                productGroupCode: 'MIGRATED',
                itemId: t.productId,
                qty: 1,
                label: String(i + 1),
            }))
            const bundle: SpaceBundle = {
                id: `bundle-${settingId}`,
                settingId,
                items: bundleItems,
                estimatedCostMin: 0,
                estimatedCostMax: 0,
                imageOverlay: inst.tags.map((t) => ({
                    productId: t.productId,
                    xPct: t.xPct,
                    yPct: t.yPct,
                    note: t.note,
                })),
            }
            return {
                id: settingId,
                code: `MIG-${idx + 1}`,
                name: inst.title,
                spaceTypeId: roomTypeToSpaceTypeId(inst.roomType),
                imageUrl: inst.imageUrl,
                description: inst.designFirm
                    ? `Reference installation by ${inst.designFirm}`
                    : 'Migrated from Inspiration gallery',
                bundle,
                isCustom: true,
                isUserUpload: true,
                designFirm: inst.designFirm,
                createdAt: inst.addedAt,
                updatedAt: new Date().toISOString(),
            }
        })
        window.localStorage.removeItem(legacyKey)
        // eslint-disable-next-line no-console
        console.info(`[F58a.2 migration] Migrated ${migrated.length} installations to custom spaces for tenant "${tenantSlug}".`)
        return migrated
    } catch {
        return []
    }
}

/** Input reducido para crear un custom setting · el hook completa id/timestamps
 *  y arma el bundle desde items sueltos.
 *
 *  F58a.4 · absorbe el flow del UploadInstallationModal · fields opcionales
 *  para el path "Upload photo & tag" del CreateEditSpaceModal. Cuando
 *  `imageUrl` viene set + `imageOverlay` con tags, el setting resultante
 *  queda con isUserUpload=true y renderiza en Photo view por default. */
export interface CreateCustomSpaceInput {
    code: string                    // "F-CUSTOM-1", "WC-LUX-2"
    name: string
    spaceTypeId: string
    description: string
    notes?: string[]
    items: Array<{
        productGroupCode: string    // usa productGroupCode del stub inferido O 'PROD' generic
        itemId: string              // en custom · usamos el product.id real del showroom
        qty: number
        label?: string
        // Fase 5 · para custom con Products reales del showroom, guardamos
        // metadata suficiente para renderizar sin depender de PRODUCT_STUBS
        productName?: string
        productBrand?: string
        productImageUrl?: string
        estimatedPrice?: number
    }>
    /** F58a.4 · Photo-tag path. dataURL de la foto uploaded (persist en
     *  localStorage) · si viene set, el setting resultante marca isUserUpload. */
    imageUrl?: string
    /** F58a.4 · Design firm attribution para uploads que provienen de
     *  installations reales de un partner (Gensler · HOK · etc). */
    designFirm?: string
    /** F58a.4 · Overlays clickeables sobre la imagen · cada tag apunta a un
     *  productId + coord xPct/yPct 0-100. */
    imageOverlay?: Array<{
        productId: string
        xPct: number
        yPct: number
        note?: string
    }>
}

function storageKey(tenantSlug: string): string {
    return `${STORAGE_PREFIX}-${tenantSlug}`
}

function loadFromStorage(tenantSlug: string): SpaceTypeSetting[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = window.localStorage.getItem(storageKey(tenantSlug))
        if (!raw) return []
        const parsed = JSON.parse(raw) as SpaceTypeSetting[]
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function saveToStorage(tenantSlug: string, settings: SpaceTypeSetting[]): void {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.setItem(storageKey(tenantSlug), JSON.stringify(settings))
    } catch {
        // storage full · silent fail (mismo pattern que QuoteContext)
    }
}

function genId(): string {
    // Determinístico-ish sin Math.random en algunos entornos · usamos performance.now
    // como suffix aleatorio de fallback. En cliente browser está disponible.
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    return `custom-${Date.now()}-${Math.floor(now * 1000) % 10000}`
}

/** Convierte CreateCustomSpaceInput → SpaceTypeSetting listo para persistir. */
function inputToSetting(input: CreateCustomSpaceInput): SpaceTypeSetting {
    const id = genId()
    const now = new Date().toISOString()
    const bundleItems = input.items.map(it => ({
        productGroupCode: it.productGroupCode,
        itemId: it.itemId,
        qty: it.qty,
        label: it.label,
    }))
    // Estimated cost = suma de estimatedPrice * qty (o 0 si no hay precio)
    const totalEstimate = input.items.reduce(
        (sum, it) => sum + ((it.estimatedPrice ?? 0) * it.qty),
        0,
    )
    const isPhotoUpload = !!input.imageUrl
    const bundle: SpaceBundle = {
        id: `bundle-${id}`,
        settingId: id,
        items: bundleItems,
        // Uploads no llevan cost estimate (los items entran por tags, qty=1, no
        // hay pricing precomputed) · dejamos 0-0 para que el card no exponga
        // números fake. Bundle mode preserva el estimate ±10% habitual.
        estimatedCostMin: isPhotoUpload ? 0 : Math.floor(totalEstimate * 0.9),
        estimatedCostMax: isPhotoUpload ? 0 : Math.ceil(totalEstimate * 1.1),
        currencyId: 'USD',
        imageOverlay: input.imageOverlay,
    }
    return {
        id,
        code: input.code,
        name: input.name,
        spaceTypeId: input.spaceTypeId,
        imageUrl: input.imageUrl,
        description: input.description,
        notes: input.notes,
        bundle,
        isCustom: true,
        isUserUpload: isPhotoUpload || undefined,
        designFirm: input.designFirm,
        createdAt: now,
        updatedAt: now,
    }
}

export interface UseCustomSpacesReturn {
    customSettings: SpaceTypeSetting[]
    /** Todos los settings (seed + custom) para consumir en grid/detail. */
    allSettings: SpaceTypeSetting[]
    createCustom: (input: CreateCustomSpaceInput) => SpaceTypeSetting
    updateCustom: (id: string, input: CreateCustomSpaceInput) => SpaceTypeSetting | null
    duplicateCustom: (id: string) => SpaceTypeSetting | null
    deleteCustom: (id: string) => void
    isCustomSettingId: (id: string) => boolean
    findSetting: (id: string) => SpaceTypeSetting | undefined
}

export function useCustomSpaces(): UseCustomSpacesReturn {
    const { currentTenant } = useTenant()
    // currentTenant es un string (slug del tenant) según TenantContext
    const tenantSlug = currentTenant
    const [customSettings, setCustomSettings] = useState<SpaceTypeSetting[]>(() => {
        // F58a.2 · init con merge legacy migration + existing custom.
        // La migración corre 1 vez (borra la legacy key después) · lecturas
        // subsecuentes solo devuelven [] y no producen duplicados.
        const existing = loadFromStorage(tenantSlug)
        const migrated = migrateFromLegacyInstallations(tenantSlug)
        return migrated.length > 0 ? [...existing, ...migrated] : existing
    })

    // Recarga cuando cambia el tenant (multi-tenant demo)
    useEffect(() => {
        const existing = loadFromStorage(tenantSlug)
        const migrated = migrateFromLegacyInstallations(tenantSlug)
        setCustomSettings(migrated.length > 0 ? [...existing, ...migrated] : existing)
    }, [tenantSlug])

    // Persist en cada mutation
    useEffect(() => {
        saveToStorage(tenantSlug, customSettings)
    }, [customSettings, tenantSlug])

    const createCustom = useCallback((input: CreateCustomSpaceInput): SpaceTypeSetting => {
        const setting = inputToSetting(input)
        setCustomSettings(prev => [...prev, setting])
        return setting
    }, [])

    const updateCustom = useCallback((id: string, input: CreateCustomSpaceInput): SpaceTypeSetting | null => {
        let updated: SpaceTypeSetting | null = null
        setCustomSettings(prev => prev.map(s => {
            if (s.id !== id) return s
            const rebuilt = inputToSetting(input)
            updated = {
                ...rebuilt,
                id: s.id,              // preserva id
                createdAt: s.createdAt, // preserva createdAt
                updatedAt: new Date().toISOString(),
                bundle: { ...rebuilt.bundle, id: s.bundle.id, settingId: s.id },
            }
            return updated
        }))
        return updated
    }, [])

    const duplicateCustom = useCallback((id: string): SpaceTypeSetting | null => {
        const source = customSettings.find(s => s.id === id)
            ?? SPACE_TYPE_SETTINGS.find(s => s.id === id)
        if (!source) return null
        const now = new Date().toISOString()
        const newId = genId()
        const clone: SpaceTypeSetting = {
            ...source,
            id: newId,
            code: `${source.code}-COPY`,
            name: `${source.name} (Copy)`,
            isCustom: true,
            createdAt: now,
            updatedAt: now,
            bundle: {
                ...source.bundle,
                id: `bundle-${newId}`,
                settingId: newId,
                items: source.bundle.items.map(i => ({ ...i })),
            },
        }
        setCustomSettings(prev => [...prev, clone])
        return clone
    }, [customSettings])

    const deleteCustom = useCallback((id: string) => {
        setCustomSettings(prev => prev.filter(s => s.id !== id))
    }, [])

    const isCustomSettingId = useCallback(
        (id: string) => customSettings.some(s => s.id === id),
        [customSettings],
    )

    const findSetting = useCallback(
        (id: string): SpaceTypeSetting | undefined =>
            customSettings.find(s => s.id === id) ?? SPACE_TYPE_SETTINGS.find(s => s.id === id),
        [customSettings],
    )

    const allSettings = [...SPACE_TYPE_SETTINGS, ...customSettings]

    return {
        customSettings,
        allSettings,
        createCustom,
        updateCustom,
        duplicateCustom,
        deleteCustom,
        isCustomSettingId,
        findSetting,
    }
}
