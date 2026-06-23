import { useState } from 'react'
import {
  ChevronRightIcon, HomeIcon, MagnifyingGlassIcon,
  EnvelopeIcon, PhoneIcon, GlobeAltIcon, ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import type { Manufacturer, Category } from '../types'
import CategoryCard from '../components/CategoryCard'

interface ManufacturerPageProps {
  manufacturer: Manufacturer
  onBack: () => void
  onSelectCategory: (c: Category) => void
}

export default function ManufacturerPage({ manufacturer, onBack, onSelectCategory }: ManufacturerPageProps) {
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const totalProducts = manufacturer.categories.reduce((acc, c) => acc + c.products.length, 0)

  const filteredCategories = manufacturer.categories.filter(cat => {
    const matchSearch = search === '' || cat.name.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  return (
    <div className="min-h-[calc(100vh-96px)] bg-background flex flex-col">
      {/* Breadcrumb bar */}
      <div className="border-b border-border bg-card -mx-4 px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to library"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Library</span>
          </button>
          <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-foreground font-medium">{manufacturer.name}</span>
        </div>
      </div>

      {/* Hero image — full-bleed past the max-w-5xl container */}
      <div
        className="h-40 relative overflow-hidden flex items-center -mx-4"
        style={{ backgroundColor: manufacturer.bgColor }}
      >
        {manufacturer.heroImage ? (
          <img src={manufacturer.heroImage} alt={manufacturer.name} className="w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="relative px-8">
          <h1 className="text-3xl font-bold text-white mb-1">{manufacturer.name}</h1>
          <p className="text-white/70 text-sm">{manufacturer.type === 'materials' ? 'Textiles & Materials' : 'Furniture & Products'}</p>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex flex-1 min-h-0">

        {/* Left sidebar */}
        <aside className="w-52 shrink-0 bg-card border-r border-border flex flex-col overflow-y-auto py-4 gap-4">

          {/* Stats */}
          <div className="px-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overview</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Categories</span>
                <span className="text-xs font-semibold text-foreground">{manufacturer.categories.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Products</span>
                <span className="text-xs font-semibold text-foreground">{totalProducts}</span>
              </div>
              {manufacturer.binderCount && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Binders</span>
                  <span className="text-xs font-semibold text-foreground">{manufacturer.binderCount}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Type</span>
                <span className="text-xs font-semibold text-foreground capitalize">{manufacturer.type}</span>
              </div>
            </div>
          </div>

          {/* Filter options */}
          {manufacturer.filterOptions && manufacturer.filterOptions.length > 0 && (
            <div className="px-4 border-t border-border pt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Filter by</p>
              <div className="space-y-0.5">
                <button
                  onClick={() => setSelectedType(null)}
                  className={`w-full text-left text-xs py-1 px-2 rounded transition-colors ${
                    selectedType === null ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                {manufacturer.filterOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSelectedType(selectedType === opt ? null : opt)}
                    className={`w-full text-left text-xs py-1 px-2 rounded transition-colors ${
                      selectedType === opt ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Brand Resources */}
          {manufacturer.brandResources && manufacturer.brandResources.length > 0 && (
            <div className="px-4 border-t border-border pt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Brand Resources</p>
              <div className="space-y-1">
                {manufacturer.brandResources.map((r, i) => (
                  <a
                    key={i}
                    href={r.href ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <GlobeAltIcon className="w-3 h-3 shrink-0" />
                    <span className="flex-1 truncate">{r.name}</span>
                    <ArrowTopRightOnSquareIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Contacts */}
          {manufacturer.contacts && manufacturer.contacts.length > 0 && (
            <div className="px-4 border-t border-border pt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contacts</p>
              <div className="space-y-3">
                {manufacturer.contacts.map((c, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground mb-1">{c.title}</p>
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                        <EnvelopeIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                        <PhoneIcon className="w-3 h-3 shrink-0" />
                        <span>{c.phone}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Center: description */}
        <div className="w-72 shrink-0 border-r border-border bg-background flex flex-col overflow-y-auto">
          <div className="p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">{manufacturer.description}</p>

            <div className="mt-6 flex flex-col gap-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                Visit Website
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-colors border border-border">
                Download Catalog
              </button>
            </div>
          </div>
        </div>

        {/* Right: categories */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="px-6 py-3 border-b border-border bg-card flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                placeholder="Search categories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <span className="text-xs text-muted-foreground">{filteredCategories.length} categories</span>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories found.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {filteredCategories.map(cat => (
                  <CategoryCard key={cat.id} category={cat} onClick={() => onSelectCategory(cat)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
