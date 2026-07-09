import { useState, useEffect } from 'react'
import type { Manufacturer, LibraryTab, ViewMode } from '../types'
import { PRODUCTS_MANUFACTURERS, MATERIALS_MANUFACTURERS } from '../data/manufacturers'
import ShelfView from '../components/ShelfView'
import GridView from '../components/GridView'
import FilterSidebar from '../components/FilterSidebar'
import MRLSidebarAds from '../components/MRLSidebarAds'
import { useMyBinders } from './useMyBinders'
import { ToastContainer, useToast } from '../../components/AuthToast'

interface LibraryPageProps {
  onSelectManufacturer: (m: Manufacturer) => void
}

const STORAGE_KEY_VIEW = 'catalog-view-mode'

export default function LibraryPage({ onSelectManufacturer }: LibraryPageProps) {
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
  // MRL Fase 6 · hook de persistence · lee `catalog-my-binders` de localStorage
  // + seed inicial de 3 IDs. Se propaga `myBinderIds` a ShelfView para filtrar.
  const { myBinderIds } = useMyBinders()
  // MRL Fase 3 (2026-07-09) · toast global de la page para el feedback de
  // My Binders toggle. Se propaga como prop a ShelfView → BinderLibrary.
  const { toasts, addToast, dismissToast } = useToast()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW, viewMode)
  }, [viewMode])

  const baseList = activeTab === 'products' ? PRODUCTS_MANUFACTURERS : MATERIALS_MANUFACTURERS

  const filtered = baseList.filter(m => {
    const matchesSearch = search === '' || m.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      selectedCategory === null ||
      m.categories.some(c => c.name === selectedCategory)
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden">
      {/* Left sidebar */}
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
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs Products/Materials removidas · la selección de librería vive en el
            panel lateral ("Select your library"). Diego ask. */}

        {/* Library content */}
        <div className="flex-1 px-6 py-6 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-medium text-foreground">No manufacturers found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search.</p>
            </div>
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
        <aside className="hidden xl:block w-72 shrink-0 border-l border-border/60 bg-card/30 overflow-y-auto p-4">
          <MRLSidebarAds />
        </aside>
      )}

      {/* Toast container · muestra feedback de My Binders toggle */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
