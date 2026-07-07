// Fase P1.4.a · FinishMaster + FinishOption + FinishValue seed (2026-07-06)
//
// Jerarquía Finishes 3 niveles alineada 1:1 con el silver schema:
//   FinishMaster (Frame Finish, Fabric Finish, Shell Finish, Top Finish)
//     → FinishOption (Powder Coat, Chrome; Grade 1, Grade 2, Grade 3; etc)
//       → FinishValue (Matte Black +$0, Polished +$45; Slate Grey +$0; etc)
//
// Silver Finishes SÍ modifican precio (a diferencia de Options que son semantic).
// El `price` del FinishValue se aplica como delta sobre el productItemPrice.
//
// En producción esto viene del bronze→silver processor. Aquí es un mock que
// provee la data para que los ProductGroups referencien via linkedFinishMasterRefs.
// La UI (VariantsTab, QuoteTab) seguirá usando Product.finishes[] flat legacy
// hasta la migración total en P1.4.c.

import type { FinishMaster, FinishOption, FinishValue } from '../types'

/* ═══════════════════════════════════════════════════════════════════════
   FinishMasters · nivel superior (categorías de finish)
   ═══════════════════════════════════════════════════════════════════════ */

export const FINISH_MASTERS: FinishMaster[] = [
    { id: 'fm-frame', masterFinishName: 'Frame Finish', status: 'Active' },
    { id: 'fm-fabric', masterFinishName: 'Fabric Finish', status: 'Active' },
    { id: 'fm-shell', masterFinishName: 'Shell Finish', status: 'Active' },
    { id: 'fm-top', masterFinishName: 'Top Finish', status: 'Active' },
    { id: 'fm-base', masterFinishName: 'Base Finish', status: 'Active' },
]

/* ═══════════════════════════════════════════════════════════════════════
   FinishOptions · sub-grupos dentro de cada master
   ═══════════════════════════════════════════════════════════════════════ */

export const FINISH_OPTIONS: FinishOption[] = [
    // Frame Finish
    { id: 'fo-frame-powder', finishMasterId: 'fm-frame', finishOptionName: 'Powder Coat', status: 'Active' },
    { id: 'fo-frame-chrome', finishMasterId: 'fm-frame', finishOptionName: 'Chrome', status: 'Active' },
    { id: 'fo-frame-wood', finishMasterId: 'fm-frame', finishOptionName: 'Wood', status: 'Active' },
    // Fabric Finish · por grade (Notion example)
    { id: 'fo-fabric-g1', finishMasterId: 'fm-fabric', finishOptionName: 'Grade 1 (Standard)', status: 'Active' },
    { id: 'fo-fabric-g3', finishMasterId: 'fm-fabric', finishOptionName: 'Grade 3 (Premium)', status: 'Active' },
    { id: 'fo-fabric-g5', finishMasterId: 'fm-fabric', finishOptionName: 'Grade 5 (Special)', status: 'Active' },
    // Shell Finish · para stools/chairs con carcasa
    { id: 'fo-shell-solid', finishMasterId: 'fm-shell', finishOptionName: 'Solid Color', status: 'Active' },
    { id: 'fo-shell-metallic', finishMasterId: 'fm-shell', finishOptionName: 'Metallic', status: 'Active' },
    // Top Finish · para mesas
    { id: 'fo-top-laminate', finishMasterId: 'fm-top', finishOptionName: 'Laminate', status: 'Active' },
    { id: 'fo-top-veneer', finishMasterId: 'fm-top', finishOptionName: 'Wood Veneer', status: 'Active' },
    // Base Finish · para stools/chairs
    { id: 'fo-base-steel', finishMasterId: 'fm-base', finishOptionName: 'Steel', status: 'Active' },
    { id: 'fo-base-wood', finishMasterId: 'fm-base', finishOptionName: 'Wood', status: 'Active' },
]

/* ═══════════════════════════════════════════════════════════════════════
   FinishValues · valores finales con precio + swatch
   ═══════════════════════════════════════════════════════════════════════ */

export const FINISH_VALUES: FinishValue[] = [
    // Frame · Powder Coat
    { id: 'fv-frame-powder-black', finishOptionId: 'fo-frame-powder', position: 1, finishValueName: 'Matte Black', price: 0, swatch: '#1a1a1a', status: 'Active', description: 'Standard black finish.' },
    { id: 'fv-frame-powder-white', finishOptionId: 'fo-frame-powder', position: 2, finishValueName: 'Arctic White', price: 0, swatch: '#f8f8f8', status: 'Active' },
    { id: 'fv-frame-powder-graphite', finishOptionId: 'fo-frame-powder', position: 3, finishValueName: 'Graphite', price: 15, swatch: '#4a4a4a', status: 'Active' },
    { id: 'fv-frame-powder-slate', finishOptionId: 'fo-frame-powder', position: 4, finishValueName: 'Slate Grey', price: 15, swatch: '#6b7280', status: 'Active' },
    // Frame · Chrome
    { id: 'fv-frame-chrome-polished', finishOptionId: 'fo-frame-chrome', position: 1, finishValueName: 'Polished', price: 45, swatch: '#c0c0c0', status: 'Active', description: 'Premium mirror polished chrome finish.' },
    { id: 'fv-frame-chrome-brushed', finishOptionId: 'fo-frame-chrome', position: 2, finishValueName: 'Brushed', price: 35, swatch: '#a8a8a8', status: 'Active' },
    // Frame · Wood
    { id: 'fv-frame-wood-oak', finishOptionId: 'fo-frame-wood', position: 1, finishValueName: 'Oak Natural', price: 80, swatch: '#c8a274', status: 'Active' },
    { id: 'fv-frame-wood-walnut', finishOptionId: 'fo-frame-wood', position: 2, finishValueName: 'Walnut', price: 95, swatch: '#5b3a29', status: 'Active' },
    // Fase P2.2 · sample discontinued · el UI oculta por default via valuesForOption()
    // filter status='Active'. Sirve como validación del pattern silver status per-entity.
    { id: 'fv-frame-wood-teak-legacy', finishOptionId: 'fo-frame-wood', position: 3, finishValueName: 'Teak (legacy)', price: 110, swatch: '#8b6f47', status: 'Discontinued', description: 'Discontinuado por restricciones de sourcing responsable.' },

    // Fabric · Grade 1
    { id: 'fv-fabric-g1-slate', finishOptionId: 'fo-fabric-g1', position: 1, finishValueName: 'Slate', price: 0, swatch: '#6b7280', status: 'Active' },
    { id: 'fv-fabric-g1-navy', finishOptionId: 'fo-fabric-g1', position: 2, finishValueName: 'Navy', price: 0, swatch: '#1e3a5f', status: 'Active' },
    { id: 'fv-fabric-g1-ivory', finishOptionId: 'fo-fabric-g1', position: 3, finishValueName: 'Ivory', price: 0, swatch: '#f5f0e8', status: 'Active' },
    // Fabric · Grade 3
    { id: 'fv-fabric-g3-forest', finishOptionId: 'fo-fabric-g3', position: 1, finishValueName: 'Forest Green', price: 50, swatch: '#166534', status: 'Active' },
    { id: 'fv-fabric-g3-terracotta', finishOptionId: 'fo-fabric-g3', position: 2, finishValueName: 'Terracotta', price: 50, swatch: '#c2410c', status: 'Active' },
    { id: 'fv-fabric-g3-mustard', finishOptionId: 'fo-fabric-g3', position: 3, finishValueName: 'Mustard', price: 50, swatch: '#d4a574', status: 'Active' },
    // Fabric · Grade 5 (Special · COM equivalents)
    { id: 'fv-fabric-g5-boucle-cream', finishOptionId: 'fo-fabric-g5', position: 1, finishValueName: 'Bouclé Cream', price: 145, swatch: '#faf6ee', status: 'Active', description: 'Textured bouclé fabric · Grade 5 premium.' },
    { id: 'fv-fabric-g5-velvet-emerald', finishOptionId: 'fo-fabric-g5', position: 2, finishValueName: 'Velvet Emerald', price: 165, swatch: '#065f46', status: 'Active' },

    // Shell · Solid Color
    { id: 'fv-shell-solid-white', finishOptionId: 'fo-shell-solid', position: 1, finishValueName: 'Arctic White', price: 0, swatch: '#f8f8f8', status: 'Active' },
    { id: 'fv-shell-solid-black', finishOptionId: 'fo-shell-solid', position: 2, finishValueName: 'Deep Black', price: 0, swatch: '#0a0a0a', status: 'Active' },
    { id: 'fv-shell-solid-coral', finishOptionId: 'fo-shell-solid', position: 3, finishValueName: 'Coral', price: 20, swatch: '#ef4444', status: 'Active' },
    // Shell · Metallic
    { id: 'fv-shell-metallic-silver', finishOptionId: 'fo-shell-metallic', position: 1, finishValueName: 'Silver Metallic', price: 55, swatch: '#c0c0c0', status: 'Active' },
    { id: 'fv-shell-metallic-copper', finishOptionId: 'fo-shell-metallic', position: 2, finishValueName: 'Copper Metallic', price: 65, swatch: '#b87333', status: 'Active' },

    // Top · Laminate
    { id: 'fv-top-laminate-warm-oak', finishOptionId: 'fo-top-laminate', position: 1, finishValueName: 'Warm Oak', price: 0, swatch: '#c8a274', status: 'Active' },
    { id: 'fv-top-laminate-linen', finishOptionId: 'fo-top-laminate', position: 2, finishValueName: 'Linen White', price: 0, swatch: '#f4ecd6', status: 'Active' },
    { id: 'fv-top-laminate-concrete', finishOptionId: 'fo-top-laminate', position: 3, finishValueName: 'Concrete', price: 25, swatch: '#8a8a8a', status: 'Active' },
    // Top · Wood Veneer
    { id: 'fv-top-veneer-walnut', finishOptionId: 'fo-top-veneer', position: 1, finishValueName: 'Walnut Veneer', price: 120, swatch: '#5b3a29', status: 'Active' },
    { id: 'fv-top-veneer-cherry', finishOptionId: 'fo-top-veneer', position: 2, finishValueName: 'Cherry Veneer', price: 135, swatch: '#8b3a1f', status: 'Active' },

    // Base · Steel
    { id: 'fv-base-steel-black', finishOptionId: 'fo-base-steel', position: 1, finishValueName: 'Black Steel', price: 0, swatch: '#1a1a1a', status: 'Active' },
    { id: 'fv-base-steel-chrome', finishOptionId: 'fo-base-steel', position: 2, finishValueName: 'Chrome Steel', price: 40, swatch: '#c0c0c0', status: 'Active' },
    // Base · Wood
    { id: 'fv-base-wood-oak', finishOptionId: 'fo-base-wood', position: 1, finishValueName: 'Oak', price: 60, swatch: '#c8a274', status: 'Active' },
    { id: 'fv-base-wood-walnut', finishOptionId: 'fo-base-wood', position: 2, finishValueName: 'Walnut', price: 75, swatch: '#5b3a29', status: 'Active' },
]

/* ═══════════════════════════════════════════════════════════════════════
   Helpers · lookup + navigation en el árbol Finishes
   ═══════════════════════════════════════════════════════════════════════ */

export function findFinishMasterById(id: string): FinishMaster | undefined {
    return FINISH_MASTERS.find(m => m.id === id)
}

/** Legacy bridge · lookup por masterFinishName (para migrar `linkedFinishMaster: string[]`). */
export function findFinishMasterByName(name: string): FinishMaster | undefined {
    return FINISH_MASTERS.find(m => m.masterFinishName === name)
        // Backward compat con nombres cortos ('Frame', 'Fabric') sin sufijo 'Finish'
        ?? FINISH_MASTERS.find(m => m.masterFinishName.startsWith(name))
}

export function findFinishOptionById(id: string): FinishOption | undefined {
    return FINISH_OPTIONS.find(o => o.id === id)
}

export function findFinishValueById(id: string): FinishValue | undefined {
    return FINISH_VALUES.find(v => v.id === id)
}

/** Fase P2.2 · Options de un FinishMaster, filtered por status='Active'
 *  (silver `finishOptionStatus`).
 *  @param includeAll · true para incluir Discontinued/Draft. */
export function optionsForMaster(finishMasterId: string, includeAll = false): FinishOption[] {
    return FINISH_OPTIONS
        .filter(o => o.finishMasterId === finishMasterId)
        .filter(o => includeAll || o.status === 'Active')
}

/** Fase P2.2 · Values de un FinishOption, ordenados por position asc,
 *  filtered por status='Active' (silver `finishValueStatus`). */
export function valuesForOption(finishOptionId: string, includeAll = false): FinishValue[] {
    return FINISH_VALUES
        .filter(v => v.finishOptionId === finishOptionId)
        .filter(v => includeAll || v.status === 'Active')
        .sort((a, b) => a.position - b.position)
}

/** All values de un master (todos los sub-options aplanados) · util para
 *  UI que quiera mostrar el catálogo completo agrupado por option.
 *  Filter cascadea · masters/options/values con status !== 'Active' se
 *  ocultan por default. */
export function valuesForMasterGrouped(finishMasterId: string, includeAll = false): Array<{ option: FinishOption; values: FinishValue[] }> {
    return optionsForMaster(finishMasterId, includeAll).map(option => ({
        option,
        values: valuesForOption(option.id, includeAll),
    }))
}

/** Fase P2.2 · FinishMasters filtrados por tenant + status='Active'. */
export function finishMastersForTenant(tenantId: string | null, includeAll = false): FinishMaster[] {
    return FINISH_MASTERS
        .filter(m => m.tenantId === undefined || m.tenantId === tenantId)
        .filter(m => includeAll || m.status === 'Active')
}

/**
 * Legacy bridge · convierte `linkedFinishMaster: string[]` (nombres cortos)
 * al nuevo shape `Array<{ masterFinishId, masterFinishPosition }>`.
 * Útil para migrar seed data progresivamente sin editar cada ProductGroup.
 */
export function resolveLegacyLinkedFinishMaster(
    names: string[],
): Array<{ masterFinishId: string; masterFinishPosition: number }> {
    return names
        .map((name, idx) => {
            const master = findFinishMasterByName(name)
            if (!master) return null
            return { masterFinishId: master.id, masterFinishPosition: idx + 1 }
        })
        .filter((x): x is { masterFinishId: string; masterFinishPosition: number } => x !== null)
}
