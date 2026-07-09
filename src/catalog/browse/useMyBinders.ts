// MRL Fase 2 (2026-07-09) · Hook para tracking de manufacturers guardados
// como "My Binders" (metáfora del referente myresourcelibrary.com donde el
// user pinnea binders a su biblioteca personal). Persistido en localStorage
// bajo `catalog-my-binders` · cross-tab sync via storage events.
//
// Bootstrap · si el storage está vacío al primer load, arrancamos con 3
// binders seed (uno chico, uno mediano, uno grande) para que el estado
// activo se vea desde el primer render de la demo.
//
// Bugfix post-F7 (2026-07-09) · el hook original usaba `useState` local,
// lo que creaba una instancia aislada por cada consumidor (LibraryPage +
// 1 por cada BinderLibrary del shelf = ~36 stores desconectados). El toggle
// solo re-renderizaba la instancia local · el filtro y el chip del shelf,
// que dependen de `myBinderIds` de LibraryPage, quedaban stale. Migrado
// a `useSyncExternalStore` con store module-scope · una única fuente de
// verdad + intra-tab sync automático + cross-tab via storage event.

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'catalog-my-binders'

/** IDs del seed inicial · aparecen como "guardados" en la primera visita.
 *  Elegidos para cubrir los 3 tamaños (sm / md / lg) y ambos types
 *  (products / materials) del seed de Fase 1. */
const SEED_IDS = [
    'allermuir',      // md · products · existente desde antes
    'halden-fabrics', // sm · materials · nuevo Fase 1
    'ridgeline',      // lg · products · nuevo Fase 1
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
        if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === null) {
            const seed = new Set(SEED_IDS)
            writeToStorage(seed)
            return seed
        }
    } catch {
        /* noop */
    }
    return readFromStorage()
}

/* ═══════════════════════════════════════════════════════════════════════
   Module-scope store · una única fuente de verdad para toda la app.
   Todos los consumidores del hook comparten el mismo Set y se re-renderean
   juntos cuando alguno hace toggle (via useSyncExternalStore).
   ═══════════════════════════════════════════════════════════════════════ */

let currentIds: Set<string> = bootstrapIfNeeded()
const listeners = new Set<() => void>()

function notify(): void {
    listeners.forEach((cb) => cb())
}

function subscribe(cb: () => void): () => void {
    listeners.add(cb)
    return () => {
        listeners.delete(cb)
    }
}

function getSnapshot(): Set<string> {
    return currentIds
}

function getServerSnapshot(): Set<string> {
    // SSR / hydration · devolvemos el seed (nunca hay localStorage disponible).
    return new Set(SEED_IDS)
}

function setIds(next: Set<string>): void {
    // Nueva referencia para que useSyncExternalStore detecte el cambio.
    currentIds = next
    writeToStorage(next)
    notify()
}

// Cross-tab sync · storage event solo dispara en OTRAS tabs · lo suscribimos
// una sola vez a nivel módulo, no por instancia del hook.
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            currentIds = readFromStorage()
            notify()
        }
    })
}

/* ═══════════════════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════════════════ */

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
    const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

    const isInMyBinders = useCallback(
        (manufacturerId: string): boolean => ids.has(manufacturerId),
        [ids],
    )

    const toggleBinder = useCallback((manufacturerId: string) => {
        const next = new Set(currentIds)
        if (next.has(manufacturerId)) {
            next.delete(manufacturerId)
        } else {
            next.add(manufacturerId)
        }
        setIds(next)
    }, [])

    return {
        myBinderIds: ids,
        isInMyBinders,
        toggleBinder,
        count: ids.size,
    }
}
