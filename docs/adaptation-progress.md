# Adaptation Progress · expert-catalog → silver schema

Tracker de ejecución del roadmap definido en [docs/silver-schema-gap-analysis.md](./silver-schema-gap-analysis.md).

Objetivo · alinear el prototype `expert-catalog` con el silver schema de producción (`product_data_management` TypeORM entity). Se ejecuta por fases P0-P3 para ir validando incrementalmente y reduciendo riesgo.

**Estrategia**:
- Cada fase = 1 o pocos commits atómicos.
- Backward compat vía **type aliases legacy** cuando el rename es cross-cutting.
- Zero breaking changes en la UI · todos los refactors preservan comportamiento visible.
- Cada fase termina con: TS check 0 errors + smoke test manual + walkthrough en chat.

**Notación**:
- 🟡 en progreso · 🟢 completada · 🔴 bloqueada · ⚪ pending

---

## Estado general

| Fase | Descripción | Estado | Commits | Fecha |
|---|---|---|---|---|
| **P0.1** | Renames semánticos low-risk (linked*, Category alias, Catalog.status) | 🟢 | `6fb5096` | 2026-07-06 |
| **P1.1** | Catalogue layer (nueva entidad separada de Manufacturer) | ⚪ | — | — |
| **P1.2** | Currency entity + currencyId multi-level | ⚪ | — | — |
| **P1.3** | Options normalizado 2 niveles (OptionMaster + OptionGroupValue) | ⚪ | — | — |
| **P1.4** | Finishes normalizado 3 niveles (FinishMaster + FinishOption + FinishValue) | ⚪ | — | — |
| **P2.1** | Multi-tenant per-entity (catalogueTenantId, optionMasterTenantId, finishMasterTenantId) | ⚪ | — | — |
| **P2.2** | Status per-entity (6 nuevos status independientes) | ⚪ | — | — |
| **P2.3** | Record header pattern (id bigint + recordNumber + recordCreatedAt + tenantId) | ⚪ | — | — |
| **P2.4** | Drawings 2D/3D discriminados | ⚪ | — | — |
| **P3.1** | Jerarquía universal documentada (level/isProject/parent*) | ⚪ | — | — |
| **P3.2** | Overlay documented (Auxiliary tables recommended) | ⚪ | — | — |

---

## Fase P0.1 · Renames semánticos low-risk

**Time estimate**: ~1 día
**Risk**: bajo
**Backward compat**: type aliases legacy · ambos nombres funcionan mientras se migra la codebase.

### Scope

1. `ProductGroup.linkedOptionGroupCodes` → `ProductGroup.linkedOptionGroup` (matching silver `linkedOptionGroup`)
2. `ProductGroup.linkedFinishMasterCodes` → `ProductGroup.linkedFinishMaster`
3. `Category` (types.ts:196) marcado como alias legacy de `Section` con JSDoc `@deprecated`
4. `Catalog.status` enum comment · aclarar que en silver es text libre (no closed enum)
5. Actualizar helpers que consumen los campos renombrados

### Files touched

- `src/catalog/types.ts` · rename fields + deprecated JSDoc
- `src/catalog/data/productGroups.ts` · migración del seed (linkedOptionGroupCodes → linkedOptionGroup en las ~22 rows)
- Todos los consumers de linkedOptionGroupCodes / linkedFinishMasterCodes (grep del codebase)

### Verification

1. `npx tsc --noEmit` · 0 errors
2. `localhost:8086` · abrir cualquier Product en Product Catalog → tab **Overview** debe seguir mostrando "Used in Space Type Settings" cuando aplica (consumer de linkedFinishMaster/OptionGroup)
3. Grid Spaces sigue mostrando 11 SpaceTypes con settings
4. `docs/silver-schema-gap-analysis.md` línea de `linkedOptionGroup` y `linkedFinishMaster` cambia de ⚠️ partial a ✅ verified (semantic + syntactic)

### Follow-up

- Cleanup phase (Cleanup.1) al final del roadmap para eliminar los aliases deprecated.

---

## Fase P1.1 · Catalogue layer

_Pendiente arranque tras P0.1._

**Time estimate**: ~3-5 días
**Risk**: medio

### Scope
- Nueva `interface Catalogue { id, catalogueNumber, name, activeDate, expirationDate, status, currencyId, tenantId }`
- `Catalog` (mock reactivo) consume Catalogue como sub-tipo (backward compat)
- Seed data · 1 Catalogue mock por Manufacturer para probar la layer

_[Detalles se completan al arrancar]_

---

## Fase P1.2 · Currency multi-level

_Pendiente arranque tras P1.1._

**Time estimate**: ~2-3 días
**Risk**: bajo (depende de P1.1)

### Scope
- `interface Currency { id, code, name, type }`
- `Catalogue.currencyId`, `Product.currencyId` (opt), `FinishValue.currencyId` (P1.4)
- Deprecar `SpaceBundle.currency` como derivable del Catalogue

---

## Fase P1.3 · Options normalizado 2 niveles

_Pendiente arranque tras P1.1._

**Time estimate**: ~5-7 días
**Risk**: alto

### Scope
- `interface OptionMaster { id, optionGroupCode, name, notes, status, tenantId }`
- `interface OptionGroupValue { id, optionMasterId, position, value, description, status }`
- Migrar `Product.fabricOptions[]` (~50 items) al modelo 2-niveles
- `ProductGroup.linkedOptionGroup: { optionMasterId, position }[]` reemplaza el array de strings
- UI VariantsTab: agrupar values por master
- UI QuoteTab: selector grouped

### Riesgo
- Cambia shape de `QuoteLineItem.fabricId` → puede afectar drafts existentes en localStorage. Considerar migration on-load.

---

## Fase P1.4 · Finishes normalizado 3 niveles (MAX riesgo)

_Pendiente arranque tras P1.3._

**Time estimate**: ~7-10 días
**Risk**: muy alto

### Scope
- `interface FinishMaster { id, masterFinishName, status, tenantId }`
- `interface FinishOption { id, finishMasterId, name, status }`
- `interface FinishValue { id, finishOptionId, position, name, description, status, price, currencyId, swatch? }`
- Migrar `Product.finishes[]` al modelo 3-niveles
- Colorway como caso especial de FinishValue con swatch = hex
- UI VariantsTab: dropdown 2-level (master → option → value)

### Riesgo
- Cross-cutting sobre 15+ archivos.
- Cambia shape de `QuoteLineItem.finishId`.

---

## Fase P2.1-P2.4 · Multi-tenant + Status + Record header + Drawings

_Documentado en detalle en `docs/silver-schema-gap-analysis.md` sección Roadmap._

Se ejecuta después de P1 · el orden se define al llegar (dependencia del feedback del equipo BE).

---

## Fase P3.1-P3.2 · Documentation only

- P3.1 · Jerarquía universal documentada (`level`/`isProject`/`parent*` derivables en processor bronze→silver)
- P3.2 · Overlay documented (Spaces, Quote, tenant data como Auxiliary tables)

Sin código · solo docs.

---

## Cleanup phases (post-implementación)

### Cleanup.1 · Remove legacy aliases

Después de que TODA la codebase use los nuevos nombres, eliminar los aliases `@deprecated` introducidos en P0.

### Cleanup.2 · Remove overlay backwards compat

Si en producción se decide adoptar el silver schema completo, eliminar los overlay-only fields de expert-catalog.

---

## Convenciones de reporting por fase

Cada fase completada debe reportar:

1. **En este tracker** · updatear estado a 🟢 con commit hash y fecha
2. **Commit message** · include:
   - Fase (P0.1, P1.1, etc)
   - Files touched summary
   - Backward compat notes
   - Testing steps
3. **Walkthrough en chat** · pasos concretos para verificar visualmente

### Template de commit message

```
refactor(silver): [P0.1] rename linked* fields to match silver schema

Descripción de qué se hizo (2-3 líneas).

Backward compat: type aliases legacy preservan el nombre anterior
como @deprecated. Migration path en Cleanup.1.

Files touched:
- src/catalog/types.ts (rename + aliases)
- src/catalog/data/productGroups.ts (seed migration)
- [otros consumers]

TS check: 0 errors.
Smoke test: [steps concretos].

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

---

## Change log

| Fecha | Cambio |
|---|---|
| 2026-07-06 | Tracker creado. Fase P0.1 arrancando. |
