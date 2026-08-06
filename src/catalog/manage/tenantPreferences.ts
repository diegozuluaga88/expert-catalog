// Tenant Buying Preferences · Phase 5 (Diego ask · 2026-06-30).
// Configuración estructurada per tenant que el dealer ajusta en el modal
// My Setup > Buying preferences tab.
//
// F66 update · antes era "UI demo only" · ahora las preferences afectan
// activamente los filtros del Products tab (approvedBrands re-rank en
// F66.1 · compliance/sustainability/budget en F66.2). MRL tab sigue con
// scope minimal · solo approvedBrands aplica ahí. Ver plan cuddly-*.md.
//
// Persistencia · localStorage per tenant · mismo pattern que QuoteContext drafts
// (key: `expert-catalog.tenant-preferences.{tenantSlug}`).

import type { CustomRule } from './SmartRuleBuilderModal'

/** F66 · custom event dispatcher · savePreferences lo emite para que los
 *  consumers (ShowroomPageV2, LibraryPageV2) sincronicen sin refresh. */
export const TENANT_PREFERENCES_CHANGE_EVENT = 'expert-catalog:tenant-preferences-change'

export type Vertical = 'corporate' | 'healthcare' | 'government' | 'architectural' | 'education'

export interface TenantPreferences {
    // Approved Manufacturers (whitelist)
    restrictToApproved: boolean
    approvedBrands: string[]

    // Compliance & Vertical
    vertical: Vertical
    // Government-specific
    gsaScheduleOnly: boolean
    buyAmericanCompliant: boolean
    // Healthcare-specific
    gpoApproved: boolean
    antimicrobialFinishes: boolean
    // Architectural-specific
    adFirmApprovalWorkflow: boolean
    sampleRequestRequired: boolean

    // Budget & Lead Time SLA
    maxProjectBudget: number | null  // null = no constraint
    maxLeadTimeDays: number          // 7-90
    flagItemsExceedingSla: boolean

    // Sustainability
    greenguardGold: boolean
    leedCompliant: boolean
    fscCertifiedWood: boolean
    recycledContentMin: number       // 0-100 (%)
    recycledContentEnabled: boolean

    // Custom rules (AI-built via SmartRuleBuilderModal)
    customRules: CustomRule[]

    // F66.3 · Pricing rules (integradas del legacy ClientPolicyManager V1).
    // Al activarlas, el ProductCatalogCardV2 muestra el precio con el
    // dealer contract aplicado + savings badge. Contract Pricing es la base
    // (45% off list) · Special Auth suma 5% adicional · Volume Tier y
    // Q3 Promo requieren quote context (basket total) · solo se toggean
    // aquí y su effect se aplica cuando el user va al quote/selection.
    contractPricingActive: boolean       // 45% base off list
    contractDiscountPct: number          // configurable · default 45
    specialAuthActive: boolean           // +5% on top of net (project-specific)
    specialAuthPct: number               // configurable · default 5
    volumeTierActive: boolean            // +N% when basket total > threshold
    volumeTierThreshold: number          // USD · default 10000
    volumeTierPct: number                // % · default 3
    q3PromoActive: boolean               // flat $off promo (seasonal)
    q3PromoFlatAmount: number            // USD · default 250
}

export const VERTICAL_OPTIONS: { value: Vertical; label: string }[] = [
    { value: 'corporate', label: 'Corporate / Office' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'government', label: 'Government' },
    { value: 'architectural', label: 'Architectural / A&D' },
    { value: 'education', label: 'Education' },
]

// Top 10 brands del catalog · usado para el multi-select chips de Approved Manufacturers.
// Lista canonical aligned con SHOP_BRANDS y la prefab data del proyecto.
export const BRANDS_LIST = [
    'Steelcase',
    'Herman Miller',
    'MillerKnoll',
    'Haworth',
    'Teknion',
    'Knoll',
    'Kimball',
    'Allsteel',
    'HON',
    'Global',
] as const

export function defaultPreferences(): TenantPreferences {
    return {
        restrictToApproved: false,
        approvedBrands: [],
        vertical: 'corporate',
        gsaScheduleOnly: false,
        buyAmericanCompliant: false,
        gpoApproved: false,
        antimicrobialFinishes: false,
        adFirmApprovalWorkflow: false,
        sampleRequestRequired: false,
        maxProjectBudget: null,
        maxLeadTimeDays: 30,
        flagItemsExceedingSla: true,
        greenguardGold: false,
        leedCompliant: false,
        fscCertifiedWood: false,
        recycledContentEnabled: false,
        recycledContentMin: 30,
        customRules: [],
        // F66.3 · pricing rules defaults · all off · user opts in from panel
        contractPricingActive: false,
        contractDiscountPct: 45,
        specialAuthActive: false,
        specialAuthPct: 5,
        volumeTierActive: false,
        volumeTierThreshold: 10000,
        volumeTierPct: 3,
        q3PromoActive: false,
        q3PromoFlatAmount: 250,
    }
}

/** F66.7 · aplica quote-level pricing rules (Volume Tier + Q3 Promo) al
 *  subtotal de un draft/selection. Volume Tier · % off cuando subtotal
 *  >= threshold. Q3 Promo · flat $ off unconditional (cuando active).
 *  Returns breakdown para display en el UI.
 *  Nota · Contract Pricing + Special Auth se aplican per-item en las
 *  cards (via applyPerItemPricingRules) · no aparecen acá. */
export function applyQuoteRules(subtotal: number, prefs: TenantPreferences): {
    subtotal: number
    volumeTierDiscount: number
    q3PromoDiscount: number
    finalTotal: number
    totalSavings: number
    rulesApplied: Array<{ label: string; discount: number }>
} {
    const rulesApplied: Array<{ label: string; discount: number }> = []
    let net = subtotal
    let volumeTierDiscount = 0
    if (prefs.volumeTierActive && subtotal >= prefs.volumeTierThreshold && prefs.volumeTierPct > 0) {
        volumeTierDiscount = Math.round(net * (prefs.volumeTierPct / 100))
        net -= volumeTierDiscount
        rulesApplied.push({ label: `Volume tier ${prefs.volumeTierPct}%`, discount: volumeTierDiscount })
    }
    let q3PromoDiscount = 0
    if (prefs.q3PromoActive && prefs.q3PromoFlatAmount > 0) {
        q3PromoDiscount = Math.min(prefs.q3PromoFlatAmount, net)
        net -= q3PromoDiscount
        rulesApplied.push({ label: 'Q3 promo (flat)', discount: q3PromoDiscount })
    }
    const finalTotal = Math.max(0, Math.round(net))
    const totalSavings = subtotal - finalTotal
    return { subtotal, volumeTierDiscount, q3PromoDiscount, finalTotal, totalSavings, rulesApplied }
}

/** F66.5 · deterministic mock cert detection · el data model actual (Product)
 *  no tiene un field `certifications`. Para el demo de tag-based preferences,
 *  usamos un hash del product.id + cert key para simular qué products tienen
 *  cada certificación. Distribución realista (GSA ~40% de products, LEED ~40%,
 *  Greenguard ~30%, FSC ~20%, etc). Consistente en runs (el hash es
 *  determinístico) · in production reemplaza con `product.certifications[]`. */
export function productHasMockCert(productId: string, cert: string): boolean {
    if (!productId) return false
    let hash = 0
    const key = `${productId}-${cert}`
    for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) - hash + key.charCodeAt(i)) & 0xffffffff
    }
    const distributions: Record<string, number> = {
        gsa: 40,
        leed: 40,
        greenguard: 30,
        fsc: 20,
        antimicrobial: 20,
        'buy-american': 35,
        gpo: 25,
    }
    const threshold = distributions[cert] ?? 30
    return Math.abs(hash) % 100 < threshold
}

/** F66.5 · verifica si un product satisface TODAS las tag-based preferences
 *  activas del tenant. Fail-open cuando no hay ninguna preference tag-based
 *  activa (retorna false porque no hay nada que match). Retorna true solo
 *  cuando hay ≥1 preference tag-based active AND el product tiene mock cert
 *  para todas ellas. Usado para el badge visual "Matches your preferences"
 *  en las product cards. */
export function productMatchesTagPreferences(productId: string, prefs: TenantPreferences): boolean {
    const activeCerts: string[] = []
    if (prefs.vertical === 'government') {
        if (prefs.gsaScheduleOnly) activeCerts.push('gsa')
        if (prefs.buyAmericanCompliant) activeCerts.push('buy-american')
    }
    if (prefs.vertical === 'healthcare') {
        if (prefs.gpoApproved) activeCerts.push('gpo')
        if (prefs.antimicrobialFinishes) activeCerts.push('antimicrobial')
    }
    if (prefs.greenguardGold) activeCerts.push('greenguard')
    if (prefs.leedCompliant) activeCerts.push('leed')
    if (prefs.fscCertifiedWood) activeCerts.push('fsc')
    if (activeCerts.length === 0) return false
    return activeCerts.every(cert => productHasMockCert(productId, cert))
}

/** F66.3 · aplica pricing rules a un base price · devuelve el price final
 *  después de dealer contract + special auth (los que son per-item · Volume
 *  Tier y Q3 Promo necesitan basket context y se aplican en el quote). */
export function applyPerItemPricingRules(basePrice: number, prefs: TenantPreferences): {
    finalPrice: number
    savings: number
    savingsPct: number
    rulesApplied: string[]
} {
    let net = basePrice
    const rulesApplied: string[] = []
    if (prefs.contractPricingActive && prefs.contractDiscountPct > 0) {
        net = net * (1 - prefs.contractDiscountPct / 100)
        rulesApplied.push(`Contract ${prefs.contractDiscountPct}%`)
    }
    if (prefs.specialAuthActive && prefs.specialAuthPct > 0) {
        net = net * (1 - prefs.specialAuthPct / 100)
        rulesApplied.push(`Special Auth +${prefs.specialAuthPct}%`)
    }
    const finalPrice = Math.round(net)
    const savings = basePrice - finalPrice
    const savingsPct = basePrice > 0 ? Math.round((savings / basePrice) * 100) : 0
    return { finalPrice, savings, savingsPct, rulesApplied }
}

const STORAGE_KEY_PREFIX = 'expert-catalog.tenant-preferences.'

export function loadPreferences(tenantSlug: string): TenantPreferences {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + tenantSlug)
        if (!raw) return defaultPreferences()
        const parsed = JSON.parse(raw)
        // Merge con defaults para garantizar nuevas keys cuando se agregan
        return { ...defaultPreferences(), ...parsed }
    } catch {
        return defaultPreferences()
    }
}

export function savePreferences(tenantSlug: string, prefs: TenantPreferences): void {
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug, JSON.stringify(prefs))
    } catch {
        /* quota / disabled · noop */
    }
    // F66 · notifica a consumers (ShowroomPageV2 filters, MRL, etc)
    try {
        window.dispatchEvent(new CustomEvent(TENANT_PREFERENCES_CHANGE_EVENT))
    } catch { /* SSR · noop */ }
}

export interface PreferencesSummary {
    active: number
    compliance: number
    custom: number
}

/**
 * Cuenta cuántas reglas están activas para el summary badge.
 * - active · cualquier feature toggleada (whitelist, budget, SLA flag, sustainability)
 * - compliance · checks vertical-specific (GSA / Buy American / GPO / etc)
 * - custom · array length de customRules
 */
export function summarizePreferences(prefs: TenantPreferences): PreferencesSummary {
    let active = 0
    if (prefs.restrictToApproved && prefs.approvedBrands.length > 0) active++
    if (prefs.maxProjectBudget !== null && prefs.maxProjectBudget > 0) active++
    if (prefs.flagItemsExceedingSla) active++
    if (prefs.greenguardGold) active++
    if (prefs.leedCompliant) active++
    if (prefs.fscCertifiedWood) active++
    if (prefs.recycledContentEnabled) active++
    // F66.3 · pricing rules cuentan como active preferences
    if (prefs.contractPricingActive) active++
    if (prefs.specialAuthActive) active++
    if (prefs.volumeTierActive) active++
    if (prefs.q3PromoActive) active++

    let compliance = 0
    if (prefs.vertical === 'government') {
        if (prefs.gsaScheduleOnly) compliance++
        if (prefs.buyAmericanCompliant) compliance++
    } else if (prefs.vertical === 'healthcare') {
        if (prefs.gpoApproved) compliance++
        if (prefs.antimicrobialFinishes) compliance++
    } else if (prefs.vertical === 'architectural') {
        if (prefs.adFirmApprovalWorkflow) compliance++
        if (prefs.sampleRequestRequired) compliance++
    }

    return {
        active,
        compliance,
        custom: prefs.customRules.length,
    }
}
