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

/** Devuelve la relación del dealer con el manufacturer, o null si no existe. */
export function getDealerRelationship(
    dealerTenant: string,
    manufacturerId: string,
): DealerRelationship | null {
    const dealerSlug = toDealerSlug(dealerTenant)
    return SEED.find(
        (r) => r.dealerSlug === dealerSlug && r.manufacturerSlug === manufacturerId,
    ) ?? null
}

/** Devuelve todas las relaciones de un dealer (útil para el rep dashboard mock). */
export function getRelationshipsForDealer(dealerTenant: string): DealerRelationship[] {
    const dealerSlug = toDealerSlug(dealerTenant)
    return SEED.filter((r) => r.dealerSlug === dealerSlug)
}

/** Devuelve todas las relaciones que un rep primario atiende (mock del rep dashboard). */
export function getRelationshipsForRep(repEmail: string): DealerRelationship[] {
    return SEED.filter((r) => r.primaryRep.email.toLowerCase() === repEmail.toLowerCase())
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
