// MRL Product Detail P1 (2026-07-10) · Mock fallbacks para productos sin
// data de Parts/Options. Diego ask · TODOS los productos de la demo deben
// simular tener el tab PARTS + el tab OPTIONS (con subtabs Bases/Frame/Glide)
// mirror del referente myresourcelibrary.com.
//
// Deterministic · seed = product.id via hash. Un producto X siempre recibe
// las mismas parts + options entre renders.
//
// Solo se aplican cuando el campo real está vacío/undefined · si el editor
// popula Parts u Options manualmente, esa data gana.

import type {
  Product,
  ProductPart,
  ProductOptions,
  ProductBaseOption,
  ProductFrameColorOption,
  ProductGlideOption,
} from '../types'

/* ═══════════════════════════════════════════════════════════════════════
   Pools
   ═══════════════════════════════════════════════════════════════════════ */

const PART_SUBLINES = [
  'Coated fabrics available',
  'Sold as individual replacement',
  'Compatible with all bases',
  'Standard finish included',
  'Contract-grade upholstery',
]

const PART_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
  'https://images.unsplash.com/photo-1596522354195-e84ae3c98731?w=400&q=80',
  'https://images.unsplash.com/photo-1567538096631-e0c55bd6374c?w=400&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
]

const BASE_NAMES = [
  'Sled Base — Black',
  'Sled Base — Silver',
  'Cantilever Base — Silver',
  'Cantilever Base — Black',
  'Ottoman Sled Base — Black',
  'Ottoman Sled Base — Silver',
  'Swivel Base — Polished',
  '4-Star Base — Matte',
]

const BASE_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&q=80',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&q=80',
  'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=400&q=80',
  'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=400&q=80',
]

const FRAME_COLORS: Array<{ name: string; hex: string }> = [
  { name: 'Black',         hex: '#0b0b0c' },
  { name: 'Metallic Silver', hex: '#c0c4c8' },
  { name: 'Bronze',        hex: '#6b4a2e' },
  { name: 'White',         hex: '#f5f0e8' },
  { name: 'Slate',         hex: '#4b5563' },
  { name: 'Espresso',      hex: '#3f2a1c' },
]

const GLIDE_NAMES = [
  'G26F/T · Cantilever Glide Felt/Teflon',
  'G26F/T · Sled Glide Felt/Teflon',
  'G18C · Carpet Caster',
  'G22H · Hard Floor Caster',
  'G30S · Silent Glide',
]

const GLIDE_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&q=80',
  'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=400&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80',
]

/* ═══════════════════════════════════════════════════════════════════════
   Hash + pick helpers (idénticos a mockBrandFallbacks · duplicados a
   propósito para mantener el módulo autocontenido).
   ═══════════════════════════════════════════════════════════════════════ */

function hash(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h) + id.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function pickOne<T>(pool: T[], id: string, salt = 0): T {
  return pool[(hash(id) + salt) % pool.length]
}

function pickN<T>(pool: T[], id: string, n: number, salt = 0): T[] {
  const seen = new Set<number>()
  const out: T[] = []
  const base = hash(id) + salt
  for (let i = 0; i < n && seen.size < pool.length; i++) {
    let idx = (base + i * 7) % pool.length
    while (seen.has(idx)) idx = (idx + 1) % pool.length
    seen.add(idx)
    out.push(pool[idx])
  }
  return out
}

/* ═══════════════════════════════════════════════════════════════════════
   Generators
   ═══════════════════════════════════════════════════════════════════════ */

/** 3-4 parts con SKU numérico (mirror del referente MRL · 9411, 9416, etc). */
function mockParts(p: Product): ProductPart[] {
  const h = hash(p.id)
  const count = 3 + (h % 2)
  const out: ProductPart[] = []
  for (let i = 0; i < count; i++) {
    // SKU numérico 4-dígitos derivado del hash del product id · consistente.
    const sku = String(9000 + ((h + i * 37) % 999)).padStart(4, '0')
    out.push({
      sku,
      name: `${sku}`,
      subline: pickOne(PART_SUBLINES, p.id, i * 3),
      image: pickOne(PART_IMAGE_POOL, p.id, i * 5),
    })
  }
  return out
}

function mockBases(p: Product): ProductBaseOption[] {
  return pickN(BASE_NAMES, p.id, 4).map((name, i) => ({
    id: `${p.id}-base-${i}`,
    name,
    image: pickOne(BASE_IMAGE_POOL, p.id, i * 11),
  }))
}

function mockFrameColors(p: Product): ProductFrameColorOption[] {
  return pickN(FRAME_COLORS, p.id, 4).map((c, i) => ({
    id: `${p.id}-frame-${i}`,
    name: c.name,
    hex: c.hex,
  }))
}

function mockGlides(p: Product): ProductGlideOption[] {
  return pickN(GLIDE_NAMES, p.id, 2).map((name, i) => ({
    id: `${p.id}-glide-${i}`,
    name,
    image: pickOne(GLIDE_IMAGE_POOL, p.id, i * 7),
  }))
}

/* ═══════════════════════════════════════════════════════════════════════
   Main API · enriquece un product aplicando fallbacks solo donde el
   campo original está vacío. NO muta el original.
   ═══════════════════════════════════════════════════════════════════════ */

export function enrichProductForDetail(p: Product): Product {
  const enriched: Product = { ...p }

  if (!enriched.parts || enriched.parts.length === 0) {
    enriched.parts = mockParts(p)
  }

  const opts: ProductOptions = { ...(enriched.options ?? {}) }
  if (!opts.bases || opts.bases.length === 0) {
    opts.bases = mockBases(p)
  }
  if (!opts.frameColors || opts.frameColors.length === 0) {
    opts.frameColors = mockFrameColors(p)
  }
  if (!opts.glides || opts.glides.length === 0) {
    opts.glides = mockGlides(p)
  }
  enriched.options = opts

  return enriched
}
