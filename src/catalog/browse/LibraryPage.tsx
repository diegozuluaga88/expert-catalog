import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { Manufacturer, LibraryTab, ViewMode } from '../types'
import { PRODUCTS_MANUFACTURERS, MATERIALS_MANUFACTURERS } from '../data/manufacturers'
import ShelfView from '../components/ShelfView'
import GridView from '../components/GridView'
import ViewToggle from '../components/ViewToggle'
import FilterSidebar from '../components/FilterSidebar'

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
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs + toolbar */}
        <div className="border-b border-border bg-card px-6 py-0">
          <div className="flex items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex gap-0">
              {(['products', 'materials'] as LibraryTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedCategory(null); setSearch('') }}
                  className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search + view toggle */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search manufacturers..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 w-52 transition-all"
                />
              </div>
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>
        </div>

        {/* Library content */}
        <div className="flex-1 px-6 py-6 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-medium text-foreground">No manufacturers found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search.</p>
            </div>
          ) : viewMode === 'shelf' ? (
            <ShelfView manufacturers={filtered} onSelect={onSelectManufacturer} />
          ) : (
            <GridView manufacturers={filtered} onSelect={onSelectManufacturer} />
          )}
        </div>
      </div>
    </div>
  )
}
