import { useEffect, useRef, useState } from 'react'
import { LibraryBig, Store, FileText, FolderKanban } from 'lucide-react'
import Navbar from '../components/Navbar'
import type { Manufacturer, Category, Product } from './types'
import LibraryPage from './browse/LibraryPageV2'
import ManufacturerPage from './browse/ManufacturerPage'
import CategoryPage from './browse/CategoryPage'
import ProductDetailPage from './browse/ProductDetailPage'
import ShowroomPageV2 from './showroom/ShowroomPageV2'
import QuotesPageV2 from '../quote/QuotesPageV2'
import { useQuote } from '../quote/QuoteContext'
import { TabInfoTrigger,
  TAB_INFO_MRL,
  TAB_INFO_PRODUCT_CATALOG,
  TAB_INFO_MY_SELECTION,
  TAB_INFO_MY_PROJECTS,
} from './TabInfoTooltip'
// F50 · Etapa 10 (P2 Project Builder) · v2 · nuevo sub-tab "My Projects".
import ProjectsPage from './projects/ProjectsPage'
// F50 · Etapa 10.d (MRL adapt) · v2 · modal Add-to-project accesible desde
// las páginas del MRL (CategoryPage · ProductDetailPage). ShowroomPageV2
// mantiene su propio wire independiente.
import AddToProjectModal from './projects/AddToProjectModal'
import { useProjects } from './projects/useProjects'
import { useToast, ToastContainer } from '../components/AuthToast'
// F50 · sample flow (MRL adapt · 2026-08-03) · v2 · agregar materiales
// desde MRL al draft de sample requests.
import { useSampleRequests } from './browse/useSampleRequests'
// F50 · sample flow (unificación 2026-08-03) · v2 · widget flotante
// UNIFICADO que reemplaza a MiniCartDrawer + SampleMiniDrawer para evitar
// que 2 drawers se monten al mismo bottom-right. Tabs internas Selection
// y Samples · si solo hay uno con content, va directo sin tabs bar.
import WorkspaceDrawer from './components/WorkspaceDrawer'
import SampleTrackingSlideOver from './components/SampleTrackingSlideOver'
// F71b · delivery notifications hub · escuchamos NOTIFICATION_CLICK_EVENT
// para que el bell del Navbar (que dispatcha este event al click) abra
// el SampleTrackingSlideOver cuando la notif es de un sample.
import { NOTIFICATION_CLICK_EVENT, type NotificationClickDetail } from './notifications/NotificationsPanel'
// F58b.1 · modal My Setup montado al shell para que pueda abrirse desde
// cualquier mode (MRL sidebar ManageSetupPanel · ManufacturerInfoBarV2 ·
// Product Catalog CTA) via el event `expert-hub:open-setup-modal`.
import CatalogImportModal, { type ManageTab } from './manage/CatalogImportModal'
// F58a.1 · el sub-tab Inspiration se eliminó · su content se consolidó
// en el toggle "Inspiration" del Product Catalog (antes Spaces · mismo
// componente SpaceTypesPage) + un panel InspirationPanel en la sidebar
// del MRL. Ver plan F58 en cuddly-greeting-meadow.md.
// F52 · MyDealerInfo migró a home global (page 'dealer-info' del App.tsx,
// accesible desde el avatar dropdown del Navbar). Ya no vive como
// sub-tab del Catalog · el sub-tab se eliminó para volver el nav a
// verbos puros de browse/action. La vista contextual dentro de un
// project usa el mismo componente vía ProjectDealerTermsModal.

// F49 · v2 (refactor UX) · duplicado de CatalogPage.tsx sin los 2 tabs
// "reference" (Dealer/Quote + Figma) que quedaron absorbidos en las otras
// opciones. Base para las próximas iteraciones del refactor (Quick Wins,
// Critical fixes) que ya no tocan v1.

// F58a.1 · CatalogMode vuelve a 4 modos · el 'inspiration' se removió
// junto con el sub-tab (ahora vive dentro de Product Catalog toggle
// + MRL sidebar panel). Ver F58 plan.
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
  // F50 · Etapa 10.d (MRL adapt) · v2 · state + hooks del modal
  // Add-to-project · sirve a CategoryPage y ProductDetailPage. El
  // ShowroomPageV2 tiene su propio wire (independiente).
  const [addToProjectProduct, setAddToProjectProduct] = useState<Product | null>(null)
  const { projects, createProject, addItem: addItemToProject } = useProjects()
  const { toasts, addToast, dismissToast } = useToast()
  // F50 · sample flow (2026-08-03) · state del SampleTrackingSlideOver
  // global · lo abren tanto el mini drawer como el widget del sidebar.
  const [sampleTrackingOpen, setSampleTrackingOpen] = useState(false)
  // F72.3 · deep-link · cuando el user click una notif del Action Center,
  // guardamos el requestId acá y lo pasamos al slide-over para scroll-into-view.
  const [sampleFocusRequestId, setSampleFocusRequestId] = useState<string | null>(null)
  // F50 · Add-another-material · el ShowroomPageV2 publica su taxonomy
  // actual via CustomEvent 'expert-hub:showroom-taxonomy-changed'. Lo
  // usamos para saber si el user ya está en la vista de materiales y
  // renderizar botón directo (en vez del dropdown) en el slide-over.
  const [showroomTaxonomy, setShowroomTaxonomy] = useState<'products' | 'materials' | 'spaces'>('products')
  // F58b.1 · My Setup modal · single instance al nivel del shell. Se abre
  // desde el CTA local del ShowroomPageV2 (state propio) O desde eventos
  // globales · aquí manejamos los eventos globales · el detail puede
  // incluir { tab?: ManageTab, filterByBrands?: string[] }.
  const [setupModal, setSetupModal] = useState<{ open: boolean; initialTab?: ManageTab; filterByBrands?: string[] }>({ open: false })
  // F50 · sample flow (MRL adapt) · agrega el material al draft y
  // muestra un toast. El "Review draft" abre el tab Product Catalog
  // (que tiene el slide-over de tracking · ShowroomPageV2 lo monta).
  // F50 · Add-another-material · draftItems se watchea para auto-reabrir
  // el slide-over cuando el user hizo click en "Add another material" y
  // luego agregó un nuevo material al draft.
  const { addToDraft: addSampleToDraft, draftItems: sampleDraftItems } = useSampleRequests()
  // Flag transitorio · se setea cuando el user hace click en "Browse ..."
  // desde el slide-over y se limpia cuando el effect detecta que
  // draftItems.length aumentó (o cuando el user vuelve a abrir el
  // slide-over manualmente).
  const reopenSampleDrawerRef = useRef(false)
  const draftItemsCountRef = useRef(sampleDraftItems.length)
  const handleRequestSampleFromMRL = (product: Product) => {
    const firstColor = product.colorways?.[0]
    // F51 · A.3 · derivamos isMaterial del manufacturer del nav actual ·
    // los productos del MRL vienen sin el flag `isMaterial` que sí tiene
    // UNIFIED_PRODUCTS del Product Catalog. Si el manufacturer produce
    // materials o both, todos sus productos son finishes por definición.
    // Si el guard rechaza, avisamos al user con un toast informativo.
    const treatAsMaterial = product.isMaterial === true
      || nav.manufacturer?.type === 'materials'
      || nav.manufacturer?.type === 'both'
    const created = addSampleToDraft({
      productId: product.id,
      productName: product.name,
      productBrand: product.brand,
      productImage: product.images[0],
      colorwayName: firstColor?.name,
      colorwayHex: firstColor?.hex,
      qty: 1,
      isMaterial: treatAsMaterial,
    })
    if (!created) {
      addToast('info', `Sample requests are for finishes only · ${product.name} is not a finish.`)
      return
    }
    addToast('success', `${product.name} added to sample draft.`, {
      label: 'Review in Product Catalog',
      onClick: () => setMode('showroom'),
    })
  }

  // Listen for "open-quotes" event from MiniCartDrawer · navega al tab dentro
  useEffect(() => {
    const handler = () => setMode('quotes')
    window.addEventListener('expert-hub:open-quotes', handler)
    return () => window.removeEventListener('expert-hub:open-quotes', handler)
  }, [])

  // F50 · Add-another-material · sync de la taxonomy del ShowroomPageV2
  // via CustomEvent. Se dispara al mount y en cada cambio de taxonomy.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ taxonomy?: 'products' | 'materials' | 'spaces' }>).detail
      if (detail?.taxonomy) setShowroomTaxonomy(detail.taxonomy)
    }
    window.addEventListener('expert-hub:showroom-taxonomy-changed', handler)
    return () => window.removeEventListener('expert-hub:showroom-taxonomy-changed', handler)
  }, [])

  // F51 fix (2026-08-04) · cross-consumer nav para el empty state CTA
  // del SampleTrackingSlideOver. Los mounts locales en ShowroomPageV2 y
  // LibraryPageV2 disparan estos eventos cuando el user hace click en
  // "Browse Product Catalog" / "Browse MRL Library" desde OUTSIDE del
  // contexto actual · el CatalogPageV2 los intercepta para hacer el
  // setMode global. No usa el reopen-flag porque este flow es desde
  // empty state (sin draft) · el user re-abre el slide-over manualmente
  // cuando agrega un material.
  useEffect(() => {
    const toMRL = () => {
      setMode('browse')
      setNav({ page: 'library' })
    }
    const toShowroomMaterials = () => {
      setMode('showroom')
      // Defer para que ShowroomPageV2 monte antes del event de taxonomy.
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('expert-hub:set-showroom-taxonomy', {
          detail: { taxonomy: 'materials' },
        }))
      }, 50)
    }
    // F58a.1 · navigate to showroom con taxonomy=spaces (label UI
    // 'Inspiration') · disparado desde el InspirationPanel del MRL sidebar.
    // Toast informativo para que el user sepa que cambió de tab
    // (feedback del smoke · antes el jump era silencioso y confuso).
    const toShowroomInspiration = () => {
      setMode('showroom')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('expert-hub:set-showroom-taxonomy', {
          detail: { taxonomy: 'spaces' },
        }))
      }, 50)
      addToast('info', 'Opened Inspiration in Product Catalog · switch back to MRL from the tab bar.')
    }
    // F58b.1 · abre el modal My Setup desde cualquier lugar del app.
    // El detail puede pasar { tab: ManageTab, filterByBrands: string[] }.
    const toOpenSetup = (evt: Event) => {
      const detail = (evt as CustomEvent).detail as { tab?: ManageTab; filterByBrands?: string[] } | undefined
      setSetupModal({
        open: true,
        initialTab: detail?.tab,
        filterByBrands: detail?.filterByBrands,
      })
    }
    // F71b · click en notification de sample-shipped/delivered · abre el
    // SampleTrackingSlideOver. Los eventos de otro kind (ej. 'info') no
    // hacen nada acá · el consumer del kind los maneja.
    // F72.3 · si la notif trae requestId, lo pasamos al slide-over como
    // focusRequestId para hacer scroll-into-view al card correspondiente.
    const toNotificationClick = (evt: Event) => {
      const detail = (evt as CustomEvent<NotificationClickDetail>).detail
      const kind = detail?.notification?.kind
      if (kind === 'sample-shipped' || kind === 'sample-delivered') {
        setSampleFocusRequestId(detail?.notification?.requestId ?? null)
        setSampleTrackingOpen(true)
      }
    }
    window.addEventListener('expert-hub:navigate-to-mrl', toMRL)
    window.addEventListener('expert-hub:navigate-to-showroom-materials', toShowroomMaterials)
    window.addEventListener('expert-hub:navigate-to-showroom-inspiration', toShowroomInspiration)
    window.addEventListener('expert-hub:open-setup-modal', toOpenSetup)
    window.addEventListener(NOTIFICATION_CLICK_EVENT, toNotificationClick)
    return () => {
      window.removeEventListener('expert-hub:navigate-to-mrl', toMRL)
      window.removeEventListener('expert-hub:navigate-to-showroom-materials', toShowroomMaterials)
      window.removeEventListener('expert-hub:navigate-to-showroom-inspiration', toShowroomInspiration)
      window.removeEventListener('expert-hub:open-setup-modal', toOpenSetup)
      window.removeEventListener(NOTIFICATION_CLICK_EVENT, toNotificationClick)
    }
  }, [])

  // F50 · Add-another-material · si el user vino del slide-over al catálogo
  // via "Browse ...", auto-reabre el slide-over apenas agregue al draft.
  useEffect(() => {
    const prev = draftItemsCountRef.current
    draftItemsCountRef.current = sampleDraftItems.length
    if (reopenSampleDrawerRef.current && sampleDraftItems.length > prev) {
      setSampleTrackingOpen(true)
      reopenSampleDrawerRef.current = false
    }
  }, [sampleDraftItems.length])

  // F50 · Add-another-material · callbacks del dropdown. Cierran el
  // slide-over, navegan si hace falta, y setean el reopen-flag. Son
  // idempotent · si el user YA está en la vista destino, solo cierran el
  // slide-over y lo dejan donde estaba (no resetean nav ni disparan el
  // event de taxonomy). Esto es lo que respeta el "continue browsing" en
  // vez de re-navegar al root.
  const handleBrowseCatalogForSamples = () => {
    reopenSampleDrawerRef.current = true
    setSampleTrackingOpen(false)
    if (mode !== 'showroom') {
      setMode('showroom')
      // Pequeño defer para que ShowroomPageV2 monte y su listener quede
      // activo antes de dispararle el event de taxonomy.
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('expert-hub:set-showroom-taxonomy', {
          detail: { taxonomy: 'materials' },
        }))
      }, 50)
    } else if (showroomTaxonomy !== 'materials') {
      // Ya está en showroom pero en otra taxonomy · switchear a materials.
      window.dispatchEvent(new CustomEvent('expert-hub:set-showroom-taxonomy', {
        detail: { taxonomy: 'materials' },
      }))
    }
    // Si ya está en showroom + materials · solo se cierra el slide-over.
  }
  const handleBrowseMRLForSamples = () => {
    reopenSampleDrawerRef.current = true
    setSampleTrackingOpen(false)
    if (mode !== 'browse') {
      setMode('browse')
      setNav({ page: 'library' })
    }
    // Si ya está en browse (cualquier deep MRL page), no toca el nav ·
    // el user se queda donde estaba explorando.
  }

  // F50 · Add-another-material · contexto actual del user para que el
  // slide-over decida: dropdown vs botón directo. Si el user ya está en
  // MRL o en Product Catalog · Materials, botón directo "Continue
  // browsing" en vez del dropdown.
  const sampleBrowseContext: 'catalog-materials' | 'catalog-other' | 'mrl' | 'other' =
    mode === 'browse' ? 'mrl'
    : mode === 'showroom' ? (showroomTaxonomy === 'materials' ? 'catalog-materials' : 'catalog-other')
    : 'other'

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
            // F65.2b · REVERT variant='v1' → 'v2' (user feedback) · la
            // sección "Your dealer relationship" SÍ debe verse en ambos
            // tabs (Library + Products) pero marcada con role-gate chip
            // ("visible to specific roles only") · para demo purposes.
            // La info es útil para el dealer decidir cual brand explorar
            // aunque esté en Library scope.
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
            onRequestSample={handleRequestSampleFromMRL}
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
            onRequestSample={handleRequestSampleFromMRL}
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
            // F56.1 · mobile fix · en <sm el pill hace scroll-x horizontal
            // sin empujar el layout (antes 5 sub-tabs sumaban ~600px y forzaban
            // scroll de página completo). max-w-full + overflow-x-auto lo
            // contiene · scrollbar-none oculta la barra visual. flex-nowrap
            // asegura que los tabs NO wrappean.
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 max-w-full overflow-x-auto md:overflow-visible flex-nowrap scrollbar-none"
                 style={{ scrollbarWidth: 'none' }}>
              {/* F64 · rename tabs · align al PRD vocab (Library → Binder → Products).
                  "MRL" → "Library" (legacy scope · discovery + sample + Binders).
                  "Product Catalog" → "Products" (Strata Preview · superset con spec + quote).
                  Tooltips TabInfoTrigger preservados (tienen la explicación en detalle). */}
              <button type="button" onClick={() => setMode('browse')} className={tabClass(mode === 'browse')}>
                <LibraryBig className="h-4 w-4" />
                Library
                <TabInfoTrigger content={TAB_INFO_MRL} align="start" />
              </button>
              <button type="button" onClick={() => setMode('showroom')} className={tabClass(mode === 'showroom')}>
                <Store className="h-4 w-4" />
                Products
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
              {/* F50 · Etapa 10 (P2 Project Builder) · v2 · sub-tab "My Projects".
                  F64.3 · TabInfoTrigger agregado · antes no tenía tooltip. */}
              <button type="button" onClick={() => setMode('projects')} className={tabClass(mode === 'projects')}>
                <FolderKanban className="h-4 w-4" />
                My Projects
                <TabInfoTrigger content={TAB_INFO_MY_PROJECTS} align="end" />
              </button>
              {/* F58a.1 · sub-tab Inspiration eliminado · consolidado en el
                  toggle "Inspiration" del Product Catalog (rename del ex "Spaces")
                  + panel InspirationPanel en la sidebar del MRL. */}
              {/* F52 · el sub-tab "My Dealer Info" se eliminó · ahora vive
                  como page top-level en el App.tsx (case 'dealer-info'),
                  accesible desde el avatar dropdown del Navbar. */}
            </div>
          )
          // F66.4 · unificar posición del modeTabBar · siempre top-right del
          // shell (antes era: browse/quotes/projects arriba centrado · showroom
          // dentro del header title via headerAside · causaba jump visual al
          // cambiar de tab). Ahora single source of truth · flex justify-end
          // envuelve el pill · mismo lugar en los 4 modes.
          return (
            <>
              <div className="flex justify-end">{modeTabBar}</div>
              {mode === 'browse' ? (
                renderBrowse()
              ) : mode === 'quotes' ? (
                <QuotesPageV2 onBack={() => setMode('showroom')} />
              ) : mode === 'projects' ? (
                <ProjectsPage />
              ) : (
                <ShowroomPageV2 />
              )}
            </>
          )
        })()}
      </div>

      {/* F50 · sample flow (unificación 2026-08-03) · v2 · reemplaza al
          MiniCartDrawer + SampleMiniDrawer por un solo widget flotante
          con tabs internas Selection / Samples. Siempre visible en cualquier
          vista v2 (MRL root, deep MRL, Product Catalog, My Selection,
          My Projects). Auto-open cuando se agrega al cart (pattern del
          MiniCartDrawer preservado). */}
      {/* F65 · Library scope cleanup · hideCart={mode === 'browse'} · en
          Library tab el cart/quote flow queda oculto (Strata superset scope)
          · sample requests siguen visibles porque el sample flow SÍ está en
          scope para Library (finishes sample per PRD Section 01). */}
      <WorkspaceDrawer
        onViewSelection={() => setMode('quotes')}
        onOpenSampleTracking={() => setSampleTrackingOpen(true)}
        hideCart={mode === 'browse'}
      />
      <SampleTrackingSlideOver
        open={sampleTrackingOpen}
        onClose={() => { setSampleTrackingOpen(false); setSampleFocusRequestId(null) }}
        onSubmitted={(count) => {
          addToast('success', `${count} ${count === 1 ? 'sample request submitted' : 'sample requests submitted'} · you will be notified when they ship.`)
        }}
        onBrowseCatalog={handleBrowseCatalogForSamples}
        onBrowseMRL={handleBrowseMRLForSamples}
        currentContext={sampleBrowseContext}
        focusRequestId={sampleFocusRequestId}
      />

      {/* F50 · Etapa 10.d (MRL adapt) · v2 · modal Add-to-project global
          para el flujo MRL (CategoryPage · ProductDetailPage). Se abre
          cuando setAddToProjectProduct recibe un product · onAdd hace
          addItemToProject y muestra un toast. */}
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
          eventos globales (MRL sidebar · ManufacturerInfoBarV2 · terceros). El
          CTA de ShowroomPageV2 sigue teniendo su instancia local (dispatch al
          mismo event no es necesario · ambos usan el mismo store LazyMap). */}
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
