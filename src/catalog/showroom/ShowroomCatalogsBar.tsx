import { useState } from 'react'
import { RefreshCw, Settings2, CheckCircle2, FileText } from 'lucide-react'
import { useCatalogs, setCatalogs } from '../data/catalogs'
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
  // Phase 5 Fix #14 · trigger del IngestQuoteModal
  onUploadQuote: () => void
  // Phase 1 Fix #1 — Dual-purpose chips: filter + sync
  // `null` = "All" (no filter active)
  selectedBrand: string | null
  onSelectBrand: (brand: string | null) => void
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

// Phase 1 polish · simula delta del sync (items updated/added) para dar feedback
// específico de lo que cambió · 0 indica que era ya up-to-date. Determinístico por
// id del catálogo + status para que la misma tabla refresque consistente.
interface SyncDelta {
  updated: number
  added: number
}

function simulateSyncDelta(c: Catalog): SyncDelta {
  // Si el catalog estaba 'Update Avail.', simulamos un delta mayor (más drift)
  // sino delta pequeño (era casi up-to-date)
  const seed = c.id * 7
  if (c.status === 'Update Avail.') {
    return { updated: (seed % 12) + 8, added: (seed % 5) + 1 }
  }
  return { updated: (seed % 4) + 1, added: 0 }
}

interface SyncToast {
  name: string
  delta: SyncDelta
}

export default function ShowroomCatalogsBar({
  onImport,
  onUploadQuote,
  selectedBrand,
  onSelectBrand,
}: ShowroomCatalogsBarProps) {
  // Phase 1 polish · catalogs ahora vienen del store reactivo (useCatalogs) ·
  // mutaciones se propagan a TODOS los surfaces (Product cards itemStatus, modal
  // Edit & Sync tab, etc.) sin necesidad de Context provider.
  const catalogs = useCatalogs()
  const [syncingId, setSyncingId] = useState<number | null>(null)
  const [toast, setToast] = useState<SyncToast | null>(null)

  const sync = (c: Catalog) => {
    setSyncingId(c.id)
    setTimeout(() => {
      const delta = simulateSyncDelta(c)
      setCatalogs((prev) =>
        prev.map((x) =>
          x.id === c.id
            ? {
                ...x,
                lastSync: 'Just now',
                status: 'Active' as CatalogStatus,
                items: x.items + delta.added,
              }
            : x
        )
      )
      setSyncingId(null)
      setToast({ name: c.name, delta })
      setTimeout(() => setToast(null), 3500)
    }, 1400)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
      <span className="text-sm font-bold text-foreground">Connected Catalogs</span>
      <span className="rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
        {catalogs.length}
      </span>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* "All" chip · clears filter */}
        <button
          type="button"
          onClick={() => onSelectBrand(null)}
          aria-pressed={selectedBrand === null}
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
            selectedBrand === null
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-background text-foreground hover:bg-muted'
          }`}
        >
          All
        </button>

        {catalogs.map((c) => {
          const isSelected = selectedBrand === c.name
          return (
            <span
              key={c.id}
              title={`${c.name} · ${c.items} items · ${statusLabel(c.status)} · synced ${c.lastSync}`}
              className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-1 text-xs transition-colors ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              <StatusDot status={c.status} />
              <button
                type="button"
                onClick={() => onSelectBrand(isSelected ? null : c.name)}
                aria-pressed={isSelected}
                aria-label={`Filter by ${c.name}`}
                className="font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded"
              >
                {c.name}
              </button>
              <button
                type="button"
                disabled={syncingId === c.id}
                onClick={(e) => {
                  e.stopPropagation()
                  sync(c)
                }}
                aria-label={`Sync ${c.name}`}
                title={`Sync ${c.name}`}
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
                  isSelected
                    ? 'text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <RefreshCw className={`h-3 w-3 ${syncingId === c.id ? 'animate-spin' : ''}`} />
              </button>
            </span>
          )
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Diego polish · Manage Catalogs es secondary · la acción principal del
            operator B2B es ingestar transactions (Upload Quote/PO) que crea quotes. */}
        <button
          type="button"
          onClick={onImport}
          title="Manage connected catalogs · add, sync, or disconnect"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Settings2 className="h-4 w-4" />
          Manage Catalogs
        </button>
        {/* Phase 5 Fix #14 · Upload Quote/PO/ACK · acción primaria · Strata AI mapping */}
        <button
          type="button"
          onClick={onUploadQuote}
          title="Upload an existing Quote, Purchase Order, or Acknowledgement · Strata maps it to your catalog"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FileText className="h-4 w-4" />
          Upload Quote / PO
        </button>
      </div>

      {toast && <SyncResultToast toast={toast} />}
    </div>
  )
}

// Reusable toast con chips de delta · usado en este surface y en el Manage Catalogs modal
// (Phase 1 Fix #4 Edit & Sync tab). Export para poder consumir desde el modal.
export function SyncResultToast({ toast }: { toast: SyncToast }) {
  const { name, delta } = toast
  const isUpToDate = delta.updated === 0 && delta.added === 0
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground" />
      <div className="flex flex-col gap-1.5">
        <span className="font-semibold text-foreground">{name} synced</span>
        {isUpToDate ? (
          <span className="text-xs text-muted-foreground">Already up to date</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {delta.updated > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                <span className="font-bold">{delta.updated}</span>
                {delta.updated === 1 ? 'item updated' : 'items updated'}
              </span>
            )}
            {delta.added > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="font-bold">+{delta.added}</span>
                new
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper export para el modal Edit & Sync (reusa la misma simulación)
export { simulateSyncDelta }
export type { SyncDelta, SyncToast }
