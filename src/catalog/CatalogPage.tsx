import { useEffect, useState } from 'react'
import { LibraryBig, Settings2, ShoppingBag, Store, FileText } from 'lucide-react'
import Navbar from '../components/Navbar'
import type { Manufacturer, Category, Product } from './types'
import LibraryPage from './browse/LibraryPage'
import ManufacturerPage from './browse/ManufacturerPage'
import CategoryPage from './browse/CategoryPage'
import ProductDetailPage from './browse/ProductDetailPage'
import ManageCatalogs from './manage/ManageCatalogs'
import ProductCatalogPage from './shop/ProductCatalogPage'
import ShowroomPage from './showroom/ShowroomPage'
import QuotesPage from '../quote/QuotesPage'
import MiniCartDrawer from '../quote/MiniCartDrawer'
import { useQuote } from '../quote/QuoteContext'

// Etapa 4 — Modo Browse: estructura de catalog-test (Library→Manufacturer→Category→Product),
// montada dentro de expert-hub. El NavState replica el patrón de `catalog-test/src/App.tsx`.
// Manage (admin) llega en Etapa 5.
// Phase 3 Fix #13 iter 2 (Diego): mode 'quotes' como tab del catalog · "Mis Cotizaciones".

// Fase 2 refactor v2 · Spaces reingresado como 3ra taxonomía dentro de ShowroomPage
// (era tab standalone en v1 · Diego ask: adaptar al flujo del sidebar existente).
type CatalogMode = 'browse' | 'manage' | 'shop' | 'showroom' | 'quotes'
type BrowsePage = 'library' | 'manufacturer' | 'category' | 'product'

interface BrowseNav {
  page: BrowsePage
  manufacturer?: Manufacturer
  category?: Category
  product?: Product
}

interface CatalogPageProps {
  onLogout: () => void
  onNavigate: (page: string) => void
}

export default function CatalogPage({ onLogout, onNavigate }: CatalogPageProps) {
  const [mode, setMode] = useState<CatalogMode>('showroom')
  const [nav, setNav] = useState<BrowseNav>({ page: 'library' })
  const navigate = (state: BrowseNav) => setNav(state)
  const { activeDrafts } = useQuote()
  const totalCartUnits = activeDrafts.reduce((s, d) => s + d.items.reduce((s2, it) => s2 + it.qty, 0), 0)

  // Listen for "open-quotes" event from MiniCartDrawer · navega al tab dentro
  useEffect(() => {
    const handler = () => setMode('quotes')
    window.addEventListener('expert-hub:open-quotes', handler)
    return () => window.removeEventListener('expert-hub:open-quotes', handler)
  }, [])

  const tabClass = (active: boolean) =>
    `flex items-center gap-2 h-9 px-4 rounded-full text-sm font-semibold transition-colors ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`

  const renderBrowse = () => {
    switch (nav.page) {
      case 'library':
        return (
          <LibraryPage
            onSelectManufacturer={(m) => navigate({ page: 'manufacturer', manufacturer: m })}
          />
        )
      case 'manufacturer':
        return nav.manufacturer ? (
          <ManufacturerPage
            manufacturer={nav.manufacturer}
            onBack={() => navigate({ page: 'library' })}
            onSelectCategory={(c) =>
              navigate({ page: 'category', manufacturer: nav.manufacturer, category: c })
            }
          />
        ) : null
      case 'category':
        return nav.manufacturer && nav.category ? (
          <CategoryPage
            manufacturer={nav.manufacturer}
            category={nav.category}
            onBack={() => navigate({ page: 'manufacturer', manufacturer: nav.manufacturer })}
            onGoToLibrary={() => navigate({ page: 'library' })}
            onSelectProduct={(p) =>
              navigate({
                page: 'product',
                manufacturer: nav.manufacturer,
                category: nav.category,
                product: p,
              })
            }
          />
        ) : null
      case 'product':
        return nav.manufacturer && nav.category && nav.product ? (
          <ProductDetailPage
            manufacturer={nav.manufacturer}
            category={nav.category}
            product={nav.product}
            onBack={() =>
              navigate({ page: 'category', manufacturer: nav.manufacturer, category: nav.category })
            }
            onGoToLibrary={() => navigate({ page: 'library' })}
            onGoToManufacturer={() =>
              navigate({ page: 'manufacturer', manufacturer: nav.manufacturer })
            }
          />
        ) : null
      default:
        return null
    }
  }

  return (
    <>
      <Navbar
        onLogout={onLogout}
        activeTab="Catalog"
        onNavigateToWorkspace={() => onNavigate('catalog')}
        onNavigate={onNavigate}
      />

      <div className="pt-24 px-4 max-w-screen-2xl mx-auto space-y-6">
        {/* Mode switch: MRL | Dealer / Quote | Figma | Product Catalog | My Quotes */}
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
          <button type="button" onClick={() => setMode('browse')} className={tabClass(mode === 'browse')}>
            <LibraryBig className="h-4 w-4" />
            MRL
          </button>
          <button type="button" onClick={() => setMode('manage')} className={tabClass(mode === 'manage')}>
            <Settings2 className="h-4 w-4" />
            Dealer / Quote
          </button>
          <button type="button" onClick={() => setMode('shop')} className={tabClass(mode === 'shop')}>
            <ShoppingBag className="h-4 w-4" />
            Figma
          </button>
          {/* Diego polish · Product Catalog antes de My Quotes (browsing → cart flow) */}
          {/* Fase 2 v2 · Spaces vive dentro de Product Catalog como 3ra taxonomía
              del toggle sidebar (Products/Materials/Spaces) · sin tab dedicado. */}
          <button type="button" onClick={() => setMode('showroom')} className={tabClass(mode === 'showroom')}>
            <Store className="h-4 w-4" />
            Product Catalog
          </button>
          {/* Phase 3 Fix #13 iter 2 · "My Quotes" como tab del catalog
              (Diego: no salirnos de la sección). Badge count del cart. */}
          <button type="button" onClick={() => setMode('quotes')} className={tabClass(mode === 'quotes')}>
            <FileText className="h-4 w-4" />
            My Selection
            {totalCartUnits > 0 && (
              <span className={`inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                mode === 'quotes' ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'
              }`}>
                {totalCartUnits}
              </span>
            )}
          </button>
        </div>

        {mode === 'browse' ? (
          renderBrowse()
        ) : mode === 'manage' ? (
          <ManageCatalogs />
        ) : mode === 'shop' ? (
          <ProductCatalogPage />
        ) : mode === 'quotes' ? (
          <QuotesPage onBack={() => setMode('showroom')} />
        ) : (
          <ShowroomPage />
        )}
      </div>

      {/* Cart/FAB "Your selection" · Product Catalog + My Selection.
          Internamente retorna null si no hay items. */}
      {(mode === 'showroom' || mode === 'quotes') && (
        <MiniCartDrawer onViewQuote={() => setMode('quotes')} />
      )}
    </>
  )
}
