import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TenantProvider } from './TenantContext'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from 'strata-design-system'

// MRL scope cleanup (2026-08-27) · Capa 2c · el QuoteProvider se retiró
// junto con quote/. MRL no cotiza · el flujo de cotización no aparece en
// ninguna de las 67 filas del Decision Log ni en las cinco áreas del MVP
// que nombró Jeff (SOW v5 §1).
//
// TenantProvider sigue dentro de AuthProvider porque los hooks per-tenant
// que quedan —useProjects, useSearchHistory, useNotifications,
// tenantPreferences— resuelven su slug vía useTenant.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <TenantProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <App />
        </ThemeProvider>
      </TenantProvider>
    </AuthProvider>
  </StrictMode>,
)
