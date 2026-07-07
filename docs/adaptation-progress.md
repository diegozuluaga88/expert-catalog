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
| **P1.1** | Catalogue layer (nueva entidad separada de Manufacturer) | 🟢 | `3aee52c` | 2026-07-06 |
| **P1.2** | Currency entity + currencyId multi-level | 🟢 | `4659bff` | 2026-07-06 |
| **P1.3.a** | Options normalizado · data model + seed (sin UI) | 🟢 | `da415c9` | 2026-07-06 |
| **P1.3.b.i** | Options UI · VariantsTab "Configurable options" section | 🟢 | `9cdc1ba` | 2026-07-06 |
| **P1.3.b.ii** | Options UI · QuoteTab selector 2-level (coexiste con fabricId) | 🟢 | `f947070` | 2026-07-06 |
| **P1.3.b.iii** | Options UI · migración final QuoteLineItem.fabricId → optionValueId | ⚪ | — | — |
| **P1.4.a** | Finishes 3-niveles · data model + seed (sin UI) | 🟢 | `TBD` | 2026-07-06 |
| **P1.4.b** | Finishes UI · VariantsTab section 3-nivel | ⚪ | — | — |
| **P1.4.c** | Finishes UI · QuoteTab selector + priceModifier en computeLineItemTotals | ⚪ | — | — |
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

## Fase P1.1 · Catalogue layer · 🟢 COMPLETADA

**Time estimate**: ~3-5 días (real: ~30 min)
**Risk**: medio (real: bajo · backward compat sólido)
**Commit**: `TBD`

### Scope ejecutado

- ✅ Nueva `interface Catalogue { id, catalogueNumber, name, activeDate, expirationDate, status, currencyId, tenantId?, manufacturerId? }` en types.ts
- ✅ Nueva `interface Currency { id, code, name, type }` (Currency row-level del silver)
- ✅ `Catalog.catalogueId?: string` opcional para linkear al Catalogue nuevo (backward compat)
- ✅ Seed: 5 Catalogues mock (3 activos por Manufacturer + 1 archived Allermuir 2025 + 1 draft Allermuir EUR)
- ✅ Seed: 4 Currencies (USD/EUR/CAD/GBP)
- ✅ 5 helpers exported: findCatalogueById, findCatalogueByNumber, cataloguesForManufacturer, cataloguesForTenant, currencyCodeForCatalogue, findCurrencyById

### Files touched

- `src/catalog/types.ts` (Catalogue + Currency interfaces + Catalog.catalogueId opcional)
- `src/catalog/data/catalogues.ts` (nuevo · seed CATALOGUES + CURRENCIES + 5 helpers)
- `src/catalog/data/catalogs.ts` (link cada Catalog mock al catalogueId correspondiente)

### Verification

1. `npx tsc --noEmit` · 0 errors
2. Grep test: `findCatalogueById('cat-allsteel-2026')` retorna objeto con currencyId='USD', status='Active', dates 2026-01-01 / 2026-12-31.
3. Zero cambios visibles en UI · Catalog cards del ManageCatalogs siguen renderizándose idénticas.
4. `cataloguesForTenant(null)` retorna los 5 seed (todos globales, ninguno per-tenant en el seed inicial).

### Cross-refs siguientes fases

- P1.2 (Currency multi-level): usa `Currency` interface + integra `catalogueCurrencyId` en pricing display.
- P1.3 (Options): agregar OptionMaster con `tenantId?` similar a Catalogue.
- P2.1 (Multi-tenant): Catalogue ya soporta `tenantId?` · faltaría propagar a OptionMaster + FinishMaster.

---

## Fase P1.2 · Currency multi-level · 🟢 COMPLETADA

**Time estimate**: ~2-3 días (real: ~20 min)
**Risk**: bajo (real: bajo · aditivo, cero breaking)
**Commit**: `TBD`

### Scope ejecutado

- ✅ `interface Currency` ya introducido en P1.1 (`types.ts`)
- ✅ `Product.currencyId?` opcional (types.ts:152)
- ✅ `ProductStub.currencyId?` opcional (productGroups.ts:305)
- ✅ `SpaceBundle.currency` marcado `@deprecated` + `SpaceBundle.currencyId?` nuevo (types.ts:445-455)
- ✅ Helpers `formatPrice(amount, currencyId)` y `formatPriceRange(min, max, currencyId)` en catalogues.ts
- ✅ Symbols: `$` USD, `€` EUR, `£` GBP, `C$` CAD (fallback `$`)
- ✅ Consumers migrados de ejemplo:
  - `ProductCatalogCard.tsx` price + listPrice usan `formatPrice(product.price, product.currencyId)`
  - `SpaceBundleCard.tsx` estimated cost + Add all footer usan `formatPriceRange(min, max, currencyId)`

### Files touched

- `src/catalog/types.ts` · Product.currencyId + SpaceBundle deprecation
- `src/catalog/data/productGroups.ts` · ProductStub.currencyId opcional
- `src/catalog/data/catalogues.ts` · formatPrice + formatPriceRange + CURRENCY_SYMBOLS
- `src/catalog/shop/ProductCatalogCard.tsx` · 4 usos migrados
- `src/catalog/spaces/SpaceBundleCard.tsx` · 2 usos migrados

### Verification

1. `npx tsc --noEmit` · 0 errors
2. `localhost:8086` · UI intact · precios se ven idénticos porque todos los seed products asumen USD (fallback)
3. En consola: `formatPrice(1234.5, 'EUR')` → `"€1,234.50"`, `formatPrice(1234, 'GBP')` → `"£1,234"`, `formatPrice(null)` → `"—"`
4. Consumers restantes que aún hardcodean `$` (deuda para migración incremental):
   - QuotesPage line items totals
   - MiniCartDrawer subtotal
   - ProductDetailPanel QuoteTab / VariantsTab
   - CompareModal price row
   - etc · docs/data-inventory.md tiene lista completa

### Cross-refs siguientes fases

- P1.3 (Options): `OptionGroupValue` no tiene priceModifier con currencyId · fabricoption.priceModifier hereda del Product.currencyId.
- P1.4 (Finishes): `FinishValue.currencyId` será field explícito en el silver schema. Ya preparado el pattern con formatPrice.
- **Cleanup.1**: swap masivo de `.toLocaleString()` hardcoded a `formatPrice()` en todos los consumers restantes (~15-20 archivos).

---

## Fase P1.3.a · Options normalizado · data model + seed · 🟢 COMPLETADA

**Time estimate**: ~2 días (real: ~15 min)
**Risk**: bajo (real: bajo · aditivo)
**Commit**: `TBD`

### Scope ejecutado

- ✅ `interface OptionMaster { id, optionGroupCode, name, notes, status, tenantId? }` (types.ts)
- ✅ `interface OptionGroupValue { id, optionMasterId, position, value, description, status }` (types.ts)
- ✅ `ProductGroup.linkedOptionGroupRefs?: Array<{ optionMasterId, optionGroupPosition }>` nuevo · shape jsonb-style alineada 1:1 con silver
- ✅ `ProductGroup.linkedFinishMasterRefs?: Array<{ masterFinishId, masterFinishPosition }>` placeholder para P1.4
- ✅ `linkedOptionGroup: string[]` marcado `@deprecated` (backward compat mientras se migra)
- ✅ Seed `src/catalog/data/options.ts`:
  - 6 `OPTION_MASTERS` · Armrests, Base, Casters, Shell, Top, Legs (activos globales)
  - 20 `OPTION_GROUP_VALUES` · con position ordering:
    - Armrests: None / Fixed / Adjustable / 4D
    - Base: 4-star / 5-star / Sled / 4-leg
    - Casters: Glides / Hard / Soft
    - Shell: Polypropylene / Upholstered / Mesh
    - Top: Laminate / Wood veneer / Glass
    - Legs: 4-leg metal / Pedestal / Y-base
  - 6 helpers · `findOptionMasterById`, `findOptionMasterByCode`, `findOptionValueById`, `valuesForMaster` (sorted by position), `mastersForTenant`, `resolveLegacyLinkedOptionGroup` (bridge string[]→refs)
- ✅ Showcase enrichment · 3 ProductGroups del seed con `linkedOptionGroupRefs`:
  - CH01 · Armrests + Base + Casters (task chair)
  - CH03 · Base + Casters (meeting chair · no armrests)
  - CH15 · Shell + Base (stool casual · no armrests ni casters)

### Files touched

- `src/catalog/types.ts` · OptionMaster + OptionGroupValue + ProductGroup.linkedOptionGroupRefs + linkedFinishMasterRefs
- `src/catalog/data/options.ts` · nuevo · seed + helpers
- `src/catalog/data/productGroups.ts` · 3 groups enriquecidos con refs

### Verification

1. `npx tsc --noEmit` · 0 errors
2. En consola: `valuesForMaster('om-armrests')` retorna 4 values ordenados por position (None → Fixed → Adjustable → 4D)
3. `resolveLegacyLinkedOptionGroup(['Armrests', 'Base'])` retorna `[{ optionMasterId: 'om-armrests', ... }, { optionMasterId: 'om-base', ... }]` (util para migrar los otros 19 groups del seed sin editar cada uno)
4. Zero cambios visibles en UI · consumers actuales siguen leyendo `linkedOptionGroup: string[]` legacy

### Cross-refs siguientes fases

- **P1.3.b** (UI migration): consumer del `linkedOptionGroupRefs` en:
  - ProductDetailPanel VariantsTab · agrupar `Product.fabricOptions[]` por OptionMaster derivable via inference
  - QuoteTab · selector jerárquico (Armrests → Adjustable en vez de flat Fabric picker)
  - EditQuoteItemPanel · misma lógica
- **P1.4** (Finishes 3-niveles): mismo pattern con FinishMaster/FinishOption/FinishValue
- **Cleanup.1**: usar `resolveLegacyLinkedOptionGroup` para migrar los otros 19 ProductGroups del seed a la nueva shape · después eliminar `linkedOptionGroup: string[]` legacy

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

## Cleanup phases

### Cleanup.1a · Swap masivo `.toLocaleString()` → `formatPrice()` · 🟢 COMPLETADA

**Commits**: `9f034c4` (batch 1) · `958b473` (batch 2) · `76b9582` (batch 3)

15 files migrados en 3 commits auditables:

**Batch 1 · Quote flow** (4 files):
- MiniCartDrawer.tsx · line item + drawer footer subtotal
- QuotesPage.tsx · line item + unitPrice + group subtotal + Selection total
- IngestQuoteModal.tsx · sample docs estimated total
- RequestQuoteModal.tsx · lead pricing

**Batch 2 · Browse flow** (5 files):
- ProductDetailPanel.tsx · 7 usos (sticky identity + QuoteTab totals + line editor + savings + related products)
- ComparePickerModal.tsx · picker card price
- CompareModal.tsx · Price row del table
- SpaceTypesPage.tsx · card "From $X" cost badge
- SpaceTypeDetailPage.tsx · Bundle product price + variant expander price

**Batch 3 · Otros** (4 files):
- ClientPolicyManager.tsx · condition threshold
- SmartRuleBuilderModal.tsx · rule description
- CreateEditSpaceModal.tsx · totalEstimate + picker card + draft item subtotal
- OrderDetail.tsx · 6 usos (items table + line detail netPrice/amount)

**Beneficio**: cero hardcoded `$` en el UI · toda display de precios pasa por formatPrice(x, currencyId?) preparada para catalogues multi-currency.

### Cleanup.1b · ProductGroups seed migration a `linkedOptionGroupRefs` · 🟢 NO-OP

Solo 2 ProductGroups tenían `linkedOptionGroup` (CH01 + CH03) y ambos ya recibieron `linkedOptionGroupRefs` en P1.3.a. CH15 también obtuvo refs. Los demás 19 ProductGroups no tienen `linkedOptionGroup` (tablets/lamps/storage no tienen options configurables) · su estado vacío es correcto.

No hay migración pendiente. El helper `resolveLegacyLinkedOptionGroup` queda disponible para P1.4 (Finishes) donde sí hay 22 groups con `linkedFinishMaster` para migrar.

### Cleanup.2 · Remove legacy aliases (post-implementación total)

Después de que TODA la codebase use los nuevos nombres exclusivamente:
- Remover `ProductGroup.linkedOptionGroupCodes` (P0.1 alias)
- Remover `ProductGroup.linkedFinishMasterCodes` (P0.1 alias)
- Remover `ProductGroup.linkedOptionGroup: string[]` legacy (P1.3.a)
- Remover `ProductGroup.linkedFinishMaster: string[]` legacy (P1.4 futuro)
- Remover `SpaceBundle.currency: 'USD'` legacy (P1.2)

### Cleanup.3 · Remove overlay backwards compat

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
