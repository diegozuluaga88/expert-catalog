// F50 · Etapa 9 (P1 search) · v2 · historial de búsquedas persistido por
// cliente. Se consume desde el SearchCommandPalette para mostrar "Recent
// searches" cuando el input está vacío.
//
// Se guarda como array LIFO capped a 8 entradas. Sin timestamps · el orden
// implica recencia. Cuando el usuario repite una búsqueda, sube al top.

import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../../TenantContext'

const STORAGE_KEY_PREFIX = 'catalog-search-history-'
const MAX_ENTRIES = 8

function loadHistory(tenantSlug: string): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + tenantSlug)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((v) => typeof v === 'string').slice(0, MAX_ENTRIES)
    } catch {
        return []
    }
}

function saveHistory(tenantSlug: string, entries: string[]) {
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
    } catch {
        /* noop */
    }
}

export interface UseSearchHistoryReturn {
    history: string[]
    push: (query: string) => void
    remove: (query: string) => void
    clear: () => void
}

export function useSearchHistory(): UseSearchHistoryReturn {
    const { currentTenant } = useTenant()
    const tenantSlug = (currentTenant as unknown as string) || 'default'
    const [history, setHistory] = useState<string[]>(() => loadHistory(tenantSlug))

    useEffect(() => {
        setHistory(loadHistory(tenantSlug))
    }, [tenantSlug])

    useEffect(() => {
        saveHistory(tenantSlug, history)
    }, [tenantSlug, history])

    const push = useCallback((raw: string) => {
        const query = raw.trim()
        if (!query) return
        setHistory((prev) => {
            const withoutDup = prev.filter((q) => q.toLowerCase() !== query.toLowerCase())
            return [query, ...withoutDup].slice(0, MAX_ENTRIES)
        })
    }, [])

    const remove = useCallback((raw: string) => {
        const query = raw.trim().toLowerCase()
        setHistory((prev) => prev.filter((q) => q.toLowerCase() !== query))
    }, [])

    const clear = useCallback(() => setHistory([]), [])

    return { history, push, remove, clear }
}
