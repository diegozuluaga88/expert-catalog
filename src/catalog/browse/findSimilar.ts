// Find Similar (2026-08-28)
// ─────────────────────────
// SOW v5 §9.1, scope confirmado por Jeff: "cada página de detalle de
// producto debe soportar una acción Find Similar, usando forma visual,
// tipo de producto, taxonomía, dimensiones, materiales, features,
// aplicación y texto del fabricante — no solo imágenes casi duplicadas."
//
// Es la misma capacidad que la búsqueda por imagen, aplicada desde
// dentro de un producto. `VisualSearchModal` cubre la otra mitad.
//
// ── Qué está implementado y qué no, y por qué
//
// De las ocho señales que nombra el SOW, el catálogo sembrado solo
// respalda cuatro. Las otras cuatro **no se simulan**: un match que
// dice "forma visual similar" sin un embedding detrás es una mentira
// que además no se puede auditar. Se declaran como no indexadas y el
// consumidor las muestra (ver SIGNALS_NOT_INDEXED).
//
//   ✅ tipo de producto y taxonomía  · Category, vía alias
//   ✅ features/specs                · claves compartidas con igual valor
//   ✅ materiales                    · colorways y acabados compartidos
//   ✅ texto del fabricante          · solapamiento de términos
//   ⬜ forma visual                  · necesita el pipeline de imagen
//   ⬜ dimensiones                   · campo vacío en todo el catálogo
//   ⬜ aplicación                    · no hay taxonomía de aplicación
//   ⬜ tags                          · los del seed son sintéticos
//      (`unifiedProducts.ts` los genera por hash: "Quick Ship",
//      "Best Seller"). Usarlos como razón de match sería inventar.
//
// ── Guardrail §9.2
// "Un producto descontinuado no debe rankear sobre uno activo." Se
// aplica como orden lexicográfico (activo primero, después score), no
// como penalización de puntaje — una penalización se puede remontar
// con suficiente similitud, el orden por tupla no.
//
// ── Explicabilidad §9.4
// Cada resultado devuelve sus `reasons`. Es el "Why did this match?"
// del workstream de admin, resuelto desde el dato en vez de con copy.

import type { Product, Manufacturer, Category } from '../types'
import { UNIFIED_PRODUCTS, UNIFIED_INDEX } from '../showroom/data/unifiedProducts'
import { matchesCategoryAlias } from '../data/categoryAliases'

/** Señales que el SOW pide y el catálogo todavía no puede respaldar. */
export const SIGNALS_NOT_INDEXED = ['visual shape', 'dimensions', 'application'] as const

export interface SimilarReason {
    /** Etiqueta corta para el chip · ej. "Same product type". */
    label: string
    /** Detalle opcional · ej. "Task Seating" o "3 specs". */
    detail?: string
}

export interface SimilarMatch {
    /** El producto del pool unificado · enriquecido, id prefijado por marca.
     *  Es el que se muestra. */
    product: Product
    /** El mismo producto tal como vive en `manufacturer.categories[].products`,
     *  con id sin prefijo. Es el que se le pasa al detalle, para que navegar a
     *  un similar deje el mismo estado que llegar por browse. */
    rawProduct: Product
    manufacturer: Manufacturer
    category: Category
    score: number
    reasons: SimilarReason[]
    /** true si es de otra marca · el caso que el usuario no descubre navegando. */
    crossBrand: boolean
    discontinued: boolean
}

/* ── Texto del fabricante ────────────────────────────────────────────
   Stoplist corta y específica del dominio: las palabras que aparecen
   en casi toda descripción de mobiliario no distinguen nada, y sin
   quitarlas todo hace match con todo. */
const STOP = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'its', 'has',
    'can', 'all', 'any', 'you', 'your', 'our', 'their', 'more', 'than', 'into', 'out',
    'design', 'designed', 'product', 'products', 'collection', 'series', 'available',
    'offers', 'features', 'featuring', 'provides', 'includes', 'made', 'new',
])

function terms(text: string): Set<string> {
    return new Set(
        text.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 4 && !STOP.has(w)),
    )
}

function intersect<T>(a: Set<T>, b: Set<T>): T[] {
    const out: T[] = []
    for (const v of a) if (b.has(v)) out.push(v)
    return out
}

/** Normaliza un valor de spec para comparar "24.5 in" con "24.5in". */
function normValue(v: string): string {
    return v.toLowerCase().replace(/\s+/g, ' ').trim()
}

/* ── Rareza · lo que comparte todo el catálogo no explica nada ────────
   La primera versión producía matches cuya única razón era
   "1 matching spec (guarantee)" — y la garantía es la misma en todo el
   catálogo. Es exactamente el falso positivo contra el que el SOW pide
   defenderse en el benchmark de queries (§ "diseñadas para exponer
   falsos positivos").
   Se resuelve midiendo, no con una lista negra a mano: un rasgo
   presente en más del 40% de los productos se descarta como señal.
   Se auto-mantiene cuando llegue el catálogo real, donde los rasgos
   universales de hoy pueden dejar de serlo y al revés. */
const COMMON_THRESHOLD = 0.4

function buildFrequency(): { spec: Set<string>; finish: Set<string>; term: Set<string> } {
    const n = Math.max(UNIFIED_PRODUCTS.length, 1)
    const specCount = new Map<string, number>()
    const finishCount = new Map<string, number>()
    const termCount = new Map<string, number>()
    const bump = (map: Map<string, number>, keys: Iterable<string>) => {
        for (const k of new Set(keys)) map.set(k, (map.get(k) ?? 0) + 1)
    }

    for (const p of UNIFIED_PRODUCTS) {
        bump(specCount, Object.entries(p.specs ?? {}).map(([k, v]) => `${k.toLowerCase()}=${normValue(v)}`))
        bump(finishCount, (p.colorways ?? []).map(c => c.name.toLowerCase()))
        bump(termCount, terms(`${p.name} ${p.description ?? ''}`))
    }

    const tooCommon = (map: Map<string, number>) => {
        const out = new Set<string>()
        for (const [k, c] of map) if (c / n > COMMON_THRESHOLD) out.add(k)
        return out
    }
    return { spec: tooCommon(specCount), finish: tooCommon(finishCount), term: tooCommon(termCount) }
}

const COMMON = buildFrequency()

/* ── Pesos ───────────────────────────────────────────────────────────
   El tipo de producto domina a propósito: el SOW advierte contra los
   "falsos positivos" del benchmark (§ de queries), y sin anclar en la
   taxonomía una silla puede parecerse a una mesa por compartir texto
   de acabados. */
const W_TYPE = 50
const W_SPEC = 8       // por spec compartida, tope 4
const W_FINISH = 6     // por acabado/colorway compartido, tope 4
const W_TERM = 5       // por término compartido, tope 4
const W_MATERIAL = 12
const W_CROSS_BRAND = 4  // desempate suave, no señal de similitud

export interface FindSimilarOptions {
    /** Cuántos devolver. Default 6. */
    limit?: number
    /** Score mínimo · debajo de esto no es un match, es ruido. Default 20. */
    minScore?: number
    /** Score mínimo cuando el candidato **no** comparte tipo de producto.
     *  Deliberadamente alto: sin anclaje en la taxonomía, un par de rasgos
     *  compartidos junta cosas que no se parecen. En el seed, una silla
     *  matcheaba con casegoods y con un textil por compartir garantía y
     *  dos palabras. Default 34. */
    minScoreWithoutType?: number
}

/**
 * Productos similares a `source`, de todo el catálogo y todas las marcas.
 * Devuelve el porqué de cada match, no solo el orden.
 */
export function findSimilar(
    source: Product,
    sourceCategory: Category,
    sourceManufacturer: Manufacturer,
    { limit = 6, minScore = 20, minScoreWithoutType = 34 }: FindSimilarOptions = {},
): SimilarMatch[] {
    const srcTerms = new Set([...terms(`${source.name} ${source.description ?? ''}`)].filter(t => !COMMON.term.has(t)))
    const srcSpecSet = new Set(
        Object.entries(source.specs ?? {})
            .map(([k, v]) => `${k.toLowerCase()}=${normValue(v)}`)
            .filter(s => !COMMON.spec.has(s)),
    )
    const srcFinishes = new Set(
        (source.colorways ?? []).map(c => c.name.toLowerCase()).filter(f => !COMMON.finish.has(f)),
    )
    const srcMaterial = (source.material ?? source.upholstery ?? '').toLowerCase()

    // El id del producto en el pool unificado lleva prefijo de marca.
    const sourceUnifiedId = `${sourceManufacturer.id}__${source.id}`

    const matches: SimilarMatch[] = []

    for (const candidate of UNIFIED_PRODUCTS) {
        if (candidate.id === sourceUnifiedId) continue
        const ctx = UNIFIED_INDEX[candidate.id]
        if (!ctx) continue

        const reasons: SimilarReason[] = []
        let score = 0

        // 1 · Tipo de producto y taxonomía.
        const sameType =
            ctx.category.name === sourceCategory.name ||
            matchesCategoryAlias([ctx.category.name], sourceCategory.name)
        if (sameType) {
            score += W_TYPE
            reasons.push({ label: 'Same product type', detail: ctx.category.name })
        }

        // 2 · Specs compartidas con el mismo valor.
        const candSpecs = Object.entries(candidate.specs ?? {}).map(([k, v]) => `${k.toLowerCase()}=${normValue(v)}`)
        const sharedSpecs = candSpecs.filter(s => srcSpecSet.has(s))
        if (sharedSpecs.length > 0) {
            const n = Math.min(sharedSpecs.length, 4)
            score += n * W_SPEC
            reasons.push({
                label: sharedSpecs.length === 1 ? '1 matching spec' : `${sharedSpecs.length} matching specs`,
                detail: sharedSpecs.slice(0, 2).map(s => s.split('=')[0]).join(', '),
            })
        }

        // 3 · Materiales · acabados compartidos.
        const sharedFinishes = intersect(srcFinishes, new Set((candidate.colorways ?? []).map(c => c.name.toLowerCase())))
        if (sharedFinishes.length > 0) {
            score += Math.min(sharedFinishes.length, 4) * W_FINISH
            reasons.push({
                label: sharedFinishes.length === 1 ? '1 shared finish' : `${sharedFinishes.length} shared finishes`,
                detail: sharedFinishes.slice(0, 2).join(', '),
            })
        }

        const candMaterial = (candidate.material ?? candidate.upholstery ?? '').toLowerCase()
        if (srcMaterial && candMaterial && srcMaterial === candMaterial) {
            score += W_MATERIAL
            reasons.push({ label: 'Same material', detail: candidate.material ?? candidate.upholstery })
        }

        // 4 · Texto del fabricante.
        const sharedTerms = intersect(srcTerms, terms(`${candidate.name} ${candidate.description ?? ''}`))
        if (sharedTerms.length > 0) {
            score += Math.min(sharedTerms.length, 4) * W_TERM
            reasons.push({
                label: 'Manufacturer text',
                detail: sharedTerms.slice(0, 3).map(t => `“${t}”`).join(', '),
            })
        }

        const crossBrand = ctx.manufacturer.id !== sourceManufacturer.id
        if (crossBrand) score += W_CROSS_BRAND

        if (score < (sameType ? minScore : minScoreWithoutType)) continue

        // El original de la jerarquía · sin él, navegar a un similar dejaría
        // el detalle con un id prefijado que no existe en `category.products`.
        const raw = ctx.category.products.find(p => `${ctx.manufacturer.id}__${p.id}` === candidate.id)
        if (!raw) continue

        matches.push({
            product: candidate,
            rawProduct: raw,
            manufacturer: ctx.manufacturer,
            category: ctx.category,
            score,
            reasons,
            crossBrand,
            discontinued: candidate.itemStatus === 'discontinued',
        })
    }

    // Guardrail §9.2 · activo antes que descontinuado, siempre.
    matches.sort((a, b) => {
        if (a.discontinued !== b.discontinued) return a.discontinued ? 1 : -1
        return b.score - a.score
    })

    return matches.slice(0, limit)
}
