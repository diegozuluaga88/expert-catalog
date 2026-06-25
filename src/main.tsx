import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TenantProvider } from './TenantContext'
import { AuthProvider } from './context/AuthContext'
import { QuoteProvider } from './quote/QuoteContext'
import { ThemeProvider } from 'strata-design-system'

// Phase 3 Fix #8 · QuoteProvider DEBE estar adentro de AuthProvider y
// TenantProvider porque depende del user activo + del tenant activo para
// rehidratar el slot del cart correspondiente.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <TenantProvider>
        <QuoteProvider>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <App />
          </ThemeProvider>
        </QuoteProvider>
      </TenantProvider>
    </AuthProvider>
  </StrictMode>,
)
