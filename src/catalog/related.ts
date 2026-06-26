// Helpers para encontrar productos relacionados al actual · usado por la sección
// "Strata recommends" del ProductDetailPanel.
//
// 3 buckets:
//  - complementary · misma brand, diferente category (mismo manufacturer, otros productos)
//  - betterPrice · similar category, MENOR precio
//  - fasterDelivery · similar category, MENOR lead time

import type { Product } from './types'
import { UNIFIED_PRODUCTS } from './showroom/data/unifiedProducts'

export interface RelatedBucket {
    label: string
    reason: string
    products: Product[]
}

function parseLeadDays(leadTime: string | undefined): number {
    if (!leadTime) return 99
    const lt = leadTime.toLowerCase()
    if (lt.includes('in stock')) return 0
    const m = lt.match(/(\d+)/)
    return m ? parseInt(m[1], 10) * 7 : 99
}

export function getRelatedProducts(product: Product): {
    complementary: RelatedBucket
    betterPrice: RelatedBucket
    fasterDelivery: RelatedBucket
} {
    const ownLead = parseLeadDays(product.leadTime)
    const ownPrice = product.price ?? 0
    const all = UNIFIED_PRODUCTS.filter(p => p.id !== product.id)

    // Complementary · same brand, distinct category (cross-sell within manufacturer)
    const complementary = all
        .filter(p => p.brand === product.brand && p.category !== product.category)
        .slice(0, 6)

    // Better price · same category, price ≥ 8% lower
    const betterPrice = all
        .filter(p => p.category === product.category)
        .filter(p => (p.price ?? Infinity) > 0 && (p.price ?? Infinity) <= ownPrice * 0.92)
        .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        .slice(0, 6)

    // Faster delivery · same category, lead at least 1 week shorter
    const fasterDelivery = all
        .filter(p => p.category === product.category)
        .filter(p => parseLeadDays(p.leadTime) < ownLead - 6)
        .sort((a, b) => parseLeadDays(a.leadTime) - parseLeadDays(b.leadTime))
        .slice(0, 6)

    return {
        complementary: {
            label: 'Often paired together',
            reason: `Other ${product.brand} products from the same line`,
            products: complementary,
        },
        betterPrice: {
            label: 'Better price · Strata picks',
            reason: 'Same category · lower unit price after dealer discount',
            products: betterPrice,
        },
        fasterDelivery: {
            label: 'Ships sooner · Strata picks',
            reason: 'Same category · shorter estimated lead time',
            products: fasterDelivery,
        },
    }
}
