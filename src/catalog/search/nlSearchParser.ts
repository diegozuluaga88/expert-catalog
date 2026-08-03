// F50 · Etapa 9 (P1 search · 9.b) · v2 · parser NL básico de la query
// del search. Sin LLM ni backend · regex-side · extrae filtros
// estructurados de una query en lenguaje natural.
//
// Ejemplos:
//   "chairs under $500"           → { category: 'Chairs', maxPrice: 500 }
//   "quickship sofas above $1000" → { category: 'Sofas', tags: ['quickship'], minPrice: 1000 }
//   "tables in stock lead 4 wk"   → { category: 'Tables', tags: ['in-stock'], maxLeadWeeks: 4 }
//
// Los "understood chips" que se muestran en la UI del SearchCommandPalette
// permiten al user rechazar la interpretación (deja la query como plain
// text search) o aceptarla (aplica filtros al ShowroomPageV2).
//
// Cuando exista LLM real, este parser se convierte en el fallback local
// cuando el LLM no está disponible.

export interface ParsedQuery {
    /** Texto plano de búsqueda con los tokens estructurados removidos. */
    freeText: string
    category?: string
    tags: string[]
    minPrice?: number
    maxPrice?: number
    maxLeadWeeks?: number
    /** Chips human-readable para mostrar en la UI · "Chairs", "under $500", etc. */
    understood: string[]
}

// Lista de categorías conocidas (case-insensitive · matching por singular/plural).
const CATEGORY_MATCHERS: Array<[string, RegExp]> = [
    ['Chairs', /\bchairs?\b/i],
    ['Sofas', /\bsofas?\b|\bcouches?\b/i],
    ['Tables', /\btables?\b|\bdesks?\b/i],
    ['Storage', /\bstorage\b|\bcabinets?\b|\bshelves?\b|\bshelving\b/i],
    ['Lighting', /\blighting\b|\blamps?\b|\bfixtures?\b/i],
    ['Accessories', /\baccessor(y|ies)\b/i],
    ['Fabric', /\bfabrics?\b|\btextiles?\b/i],
    ['Wood', /\bwood\b|\btimber\b/i],
    ['Metal', /\bmetal\b|\bsteel\b|\baluminum\b/i],
]

// Tags conocidos con sinónimos.
const TAG_MATCHERS: Array<[string, RegExp]> = [
    ['quickship', /\bquick\s*ship\b|\bquickship\b|\bqs\b/i],
    ['in-stock', /\bin\s*stock\b/i],
    ['new', /\bnew\b/i],
    ['best-seller', /\bbest\s*sellers?\b/i],
    ['gsa', /\bgsa\b/i],
    ['sustainable', /\bsustainable\b|\beco\b|\bgreen\b/i],
]

export function parseNaturalQuery(query: string): ParsedQuery {
    let remaining = query
    const understood: string[] = []
    const tags: string[] = []
    let category: string | undefined
    let minPrice: number | undefined
    let maxPrice: number | undefined
    let maxLeadWeeks: number | undefined

    // Category · primer match gana.
    for (const [label, rx] of CATEGORY_MATCHERS) {
        if (rx.test(remaining)) {
            category = label
            understood.push(label)
            remaining = remaining.replace(rx, '').trim()
            break
        }
    }

    // Tags · todos los matches.
    for (const [tag, rx] of TAG_MATCHERS) {
        if (rx.test(remaining)) {
            tags.push(tag)
            understood.push(tag.replace(/-/g, ' '))
            remaining = remaining.replace(rx, '').trim()
        }
    }

    // Price · patterns:
    //   under $500 / below $500 / less than $500 / < $500 / <$500
    const underRx = /(under|below|less\s+than|<\s*\$?|<=)\s*\$?\s*(\d{1,6})/i
    const underMatch = remaining.match(underRx)
    if (underMatch) {
        maxPrice = parseInt(underMatch[2], 10)
        understood.push(`under $${maxPrice}`)
        remaining = remaining.replace(underRx, '').trim()
    }
    //   above $500 / over $500 / more than $500 / > $500 / >$500
    const aboveRx = /(above|over|more\s+than|>\s*\$?|>=)\s*\$?\s*(\d{1,6})/i
    const aboveMatch = remaining.match(aboveRx)
    if (aboveMatch) {
        minPrice = parseInt(aboveMatch[2], 10)
        understood.push(`over $${minPrice}`)
        remaining = remaining.replace(aboveRx, '').trim()
    }
    //   between $500 and $1000
    const betweenRx = /between\s+\$?\s*(\d{1,6})\s+(and|-)\s+\$?\s*(\d{1,6})/i
    const betweenMatch = remaining.match(betweenRx)
    if (betweenMatch) {
        minPrice = parseInt(betweenMatch[1], 10)
        maxPrice = parseInt(betweenMatch[3], 10)
        understood.push(`$${minPrice}–$${maxPrice}`)
        remaining = remaining.replace(betweenRx, '').trim()
    }

    // Lead time · patterns:
    //   lead 4 wk / 4 week lead / lead time 4 weeks / lead <= 4wk
    const leadRx = /lead(?:\s*time)?\s*(?:<=|under|less\s+than|:)?\s*(\d{1,3})\s*(?:w|wk|weeks?)\b/i
    const leadMatch = remaining.match(leadRx)
    if (leadMatch) {
        maxLeadWeeks = parseInt(leadMatch[1], 10)
        understood.push(`lead ≤ ${maxLeadWeeks}wk`)
        remaining = remaining.replace(leadRx, '').trim()
    } else {
        // "4 week lead" / "4wk lead"
        const leadRxB = /(\d{1,3})\s*(?:w|wk|weeks?)\s*lead/i
        const leadMatchB = remaining.match(leadRxB)
        if (leadMatchB) {
            maxLeadWeeks = parseInt(leadMatchB[1], 10)
            understood.push(`lead ≤ ${maxLeadWeeks}wk`)
            remaining = remaining.replace(leadRxB, '').trim()
        }
    }

    // Cleanup del freetext residual.
    remaining = remaining
        .replace(/\s{2,}/g, ' ')
        .replace(/^[\s,;.]+|[\s,;.]+$/g, '')
        .trim()

    return {
        freeText: remaining,
        category,
        tags,
        minPrice,
        maxPrice,
        maxLeadWeeks,
        understood,
    }
}

/** Devuelve true si el parser extrajo al menos un token estructurado. */
export function hasStructuredHints(parsed: ParsedQuery): boolean {
    return !!(
        parsed.category ||
        parsed.tags.length > 0 ||
        parsed.minPrice !== undefined ||
        parsed.maxPrice !== undefined ||
        parsed.maxLeadWeeks !== undefined
    )
}
