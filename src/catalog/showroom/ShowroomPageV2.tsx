import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Search, ChevronDown, SlidersHorizontal, Check, ArrowLeft, Heart, RefreshCw, Upload, Settings2, Trash2, GitCompare, FolderPlus, FileText, PanelLeftClose, PanelLeft, Sparkles, Plus, Pencil } from 'lucide-react'
import type { Category, Manufacturer, Product, ProductSortKey, SpaceType, SpaceTypeSetting } from '../types'
import SpaceTypesPage, { SPACES_COST_BUCKETS, type SpacesFilters, type SpacesSortKey } from '../spaces/SpaceTypesPage'
import SpaceTypeDetailPage from '../spaces/SpaceTypeDetailPage'
import { getAllBrandsInSpaces, SPACE_TYPES } from '../data/spaceTypes'
import { useCustomSpaces, type CreateCustomSpaceInput } from '../spaces/useCustomSpaces'
import CreateEditSpaceModal from '../spaces/CreateEditSpaceModal'
import {
  UNIFIED_PRODUCTS,
  UNIFIED_PRICE_RANGES,
  getProductContext,
  getManufacturerByName,
} from './data/unifiedProducts'
import ProductCatalogCard from '../shop/ProductCatalogCardV2'
import BulkActionsBar from '../shop/BulkActionsBar'
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
// F50 · Wave 1.b · v2 · confirmación al cambiar de taxonomía cuando hay
// filtros activos. Este archivo es un duplicado completo de ShowroomPage.tsx
// (v1 queda intocada · regla estricta). Cualquier bug o cambio en la lógica
// compartida requiere fixear en ambos archivos.
import ConfirmSwitchModal from '../components/ConfirmSwitchModal'
// F50 · Wave 2.c · v2 · empty state con ilustración + CTA "Clear filters".
import { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription, EmptyStateActions } from 'strata-design-system'
import { SearchX } from 'lucide-react'
// F50 · Wave 2 (extensión post-approval) · Grid density selector · v2.
import GridDensitySelector, { gridClassesFor, loadGridDensity, saveGridDensity, type GridDensity } from '../components/GridDensitySelector'
// F50 · Wave 2 (extensión post-approval) · Custom price range · v2.
import CustomPriceRange, { type PriceRangeValue } from '../components/CustomPriceRange'
// F50 · Wave 4 · v2 · Sample request modal + tracking slide-over + toast.
import SampleTrackingSlideOver from '../components/SampleTrackingSlideOver'
import SampleTrackingPanel from '../components/SampleTrackingPanel'
import { useSampleRequests, SAMPLE_STATUS_CHANGE_EVENT, type SampleStatusChangeDetail } from '../browse/useSampleRequests'
import { useToast, ToastContainer } from '../../components/AuthToast'
import { Package as PackageIcon, Menu as MenuIcon, X as XIcon, Folder as FolderIcon } from 'lucide-react'
// F50 · Wave 5 · v2 · Dialog de HeadlessUI para el drawer mobile de filtros.
import { Dialog as HeadlessDialog } from '@headlessui/react'
// F50 · Wave 6 · v2 · Collections (P7 del PRD) · persistencia por-tenant que
// reemplaza al favoritos-flat en memoria + modal de add-to-collection.
import { useCollections } from '../browse/useCollections'
import AddToCollectionModal from '../components/AddToCollectionModal'
// F50 · Etapa 8 (P7 share) · util para armar el link firmado read-only.
import { encodeCollectionShareLink } from '../browse/collectionShareLink'
// F51 · B.3 (consolidación 2026-08-04) · helper + toggle compartidos con
// CollectionShareView · antes vivían inline en este file, ahora en el
// módulo browse/collectionGrouping · single source of truth.
import { CollectionGroupByToggle, groupProductsBy } from '../browse/collectionGrouping'
import { Share2, Palette, Tag, Wand2 } from 'lucide-react'
// F50 · Etapa 9 (P1 search) · v2 · command palette + visual search stub +
// session activity tracker (mock reranking).
import SearchCommandPalette from '../search/SearchCommandPalette'
import VisualSearchModal from '../search/VisualSearchModal'
import { useSessionActivity } from '../search/useSessionActivity'
// F50 · sweep DS · dialogs provider para reemplazar window.prompt/confirm.
import { useDialogs } from '../../components/dialogs/DialogsContext'
// F50 · Etapa 10.d · v2 · agregar productos del catálogo a un project.
import { useProjects } from '../projects/useProjects'
import AddToProjectModal from '../projects/AddToProjectModal'

// Etapa 9 — Módulo unificado "Showroom": storefront (base = Product Catalog) sobre la data unificada
// (browse rich + dealer), con toggle Products|Materials y drill-down al detalle rico (browse).

const PAGE_SIZE = 8
// Fase 2 refactor · Spaces se integra como 3ra taxonomía del toggle sidebar
// (era tab independiente en CatalogPage · Diego ask: adaptar al flujo existente).
type Taxonomy = 'products' | 'materials' | 'spaces'

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

interface ShowroomPageV2Props {
  /** Diego ask (2026-07-07) · barra de tabs (MRL / Dealer / Figma / Product Catalog /
   *  My Selection) inyectada por CatalogPage y renderizada al lado del título para
   *  ganar espacio vertical. Opcional · fallback = header sin acciones a la derecha. */
  headerAside?: ReactNode
}

export default function ShowroomPageV2({ headerAside }: ShowroomPageV2Props = {}) {
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
  // F53 · handleQuickAdd removed · el add real vive ahora dentro del
  // detail panel (single entry point via onOpen del ProductCatalogCard).
  // El pill quick-add del footer se eliminó junto con el sliders icon
  // Configure · ambos se pisaban con el panel según el user smoke.

  // F50 · Wave 5 · v2 · drawer mobile del sidebar de filtros. En desktop
  // (lg+) el sidebar es siempre visible en el flujo normal; en mobile se
  // oculta y aparece un botón hamburger que abre este drawer.
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // F50 · Wave 4 (refactor 2026-08-03) · sample request pattern "My Selection" ·
  // click en "Request sample" agrega al DRAFT (sin modal). El user revisa el
  // draft en el SampleTrackingSlideOver y hace submit batch desde ahí.
  const [trackingOpen, setTrackingOpen] = useState(false)
  const { toasts, addToast, dismissToast } = useToast()
  const { pendingCount: sampleRequestsPending, addToDraft } = useSampleRequests()
  const handleRequestSwatch = (product: Product) => {
    const firstColor = product.colorways?.[0]
    // F51 · A.3 · guard "finishes only" · el producto del showroom está
    // enriched con `isMaterial` desde UNIFIED_PRODUCTS. Pasamos el flag
    // al hook · si NO es finish, addToDraft devuelve null y avisamos.
    const created = addToDraft({
      productId: product.id,
      productName: product.name,
      productBrand: product.brand,
      productImage: product.images[0],
      colorwayName: firstColor?.name,
      colorwayHex: firstColor?.hex,
      qty: 1,
      isMaterial: product.isMaterial === true,
    })
    if (!created) {
      addToast('info', `Sample requests are for finishes only · ${product.name} is not a finish.`)
      return
    }
    addToast('success', `${product.name} added to sample draft.`, {
      label: 'Review draft',
      onClick: () => setTrackingOpen(true),
    })
  }
  // F50 · Etapa 11 (P5 polish) · v2 · notifications ricas cuando el
  // status de una sample request cambia. Escucha el CustomEvent global
  // que dispara useSampleRequests.advanceStatus. Dispara toast con action
  // "View tracking" que abre el slide-over. Mensaje distinto según la
  // transición (shipped vs delivered).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SampleStatusChangeDetail>).detail
      if (!detail) return
      const { request, previousStatus } = detail
      const name = request.productName
      if (previousStatus === 'pending' && request.status === 'shipped') {
        const trackingHint = request.carrierTracking ? ` · tracking ${request.carrierTracking}` : ''
        addToast('success', `Sample shipped · ${name}${trackingHint}`, {
          label: 'View tracking',
          onClick: () => setTrackingOpen(true),
        })
      } else if (previousStatus === 'shipped' && request.status === 'delivered') {
        addToast('info', `${name} sample delivered · check your mail.`, {
          label: 'View tracking',
          onClick: () => setTrackingOpen(true),
        })
      }
    }
    window.addEventListener(SAMPLE_STATUS_CHANGE_EVENT, handler)
    return () => window.removeEventListener(SAMPLE_STATUS_CHANGE_EVENT, handler)
    // addToast es estable desde el hook · setTrackingOpen también.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Diego ask · sync simulations son ephemeral · reset al montar la page (refleja
  // que esto es una demo · no hay backend que persista los cambios cross-navegación)
  useEffect(() => {
    resetCatalogs()
  }, [])
  // F50 · Add-another-material · escucha el evento del CatalogPageV2 cuando el
  // user hizo click en "Browse Product Catalog" desde el SampleTrackingSlideOver.
  // Setea la taxonomía a Materials sin pasar por el confirmSwitch (el user ya
  // eligió explícitamente ir a materials).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ taxonomy?: Taxonomy }>).detail
      if (detail?.taxonomy && detail.taxonomy !== taxonomy) {
        setTaxonomy(detail.taxonomy)
      }
    }
    window.addEventListener('expert-hub:set-showroom-taxonomy', handler)
    return () => window.removeEventListener('expert-hub:set-showroom-taxonomy', handler)
  }, [taxonomy])
  // F50 · Add-another-material · publica la taxonomy actual para que
  // CatalogPageV2 sepa si el user ya está en Materials (y renderice el
  // botón "Continue browsing" en vez del dropdown). Se dispara al mount
  // y en cada cambio.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('expert-hub:showroom-taxonomy-changed', {
      detail: { taxonomy },
    }))
  }, [taxonomy])
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set())
  const [selectedPrices, setSelectedPrices] = useState<Set<string>>(new Set())
  // F50 · Wave 2 (extensión) · rango custom de precios que coexiste con los
  // presets. Null si el user no aplicó ninguno. Persiste en memoria de sesión.
  const [customPriceRange, setCustomPriceRange] = useState<PriceRangeValue | null>(null)
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<ProductSortKey>('relevant')
  const [sortOpen, setSortOpen] = useState(false)
  const [page, setPage] = useState(1)
  // F50 · Wave 6 · v2 · reemplaza el `useState<Set<string>>` de favoritos-flat
  // por el hook persistido de colecciones. `favorites` (Set legacy) queda
  // derivado como `savedProductIds` para compatibilidad con el filtro y el
  // heart-toggle. El nombre del state se mantiene para reducir el diff en
  // llamadas downstream (BulkActionsBar, filter row, sidebar chip).
  const {
    collections,
    savedProductIds: favorites,
    createCollection,
    deleteCollection,
    renameCollection,
    addToCollection,
    removeFromCollection,
  } = useCollections()
  // Filtro del sidebar · pasa de "Solo favoritos" a "Solo una colección específica".
  // null = mostrar todos · id de colección = filtrar por esa colección.
  const [activeCollectionFilter, setActiveCollectionFilter] = useState<string | null>(null)
  // F50 · Wave 6 · state del modal add-to-collection · id del producto en foco.
  const [collectionModalProductId, setCollectionModalProductId] = useState<string | null>(null)
  // F50 · Etapa 8 (P7 share) · agrupación visual dentro de una colección.
  // Solo tiene efecto cuando `activeCollectionFilter !== null`. Cuando la
  // colección se deselecciona, se resetea a 'flat' en el mismo effect que
  // reactiva la paginación.
  const [collectionGroupBy, setCollectionGroupBy] = useState<'flat' | 'color' | 'category'>('flat')
  useEffect(() => {
    if (activeCollectionFilter === null && collectionGroupBy !== 'flat') {
      setCollectionGroupBy('flat')
    }
  }, [activeCollectionFilter, collectionGroupBy])
  // F50 · Etapa 9 (P1 search) · state del command palette + visual search.
  // El hotkey `/` global (excepto en inputs) abre el palette. `Esc` cierra.
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false)
  const [visualSearchOpen, setVisualSearchOpen] = useState(false)
  // Session activity tracker · registra vistas de productos para el
  // reranker mock del palette. Se dispara desde onOpen de las cards.
  const { recordView } = useSessionActivity()
  const { prompt, confirm } = useDialogs()
  // F50 · Etapa 10.d · v2 · projects para el modal Add-to-project.
  const { projects, createProject, addItem: addItemToProject } = useProjects()
  const [addToProjectProduct, setAddToProjectProduct] = useState<Product | null>(null)
  useEffect(() => {
    const isEditableTarget = (t: EventTarget | null): boolean => {
      if (!(t instanceof HTMLElement)) return false
      const tag = t.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      if (t.isContentEditable) return true
      return false
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !isEditableTarget(e.target)) {
        e.preventDefault()
        setSearchPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
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
  // Collapsible sidebar · click toggle (PanelLeftClose / PanelLeft icon)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // F50 · Wave 2 (extensión) · densidad del grid seleccionada por el user.
  // 'auto' = 1/2/3 columnas según breakpoint (default post Wave 2.b).
  // '2' | '3' | '4' = forzado por el usuario. Persiste en localStorage.
  const [gridDensity, setGridDensity] = useState<GridDensity>(() => loadGridDensity())
  const handleGridDensityChange = (v: GridDensity) => {
    setGridDensity(v)
    saveGridDensity(v)
  }
  // Materials mode usa subset reducido de filtros (sin Status ni Collection)
  const isMaterials = taxonomy === 'materials'
  // Spaces mode oculta search/sort/filters/bulk/pagination · main content muta
  // a SpaceTypesPage/SpaceTypeDetailPage.
  const isSpaces = taxonomy === 'spaces'
  // Fase 2 refactor · state local del Space Type seleccionado (antes vivía en CatalogPage).
  const [selectedSpaceType, setSelectedSpaceType] = useState<SpaceType | null>(null)
  // Fase 4 · state de filtros/sort del sidebar de Spaces
  const [spacesSearch, setSpacesSearch] = useState('')
  const [spacesSelectedProfiles, setSpacesSelectedProfiles] = useState<Set<string>>(new Set())
  const [spacesSelectedCostBuckets, setSpacesSelectedCostBuckets] = useState<Set<string>>(new Set())
  const [spacesSelectedBrands, setSpacesSelectedBrands] = useState<Set<string>>(new Set())
  const [spacesSort, setSpacesSort] = useState<SpacesSortKey>('alpha')
  const [spacesSortOpen, setSpacesSortOpen] = useState(false)
  const clearSpacesFilters = () => {
    setSpacesSearch('')
    setSpacesSelectedProfiles(new Set())
    setSpacesSelectedCostBuckets(new Set())
    setSpacesSelectedBrands(new Set())
  }
  const hasActiveSpacesFilters =
    spacesSearch.trim() !== '' ||
    spacesSelectedProfiles.size > 0 ||
    spacesSelectedCostBuckets.size > 0 ||
    spacesSelectedBrands.size > 0
  // Composición del filters object para SpaceTypesPage (memo no necesario · Sets
  // se crean por referencia en set/clear/toggle).
  const spacesFilters: SpacesFilters = {
    search: spacesSearch,
    profiles: spacesSelectedProfiles as Set<'CCO' | 'GW' | 'CI'>,
    costBuckets: spacesSelectedCostBuckets,
    brands: spacesSelectedBrands,
  }
  const spacesBrandList = useMemo(() => getAllBrandsInSpaces(), [])
  const SPACES_SORT_OPTIONS: { key: SpacesSortKey; label: string }[] = [
    { key: 'alpha', label: 'Alphabetical' },
    { key: 'cost-asc', label: 'Cost ↑ (low to high)' },
    { key: 'cost-desc', label: 'Cost ↓ (high to low)' },
    { key: 'settings-count', label: 'Settings count' },
  ]
  const spacesActiveSortLabel = SPACES_SORT_OPTIONS.find(o => o.key === spacesSort)?.label ?? 'Sort'

  // Fase 5 · Custom Spaces (create/edit/duplicate/delete)
  const {
    customSettings,
    allSettings: allSpaceSettings,
    createCustom,
    updateCustom,
    duplicateCustom,
    deleteCustom,
    isCustomSettingId,
  } = useCustomSpaces()
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [editingCustom, setEditingCustom] = useState<SpaceTypeSetting | null>(null)
  const openCreateCustom = () => { setEditingCustom(null); setCustomModalOpen(true) }
  const openEditCustom = (setting: SpaceTypeSetting) => { setEditingCustom(setting); setCustomModalOpen(true) }
  const handleCustomSubmit = (input: CreateCustomSpaceInput) => {
    if (editingCustom) updateCustom(editingCustom.id, input)
    else createCustom(input)
    setCustomModalOpen(false)
    setEditingCustom(null)
  }
  // Count de custom por parent SpaceType para el badge en las cards del grid
  const customCountByParent: Record<string, number> = {}
  for (const c of customSettings) customCountByParent[c.spaceTypeId] = (customCountByParent[c.spaceTypeId] ?? 0) + 1

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
    setCustomPriceRange(null)
    setSelectedColors(new Set())
    setSearch('')
    setPage(1)
  }
  const clearAll = () => {
    resetFacets()
    setActiveCollectionFilter(null)
  }
  const hasActiveFilters =
    selectedBrands.size > 0 ||
    selectedCategories.size > 0 ||
    selectedItemStatuses.size > 0 ||
    selectedCollections.size > 0 ||
    selectedFeatures.size > 0 ||
    selectedPrices.size > 0 ||
    customPriceRange !== null ||
    selectedColors.size > 0 ||
    search.trim() !== '' ||
    activeCollectionFilter !== null

  // F50 · Wave 1.b · conteo específico de filtros activos (excluye search y
  // favoritos porque no se pierden en el reset) — se muestra en el modal.
  const activeFiltersCount =
    selectedBrands.size +
    selectedCategories.size +
    selectedItemStatuses.size +
    selectedCollections.size +
    selectedFeatures.size +
    selectedPrices.size +
    (customPriceRange !== null ? 1 : 0) +
    selectedColors.size

  // F50 · Wave 1.b · state para el modal de confirmación de switch. Cuando
  // no es null, guarda el destino del switch pendiente. Al confirmar se
  // aplica; al cancelar se descarta.
  const [pendingTaxonomy, setPendingTaxonomy] = useState<Taxonomy | null>(null)

  const applyTaxonomySwitch = (next: Taxonomy) => {
    setTaxonomy(next)
    resetFacets()
    setSelectedSpaceType(null)
    clearSpacesFilters()
  }

  const requestTaxonomySwitch = (next: Taxonomy) => {
    if (next === taxonomy) return
    // Si hay filtros activos, pide confirmación. Sino, aplica directo.
    if (activeFiltersCount > 0) {
      setPendingTaxonomy(next)
    } else {
      applyTaxonomySwitch(next)
    }
  }

  const taxonomyLabel = (t: Taxonomy) =>
    // F58a.1 · rename UI-facing 'Spaces' → 'Inspiration' · el key interno
    // 'spaces' se mantiene (evita refactor deep del state · useCustomSpaces,
    // SpaceType, SpaceBundle no cambian). Solo el label visible cambia.
    t === 'products' ? 'Products' : t === 'materials' ? 'Materials' : 'Inspiration'

  // Dataset por taxonomía (Products | Materials) y facetas derivadas de ese subconjunto
  const taxoProducts = useMemo(
    () => UNIFIED_PRODUCTS.filter((p) => (taxonomy === 'materials' ? !!p.isMaterial : !p.isMaterial)),
    [taxonomy]
  )
  const brands = useMemo(() => Array.from(new Set(taxoProducts.map((p) => p.brand!).filter(Boolean))), [taxoProducts])
  // F50 · Etapa 9 (P1 search) · manufacturers derivados por brand para
  // alimentar el SearchCommandPalette (necesita los objetos completos, no
  // solo el nombre).
  const taxoManufacturers = useMemo(
    () => brands.map((name) => getManufacturerByName(name)).filter((m): m is Manufacturer => !!m),
    [brands],
  )
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

  // F50 · Wave 3.b · matcher factorizado para facet independence. Permite
  // saltar una dimensión al aplicar filtros — necesario para calcular
  // cuántos productos habría por cada opción de un filtro considerando
  // los OTROS filtros ya aplicados (ej: contar "Chairs" cuando ya tildaste
  // brand="Herman Miller" muestra cuántos Herman Miller son Chairs).
  type FacetDim = 'brand' | 'category' | 'itemStatus' | 'collection' | 'features' | 'price' | 'color'
  const productMatchesExcept = (p: Product, skip: FacetDim | null = null): boolean => {
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || (
      p.name.toLowerCase().includes(q) ||
      (p.brand ?? '').toLowerCase().includes(q) ||
      resolveManufacturerSku(p).toLowerCase().includes(q) ||
      resolveInternalSku(p).toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q) ||
      (p.category ?? '').toLowerCase().includes(q) ||
      (p.material ?? '').toLowerCase().includes(q)
    )
    if (!matchesSearch) return false
    if (skip !== 'brand' && !(selectedBrands.size === 0 || (p.brand ? selectedBrands.has(p.brand) : false))) return false
    if (skip !== 'category' && !(selectedCategories.size === 0 || (p.category ? selectedCategories.has(p.category) : false))) return false
    if (skip !== 'itemStatus' && !(selectedItemStatuses.size === 0 || selectedItemStatuses.has(resolveItemStatus(p, catalogs)))) return false
    const productCollection = p.collection ?? deriveCollection(p)
    if (skip !== 'collection' && !(selectedCollections.size === 0 || (productCollection ? selectedCollections.has(productCollection) : false))) return false
    if (skip !== 'features' && !(selectedFeatures.size === 0 || (p.tags ?? []).some((t) => selectedFeatures.has(t)))) return false
    if (skip !== 'price') {
      const price = p.price ?? 0
      const matchesPresets = selectedPrices.size > 0 && UNIFIED_PRICE_RANGES.some((r) => selectedPrices.has(r.label) && price >= r.min && price < r.max)
      const matchesCustom = customPriceRange !== null && price >= customPriceRange.min && price <= customPriceRange.max
      if (!((selectedPrices.size === 0 && customPriceRange === null) || matchesPresets || matchesCustom)) return false
    }
    if (skip !== 'color' && !(selectedColors.size === 0 || (p.colorways ?? []).some((c) => selectedColors.has(c.name)))) return false
    // F50 · Wave 6 · filtro por colección específica del sidebar. Cuando hay
    // una colección activa, el producto debe pertenecer a esa colección.
    if (activeCollectionFilter !== null) {
      const col = collections.find((c) => c.id === activeCollectionFilter)
      if (!col || !col.productIds.includes(p.id)) return false
    }
    return true
  }

  // F50 · Wave 3.b · facet counts por dimensión. Para cada opción de un
  // filtro, cuenta cuántos productos del dataset la matchean considerando
  // TODOS los demás filtros aplicados (facet independence). Cambian junto
  // con los filtros activos, así que useMemo depende de las mismas deps
  // que el filtered.
  const facetCounts = useMemo(() => {
    const byBrand = new Map<string, number>()
    const byCategory = new Map<string, number>()
    const byStatus = new Map<string, number>()
    const byCollection = new Map<string, number>()
    const byFeature = new Map<string, number>()
    const byPricePreset = new Map<string, number>()
    for (const p of taxoProducts) {
      if (productMatchesExcept(p, 'brand') && p.brand) {
        byBrand.set(p.brand, (byBrand.get(p.brand) ?? 0) + 1)
      }
      if (productMatchesExcept(p, 'category') && p.category) {
        byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1)
      }
      if (productMatchesExcept(p, 'itemStatus')) {
        const s = resolveItemStatus(p, catalogs)
        byStatus.set(s, (byStatus.get(s) ?? 0) + 1)
      }
      if (productMatchesExcept(p, 'collection')) {
        const c = p.collection ?? deriveCollection(p)
        if (c) byCollection.set(c, (byCollection.get(c) ?? 0) + 1)
      }
      if (productMatchesExcept(p, 'features')) {
        for (const t of p.tags ?? []) {
          byFeature.set(t, (byFeature.get(t) ?? 0) + 1)
        }
      }
      if (productMatchesExcept(p, 'price')) {
        const price = p.price ?? 0
        for (const r of UNIFIED_PRICE_RANGES) {
          if (price >= r.min && price < r.max) {
            byPricePreset.set(r.label, (byPricePreset.get(r.label) ?? 0) + 1)
          }
        }
      }
    }
    return { byBrand, byCategory, byStatus, byCollection, byFeature, byPricePreset }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxoProducts, search, selectedBrands, selectedCategories, selectedItemStatuses, selectedCollections, selectedFeatures, selectedPrices, customPriceRange, selectedColors, activeCollectionFilter, collections, catalogs])

  const filtered = useMemo(() => {
    // El filtered "real" no salta ninguna dimensión (todos los filtros aplican).
    const list = taxoProducts.filter((p) => productMatchesExcept(p, null))
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
  }, [taxoProducts, search, selectedBrands, selectedCategories, selectedItemStatuses, selectedCollections, selectedFeatures, selectedPrices, customPriceRange, selectedColors, activeCollectionFilter, collections, sort, catalogs, quotedHistory])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? 'Sort'
  const selectedProducts = UNIFIED_PRODUCTS.filter((p) => selected.has(p.id))

  // F50 · Wave 3.a · v2 · checkbox real (input type=checkbox) para que las
  // opciones de filtro sean navegables con teclado (Tab lleva foco, Space
  // toggle) y respeten el a11y contract nativo del browser.
  // F50 · Wave 3.b · v2 · count opcional al lado del label (facet count).
  const checkRow = (
    item: string,
    set: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    count?: number,
  ) => {
    const checked = set.has(item)
    const dim = count === 0 && !checked
    return (
      <label
        key={item}
        className={`flex cursor-pointer items-center gap-2 text-sm transition-colors ${
          dim ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggleFilter(setter, item)}
          className="h-4 w-4 cursor-pointer rounded border-input accent-primary"
        />
        <span className="flex-1">{item}</span>
        {typeof count === 'number' && (
          <span className="tabular-nums text-[11px] text-muted-foreground">{count}</span>
        )}
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
          variant="v2"
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
  // F50 Wave 5 v2 sidebar contents declared once for reuse in desktop aside + mobile drawer
  const sidebarContents = (
    <>

          {/* ───── COLLAPSE TOGGLE + (when expanded) MODE SWITCH ───── */}
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="inline-flex flex-1 items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
                <button
                  type="button"
                  onClick={() => requestTaxonomySwitch('products')}
                  className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                    taxonomy === 'products' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => requestTaxonomySwitch('materials')}
                  className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                    taxonomy === 'materials' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Materials
                </button>
                <button
                  type="button"
                  onClick={() => requestTaxonomySwitch('spaces')}
                  className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                    taxonomy === 'spaces' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Inspiration · space type settings + design references con productos taggeados"
                  aria-label="Inspiration (previously Spaces)"
                >
                  Inspiration
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Resto del sidebar oculto cuando collapsed */}
          {!sidebarCollapsed && <>

          {/* Fase 2 · en Spaces mode ocultamos Search/Sort/Bulk/Filters (no aplican
              al grid de Space Types) · dejamos sólo el toggle + Quick Actions al final. */}
          {!isSpaces && <>

          {/* ───── SEARCH + SORT ───── */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Search</h3>
            <div className="space-y-1.5">
              {/* F50 · Etapa 9 (integración) · v2 · un solo trigger visual
                  del AI search palette. Reemplaza el input inline + el botón
                  "AI search" separados. Look-and-feel de input (search icon
                  a la izq · placeholder o search actual · ícono varita + kbd
                  al final) · onClick abre el palette con initialQuery pre-
                  cargado. Botón X inline limpia el search sin abrir modal. */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setSearchPaletteOpen(true)}
                  className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-background pl-9 pr-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus:border-ring focus:outline-none"
                  title="Open search · SKU, name, brand, NL & visual · shortcut: /"
                >
                  <span className={`flex-1 truncate ${search ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {search || 'SKU, name, brand, or "chairs under $500"'}
                  </span>
                  <Wand2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <kbd className="rounded border border-border bg-card px-1 py-0.5 text-[9px] font-mono text-muted-foreground shrink-0">/</kbd>
                </button>
                {search && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSearch('')
                      setPage(1)
                    }}
                    aria-label="Clear search"
                    title="Clear search"
                    className="absolute right-16 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                )}
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
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
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
                    // F50 · Wave 6 · v2 · bulk-save · agrega la selección a
                    // la colección default (o crea "Favorites" si no hay
                    // ninguna todavía).
                    const targetId = collections[0]?.id ?? createCollection('Favorites').id
                    for (const id of selected) addToCollection(targetId, id)
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
                  Selection ({selected.size})
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

            {/* F50 · Wave 6 · v2 · Collections (P7 del PRD) · reemplaza el
                toggle-flat de favoritos por una lista de colecciones filtrable.
                Cada colección abre/cierra el filtro dedicado. "All saved"
                agrupa todo lo guardado (equivalente al viejo Favorites). */}
            <div className="mb-2 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveCollectionFilter(null)
                  setPage(1)
                }}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeCollectionFilter === null
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-foreground hover:bg-muted'
                }`}
              >
                <Heart className={`h-4 w-4 ${activeCollectionFilter === null && favorites.size > 0 ? 'fill-destructive text-destructive' : ''}`} />
                All saved
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {favorites.size}
                </span>
              </button>
              {collections.length > 0 && (
                <div className="space-y-0.5 pl-2">
                  {collections.map((c) => {
                    const isActive = activeCollectionFilter === c.id
                    return (
                      <div key={c.id} className="group flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCollectionFilter(isActive ? null : c.id)
                            setPage(1)
                          }}
                          className={`flex flex-1 items-center gap-2 rounded-md border px-3 py-1 text-[13px] font-medium transition-colors ${
                            isActive
                              ? 'border-primary/40 bg-primary/10 text-foreground'
                              : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <FolderIcon className="h-3.5 w-3.5" />
                          <span className="min-w-0 flex-1 truncate text-left">{c.name}</span>
                          <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                            {c.productIds.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            // F50 · Etapa 8 · copia al clipboard el link
                            // firmado (mock) y notifica al user. Fallback
                            // silencioso a prompt si el clipboard falla.
                            const link = encodeCollectionShareLink(c)
                            try {
                              await navigator.clipboard.writeText(link)
                              addToast('success', `"${c.name}" link copied · paste it anywhere to share read-only.`)
                            } catch {
                              window.prompt('Copy this link:', link)
                            }
                          }}
                          aria-label={`Copy share link for ${c.name}`}
                          title="Copy shareable read-only link"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                        >
                          <Share2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const nextName = await prompt({
                              title: 'Rename collection',
                              label: 'Collection name',
                              initialValue: c.name,
                              submitLabel: 'Save',
                            })
                            if (nextName) renameCollection(c.id, nextName)
                          }}
                          aria-label={`Rename ${c.name}`}
                          title="Rename collection"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirm({
                              title: `Delete "${c.name}"?`,
                              description: 'Products stay in the catalog. Only the collection grouping is removed.',
                              confirmLabel: 'Delete collection',
                              danger: true,
                            })
                            if (ok) {
                              if (activeCollectionFilter === c.id) setActiveCollectionFilter(null)
                              deleteCollection(c.id)
                            }
                          }}
                          aria-label={`Delete ${c.name}`}
                          title="Delete collection"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={async () => {
                  const name = await prompt({
                    title: 'New collection',
                    label: 'Collection name',
                    placeholder: 'e.g. Lounge Chairs',
                    submitLabel: 'Create collection',
                  })
                  if (name) createCollection(name)
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <FolderPlus className="h-3 w-3" />
                New collection
              </button>
            </div>

          {/* F50 · Wave 2.d · v2 · Category abierto por defecto (era cerrado).
              Wave 3.b · counts al lado de cada opción (facet independence). */}
          <FilterSection title="Category" defaultOpen>
            {categories.map((c) => checkRow(c, selectedCategories, setSelectedCategories, facetCounts.byCategory.get(c) ?? 0))}
          </FilterSection>
          <FilterSection title="Brand" defaultOpen>
            {brands.map((b) => {
              const checked = selectedBrands.has(b)
              const cat = catalogs.find((x) => x.name === b)
              const needsSync = cat?.status === 'Update Avail.'
              const isSyncing = cat ? syncingId === cat.id : false
              // F50 · Wave 3.b · facet count con independencia. Cero si no
              // hay matches en el subset actual — el row se muestra dim.
              const brandCount = facetCounts.byBrand.get(b) ?? 0
              const dim = brandCount === 0 && !checked
              return (
                <div key={b} className="flex items-center gap-2">
                  {/* F50 · Wave 3.a · checkbox real (keyboard-accessible) + count. */}
                  <label className={`flex flex-1 cursor-pointer items-center gap-2 text-sm min-w-0 transition-colors ${
                    dim ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFilter(setSelectedBrands, b)}
                      className="h-4 w-4 shrink-0 cursor-pointer rounded border-input accent-primary"
                    />
                    <span className="truncate flex-1">{b}</span>
                    <span className="tabular-nums text-[11px] text-muted-foreground shrink-0">{brandCount}</span>
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
          {/* Status + Collection · solo aplican a Products · ocultos en Materials mode */}
          {!isMaterials && (
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
          )}
          {!isMaterials && collectionsMock.length > 0 && (
            <FilterSection title="Collection">
              {/* F50 · Wave 3.b · counts con facet independence. */}
              {collectionsMock.map((c) => checkRow(c, selectedCollections, setSelectedCollections, facetCounts.byCollection.get(c) ?? 0))}
            </FilterSection>
          )}
          <FilterSection title="Features">
            {/* F50 · Wave 3.b · counts con facet independence. */}
            {features.map((f) => checkRow(f, selectedFeatures, setSelectedFeatures, facetCounts.byFeature.get(f) ?? 0))}
          </FilterSection>
          {/* F50 · Wave 2.d · v2 · Price Range abierto por defecto (era cerrado).
              Wave 2 (extensión) · agregado CustomPriceRange debajo de los presets.
              Wave 3.b · counts al lado de cada preset (facet independence). */}
          <FilterSection title="Price Range" defaultOpen>
            {UNIFIED_PRICE_RANGES.map((r) => checkRow(r.label, selectedPrices, setSelectedPrices, facetCounts.byPricePreset.get(r.label) ?? 0))}
            <div className="mt-3 border-t border-border/60 pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Custom range
              </p>
              <CustomPriceRange
                value={customPriceRange}
                onChange={(range) => {
                  setCustomPriceRange(range)
                  setPage(1)
                }}
              />
            </div>
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

          </>}
          {/* /!isSpaces · fin del bloque Search/Filters/Bulk */}

          {/* Fase 4 · Sidebar block para Spaces mode · Search + Sort + Filters
              (Space Profile, Estimated Cost, Brand). Reusa FilterSection +
              checkRow que ya existen arriba. Solo visible cuando el toggle
              taxonomy está en 'spaces' (y el sidebar no está collapsed). */}
          {isSpaces && (<>
            {/* SEARCH + SORT */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Search</h3>
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={spacesSearch}
                    onChange={(e) => setSpacesSearch(e.target.value)}
                    placeholder="Space name, F1, WC1…"
                    title="Search by space name, description, or setting code (F1, WC1, etc)"
                    className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSpacesSortOpen((o) => !o)}
                    className="inline-flex h-9 w-full items-center justify-between rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <span className="truncate">{spacesActiveSortLabel}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                  {spacesSortOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setSpacesSortOpen(false)} />
                      <div className="absolute left-0 top-full z-40 mt-2 w-full rounded-xl border border-border bg-card p-1 shadow-lg">
                        {SPACES_SORT_OPTIONS.map((o) => (
                          <button
                            key={o.key}
                            type="button"
                            onClick={() => {
                              setSpacesSort(o.key)
                              setSpacesSortOpen(false)
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                          >
                            {o.label}
                            {spacesSort === o.key && <Check className="h-4 w-4 text-foreground" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* FILTERS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3 w-3" />
                  Filters
                </h3>
                {hasActiveSpacesFilters && (
                  <button
                    type="button"
                    onClick={clearSpacesFilters}
                    className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <FilterSection title="Profile" defaultOpen>
                {(['CCO', 'GW', 'CI'] as const).map((sp) =>
                  checkRow(sp, spacesSelectedProfiles, setSpacesSelectedProfiles)
                )}
              </FilterSection>
              <FilterSection title="Estimated Cost">
                {SPACES_COST_BUCKETS.map((b) =>
                  checkRow(b.label, spacesSelectedCostBuckets, setSpacesSelectedCostBuckets)
                )}
              </FilterSection>
              <FilterSection title="Brand">
                {spacesBrandList.map((b) => checkRow(b, spacesSelectedBrands, setSpacesSelectedBrands))}
              </FilterSection>
            </div>
          </>)}
          {/* /isSpaces sidebar block */}

          {/* Diego ask · Quick Actions debe quedar pegado a los filtros (arriba
              del bloque Custom Spaces) · el usuario espera las utilidades
              globales inmediatamente después de los filtros, sin secciones
              contextuales de por medio.
              ═════════════════════════════════════════════════════════════════ */}
          {/* ───── QUICK ACTIONS · directamente después de los filtros ───── */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quick Actions</h3>
            <div className="space-y-1.5">
              {/* Fase 5 · Create custom space · SOLO visible en Spaces mode */}
              {isSpaces && (
                <button
                  type="button"
                  onClick={openCreateCustom}
                  className="flex w-full items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Create custom space
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowIngest(true)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isSpaces
                    ? 'border border-border bg-card text-foreground hover:bg-muted'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
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

          {/* Fase 5 · Custom Spaces section · lista de custom del tenant · solo
              en Spaces mode. Movida DESPUÉS de Quick Actions (Diego ask ·
              Quick Actions debe estar pegado a los filtros). */}
          {isSpaces && customSettings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  My custom spaces ({customSettings.length})
                </h3>
              </div>
              <ul className="space-y-1">
                {customSettings.slice(0, 6).map((cs) => {
                  const parent = SPACE_TYPES.find(t => t.id === cs.spaceTypeId)
                  return (
                    <li key={cs.id} className="group flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
                      <span className="text-sm shrink-0" aria-hidden="true">{parent?.icon ?? '🏢'}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1">
                          <span className="inline-flex items-center rounded-md bg-primary/15 px-1 text-[9px] font-bold text-foreground">{cs.code}</span>
                          <span className="text-[11px] font-semibold text-foreground truncate">{cs.name}</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground truncate">{parent?.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditCustom(cs)}
                        className="opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        title="Edit"
                        aria-label="Edit custom space"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </li>
                  )
                })}
                {customSettings.length > 6 && (
                  <li className="text-[10px] text-muted-foreground italic px-2 py-1">
                    +{customSettings.length - 6} more · manage from a space detail
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* F50 · sample flow (2026-08-03) · v2 · panel permanente al
              final del sidebar del Product Catalog · muestra draft +
              in-flight + delivered con badge en el header colapsable.
              Sync automático con el hook via CustomEvent.
              F51 fix (2026-08-04) · movido DENTRO del bloque
              !sidebarCollapsed · antes quedaba flotando cuando el
              sidebar se colapsaba a w-12 y no había espacio para
              renderizarlo correctamente. */}
          <div className="-mx-0">
            <SampleTrackingPanel onOpenTracking={() => setTrackingOpen(true)} />
          </div>
          </>}
    </>
  )

  return (
    <div className="space-y-5">
      {/* Header · title + description + inline tab-bar aside (MRL/Dealer/Figma/PC/MyS).
          Diego ask (2026-07-07) · renamed "Showroom" → "Product Catalog" and the
          top mode-switch bar is injected here to save vertical space. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-brand text-2xl font-bold tracking-tight text-foreground">Product Catalog</h1>
          <p className="text-sm text-muted-foreground">Browse products, materials and pre-configured spaces in one place.</p>
        </div>
        {headerAside && <div className="self-center">{headerAside}</div>}
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

      {/* F50 · Wave 5 · v2 · trigger del drawer mobile · solo aparece en
          pantallas menores a lg. En desktop la sidebar está siempre visible. */}
      <button
        type="button"
        onClick={() => setIsMobileFilterOpen(true)}
        className="mb-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors lg:hidden"
        aria-label="Open filters and search"
      >
        <MenuIcon className="h-4 w-4" />
        Filters &amp; sort
        {activeFiltersCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Main: sidebar + grid */}
      <div className="flex gap-6">
        <aside className={`hidden shrink-0 lg:block transition-[width] duration-200 ${
          sidebarCollapsed ? 'w-12' : 'w-64 space-y-5'
        }`}>
          {sidebarContents}
        </aside>

        <HeadlessDialog
          open={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          className="relative z-[60] lg:hidden"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-y-0 left-0 flex max-w-full">
            <HeadlessDialog.Panel className="flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-background p-4 space-y-5 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
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
              {sidebarContents}
            </HeadlessDialog.Panel>
          </div>
        </HeadlessDialog>

        <div className="flex-1">
          {/* Fase 2 · Spaces mode · reemplaza grid de productos por Space Types
              cards (o el detail del tipo seleccionado). Reusa los componentes
              creados en Fase 2 pero embebidos en el shell del ShowroomPage. */}
          {isSpaces ? (
            selectedSpaceType ? (
              <SpaceTypeDetailPage
                spaceType={selectedSpaceType}
                onBack={() => setSelectedSpaceType(null)}
                onViewSelection={() =>
                  window.dispatchEvent(new CustomEvent('expert-hub:open-quotes'))
                }
                customSettings={customSettings.filter(cs => cs.spaceTypeId === selectedSpaceType.id)}
                onEditCustom={openEditCustom}
                onDuplicateCustom={(id) => { duplicateCustom(id) }}
                onDeleteCustom={(id) => { deleteCustom(id) }}
                isCustom={isCustomSettingId}
                onCreateCustom={openCreateCustom}
              />
            ) : (
              <SpaceTypesPage
                onSelectSpaceType={setSelectedSpaceType}
                filters={spacesFilters}
                sort={spacesSort}
                onClearFilters={clearSpacesFilters}
                customCountByParent={customCountByParent}
                onCreateCustom={openCreateCustom}
              />
            )
          ) : (
          <>
          {/* F50 · Wave 2 (extensión) · header de la vista con contador de
              resultados y GridDensitySelector. Wave 4 · botón "Sample requests"
              con badge de count (solo cuando hay pendientes). */}
          {pageItems.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Showing {pageItems.length} of {filtered.length} results
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTrackingOpen(true)}
                  title="View sample requests"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <PackageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sample requests</span>
                  {sampleRequestsPending > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {sampleRequestsPending}
                    </span>
                  )}
                </button>
                {activeCollectionFilter !== null && (
                  <CollectionGroupByToggle
                    value={collectionGroupBy}
                    onChange={setCollectionGroupBy}
                  />
                )}
                <GridDensitySelector
                  value={gridDensity}
                  onChange={handleGridDensityChange}
                  label="Density"
                />
              </div>
            </div>
          )}

          {/* F50 · Wave 2.b · aire editorial · grid density controlado por el
              usuario (Auto/2/3/4) via GridDensitySelector. Default 'auto'
              usa 1/2/3 columnas según breakpoint (más aire que v1 · 4-col).
              F50 · Etapa 8 · cuando hay colección activa + groupBy !== flat,
              renderea el filtered completo (sin paginación) agrupado por
              color o categoría. Colecciones típicamente son chicas así que
              no vale la pena partir un grupo entre páginas. */}
          {activeCollectionFilter !== null && collectionGroupBy !== 'flat' ? (
            (() => {
              const groups = groupProductsBy(filtered, collectionGroupBy)
              return (
                <div className="space-y-6">
                  {groups.map(([groupKey, groupProducts]) => (
                    <section key={groupKey}>
                      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {collectionGroupBy === 'color' ? (
                          <Palette className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <Tag className="h-3 w-3" aria-hidden="true" />
                        )}
                        <span>{groupKey}</span>
                        <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground normal-case tracking-normal">
                          {groupProducts.length}
                        </span>
                      </h3>
                      <div className={gridClassesFor(gridDensity)}>
                        {groupProducts.map((p) => (
                          <ProductCatalogCard
                            key={p.id}
                            product={p}
                            selected={selected.has(p.id)}
                            favorite={favorites.has(p.id)}
                            onToggleSelect={(id) => toggleFromSet(setSelected, id)}
                            onToggleFavorite={(id) => setCollectionModalProductId(id)}
                            onRequestSwatch={handleRequestSwatch}
                            onOpen={(prod) => { recordView(prod.id); setDetailId(prod.id) }}
                            onAddToProject={(prod) => setAddToProjectProduct(prod)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )
            })()
          ) : (
            <div className={gridClassesFor(gridDensity)}>
              {pageItems.map((p) => (
                <ProductCatalogCard
                  key={p.id}
                  product={p}
                  selected={selected.has(p.id)}
                  favorite={favorites.has(p.id)}
                  onToggleSelect={(id) => toggleFromSet(setSelected, id)}
                  onToggleFavorite={(id) => {
                    // F50 · Wave 6 · v2 · click en el heart abre el modal para
                    // elegir a qué colección(es) agregar/quitar. El toggle-flat
                    // legacy (toggleSaved) queda disponible como shift-click
                    // para 1-click add/remove sin abrir el modal.
                    setCollectionModalProductId(id)
                  }}
                  onRequestSwatch={handleRequestSwatch}
                  onOpen={(prod) => { recordView(prod.id); setDetailId(prod.id) }}
                  onAddToProject={(prod) => setAddToProjectProduct(prod)}
                />
              ))}
            </div>
          )}

          {pageItems.length === 0 && (
            // F50 · Wave 2.c · empty state con ilustración + acción "Clear filters".
            // Reemplaza el texto plano legacy · reusa EmptyState del design system.
            <EmptyState>
              <EmptyStateIcon>
                <SearchX className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </EmptyStateIcon>
              <EmptyStateTitle>No items match your filters</EmptyStateTitle>
              <EmptyStateDescription>
                Try removing a filter or two, or search with different keywords.
              </EmptyStateDescription>
              {hasActiveFilters && (
                <EmptyStateActions>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Clear filters
                  </button>
                </EmptyStateActions>
              )}
            </EmptyState>
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
          </>
          )}
          {/* /isSpaces ? spaces UI : products/materials grid + pagination */}
        </div>
      </div>

      {/* Bulk actions · floating bar centrada al bottom (mismo UX que ProductCatalogPage).
          Diego ask · el panel inline del sidebar era poco visible · ahora bar
          flotante consistente con todo el catálogo. El sidebar inline se mantiene
          como entry-point alternativo cuando el sidebar está expandido. */}
      {selected.size > 0 && (
        <BulkActionsBar
          count={selected.size}
          onDeselectAll={() => setSelected(new Set())}
          onCompare={() => setShowCompare(true)}
          onAddToFavorites={() => {
            // F50 · Wave 6 · v2 · bulk-save · idem al bulk-save del sidebar.
            const targetId = collections[0]?.id ?? createCollection('Favorites').id
            for (const id of selected) addToCollection(targetId, id)
            setSelected(new Set())
          }}
          onRequestQuote={() => {
            setQuoteQueue(selectedProducts)
            setSelected(new Set())
          }}
        />
      )}

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

      {/* Fase 5 · Create/Edit Custom Space wizard modal · siempre montado, controla via `open` */}
      <CreateEditSpaceModal
        open={customModalOpen}
        onClose={() => { setCustomModalOpen(false); setEditingCustom(null) }}
        editing={editingCustom}
        onSubmit={handleCustomSubmit}
      />

      {/* F50 · Wave 1.b · confirmación al cambiar de taxonomía cuando hay
          filtros activos. Solo se abre cuando pendingTaxonomy !== null. */}
      <ConfirmSwitchModal
        isOpen={pendingTaxonomy !== null}
        fromLabel={taxonomyLabel(taxonomy)}
        toLabel={pendingTaxonomy ? taxonomyLabel(pendingTaxonomy) : ''}
        activeFiltersCount={activeFiltersCount}
        onConfirm={() => {
          if (pendingTaxonomy) applyTaxonomySwitch(pendingTaxonomy)
          setPendingTaxonomy(null)
        }}
        onCancel={() => setPendingTaxonomy(null)}
      />

      {/* F50 · Wave 4 (refactor 2026-08-03) · sample tracking slide-over
          con secciones Draft (arriba) + Sent (abajo · pending/shipped/
          delivered). Reemplaza el modal 3-step que existía · el flow
          nuevo agrega al draft con 1 click y submitea batch desde acá. */}
      <SampleTrackingSlideOver
        open={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        onSubmitted={(count) => {
          addToast('success', `${count} ${count === 1 ? 'sample request submitted' : 'sample requests submitted'} · you will be notified when they ship.`)
        }}
        // F51 fix (2026-08-04) · wire de los callbacks contextuales para
        // el empty state CTA + el dropdown "Add another material" del
        // Draft. Ya estamos en Product Catalog, así que onBrowseCatalog
        // switchea taxonomy=materials (o solo cierra si ya está).
        // onBrowseMRL sale del showroom via CustomEvent que CatalogPageV2
        // escucha (setMode 'browse'). currentContext deriva de la
        // taxonomy actual.
        onBrowseCatalog={() => {
          setTrackingOpen(false)
          if (taxonomy !== 'materials') setTaxonomy('materials')
        }}
        onBrowseMRL={() => {
          setTrackingOpen(false)
          window.dispatchEvent(new CustomEvent('expert-hub:navigate-to-mrl'))
        }}
        currentContext={taxonomy === 'materials' ? 'catalog-materials' : 'catalog-other'}
      />

      {/* F50 · Wave 6 · v2 · Add-to-collection modal · se abre al click del
          heart de cualquier card del catálogo. Multi-select de colecciones
          + input para crear nuevas sobre la marcha. */}
      <AddToCollectionModal
        open={collectionModalProductId !== null}
        onClose={() => setCollectionModalProductId(null)}
        productId={collectionModalProductId ?? ''}
        productName={
          collectionModalProductId
            ? taxoProducts.find((p) => p.id === collectionModalProductId)?.name
            : undefined
        }
        collections={collections}
        onCreateCollection={createCollection}
        onAddToCollection={addToCollection}
        onRemoveFromCollection={removeFromCollection}
        onDeleteCollection={deleteCollection}
      />

      {/* F50 · Etapa 9 (P1 search · integración) · v2 · command palette
          style search. Se abre desde el input inline del sidebar (que ahora
          es un trigger visual) o con hotkey `/`. Recibe el search actual
          como initialQuery para no forzar retype. */}
      <SearchCommandPalette
        open={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
        products={taxoProducts}
        manufacturers={taxoManufacturers}
        initialQuery={search}
        onApplyStructuredFilters={(f) => {
          if (f.text !== undefined) setSearch(f.text)
          if (f.category) setSelectedCategories(new Set([f.category]))
          if (f.tags && f.tags.length > 0) setSelectedFeatures(new Set(f.tags))
          // Precio custom · usa el rango custom que soporta min/max libre.
          if (f.minPrice !== undefined || f.maxPrice !== undefined) {
            setCustomPriceRange({
              min: f.minPrice ?? 0,
              max: f.maxPrice ?? 100000,
            })
          }
          setPage(1)
        }}
        onApplyFreeText={(t) => {
          setSearch(t)
          setPage(1)
        }}
        onOpenProduct={(id) => {
          recordView(id)
          setDetailId(id)
        }}
        onOpenBrand={(name) => {
          setSelectedBrands(new Set([name]))
          setPage(1)
        }}
        onOpenCategory={(cat) => {
          setSelectedCategories(new Set([cat]))
          setPage(1)
        }}
        onOpenVisualSearch={() => {
          setSearchPaletteOpen(false)
          setVisualSearchOpen(true)
        }}
      />
      <VisualSearchModal
        open={visualSearchOpen}
        onClose={() => setVisualSearchOpen(false)}
        products={taxoProducts}
        onOpenProduct={(id) => {
          recordView(id)
          setDetailId(id)
        }}
      />

      {/* F50 · Etapa 10.d · v2 · modal para enviar un producto del catálogo
          a un project · room · zone. Muestra la lista plana de combos
          existentes + botón "New project" que crea uno con room/zone
          default y agrega el producto ahí. */}
      <AddToProjectModal
        open={addToProjectProduct !== null}
        onClose={() => setAddToProjectProduct(null)}
        productName={addToProjectProduct?.name ?? ''}
        projects={projects}
        onCreateProject={(name) => createProject(name)}
        onAdd={(projectId, roomId, zoneId) => {
          if (!addToProjectProduct) return
          addItemToProject(projectId, roomId, zoneId, addToProjectProduct.id, 1)
          const projectName = projects.find((p) => p.id === projectId)?.name ?? 'project'
          addToast('success', `${addToProjectProduct.name} added to ${projectName}`)
          setAddToProjectProduct(null)
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

// F51 · B.3 (consolidación 2026-08-04) · groupProductsBy y GroupByButton
// se movieron a browse/collectionGrouping · single source of truth
// compartida con CollectionShareView.
