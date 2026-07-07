// Fase P1.3.a · OptionMaster + OptionGroupValue seed (2026-07-06)
//
// Modelo de opciones configurables alineado con el silver schema (grupos
// OptionMaster + OptionGroupValue). Cada OptionMaster (ej. "Armrests")
// tiene N valores concretos (ej. "None", "Fixed", "Adjustable") con display
// order.
//
// En producción esto viene del bronze→silver processor. Aquí es un mock
// read-only que provee la data para que los ProductGroups puedan referenciar
// via `linkedOptionGroupRefs`. La UI (VariantsTab, QuoteTab) todavía usa
// `Product.fabricOptions[]` flat · su migración es P1.3.b.

import type { OptionMaster, OptionGroupValue } from '../types'

/* ═══════════════════════════════════════════════════════════════════════
   OptionMasters · categorías de opciones (Armrests, Base, Casters, etc)
   ═══════════════════════════════════════════════════════════════════════ */

export const OPTION_MASTERS: OptionMaster[] = [
    {
        id: 'om-armrests',
        optionGroupCode: 'Armrests',
        name: 'Armrests',
        notes: 'Configuración de apoyabrazos · varía por chair type.',
        status: 'Active',
    },
    {
        id: 'om-base',
        optionGroupCode: 'Base',
        name: 'Base',
        notes: 'Tipo de base o legs · afecta stability + weight.',
        status: 'Active',
    },
    {
        id: 'om-casters',
        optionGroupCode: 'Casters',
        name: 'Casters',
        notes: 'Ruedas y glides · según superficie del piso.',
        status: 'Active',
    },
    {
        id: 'om-shell',
        optionGroupCode: 'Shell',
        name: 'Shell',
        notes: 'Material y color de la carcasa del asiento.',
        status: 'Active',
    },
    {
        id: 'om-top',
        optionGroupCode: 'Top',
        name: 'Top',
        notes: 'Material del top de la mesa/desk.',
        status: 'Active',
    },
    {
        id: 'om-legs',
        optionGroupCode: 'Legs',
        name: 'Legs',
        notes: 'Configuración de patas de mesa.',
        status: 'Active',
    },
]

/* ═══════════════════════════════════════════════════════════════════════
   OptionGroupValues · valores concretos dentro de cada master, con position
   ═══════════════════════════════════════════════════════════════════════ */

export const OPTION_GROUP_VALUES: OptionGroupValue[] = [
    // Armrests (om-armrests)
    { id: 'ov-armrests-none', optionMasterId: 'om-armrests', position: 1, value: 'None', description: 'Sin apoyabrazos.', status: 'Active' },
    { id: 'ov-armrests-fixed', optionMasterId: 'om-armrests', position: 2, value: 'Fixed', description: 'Apoyabrazos fijos.', status: 'Active' },
    { id: 'ov-armrests-adjustable', optionMasterId: 'om-armrests', position: 3, value: 'Adjustable', description: 'Apoyabrazos ajustables en altura.', status: 'Active' },
    { id: 'ov-armrests-4d', optionMasterId: 'om-armrests', position: 4, value: '4D Adjustable', description: 'Ajuste en 4 dimensiones (height, width, depth, pivot).', status: 'Active' },
    // Fase P2.2 · sample discontinued · el UI oculta por default via valuesForMaster()
    // filter status='Active'. Sirve como validación del pattern silver status per-entity.
    { id: 'ov-armrests-2d-legacy', optionMasterId: 'om-armrests', position: 5, value: '2D Adjustable (legacy)', description: 'Modelo legacy discontinuado en Q4 2025.', status: 'Discontinued' },

    // Base (om-base)
    { id: 'ov-base-4-star', optionMasterId: 'om-base', position: 1, value: '4-star base', description: 'Base de 4 puntos.', status: 'Active' },
    { id: 'ov-base-5-star', optionMasterId: 'om-base', position: 2, value: '5-star base', description: 'Base de 5 puntos · más estable.', status: 'Active' },
    { id: 'ov-base-sled', optionMasterId: 'om-base', position: 3, value: 'Sled base', description: 'Base tipo trineo · stackable.', status: 'Active' },
    { id: 'ov-base-4-leg', optionMasterId: 'om-base', position: 4, value: '4-leg base', description: 'Base de 4 patas fijas.', status: 'Active' },

    // Casters (om-casters)
    { id: 'ov-casters-none', optionMasterId: 'om-casters', position: 1, value: 'Glides', description: 'Sin ruedas · glides estándar.', status: 'Active' },
    { id: 'ov-casters-hard', optionMasterId: 'om-casters', position: 2, value: 'Hard casters', description: 'Ruedas duras · para superficies carpeted.', status: 'Active' },
    { id: 'ov-casters-soft', optionMasterId: 'om-casters', position: 3, value: 'Soft casters', description: 'Ruedas suaves · para pisos duros (wood, tile).', status: 'Active' },

    // Shell (om-shell)
    { id: 'ov-shell-polypropylene', optionMasterId: 'om-shell', position: 1, value: 'Polypropylene', description: 'Shell plástico flexible.', status: 'Active' },
    { id: 'ov-shell-upholstered', optionMasterId: 'om-shell', position: 2, value: 'Upholstered', description: 'Shell tapizado con fabric.', status: 'Active' },
    { id: 'ov-shell-mesh', optionMasterId: 'om-shell', position: 3, value: 'Mesh', description: 'Shell de malla · breathable.', status: 'Active' },

    // Top (om-top)
    { id: 'ov-top-laminate', optionMasterId: 'om-top', position: 1, value: 'Laminate', description: 'Top laminado · económico y durable.', status: 'Active' },
    { id: 'ov-top-veneer', optionMasterId: 'om-top', position: 2, value: 'Wood veneer', description: 'Top de chapa de madera.', status: 'Active' },
    { id: 'ov-top-glass', optionMasterId: 'om-top', position: 3, value: 'Glass', description: 'Top de vidrio tempered.', status: 'Active' },

    // Legs (om-legs)
    { id: 'ov-legs-metal-4', optionMasterId: 'om-legs', position: 1, value: '4-leg metal', description: 'Patas de metal · 4 puntos.', status: 'Active' },
    { id: 'ov-legs-pedestal', optionMasterId: 'om-legs', position: 2, value: 'Pedestal', description: 'Base tipo pedestal central.', status: 'Active' },
    { id: 'ov-legs-y-base', optionMasterId: 'om-legs', position: 3, value: 'Y-base', description: 'Base tipo Y con 3 puntos.', status: 'Active' },
]

/* ═══════════════════════════════════════════════════════════════════════
   Helpers · lookup por id / code + values por master
   ═══════════════════════════════════════════════════════════════════════ */

export function findOptionMasterById(id: string): OptionMaster | undefined {
    return OPTION_MASTERS.find(m => m.id === id)
}

export function findOptionMasterByCode(code: string): OptionMaster | undefined {
    return OPTION_MASTERS.find(m => m.optionGroupCode === code)
}

export function findOptionValueById(id: string): OptionGroupValue | undefined {
    return OPTION_GROUP_VALUES.find(v => v.id === id)
}

/** Fase P2.2 · Values de un master ordenados por position asc, filtrados por
 *  status='Active' por defecto (silver `optionGroupValueStatus`). Los valores
 *  Discontinued/Draft se ocultan en dropdowns pero permanecen en el data para
 *  drafts históricos (backward compat).
 *  @param includeAll · true para incluir Discontinued/Draft (admin UI, edit
 *  mode de items históricos, etc). Default false. */
export function valuesForMaster(masterId: string, includeAll = false): OptionGroupValue[] {
    return OPTION_GROUP_VALUES
        .filter(v => v.optionMasterId === masterId)
        .filter(v => includeAll || v.status === 'Active')
        .sort((a, b) => a.position - b.position)
}

/** Fase P2.2 · OptionMasters filtrados por tenant + status='Active'. */
export function mastersForTenant(tenantId: string | null, includeAll = false): OptionMaster[] {
    return OPTION_MASTERS
        .filter(m => m.tenantId === undefined || m.tenantId === tenantId)
        .filter(m => includeAll || m.status === 'Active')
}

/**
 * Legacy bridge · convierte `linkedOptionGroup: string[]` (codes) al nuevo shape
 * `Array<{ optionMasterId, optionGroupPosition }>`. Útil para migrar seed data
 * progresivamente sin romper consumers antiguos.
 */
export function resolveLegacyLinkedOptionGroup(
    codes: string[],
): Array<{ optionMasterId: string; optionGroupPosition: number }> {
    return codes
        .map((code, idx) => {
            const master = findOptionMasterByCode(code)
            if (!master) return null
            return { optionMasterId: master.id, optionGroupPosition: idx + 1 }
        })
        .filter((x): x is { optionMasterId: string; optionGroupPosition: number } => x !== null)
}
