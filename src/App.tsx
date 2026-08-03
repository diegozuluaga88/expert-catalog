import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { CatalogVersionProvider, useCatalogVersion } from './context/CatalogVersionContext'
import Login from "./Login"
import OCRTracking from "./OCRTracking"
import FeedbackBoard from "./FeedbackBoard"
import CatalogPage from "./catalog/CatalogPage"
import CatalogPageV2 from "./catalog/CatalogPageV2"
// F50 · Etapa 8 (P7 share) · vista read-only pública que se activa cuando
// la URL trae `?share=...&sig=...`. NO requiere login (patrón "send to
// end client"). Se intercala antes del login-check del App.
import CollectionShareView from "./catalog/browse/CollectionShareView"
import Transactions from "./Transactions"
import OrderDetail from "./OrderDetail"
import AckDetail from "./AckDetail"
import Navbar from "./components/Navbar"
import SessionExpiryModal from "./components/SessionExpiryModal"
import EditQuoteItemPanel from "./quote/EditQuoteItemPanel"

type Page = 'ocr-tracking' | 'feedback' | 'catalog' | 'transactions' | 'order-detail' | 'ack-detail'

export interface ConvertedDocument {
  id: string
  vendor: string
  name: string
  type: 'po' | 'ack'
  tab: 'orders' | 'acknowledgments'
}

// F49 · componente interno que lee el context de CatalogVersion para elegir
// entre v1 (actual) y v2 (refactor UX). Necesita vivir dentro del Provider,
// por eso está separado del App root.
function CatalogPageSwitcher({ onLogout, onNavigate }: { onLogout: () => void; onNavigate: (p: string) => void }) {
  const { version } = useCatalogVersion()
  return version === 'v2'
    ? <CatalogPageV2 onLogout={onLogout} onNavigate={onNavigate} />
    : <CatalogPage onLogout={onLogout} onNavigate={onNavigate} />
}

function App() {
  const { user, initialLoading, signOut, showSessionWarning, refreshSession } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('ocr-tracking')
  const [convertedDoc, setConvertedDoc] = useState<ConvertedDocument | null>(null)
  // F50 · Etapa 8 · si la URL trae `?share=`, activa la vista compartida.
  // Se mantiene en state para que el "Back to catalog" pueda limpiar el
  // param sin recargar. Se hidrata una sola vez al mount.
  const [shareParams, setShareParams] = useState<URLSearchParams | null>(() => {
    if (typeof window === 'undefined') return null
    const p = new URLSearchParams(window.location.search)
    return p.get('share') ? p : null
  })
  useEffect(() => {
    // Cuando el user sale del share view, limpia el param del URL sin
    // reload (history.replaceState) · la próxima navegación es limpia.
    if (!shareParams && typeof window !== 'undefined' && window.location.search.includes('share=')) {
      const clean = window.location.pathname
      window.history.replaceState({}, '', clean)
    }
  }, [shareParams])

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  const handleLogout = () => {
    signOut()
  }

  const handleConvertFromOCR = (doc: ConvertedDocument) => {
    setConvertedDoc(doc)
    setCurrentPage('transactions')
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // F50 · Etapa 8 · vista pública read-only cuando la URL trae `?share=`.
  // Se muestra antes del login-check para que un destinatario sin cuenta
  // pueda ver la colección. Vive dentro del CatalogVersionProvider para
  // habilitar el Import a colecciones (que sí requiere tenant activo).
  if (shareParams) {
    return (
      <CatalogVersionProvider>
        <div className="min-h-screen bg-background text-foreground">
          <CollectionShareView search={shareParams} onExit={() => setShareParams(null)} />
        </div>
      </CatalogVersionProvider>
    )
  }

  if (!user) {
    return <Login />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'feedback':
        return <FeedbackBoard onLogout={handleLogout} onNavigate={handleNavigate} />
      case 'catalog':
        return <CatalogPageSwitcher onLogout={handleLogout} onNavigate={handleNavigate} />
      case 'transactions':
        return (
          <>
            <Navbar
              onLogout={handleLogout}
              activeTab="Transactions"
              onNavigateToWorkspace={() => setCurrentPage('transactions')}
              onNavigate={handleNavigate}
            />
            <Transactions
              onLogout={handleLogout}
              onNavigateToDetail={(type: string) => {
                if (type === 'order-detail') setCurrentPage('order-detail')
                if (type === 'ack-detail') setCurrentPage('ack-detail')
              }}
              onNavigateToWorkspace={() => setCurrentPage('transactions')}
              onNavigate={handleNavigate}
              convertedDoc={convertedDoc}
            />
          </>
        )
      case 'order-detail':
        return (
          <OrderDetail
            onBack={() => setCurrentPage('transactions')}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onNavigateToWorkspace={() => setCurrentPage('transactions')}
          />
        )
      case 'ack-detail':
        return (
          <AckDetail
            onBack={() => setCurrentPage('transactions')}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onNavigateToWorkspace={() => setCurrentPage('transactions')}
          />
        )
      default:
        return (
          <OCRTracking
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onConvertDocument={handleConvertFromOCR}
          />
        )
    }
  }

  return (
    <CatalogVersionProvider>
      <div className="min-h-screen bg-background text-foreground">
        {renderPage()}
        <SessionExpiryModal
          isOpen={showSessionWarning}
          onExtend={refreshSession}
          onLogout={handleLogout}
        />
        {/* Phase 3 Fix #11 · Mini-cart drawer global · slide-in tras Add to Selection.
            onViewQuote · navega a Catalog y dispara evento para abrir el tab
            "My Selection" dentro.
            Mount permanente (Diego ask · fix FAB no aparece) · el componente
            internamente retorna null cuando no hay cart items · así garantizamos
            que cuando se agreguen items desde el catalog el drawer/FAB sea
            visible inmediatamente sin importar la página activa. */}
        {/* Diego · el cart/FAB se monta dentro de CatalogPage y solo en los tabs
            Product Catalog (showroom) + My Selection (quotes). Ver CatalogPage.tsx. */}
        {/* Phase 3 polish · panel global para editar variants de un item del cart.
            Aparece cuando user click "Edit" en el drawer o en My Quotes detail.
            También scoped al catalog ya que es relevante solo en ese contexto. */}
        {currentPage === 'catalog' && <EditQuoteItemPanel />}
      </div>
    </CatalogVersionProvider>
  )
}

export default App
