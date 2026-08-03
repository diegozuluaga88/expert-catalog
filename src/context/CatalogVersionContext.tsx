import { createContext, useContext, useState, type ReactNode } from 'react'

// F49 · versión seleccionada del Catalog (v1 estable · v2 refactor UX).
// Vive en context para que el dropdown del Navbar funcione desde cualquier
// página (OCR, Transactions, Feedback, Catalog) y App.tsx pueda elegir qué
// componente renderear en `case 'catalog'`. Persiste en localStorage para
// sobrevivir refresh.
export type CatalogVersion = 'v1' | 'v2'

const STORAGE_KEY = 'catalog-version'

interface CatalogVersionCtx {
    version: CatalogVersion
    setVersion: (v: CatalogVersion) => void
}

const CatalogVersionContext = createContext<CatalogVersionCtx | null>(null)

export function CatalogVersionProvider({ children }: { children: ReactNode }) {
    const [version, setVersionState] = useState<CatalogVersion>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            return saved === 'v2' ? 'v2' : 'v1'
        } catch {
            return 'v1'
        }
    })

    const setVersion = (v: CatalogVersion) => {
        setVersionState(v)
        try {
            localStorage.setItem(STORAGE_KEY, v)
        } catch {
            /* ignore storage errors */
        }
    }

    return (
        <CatalogVersionContext.Provider value={{ version, setVersion }}>
            {children}
        </CatalogVersionContext.Provider>
    )
}

export function useCatalogVersion(): CatalogVersionCtx {
    const ctx = useContext(CatalogVersionContext)
    if (!ctx) {
        throw new Error('useCatalogVersion must be used within a CatalogVersionProvider')
    }
    return ctx
}
