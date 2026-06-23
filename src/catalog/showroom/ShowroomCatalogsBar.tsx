import { useState } from 'react'
import { RefreshCw, Upload, ChevronDown, CheckCircle2 } from 'lucide-react'
import { CATALOGS } from '../data/catalogs'
import type { Catalog } from '../types'

// Etapa 9.7 — Showroom: traer catálogos + sincronización (ligero, reusa CATALOGS y el patrón de
// CatalogLibrary). El botón Import abre el CatalogImportModal ya portado (lo cablea ShowroomPage).

interface ShowroomCatalogsBarProps {
  onImport: () => void
}

export default function ShowroomCatalogsBar({ onImport }: ShowroomCatalogsBarProps) {
  const [open, setOpen] = useState(true)
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
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 p-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-bold text-foreground"
        >
          Connected Catalogs
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {catalogs.length}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button
          type="button"
          onClick={onImport}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          Import Catalog
        </button>
      </div>

      {open && (
        <div className="flex flex-wrap gap-2 border-t border-border p-3">
          {catalogs.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.items} items · {c.status} · {c.lastSync}
                </p>
              </div>
              <button
                type="button"
                disabled={syncingId === c.id}
                onClick={() => sync(c)}
                title="Sync catalog"
                aria-label={`Sync ${c.name}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${syncingId === c.id ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-foreground" />
          {toast}
        </div>
      )}
    </div>
  )
}
