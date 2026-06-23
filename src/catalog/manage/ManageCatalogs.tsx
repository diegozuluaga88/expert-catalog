import { useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BookOpen, Wrench, Cloud, Sparkles } from 'lucide-react'
import CatalogLibrary from './CatalogLibrary'
import ClientPolicyManager from './ClientPolicyManager'
import ERPConnectModal from './ERPConnectModal'
import SmartQuoteHub from '../smartquote/components/widgets/SmartQuoteHub'

// Etapa 5 — Manage. Portado de UI-Dealer `src/Catalogs.tsx` (look objetivo).
// Se quitó el chrome externo (min-h-screen/bg + título "Catalog Management") porque CatalogPage
// ya enmarca el feature y aporta el switch Browse|Manage; se conservan los sub-tabs
// Library | Rules y el contenido (CatalogLibrary / ClientPolicyManager) tal cual UI-Dealer.

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export default function ManageCatalogs() {
  const [activeTab, setActiveTab] = useState<'library' | 'rules' | 'smartquote'>('library')
  const [showErp, setShowErp] = useState(false)

  const tabs = [
    { id: 'library', label: 'Catalog Library', icon: BookOpen },
    { id: 'rules', label: 'Client Rules & Pricing', icon: Wrench },
    { id: 'smartquote', label: 'Smart Quote', icon: Sparkles },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Sub-tabs Library | Rules (estilo UI-Dealer) */}
        <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all',
                  isActive
                    ? 'bg-brand-300 dark:bg-brand-500 text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-brand-300 dark:hover:bg-brand-600/50'
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Etapa 6b — Connect ERP (modal portado de read/) */}
        <button
          type="button"
          onClick={() => setShowErp(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Cloud className="h-4 w-4" />
          Connect ERP
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'library' ? (
          <CatalogLibrary />
        ) : activeTab === 'rules' ? (
          <ClientPolicyManager />
        ) : (
          // Etapa 6c — SmartQuoteHub portado de read/ (gen-ui, GenUIProvider interno)
          <SmartQuoteHub onNavigate={() => {}} />
        )}
      </div>

      {showErp && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowErp(false)}
        >
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <ERPConnectModal onCancel={() => setShowErp(false)} onConnected={() => setShowErp(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
