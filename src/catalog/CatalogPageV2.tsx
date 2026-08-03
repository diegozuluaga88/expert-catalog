import { useEffect, useState } from 'react'
import { LibraryBig, Store, FileText, FolderKanban } from 'lucide-react'
import Navbar from '../components/Navbar'
import type { Manufacturer, Category, Product } from './types'
import LibraryPage from './browse/LibraryPageV2'
import ManufacturerPage from './browse/ManufacturerPage'
import CategoryPage from './browse/CategoryPage'
import ProductDetailPage from './browse/ProductDetailPage'
import ShowroomPageV2 from './showroom/ShowroomPageV2'
import QuotesPageV2 from '../quote/QuotesPageV2'
import MiniCartDrawer from '../quote/MiniCartDrawer'
import { useQuote } from '../quote/QuoteContext'
import { TabInfoTrigger,
  TAB_INFO_MRL,
  TAB_INFO_PRODUCT_CATALOG,
  TAB_INFO_MY_SELECTION,
} from './TabInfoTooltip'
// F50 · Etapa 10 (P2 Project Builder) · v2 · nuevo sub-tab "My Projects".
import ProjectsPage from './projects/ProjectsPage'

// F49 · v2 (refactor UX) · duplicado de CatalogPage.tsx sin los 2 tabs
// "reference" (Dealer/Quote + Figma) que quedaron absorbidos en las otras
// opciones. Base para las próximas iteraciones del refactor (Quick Wins,
// Critical fixes) que ya no tocan v1.
type CatalogMode = 'browse' | 'showroom' | 'quotes' | 'projects'
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

export default function CatalogPageV2({ onLogout, onNavigate }: CatalogPageProps) {
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
            variant="v2"
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
        {(() => {
          const modeTabBar = (
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
              <button type="button" onClick={() => setMode('browse')} className={tabClass(mode === 'browse')}>
                <LibraryBig className="h-4 w-4" />
                MRL
                <TabInfoTrigger content={TAB_INFO_MRL} align="start" />
              </button>
              <button type="button" onClick={() => setMode('showroom')} className={tabClass(mode === 'showroom')}>
                <Store className="h-4 w-4" />
                Product Catalog
                <TabInfoTrigger content={TAB_INFO_PRODUCT_CATALOG} align="center" />
              </button>
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
                <TabInfoTrigger content={TAB_INFO_MY_SELECTION} align="end" />
              </button>
              {/* F50 · Etapa 10 (P2 Project Builder) · v2 · sub-tab "My Projects". */}
              <button type="button" onClick={() => setMode('projects')} className={tabClass(mode === 'projects')}>
                <FolderKanban className="h-4 w-4" />
                My Projects
              </button>
            </div>
          )
          const hideTopBar = mode === 'showroom'
          return (
            <>
              {!hideTopBar && modeTabBar}
              {mode === 'browse' ? (
                renderBrowse()
              ) : mode === 'quotes' ? (
                <QuotesPageV2 onBack={() => setMode('showroom')} />
              ) : mode === 'projects' ? (
                <ProjectsPage />
              ) : (
                <ShowroomPageV2 headerAside={modeTabBar} />
              )}
            </>
          )
        })()}
      </div>

      {(mode === 'showroom' || mode === 'quotes') && (
        <MiniCartDrawer onViewQuote={() => setMode('quotes')} />
      )}
    </>
  )
}
