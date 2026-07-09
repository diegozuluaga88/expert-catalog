import { useState, useEffect } from 'react'
import type { Manufacturer, LibraryTab, ViewMode } from '../types'
import { PRODUCTS_MANUFACTURERS, MATERIALS_MANUFACTURERS } from '../data/manufacturers'
import ShelfView from '../components/ShelfView'
import GridView from '../components/GridView'
import FilterSidebar from '../components/FilterSidebar'
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
            />
          ) : (
            <GridView manufacturers={filtered} onSelect={onSelectManufacturer} />
          )}
        </div>
      </div>

      {/* Toast container · muestra feedback de My Binders toggle */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
