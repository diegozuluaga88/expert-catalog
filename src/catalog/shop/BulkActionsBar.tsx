import { useState } from 'react'
import { GitCompareArrows, FolderPlus, FileText, Plus, Check, Heart } from 'lucide-react'

// Etapa 8.3 — Barra flotante de acciones masivas (Figma · Bulk Actions).
// Diego polish · removido Export · agregado Save to Favorites · Request Quote
// ahora dispara queue-mode del ProductDetailPanel para configurar cada item.

const PROJECTS = ['Project 1', 'Project 2', 'Project 3', 'Project 4']

interface BulkActionsBarProps {
  count: number
  onDeselectAll: () => void
  onCompare: () => void
  onAddToFavorites: () => void
  onRequestQuote: () => void
}

const actionBtn =
  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted'

export default function BulkActionsBar({
  count,
  onDeselectAll,
  onCompare,
  onAddToFavorites,
  onRequestQuote,
}: BulkActionsBarProps) {
  const [projOpen, setProjOpen] = useState(false)
  const [projSel, setProjSel] = useState<Set<string>>(new Set())

  const toggleProject = (p: string) =>
    setProjSel((prev) => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-lg dark:shadow-glow-md">
        <div className="flex items-center gap-2 border-r border-border pr-3">
          <span className="whitespace-nowrap text-sm font-semibold text-foreground">
            {count} Product{count === 1 ? '' : 's'} Selected
          </span>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-xs text-muted-foreground underline transition-colors hover:text-foreground"
          >
            Deselect All
          </button>
        </div>

        <button type="button" onClick={onCompare} className={actionBtn}>
          <GitCompareArrows className="h-4 w-4" />
          Compare
        </button>

        <button type="button" onClick={onAddToFavorites} className={actionBtn} title="Save selected products to your favorites">
          <Heart className="h-4 w-4" />
          Save to Favorites
        </button>

        <div className="relative">
          <button type="button" onClick={() => setProjOpen((o) => !o)} className={actionBtn}>
            <FolderPlus className="h-4 w-4" />
            Add to Project
          </button>
          {projOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProjOpen(false)} />
              <div className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-xl border border-border bg-card p-1 shadow-lg">
                {PROJECTS.map((p) => {
                  const checked = projSel.has(p)
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleProject(p)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      {p}
                    </button>
                  )
                })}
                <button
                  type="button"
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Create Project
                </button>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onRequestQuote}
          title="Configure each selected product in the panel · added to your active quote one by one"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FileText className="h-4 w-4" />
          Request Quote ({count})
        </button>
      </div>
    </div>
  )
}
