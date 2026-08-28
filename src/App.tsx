import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from "./Login"
import CatalogPageV2 from "./catalog/CatalogPageV2"
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
  // MRL scope cleanup · se retira la vista `?share=` de colecciones.
  // Compartir sí es scope (NEW-10), pero del **proyecto**, con visores,
  // notificación de apertura y heat map — y el Project Tool ya tiene su
  // propio link. Esto compartía colecciones de producto, cuya única
  // superficie de creación era el Showroom retirado. Ver UX-REVIEW H3-2.

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
