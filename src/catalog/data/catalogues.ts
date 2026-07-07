// Fase P1.1 · Catalogue layer + Currency (2026-07-06)
//
// Nueva capa alineada con el silver schema de producción. Cada Manufacturer
// puede publicar N Catalogues (Steelcase 2025 Seating vs Steelcase 2025 Storage).
// Cada Catalogue tiene su propio currency, dates y status.
//
// Actualmente es un mock read-only · en producción esto vendrá del backend
// bronze→silver processor.

import type { Catalogue, Currency } from '../types'

/* ═══════════════════════════════════════════════════════════════════════
   Currencies · mock diccionario de monedas soportadas
   Mapea a las columnas silver: currencyId, currencyName, currencyCode, currencyType
   ═══════════════════════════════════════════════════════════════════════ */

export const CURRENCIES: Currency[] = [
    { id: 'USD', code: 'USD', name: 'US Dollar', type: 'fiat' },
    { id: 'EUR', code: 'EUR', name: 'Euro', type: 'fiat' },
    { id: 'CAD', code: 'CAD', name: 'Canadian Dollar', type: 'fiat' },
    { id: 'GBP', code: 'GBP', name: 'British Pound', type: 'fiat' },
]

export function findCurrencyById(id: string): Currency | undefined {
    return CURRENCIES.find(c => c.id === id)
}

/* ═══════════════════════════════════════════════════════════════════════
   Catalogues · mock · 1 catálogo activo por Manufacturer
   Mapea a las columnas silver: catalogueId, catalogueNumber, catalogueName,
   catalogueActiveDate, catalogueExpirationDate, catalogueStatus,
   catalogueCurrencyId, catalogueTenantId
   ═══════════════════════════════════════════════════════════════════════ */

export const CATALOGUES: Catalogue[] = [
    {
        id: 'cat-allermuir-2026',
        catalogueNumber: 'AL-2026-COL',
        name: 'Allermuir 2026 Collection',
        activeDate: '2026-01-01T00:00:00Z',
        expirationDate: '2026-12-31T23:59:59Z',
        status: 'Active',
        currencyId: 'USD',
        manufacturerId: 'allermuir',
        // tenantId undefined → catalogue global (visible a todos los dealers)
    },
    {
        id: 'cat-allsteel-2026',
        catalogueNumber: 'AS-2026-COMB',
        name: 'Allsteel 2026 Seating & Storage',
        activeDate: '2026-01-01T00:00:00Z',
        expirationDate: '2026-12-31T23:59:59Z',
        status: 'Active',
        currencyId: 'USD',
        manufacturerId: 'allsteel',
    },
    {
        id: 'cat-ais-2026',
        catalogueNumber: 'AIS-2026-CG',
        name: 'AIS 2026 Casegoods & Panels',
        activeDate: '2026-01-01T00:00:00Z',
        expirationDate: '2026-12-31T23:59:59Z',
        status: 'Active',
        currencyId: 'USD',
        manufacturerId: 'ais',
    },
    // Ejemplos de catálogos con distinto status o currency · útiles para probar
    // la lógica multi-catalogue en fases futuras (Multi-tenant P2.1, Currency
    // multi-level P1.2 finalización).
    {
        id: 'cat-allermuir-2025-archived',
        catalogueNumber: 'AL-2025-COL',
        name: 'Allermuir 2025 Collection (Archived)',
        activeDate: '2025-01-01T00:00:00Z',
        expirationDate: '2025-12-31T23:59:59Z',
        status: 'Archived',
        currencyId: 'USD',
        manufacturerId: 'allermuir',
    },
    {
        id: 'cat-allermuir-2026-eur',
        catalogueNumber: 'AL-2026-EUR',
        name: 'Allermuir 2026 Collection (EUR)',
        activeDate: '2026-01-01T00:00:00Z',
        expirationDate: '2026-12-31T23:59:59Z',
        status: 'Draft',
        currencyId: 'EUR',
        manufacturerId: 'allermuir',
    },
]

/* ═══════════════════════════════════════════════════════════════════════
   Helpers · lookup por id / manufacturerId / status
   ═══════════════════════════════════════════════════════════════════════ */

export function findCatalogueById(id: string): Catalogue | undefined {
    return CATALOGUES.find(c => c.id === id)
}

export function findCatalogueByNumber(catalogueNumber: string): Catalogue | undefined {
    return CATALOGUES.find(c => c.catalogueNumber === catalogueNumber)
}

/** Catalogues activos publicados por un Manufacturer específico. */
export function cataloguesForManufacturer(manufacturerId: string): Catalogue[] {
    return CATALOGUES.filter(c => c.manufacturerId === manufacturerId && c.status === 'Active')
}

/** Fase P2.2 · Catalogues visibles para un tenant · global (sin tenantId) +
 *  custom del tenant. Filtered por status='Active' (silver `catalogueStatus`).
 *  Archived/Draft/Discontinued se ocultan en el UI por default pero permanecen
 *  en el data para history/audit.
 *  @param includeAll · true para admin UI que quiera ver todos los estados. */
export function cataloguesForTenant(tenantId: string | null, includeAll = false): Catalogue[] {
    return CATALOGUES
        .filter(c => c.tenantId === undefined || c.tenantId === tenantId)
        .filter(c => includeAll || c.status === 'Active')
}

/** Resuelve el currency code de un catalogue (para display de prices).
 *  Fallback a 'USD' si no se encuentra. */
export function currencyCodeForCatalogue(catalogueId: string): string {
    const catalogue = findCatalogueById(catalogueId)
    if (!catalogue) return 'USD'
    const currency = findCurrencyById(catalogue.currencyId)
    return currency?.code ?? 'USD'
}

/* ═══════════════════════════════════════════════════════════════════════
   Fase P1.2 · Currency formatting helper
   ═══════════════════════════════════════════════════════════════════════ */

/** Symbol por currency code · fallback a "$" si no reconoce. */
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
}

/**
 * Fase P1.2 · formato de precio con símbolo + locale-appropriate grouping.
 * Reemplaza el pattern hardcoded `$${amount.toLocaleString()}` distribuido en
 * el UI. Preserva backward compat cuando currencyId es undefined (assume USD).
 *
 * @param amount · número decimal · en producción viene de silver como numeric(18,2)
 * @param currencyId · FK a Currency.id · undefined → USD default
 *
 * @example
 *   formatPrice(1234.5, 'USD')  // "$1,234.50"
 *   formatPrice(1234.5, 'EUR')  // "€1,234.50"
 *   formatPrice(1234, 'GBP')    // "£1,234.00"
 *   formatPrice(0.99, undefined) // "$0.99" (fallback USD)
 */
export function formatPrice(amount: number | undefined | null, currencyId?: string): string {
    if (amount == null) return '—'
    const id = currencyId ?? 'USD'
    const symbol = CURRENCY_SYMBOLS[id] ?? '$'
    // Locale-aware grouping · Intl.NumberFormat es preferible cuando hay
    // decimales fraccionarios; para amounts enteros mantenemos toLocaleString
    // por consistencia con el look previo del UI.
    const hasFraction = amount % 1 !== 0
    if (hasFraction) {
        return `${symbol}${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`
    }
    return `${symbol}${amount.toLocaleString('en-US')}`
}

/**
 * Fase P1.2 · rango de precios · útil para bundles y estimates.
 * `formatPriceRange(1500, 1800, 'USD')` → `"$1,500 – $1,800"`
 */
export function formatPriceRange(min: number, max: number, currencyId?: string): string {
    return `${formatPrice(min, currencyId)} – ${formatPrice(max, currencyId)}`
}
