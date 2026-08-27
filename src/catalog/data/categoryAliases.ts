// MRL · fix filtro de categorías (2026-08-10)
//
// PROBLEMA · el sidebar renderiza MOCK_PRODUCT_CATEGORIES / MOCK_MATERIAL_
// CATEGORIES (nombres genéricos calcados del referente myresourcelibrary.com,
// con counts inflados para dar sensación de biblioteca a escala), pero el
// filtro de LibraryPage comparaba ese label contra `manufacturer.categories[]
// .name`, que en el seed son nombres de LÍNEA DE PRODUCTO o de COLECCIÓN
// TEXTIL (`Chairs`, `Axyl`, `Seating & Collaboration`, `Main Line Flax`…).
// Solape medido: 0 de 24 en Products · 2 de 6 en Materials. Click en
// "Seating" (11397) dejaba el shelf vacío.
//
// SOLUCIÓN · se conserva la lista mock (es lo que da el look del referente)
// y se mapea cada categoría genérica a los nombres reales que representa.
// El seed y el tipo `Category` quedan intactos.
//
// AL AGREGAR SEED NUEVO · si un manufacturer nuevo trae categorías que caen
// bajo una genérica existente, agregar su nombre al array de abajo. Ojo con
// los guiones largos de Camira (`A–G`, `H–M`, `N–T` usan EN DASH U+2013, no
// hyphen): un carácter equivocado rompe el match en silencio, sin error de
// compilación. Al tocar este mapa, verificar que cada string exista como
// `Category.name` en `manufacturers.ts`.

/** Categoría genérica del sidebar → nombres reales de `Category.name` en el
 *  seed que le corresponden. Una categoría sin entrada acá cae al match
 *  exacto (comportamiento anterior), que es lo correcto para las genéricas
 *  que todavía no tienen ningún manufacturer detrás. */
export const CATEGORY_ALIASES: Record<string, string[]> = {
    /* ── Products ─────────────────────────────────────────────────────── */

    // Allermuir (Chairs·Axyl·Bastille·Famiglia·Sofas·Kite Sofa·Ottomans &
    // Benches·Hive Ottoman) + Allsteel (Seating & Collaboration·Acuity) +
    // Corva (Lounge·Side Chairs·Benches·Ottomans) + Novara (Task·Executive·
    // Stools·Lounge). Es la genérica con más respaldo real del seed.
    Seating: [
        'Chairs', 'Axyl', 'Bastille', 'Famiglia', 'Sofas', 'Kite Sofa',
        'Ottomans & Benches', 'Hive Ottoman', 'Seating & Collaboration',
        'Acuity', 'Lounge', 'Side Chairs', 'Benches', 'Ottomans',
        'Task', 'Executive', 'Stools',
    ],

    // AIS · Calibrate es su línea de casegoods.
    Casegoods: ['Systems Casegoods', 'Calibrate'],

    // Allsteel · storage de sistemas y la línea Essence.
    Storage: ['Systems & Storage', 'Essence Storage'],

    // Sistemas propiamente dichos · AIS + Allsteel.
    'Systems Furniture': ['Systems Casegoods', 'Systems & Storage', 'Calibrate'],

    // Novara · task y executive son las sillas ergonómicas del seed.
    Ergonomic: ['Task', 'Executive'],

    /* ── Materials ────────────────────────────────────────────────────── */

    // Camira Fabrics · HBF · Luum · Mayer · Pallas. Colecciones de tapicería.
    Upholstery: [
        'Upholstery', 'Main Line Flax', 'Rime', 'No.1 Upholstery',
        'Canter', 'Silverguard', 'Motif', 'Tessera', 'Cipher',
    ],

    // Paneles y wrapped wall · Luum · Mayer · Pallas.
    Panel: ['Panel', 'Panels', 'No.1 Panel & Wrapped Wall', 'Connect'],

    // Camira — Acoustics · todas sus colecciones son acústicas (los rangos
    // A–G / H–M / N–T son agrupaciones alfabéticas de su catálogo).
    Acoustic: ['A–G', 'Blazer', 'Era', 'H–M', 'Herald', 'N–T', 'Nova'],

    // Pallas.
    Cubicle: ['Cubicle & Drapery'],
    Drapery: ['Cubicle & Drapery', 'Sheer Delight'],

    // Luum · "Wrapped Wall" es el producto de revestimiento del seed.
    Wallcovering: ['No.1 Panel & Wrapped Wall'],
}

/**
 * ¿El manufacturer pertenece a la categoría genérica seleccionada?
 *
 * @param categoryNames  `manufacturer.categories.map(c => c.name)`
 * @param selected       label de la categoría clickeada en el sidebar
 *
 * Sin entrada en CATEGORY_ALIASES cae al match exacto, que preserva el
 * comportamiento previo para las genéricas sin respaldo en el seed.
 */
export function matchesCategoryAlias(categoryNames: string[], selected: string): boolean {
    const aliases = CATEGORY_ALIASES[selected]
    if (!aliases) return categoryNames.includes(selected)
    return categoryNames.some(n => n === selected || aliases.includes(n))
}

/** Genéricas que hoy tienen al menos un manufacturer detrás · útil para
 *  decidir qué categorías usar en un guion de demo. */
export const BACKED_CATEGORIES = Object.keys(CATEGORY_ALIASES)
