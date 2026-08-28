import { useMemo, useState, type ReactNode } from 'react'
import { MagnifyingGlassIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { PanelLeft, PanelLeftClose } from 'lucide-react'
import type { Manufacturer, LibraryTab, ViewMode } from '../types'
import ViewToggle from './ViewToggle'
import { MOCK_PRODUCT_CATEGORIES, MOCK_MATERIAL_CATEGORIES } from '../data/mockCategories'
import { useMyBinders } from '../browse/useMyBinders'
import { matchesCategoryAlias } from '../data/categoryAliases'

interface FilterSidebarProps {
  manufacturers: Manufacturer[]
  activeTab: LibraryTab
  onTabChange: (t: LibraryTab) => void
  selectedCategory: string | null
  onCategoryChange: (cat: string | null) => void
  // Reubicados desde la toolbar de LibraryPage al panel lateral (espejo de Product Catalog)
  search: string
  onSearchChange: (v: string) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  /** MRL Fase 6 · state del filtro "Custom Library" (owned por LibraryPage). */
  showMyBindersOnly?: boolean
  /** MRL Fase 6 · toggle del filtro "Custom Library". */
  onMyBindersToggle?: () => void
  /** MRL Fase 8 · Set de tags activos (quickship, gsa, cet, cil) owned por
   *  LibraryPage · filtra el shelf por intersect con `manufacturer.tags`. */
  activeTags?: Set<string>
  /** MRL Fase 8 · setter de tags · reemplaza el set completo. */
  onTagsChange?: (next: Set<string>) => void
  /** F50 · Etapa 9-ext · v2 · slot opcional que se renderea al top del
   *  sidebar (arriba del search de manufacturers). v1 no lo pasa · v2
   *  aterriza aquí el botón "AI search" para tenerlo visible sin quitar
   *  el input clásico. Solo visible cuando el sidebar no está collapsed. */
  topSlot?: ReactNode
  /** F50 · Etapa 9 (integración) · v2 · si viene, el input clásico de
   *  search se transforma en un button visualmente idéntico que dispara
   *  este handler (en vez de escribir directo al state). Se usa para wire
   *  el input al AI search palette como trigger único. v1 no lo pasa. */
  onSearchClick?: () => void
  /** Slot opcional al final del sidebar, después de todos los filtros. */
  bottomSlot?: ReactNode
  /** Diego ask (2026-08-28) · si viene, cada marca de la Custom Library
   *  es clicable y abre su binder. Sin él la sección se sigue mostrando
   *  pero solo como lectura. */
  onSelectManufacturer?: (m: Manufacturer) => void
}

const SWATCH_COLORS = [
  '#ffffff', '#f3f4f6', '#d1d5db', '#9ca3af', '#6b7280', '#374151', '#1f2937', '#111827',
  '#fef9c3', '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
  '#fee2e2', '#fca5a5', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a',
  '#dcfce7', '#86efac', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#052e16',
  '#dbeafe', '#93c5fd', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554',
  '#ede9fe', '#c4b5fd', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#2e1065',
  '#fce7f3', '#f9a8d4', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', '#500724',
  '#cffafe', '#67e8f9', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344',
]

function FilterSection({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
      >
        <span>{label}</span>
        {open ? <MinusIcon className="w-3.5 h-3.5 text-muted-foreground" /> : <PlusIcon className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

function CheckItem({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 py-1 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-3.5 h-3.5 rounded border-border accent-primary shrink-0"
      />
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">{label}</span>
      {count != null && <span className="text-xs text-muted-foreground shrink-0">({count})</span>}
    </label>
  )
}

export default function FilterSidebar({
  manufacturers,
  activeTab,
  onTabChange,
  selectedCategory,
  onCategoryChange,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  showMyBindersOnly = false,
  onMyBindersToggle,
  activeTags,
  onTagsChange,
  topSlot,
  onSearchClick,
  bottomSlot,
  onSelectManufacturer,
}: FilterSidebarProps) {
  // Diego ask (2026-08-28) · la Custom Library sube por encima de los
  // filtros. Es lo que el usuario curó, no un filtro más · verla vale más
  // que recordar que existe detrás de un checkbox (Nielsen H6).
  const { myBinderIds } = useMyBinders()
  const savedManufacturers = manufacturers.filter(m => myBinderIds.has(m.id))

  // Diego ask (2026-08-28) · las categorías se cuentan contra el seed real
  // y las que no devuelven ninguna marca no se muestran.
  //
  // Antes venían de mockCategories con counts inventados calcados del
  // referente ("Education 5903", "Outdoor 2922"). 19 de 24 no tenían ni una
  // marca detrás: el clic prometía miles y entregaba un shelf vacío. Es el
  // callejón sin salida que Jeff dice no querer ("we never want to have a
  // Zero result or dead end" · SEARCH-11) y el hallazgo H3-4 del UX-REVIEW.
  //
  // Extiende la decisión del análisis heurístico de julio, que ya ocultaba
  // las categorías con mockCount === 0 (H8) · ahora el criterio es el dato
  // real en vez del mock. Se auto-mantiene: cuando entre seed nuevo o la
  // migración traiga datos, las categorías reaparecen solas con su conteo.
  const backedCategories = useMemo(() => {
    const source = activeTab === 'products' ? MOCK_PRODUCT_CATEGORIES : MOCK_MATERIAL_CATEGORIES
    return source
      .map(({ name }) => ({
        name,
        count: manufacturers.filter(m =>
          matchesCategoryAlias(m.categories.map(c => c.name), name),
        ).length,
      }))
      .filter(c => c.count > 0)
  }, [activeTab, manufacturers])

  const [collapsed, setCollapsed] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(true)
  const [categoryOpen, setCategoryOpen] = useState(true)
  const [colorOpen, setColorOpen] = useState(false)
  const [binderOpen, setBinderOpen] = useState(true)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  // MRL Fase 8 · el state de tags vive en LibraryPage · si el parent no
  // provee `activeTags`/`onTagsChange` (backward compat), degradamos a
  // no-op para no romper llamados existentes.
  const currentTags = activeTags ?? new Set<string>()
  const toggleTag = (t: string) => {
    if (!onTagsChange) return
    const n = new Set(currentTags)
    if (n.has(t)) n.delete(t)
    else n.add(t)
    onTagsChange(n)
  }
  const hasTag = (t: string) => currentTags.has(t)

  return (
    <aside className={`scrollbar-mrl shrink-0 bg-card border-r border-border flex flex-col overflow-y-auto h-full transition-[width] duration-200 ${collapsed ? 'w-12' : 'w-56'}`}>

      {/* Collapse / expand toggle (espejo de Product Catalog) */}
      <div className={`flex items-center border-b border-border px-2 py-2 ${collapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <>
      {/* F50 · Etapa 9-ext · v2 · slot opcional al top del sidebar. En v1
          nadie lo pasa · en v2 aterriza el botón "AI search". */}
      {topSlot && (
        <div className="px-4 pt-3 pb-2 border-b border-border">
          {topSlot}
        </div>
      )}
      {/* Search + View mode · reubicados desde la toolbar de LibraryPage (espejo de Product Catalog).
          F50 · Etapa 9 (integración) · si onSearchClick viene, el input clásico
          se transforma en un button visualmente idéntico que dispara el palette
          (el palette hace la búsqueda plain + NL + agrupación + reranker · un
          solo entry point). Si no viene (v1), sigue como input clásico. */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          {onSearchClick ? (
            <button
              type="button"
              onClick={onSearchClick}
              className="flex w-full items-center gap-2 pl-9 pr-2 py-1.5 text-sm bg-muted border border-border rounded-lg text-left transition-all hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60"
              title="Open search · shortcut: /"
            >
              <span className={`flex-1 truncate ${search ? 'text-foreground' : 'text-muted-foreground'}`}>
                {search || 'Search manufacturers, tags…'}
              </span>
              <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[9px] font-mono text-muted-foreground shrink-0">/</kbd>
            </button>
          ) : (
            <input
              type="search"
              placeholder="Search manufacturers…"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
            />
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">View</span>
          <ViewToggle value={viewMode} onChange={onViewModeChange} />
        </div>
      </div>

      {/* SELECT YOUR LIBRARY */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select your library</p>
        <div className="flex flex-col gap-0.5">
          {(['products', 'materials'] as LibraryTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`text-left text-sm py-1 px-2 rounded transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* CUSTOM LIBRARY · Diego ask (2026-08-28) · va antes de los filtros.
          Solo se renderiza si hay marcas guardadas · una sección vacía en la
          posición más visible del sidebar sería ruido. */}
      {savedManufacturers.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Custom Library
            </p>
            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
              {savedManufacturers.length}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 mb-2">
            {savedManufacturers.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectManufacturer?.(m)}
                disabled={!onSelectManufacturer}
                className="group flex items-center gap-2 text-left text-sm py-1 px-2 rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default disabled:hover:bg-transparent"
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-sm border border-border"
                  style={{ backgroundColor: m.bgColor }}
                />
                <span className="min-w-0 truncate">{m.name}</span>
              </button>
            ))}
          </div>

          {onMyBindersToggle && (
            <CheckItem
              label="Show only these"
              checked={showMyBindersOnly}
              onChange={() => onMyBindersToggle()}
            />
          )}
        </div>
      )}

      {/* BINDER FILTERS · Diego ask (2026-08-28) · sube al bloque superior,
          debajo de "Select your library". Filtra binders, así que pertenece
          con lo demás que habla de binders · no al final, después de Category
          y Color, que filtran producto.
          Comparte `activeTags` con la sección Tags · un click acá se refleja
          en ambos accordions (duplicación del referente · anotada en
          UX-REVIEW.md como H3-2). */}
      <FilterSection label="Binder Filters" open={binderOpen} onToggle={() => setBinderOpen(o => !o)}>
        <CheckItem label="QuickShip" checked={hasTag('quickship')} onChange={() => toggleTag('quickship')} />
        {activeTab === 'products' && (
          <>
            <CheckItem label="GSA" checked={hasTag('gsa')} onChange={() => toggleTag('gsa')} />
            <CheckItem label="CET Extension" checked={hasTag('cet')} onChange={() => toggleTag('cet')} />
          </>
        )}
      </FilterSection>

      {/* FILTER BY label */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Filter by</p>
        <button
          onClick={() => {
            onCategoryChange(null)
            setSelectedColor(null)
            if (showMyBindersOnly && onMyBindersToggle) onMyBindersToggle()
            if (onTagsChange) onTagsChange(new Set())
          }}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* TAGS */}
      <FilterSection label="Tags" open={tagsOpen} onToggle={() => setTagsOpen(o => !o)}>
        {activeTab === 'products' ? (
          <>
            {/* MRL Fase 8 · wire real al filtro por tags · Set compartido con
                Binder Filters (mismo state, dos entry points UI del referente). */}
            <CheckItem label="QuickShip" checked={hasTag('quickship')} onChange={() => toggleTag('quickship')} />
            <CheckItem label="GSA" checked={hasTag('gsa')} onChange={() => toggleTag('gsa')} />
            <CheckItem label="CET Extension" checked={hasTag('cet')} onChange={() => toggleTag('cet')} />
            <CheckItem label="Commercial Interiors Library (CIL)" checked={hasTag('cil')} onChange={() => toggleTag('cil')} />
          </>
        ) : (
          <>
            {/* Materials · solo QuickShip aplica (lead-time programs). */}
            <CheckItem label="QuickShip" checked={hasTag('quickship')} onChange={() => toggleTag('quickship')} />
          </>
        )}
      </FilterSection>

      {/* CATEGORY · solo las que devuelven marcas, con su conteo real.
          Ver el cálculo de backedCategories arriba. La sección entera se
          oculta si ninguna tiene respaldo · un acordeón vacío es ruido. */}
      {backedCategories.length > 0 && (
        <FilterSection label="Category" open={categoryOpen} onToggle={() => setCategoryOpen(o => !o)}>
          {backedCategories.map(({ name, count }) => (
            <CheckItem
              key={name}
              label={name}
              count={count}
              checked={selectedCategory === name}
              onChange={() => onCategoryChange(selectedCategory === name ? null : name)}
            />
          ))}
        </FilterSection>
      )}

      {/* COLOR */}
      <FilterSection label="Color" open={colorOpen} onToggle={() => setColorOpen(o => !o)}>
        <div className="grid grid-cols-8 gap-1 mb-2">
          {SWATCH_COLORS.map(hex => (
            <button
              key={hex}
              aria-label={`Color ${hex}`}
              onClick={() => setSelectedColor(selectedColor === hex ? null : hex)}
              className={`w-5 h-5 rounded-full border transition-all ${
                selectedColor === hex
                  ? 'border-foreground scale-110'
                  : 'border-border/50 hover:border-foreground/30 hover:scale-110'
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        {selectedColor && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: selectedColor }} />
            <span className="text-xs text-muted-foreground font-mono">{selectedColor}</span>
            <button onClick={() => setSelectedColor(null)} className="text-xs text-muted-foreground hover:text-foreground ml-auto">Clear</button>
          </div>
        )}
      </FilterSection>

        </>
      )}
      {/* F50 · sample flow (MRL adapt) · v2 · slot al final del sidebar
          para el SampleTrackingPanel. Solo cuando el sidebar no está
          collapsed y el consumer pasó el node. */}
      {!collapsed && bottomSlot && (
        <div>
          {bottomSlot}
        </div>
      )}
    </aside>
  )
}
