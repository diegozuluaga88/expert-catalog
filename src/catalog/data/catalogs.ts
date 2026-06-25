// Etapa 3 — Mock admin de catálogos.
// Portado verbatim de `INITIAL_CATALOGS` en el CatalogLibrary removido de expert-hub
// (`_catalog_ref/expert-hub-removed/components/catalogs/CatalogLibrary.tsx`), ahora tipado.
//
// Phase 1 polish · Reactive store con useSyncExternalStore para que mutaciones desde
// el ShowroomCatalogsBar o el CatalogImportModal Edit & Sync tab se reflejen en TODOS
// los surfaces que dependen del catalog state (product cards con itemStatus 'Out of
// sync' tienen que dejar de mostrarse cuando se sincroniza el catalog asociado).
// Pattern · sin Context provider · módulo-level singleton + subscribe API.

import { useSyncExternalStore } from 'react'
import type { Catalog } from '../types'

// Phase 1 Fix #1 — Catalogs alineados a los brands reales de manufacturers.ts
// (Allermuir / Allsteel / AIS) · esto permite que la chips merge funcione como filter.
// Allermuir mantiene el narrative de needs-sync (Phase 1 Fix #2/#3) · 14 days + Update Avail.

const INITIAL_CATALOGS: Catalog[] = [
  {
    id: 1,
    name: 'Allermuir',
    version: '2023 Master',
    items: 312,
    lastSync: '14 days ago',
    cover: 'bg-blue-600',
    status: 'Update Avail.',
    owner: 'John Doe',
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 2,
    name: 'Allsteel',
    version: 'July 2023',
    items: 86,
    lastSync: '2 hrs ago',
    cover: 'bg-red-600',
    status: 'Active',
    owner: 'John Doe',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 3,
    name: 'AIS',
    version: 'Q3 2023',
    items: 124,
    lastSync: '1 day ago',
    cover: 'bg-zinc-800',
    status: 'Active',
    owner: 'Sarah Smith',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
  },
]

let catalogsState: Catalog[] = INITIAL_CATALOGS
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot(): Catalog[] {
  return catalogsState
}

/**
 * Mutar el store · requiere new array reference (immutable update) para que
 * useSyncExternalStore detecte el cambio en consumidores.
 */
export function setCatalogs(updater: (prev: Catalog[]) => Catalog[]) {
  catalogsState = updater(catalogsState)
  listeners.forEach((cb) => cb())
}

/**
 * Resetea el store al estado inicial. Diego: "al cambiar de página o sección la
 * sincronización debería reiniciarse · ahora está persistiendo". Cada page-level
 * component del catalog area llama este reset on-mount para que las simulaciones
 * de sync sean ephemeral (no persistan cross-navegación) · refleja que es una
 * demo, no un backend real.
 */
export function resetCatalogs() {
  catalogsState = INITIAL_CATALOGS
  listeners.forEach((cb) => cb())
}

/**
 * Hook reactivo · cualquier componente que lo use re-rendea cuando el store cambia.
 */
export function useCatalogs(): Catalog[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Snapshot non-reactive · para callers que NO son componentes React (funciones puras
 * como resolveItemStatus fallback). Lee el último estado del store.
 */
export function getCatalogsSnapshot(): Catalog[] {
  return catalogsState
}

/** Backward compat · re-export del array bajo el nombre original.
 * Apunta al INITIAL state · NO se actualiza after-mutation. Nuevos callers
 * deben usar `useCatalogs()` (reactivo) o `getCatalogsSnapshot()` (puro). */
export const CATALOGS = INITIAL_CATALOGS
