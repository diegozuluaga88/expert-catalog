// Helper de lookup product · busca en ambos data sources del catalog
// (UNIFIED_PRODUCTS del showroom + SHOP_PRODUCTS del product catalog).
// Usado por la feature de Edit item desde el drawer · necesita re-cargar
// el Product full a partir del productId guardado en QuoteLineItem.

import type { Product } from './types'
import { UNIFIED_PRODUCTS } from './showroom/data/unifiedProducts'
import { SHOP_PRODUCTS } from './shop/data/products'

export function findProductById(id: string): Product | undefined {
    return UNIFIED_PRODUCTS.find(p => p.id === id) ?? SHOP_PRODUCTS.find(p => p.id === id)
}
