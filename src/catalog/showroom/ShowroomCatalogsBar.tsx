import { useState } from 'react'
import { RefreshCw, Upload, CheckCircle2 } from 'lucide-react'
import { CATALOGS } from '../data/catalogs'
import type { Catalog, CatalogStatus } from '../types'

// Etapa 9.8 — Showroom: barra compacta de catálogos en UNA línea (detalles en hover) + Import + Sync.
// Phase 1 Fix #2 — Sync state dot per chip · refleja CatalogStatus visualmente:
//   Active → sin dot (default discreto)
//   Update Avail. → amber dot animate-pulse · llama la atención al outlier
//   Archived → gris muted dot
// Aprovecha el data ya existente (Herman Miller con 'Update Avail.' + lastSync 14d post Fix #3)
// para hacer evidente cuál catálogo necesita sync.

interface ShowroomCatalogsBarProps {
  onImport: () => void
}

function StatusDot({ status }: { status: CatalogStatus }) {
  if (status === 'Active') return null
  if (status === 'Archived') {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
      />
    )
  }
  // 'Update Avail.'
  return (
    <span aria-hidden="true" className="relative inline-flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
    </span>
  )
}

function statusLabel(status: CatalogStatus): string {
  switch (status) {
    case 'Active':
      return 'Up to date'
    case 'Update Avail.':
      return 'Update available · sync recommended'
    case 'Archived':
      return 'Archived'
  }
}

export default function ShowroomCatalogsBar({ onImport }: ShowroomCatalogsBarProps) {
  const [catalogs, setCatalogs] = useState<Catalog[]>(CATALOGS)
  const [syncingId, setSyncingId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const sync = (c: Catalog) => {
    setSyncingId(c.id)
    setTimeout(() => {
      setCatalogs((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, lastSync: 'Just now', status: 'Active' } : x))
      )
      setSyncingId(null)
      setToast(`${c.name} synced`)
      setTimeout(() => setToast(null), 2500)
    }, 1400)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
      <span className="text-sm font-bold text-foreground">Connected Catalogs</span>
      <span className="rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
        {catalogs.length}
      </span>

      <div className="flex flex-wrap items-center gap-1.5">
        {catalogs.map((c) => (
          <span
            key={c.id}
            title={`${c.name} · ${c.items} items · ${statusLabel(c.status)} · synced ${c.lastSync}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-1 pl-3 pr-1 text-xs"
          >
            <StatusDot status={c.status} />
            <span className="font-medium text-foreground">{c.name}</span>
            <button
              type="button"
              disabled={syncingId === c.id}
              onClick={() => sync(c)}
              aria-label={`Sync ${c.name}`}
              title={`Sync ${c.name}`}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${syncingId === c.id ? 'animate-spin' : ''}`} />
            </button>
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onImport}
        className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Upload className="h-4 w-4" />
        Import Catalog
      </button>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-foreground" />
          {toast}
        </div>
      )}
    </div>
  )
}
