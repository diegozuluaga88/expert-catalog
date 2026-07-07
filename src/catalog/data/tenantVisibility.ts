// Fase P2.1 · Tenant visibility helper (2026-07-06)
//
// Pattern silver "multi-tenant per-entity": entidades como Catalogue,
// OptionMaster y FinishMaster pueden tener `tenantId?` opcional. Cuando
// tenantId es undefined, la entidad es GLOBAL (visible a todos). Cuando
// tiene un valor, es TENANT-SCOPED (visible solo al tenant especificado ·
// custom catalogues/options/finishes negociadas por un dealer).
//
// Este helper genérico centraliza la lógica de visibilidad para evitar
// repetirla en cada consumer (Configurable sections, dropdowns, listas
// de admin, etc).

/** Cualquier entidad silver que pueda tener `tenantId?` opcional. */
export interface TenantScoped {
    tenantId?: string
}

/**
 * Retorna true si la entidad es visible al tenant dado.
 *
 * @param entity · cualquier objeto con `tenantId?: string`
 * @param currentTenantId · slug del tenant activo (`useTenant().currentTenant`)
 *
 * Reglas:
 * - entity.tenantId === undefined → GLOBAL, visible a todos
 * - entity.tenantId === currentTenantId → TENANT-SCOPED, visible solo si matchea
 * - entity.tenantId !== currentTenantId → oculto
 *
 * @example
 *   isVisibleToTenant(catalogue, 'special-t')
 *   // true si catalogue es global o pertenece a special-t
 */
export function isVisibleToTenant<T extends TenantScoped>(
    entity: T,
    currentTenantId: string | null,
): boolean {
    if (entity.tenantId === undefined) return true // global
    return entity.tenantId === currentTenantId
}

/**
 * Filtra una lista de entidades preservando solo las visibles al tenant.
 * Wrapper conveniente sobre `isVisibleToTenant`.
 */
export function filterVisibleToTenant<T extends TenantScoped>(
    entities: T[],
    currentTenantId: string | null,
): T[] {
    return entities.filter(e => isVisibleToTenant(e, currentTenantId))
}
