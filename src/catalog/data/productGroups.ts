// Fase 1 · Sections + ProductTypes + ProductGroups + product stubs (2026-07-06).
// Seed data alineado con el silver schema de Notion (Strata Product Data
// Management) · replica la jerarquía Catalogue → Section → ProductGroup →
// ProductItem con codes Steelcase-style (CH15, TB04, AL13) para que la demo
// se sienta como un catálogo B2B real.
//
// Los ProductGroups referencian stubs de productos definidos aquí mismo ·
// mínimos (id, nombre, precio estimado, dimensiones, notas de uso) para
// que los bundles de Space Type Settings puedan renderizarse sin depender
// del catálogo de brands (Allermuir/Allsteel/AIS) que ya existe.

import type { Section, ProductType, ProductGroup } from '../types'

/* ═══════════════════════════════════════════════════════════════════════
   Sections · 6 capítulos del catálogo
   ═══════════════════════════════════════════════════════════════════════ */

export const SECTIONS: Section[] = [
    { id: 'sec-ancillary', name: 'Ancillary', slug: 'ancillary', order: 1 },
    { id: 'sec-casegoods', name: 'Casegoods', slug: 'casegoods', order: 2 },
    { id: 'sec-seating', name: 'Seating', slug: 'seating', order: 3 },
    { id: 'sec-storage', name: 'Storage', slug: 'storage', order: 4 },
    { id: 'sec-tables', name: 'Tables', slug: 'tables', order: 5 },
    { id: 'sec-workstations', name: 'Workstations', slug: 'workstations', order: 6 },
]

/* ═══════════════════════════════════════════════════════════════════════
   Product Types · labels simples que clasifican los ProductGroups
   ═══════════════════════════════════════════════════════════════════════ */

export const PRODUCT_TYPES: ProductType[] = [
    { id: 'pt-chair', name: 'Chair' },
    { id: 'pt-table', name: 'Table' },
    { id: 'pt-lamp', name: 'Lamp' },
    { id: 'pt-storage', name: 'Storage' },
    { id: 'pt-panel', name: 'Panel' },
    { id: 'pt-casegood', name: 'Casegood' },
    { id: 'pt-screen', name: 'Screen' },
    { id: 'pt-accessory', name: 'Accessory' },
]

/* ═══════════════════════════════════════════════════════════════════════
   Product Groups · ~22 grupos con codes Steelcase-style
   Cada grupo referencia stubs de productos definidos abajo.
   ═══════════════════════════════════════════════════════════════════════ */

export const PRODUCT_GROUPS: ProductGroup[] = [
    // ── Seating (CH01-CH19) ─────────────────────────────────────────────
    {
        id: 'pg-ch01',
        code: 'CH01',
        name: 'Chair, Task',
        description: 'Ergonomic task seating for individual workstations and private offices.',
        sectionId: 'sec-seating',
        productTypeId: 'pt-chair',
        linkedOptionGroupCodes: ['Armrests', 'Base', 'Casters'],
        linkedFinishMasterCodes: ['Fabric', 'Frame'],
        itemIds: ['stub-ch01-1'],
    },
    {
        id: 'pg-ch03',
        code: 'CH03',
        name: 'Chair, Meeting',
        description: 'Meeting-room seating with optional pneumatic seat height adjustment.',
        sectionId: 'sec-seating',
        productTypeId: 'pt-chair',
        linkedOptionGroupCodes: ['Base', 'Casters'],
        linkedFinishMasterCodes: ['Fabric', 'Frame'],
        itemIds: ['stub-ch03-1'],
    },
    {
        id: 'pg-ch06',
        code: 'CH06',
        name: 'Chair, Dining',
        description: 'Dining chair for work cafe, break rooms and cafeteria seating.',
        sectionId: 'sec-seating',
        productTypeId: 'pt-chair',
        linkedFinishMasterCodes: ['Shell', 'Base'],
        itemIds: ['stub-ch06-1'],
    },
    {
        id: 'pg-ch08',
        code: 'CH08',
        name: 'Seating, Casual, Work Posture',
        description: 'Upholstered lounge chairs for focus rooms, front porches and huddle spaces.',
        sectionId: 'sec-seating',
        productTypeId: 'pt-chair',
        linkedFinishMasterCodes: ['Fabric', 'Legs'],
        itemIds: ['stub-ch08-1'],
    },
    {
        id: 'pg-ch09',
        code: 'CH09',
        name: 'Ottoman / Pouf, Ottoman',
        description: 'Companion ottoman for lounge seating.',
        sectionId: 'sec-seating',
        productTypeId: 'pt-chair',
        linkedFinishMasterCodes: ['Fabric', 'Legs'],
        itemIds: ['stub-ch09-1'],
    },
    {
        id: 'pg-ch10',
        code: 'CH10',
        name: 'Seating, Bench, Casual',
        description: 'Modular casual bench system for work cafe and cafe-height clusters.',
        sectionId: 'sec-seating',
        productTypeId: 'pt-chair',
        linkedFinishMasterCodes: ['Fabric', 'Frame'],
        itemIds: ['stub-ch10-1'],
    },
    {
        id: 'pg-ch12',
        code: 'CH12',
        name: 'Seating, Lounge, Select',
        description: 'Client-facing lounge seating for reception areas.',
        sectionId: 'sec-seating',
        productTypeId: 'pt-chair',
        linkedFinishMasterCodes: ['Fabric', 'Legs'],
        itemIds: ['stub-ch12-1'],
    },
    {
        id: 'pg-ch15',
        code: 'CH15',
        name: 'Stool, Casual',
        description: 'Bar and counter stools for work cafe communal tables.',
        sectionId: 'sec-seating',
        productTypeId: 'pt-chair',
        linkedFinishMasterCodes: ['Shell', 'Base'],
        // Fase 3.1 · seed expandido con 3 variantes (Enea Lotus / Enea Altzo / Shortcut).
        itemIds: ['stub-ch15-1', 'stub-ch15-2', 'stub-ch15-3'],
    },
    {
        id: 'pg-ch17',
        code: 'CH17',
        name: 'Ottoman / Pouf, Round Pouf',
        description: 'Round upholstered pouf for focus rooms and casual clusters.',
        sectionId: 'sec-seating',
        productTypeId: 'pt-chair',
        linkedFinishMasterCodes: ['Fabric'],
        itemIds: ['stub-ch17-1'],
    },

    // ── Tables (TB01-TB25) ──────────────────────────────────────────────
    {
        id: 'pg-tb01',
        code: 'TB01',
        name: 'Table, Meeting, Laminate, Tapered Top',
        description: 'Rectangular meeting table with laminate top and metal Y-base or cabinet base.',
        sectionId: 'sec-tables',
        productTypeId: 'pt-table',
        linkedFinishMasterCodes: ['Top', 'Base'],
        itemIds: ['stub-tb01-1'],
    },
    {
        id: 'pg-tb04',
        code: 'TB04',
        name: 'Table, Meeting, Laminate, Round Top',
        description: 'Round meeting table for small huddle and focus rooms.',
        sectionId: 'sec-tables',
        productTypeId: 'pt-table',
        linkedFinishMasterCodes: ['Top', 'Base'],
        // Fase 3.1 · seed expandido con 3 variantes · demuestra la relación
        // 1-a-N ProductGroup → ProductItem del silver schema de Notion.
        itemIds: ['stub-tb04-1', 'stub-tb04-2', 'stub-tb04-3'],
    },
    {
        id: 'pg-tb12',
        code: 'TB12',
        name: 'Table, Communal',
        description: 'Long communal table for work cafe and front porch settings.',
        sectionId: 'sec-tables',
        productTypeId: 'pt-table',
        linkedFinishMasterCodes: ['Top', 'Legs'],
        itemIds: ['stub-tb12-1'],
    },
    {
        id: 'pg-tb13',
        code: 'TB13',
        name: 'Table, Communal, Standing Height, Thin Profile',
        description: 'Bar-height communal table with power/data integration for work cafe.',
        sectionId: 'sec-tables',
        productTypeId: 'pt-table',
        linkedFinishMasterCodes: ['Top', 'Legs'],
        itemIds: ['stub-tb13-1'],
    },
    {
        id: 'pg-tb15',
        code: 'TB15',
        name: 'Table, Height Adjustable',
        description: 'Sit-to-stand adjustable desk for individual workstations and focus rooms.',
        sectionId: 'sec-tables',
        productTypeId: 'pt-table',
        linkedFinishMasterCodes: ['Top', 'Legs'],
        itemIds: ['stub-tb15-1'],
    },
    {
        id: 'pg-tb17',
        code: 'TB17',
        name: 'Table, Occasional, Side Tables',
        description: 'Side tables for casual seating clusters.',
        sectionId: 'sec-tables',
        productTypeId: 'pt-table',
        linkedFinishMasterCodes: ['Top', 'Legs'],
        itemIds: ['stub-tb17-1'],
    },
    {
        id: 'pg-tb18',
        code: 'TB18',
        name: 'Table, Laptop',
        description: 'C-leg laptop table that slides over the arm of a lounge chair.',
        sectionId: 'sec-tables',
        productTypeId: 'pt-table',
        linkedFinishMasterCodes: ['Top', 'Legs'],
        itemIds: ['stub-tb18-1'],
    },
    {
        id: 'pg-tb20',
        code: 'TB20',
        name: 'Table, Dining, Round Top',
        description: 'Round dining table (seated or standing height).',
        sectionId: 'sec-tables',
        productTypeId: 'pt-table',
        linkedFinishMasterCodes: ['Top', 'Legs'],
        itemIds: ['stub-tb20-1'],
    },
    {
        id: 'pg-tb21',
        code: 'TB21',
        name: 'Table, Dining, Square Top',
        description: 'Square dining table (seated or standing height).',
        sectionId: 'sec-tables',
        productTypeId: 'pt-table',
        linkedFinishMasterCodes: ['Top', 'Legs'],
        itemIds: ['stub-tb21-1'],
    },
    {
        id: 'pg-tb22',
        code: 'TB22',
        name: 'Table, Occasional, Select, Glass and Metal',
        description: 'Client-facing side / coffee table in glass and metal.',
        sectionId: 'sec-tables',
        productTypeId: 'pt-table',
        linkedFinishMasterCodes: ['Top', 'Frame'],
        itemIds: ['stub-tb22-1'],
    },
    {
        id: 'pg-tb23',
        code: 'TB23',
        name: 'Table, Occasional, Select, Wood',
        description: 'Console / occasional wood table for reception areas.',
        sectionId: 'sec-tables',
        productTypeId: 'pt-table',
        linkedFinishMasterCodes: ['Top', 'Frame'],
        itemIds: ['stub-tb23-1'],
    },

    // ── Ancillary (AL01-AL13) ───────────────────────────────────────────
    {
        id: 'pg-al04',
        code: 'AL04',
        name: 'Free Standing Modular Display System',
        description: 'Modular shelving system used as a neighborhood boundary and display.',
        sectionId: 'sec-ancillary',
        productTypeId: 'pt-accessory',
        linkedFinishMasterCodes: ['Frame', 'Shelves'],
        itemIds: ['stub-al04-1'],
    },
    {
        id: 'pg-al13',
        code: 'AL13',
        name: 'Light, Floor Lamp',
        description: 'Freestanding LED floor lamp with touch dimmer.',
        sectionId: 'sec-ancillary',
        productTypeId: 'pt-lamp',
        linkedFinishMasterCodes: ['Finish'],
        // Fase 3.1 · seed expandido con 2 variantes.
        itemIds: ['stub-al13-1', 'stub-al13-2'],
    },
]

/* ═══════════════════════════════════════════════════════════════════════
   Product stubs · resumen mínimo de cada producto referenciado en los
   bundles de Space Type Settings. Se usa como fallback cuando el itemId
   no coincide con un Product real del catálogo Allermuir/Allsteel/AIS.

   Cada stub tiene precio estimado, dimensiones y notas para renderizar
   en el bundle sin cargar el detail rich completo.
   ═══════════════════════════════════════════════════════════════════════ */

export interface ProductStub {
    id: string
    productGroupCode: string
    productItemCode: string
    name: string
    manufacturerHint?: string      // "Steelcase", "MillerKnoll" (para credibilidad demo)
    priceEstimateMin: number
    priceEstimateMax: number
    dimensions?: string             // "27\"W × 24.75\"D"
    notes?: string[]
    imageUrl?: string
    isStub: true
}

export const PRODUCT_STUBS: ProductStub[] = [
    // Seating
    {
        id: 'stub-ch01-1',
        productGroupCode: 'CH01',
        productItemCode: 'CH01',
        name: 'Leap Task Chair',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 900,
        priceEstimateMax: 1300,
        dimensions: '27"W × 24.75"D · Seat 15.5"-20.5"',
        notes: ['Variable back stop', 'Lumbar height adjustment', 'Passive seat edge'],
        isStub: true,
    },
    {
        id: 'stub-ch03-1',
        productGroupCode: 'CH03',
        productItemCode: 'CH03.1',
        name: 'Leap Meeting Chair',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 850,
        priceEstimateMax: 1200,
        dimensions: '27"W × 24.75"D',
        notes: ['Standard tilt', 'Fixed arms', 'Hard casters'],
        isStub: true,
    },
    {
        id: 'stub-ch06-1',
        productGroupCode: 'CH06',
        productItemCode: 'CH06.1',
        name: 'Enea Lotus Dining Chair',
        manufacturerHint: 'Steelcase Coalesse',
        priceEstimateMin: 380,
        priceEstimateMax: 520,
        dimensions: '20"W × 20"D × 30.6"H · Seat 18"',
        notes: ['Polypropylene seat with flex back', 'Optional seat pad'],
        isStub: true,
    },
    {
        id: 'stub-ch08-1',
        productGroupCode: 'CH08',
        productItemCode: 'CH08.1',
        name: 'Bob Lounge Chair',
        manufacturerHint: 'Steelcase Coalesse',
        priceEstimateMin: 1600,
        priceEstimateMax: 2400,
        dimensions: '35"W × 34.25"D × 31.25"H · Seat 17"',
        notes: ['Upholstered seat and arms', '4-star swivel base', 'Automatic return'],
        isStub: true,
    },
    {
        id: 'stub-ch09-1',
        productGroupCode: 'CH09',
        productItemCode: 'CH09.1',
        name: 'Bob Lounge Ottoman',
        manufacturerHint: 'Steelcase Coalesse',
        priceEstimateMin: 600,
        priceEstimateMax: 900,
        dimensions: '18.5"D × 19.75"W × 15.25"H',
        isStub: true,
    },
    {
        id: 'stub-ch10-1',
        productGroupCode: 'CH10',
        productItemCode: 'CH10.1',
        name: 'Umami Casual Bench',
        manufacturerHint: 'Steelcase Coalesse',
        priceEstimateMin: 2400,
        priceEstimateMax: 3800,
        dimensions: 'Seat 16.5"H × 30"D · overall varies',
        notes: ['Modular lounge system', 'Multiple configurations'],
        isStub: true,
    },
    {
        id: 'stub-ch12-1',
        productGroupCode: 'CH12',
        productItemCode: 'CH12.1',
        name: 'Perfect Pitch Lounge Chair',
        manufacturerHint: 'HBF',
        priceEstimateMin: 2100,
        priceEstimateMax: 2900,
        dimensions: '33.75"D × 30.75"W × 30.25"H · Seat 17.75"',
        notes: ['Upholstered with low integrated arms', '4-leg mid-century base'],
        isStub: true,
    },
    {
        id: 'stub-ch15-1',
        productGroupCode: 'CH15',
        productItemCode: 'CH15.1',
        name: 'Enea Lotus Sled Stool',
        manufacturerHint: 'Steelcase Coalesse',
        priceEstimateMin: 450,
        priceEstimateMax: 620,
        dimensions: 'Seat 26.25" (counter) / 30" (bar) · 18.25"W × 18"D',
        notes: ['Polypropylene seat with flex back', 'Steel tubular sled base'],
        isStub: true,
    },
    {
        id: 'stub-ch17-1',
        productGroupCode: 'CH17',
        productItemCode: 'CH17',
        name: 'Bumper Round Pouf',
        manufacturerHint: 'BluDot',
        priceEstimateMin: 350,
        priceEstimateMax: 480,
        dimensions: '17"W × 17"D × 17"H',
        notes: ['Felt upholstery over wood frame'],
        isStub: true,
    },

    // Tables
    {
        id: 'stub-tb01-1',
        productGroupCode: 'TB01',
        productItemCode: 'TB01.1',
        name: 'SW_1 Trapezoid Meeting Table',
        manufacturerHint: 'Steelcase Coalesse',
        priceEstimateMin: 3800,
        priceEstimateMax: 5200,
        dimensions: '42"/36"D × 72"L × 28.5"H',
        notes: ['Includes Ellora 4-port power', 'Grommet for wire management'],
        isStub: true,
    },
    {
        id: 'stub-tb04-1',
        productGroupCode: 'TB04',
        productItemCode: 'TB04',
        name: 'Montara Round Meeting Table',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 900,
        priceEstimateMax: 1400,
        dimensions: '42" Dia × 28.5"H',
        notes: ['Optional integrated power pod'],
        isStub: true,
    },
    {
        id: 'stub-tb12-1',
        productGroupCode: 'TB12',
        productItemCode: 'TB12.1',
        name: 'Cubb Communal Table',
        manufacturerHint: 'Orangebox',
        priceEstimateMin: 2800,
        priceEstimateMax: 3600,
        dimensions: '35"W × 102"D × 41"H (standing)',
        isStub: true,
    },
    {
        id: 'stub-tb13-1',
        productGroupCode: 'TB13',
        productItemCode: 'TB13',
        name: 'Campfire Standing Slim Table',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 3200,
        priceEstimateMax: 4200,
        dimensions: '18.75"D × 60"L × 42"H',
        notes: ['2 standard outlets', 'USB / USB-C ports', 'Integrated bag hooks'],
        isStub: true,
    },
    {
        id: 'stub-tb15-1',
        productGroupCode: 'TB15',
        productItemCode: 'TB15',
        name: 'Migration SE Height Adjustable',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 1400,
        priceEstimateMax: 2100,
        dimensions: '29"D × 64"W (30×72 available)',
        notes: ['Sit-to-stand extended height', 'Simple-touch control'],
        isStub: true,
    },
    {
        id: 'stub-tb17-1',
        productGroupCode: 'TB17',
        productItemCode: 'TB17.1',
        name: 'B-Free Side Table',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 380,
        priceEstimateMax: 560,
        dimensions: '29.5"W × 17.75"D × 15.25"H',
        isStub: true,
    },
    {
        id: 'stub-tb18-1',
        productGroupCode: 'TB18',
        productItemCode: 'TB18.1',
        name: 'Lagunitas Personal Table',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 420,
        priceEstimateMax: 620,
        dimensions: '24"W × 13"D × 25"H',
        notes: ['C-leg base for over-arm placement'],
        isStub: true,
    },
    {
        id: 'stub-tb20-1',
        productGroupCode: 'TB20',
        productItemCode: 'TB20.1',
        name: 'Groupwork Round Dining',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 900,
        priceEstimateMax: 1400,
        dimensions: '42" Dia × 28.5"H',
        isStub: true,
    },
    {
        id: 'stub-tb21-1',
        productGroupCode: 'TB21',
        productItemCode: 'TB21.1',
        name: 'Groupwork Square Dining',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 900,
        priceEstimateMax: 1400,
        dimensions: '42" × 42" × 28.5"H',
        isStub: true,
    },
    {
        id: 'stub-tb22-1',
        productGroupCode: 'TB22',
        productItemCode: 'TB22',
        name: 'Holy Day Occasional Table',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 1200,
        priceEstimateMax: 1800,
        dimensions: '35.5" Dia × 10.5"H (round cocktail)',
        notes: ['Glass or veneer top', 'Trivalent chrome frame'],
        isStub: true,
    },
    {
        id: 'stub-tb23-1',
        productGroupCode: 'TB23',
        productItemCode: 'TB23',
        name: 'Accent Square Wood Table',
        manufacturerHint: 'Bernhardt',
        priceEstimateMin: 1400,
        priceEstimateMax: 2100,
        dimensions: '42"W × 42"D × 15"H',
        notes: ['Metal base with wood inset top', 'Lower shelf'],
        isStub: true,
    },

    // Ancillary
    {
        id: 'stub-al04-1',
        productGroupCode: 'AL04',
        productItemCode: 'AL04.1',
        name: 'Flex Active Frame Display System',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 2200,
        priceEstimateMax: 3400,
        dimensions: '64.9"W × 17"D',
        notes: ['Adaptable structures', 'Accessibility from both sides'],
        isStub: true,
    },
    {
        id: 'stub-al13-1',
        productGroupCode: 'AL13',
        productItemCode: 'AL13',
        name: 'Captain Flint LED Floor Lamp',
        manufacturerHint: 'Flos (Steelcase)',
        priceEstimateMin: 900,
        priceEstimateMax: 1200,
        dimensions: '14.7"W × 60.5"H × 8.3"D',
        notes: ['Foot dimmer switch', '10-100% light adjustment'],
        isStub: true,
    },

    /* ═══════════════════════════════════════════════════════════════════
       Fase 3.1 · Variantes adicionales para demostrar la agrupación
       ProductGroup → ProductItem del silver schema (relación 1-a-N).
       Cada grupo abajo comparte linkedOptionGroup/linkedFinishMaster con
       sus hermanos · en producción se materializa como filas en la tabla
       ProductItem con FK productGroupId.
       ═══════════════════════════════════════════════════════════════════ */

    // CH15 · Stool Casual · variantes
    {
        id: 'stub-ch15-2',
        productGroupCode: 'CH15',
        productItemCode: 'CH15.2',
        name: 'Enea Altzo Counter Stool',
        manufacturerHint: 'Coalesse',
        priceEstimateMin: 520,
        priceEstimateMax: 720,
        dimensions: 'Seat 26.25" (counter) · 19"W × 19"D',
        notes: ['Upholstered seat', 'Steel tubular 4-leg base', 'Foot ring'],
        isStub: true,
    },
    {
        id: 'stub-ch15-3',
        productGroupCode: 'CH15',
        productItemCode: 'CH15.3',
        name: 'Shortcut X-Base Bar Stool',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 380,
        priceEstimateMax: 540,
        dimensions: 'Seat 30" (bar) · 17.5"W × 17.5"D',
        notes: ['Cast aluminum X-base', 'Polypropylene seat with flex back'],
        isStub: true,
    },

    // TB04 · Round Meeting Table · variantes
    {
        id: 'stub-tb04-2',
        productGroupCode: 'TB04',
        productItemCode: 'TB04.2',
        name: 'Lagunitas Round Meeting Table',
        manufacturerHint: 'Coalesse',
        priceEstimateMin: 1400,
        priceEstimateMax: 1900,
        dimensions: '42" Dia · 29"H',
        notes: ['Solid wood top', 'Powder-coated steel base'],
        isStub: true,
    },
    {
        id: 'stub-tb04-3',
        productGroupCode: 'TB04',
        productItemCode: 'TB04.3',
        name: 'media:scape Round Table (Non-Powered)',
        manufacturerHint: 'Steelcase',
        priceEstimateMin: 1800,
        priceEstimateMax: 2400,
        dimensions: '48" Dia · 29"H',
        notes: ['Cable trough integrated', 'Laminate top w/ 3mm edge'],
        isStub: true,
    },

    // AL13 · Floor Lamp · variante
    {
        id: 'stub-al13-2',
        productGroupCode: 'AL13',
        productItemCode: 'AL13.2',
        name: 'Elka Floor Lamp',
        manufacturerHint: 'MillerKnoll (Muuto)',
        priceEstimateMin: 620,
        priceEstimateMax: 850,
        dimensions: '10"Dia × 51.5"H',
        notes: ['Aluminum shade', 'Fabric-covered cord', '3-step dimmer'],
        isStub: true,
    },
]

/* ═══════════════════════════════════════════════════════════════════════
   Helpers · lookup por code
   ═══════════════════════════════════════════════════════════════════════ */

export function findSectionByName(name: string): Section | undefined {
    return SECTIONS.find(s => s.name === name)
}

export function findProductGroupByCode(code: string): ProductGroup | undefined {
    return PRODUCT_GROUPS.find(g => g.code === code)
}

/** Fase 3.1 · path a la foto del ProductGroup (una por code, reusada entre
 *  variantes). Convención: /public/images/products/{code-lowercase}.jpg. */
export function productImageUrl(productGroupCode: string): string {
    return `/images/products/${productGroupCode.toLowerCase()}.jpg`
}

/** Fase 3 · matching heurístico Product → ProductGroup para el badge
 *  "Used in N settings". Como el seed histórico de Allermuir/Allsteel/AIS
 *  usa nombres de collection (Axyl, Bastille, Acuity, Kite) en vez de
 *  descripciones tipo "Task Chair", combinamos:
 *    1. NAME_OVERRIDES · dict directo product.name → group code
 *    2. Regex sobre category + name + description + specs.APPLICATION
 *  Retorna undefined si nada matchea · el caller decide si mostrar badge.
 */

// Overrides directos por nombre de collection · los names más comunes del
// seed real (Allermuir/Allsteel/AIS). Mapean a un ProductGroup razonable
// para dar la sensación de conexión con el catálogo Steelcase/MillerKnoll
// de los bundles. Amplío según se agregan collections al seed.
const NAME_OVERRIDES: Record<string, string> = {
    // Allermuir · seating
    'Axyl': 'CH15',           // arm chair + stool (según descripción)
    'Bastille': 'CH06',       // shell chair, dining/cafe
    'Famiglia': 'CH06',       // dining chair
    'Kite Sofa': 'CH08',      // sofa modular → lounge chair más cercano
    'Kite': 'CH08',
    'Hive Ottoman': 'CH09',   // ottoman exacto
    'Hive': 'CH09',
    // Allsteel · seating & storage
    'Acuity': 'CH01',         // task chair (ergonomic)
    'Essence Storage': 'AL04',// storage / display system
    'Essence': 'AL04',
    // AIS · casegoods
    'Calibrate': 'CH03',      // meeting chair (según la Fase 2 seed screenshot)
}

const INFER_RULES: Array<[RegExp, string]> = [
    // Seating · más específico primero (evita colisiones con 'chair')
    [/task\s*chair|desk\s*chair|ergonomic\s*chair/i, 'CH01'],
    [/meeting\s*chair|conference\s*chair/i, 'CH03'],
    [/dining\s*chair|cafe\s*chair/i, 'CH06'],
    [/lounge\s*chair|casual\s*(work\s*posture|chair)|arm\s*chair/i, 'CH08'],
    [/ottoman/i, 'CH09'],
    [/bench/i, 'CH10'],
    [/perfect\s*pitch|lounge\s*(low|arm)/i, 'CH12'],
    [/stool|bar\s*chair|counter\s*chair/i, 'CH15'],
    [/pouf/i, 'CH17'],
    // Tables
    [/height\s*adjustable|standing\s*desk|sit[-\s]*stand/i, 'TB15'],
    [/communal\s*table|long\s*table/i, 'TB12'],
    [/round\s*meeting\s*table/i, 'TB04'],
    [/meeting\s*table|conference\s*table/i, 'TB01'],
    [/laptop\s*table/i, 'TB18'],
    [/side\s*table|occasional\s*table/i, 'TB17'],
    [/dining\s*table|cafe\s*table/i, 'TB20'],
    // Ancillary
    [/floor\s*lamp|lamp\b/i, 'AL13'],
    [/shelving|display\s*system|bookcase|storage/i, 'AL04'],
    // Fallback muy genérico · si es "chair" cualquiera, asumimos meeting
    // (más común en los settings). Solo se usa si nada más matcheó.
    [/\bchair\b|seating|sofa/i, 'CH03'],
    [/\btable\b/i, 'TB01'],
]

interface InferProductLike {
    productGroupCode?: string
    category?: string
    name?: string
    description?: string
    specs?: Record<string, string>
}

export function inferProductGroupCode(product: InferProductLike): string | undefined {
    if (product.productGroupCode) return product.productGroupCode
    // 1. Overrides directos por name (más rápido, más determinístico)
    if (product.name && NAME_OVERRIDES[product.name]) {
        return NAME_OVERRIDES[product.name]
    }
    // 2. Regex sobre todo el texto disponible
    const application = product.specs?.['APPLICATION'] ?? ''
    const text = `${product.category ?? ''} ${product.name ?? ''} ${product.description ?? ''} ${application}`
    for (const [rx, code] of INFER_RULES) {
        if (rx.test(text)) return code
    }
    return undefined
}

export function findProductStub(itemId: string): ProductStub | undefined {
    const stub = PRODUCT_STUBS.find(s => s.id === itemId)
    if (!stub) return undefined
    // Inyecta imageUrl derivada del productGroupCode si no viene populada
    // (evita 27 edits manuales · las variantes del mismo group comparten foto).
    return stub.imageUrl
        ? stub
        : { ...stub, imageUrl: productImageUrl(stub.productGroupCode) }
}

export function productGroupsInSection(sectionId: string): ProductGroup[] {
    return PRODUCT_GROUPS.filter(g => g.sectionId === sectionId)
}
