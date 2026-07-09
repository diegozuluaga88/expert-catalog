// MRL Fase 2 (2026-07-09) · Hook para tracking de manufacturers guardados
// como "My Binders" (metáfora del referente myresourcelibrary.com donde el
// user pinnea binders a su biblioteca personal). Persistido en localStorage
// bajo `catalog-my-binders` · cross-tab sync via storage events.
//
// Bootstrap · si el storage está vacío al primer load, arrancamos con 3
// binders seed (uno chico, uno mediano, uno grande) para que el estado
// activo se vea desde el primer render de la demo.

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'catalog-my-binders'

/** IDs del seed inicial · aparecen como "guardados" en la primera visita.
 *  Elegidos para cubrir los 3 tamaños (sm / md / lg) y ambos types
 *  (products / materials) del seed de Fase 1. */
const SEED_IDS = [
    'allermuir',   // md · products · existente desde antes
    'halden-fabrics', // sm · materials · nuevo Fase 1
    'ridgeline',   // lg · products · nuevo Fase 1
]

function readFromStorage(): Set<string> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return new Set(SEED_IDS)
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return new Set(SEED_IDS)
        return new Set(parsed as string[])
    } catch {
        return new Set(SEED_IDS)
    }
}

function writeToStorage(ids: Set<string>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
    } catch {
        /* quota / private-mode · noop */
    }
}

/** Bootstrap idempotente · si el storage aún no fue escrito por primera vez,
 *  persistimos el seed inicial una sola vez para que sea inspeccionable en
 *  DevTools desde el primer load. */
function bootstrapIfNeeded(): Set<string> {
    try {
        if (localStorage.getItem(STORAGE_KEY) === null) {
            const seed = new Set(SEED_IDS)
            writeToStorage(seed)
            return seed
        }
    } catch {
        /* noop */
    }
    return readFromStorage()
}

export interface UseMyBindersReturn {
    /** Set de IDs de manufacturers actualmente guardados como "My Binders". */
    myBinderIds: Set<string>
    /** Query rápida sin destructurar el set. */
    isInMyBinders: (manufacturerId: string) => boolean
    /** Toggle · agrega si no está, remueve si está. Persiste + notifica. */
    toggleBinder: (manufacturerId: string) => void
    /** Contador · para badges y chip de filtro activo. */
    count: number
}

export function useMyBinders(): UseMyBindersReturn {
    const [ids, setIds] = useState<Set<string>>(() => bootstrapIfNeeded())

    // Cross-tab sync · si otra tab hace toggle, esta se entera y re-render.
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                setIds(readFromStorage())
            }
        }
        window.addEventListener('storage', handler)
        return () => window.removeEventListener('storage', handler)
    }, [])

    const isInMyBinders = useCallback(
        (manufacturerId: string): boolean => ids.has(manufacturerId),
        [ids],
    )

    const toggleBinder = useCallback((manufacturerId: string) => {
        setIds((prev) => {
            const next = new Set(prev)
            if (next.has(manufacturerId)) {
                next.delete(manufacturerId)
            } else {
                next.add(manufacturerId)
            }
            writeToStorage(next)
            return next
        })
    }, [])

    return {
        myBinderIds: ids,
        isInMyBinders,
        toggleBinder,
        count: ids.size,
    }
}
