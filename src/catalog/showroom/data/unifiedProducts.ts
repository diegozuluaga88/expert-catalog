// Etapa 9.1 — Data layer unificado del Showroom.
// Aplana `MANUFACTURERS` (browse, productos ricos + materiales) en una lista plana de productos,
// hereda brand/category/isMaterial de la jerarquía y enriquece con campos dealer (price/rating/
// leadTime/tags) deterministas cuando faltan. Reusa el tipo `Product` (rich + dealer).

import type { Category, Manufacturer, Product } from '../../types'
import { MANUFACTURERS } from '../../data/manufacturers'

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const LEAD_TIMES = ['In Stock', '1 week shipping', '2-3 week shipping', '4-6 week shipping', 'Custom Order']
const PRODUCT_TAGS = ['Quick Ship', 'Commercial Use', 'Best Seller', 'New', 'Customizable']

/** Enriquece un producto rico (browse) con campos dealer deterministas + brand/category/isMaterial. */
function enrich(p: Product, m: Manufacturer, c: Category): Product {
  const h = hash(`${m.id}:${c.id}:${p.id}`)
  const isMaterial = m.type === 'materials'
  const price = p.price ?? 200 + (h % 1800)
  return {
    ...p,
    id: `${m.id}__${p.id}`,
    brand: p.brand ?? m.name,
    category: p.category ?? c.name,
    isMaterial,
    price,
    listPrice: p.listPrice ?? Math.round(price * 1.15),
    dealerRating: p.dealerRating ?? Number((4 + (h % 10) / 10).toFixed(1)),
    leadTime: p.leadTime ?? LEAD_TIMES[h % LEAD_TIMES.length],
    tags: p.tags && p.tags.length ? p.tags : isMaterial ? ['Textile'] : [PRODUCT_TAGS[h % PRODUCT_TAGS.length]],
    popular: p.popular ?? h % 3 === 0,
  }
}

export interface ProductContext {
  product: Product
  manufacturer: Manufacturer
  category: Category
}

const _products: Product[] = []
const _index: Record<string, ProductContext> = {}

for (const m of MANUFACTURERS) {
  for (const c of m.categories) {
    for (const p of c.products) {
      const enriched = enrich(p, m, c)
      _products.push(enriched)
      _index[enriched.id] = { product: enriched, manufacturer: m, category: c }
    }
  }
}

export const UNIFIED_PRODUCTS: Product[] = _products
export const UNIFIED_INDEX: Record<string, ProductContext> = _index

/** Contexto (manufacturer + category) de un producto unificado, para el detalle rico. */
export function getProductContext(id: string): ProductContext | undefined {
  return _index[id]
}

export const UNIFIED_BRANDS: string[] = Array.from(new Set(UNIFIED_PRODUCTS.map((p) => p.brand!).filter(Boolean)))
export const UNIFIED_CATEGORIES: string[] = Array.from(
  new Set(UNIFIED_PRODUCTS.map((p) => p.category!).filter(Boolean))
)
export const UNIFIED_FEATURES: string[] = Array.from(new Set(UNIFIED_PRODUCTS.flatMap((p) => p.tags ?? [])))

export const UNIFIED_PRICE_RANGES: { label: string; min: number; max: number }[] = [
  { label: 'Under $300', min: 0, max: 300 },
  { label: '$300 – $700', min: 300, max: 700 },
  { label: '$700 – $1,200', min: 700, max: 1200 },
  { label: 'Over $1,200', min: 1200, max: Infinity },
]
