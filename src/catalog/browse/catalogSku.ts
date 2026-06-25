// Etapa 6a — mapeo ILUSTRATIVO product → SKU para demostrar la verificación de catálogo
// reutilizando el CatalogVerifyPill + catalogMock que ya existen en expert-hub (src/components/ocr).
// Los productos del browse no traen SKU real, así que se asigna determinísticamente uno de los
// SKUs conocidos del catalogMock (la mayoría "verified"; MFB5P245-D dispara el flujo de
// reemplazo sugerido por IA), para mostrar ambos estados.
//
// Phase 2 Fix #6 — extendido a 2 variantes (manufacturer + internal) per stakeholder consistency.
// Si product.manufacturerSku / product.internalSku están seteados en mock data, se usan.
// Sino, se generan determinísticamente desde el id.

const DEMO_SKUS = [
  'HMBS244-D', // verified
  'MCTNP488-42-D', // verified
  'MST1012-D', // verified
  'PTRX4230-D', // verified
  'MFB5P245-D', // NOT verified → muestra sugerencias de reemplazo
] as const

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

export function skuForProduct(id: string): string {
  return DEMO_SKUS[hashId(id) % DEMO_SKUS.length]
}

/**
 * SKU del fabricante · prefijo basado en brand · 6-7 chars alfanum.
 * Determinístico por id.
 */
export function manufacturerSkuFor(id: string, brand?: string): string {
  const prefix = (brand ?? 'STR').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
  const h = hashId(id)
  const numeric = (h % 9000) + 1000
  const suffix = String.fromCharCode(65 + (h % 26))
  return `${prefix}-${numeric}${suffix}`
}

/**
 * SKU interno del tenant/Strata · prefijo IN- + numeric. Determinístico por id.
 */
export function internalSkuFor(id: string): string {
  const h = hashId(id)
  const numeric = (h % 90000) + 10000
  return `IN-${numeric}`
}

/**
 * Helper que resuelve el SKU manufacturer · usa el del Product si existe, sino lo genera.
 */
export function resolveManufacturerSku(p: { id: string; brand?: string; manufacturerSku?: string }): string {
  return p.manufacturerSku ?? manufacturerSkuFor(p.id, p.brand)
}

/**
 * Helper que resuelve el SKU interno · usa el del Product si existe, sino lo genera.
 */
export function resolveInternalSku(p: { id: string; internalSku?: string }): string {
  return p.internalSku ?? internalSkuFor(p.id)
}

/**
 * Phase 2 Fix #6b — itemStatus consistency.
 * Si el product NO tiene itemStatus, derivamos:
 *  - 'discrepancy' si su catalog asociado (por brand match) está 'Update Avail.'
 *  - hardcoded 'discontinued' para un par de IDs específicos para variety en la demo
 *  - 'active' default
 *
 * Pasamos solo el id+brand+itemStatus para evitar dependencias circulares con types.
 */
import type { ItemStatus } from '../types'
import { CATALOGS } from '../data/catalogs'

const DISCONTINUED_IDS = new Set(['bastille', 'hive-ottoman'])

export function resolveItemStatus(p: { id: string; brand?: string; itemStatus?: ItemStatus }): ItemStatus {
  if (p.itemStatus) return p.itemStatus
  if (DISCONTINUED_IDS.has(p.id)) return 'discontinued'
  if (p.brand) {
    const cat = CATALOGS.find((c) => c.name === p.brand)
    if (cat && cat.status === 'Update Avail.') return 'discrepancy'
  }
  return 'active'
}
