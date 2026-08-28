import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from "./Login"
import CatalogPageV2 from "./catalog/CatalogPageV2"
// F50 · Etapa 8 (P7 share) · vista read-only pública que se activa cuando
// la URL trae `?share=...&sig=...`. NO requiere login (patrón "send to
// end client"). Se intercala antes del login-check del App.
import CollectionShareView from "./catalog/browse/CollectionShareView"
// F50 · sweep DS · provider global de prompt/confirm modales DS-compliant.
// Reemplaza los window.prompt/window.confirm nativos.
import { DialogsProvider } from "./components/dialogs/DialogsContext"
import SessionExpiryModal from "./components/SessionExpiryModal"
// F67 · Manufacturer insights dashboard · demo del "View as manufacturer"
// del PRD Section 05 · accessible desde el user menu del Navbar.
import ManufacturerInsightsPage from "./catalog/insights/ManufacturerInsightsPage"

// MRL scope cleanup (2026-08-27) · el App quedó en dos páginas.
//
// Capa 1 · se retiraron OCRTracking, Transactions, OrderDetail, AckDetail
//   y FeedbackBoard · venían del proyecto Strata del que este repo se
//   forkeó y ninguna fuente de scope las menciona.
//   El landing pasa de 'ocr-tracking' a 'catalog' · un stakeholder que
//   abría el link aterrizaba en una pantalla de tracking de OCR y no podía
//   decir qué producto era (UX-REVIEW.md · H4-1, severidad 4 · falla la
//   primera pregunta del Trunk Test).
//
// Capa 2a · V1 y el CatalogVersionContext · el provider arrancaba en 'v1'
//   con localStorage vacío, así que quien abría el link por primera vez
//   veía una versión distinta de la que veía el resto del equipo — dos
//   productos detrás de una URL (UX-REVIEW.md · H4-2, severidad 4).
//
// Capa 2c · EditQuoteItemPanel, con el resto de quote/.
//
// Ver strata-docs/09-mrl-uwh/DIAGNOSIS.md §3 y PROPOSAL.md.
type Page = 'catalog' | 'manufacturer-insights'

function App() {
  const { user, initialLoading, signOut, showSessionWarning, refreshSession } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('catalog')
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
    // MRL scope cleanup · las páginas retiradas ya no son destinos válidos ·
    // cualquier navegación desconocida cae al catálogo en vez de romper.
    setCurrentPage(page === 'manufacturer-insights' ? 'manufacturer-insights' : 'catalog')
  }

  const handleLogout = () => {
    signOut()
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
  // pueda ver la colección.
  if (shareParams) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <CollectionShareView search={shareParams} onExit={() => setShareParams(null)} />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'manufacturer-insights':
        return (
          <ManufacturerInsightsPage
            onBack={() => setCurrentPage('catalog')}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onNavigateToWorkspace={() => setCurrentPage('catalog')}
          />
        )
      default:
        return <CatalogPageV2 onLogout={handleLogout} onNavigate={handleNavigate} />
    }
  }

  return (
    <DialogsProvider>
      <div className="min-h-screen bg-background text-foreground">
        {renderPage()}
        <SessionExpiryModal
          isOpen={showSessionWarning}
          onExtend={refreshSession}
          onLogout={handleLogout}
        />
      </div>
    </DialogsProvider>
  )
}

export default App
