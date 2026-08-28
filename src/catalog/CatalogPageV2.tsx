import { useEffect, useState } from 'react'
import { LibraryBig, FolderKanban } from 'lucide-react'
import Navbar from '../components/Navbar'
import type { Manufacturer, Category, Product } from './types'
import LibraryPage from './browse/LibraryPageV2'
import ManufacturerPage from './browse/ManufacturerPage'
import CategoryPage from './browse/CategoryPage'
import ProductDetailPage from './browse/ProductDetailPage'
import { TabInfoTrigger, TAB_INFO_MRL, TAB_INFO_MY_PROJECTS } from './TabInfoTooltip'
// F50 · Etapa 10 (P2 Project Builder) · sub-tab "My Projects".
import ProjectsPage from './projects/ProjectsPage'
// F50 · Etapa 10.d · modal Add-to-project accesible desde las páginas del
// MRL (CategoryPage · ProductDetailPage).
import AddToProjectModal from './projects/AddToProjectModal'
import { useProjects } from './projects/useProjects'
import { useToast, ToastContainer } from '../components/AuthToast'
// F58b.1 · modal My Setup montado al shell para que pueda abrirse desde
// cualquier mode via el event `expert-hub:open-setup-modal`.
import CatalogImportModal, { type ManageTab } from './manage/CatalogImportModal'

// MRL scope cleanup (2026-08-27) · el shell quedó en dos modos.
//
// Capa 2b · se retiraron "Products" (superset Strata Preview · spec,
//   pricing y quote drafts) y "My Selection" (cotización · MRL no cotiza).
// Capa 2d · se retiró el flujo de samples · Sample Ordering se movió a
//   Phase 2 (Decision Log NEW-7, que Jeff repitió tres veces) y el SOW v5
//   §22 lo lista Out of Scope.
//
// Quedan Library y My Projects · dos de las cinco áreas del MVP que Jeff
// nombró: "Search, new Library/Binder UX, new Reporting, Project Tool,
// and Dealer Left Tab" (SOW v5 §1).
// Ver strata-docs/09-mrl-uwh/PROPOSAL.md.
type CatalogMode = 'browse' | 'projects'
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
  // MRL scope cleanup · el modo por defecto pasa de 'showroom' a 'browse'.
  // Library es una de las cinco áreas del MVP y era la que quedaba
  // enterrada bajo el tab de Products (UX-REVIEW.md · H4-1).
  const [mode, setMode] = useState<CatalogMode>('browse')
  const [nav, setNav] = useState<BrowseNav>({ page: 'library' })
  const navigate = (state: BrowseNav) => setNav(state)
  // F50 · Etapa 10.d · state + hooks del modal Add-to-project · sirve a
  // CategoryPage y ProductDetailPage.
  const [addToProjectProduct, setAddToProjectProduct] = useState<Product | null>(null)
  const { projects, createProject, addItem: addItemToProject } = useProjects()
  const { toasts, addToast, dismissToast } = useToast()
  // F58b.1 · My Setup modal · single instance al nivel del shell.
  const [setupModal, setSetupModal] = useState<{ open: boolean; initialTab?: ManageTab; filterByBrands?: string[] }>({ open: false })

  useEffect(() => {
    const toMRL = () => {
      setMode('browse')
      setNav({ page: 'library' })
    }
    // F58b.1 · abre el modal My Setup desde cualquier lugar del app.
    const toOpenSetup = (evt: Event) => {
      const detail = (evt as CustomEvent).detail as { tab?: ManageTab; filterByBrands?: string[] } | undefined
      setSetupModal({
        open: true,
        initialTab: detail?.tab,
        filterByBrands: detail?.filterByBrands,
      })
    }
    window.addEventListener('expert-hub:navigate-to-mrl', toMRL)
    window.addEventListener('expert-hub:open-setup-modal', toOpenSetup)
    return () => {
      window.removeEventListener('expert-hub:navigate-to-mrl', toMRL)
      window.removeEventListener('expert-hub:open-setup-modal', toOpenSetup)
    }
  }, [])

  const tabClass = (active: boolean) =>
    // F56.1 · whitespace-nowrap + flex-shrink-0 asegura que los tabs no
    // wrappean dentro del pill scrollable en mobile.
    `flex items-center gap-2 h-9 px-4 rounded-full text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
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
            onAddToProject={(p) => setAddToProjectProduct(p)}
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
            onAddToProject={(p) => setAddToProjectProduct(p)}
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
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 max-w-full overflow-x-auto md:overflow-visible flex-nowrap scrollbar-none"
               style={{ scrollbarWidth: 'none' }}>
            <button type="button" onClick={() => setMode('browse')} className={tabClass(mode === 'browse')}>
              <LibraryBig className="h-4 w-4" />
              Library
              <TabInfoTrigger content={TAB_INFO_MRL} align="start" />
            </button>
            <button type="button" onClick={() => setMode('projects')} className={tabClass(mode === 'projects')}>
              <FolderKanban className="h-4 w-4" />
              My Projects
              <TabInfoTrigger content={TAB_INFO_MY_PROJECTS} align="end" />
            </button>
          </div>
        </div>
        {mode === 'browse' ? renderBrowse() : <ProjectsPage />}
      </div>

      {/* F50 · Etapa 10.d · modal Add-to-project global para el flujo MRL. */}
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
      {/* F58b.1 · My Setup modal · single shell-level instance abierta por
          eventos globales. NEW-9 del Decision Log confirma Admin/Back Office
          como scope · en la propuesta pasa a ser área propia. */}
      <CatalogImportModal
        isOpen={setupModal.open}
        onClose={() => setSetupModal({ open: false })}
        onImportComplete={() => setSetupModal({ open: false })}
        initialTab={setupModal.initialTab}
        filterByBrands={setupModal.filterByBrands}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
