// F50 · Etapa 7 (P4) · v2 · datos privados de la relación dealer↔manufacturer.
//
// Cada dealer negocia condiciones únicas con cada manufacturer: nivel de
// descuento, términos de flete, un rep primario que lo atiende. Esa info
// es "internal only" (Jeff · "no other platform would do this") y hoy en
// el legacy vive fuera del catálogo (spreadsheets del dealer, mails
// sueltos).
//
// Este módulo pone esa relación al alcance de un click cuando el dealer
// está browsing un manufacturer específico. La UI que la consume vive en
// ManufacturerInfoBarV2 · sección "Your dealer relationship".
//
// Scope · UI-side + mock data. Cuando exista el rep dashboard real +
// email cadence + cascade con timestamps, este módulo se convierte en
// wrapper de la API real (setDealerRelationships al vuelo desde el rep
// dashboard). Por ahora todo es seed estático.

export interface DealerRep {
    name: string
    title: string
    email: string
    phone: string
    /** ISO date del último contacto conocido · fuente sería el CRM del rep. */
    lastContactAt?: string
    /** Photo URL opcional · en producción sería el avatar del CRM. */
    photoUrl?: string
}

export interface DealerRelationship {
    /** Slug del dealer · match contra `currentTenant` del TenantContext. */
    dealerSlug: string
    /** Slug del manufacturer · match contra `Manufacturer.id`. */
    manufacturerSlug: string
    /** Nivel de descuento negociado (%) sobre list price. */
    discountTier: number
    /** Términos de flete negociados (ej. "Prepay & add", "FOB origin"). */
    freightTerms: string
    /** Notas free-text privadas del dealer sobre esta relación. */
    notes?: string
    /** Contactos primarios del dealer con este manufacturer. */
    primaryRep: DealerRep
    /** Account manager separado del rep de ventas (opcional). */
    accountManager?: DealerRep
    /** Credit limit informativo (USD). Nice-to-have · algunos dealers no lo tienen. */
    creditLimitUsd?: number
    /** ISO date · última vez que un rep tocó estos datos · lo consume la UI
     *  para mostrar "Updated 3 days ago" (Norman Feedback · dealer sabe qué
     *  tan fresh es la info). */
    lastUpdatedAt: string
}

// Normalización del display name del tenant a slug lowercase. Se aplica
// tanto al lookup como al seed para que ambos matcheen sin importar
// mayúsculas.
export function toDealerSlug(tenant: string): string {
    return tenant.trim().toLowerCase().replace(/\s+/g, '-')
}

// Seed mock · cubre los 5 tenants existentes contra los 6 manufacturers
// que aparecen primero en el catálogo. No pretende ser exhaustivo · es
// suficiente para demo el flow y para que Jeff/Laura vean el shape.
const SEED: DealerRelationship[] = [
    // DEALER 1 · Allermuir
    {
        dealerSlug: 'dealer-1',
        manufacturerSlug: 'allermuir',
        discountTier: 42,
        freightTerms: 'Prepay & add',
        primaryRep: {
            name: 'Sarah Mitchell',
            title: 'Territory Sales Manager',
            email: 'smitchell@allermuir.com',
            phone: '+1 800 555 0101',
            lastContactAt: '2026-07-24',
        },
        accountManager: {
            name: 'James O\'Brien',
            title: 'A&D Specialist',
            email: 'jobrien@allermuir.com',
            phone: '+1 800 555 0102',
        },
        creditLimitUsd: 250000,
        lastUpdatedAt: '2026-07-28',
        notes: 'Volume rebate kicks in above $500k/yr. Renegotiate freight in Q4.',
    },
    // DEALER 1 · Egan
    {
        dealerSlug: 'dealer-1',
        manufacturerSlug: 'egan',
        discountTier: 38,
        freightTerms: 'FOB destination',
        primaryRep: {
            name: 'Michael Torres',
            title: 'Regional Rep',
            email: 'mtorres@egan.com',
            phone: '+1 800 555 0201',
            lastContactAt: '2026-06-30',
        },
        creditLimitUsd: 150000,
        lastUpdatedAt: '2026-07-01',
    },
    // DEALER 1 · Kimball
    {
        dealerSlug: 'dealer-1',
        manufacturerSlug: 'kimball',
        discountTier: 45,
        freightTerms: 'Prepay & add',
        primaryRep: {
            name: 'Amanda Chen',
            title: 'Territory Sales Manager',
            email: 'achen@kimball.com',
            phone: '+1 800 555 0301',
            lastContactAt: '2026-07-15',
        },
        creditLimitUsd: 400000,
        lastUpdatedAt: '2026-07-20',
        notes: 'Preferred vendor · fast-track on quickship items.',
    },
    // Meridian Office · Allermuir
    {
        dealerSlug: 'meridian-office',
        manufacturerSlug: 'allermuir',
        discountTier: 40,
        freightTerms: 'FOB origin',
        primaryRep: {
            name: 'David Park',
            title: 'Territory Sales Manager',
            email: 'dpark@allermuir.com',
            phone: '+1 800 555 0110',
            lastContactAt: '2026-07-22',
        },
        creditLimitUsd: 200000,
        lastUpdatedAt: '2026-07-25',
    },
    // Meridian Office · Kimball
    {
        dealerSlug: 'meridian-office',
        manufacturerSlug: 'kimball',
        discountTier: 43,
        freightTerms: 'Prepay & add',
        primaryRep: {
            name: 'Amanda Chen',
            title: 'Territory Sales Manager',
            email: 'achen@kimball.com',
            phone: '+1 800 555 0301',
            lastContactAt: '2026-07-10',
        },
        lastUpdatedAt: '2026-07-12',
    },
    // Strata · Allermuir
    {
        dealerSlug: 'strata',
        manufacturerSlug: 'allermuir',
        discountTier: 45,
        freightTerms: 'FOB destination',
        primaryRep: {
            name: 'Sarah Mitchell',
            title: 'Territory Sales Manager',
            email: 'smitchell@allermuir.com',
            phone: '+1 800 555 0101',
            lastContactAt: '2026-07-29',
        },
        creditLimitUsd: 500000,
        lastUpdatedAt: '2026-07-30',
        notes: 'Strategic partner · quarterly business reviews.',
    },
    // Strata · Egan
    {
        dealerSlug: 'strata',
        manufacturerSlug: 'egan',
        discountTier: 42,
        freightTerms: 'Prepay & add',
        primaryRep: {
            name: 'Michael Torres',
            title: 'Regional Rep',
            email: 'mtorres@egan.com',
            phone: '+1 800 555 0201',
            lastContactAt: '2026-07-18',
        },
        lastUpdatedAt: '2026-07-20',
    },
    // Apex Interiors · Kimball
    {
        dealerSlug: 'apex-interiors',
        manufacturerSlug: 'kimball',
        discountTier: 38,
        freightTerms: 'FOB origin',
        primaryRep: {
            name: 'Rachel Nguyen',
            title: 'Territory Sales Manager',
            email: 'rnguyen@kimball.com',
            phone: '+1 800 555 0310',
        },
        creditLimitUsd: 100000,
        lastUpdatedAt: '2026-06-15',
    },
    // ClearSpace Design · Allermuir
    {
        dealerSlug: 'clearspace-design',
        manufacturerSlug: 'allermuir',
        discountTier: 35,
        freightTerms: 'Prepay & add',
        primaryRep: {
            name: 'David Park',
            title: 'Territory Sales Manager',
            email: 'dpark@allermuir.com',
            phone: '+1 800 555 0110',
        },
        creditLimitUsd: 75000,
        lastUpdatedAt: '2026-05-20',
        notes: 'Newer relationship · discount tier under review.',
    },
]

/* ─── F51 · A.4 · Overrides layer + update-requests inbox ───────────
 *
 * Los reps ya no ven un mockup disabled · pueden aplicar bulk updates
 * que persisten en localStorage como "overrides" sobre el SEED. Al
 * leer, mergemos SEED + overrides · así todos los consumers (MyDealerInfo
 * del dealer · RepDashboard del rep) ven la misma info actualizada.
 *
 * Los dealers pueden pedir a su rep que refresque su info (botón "Ask
 * to update" en MyDealerInfoPage) · esas requests se guardan en un
 * inbox global que el rep lee desde su dashboard.
 * ─────────────────────────────────────────────────────────────────── */

const OVERRIDES_KEY = 'dealer-rel-overrides-v1'
const UPDATE_REQUESTS_KEY = 'dealer-info-update-requests-v1'

type OverrideValue = Partial<Pick<DealerRelationship,
    'discountTier' | 'freightTerms' | 'notes' | 'creditLimitUsd' | 'lastUpdatedAt'
>>
type OverridesMap = Record<string, OverrideValue>

function overrideKey(dealerSlug: string, manufacturerSlug: string) {
    return `${dealerSlug}__${manufacturerSlug}`
}

function loadOverrides(): OverridesMap {
    try {
        const raw = localStorage.getItem(OVERRIDES_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed as OverridesMap : {}
    } catch {
        return {}
    }
}

function saveOverrides(map: OverridesMap) {
    try {
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(map))
    } catch { /* noop */ }
}

function applyOverrideToRel(rel: DealerRelationship, overrides: OverridesMap): DealerRelationship {
    const ov = overrides[overrideKey(rel.dealerSlug, rel.manufacturerSlug)]
    return ov ? { ...rel, ...ov } : rel
}

/** Aplica un patch a una relación específica y lo persiste como override.
 *  El SEED no se muta · el merge se aplica al leer. Se dispara el evento
 *  DEALER_REL_CHANGE_EVENT para que consumers refresquen. */
export function applyRelationshipOverride(
    dealerSlug: string,
    manufacturerSlug: string,
    patch: OverrideValue,
): void {
    const map = loadOverrides()
    const k = overrideKey(dealerSlug, manufacturerSlug)
    map[k] = { ...(map[k] ?? {}), ...patch, lastUpdatedAt: new Date().toISOString() }
    saveOverrides(map)
    try {
        window.dispatchEvent(new CustomEvent(DEALER_REL_CHANGE_EVENT))
    } catch { /* SSR · noop */ }
}

/** Descarta todos los overrides del rep (útil para el "revert" en testing). */
export function clearAllOverrides(): void {
    saveOverrides({})
    try {
        window.dispatchEvent(new CustomEvent(DEALER_REL_CHANGE_EVENT))
    } catch { /* SSR · noop */ }
}

export const DEALER_REL_CHANGE_EVENT = 'catalog:dealer-rel-change'

/* Update-requests inbox · el dealer pide, el rep resuelve */

export interface UpdateRequest {
    dealerSlug: string
    manufacturerSlug: string
    requestedAt: string
}

function loadUpdateRequests(): UpdateRequest[] {
    try {
        const raw = localStorage.getItem(UPDATE_REQUESTS_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed as UpdateRequest[] : []
    } catch {
        return []
    }
}

function saveUpdateRequests(list: UpdateRequest[]) {
    try {
        localStorage.setItem(UPDATE_REQUESTS_KEY, JSON.stringify(list))
    } catch { /* noop */ }
}

export const UPDATE_REQUESTS_CHANGE_EVENT = 'catalog:dealer-update-request-change'

/** Dealer registra la petición · el rep la ve en su inbox. */
export function submitUpdateRequest(dealerSlug: string, manufacturerSlug: string): void {
    const list = loadUpdateRequests()
    list.push({ dealerSlug, manufacturerSlug, requestedAt: new Date().toISOString() })
    saveUpdateRequests(list)
    try {
        window.dispatchEvent(new CustomEvent(UPDATE_REQUESTS_CHANGE_EVENT))
    } catch { /* noop */ }
}

/** Devuelve las requests para dealers que este rep atiende. */
export function getUpdateRequestsForRep(repEmail: string): UpdateRequest[] {
    const rels = getRelationshipsForRep(repEmail)
    const dealerManufacturerPairs = new Set(
        rels.map((r) => overrideKey(r.dealerSlug, r.manufacturerSlug)),
    )
    return loadUpdateRequests()
        .filter((r) => dealerManufacturerPairs.has(overrideKey(r.dealerSlug, r.manufacturerSlug)))
}

/** Rep resolvió una request · la remueve del inbox. */
export function clearUpdateRequest(dealerSlug: string, manufacturerSlug: string): void {
    const filtered = loadUpdateRequests().filter(
        (r) => !(r.dealerSlug === dealerSlug && r.manufacturerSlug === manufacturerSlug),
    )
    saveUpdateRequests(filtered)
    try {
        window.dispatchEvent(new CustomEvent(UPDATE_REQUESTS_CHANGE_EVENT))
    } catch { /* noop */ }
}

/** Devuelve la relación del dealer con el manufacturer, o null si no existe. */
export function getDealerRelationship(
    dealerTenant: string,
    manufacturerId: string,
): DealerRelationship | null {
    const dealerSlug = toDealerSlug(dealerTenant)
    const found = SEED.find(
        (r) => r.dealerSlug === dealerSlug && r.manufacturerSlug === manufacturerId,
    )
    if (!found) return null
    return applyOverrideToRel(found, loadOverrides())
}

/** Devuelve todas las relaciones de un dealer (útil para el rep dashboard mock). */
export function getRelationshipsForDealer(dealerTenant: string): DealerRelationship[] {
    const dealerSlug = toDealerSlug(dealerTenant)
    const overrides = loadOverrides()
    return SEED
        .filter((r) => r.dealerSlug === dealerSlug)
        .map((r) => applyOverrideToRel(r, overrides))
}

/** Devuelve todas las relaciones que un rep primario atiende (mock del rep dashboard). */
export function getRelationshipsForRep(repEmail: string): DealerRelationship[] {
    const overrides = loadOverrides()
    return SEED
        .filter((r) => r.primaryRep.email.toLowerCase() === repEmail.toLowerCase())
        .map((r) => applyOverrideToRel(r, overrides))
}

/** Formato humano · "2 days ago", "1 month ago", etc. */
export function formatRelativeDate(iso: string, nowIso?: string): string {
    try {
        const then = new Date(iso).getTime()
        const now = nowIso ? new Date(nowIso).getTime() : new Date().getTime()
        const diffMs = now - then
        if (diffMs < 0) return new Date(iso).toLocaleDateString()
        const day = 86400000
        const days = Math.floor(diffMs / day)
        if (days === 0) return 'today'
        if (days === 1) return 'yesterday'
        if (days < 30) return `${days} days ago`
        const months = Math.floor(days / 30)
        if (months === 1) return '1 month ago'
        if (months < 12) return `${months} months ago`
        const years = Math.floor(days / 365)
        return years === 1 ? '1 year ago' : `${years} years ago`
    } catch {
        return iso
    }
}
