// Etapa 3 — Mock admin de catálogos.
// Portado verbatim de `INITIAL_CATALOGS` en el CatalogLibrary removido de expert-hub
// (`_catalog_ref/expert-hub-removed/components/catalogs/CatalogLibrary.tsx`), ahora tipado.

import type { Catalog } from '../types'

// Phase 1 Fix #1 — Catalogs alineados a los brands reales de manufacturers.ts
// (Allermuir / Allsteel / AIS) · esto permite que la chips merge funcione como filter.
// Allermuir mantiene el narrative de needs-sync (Phase 1 Fix #2/#3) · 14 days + Update Avail.

export const CATALOGS: Catalog[] = [
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
