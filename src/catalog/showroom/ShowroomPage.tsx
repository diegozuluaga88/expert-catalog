import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, SlidersHorizontal, Check, ArrowLeft, Heart, RefreshCw, Upload, Settings2, Trash2, GitCompare, FolderPlus, FileText } from 'lucide-react'
import type { Category, Product, ProductSortKey } from '../types'
import {
  UNIFIED_PRODUCTS,
  UNIFIED_PRICE_RANGES,
  getProductContext,
  getManufacturerByName,
} from './data/unifiedProducts'
import ProductCatalogCard from '../shop/ProductCatalogCard'
import CompareModal from '../shop/CompareModal'
import ProductDetailPanel from '../browse/ProductDetailPanel'
import ManufacturerPage from '../browse/ManufacturerPage'
import { resolveInternalSku, resolveManufacturerSku, resolveItemStatus } from '../browse/catalogSku'
import { useCatalogs, setCatalogs, resetCatalogs } from '../data/catalogs'
import type { Catalog, CatalogStatus } from '../types'
import { useQuote } from '../../quote/QuoteContext'
import IngestQuoteModal from '../../quote/IngestQuoteModal'
import type { ItemStatus } from '../types'
import CatalogImportModal from '../manage/CatalogImportModal'
import { simulateSyncDelta, SyncResultToast, type SyncToast } from './ShowroomCatalogsBar'

// Etapa 9 — Módulo unificado "Showroom": storefront (base = Product Catalog) sobre la data unificada
// (browse rich + dealer), con toggle Products|Materials y drill-down al detalle rico (browse).

const PAGE_SIZE = 8
type Taxonomy = 'products' | 'materials'

const SORT_OPTIONS: { key: ProductSortKey; label: string }[] = [
  { key: 'relevant', label: 'Most Relevant' },
  { key: 'history-first', label: 'Previously Quoted First' },
  { key: 'top-rated', label: 'Top Rated' },
  { key: 'price-asc', label: 'Price ↑' },
  { key: 'price-desc', label: 'Price ↓' },
  { key: 'lead-time', label: 'Shortest Lead Time' },
  { key: 'in-stock', label: 'In Stock First' },
  { key: 'newest', label: 'Newest' },
]

// Phase 2 Fix #7 — fallback collection derivation cuando product.collection no está
// (mock data antigua sin el campo). Determinístico por brand + product id.
function deriveCollection(p: Product): string | undefined {
  const map: Record<string, string[]> = {
    Allermuir: ['Q2 2026', 'Heritage Series', 'Stacking Pro'],
    Allsteel: ['Reframe 2026', 'Acuity Pro Series', 'Task Excellence'],
    AIS: ['Calibrate Studio', 'Workspace 2026', 'Lounge Collection'],
  }
  const list = p.brand ? map[p.brand] : undefined
  if (!list || list.length === 0) return undefined
  let h = 0
  for (let i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) >>> 0
  return list[h % list.length]
}

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

export default function ShowroomPage() {
  const [taxonomy, setTaxonomy] = useState<Taxonomy>('products')
  const [search, setSearch] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  // Phase 2 Fix #7 — nuevos filtros
  const [selectedItemStatuses, setSelectedItemStatuses] = useState<Set<ItemStatus>>(new Set())
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set())
  // Phase 1 polish · catalogs reactivos · filter por status responde a sync mutations
  const catalogs = useCatalogs()
  // Phase 4 Fix #13b · quoted history para el sort "Previously Quoted First"
  const { quotedHistory } = useQuote()
  // Diego ask · sync simulations son ephemeral · reset al montar la page (refleja
  // que esto es una demo · no hay backend que persista los cambios cross-navegación)
  useEffect(() => {
    resetCatalogs()
  }, [])
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set())
  const [selectedPrices, setSelectedPrices] = useState<Set<string>>(new Set())
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<ProductSortKey>('relevant')
  const [sortOpen, setSortOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Bulk RFQ · queue mode · panel cycles through products via onAfterAdd
  const [quoteQueue, setQuoteQueue] = useState<Product[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [showCompare, setShowCompare] = useState(false)
  const [showImport, setShowImport] = useState(false)
  // Phase 5 Fix #14 · IngestQuoteModal trigger
  const [showIngest, setShowIngest] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [brandName, setBrandName] = useState<string | null>(null)
  // Sidebar refactor · sync state local (antes vivía en ShowroomCatalogsBar)
  const [syncingId, setSyncingId] = useState<number | null>(null)
  const [syncToast, setSyncToast] = useState<SyncToast | null>(null)

  const handleSyncCatalog = (c: Catalog) => {
    setSyncingId(c.id)
    setTimeout(() => {
      const delta = simulateSyncDelta(c)
      setCatalogs((prev) =>
        prev.map((x) =>
          x.id === c.id
            ? { ...x, lastSync: 'Just now', status: 'Active' as CatalogStatus, items: x.items + delta.added }
            : x
        )
      )
      setSyncingId(null)
      setSyncToast({ name: c.name, delta })
      setTimeout(() => setSyncToast(null), 3500)
    }, 1400)
  }

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
  const resetFacets = () => {
    setSelectedBrands(new Set())
    setSelectedCategories(new Set())
    setSelectedItemStatuses(new Set())
    setSelectedCollections(new Set())
    setSelectedFeatures(new Set())
    setSelectedPrices(new Set())
    setSelectedColors(new Set())
    setSearch('')
    setPage(1)
  }
  const clearAll = () => {
    resetFacets()
    setShowFavoritesOnly(false)
  }
  const hasActiveFilters =
    selectedBrands.size > 0 ||
    selectedCategories.size > 0 ||
    selectedItemStatuses.size > 0 ||
    selectedCollections.size > 0 ||
    selectedFeatures.size > 0 ||
    selectedPrices.size > 0 ||
    selectedColors.size > 0 ||
    search.trim() !== '' ||
    showFavoritesOnly

  // Dataset por taxonomía (Products | Materials) y facetas derivadas de ese subconjunto
  const taxoProducts = useMemo(
    () => UNIFIED_PRODUCTS.filter((p) => (taxonomy === 'materials' ? !!p.isMaterial : !p.isMaterial)),
    [taxonomy]
  )
  const brands = useMemo(() => Array.from(new Set(taxoProducts.map((p) => p.brand!).filter(Boolean))), [taxoProducts])
  const categories = useMemo(
    () => Array.from(new Set(taxoProducts.map((p) => p.category!).filter(Boolean))),
    [taxoProducts]
  )
  const features = useMemo(() => Array.from(new Set(taxoProducts.flatMap((p) => p.tags ?? []))), [taxoProducts])
  // Phase 2 Fix #7 — mock collections per brand · usado por el Collection filter
  const collectionsMock = useMemo(() => {
    const map: Record<string, string[]> = {
      Allermuir: ['Q2 2026', 'Heritage Series', 'Stacking Pro'],
      Allsteel: ['Reframe 2026', 'Acuity Pro Series', 'Task Excellence'],
      AIS: ['Calibrate Studio', 'Workspace 2026', 'Lounge Collection'],
    }
    const out = new Set<string>()
    for (const p of taxoProducts) {
      const list = (p.brand && map[p.brand]) ?? []
      for (const c of list) out.add(c)
    }
    return Array.from(out)
  }, [taxoProducts])
  // Item status options · siempre los 3 (no se derivan)
  const itemStatusOptions: { label: string; value: ItemStatus }[] = [
    { label: 'Active', value: 'active' },
    { label: 'Discontinued', value: 'discontinued' },
    { label: 'Out of sync', value: 'discrepancy' },
  ]
  const colors = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of taxoProducts) for (const c of p.colorways ?? []) if (!map.has(c.name)) map.set(c.name, c.hex)
    return Array.from(map, ([name, hex]) => ({ name, hex }))
  }, [taxoProducts])

  const filtered = useMemo(() => {
    const list = taxoProducts.filter((p) => {
      const q = search.trim().toLowerCase()
      // Phase 2 Fix #7 — search por 4 campos: name, brand, MFR SKU, Internal SKU
      // + bonus: description, category, material si el query es lo bastante específico
      const matchesSearch = !q || (
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q) ||
        resolveManufacturerSku(p).toLowerCase().includes(q) ||
        resolveInternalSku(p).toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q) ||
        (p.material ?? '').toLowerCase().includes(q)
      )
      const matchesBrand = selectedBrands.size === 0 || (p.brand ? selectedBrands.has(p.brand) : false)
      const matchesCategory =
        selectedCategories.size === 0 || (p.category ? selectedCategories.has(p.category) : false)
      const matchesItemStatus =
        selectedItemStatuses.size === 0 || selectedItemStatuses.has(resolveItemStatus(p, catalogs))
      // Collection · si product.collection no está, derivamos del brand+id para que el filter funcione
      const productCollection = p.collection ?? deriveCollection(p)
      const matchesCollection =
        selectedCollections.size === 0 || (productCollection ? selectedCollections.has(productCollection) : false)
      const matchesFeatures =
        selectedFeatures.size === 0 || (p.tags ?? []).some((t) => selectedFeatures.has(t))
      const matchesPrice =
        selectedPrices.size === 0 ||
        UNIFIED_PRICE_RANGES.some(
          (r) => selectedPrices.has(r.label) && (p.price ?? 0) >= r.min && (p.price ?? 0) < r.max
        )
      const matchesColor =
        selectedColors.size === 0 || (p.colorways ?? []).some((c) => selectedColors.has(c.name))
      const matchesFav = !showFavoritesOnly || favorites.has(p.id)
      return (
        matchesSearch && matchesBrand && matchesCategory && matchesItemStatus &&
        matchesCollection && matchesFeatures && matchesPrice && matchesColor && matchesFav
      )
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
      case 'history-first':
        // Phase 4 Fix #13b · ranking · 1) tiene history; 2) más occurrences; 3) más recent
        sorted.sort((a, b) => {
          const ha = quotedHistory.get(a.id)
          const hb = quotedHistory.get(b.id)
          if (!!hb !== !!ha) return ha ? -1 : 1
          if (ha && hb) {
            if (hb.occurrences !== ha.occurrences) return hb.occurrences - ha.occurrences
            return hb.lastQuotedAt.localeCompare(ha.lastQuotedAt)
          }
          return Number(b.popular ?? false) - Number(a.popular ?? false)
        })
        break
      default:
        sorted.sort((a, b) => Number(b.popular ?? false) - Number(a.popular ?? false))
    }
    return sorted
  }, [taxoProducts, search, selectedBrands, selectedCategories, selectedItemStatuses, selectedCollections, selectedFeatures, selectedPrices, selectedColors, showFavoritesOnly, favorites, sort, catalogs, quotedHistory])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? 'Sort'
  const selectedProducts = UNIFIED_PRODUCTS.filter((p) => selected.has(p.id))

  const taxoClass = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
    }`

  const checkRow = (item: string, set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
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

  // ── Detalle rico (drill-down) · Phase 2 Fix #5 ───────────────────────────
  // Stakeholder de producto pidió "modal o panel lateral · NO navegación que
  // rompa el flujo". El panel ahora se renderea como OVERLAY al final del
  // showroom (no early-return) · el grid del showroom queda detrás dim.
  const ctx = detailId ? getProductContext(detailId) : undefined

  // ── Brand page (Etapa 9.5): hero/resources/contactos/categorías; seleccionar categoría filtra el grid ──
  const brandManufacturer = brandName ? getManufacturerByName(brandName) : undefined
  if (brandManufacturer) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setBrandName(null)}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Showroom
        </button>
        <ManufacturerPage
          manufacturer={brandManufacturer}
          onBack={() => setBrandName(null)}
          onSelectCategory={(c: Category) => {
            setTaxonomy(brandManufacturer.type === 'materials' ? 'materials' : 'products')
            setSelectedBrands(new Set([brandManufacturer.name]))
            setSelectedCategories(new Set([c.name]))
            setPage(1)
            setBrandName(null)
          }}
        />
      </div>
    )
  }

  // ── Storefront grid ───────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-brand text-2xl font-bold tracking-tight text-foreground">Showroom</h1>
          <p className="text-sm text-muted-foreground">Browse products and materials in one place.</p>
        </div>
        {/* Products | Materials toggle */}
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => {
              setTaxonomy('products')
              resetFacets()
            }}
            className={taxoClass(taxonomy === 'products')}
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => {
              setTaxonomy('materials')
              resetFacets()
            }}
            className={taxoClass(taxonomy === 'materials')}
          >
            Materials
          </button>
        </div>
      </div>

      {selectedBrands.size === 1 && getManufacturerByName([...selectedBrands][0]) && (
        <button
          type="button"
          onClick={() => setBrandName([...selectedBrands][0])}
          className="text-xs font-medium text-muted-foreground underline transition-colors hover:text-foreground"
        >
          View {[...selectedBrands][0]} brand page →
        </button>
      )}

      {/* Main: sidebar + grid */}
      <div className="flex gap-6">
        <aside className="hidden w-64 shrink-0 lg:block space-y-5">

          {/* ───── QUICK ACTIONS ───── */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quick Actions</h3>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowIngest(true)}
                className="flex w-full items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" />
                Upload Quote / PO
              </button>
              <button
                type="button"
                onClick={() => setShowImport(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Settings2 className="h-4 w-4" />
                Manage Catalogs
              </button>
            </div>
          </div>

          {/* ───── SEARCH + SORT ───── */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Search</h3>
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="SKU, name, brand…"
                  title="Try a manufacturer SKU (e.g. ALL-1234A), internal SKU (IN-87423), name, or category"
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((o) => !o)}
                  className="inline-flex h-9 w-full items-center justify-between rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <span className="truncate">{activeSortLabel}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                    <div className="absolute left-0 top-full z-40 mt-2 w-full rounded-xl border border-border bg-card p-1 shadow-lg">
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
          </div>

          {/* ───── BULK ACTIONS · conditional ───── */}
          {selected.size > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Bulk · {selected.size} selected
                </h3>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  title="Clear selection"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCompare(true)}
                  className="flex items-center justify-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <GitCompare className="h-3 w-3" />
                  Compare
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFavorites(prev => {
                      const next = new Set(prev)
                      for (const id of selected) next.add(id)
                      return next
                    })
                    setSelected(new Set())
                  }}
                  className="flex items-center justify-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Heart className="h-3 w-3" />
                  Save
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                  title="Add to project (coming soon)"
                >
                  <FolderPlus className="h-3 w-3" />
                  Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuoteQueue(selectedProducts)
                    setSelected(new Set())
                  }}
                  className="flex items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <FileText className="h-3 w-3" />
                  Quote ({selected.size})
                </button>
              </div>
            </div>
          )}

          {/* ───── FILTERS ───── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="h-3 w-3" />
                Filters
              </h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Favorites toggle inside Filters */}
            <button
              type="button"
              onClick={() => {
                setShowFavoritesOnly((v) => !v)
                setPage(1)
              }}
              className={`mb-2 flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                showFavoritesOnly ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-foreground hover:bg-muted'
              }`}
            >
              <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-destructive text-destructive' : ''}`} />
              Favorites
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {favorites.size}
              </span>
            </button>

          <FilterSection title="Category">
            {categories.map((c) => checkRow(c, selectedCategories, setSelectedCategories))}
          </FilterSection>
          <FilterSection title="Brand" defaultOpen>
            {brands.map((b) => {
              const checked = selectedBrands.has(b)
              const cat = catalogs.find((x) => x.name === b)
              const needsSync = cat?.status === 'Update Avail.'
              const isSyncing = cat ? syncingId === cat.id : false
              return (
                <div key={b} className="flex items-center gap-2">
                  <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-muted-foreground min-w-0">
                    <span
                      onClick={() => toggleFilter(setSelectedBrands, b)}
                      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors shrink-0 ${
                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{b}</span>
                  </label>
                  {cat && (
                    <>
                      {needsSync && !isSyncing && (
                        <span
                          title="Catalog update available"
                          className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"
                        />
                      )}
                      {!needsSync && !isSyncing && (
                        <span
                          title="Catalog up to date"
                          className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleSyncCatalog(cat)}
                        disabled={isSyncing}
                        title={isSyncing ? 'Syncing…' : needsSync ? 'Sync catalog' : 'Re-sync catalog'}
                        className={`p-1 rounded-md transition-colors shrink-0 ${
                          isSyncing
                            ? 'text-muted-foreground cursor-wait'
                            : needsSync
                              ? 'text-amber-600 hover:bg-amber-500/10'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </FilterSection>
          {/* Phase 2 Fix #7 — Status filter (active / discontinued / discrepancy) */}
          <FilterSection title="Status">
            {itemStatusOptions.map((opt) => {
              const checked = selectedItemStatuses.has(opt.value)
              return (
                <label key={opt.value} className="mb-1.5 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedItemStatuses((prev) => {
                        const next = new Set(prev)
                        if (next.has(opt.value)) next.delete(opt.value)
                        else next.add(opt.value)
                        return next
                      })
                      setPage(1)
                    }}
                    className="h-4 w-4 cursor-pointer rounded border-input accent-primary"
                  />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              )
            })}
          </FilterSection>
          {/* Phase 2 Fix #7 — Collection filter (mock collections per brand) */}
          {collectionsMock.length > 0 && (
            <FilterSection title="Collection">
              {collectionsMock.map((c) => checkRow(c, selectedCollections, setSelectedCollections))}
            </FilterSection>
          )}
          <FilterSection title="Features">
            {features.map((f) => checkRow(f, selectedFeatures, setSelectedFeatures))}
          </FilterSection>
          <FilterSection title="Price Range">
            {UNIFIED_PRICE_RANGES.map((r) => checkRow(r.label, selectedPrices, setSelectedPrices))}
          </FilterSection>
          <FilterSection title="Color">
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const checked = selectedColors.has(c.name)
                return (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => toggleFilter(setSelectedColors, c.name)}
                    className={`h-6 w-6 rounded-full border transition-transform ${
                      checked ? 'border-foreground ring-2 ring-primary' : 'border-border'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                )
              })}
            </div>
          </FilterSection>
          </div>
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
                onRequestQuote={(prod) => setDetailId(prod.id)}
                onOpen={(prod) => setDetailId(prod.id)}
              />
            ))}
          </div>

          {pageItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
              No items match your filters.
            </div>
          )}

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

      {/* Bulk actions movidos al sidebar · sin floating bar */}

      {/* Sync toast · feedback de catalog sync desde el sidebar Brand section */}
      {syncToast && <SyncResultToast toast={syncToast} />}

      {showCompare && <CompareModal products={selectedProducts} onClose={() => setShowCompare(false)} />}
      <CatalogImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportComplete={() => setShowImport(false)}
      />

      {/* Phase 5 Fix #14 · Upload Quote/PO/ACK · AI mapping → draft */}
      <IngestQuoteModal
        isOpen={showIngest}
        onClose={() => setShowIngest(false)}
        onComplete={() => {
          setShowIngest(false)
          // Navega al tab My Quotes para ver el draft recién creado
          window.dispatchEvent(new CustomEvent('expert-hub:open-quotes'))
        }}
      />

      {/* Phase 2 Fix #5 · Product detail · centered modal (no full-page nav).
          Si hay queue activo (bulk RFQ), priorizamos el queue product · sino el ctx normal. */}
      <ProductDetailPanel
        open={quoteQueue.length > 0 || !!ctx}
        product={quoteQueue.length > 0 ? quoteQueue[queueIndex] : ctx?.product}
        manufacturer={quoteQueue.length > 0 ? undefined : ctx?.manufacturer}
        category={quoteQueue.length > 0 ? undefined : ctx?.category}
        onClose={() => {
          // Cancel queue (manual close) o cierre normal
          if (quoteQueue.length > 0) {
            setQuoteQueue([])
            setQueueIndex(0)
          } else {
            setDetailId(null)
          }
        }}
        queueInfo={quoteQueue.length > 0 ? { current: queueIndex + 1, total: quoteQueue.length } : undefined}
        onAfterAdd={quoteQueue.length > 0 ? () => {
          if (queueIndex + 1 < quoteQueue.length) {
            setQueueIndex(queueIndex + 1)
          } else {
            // Última · cerrar queue
            setQuoteQueue([])
            setQueueIndex(0)
          }
        } : undefined}
      />
    </div>
  )
}
