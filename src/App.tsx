import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from "./Login"
import OCRTracking from "./OCRTracking"
import FeedbackBoard from "./FeedbackBoard"
import CatalogPage from "./catalog/CatalogPage"
import Transactions from "./Transactions"
import OrderDetail from "./OrderDetail"
import AckDetail from "./AckDetail"
import Navbar from "./components/Navbar"
import SessionExpiryModal from "./components/SessionExpiryModal"
import MiniCartDrawer from "./quote/MiniCartDrawer"
import EditQuoteItemPanel from "./quote/EditQuoteItemPanel"

type Page = 'ocr-tracking' | 'feedback' | 'catalog' | 'transactions' | 'order-detail' | 'ack-detail'

export interface ConvertedDocument {
  id: string
  vendor: string
  name: string
  type: 'po' | 'ack'
  tab: 'orders' | 'acknowledgments'
}

function App() {
  const { user, initialLoading, signOut, showSessionWarning, refreshSession } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('ocr-tracking')
  const [convertedDoc, setConvertedDoc] = useState<ConvertedDocument | null>(null)

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

  if (!user) {
    return <Login />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'feedback':
        return <FeedbackBoard onLogout={handleLogout} onNavigate={handleNavigate} />
      case 'catalog':
        return <CatalogPage onLogout={handleLogout} onNavigate={handleNavigate} />
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
    <div className="min-h-screen bg-background text-foreground">
      {renderPage()}
      <SessionExpiryModal
        isOpen={showSessionWarning}
        onExtend={refreshSession}
        onLogout={handleLogout}
      />
      {/* Phase 3 Fix #11 · Mini-cart drawer global · slide-in tras Add to Quote.
          onViewQuote · navega a Catalog y dispara evento para abrir el tab
          "My Quotes" dentro (Diego: no salir de la sección).
          Diego polish · FAB + drawer SOLO visible en sección Catalog (no en
          Feedback/Transactions/OCR · drawer es contextual al catalog). */}
      {currentPage === 'catalog' && (
        <MiniCartDrawer
          onViewQuote={() => {
            setCurrentPage('catalog')
            window.dispatchEvent(new CustomEvent('expert-hub:open-quotes'))
          }}
        />
      )}
      {/* Phase 3 polish · panel global para editar variants de un item del cart.
          Aparece cuando user click "Edit" en el drawer o en My Quotes detail.
          También scoped al catalog ya que es relevante solo en ese contexto. */}
      {currentPage === 'catalog' && <EditQuoteItemPanel />}
    </div>
  )
}

export default App
