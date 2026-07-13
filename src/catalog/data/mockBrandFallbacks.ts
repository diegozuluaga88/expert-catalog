// MRL Detail post-D6 (2026-07-10) · Mock fallbacks para manufacturers
// sin datos de detalle (categories, heroImage, brandResources, contacts,
// links). Diego ask · TODAS las brands de la demo deben simular tener
// ficha técnica completa · consistencia visual.
//
// Los fallbacks son DETERMINÍSTICOS · seed = manufacturer.id via hash
// simple. Un brand X siempre recibe el mismo set de categorías/contacts/
// imágenes entre renders (no aleatorio en runtime).
//
// Solo se aplican cuando el campo real está vacío/undefined · los brands
// populados (allermuir, allsteel, corva, novara) mantienen su data.

import type { Manufacturer, Category, BrandResource, Contact } from '../types'

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
        h |= 0 // int32
    }
    return Math.abs(h)
}

function pickOne<T>(pool: T[], id: string, salt = 0): T {
    return pool[(hash(id) + salt) % pool.length]
}

/* ═══════════════════════════════════════════════════════════════════════
   Generators
   ═══════════════════════════════════════════════════════════════════════ */

/** 3-4 categorías mock del pool · determinístico por id. */
function mockCategories(m: Manufacturer): Category[] {
    const h = hash(m.id)
    const count = 3 + (h % 2) // 3 o 4
    const seen = new Set<number>()
    const out: Category[] = []
    for (let i = 0; i < count; i++) {
        // Toma items del pool sin repetir para el mismo brand.
        let idx = (h + i * 7) % CATEGORY_POOL.length
        while (seen.has(idx)) idx = (idx + 1) % CATEGORY_POOL.length
        seen.add(idx)
        const item = CATEGORY_POOL[idx]
        out.push({
            id: `${m.id}-mock-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: item.name,
            cardImage: item.image,
            products: [],
        })
    }
    return out
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
    // Solo se genera si el brand no tiene ni resources ni links · sino
    // sería redundante. En este helper devolvemos array vacío por defecto
    // y decidimos en enrichManufacturer si aplicar.
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

export function enrichManufacturerForDetail(m: Manufacturer): Manufacturer {
    const enriched: Manufacturer = { ...m }

    if (!enriched.heroImage) {
        enriched.heroImage = pickOne(HERO_POOL, m.id)
    }
    if (enriched.categories.length === 0) {
        enriched.categories = mockCategories(m)
    }
    if (!enriched.brandResources || enriched.brandResources.length === 0) {
        enriched.brandResources = mockBrandResources(m)
    }
    if (!enriched.contacts || enriched.contacts.length === 0) {
        enriched.contacts = mockContacts(m)
    }
    // Links: si no vienen Y las Resources también fueron generadas, agregamos
    // Links para dar más "chicha" a la ficha técnica.
    if (!enriched.links || enriched.links.length === 0) {
        enriched.links = mockLinks(m)
    }

    return enriched
}
