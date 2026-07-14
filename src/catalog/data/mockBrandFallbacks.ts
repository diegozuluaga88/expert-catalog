// MRL Detail post-D6 (2026-07-10) · Mock fallbacks para manufacturers
// sin datos de detalle (categories, heroImage, brandResources, contacts,
// links) + padding de productos por categoría. Diego ask · TODAS las brands
// de la demo deben simular tener ficha técnica completa + listas de
// productos densas · consistencia visual.
//
// Los fallbacks son DETERMINÍSTICOS · seed = manufacturer.id via hash
// simple. Un brand X siempre recibe el mismo set de categorías/contacts/
// imágenes/productos entre renders (no aleatorio en runtime).
//
// Solo se aplican cuando el campo real está vacío/undefined · los brands
// populados (allermuir, allsteel, corva, novara) mantienen su data real
// y solo reciben padding de productos si sus categorías son cortas.

import type { Manufacturer, Category, Product, BrandResource, Contact, Colorway } from '../types'

/* ═══════════════════════════════════════════════════════════════════════
   Pools de assets · imágenes reutilizables de Unsplash, ya usadas en el
   proyecto (probadas visualmente). Cada pool tiene 6-8 items para dar
   variedad entre brands sin repetir demasiado.
   ═══════════════════════════════════════════════════════════════════════ */

const CATEGORY_POOL: Array<{ name: string; image: string }> = [
    { name: 'Chairs',       image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80' },
    { name: 'Sofas',        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80' },
    { name: 'Tables',       image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=600&q=80' },
    { name: 'Lounge',       image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80' },
    { name: 'Storage',      image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80' },
    { name: 'Workstations', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80' },
    { name: 'Accessories',  image: 'https://images.unsplash.com/photo-1567538096631-e0c55bd6374c?w=600&q=80' },
    { name: 'Task Seating', image: 'https://images.unsplash.com/photo-1596522354195-e84ae3c98731?w=600&q=80' },
]

const HERO_POOL = [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80',
    'https://images.unsplash.com/photo-1567538096631-e0c55bd6374c?w=1200&q=80',
    'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=1200&q=80',
    'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
]

/** Pool de imágenes de productos · reusable para cards de products mock.
 *  Un mix de escenas y planos limpios, cubre chair/table/sofa/space. */
const PRODUCT_IMAGE_POOL = [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
    'https://images.unsplash.com/photo-1596522354195-e84ae3c98731?w=800&q=80',
    'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800&q=80',
    'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80',
    'https://images.unsplash.com/photo-1567538096631-e0c55bd6374c?w=800&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80',
    'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&q=80',
]

/** Nombres de producto · adjetivos/mineralia genéricos, se combinan con
 *  el nombre de la categoría para lecturas naturales ("Vertex Chair", etc). */
const PRODUCT_NAMES = [
    'Vertex', 'Nova', 'Cascade', 'Alto', 'Prism', 'Halo', 'Meridian',
    'Compass', 'Element', 'Grove', 'Anchor', 'Basalt', 'Aria', 'Kite',
    'Onda', 'Pivot', 'Pinnacle', 'Serene', 'Beacon', 'Ridge',
]

const COLORWAY_POOL: Colorway[] = [
    { name: 'Slate',        code: 'SL', hex: '#4b5563' },
    { name: 'Ivory',        code: 'IV', hex: '#f5f0e8' },
    { name: 'Espresso',     code: 'ES', hex: '#3f2a1c' },
    { name: 'Sage',         code: 'SA', hex: '#84a98c' },
    { name: 'Terracotta',   code: 'TR', hex: '#c0532a' },
    { name: 'Midnight',     code: 'MN', hex: '#1e3a5f' },
]

const CONTACT_TITLES = [
    'Territory Sales Manager',
    'A&D Specialist',
    'Regional Account Executive',
    'Product Consultant',
    'Contract Sales Lead',
]

const CONTACT_FIRST = ['Sarah', 'David', 'Emma', 'Michael', 'Olivia', 'Daniel', 'Sophie', 'Alex']
const CONTACT_LAST  = ['Mitchell', 'Chen', 'Reyes', 'Whittaker', 'Kessler', 'Marchetti', 'Brooks', 'Nolan']

/* ═══════════════════════════════════════════════════════════════════════
   Hash determinístico · convierte el id string en un número estable.
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

/** Pick N items sin repetir · para el mismo seed devuelve el mismo set. */
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
   Product generator · determinístico por seed (usa cat.id + index).
   Genera Products completos con todos los campos required del type.
   ═══════════════════════════════════════════════════════════════════════ */

function mockProduct(seed: string, index: number, categoryName: string): Product {
    const productName = pickOne(PRODUCT_NAMES, seed, index)
    const image = pickOne(PRODUCT_IMAGE_POOL, seed, index * 11)
    const image2 = pickOne(PRODUCT_IMAGE_POOL, seed, index * 11 + 4)
    const colorways = pickN(COLORWAY_POOL, seed, 4, index * 13)

    // Categoría legible en la description (case-friendly).
    const catLower = categoryName.toLowerCase()

    return {
        id: `${seed}-p${index}`,
        name: productName,
        description: `${productName} is a contemporary ${catLower.replace(/s$/, '')} designed for versatile commercial spaces. Refined proportions, honest materials, and a wide colorway range make it a flexible choice for open-plan and private environments.`,
        images: [image, image2],
        colorways,
        specs: {
            'COMPOSITION': 'Steel frame with molded polyurethane',
            'GUARANTEE': '10 Years',
            'APPLICATION': `Commercial · ${categoryName}`,
        },
        performance: {
            'FLAMMABILITY': 'BIFMA X5.1',
            'ABRASION': '≥60,000 Martindale cycles',
        },
        cleaning: 'W Clean — mild detergent only.',
        documents: [
            { name: `${productName} Brochure`, type: 'pdf' },
        ],
    }
}

/** Padea una categoría con productos mock hasta llegar a `target` items. */
function padCategoryWithProducts(category: Category, target: number): Category {
    if (category.products.length >= target) return category
    const need = target - category.products.length
    const seed = category.id
    const startIdx = category.products.length
    const extra: Product[] = []
    for (let i = 0; i < need; i++) {
        extra.push(mockProduct(seed, startIdx + i, category.name))
    }
    return { ...category, products: [...category.products, ...extra] }
}

/* ═══════════════════════════════════════════════════════════════════════
   Category generators
   ═══════════════════════════════════════════════════════════════════════ */

/** N categorías mock del pool · determinístico por id. Cada una viene con
 *  su image + un pequeño set de productos mock (populados) para que la
 *  CategoryPage se vea densa al drill-down. */
function mockCategories(m: Manufacturer, count: number): Category[] {
    const items = pickN(CATEGORY_POOL, m.id, count)
    return items.map((item, i) => {
        const catId = `${m.id}-mock-${item.name.toLowerCase().replace(/\s+/g, '-')}`
        const cat: Category = {
            id: catId,
            name: item.name,
            cardImage: item.image,
            products: [],
        }
        // Popular con 4-6 productos mock por categoría.
        const productCount = 4 + ((hash(catId) + i) % 3)
        return padCategoryWithProducts(cat, productCount)
    })
}

function mockBrandResources(m: Manufacturer): BrandResource[] {
    return [
        { name: `${m.name} Website`, href: '#' },
        { name: 'Product Catalog PDF', href: '#' },
        { name: 'Specification Guide', href: '#' },
    ]
}

function mockContacts(m: Manufacturer): Contact[] {
    const first = pickOne(CONTACT_FIRST, m.id)
    const last = pickOne(CONTACT_LAST, m.id, 3)
    const title = pickOne(CONTACT_TITLES, m.id, 5)
    const slug = m.id.replace(/[^a-z0-9]/g, '')
    return [
        {
            name: `${first} ${last}`,
            title,
            email: `${first.toLowerCase()}@${slug}.com`,
        },
    ]
}

function mockLinks(m: Manufacturer): BrandResource[] {
    void m
    return [
        { name: 'Brochures', href: '#' },
        { name: 'Installation Instructions', href: '#' },
        { name: 'Request a Quote', href: '#' },
    ]
}

/* ═══════════════════════════════════════════════════════════════════════
   Main API · enriquece un manufacturer aplicando fallbacks solo donde
   el campo original está vacío. NO muta el original.
   ═══════════════════════════════════════════════════════════════════════ */

const TARGET_CATEGORIES = 5     // objetivo mínimo de cards en el grid
const TARGET_PRODUCTS_PER_CAT = 5 // objetivo mínimo de items en cada CategoryPage

export function enrichManufacturerForDetail(m: Manufacturer): Manufacturer {
    const enriched: Manufacturer = { ...m }

    if (!enriched.heroImage) {
        enriched.heroImage = pickOne(HERO_POOL, m.id)
    }

    // Post-P12 · algunos brands reciben overlay video en el hero (mirror
    // del referente MRL · algunas library entries son video, otras foto).
    // Determinístico · ~1 de cada 3 brands por hash. Solo si el editor
    // no forzó ya un valor.
    if (enriched.heroIsVideo === undefined) {
        const h = hash(m.id)
        if (h % 3 === 0) {
            enriched.heroIsVideo = true
            // Duración pseudo-random entre 00:30 y 03:59.
            const secs = 30 + (h % 210)
            const mm = Math.floor(secs / 60).toString().padStart(2, '0')
            const ss = (secs % 60).toString().padStart(2, '0')
            enriched.heroDuration = `${mm}:${ss}`
        }
    }

    // Categorías · padding hasta TARGET_CATEGORIES con mock, respetando
    // los nombres/imágenes reales del brand cuando existan. Además, cada
    // categoría se padea internamente hasta TARGET_PRODUCTS_PER_CAT
    // productos (permite drill-down denso en CategoryPage).
    const realCats = enriched.categories
    if (realCats.length >= TARGET_CATEGORIES) {
        enriched.categories = realCats.map(c => padCategoryWithProducts(c, TARGET_PRODUCTS_PER_CAT))
    } else {
        // Solo generamos las que faltan · las reales quedan al inicio.
        const need = TARGET_CATEGORIES - realCats.length
        const alreadyNames = new Set(realCats.map(c => c.name.toLowerCase()))
        const padPool = CATEGORY_POOL.filter(p => !alreadyNames.has(p.name.toLowerCase()))
        const extras = pickN(padPool, m.id, need).map((item, i) => {
            const catId = `${m.id}-mock-${item.name.toLowerCase().replace(/\s+/g, '-')}`
            const cat: Category = {
                id: catId,
                name: item.name,
                cardImage: item.image,
                products: [],
            }
            const productCount = 4 + ((hash(catId) + i) % 3)
            return padCategoryWithProducts(cat, productCount)
        })
        // Padear las reales también con productos mock si tienen pocos.
        const realPadded = realCats.map(c => padCategoryWithProducts(c, TARGET_PRODUCTS_PER_CAT))
        enriched.categories = [...realPadded, ...extras]
    }

    // Si venía completamente vacío y por alguna razón el flow anterior no
    // llenó, hacemos un fallback duro (mantener safety).
    if (enriched.categories.length === 0) {
        enriched.categories = mockCategories(m, TARGET_CATEGORIES)
    }

    if (!enriched.brandResources || enriched.brandResources.length === 0) {
        enriched.brandResources = mockBrandResources(m)
    }
    if (!enriched.contacts || enriched.contacts.length === 0) {
        enriched.contacts = mockContacts(m)
    }
    if (!enriched.links || enriched.links.length === 0) {
        enriched.links = mockLinks(m)
    }

    return enriched
}
