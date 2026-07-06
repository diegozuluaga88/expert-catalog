// Fase 1 · Space Types + Settings + Bundles (2026-07-06).
// Seed data inspirado en Steelcase Furniture Playbook (Wells Fargo 2023) y
// MillerKnoll Furniture Catalog Q3 2023 · reinterpretación B2B para dar
// credibilidad a la demo del expert-catalog frente a stakeholders reales
// (dealer, product owner, business analyst).
//
// Cada SpaceTypeSetting incluye un SpaceBundle con items + estimated cost range
// derivado directamente de los PDFs. Los itemIds referencian ProductGroups
// definidos en `productGroups.ts` (Fase 1 · mismo commit).

import type { SpaceType, SpaceTypeSetting, SpaceBundle } from '../types'

/* ═══════════════════════════════════════════════════════════════════════
   Space Types · 6 tipologías principales
   ═══════════════════════════════════════════════════════════════════════ */

// Fase 3.1 · imageUrl agregado a cada SpaceType · foto en /public/images/spaces/
// (licencia libre, Unsplash CDN preservado en assets locales).
export const SPACE_TYPES: SpaceType[] = [
    {
        id: 'sp-focus-room',
        name: 'Focus Room',
        code: 'focus-room',
        icon: '🎯',
        imageUrl: '/images/spaces/focus-room.jpg',
        description: 'Individual workspace for concentrated work · phone calls, video meetings, deep focus tasks.',
        spaceProfile: ['CCO', 'GW', 'CI'],
    },
    {
        id: 'sp-work-cafe',
        name: 'Work Cafe',
        code: 'work-cafe',
        icon: '☕',
        imageUrl: '/images/spaces/work-cafe.jpg',
        description: 'Casual gathering area with dining and lounge seating · informal collaboration and social interaction.',
        spaceProfile: ['CCO', 'GW', 'CI'],
    },
    {
        id: 'sp-huddle-room',
        name: 'Huddle Room',
        code: 'huddle-room',
        icon: '👥',
        imageUrl: '/images/spaces/huddle-room.jpg',
        description: 'Small collaboration space for 2-4 people · quick meetings, video conferencing, ad-hoc discussions.',
        spaceProfile: ['CCO', 'GW', 'CI'],
    },
    {
        id: 'sp-meeting-room',
        name: 'Meeting Room',
        code: 'meeting-room',
        icon: '🗓️',
        imageUrl: '/images/spaces/meeting-room.jpg',
        description: 'Formal meeting space in small / medium / large / extra-large configurations · scheduled team meetings.',
        spaceProfile: ['CCO', 'GW', 'CI'],
    },
    {
        id: 'sp-front-porch',
        name: 'Front Porch',
        code: 'front-porch',
        icon: '🏛️',
        imageUrl: '/images/spaces/front-porch.jpg',
        description: 'Welcoming transition zone at the entrance of a neighborhood · casual seating and display shelving.',
        spaceProfile: ['GW'],
    },
    {
        id: 'sp-reception',
        name: 'Reception',
        code: 'reception',
        icon: '🎫',
        imageUrl: '/images/spaces/reception.jpg',
        description: 'Client-facing entry area · lounge seating, side tables, coffee tables for waiting visitors.',
        spaceProfile: ['CI'],
    },
]

/* ═══════════════════════════════════════════════════════════════════════
   Space Type Settings · 15 settings pre-configurados con bundles
   Basados en Steelcase Playbook páginas 15 (Focus Room), 24 (Meeting Small),
   26 (Reception), 30 (Work Cafe), 17 (Huddle), 16 (Front Porch).
   ═══════════════════════════════════════════════════════════════════════ */

// Helper para construir bundle con items · reduce boilerplate
function makeBundle(
    id: string,
    settingId: string,
    items: Array<{ productGroupCode: string; itemId: string; qty: number; label?: string }>,
    costMin: number,
    costMax: number,
): SpaceBundle {
    return {
        id,
        settingId,
        items,
        estimatedCostMin: costMin,
        estimatedCostMax: costMax,
        currency: 'USD',
    }
}

export const SPACE_TYPE_SETTINGS: SpaceTypeSetting[] = [
    // ─── Focus Room · 4 settings (F1-F4) ────────────────────────────────
    {
        id: 'st-f1',
        code: 'F1',
        name: 'Focus Room · Individual work',
        spaceTypeId: 'sp-focus-room',
        description: 'HAT desk with task chair + side ottoman for guest posture. Floor lamp for ambient lighting.',
        notes: [
            'The rendering is for example only. Refer to architectural plans for actual layout, site conditions and product selection.',
            'Products are not limited to items identified and not all listed are required to be included.',
        ],
        bundle: makeBundle('bd-f1', 'st-f1', [
            { productGroupCode: 'CH01', itemId: 'stub-ch01-1', qty: 1, label: '1' },
            { productGroupCode: 'TB15', itemId: 'stub-tb15-1', qty: 1, label: '2' },
            { productGroupCode: 'CH17', itemId: 'stub-ch17-1', qty: 1, label: '3' },
            { productGroupCode: 'AL13', itemId: 'stub-al13-1', qty: 1, label: '4' },
        ], 1500, 1800),
    },
    {
        id: 'st-f2',
        code: 'F2',
        name: 'Focus Room · Mid-focus / callback',
        spaceTypeId: 'sp-focus-room',
        description: 'Casual seating with ottoman for phone calls and video meetings.',
        notes: ['Specification for AL13 floor lamp is determined at a project level and may not be included in all settings.'],
        bundle: makeBundle('bd-f2', 'st-f2', [
            { productGroupCode: 'CH08', itemId: 'stub-ch08-1', qty: 1, label: '1' },
            { productGroupCode: 'CH09', itemId: 'stub-ch09-1', qty: 1, label: '2' },
            { productGroupCode: 'TB18', itemId: 'stub-tb18-1', qty: 1, label: '3' },
            { productGroupCode: 'TB17', itemId: 'stub-tb17-1', qty: 1, label: '4' },
            { productGroupCode: 'AL13', itemId: 'stub-al13-1', qty: 1, label: '5' },
        ], 2000, 2500),
    },
    {
        id: 'st-f3',
        code: 'F3',
        name: 'Focus Room · Dual focus',
        spaceTypeId: 'sp-focus-room',
        description: 'Two casual chairs facing each other · side tables between · ambient lighting.',
        bundle: makeBundle('bd-f3', 'st-f3', [
            { productGroupCode: 'CH08', itemId: 'stub-ch08-1', qty: 2, label: '1' },
            { productGroupCode: 'TB18', itemId: 'stub-tb18-1', qty: 1, label: '2' },
            { productGroupCode: 'TB17', itemId: 'stub-tb17-1', qty: 1, label: '3' },
            { productGroupCode: 'AL13', itemId: 'stub-al13-1', qty: 1, label: '4' },
        ], 3000, 3500),
    },
    {
        id: 'st-f4',
        code: 'F4',
        name: 'Focus Room · Small collab',
        spaceTypeId: 'sp-focus-room',
        description: 'Meeting chair + round table + floor lamp for quick 1-on-1 conversations.',
        bundle: makeBundle('bd-f4', 'st-f4', [
            { productGroupCode: 'CH03', itemId: 'stub-ch03-1', qty: 1, label: '1' },
            { productGroupCode: 'TB04', itemId: 'stub-tb04-1', qty: 1, label: '2' },
            { productGroupCode: 'AL13', itemId: 'stub-al13-1', qty: 1, label: '3' },
        ], 1800, 2200),
    },

    // ─── Work Cafe · 2 settings (WC1, WC2) ──────────────────────────────
    {
        id: 'st-wc1',
        code: 'WC1',
        name: 'Work Cafe · Small (12 seats)',
        spaceTypeId: 'sp-work-cafe',
        description: 'Dining tables + communal high-top table + casual bench seating along the wall.',
        notes: ['Example configurations, actual will be based on site conditions.'],
        bundle: makeBundle('bd-wc1', 'st-wc1', [
            { productGroupCode: 'CH06', itemId: 'stub-ch06-1', qty: 8, label: '1' },
            { productGroupCode: 'CH15', itemId: 'stub-ch15-1', qty: 4, label: '2' },
            { productGroupCode: 'TB21', itemId: 'stub-tb21-1', qty: 2, label: '3' },
            { productGroupCode: 'TB20', itemId: 'stub-tb20-1', qty: 1, label: '4' },
            { productGroupCode: 'TB13', itemId: 'stub-tb13-1', qty: 1, label: '5' },
            { productGroupCode: 'CH10', itemId: 'stub-ch10-1', qty: 1, label: '6' },
        ], 20000, 22000),
    },
    {
        id: 'st-wc2',
        code: 'WC2',
        name: 'Work Cafe · Medium (24 seats)',
        spaceTypeId: 'sp-work-cafe',
        description: 'Higher-capacity configuration with additional dining and lounge seating clusters.',
        bundle: makeBundle('bd-wc2', 'st-wc2', [
            { productGroupCode: 'CH06', itemId: 'stub-ch06-1', qty: 16, label: '1' },
            { productGroupCode: 'CH15', itemId: 'stub-ch15-1', qty: 6, label: '2' },
            { productGroupCode: 'TB21', itemId: 'stub-tb21-1', qty: 4, label: '3' },
            { productGroupCode: 'TB20', itemId: 'stub-tb20-1', qty: 2, label: '4' },
            { productGroupCode: 'TB13', itemId: 'stub-tb13-1', qty: 2, label: '5' },
            { productGroupCode: 'CH10', itemId: 'stub-ch10-1', qty: 2, label: '6' },
        ], 30000, 32000),
    },

    // ─── Huddle Room · 2 settings (H1, H2) ──────────────────────────────
    {
        id: 'st-h1',
        code: 'H1',
        name: 'Huddle · Lounge posture',
        spaceTypeId: 'sp-huddle-room',
        description: 'Casual seating with laptop tables and floor lamp for informal video calls.',
        bundle: makeBundle('bd-h1', 'st-h1', [
            { productGroupCode: 'CH08', itemId: 'stub-ch08-1', qty: 2, label: '1' },
            { productGroupCode: 'TB18', itemId: 'stub-tb18-1', qty: 1, label: '2' },
            { productGroupCode: 'AL13', itemId: 'stub-al13-1', qty: 1, label: '3' },
        ], 4000, 4500),
    },
    {
        id: 'st-h2',
        code: 'H2',
        name: 'Huddle · Meeting posture',
        spaceTypeId: 'sp-huddle-room',
        description: 'Meeting chairs around a round table with side lounge chair for observer/note-taker.',
        bundle: makeBundle('bd-h2', 'st-h2', [
            { productGroupCode: 'CH03', itemId: 'stub-ch03-1', qty: 2, label: '1' },
            { productGroupCode: 'CH10', itemId: 'stub-ch10-1', qty: 1, label: '2' },
            { productGroupCode: 'TB18', itemId: 'stub-tb18-1', qty: 1, label: '3' },
            { productGroupCode: 'TB17', itemId: 'stub-tb17-1', qty: 1, label: '4' },
            { productGroupCode: 'AL13', itemId: 'stub-al13-1', qty: 1, label: '5' },
        ], 4000, 4500),
    },

    // ─── Meeting Room · 3 settings (SM1, MM1, LM1) ──────────────────────
    {
        id: 'st-sm1',
        code: 'SM1',
        name: 'Meeting Room · Small (4 seats)',
        spaceTypeId: 'sp-meeting-room',
        description: 'Round table with 4 meeting chairs · standard for a 100 sqft room.',
        bundle: makeBundle('bd-sm1', 'st-sm1', [
            { productGroupCode: 'CH03', itemId: 'stub-ch03-1', qty: 4, label: '1' },
            { productGroupCode: 'TB04', itemId: 'stub-tb04-1', qty: 1, label: '2' },
        ], 2000, 2200),
    },
    {
        id: 'st-mm1',
        code: 'MM1',
        name: 'Meeting Room · Medium (8-10 seats)',
        spaceTypeId: 'sp-meeting-room',
        description: 'Rectangular table with 8-10 meeting chairs · power/data integrated.',
        notes: ['Project team to determine if tables to be powered and ganged.'],
        bundle: makeBundle('bd-mm1', 'st-mm1', [
            { productGroupCode: 'CH03', itemId: 'stub-ch03-1', qty: 10, label: '1' },
            { productGroupCode: 'TB01', itemId: 'stub-tb01-1', qty: 1, label: '2' },
        ], 10000, 12000),
    },
    {
        id: 'st-lm1',
        code: 'LM1',
        name: 'Meeting Room · Large (14-16 seats)',
        spaceTypeId: 'sp-meeting-room',
        description: 'Large boardroom-style table with 14-16 executive chairs.',
        bundle: makeBundle('bd-lm1', 'st-lm1', [
            { productGroupCode: 'CH03', itemId: 'stub-ch03-1', qty: 16, label: '1' },
            { productGroupCode: 'TB01', itemId: 'stub-tb01-1', qty: 1, label: '2' },
        ], 12500, 15000),
    },

    // ─── Front Porch · 2 settings (FP1, FP2) ────────────────────────────
    {
        id: 'st-fp1',
        code: 'FP1',
        name: 'Front Porch · Lounge cluster',
        spaceTypeId: 'sp-front-porch',
        description: 'Casual seating cluster with display shelving as a neighborhood boundary.',
        bundle: makeBundle('bd-fp1', 'st-fp1', [
            { productGroupCode: 'CH08', itemId: 'stub-ch08-1', qty: 2, label: '1' },
            { productGroupCode: 'TB18', itemId: 'stub-tb18-1', qty: 1, label: '2' },
            { productGroupCode: 'TB17', itemId: 'stub-tb17-1', qty: 1, label: '3' },
            { productGroupCode: 'AL04', itemId: 'stub-al04-1', qty: 1, label: '4' },
        ], 15000, 16000),
    },
    {
        id: 'st-fp2',
        code: 'FP2',
        name: 'Front Porch · Cafe seating',
        spaceTypeId: 'sp-front-porch',
        description: 'Dining-style seating with a communal table + shelf backdrop.',
        bundle: makeBundle('bd-fp2', 'st-fp2', [
            { productGroupCode: 'CH06', itemId: 'stub-ch06-1', qty: 6, label: '1' },
            { productGroupCode: 'TB12', itemId: 'stub-tb12-1', qty: 1, label: '2' },
            { productGroupCode: 'AL04', itemId: 'stub-al04-1', qty: 1, label: '3' },
        ], 7000, 8000),
    },

    // ─── Reception · 2 settings (R1, R2) ────────────────────────────────
    {
        id: 'st-r1',
        code: 'R1',
        name: 'Reception · Client interact',
        spaceTypeId: 'sp-reception',
        description: 'Formal reception with lounge chairs, side tables and coffee table.',
        notes: ['Example configuration, actual will be based on site conditions.'],
        bundle: makeBundle('bd-r1', 'st-r1', [
            { productGroupCode: 'CH12', itemId: 'stub-ch12-1', qty: 4, label: '1' },
            { productGroupCode: 'TB23', itemId: 'stub-tb23-1', qty: 1, label: '2' },
            { productGroupCode: 'TB22', itemId: 'stub-tb22-1', qty: 2, label: '3' },
        ], 16500, 17500),
    },
    {
        id: 'st-r2',
        code: 'R2',
        name: 'Reception · Compact',
        spaceTypeId: 'sp-reception',
        description: 'Smaller reception setup for lower-traffic entrances.',
        bundle: makeBundle('bd-r2', 'st-r2', [
            { productGroupCode: 'CH12', itemId: 'stub-ch12-1', qty: 2, label: '1' },
            { productGroupCode: 'TB22', itemId: 'stub-tb22-1', qty: 1, label: '2' },
        ], 8500, 9500),
    },
]

/** Bundles extraídos de settings para uso directo cuando se necesita agregar
 *  a la selection sin cargar el setting completo. */
export const SPACE_BUNDLES: SpaceBundle[] = SPACE_TYPE_SETTINGS.map(s => s.bundle)

/** Helper · resuelve un SpaceType por su code (ej. 'focus-room'). */
export function findSpaceTypeByCode(code: string): SpaceType | undefined {
    return SPACE_TYPES.find(s => s.code === code)
}

/** Helper · lista de settings de un SpaceType. */
export function settingsForSpaceType(spaceTypeId: string): SpaceTypeSetting[] {
    return SPACE_TYPE_SETTINGS.filter(s => s.spaceTypeId === spaceTypeId)
}

/** Helper · resuelve un setting por code (ej. 'F1'). */
export function findSettingByCode(code: string): SpaceTypeSetting | undefined {
    return SPACE_TYPE_SETTINGS.find(s => s.code === code)
}

/** Fase 3 · settings donde el ProductGroup aparece en su bundle · alimenta
 *  el badge "Used in N settings" en las product cards y el drill-down cross-nav
 *  desde ProductDetailPanel a los settings. */
export function settingsUsingProductGroup(productGroupCode: string): SpaceTypeSetting[] {
    return SPACE_TYPE_SETTINGS.filter(s =>
        s.bundle.items.some(i => i.productGroupCode === productGroupCode)
    )
}

/** Fase 3 · lookup SpaceType por id (para renderizar el header de un setting). */
export function findSpaceTypeById(id: string): SpaceType | undefined {
    return SPACE_TYPES.find(s => s.id === id)
}
