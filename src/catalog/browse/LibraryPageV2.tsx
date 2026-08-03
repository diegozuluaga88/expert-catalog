// F50 · Wave 2 · v2 · duplicado de LibraryPage.tsx. V1 queda intocada.
// Cambios vs v1:
//   · Importa ShelfViewV2 (que a su vez usa BinderLibraryV2 → BinderSpineV2
//     / BinderWideV2 con save-binder al 100% de opacidad, y sin brick-wall
//     texture en el fondo del estante).
//   · Empty state del "No manufacturers found" reemplazado por el
//     componente EmptyState del design system con ícono + descripción.
//   · El resto de la lógica (tabs, sidebar filters, view mode persistence,
//     search, tags) es idéntica a v1.

import { useState, useEffect } from 'react'
import { PackageSearch, Menu as MenuIcon, X as XIcon } from 'lucide-react'
import { Dialog as HeadlessDialog } from '@headlessui/react'
import type { Manufacturer, LibraryTab, ViewMode } from '../types'
import { PRODUCTS_MANUFACTURERS, MATERIALS_MANUFACTURERS } from '../data/manufacturers'
import ShelfView from '../components/ShelfViewV2'
import GridView from '../components/GridView'
import FilterSidebar from '../components/FilterSidebar'
import MRLSidebarAds from '../components/MRLSidebarAds'
import { useMyBinders } from './useMyBinders'
import { ToastContainer, useToast } from '../../components/AuthToast'
import { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from 'strata-design-system'

interface LibraryPageV2Props {
  onSelectManufacturer: (m: Manufacturer) => void
}

const STORAGE_KEY_VIEW = 'catalog-view-mode'

export default function LibraryPageV2({ onSelectManufacturer }: LibraryPageV2Props) {
  const [activeTab, setActiveTab] = useState<LibraryTab>('products')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEY_VIEW) as ViewMode) ?? 'shelf'
  })
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  // MRL Fase 6 (2026-07-09) · state del filtro "My Binders" · owned aquí y
  // propagado tanto a FilterSidebar (checkbox) como a ShelfView (aplica el
  // filtro + renderiza el chip). Es de sesión, no persiste en localStorage.
  const [showMyBindersOnly, setShowMyBindersOnly] = useState(false)
  // MRL Fase 8 (2026-07-10) · state de tags activos (quickship, gsa, cet, cil).
  // Owned aquí porque tanto FilterSidebar (Tags + Binder Filters sections)
  // como el filtro del shelf lo necesitan. OR logic · un manufacturer pasa
  // si tiene AL MENOS UNO de los tags activos.
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  // MRL Fase 6 · hook de persistence · lee `catalog-my-binders` de localStorage
  // + seed inicial de 3 IDs. Se propaga `myBinderIds` a ShelfView para filtrar.
  const { myBinderIds } = useMyBinders()
  // MRL Fase 3 (2026-07-09) · toast global de la page para el feedback de
  // My Binders toggle. Se propaga como prop a ShelfView → BinderLibrary.
  const { toasts, addToast, dismissToast } = useToast()

  // F50 · Wave 5 · v2 · drawer mobile del FilterSidebar. En desktop la
  // sidebar es siempre visible; en mobile se oculta y aparece un botón
  // hamburger que abre este drawer full-height desde la izquierda.
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW, viewMode)
  }, [viewMode])

  const baseList = activeTab === 'products' ? PRODUCTS_MANUFACTURERS : MATERIALS_MANUFACTURERS

  const filtered = baseList.filter(m => {
    const matchesSearch = search === '' || m.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      selectedCategory === null ||
      m.categories.some(c => c.name === selectedCategory)
    // MRL Fase 8 · OR logic entre tags · manufacturer pasa si tiene al menos
    // uno de los tags activos. Cuando activeTags está vacío no filtra.
    const matchesTags =
      activeTags.size === 0 || (m.tags?.some(t => activeTags.has(t)) ?? false)
    return matchesSearch && matchesCategory && matchesTags
  })

  // F50 · Wave 5 · v2 · el FilterSidebar se referencia una vez y se renderea
  // en dos lugares (desktop inline + mobile Dialog). Solo uno visible por
  // breakpoint.
  const filterSidebarNode = (
    <FilterSidebar
      manufacturers={baseList}
      activeTab={activeTab}
      onTabChange={(tab) => { setActiveTab(tab); setSelectedCategory(null); setSearch('') }}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      search={search}
      onSearchChange={setSearch}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      showMyBindersOnly={showMyBindersOnly}
      onMyBindersToggle={() => setShowMyBindersOnly(v => !v)}
      activeTags={activeTags}
      onTagsChange={setActiveTags}
    />
  )

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden">
      {/* F50 · Wave 5 · v2 · desktop sidebar (>= lg) · siempre visible en el flujo. */}
      <div className="hidden lg:block">
        {filterSidebarNode}
      </div>

      {/* F50 · Wave 5 · v2 · mobile drawer (< lg) · overlay desde la izquierda. */}
      <HeadlessDialog
        open={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        className="relative z-[60] lg:hidden"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-y-0 left-0 flex max-w-full">
          <HeadlessDialog.Panel className="flex flex-col overflow-y-auto bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Filters</h2>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Close filters"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            {filterSidebarNode}
          </HeadlessDialog.Panel>
        </div>
      </HeadlessDialog>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* F50 · Wave 5 · v2 · hamburger trigger del drawer mobile. */}
        <div className="border-b border-border px-6 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            aria-label="Open filters"
          >
            <MenuIcon className="h-4 w-4" />
            Filters
          </button>
        </div>
        {/* Tabs Products/Materials removidas · la selección de librería vive en el
            panel lateral ("Select your library"). Diego ask. */}

        {/* Library content */}
        <div className="scrollbar-mrl flex-1 px-6 py-6 overflow-auto">
          {filtered.length === 0 ? (
            // F50 · Wave 2.c · empty state con ilustración del design system.
            <EmptyState>
              <EmptyStateIcon>
                <PackageSearch className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </EmptyStateIcon>
              <EmptyStateTitle>No manufacturers found</EmptyStateTitle>
              <EmptyStateDescription>
                Try adjusting your filters or search.
              </EmptyStateDescription>
            </EmptyState>
          ) : viewMode === 'shelf' ? (
            <ShelfView
              manufacturers={filtered}
              onSelect={onSelectManufacturer}
              onToast={addToast}
              showMyBindersOnly={showMyBindersOnly}
              myBinderIds={myBinderIds}
              onClearFilter={() => setShowMyBindersOnly(false)}
            />
          ) : (
            <GridView manufacturers={filtered} onSelect={onSelectManufacturer} />
          )}
        </div>
      </div>

      {/* MRL Fase 5 · Aside derecho · sidebar de publicidad (mock sponsor
          slots inspirados en myresourcelibrary.com). Solo visible en:
          - shelf mode (no interfiere con el grid, más denso ya)
          - xl:+ (evita reducir el main en pantallas medianas)
          Ancho `w-72` (288px) · scroll independiente. */}
      {viewMode === 'shelf' && (
        <aside className="scrollbar-mrl hidden xl:block w-56 shrink-0 border-l border-border/60 bg-card/30 overflow-y-auto p-3">
          <MRLSidebarAds />
        </aside>
      )}

      {/* Toast container · muestra feedback de My Binders toggle */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
