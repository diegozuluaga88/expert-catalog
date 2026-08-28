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
// Fix filtro de categorías (2026-08-10) · el sidebar muestra las genéricas
// del referente (Seating, Casegoods, Acoustic…) y el seed tiene nombres de
// línea de producto (Chairs, Axyl, Seating & Collaboration…). El mapa
// traduce entre ambos · antes el match era exacto y daba 0/24 en Products.
import { matchesCategoryAlias } from '../data/categoryAliases'
import ShelfView from '../components/ShelfViewV2'
import GridView from '../components/GridView'
import FilterSidebar from '../components/FilterSidebar'
import MRLSidebarAds from '../components/MRLSidebarAds'
import { useMyBinders } from './useMyBinders'
import { ToastContainer, useToast } from '../../components/AuthToast'
import { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from 'strata-design-system'
// F50 · Etapa 9-ext · v2 · command palette compartido con el Product Catalog.
// F70c (2026-08-07) · el MRL ahora también consume productos + visual search
// (P1 del PRD · search AI/visual sitewide). Al abrir un producto desde el
// palette se resuelve el brand y se navega al ManufacturerPage.
import SearchCommandPalette from '../search/SearchCommandPalette'
// F70c · visual search modal · el MRL ahora expone el "upload image · find
// similar" que hasta ahora solo vivía en Products. Al abrir un resultado
// se navega al brand del producto.
import VisualSearchModal from '../search/VisualSearchModal'
// F70c · productos unificados para el índice del search palette del MRL.
// La NL query ("chairs under $500") ahora devuelve productos reales, no
// solo brands. Se filtra por el tab activo (products vs materials).
import { UNIFIED_PRODUCTS } from '../showroom/data/unifiedProducts'
// F58b.2 · widget shortcut al modal "My Setup" desde el MRL sidebar.
import ManageSetupPanel from '../manage/ManageSetupPanel'
// F64 · banner intro dismissible que explica el 2-tab framing (Library/Products).
import TabIntroBanner from '../components/TabIntroBanner'
// F51 · B.2 · P3 Miller Knoll skeleton · se renderiza cuando la URL
// trae ?mkPreview=1 · scaffolding editable (screenshots pendientes).
import LibraryPageV2MK from './LibraryPageV2MK'

interface LibraryPageV2Props {
  onSelectManufacturer: (m: Manufacturer) => void
}

const STORAGE_KEY_VIEW = 'catalog-view-mode'

// F51 · B.2 · MK-preview flag · hoisted fuera del componente para evitar
// early-return antes de los hooks. Se computa una vez por mount.
const isMKPreview = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('mkPreview') === '1'

export default function LibraryPageV2({ onSelectManufacturer }: LibraryPageV2Props) {
  // Short-circuit al skeleton MK · no hay hooks arriba de este return.
  // El componente MK tiene sus propios hooks internos.
  if (isMKPreview) {
    return (
      <LibraryPageV2MK
        onSelectManufacturer={onSelectManufacturer}
        onBackToClassic={() => {
          const url = new URL(window.location.href)
          url.searchParams.delete('mkPreview')
          window.location.href = url.toString()
        }}
      />
    )
  }
  const [activeTab, setActiveTab] = useState<LibraryTab>('products')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEY_VIEW) as ViewMode) ?? 'shelf'
  })
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  // MRL Fase 6 (2026-07-09) · state del filtro "Custom Library" · owned aquí y
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
  // Custom Library toggle. Se propaga como prop a ShelfView → BinderLibrary.
  const { toasts, addToast, dismissToast } = useToast()

  // F50 · Wave 5 · v2 · drawer mobile del FilterSidebar. En desktop la
  // sidebar es siempre visible; en mobile se oculta y aparece un botón
  // hamburger que abre este drawer full-height desde la izquierda.
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  // F50 · Etapa 9-ext · v2 · command palette del MRL. Reusa el mismo
  // componente que el Product Catalog.
  // F70c · ahora también con productos + visual search (P1 PRD sitewide).
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false)
  const [visualSearchOpen, setVisualSearchOpen] = useState(false)
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW, viewMode)
  }, [viewMode])

  const baseList = activeTab === 'products' ? PRODUCTS_MANUFACTURERS : MATERIALS_MANUFACTURERS

  // F70c · productos que alimentan el palette + visual search del MRL.
  // Filtramos por el tab activo (materials vs products) usando isMaterial.
  // La resolución productId → brand vive inline en onOpenProduct abajo.
  const scopedProducts = activeTab === 'materials'
    ? UNIFIED_PRODUCTS.filter(p => p.isMaterial)
    : UNIFIED_PRODUCTS.filter(p => !p.isMaterial)

  // F70c · handler compartido palette + visual · resuelve el brand del
  // producto (p.brand === Manufacturer.name) y navega al ManufacturerPage
  // via onSelectManufacturer. Fallback silencioso si el brand no está en
  // el baseList del tab activo (ej. producto material buscado en products
  // tab · edge case).
  const openProductByBrand = (productId: string) => {
    const product = scopedProducts.find(p => p.id === productId)
    if (!product?.brand) return
    const brand = baseList.find(m => m.name === product.brand)
    if (brand) onSelectManufacturer(brand)
  }

  const filtered = baseList.filter(m => {
    const matchesSearch = search === '' || m.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      selectedCategory === null ||
      matchesCategoryAlias(m.categories.map(c => c.name), selectedCategory)
    // MRL Fase 8 · OR logic entre tags · manufacturer pasa si tiene al menos
    // uno de los tags activos. Cuando activeTags está vacío no filtra.
    const matchesTags =
      activeTags.size === 0 || (m.tags?.some(t => activeTags.has(t)) ?? false)
    return matchesSearch && matchesCategory && matchesTags
  })

  // F50 · Wave 5 · v2 · el FilterSidebar se referencia una vez y se renderea
  // en dos lugares (desktop inline + mobile Dialog). Solo uno visible por
  // breakpoint.
  // F50 · Etapa 9 (integración) · v2 · el input clásico del sidebar es el
  // único trigger del AI search palette (unificado, sin duplicar UI). El
  // FilterSidebar lo convierte en button visualmente idéntico cuando recibe
  // onSearchClick. v1 no lo pasa (input clásico intacto).
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
      onSearchClick={() => setSearchPaletteOpen(true)}
      bottomSlot={<>
        {/* F58b.2 · ManageSetupPanel · shortcut al modal My Setup
            (Catalogs · Manufacturers · Buying preferences) desde el MRL. */}
        <ManageSetupPanel />
      </>}
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
          {/* F64 · TabIntroBanner · dismissible per-session · explica el 2-tab
              framing (Library = legacy scope · Products = Strata superset preview) */}
          <TabIntroBanner variant="library" />
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
            <GridView manufacturers={filtered} onSelect={onSelectManufacturer} onToast={addToast} />
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

      {/* F50 · Etapa 9-ext · v2 · AI search palette del MRL library.
          F70c (2026-08-07) · P1 PRD search AI/visual sitewide.
          Antes: products=[], showVisualSearch=false, onOpenProduct no-op.
          Ahora: alimentado con UNIFIED_PRODUCTS scoped al tab (products vs
          materials), visual search enabled, y onOpenProduct resuelve el
          brand del producto y navega al ManufacturerPage. */}
      <SearchCommandPalette
        open={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
        products={scopedProducts}
        manufacturers={baseList}
        showVisualSearch={true}
        placeholder='Search brands, products · try "quickship chairs under $600"'
        initialQuery={search}
        onApplyStructuredFilters={(f) => {
          if (f.text !== undefined) setSearch(f.text)
          if (f.tags && f.tags.length > 0) setActiveTags(new Set(f.tags))
          // f.category no aplica directamente al MRL (que agrupa brands, no
          // productos) · como fallback lo pusheo al search plain text.
          if (f.category && (f.text ?? '') === '') setSearch(f.category)
        }}
        onApplyFreeText={(t) => setSearch(t)}
        onOpenProduct={openProductByBrand}
        onOpenBrand={(name) => {
          const brand = baseList.find((m) => m.name === name)
          if (brand) onSelectManufacturer(brand)
        }}
        onOpenCategory={(cat) => setSelectedCategory(cat)}
        onOpenVisualSearch={() => {
          setSearchPaletteOpen(false)
          setVisualSearchOpen(true)
        }}
      />
      {/* F70c · Visual search "upload image → find similar" · alineado
          con Products tab. Al abrir un resultado se resuelve el brand
          y se navega al ManufacturerPage (misma UX que el palette NL). */}
      <VisualSearchModal
        open={visualSearchOpen}
        onClose={() => setVisualSearchOpen(false)}
        products={scopedProducts}
        onOpenProduct={openProductByBrand}
      />

      {/* Toast container · muestra feedback de Custom Library toggle */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
