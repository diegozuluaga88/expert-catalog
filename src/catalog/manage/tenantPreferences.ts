// Tenant Buying Preferences · Phase 5 (Diego ask · 2026-06-30).
// Configuración estructurada per tenant que el dealer ajusta en el modal
// Manage Catalogs > Preferences tab. UI demo only · summary badge muestra
// "N rules active" pero NO se conecta a los filtros del catalog (scope acotado).
//
// Persistencia · localStorage per tenant · mismo pattern que QuoteContext drafts
// (key: `expert-catalog.tenant-preferences.{tenantSlug}`).

import type { CustomRule } from './SmartRuleBuilderModal'

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
    }
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
