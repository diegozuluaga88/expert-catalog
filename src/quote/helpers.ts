// Phase 3 helpers · used by AddToQuoteModal (Fix #11) y QuotePage (Fix #12).
// Creado en Phase 2 Fix #9 porque computeLineItemTotals lo necesita el buy box
// del PDP refactor (Fix #5).

import type { Product, VolumeTier } from '../catalog/types'
import { getProductVariants } from '../catalog/data/productVariants'

export interface LineItemSelection {
  qty: number
  colorwayCode?: string
  finishId?: string
  fabricId?: string
  materialTierId?: string
}

export interface LineItemTotals {
  /** Precio por unidad después de tier de volumen + modifiers · USD */
  unitPrice: number
  /** Precio total · unitPrice * qty · USD */
  totalPrice: number
  /** Lead time estimado en días · base + adjusts de variants seleccionadas */
  leadTimeDays: number
  /** Tier de volumen aplicado (si hay) · útil para mostrar "Save X% on N+" hint */
  appliedVolumeTier?: VolumeTier
  /** Próximo tier de volumen (si existe) · para hint "Add Y more to save Z" */
  nextVolumeTier?: { tier: VolumeTier; qtyNeeded: number; savings: number }
}

/**
 * Parsea "2-3 week shipping" o "4-6 weeks" a días promedio. Fallback 14 días.
 */
function parseLeadTime(leadTime: string | undefined): number {
  if (!leadTime) return 14
  if (/in.?stock|quick.?ship/i.test(leadTime)) return 3
  const match = leadTime.match(/(\d+)[-–](\d+)\s*week/i)
  if (match) {
    const lo = parseInt(match[1], 10)
    const hi = parseInt(match[2], 10)
    return Math.round(((lo + hi) / 2) * 7)
  }
  const single = leadTime.match(/(\d+)\s*week/i)
  if (single) return parseInt(single[1], 10) * 7
  return 14
}

/**
 * Calcula precio total + lead time para una line item, dada la selección de variants.
 * Determinístico · sin side effects.
 */
export function computeLineItemTotals(product: Product, selection: LineItemSelection): LineItemTotals {
  const variants = getProductVariants(product)
  const qty = Math.max(1, selection.qty)

  // Precio base por unidad · volume tier wins, sino product.price, sino 0
  let unitPrice = product.price ?? 0
  let appliedVolumeTier: VolumeTier | undefined
  let nextVolumeTier: LineItemTotals['nextVolumeTier']

  if (variants.volumePricing && variants.volumePricing.length > 0) {
    const sorted = [...variants.volumePricing].sort((a, b) => a.minQty - b.minQty)
    for (const tier of sorted) {
      if (qty >= tier.minQty && (tier.maxQty === undefined || qty <= tier.maxQty)) {
        appliedVolumeTier = tier
        unitPrice = tier.pricePerUnit
        break
      }
    }
    // Calcular próximo tier para hint de upsell
    const currentIdx = appliedVolumeTier ? sorted.indexOf(appliedVolumeTier) : -1
    const next = sorted[currentIdx + 1]
    if (next) {
      const qtyNeeded = next.minQty - qty
      const savings = (unitPrice - next.pricePerUnit) * next.minQty
      if (qtyNeeded > 0 && savings > 0) {
        nextVolumeTier = { tier: next, qtyNeeded, savings: Math.round(savings) }
      }
    }
  }

  // Modifiers aditivos · finish, fabric, material tier
  let priceModifier = 0
  let leadAdjust = 0

  if (selection.finishId && variants.finishes) {
    const finish = variants.finishes.find((f) => f.id === selection.finishId)
    if (finish) {
      priceModifier += finish.priceModifier
      leadAdjust += finish.leadTimeAdjust
    }
  }

  if (selection.fabricId && variants.fabricOptions) {
    const fabric = variants.fabricOptions.find((f) => f.id === selection.fabricId)
    if (fabric) {
      priceModifier += fabric.priceModifier
      leadAdjust += fabric.leadTimeAdjust
    }
  }

  if (selection.materialTierId && variants.materialTiers) {
    const tier = variants.materialTiers.find((t) => t.id === selection.materialTierId)
    if (tier) {
      priceModifier += tier.priceModifier
      leadAdjust += tier.leadTimeAdjust
    }
  }

  unitPrice += priceModifier
  const totalPrice = unitPrice * qty
  const leadTimeDays = parseLeadTime(product.leadTime) + leadAdjust

  return {
    unitPrice,
    totalPrice,
    leadTimeDays,
    appliedVolumeTier,
    nextVolumeTier,
  }
}

/**
 * Formatea días en una etiqueta legible · "2-3 weeks" / "Ships in 5 days" / etc.
 */
export function formatLeadTime(days: number): string {
  if (days <= 0) return 'In stock'
  if (days <= 7) return `Ships in ${days} day${days === 1 ? '' : 's'}`
  const weeks = days / 7
  if (weeks < 2) return '1-2 weeks'
  const lo = Math.floor(weeks)
  const hi = Math.ceil(weeks) + (Math.floor(weeks) === Math.ceil(weeks) ? 1 : 0)
  return `${lo}-${hi} weeks`
}

/**
 * Mock de fecha estimada de entrega · "Order by Fri for delivery by Mar 15".
 * Usa offset estático para no depender de Date.now() (cache-safe).
 */
export function deliveryEstimate(days: number, _seed: string = ''): string {
  // Simple offset · sin Date.now() para mantenerlo testable
  const eta = days
  if (eta <= 0) return 'Available now'
  if (eta <= 7) return `Delivery in ${eta} business day${eta === 1 ? '' : 's'}`
  const weeks = Math.round(eta / 7)
  return `Delivery in ~${weeks} week${weeks === 1 ? '' : 's'}`
}
