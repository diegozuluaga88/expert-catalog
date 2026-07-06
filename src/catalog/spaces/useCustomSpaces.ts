// Fase 5 · useCustomSpaces hook (2026-07-06)
// Store per-tenant de SpaceTypeSettings creados por el dealer (isCustom: true).
// Persist en localStorage con key `expert-hub-custom-spaces-{tenantSlug}`
// (mismo pattern que QuoteContext.drafts).
//
// Los custom se mezclan con los seed en el grid principal via
// `mergeCustomIntoSettings()` · el resto de la UI no distingue seed vs custom
// excepto por el badge "Custom" y las acciones inline (edit/duplicate/delete).

import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../../TenantContext'
import type { SpaceTypeSetting, SpaceBundle } from '../types'
import { SPACE_TYPE_SETTINGS } from '../data/spaceTypes'

const STORAGE_PREFIX = 'expert-hub-custom-spaces'

/** Input reducido para crear un custom setting · el hook completa id/timestamps
 *  y arma el bundle desde items sueltos. */
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
    const bundle: SpaceBundle = {
        id: `bundle-${id}`,
        settingId: id,
        items: bundleItems,
        estimatedCostMin: Math.floor(totalEstimate * 0.9),
        estimatedCostMax: Math.ceil(totalEstimate * 1.1),
        currency: 'USD',
    }
    return {
        id,
        code: input.code,
        name: input.name,
        spaceTypeId: input.spaceTypeId,
        description: input.description,
        notes: input.notes,
        bundle,
        isCustom: true,
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
    const [customSettings, setCustomSettings] = useState<SpaceTypeSetting[]>(
        () => loadFromStorage(tenantSlug),
    )

    // Recarga cuando cambia el tenant (multi-tenant demo)
    useEffect(() => {
        setCustomSettings(loadFromStorage(tenantSlug))
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
