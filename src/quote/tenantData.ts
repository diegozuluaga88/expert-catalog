// Phase 3 Fix #10 — Tenant metadata para autofill del buyer info en quotes.
// El TenantContext sigue exponiendo `Tenant = string` (sin breaking changes a los
// muchos consumers existentes). Esta capa agrega metadata via lookup helper.
// Mock data realista por tenant · usado por QuoteContext + /quotes page header.

export interface TenantMetadata {
    id: string
    name: string
    industry: string
    legalName: string
    billingAddress: {
        line1: string
        city: string
        state: string
        zip: string
    }
    taxId: string
    billingContactEmail: string
    /** Tailwind bg-utility para el badge/logo en topbar y en /quotes header */
    badgeColor: string
}

const TENANT_DATA: Record<string, TenantMetadata> = {
    'SPECIAL T': {
        id: 'special-t',
        name: 'SPECIAL T',
        industry: 'Higher Education',
        legalName: 'Special T Furniture LLC',
        billingAddress: { line1: '450 Industrial Park Rd', city: 'Liverpool', state: 'NY', zip: '13088' },
        taxId: 'EIN 12-3456789',
        billingContactEmail: 'billing@specialt.example',
        badgeColor: 'bg-blue-600',
    },
    'Meridian Office': {
        id: 'meridian-office',
        name: 'Meridian Office',
        industry: 'Corporate / Enterprise',
        legalName: 'Meridian Office Solutions Inc.',
        billingAddress: { line1: '2200 Crossroads Pkwy', city: 'Brentwood', state: 'TN', zip: '37027' },
        taxId: 'EIN 98-7654321',
        billingContactEmail: 'accounts@meridian-office.example',
        badgeColor: 'bg-emerald-600',
    },
    'Strata': {
        id: 'strata',
        name: 'Strata',
        industry: 'Design System (internal)',
        legalName: 'Strata Operations',
        billingAddress: { line1: '1 Strata Way', city: 'San Francisco', state: 'CA', zip: '94103' },
        taxId: 'EIN 00-0000000',
        billingContactEmail: 'finance@strata.example',
        badgeColor: 'bg-zinc-800',
    },
    'Apex Interiors': {
        id: 'apex-interiors',
        name: 'Apex Interiors',
        industry: 'Hospitality / Restaurants',
        legalName: 'Apex Interior Group LLC',
        billingAddress: { line1: '88 Market St', city: 'Chicago', state: 'IL', zip: '60601' },
        taxId: 'EIN 55-1122334',
        billingContactEmail: 'ap@apexinteriors.example',
        badgeColor: 'bg-orange-600',
    },
    'ClearSpace Design': {
        id: 'clearspace-design',
        name: 'ClearSpace Design',
        industry: 'A&D Firm',
        legalName: 'ClearSpace Design Studios',
        billingAddress: { line1: '17 Hudson Square', city: 'New York', state: 'NY', zip: '10013' },
        taxId: 'EIN 77-8899001',
        billingContactEmail: 'finance@clearspace.example',
        badgeColor: 'bg-purple-600',
    },
}

const FALLBACK_TENANT: TenantMetadata = {
    id: 'unknown',
    name: 'Unknown Tenant',
    industry: '—',
    legalName: '—',
    billingAddress: { line1: '—', city: '—', state: '—', zip: '—' },
    taxId: '—',
    billingContactEmail: '—',
    badgeColor: 'bg-muted',
}

export function getTenantMetadata(name: string): TenantMetadata {
    return TENANT_DATA[name] ?? { ...FALLBACK_TENANT, name }
}

export function tenantSlugFor(name: string): string {
    return getTenantMetadata(name).id
}

export const ALL_TENANT_METADATA: TenantMetadata[] = Object.values(TENANT_DATA)
