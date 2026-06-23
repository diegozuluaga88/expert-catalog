import { useState } from 'react'
import { LibraryBig, Settings2, ShoppingBag, Store } from 'lucide-react'
import Navbar from '../components/Navbar'
import type { Manufacturer, Category, Product } from './types'
import LibraryPage from './browse/LibraryPage'
import ManufacturerPage from './browse/ManufacturerPage'
import CategoryPage from './browse/CategoryPage'
import ProductDetailPage from './browse/ProductDetailPage'
import ManageCatalogs from './manage/ManageCatalogs'
import ProductCatalogPage from './shop/ProductCatalogPage'
import ShowroomPage from './showroom/ShowroomPage'

// Etapa 4 — Modo Browse: estructura de catalog-test (Library→Manufacturer→Category→Product),
// montada dentro de expert-hub. El NavState replica el patrón de `catalog-test/src/App.tsx`.
// Manage (admin) llega en Etapa 5.

type CatalogMode = 'browse' | 'manage' | 'shop' | 'showroom'
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
  const [mode, setMode] = useState<CatalogMode>('browse')
  const [nav, setNav] = useState<BrowseNav>({ page: 'library' })
  const navigate = (state: BrowseNav) => setNav(state)

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
        {/* Mode switch: Browse | Manage */}
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
          <button type="button" onClick={() => setMode('browse')} className={tabClass(mode === 'browse')}>
            <LibraryBig className="h-4 w-4" />
            Browse
          </button>
          <button type="button" onClick={() => setMode('manage')} className={tabClass(mode === 'manage')}>
            <Settings2 className="h-4 w-4" />
            Manage
          </button>
          <button type="button" onClick={() => setMode('shop')} className={tabClass(mode === 'shop')}>
            <ShoppingBag className="h-4 w-4" />
            Product Catalog
          </button>
          <button type="button" onClick={() => setMode('showroom')} className={tabClass(mode === 'showroom')}>
            <Store className="h-4 w-4" />
            Showroom
          </button>
        </div>

        {mode === 'browse' ? (
          renderBrowse()
        ) : mode === 'manage' ? (
          <ManageCatalogs />
        ) : mode === 'shop' ? (
          <ProductCatalogPage />
        ) : (
          <ShowroomPage />
        )}
      </div>
    </>
  )
}
