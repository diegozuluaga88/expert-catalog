// Modelo de atributos de tres estados · Yes / No / Unknown (2026-08-28)
// ─────────────────────────────────────────────────────────────────────
// SOW v5 §9.3, scope confirmado por Jeff:
//
//   "for attributes like 24/7 use, petite/plus-size sizing, weight
//    capacity, or certifications, the system must distinguish
//    Yes / No / Unknown — and must not infer these from an image alone
//    when evidence is insufficient. A chair can be clearly Task Seating
//    with no headrest from its photo, while its 24/7 rating stays
//    Unknown until manufacturer data confirms it."
//
// ── La regla que este archivo existe para hacer cumplir
//
// **Ausencia de dato es `unknown`, nunca `no`.** Es el error que comete
// la mayoría de las interfaces: una casilla vacía se lee como "no lo
// tiene", cuando en realidad significa "no sabemos". En un catálogo de
// especificación esa diferencia decide compras — un hospital que
// necesita 24/7 no puede descartar una silla porque el fabricante no
// cargó el campo.
//
// Un `no` solo se emite cuando **el fabricante lo declara**, nunca por
// deducción.
//
// ── Jerarquía de fuentes (§9.3)
//
// El SOW ordena la confianza de las fuentes, y ese orden se respeta acá:
//   · taxonomía humana de MRL  → autoritativa para tipo/categoría
//   · spec del fabricante      → autoritativa para dimensiones, ratings
//                                 y materiales, cuando está vigente
//   · páginas del fabricante   → útiles para descripción, necesitan
//                                 normalización
//   · imágenes                 → **solo forma visible.** Nunca para
//                                 inferir atributos ocultos
//
// ── Sobre el dato de este prototipo
//
// Los atributos se derivan de `specs` y `performance` reales del seed,
// que sí traen GREENGUARD, BIFMA, ACT CERTIFICATIONS, FLAMMABILITY y
// ANTIMICROBIAL. Lo que el seed no trae —24/7, capacidad de peso,
// tallaje— queda en `unknown` y **se muestra igual**, porque el punto
// del patrón es que el hueco sea visible en vez de invisible.

import type { Product } from '../types'

export type AttributeState = 'yes' | 'no' | 'unknown'

/** Procedencia de la clasificación · alimenta el attribute evidence
 *  view del §9.4 ("was this from human review, manufacturer content,
 *  image analysis, or legacy metadata?"). */
export type EvidenceSource =
    | 'manufacturer-spec'
    | 'manufacturer-document'
    | 'human-review'
    | 'image-analysis'
    | 'legacy-metadata'

export const EVIDENCE_LABEL: Record<EvidenceSource, string> = {
    'manufacturer-spec': 'Manufacturer spec',
    'manufacturer-document': 'Manufacturer document',
    'human-review': 'MRL human review',
    'image-analysis': 'Image analysis',
    'legacy-metadata': 'Legacy metadata',
}

export interface VerifiedAttribute {
    id: string
    label: string
    state: AttributeState
    /** Ausente cuando `state === 'unknown'` · no hay evidencia que citar. */
    source?: EvidenceSource
    /** El valor tal como lo declara el fabricante, si lo hay. */
    value?: string
    /** Qué haría falta para resolverlo · solo en `unknown`. */
    missing?: string
}

/* ── Atributos que no son visibles en una fotografía ──────────────────
   El SOW es explícito: las imágenes "indicate visible form but must not
   be used to infer hidden attributes". Un rating 24/7, una capacidad de
   peso o una certificación no se ven en una foto.

   Hoy no hay clasificación por imagen en el prototipo, así que esta
   guardia es preventiva — existe para que cuando llegue, la regla ya
   esté en el código y no dependa de que alguien la recuerde. */
const NOT_VISIBLE_IN_A_PHOTO = new Set([
    '247-use',
    'weight-capacity',
    'sizing',
    'greenguard',
    'bifma',
    'act',
    'flammability',
    'antimicrobial',
])

/** Aplica la regla del §9.3 · una fuente de imagen no puede sostener un
 *  atributo oculto. Si es lo único que hay, el estado cae a `unknown`. */
export function enforceEvidenceRule(attr: VerifiedAttribute): VerifiedAttribute {
    if (attr.source === 'image-analysis' && NOT_VISIBLE_IN_A_PHOTO.has(attr.id)) {
        return {
            ...attr,
            state: 'unknown',
            source: undefined,
            value: undefined,
            missing: 'A photo can show shape, not this. Needs manufacturer data.',
        }
    }
    return attr
}

/* ── Definición de los atributos de decisión ───────────────────────── */

interface AttributeSpec {
    id: string
    label: string
    /** Claves de `specs`/`performance` que lo respaldan, en mayúsculas. */
    keys: string[]
    /** Qué haría falta si no hay dato. */
    missing: string
}

const DECISION_ATTRIBUTES: AttributeSpec[] = [
    // Los cuatro que el SOW nombra explícitamente.
    {
        id: '247-use',
        label: '24/7 use',
        keys: ['24/7', '24/7 USE', 'INTENSIVE USE'],
        missing: 'Manufacturer has not published a 24/7 rating',
    },
    {
        id: 'weight-capacity',
        label: 'Weight capacity',
        keys: ['WEIGHT CAPACITY', 'CAPACITY'],
        missing: 'Not in the manufacturer spec sheet',
    },
    {
        id: 'sizing',
        label: 'Petite / plus-size sizing',
        keys: ['SIZING', 'PETITE', 'PLUS SIZE'],
        missing: 'No sizing range published',
    },
    // Certificaciones · el seed sí las trae para varios productos.
    {
        id: 'greenguard',
        label: 'GREENGUARD',
        keys: ['GREENGUARD'],
        missing: 'No GREENGUARD data on file',
    },
    {
        id: 'bifma',
        label: 'BIFMA',
        keys: ['BIFMA'],
        missing: 'No BIFMA compliance data on file',
    },
    {
        id: 'act',
        label: 'ACT certifications',
        keys: ['ACT CERTIFICATIONS', 'ACT'],
        missing: 'No ACT certification data on file',
    },
    {
        id: 'flammability',
        label: 'Flammability tested',
        keys: ['FLAMMABILITY'],
        missing: 'No flammability test on file',
    },
    {
        id: 'antimicrobial',
        label: 'Antimicrobial',
        keys: ['ANTIMICROBIAL'],
        missing: 'Not stated by the manufacturer',
    },
]

/** Valores que el fabricante usa para negar explícitamente. Solo estos
 *  producen un `no` — cualquier otra cosa que no exista es `unknown`. */
const EXPLICIT_NO = /^(no|none|n\/a|not applicable|not certified|not rated)$/i

function findValue(product: Product, keys: string[]): string | undefined {
    const pools = [product.specs ?? {}, product.performance ?? {}]
    for (const pool of pools) {
        for (const [k, v] of Object.entries(pool)) {
            const norm = k.trim().toUpperCase()
            if (keys.some(key => norm === key || norm.startsWith(key + ' '))) return v
        }
    }
    return undefined
}

/** ¿Hay un documento del fabricante que respalde este atributo? Un
 *  certificado adjunto es evidencia más fuerte que una línea de spec. */
function findDocument(product: Product, label: string): boolean {
    const needle = label.split(' ')[0].toLowerCase()
    return (product.documents ?? []).some(d => d.name.toLowerCase().includes(needle))
}

/**
 * Los atributos de decisión de un producto, resueltos a tres estados.
 *
 * Devuelve **todos** los atributos, incluidos los `unknown`. Ocultar los
 * que no tienen dato es exactamente el comportamiento que el §9.3
 * prohíbe: un hueco invisible se lee como "no".
 */
export function verifiedAttributes(product: Product): VerifiedAttribute[] {
    return DECISION_ATTRIBUTES.map(spec => {
        const value = findValue(product, spec.keys)

        if (value === undefined) {
            return {
                id: spec.id,
                label: spec.label,
                state: 'unknown' as const,
                missing: spec.missing,
            }
        }

        const declaredNo = EXPLICIT_NO.test(value.trim())
        const hasDoc = findDocument(product, spec.label)

        return enforceEvidenceRule({
            id: spec.id,
            label: spec.label,
            state: declaredNo ? ('no' as const) : ('yes' as const),
            source: hasDoc ? 'manufacturer-document' : 'manufacturer-spec',
            value: declaredNo ? undefined : value,
        })
    })
}

/** Resumen para cabeceras y tarjetas · cuántos de cada estado. */
export function attributeSummary(attrs: VerifiedAttribute[]) {
    return {
        yes: attrs.filter(a => a.state === 'yes').length,
        no: attrs.filter(a => a.state === 'no').length,
        unknown: attrs.filter(a => a.state === 'unknown').length,
        total: attrs.length,
    }
}
