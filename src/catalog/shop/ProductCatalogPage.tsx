import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, Settings2, SlidersHorizontal, Check } from 'lucide-react'
import type { Product, ProductSortKey } from '../types'
import {
  SHOP_PRODUCTS,
  SHOP_BRANDS,
  SHOP_CATEGORIES,
  SHOP_FEATURES,
  PRICE_RANGES,
} from './data/products'
import ProductCatalogCard from './ProductCatalogCard'
import BulkActionsBar from './BulkActionsBar'
import RequestQuoteModal from './RequestQuoteModal'
import CompareModal from './CompareModal'
import GenerateReportModal from './GenerateReportModal'
import CatalogImportModal from '../manage/CatalogImportModal'
import ProductDetailPanel from '../browse/ProductDetailPanel'
import { resetCatalogs } from '../data/catalogs'

// Etapa 8.2/8.6 — Dashboard "Product Catalog" (Figma · Dashboard 1285:10432 / Search 1295:10559).
// Filtros (Brand, Category, Features, Price) / búsqueda / sort / bulk / paginación funcionales.

const PAGE_SIZE = 8

const SORT_OPTIONS: { key: ProductSortKey; label: string }[] = [
  { key: 'relevant', label: 'Most Relevant' },
  { key: 'top-rated', label: 'Top Rated' },
  { key: 'price-asc', label: 'Price ↑' },
  { key: 'price-desc', label: 'Price ↓' },
  { key: 'lead-time', label: 'Shortest Lead Time' },
  { key: 'in-stock', label: 'In Stock First' },
  { key: 'newest', label: 'Newest' },
]

function leadRank(p: Product): number {
  const lt = (p.leadTime ?? '').toLowerCase()
  if (lt.includes('in stock')) return 0
  const m = lt.match(/(\d+)/)
  return m ? Number(m[1]) : 99
}

function FilterSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  )
}

export default function ProductCatalogPage() {
  const [search, setSearch] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set())
  const [selectedPrices, setSelectedPrices] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<ProductSortKey>('relevant')
  const [sortOpen, setSortOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Modales (Etapa 8.4)
  const [quoteProducts, setQuoteProducts] = useState<Product[] | null>(null)
  const [showCompare, setShowCompare] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  // Phase 2 Fix #5 polish — wire ProductDetailPanel desde esta page también
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  // Diego ask · sync simulations son ephemeral · reset on mount
  useEffect(() => {
    resetCatalogs()
  }, [])
  const selectedProducts = SHOP_PRODUCTS.filter((p) => selected.has(p.id))

  const toggleFromSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) =>
    setter((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleFilter = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
    toggleFromSet(setter, value)
    setPage(1)
  }

  const setOnlyBrand = (brand: string | null) => {
    setSelectedBrands(brand ? new Set([brand]) : new Set())
    setPage(1)
  }

  const filtered = useMemo(() => {
    const list = SHOP_PRODUCTS.filter((p) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q || p.name.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q)
      const matchesBrand = selectedBrands.size === 0 || (p.brand ? selectedBrands.has(p.brand) : false)
      const matchesCategory =
        selectedCategories.size === 0 || (p.category ? selectedCategories.has(p.category) : false)
      const matchesFeatures =
        selectedFeatures.size === 0 || (p.tags ?? []).some((t) => selectedFeatures.has(t))
      const matchesPrice =
        selectedPrices.size === 0 ||
        PRICE_RANGES.some(
          (r) => selectedPrices.has(r.label) && (p.price ?? 0) >= r.min && (p.price ?? 0) < r.max
        )
      return matchesSearch && matchesBrand && matchesCategory && matchesFeatures && matchesPrice
    })
    const sorted = [...list]
    switch (sort) {
      case 'top-rated':
        sorted.sort((a, b) => (b.dealerRating ?? 0) - (a.dealerRating ?? 0))
        break
      case 'price-asc':
        sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        break
      case 'price-desc':
        sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        break
      case 'lead-time':
      case 'in-stock':
        sorted.sort((a, b) => leadRank(a) - leadRank(b))
        break
      case 'newest':
        sorted.sort(
          (a, b) => Number(b.tags?.includes('New') ?? false) - Number(a.tags?.includes('New') ?? false)
        )
        break
      default:
        sorted.sort((a, b) => Number(b.popular ?? false) - Number(a.popular ?? false))
    }
    return sorted
  }, [search, selectedBrands, selectedCategories, selectedFeatures, selectedPrices, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? 'Sort'

  const pillClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
    }`

  const checkRow = (
    item: string,
    set: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>
  ) => {
    const checked = set.has(item)
    return (
      <label key={item} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <span
          onClick={() => toggleFilter(setter, item)}
          className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
            checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
          }`}
        >
          {checked && <Check className="h-3 w-3" />}
        </span>
        {item}
      </label>
    )
  }

  const bulkItem =
    'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-brand text-2xl font-bold tracking-tight text-foreground">Product Catalog</h1>
          <p className="text-sm text-muted-foreground">Track your orders and shipments</p>
        </div>
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Settings2 className="h-4 w-4" />
          Manage Catalogs
        </button>
      </div>

      {/* Brand pills */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setOnlyBrand(null)} className={pillClass(selectedBrands.size === 0)}>
          All Products
        </button>
        {SHOP_BRANDS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setOnlyBrand(b)}
            className={pillClass(selectedBrands.size === 1 && selectedBrands.has(b))}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search catalog..."
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>

        {/* Bulk Actions dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBulkOpen((o) => !o)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Bulk Actions{selected.size > 0 ? ` (${selected.size})` : ''}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {bulkOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setBulkOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-border bg-card p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(new Set(pageItems.map((p) => p.id)))
                    setBulkOpen(false)
                  }}
                  className={bulkItem}
                >
                  Select all on page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(new Set())
                    setBulkOpen(false)
                  }}
                  className={bulkItem}
                >
                  Deselect all
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={() => {
                    setShowCompare(true)
                    setBulkOpen(false)
                  }}
                  className={bulkItem}
                >
                  Compare selected
                </button>
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={() => {
                    setShowReport(true)
                    setBulkOpen(false)
                  }}
                  className={bulkItem}
                >
                  Export selected
                </button>
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={() => {
                    setQuoteProducts(selectedProducts)
                    setBulkOpen(false)
                  }}
                  className={bulkItem}
                >
                  Request quote
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen((o) => !o)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {activeSortLabel}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-lg">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => {
                      setSort(o.key)
                      setSortOpen(false)
                      setPage(1)
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    {o.label}
                    {sort === o.key && <Check className="h-4 w-4 text-foreground" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main: sidebar + grid */}
      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </div>
          <FilterSection title="Category">
            {SHOP_CATEGORIES.map((c) => checkRow(c, selectedCategories, setSelectedCategories))}
          </FilterSection>
          <FilterSection title="Brand" defaultOpen>
            {SHOP_BRANDS.map((b) => checkRow(b, selectedBrands, setSelectedBrands))}
          </FilterSection>
          <FilterSection title="Features">
            {SHOP_FEATURES.map((f) => checkRow(f, selectedFeatures, setSelectedFeatures))}
          </FilterSection>
          <FilterSection title="Price Range">
            {PRICE_RANGES.map((r) => checkRow(r.label, selectedPrices, setSelectedPrices))}
          </FilterSection>
        </aside>

        <div className="flex-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((p) => (
              <ProductCatalogCard
                key={p.id}
                product={p}
                selected={selected.has(p.id)}
                favorite={favorites.has(p.id)}
                onToggleSelect={(id) => toggleFromSet(setSelected, id)}
                onToggleFavorite={(id) => toggleFromSet(setFavorites, id)}
                onRequestQuote={(prod) => setDetailProduct(prod)}
                onOpen={(prod) => setDetailProduct(prod)}
              />
            ))}
          </div>

          {pageItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
              No products match your filters.
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">
              Showing {pageItems.length} of {filtered.length} results
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                    n === safePage ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {selected.size > 0 && (
        <BulkActionsBar
          count={selected.size}
          onDeselectAll={() => setSelected(new Set())}
          onCompare={() => setShowCompare(true)}
          onExport={() => setShowReport(true)}
          onRequestQuote={() => setQuoteProducts(selectedProducts)}
        />
      )}

      {/* Modales (Etapa 8.4) */}
      <CatalogImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportComplete={() => setShowImport(false)}
      />
      {quoteProducts && <RequestQuoteModal products={quoteProducts} onClose={() => setQuoteProducts(null)} />}
      {showCompare && <CompareModal products={selectedProducts} onClose={() => setShowCompare(false)} />}
      {showReport && <GenerateReportModal onClose={() => setShowReport(false)} onExport={() => setShowReport(false)} />}

      {/* Phase 2 Fix #5 · panel también desde Product Catalog tab */}
      <ProductDetailPanel
        open={!!detailProduct}
        product={detailProduct ?? undefined}
        manufacturer={undefined}
        category={undefined}
        onClose={() => setDetailProduct(null)}
      />
    </div>
  )
}
