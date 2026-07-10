import { useState } from 'react'
import { MagnifyingGlassIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { PanelLeft, PanelLeftClose } from 'lucide-react'
import type { Manufacturer, LibraryTab, ViewMode } from '../types'
import ViewToggle from './ViewToggle'
import { MOCK_PRODUCT_CATEGORIES, MOCK_MATERIAL_CATEGORIES } from '../data/mockCategories'

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
  /** MRL Fase 6 · state del filtro "My Binders" (owned por LibraryPage). */
  showMyBindersOnly?: boolean
  /** MRL Fase 6 · toggle del filtro "My Binders". */
  onMyBindersToggle?: () => void
  /** MRL Fase 8 · Set de tags activos (quickship, gsa, cet, cil) owned por
   *  LibraryPage · filtra el shelf por intersect con `manufacturer.tags`. */
  activeTags?: Set<string>
  /** MRL Fase 8 · setter de tags · reemplaza el set completo. */
  onTagsChange?: (next: Set<string>) => void
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
}: FilterSidebarProps) {
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
      {/* Search + View mode · reubicados desde la toolbar de LibraryPage (espejo de Product Catalog) */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search manufacturers…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
          />
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
            {/* MRL Fase 6 · "My Binders" wire real al hook useMyBinders via LibraryPage.
                Diego ask · en el contexto de MRL "binders" y "favoritos" son lo mismo. */}
            <CheckItem
              label="My Binders"
              checked={showMyBindersOnly}
              onChange={() => onMyBindersToggle?.()}
            />
            {/* MRL Fase 8 · wire real al filtro por tags · Set compartido con
                Binder Filters (mismo state, dos entry points UI del referente). */}
            <CheckItem label="QuickShip" checked={hasTag('quickship')} onChange={() => toggleTag('quickship')} />
            <CheckItem label="GSA" checked={hasTag('gsa')} onChange={() => toggleTag('gsa')} />
            <CheckItem label="CET Extension" checked={hasTag('cet')} onChange={() => toggleTag('cet')} />
            <CheckItem label="Commercial Interiors Library (CIL)" checked={hasTag('cil')} onChange={() => toggleTag('cil')} />
          </>
        ) : (
          <>
            <CheckItem
              label="My Binders"
              checked={showMyBindersOnly}
              onChange={() => onMyBindersToggle?.()}
            />
            {/* Materials · solo QuickShip aplica (lead-time programs). */}
            <CheckItem label="QuickShip" checked={hasTag('quickship')} onChange={() => toggleTag('quickship')} />
          </>
        )}
      </FilterSection>

      {/* CATEGORY · MRL Fase 9 · lista mock que replica el referente MRL
          (~24 categorías genéricas con counts inflados en Products, 6 en
          Materials). Al ser mock, las categorías del referente NO matchean
          con los `manufacturer.categories[].name` reales del seed · click
          en una filtra a vacío por design (empty state ya cubre el UX).
          Sirve para simular la escala visual de la biblioteca del referente. */}
      <FilterSection label="Category" open={categoryOpen} onToggle={() => setCategoryOpen(o => !o)}>
        {(activeTab === 'products' ? MOCK_PRODUCT_CATEGORIES : MOCK_MATERIAL_CATEGORIES).map(({ name, count }) => (
          <CheckItem
            key={name}
            label={name}
            count={count}
            checked={selectedCategory === name}
            onChange={() => onCategoryChange(selectedCategory === name ? null : name)}
          />
        ))}
      </FilterSection>

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

      {/* BINDER FILTERS · duplicado del UI del referente · usa el mismo `activeTags`
          state que Tags para que un click acá se refleje en ambos accordions. */}
      <FilterSection label="Binder Filters" open={binderOpen} onToggle={() => setBinderOpen(o => !o)}>
        {/* MRL Fase 6 · mismo wire real al hook (mirror del Tags · My Binders). */}
        <CheckItem
          label="My Binders"
          checked={showMyBindersOnly}
          onChange={() => onMyBindersToggle?.()}
        />
        <CheckItem label="QuickShip" checked={hasTag('quickship')} onChange={() => toggleTag('quickship')} />
        {activeTab === 'products' && (
          <>
            <CheckItem label="GSA" checked={hasTag('gsa')} onChange={() => toggleTag('gsa')} />
            <CheckItem label="CET Extension" checked={hasTag('cet')} onChange={() => toggleTag('cet')} />
          </>
        )}
      </FilterSection>
        </>
      )}
    </aside>
  )
}
