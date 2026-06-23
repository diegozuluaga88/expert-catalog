import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from "./Login"
import OCRTracking from "./OCRTracking"
import FeedbackBoard from "./FeedbackBoard"
import CatalogPage from "./catalog/CatalogPage"
import SessionExpiryModal from "./components/SessionExpiryModal"

type Page = 'ocr-tracking' | 'feedback' | 'catalog'

function App() {
  const { user, initialLoading, signOut, showSessionWarning, refreshSession } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('ocr-tracking')

  const handleNavigate = (page: string) => {
    if (page === 'feedback') setCurrentPage('feedback')
    else if (page === 'catalog') setCurrentPage('catalog')
    else setCurrentPage('ocr-tracking')
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {currentPage === 'feedback' ? (
        <FeedbackBoard onLogout={handleLogout} onNavigate={handleNavigate} />
      ) : currentPage === 'catalog' ? (
        <CatalogPage onLogout={handleLogout} onNavigate={handleNavigate} />
      ) : (
        <OCRTracking onLogout={handleLogout} onNavigate={handleNavigate} />
      )}
      <SessionExpiryModal
        isOpen={showSessionWarning}
        onExtend={refreshSession}
        onLogout={handleLogout}
      />
    </div>
  )
}

export default App
