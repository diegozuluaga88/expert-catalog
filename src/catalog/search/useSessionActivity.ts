// F50 · Etapa 9 (P1 search session-aware) · v2 · tracker de actividad
// reciente del dealer para poder rerankear resultados en el search
// (products vistos recientemente + brands en colecciones).
//
// Sin telemetría real, este hook usa localStorage para almacenar:
//   · viewedProductIds · últimos 20 productos que el dealer abrió · LIFO
//   · viewedBrands     · derivado de viewedProductIds (top 5 brands)
//
// Los "savedBrands" se derivan afuera desde `useMyBinders` —la Custom
// Library del usuario— · este módulo se enfoca solo en views para no
// duplicar responsabilidad.
//
// Cuando exista telemetría real (Segment / Amplitude / backend propio),
// este módulo se convierte en wrapper de esos eventos.

import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../../TenantContext'

const STORAGE_KEY_PREFIX = 'catalog-session-views-'
const MAX_VIEWS = 20

function loadViews(tenantSlug: string): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + tenantSlug)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((v) => typeof v === 'string').slice(0, MAX_VIEWS)
    } catch {
        return []
    }
}

function saveViews(tenantSlug: string, entries: string[]) {
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug, JSON.stringify(entries.slice(0, MAX_VIEWS)))
    } catch {
        /* noop */
    }
}

export interface UseSessionActivityReturn {
    /** Últimos N productIds que el dealer abrió · orden LIFO (más reciente primero). */
    viewedProductIds: string[]
    /** Callback para registrar la vista de un producto. Idempotente contra dup consecutivos. */
    recordView: (productId: string) => void
    /** Borrar historial (para testing). */
    clearViews: () => void
}

export function useSessionActivity(): UseSessionActivityReturn {
    const { currentTenant } = useTenant()
    const tenantSlug = (currentTenant as unknown as string) || 'default'
    const [viewedProductIds, setViews] = useState<string[]>(() => loadViews(tenantSlug))

    useEffect(() => {
        setViews(loadViews(tenantSlug))
    }, [tenantSlug])

    useEffect(() => {
        saveViews(tenantSlug, viewedProductIds)
    }, [tenantSlug, viewedProductIds])

    const recordView = useCallback((productId: string) => {
        setViews((prev) => {
            const withoutDup = prev.filter((id) => id !== productId)
            return [productId, ...withoutDup].slice(0, MAX_VIEWS)
        })
    }, [])

    const clearViews = useCallback(() => setViews([]), [])

    return { viewedProductIds, recordView, clearViews }
}
