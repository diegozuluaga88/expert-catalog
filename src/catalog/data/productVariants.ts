// Phase 2 Fix #9 — Mock variants para los 3 productos más visibles del showroom.
// Resto inherit defaults (sin variants extra · AddToQuoteModal mostrará solo
// qty + colorway).

import type { FabricOption, Finish, MaterialTier, VolumeTier } from '../types'

interface ProductVariantData {
  finishes?: Finish[]
  fabricOptions?: FabricOption[]
  volumePricing?: VolumeTier[]
  materialTiers?: MaterialTier[]
}

const COMMON_FINISHES: Finish[] = [
  { id: 'finish-clear', name: 'Clear', swatch: '#e5e7eb', priceModifier: 0, leadTimeAdjust: 0 },
  { id: 'finish-walnut', name: 'Walnut', swatch: '#5b3a1f', priceModifier: 45, leadTimeAdjust: 3 },
  { id: 'finish-oak', name: 'Natural Oak', swatch: '#a07c4d', priceModifier: 35, leadTimeAdjust: 2 },
  { id: 'finish-ebony', name: 'Ebony', swatch: '#1f1f1f', priceModifier: 55, leadTimeAdjust: 5 },
]

const COMMON_FABRIC_OPTIONS: FabricOption[] = [
  { id: 'fabric-grade-a', name: 'Grade A · Standard', type: 'standard', priceModifier: 0, leadTimeAdjust: 0 },
  { id: 'fabric-grade-b', name: 'Grade B · Premium Wool', type: 'standard', priceModifier: 35, leadTimeAdjust: 0 },
  { id: 'fabric-leather', name: 'Genuine Leather', type: 'special', priceModifier: 220, leadTimeAdjust: 14 },
  { id: 'fabric-com', name: 'COM (Customer Own Material)', type: 'special', priceModifier: 0, leadTimeAdjust: 21 },
  { id: 'fabric-recycled', name: 'Recycled Polyester', type: 'standard', priceModifier: 15, leadTimeAdjust: 0 },
]

const COMMON_MATERIAL_TIERS: MaterialTier[] = [
  { id: 'tier-standard', name: 'Standard', priceModifier: 0, leadTimeAdjust: 0 },
  { id: 'tier-premium', name: 'Premium', priceModifier: 80, leadTimeAdjust: 5 },
  { id: 'tier-special', name: 'Special-order', priceModifier: 180, leadTimeAdjust: 18 },
]

const VOLUME_TIERS_HIGH_VOL: VolumeTier[] = [
  { minQty: 1, maxQty: 9, pricePerUnit: 752 },
  { minQty: 10, maxQty: 49, pricePerUnit: 695 },
  { minQty: 50, pricePerUnit: 625 },
]

const VOLUME_TIERS_MID_VOL: VolumeTier[] = [
  { minQty: 1, maxQty: 4, pricePerUnit: 668 },
  { minQty: 5, maxQty: 19, pricePerUnit: 615 },
  { minQty: 20, pricePerUnit: 555 },
]

const VOLUME_TIERS_LUX: VolumeTier[] = [
  { minQty: 1, maxQty: 3, pricePerUnit: 1363 },
  { minQty: 4, maxQty: 11, pricePerUnit: 1250 },
  { minQty: 12, pricePerUnit: 1150 },
]

// Acuity (Allsteel) · task chair · base price $752 · high volume potential
const ACUITY_VARIANTS: ProductVariantData = {
  finishes: COMMON_FINISHES,
  fabricOptions: COMMON_FABRIC_OPTIONS,
  materialTiers: COMMON_MATERIAL_TIERS,
  volumePricing: VOLUME_TIERS_HIGH_VOL,
}
// Calibrate (AIS) · lounge chair · base price $668 · mid volume
const CALIBRATE_VARIANTS: ProductVariantData = {
  finishes: COMMON_FINISHES.slice(0, 3),
  fabricOptions: COMMON_FABRIC_OPTIONS,
  materialTiers: [COMMON_MATERIAL_TIERS[0], COMMON_MATERIAL_TIERS[1]],
  volumePricing: VOLUME_TIERS_MID_VOL,
}
// Axyl (Allermuir) · stacking chair · base price $1363 · low volume / lux
const AXYL_VARIANTS: ProductVariantData = {
  finishes: COMMON_FINISHES,
  fabricOptions: COMMON_FABRIC_OPTIONS.filter((f) => f.id !== 'fabric-recycled'),
  materialTiers: COMMON_MATERIAL_TIERS,
  volumePricing: VOLUME_TIERS_LUX,
}

// IDs naked Y prefixed (unifiedProducts hace `${manufacturer}__${id}`) ·
// Diego reportó que el tab Variants & Materials estaba disabled en todos los
// modales porque los IDs no matcheaban con los del data source. Ahora mapeamos
// ambas variantes. Extiendo además a más productos populares para tener
// variants en muchos cards (no solo 3).
export const PRODUCT_VARIANTS: Record<string, ProductVariantData> = {
  acuity: ACUITY_VARIANTS,
  'allsteel__acuity': ACUITY_VARIANTS,
  calibrate: CALIBRATE_VARIANTS,
  'ais__calibrate': CALIBRATE_VARIANTS,
  axyl: AXYL_VARIANTS,
  'allermuir__axyl': AXYL_VARIANTS,
  // Default fallback de variants para cualquier product · genérico standard
  // para que el tab Variants nunca aparezca disabled (cumple Diego ask).
  'famiglia': { fabricOptions: COMMON_FABRIC_OPTIONS, materialTiers: COMMON_MATERIAL_TIERS },
  'allermuir__famiglia': { fabricOptions: COMMON_FABRIC_OPTIONS, materialTiers: COMMON_MATERIAL_TIERS },
  'bastille': { fabricOptions: COMMON_FABRIC_OPTIONS, finishes: COMMON_FINISHES },
  'allermuir__bastille': { fabricOptions: COMMON_FABRIC_OPTIONS, finishes: COMMON_FINISHES },
  'kite-sofa': { fabricOptions: COMMON_FABRIC_OPTIONS, materialTiers: COMMON_MATERIAL_TIERS, volumePricing: VOLUME_TIERS_MID_VOL },
  'allermuir__kite-sofa': { fabricOptions: COMMON_FABRIC_OPTIONS, materialTiers: COMMON_MATERIAL_TIERS, volumePricing: VOLUME_TIERS_MID_VOL },
  'hive-ottoman': { fabricOptions: COMMON_FABRIC_OPTIONS.slice(0, 3) },
  'allermuir__hive-ottoman': { fabricOptions: COMMON_FABRIC_OPTIONS.slice(0, 3) },
}

// Fallback global · si product.id no está en PRODUCT_VARIANTS, devolvemos
// variants standard mínimos (fabric + materials genéricos) para que el tab
// siempre tenga algo que mostrar. Útil para los ~30 productos del catálogo
// que no necesitan variants curados.
const FALLBACK_VARIANTS: ProductVariantData = {
  fabricOptions: COMMON_FABRIC_OPTIONS.slice(0, 3),
  materialTiers: [COMMON_MATERIAL_TIERS[0], COMMON_MATERIAL_TIERS[1]],
}

/**
 * Resuelve variants para un product · merge del Product.* fields con la mock data.
 * El Product wins si tiene los campos seteados (override · útil para tests/futuro).
 */
export function getProductVariants(p: {
  id: string
  finishes?: Finish[]
  fabricOptions?: FabricOption[]
  volumePricing?: VolumeTier[]
  materialTiers?: MaterialTier[]
}): ProductVariantData {
  const mock = PRODUCT_VARIANTS[p.id] ?? FALLBACK_VARIANTS
  return {
    finishes: p.finishes ?? mock.finishes,
    fabricOptions: p.fabricOptions ?? mock.fabricOptions,
    volumePricing: p.volumePricing ?? mock.volumePricing,
    materialTiers: p.materialTiers ?? mock.materialTiers,
  }
}
