# Silver Schema Gap Analysis · expert-catalog vs Notion

Última actualización · 2026-07-06 · **Versión final** con validaciones del silver schema técnico completo.

## Sources

- **Doc 1** · [Product+ Options — Plain-Language Schema Guide (for the Product Team)](https://app.notion.com/p/agenticdream/Product-Options-Plain-Language-Schema-Guide-for-the-Product-Team-389acc211ff1814a8a8bca3946f58f15)
- **Doc 2** · [Strata — Product Data Management (silver schema)](https://app.notion.com/p/agenticdream/Strata-Product-Data-Management-silver-schema-388acc211ff181299249d5192d3f7820) · PDF con TypeORM entity `ProductDataManagementTargetEntity` (recibido en el chat 2026-07-06)

---

## Ejecutivo

El **silver schema** es una **tabla denormalizada one-big-table** en PostgreSQL (`product_data_management` en `targetSchema`), grano = 1 `productItem` por fila con todo el contexto denormalizado (catalogue, section, group, options, finishes, currency, status, jerarquía). Origen: se construye desde `record_additional_fields` (bronze) vía el processor `product-data-management`.

El proyecto `expert-catalog` (prototype front) está diseñado como **modelo normalizado en TypeScript** (interfaces separadas para Product, Catalog, Section, ProductGroup, Finish, etc). Esto es una **diferencia arquitectural fundamental**: silver aplana para queries eficientes; expert-catalog normaliza para UI mantenible. Ambos son válidos y complementarios · el mapping producción bronze→silver→UI vive en `product-data-management-mapping.ts` (backend).

**Alineación a nivel campo · ~65% verified** (subió de 55% después de doc 2). Los gaps son estructurales, no de intención:

1. **Options/Finishes**: silver tiene 3 tables jerárquicos con position (`OptionMaster→OptionGroupValue`, `FinishMaster→FinishOption→FinishValue`). Expert-catalog aplasta en 1 array flat por Product. Refactor P1.
2. **Multi-tenancy per-entity**: silver tiene tenantId en cada Master (catalogueTenantId, optionMasterTenantId, finishMasterTenantId). Expert-catalog no modela tenancy en catalog data. Refactor P2.
3. **Status per-entity**: silver tiene status independiente en cada nivel (catalogueStatus, optionMasterStatus, optionGroupValueStatus, finishMasterStatus, finishOptionStatus, finishValueStatus, statusId/productItemStatusValue). Expert-catalog solo tiene `Product.itemStatus`. Refactor P2.
4. **Currency multi-level**: silver puede tener currency diferente por Catalogue, ProductItem y FinishValue (catalogueCurrencyId, productItemCurrencyId, finishValueCurrencyId). Expert-catalog solo tiene `SpaceBundle.currency: 'USD'`. Refactor P1.
5. **Jerarquía universal**: silver tiene `level`/`isProject`/`parentId`/`parentRecordNumber`/`parentRecordTypeName` como pattern común a todas las entities silver (soporta árboles). Expert-catalog no modela árbol. Overlay concept.
6. **Record header pattern**: silver usa `id: bigint` PK + `recordNumber: text` + `recordCreatedAt: timestamp` + `tenantId: bigint` con relación ManyToOne a Tenant. Expert-catalog usa strings como IDs. Refactor P2.

**Overlay Spaces + Quote system** siguen siendo capa nuestra fuera del silver schema · debe documentarse como tablas auxiliares en la migration.

---

## Estructura del silver schema (doc 2)

**Tabla destino**: `product_data_management` (schema `targetSchema`).

**Grano**: un `productItem` por fila, con contexto de catalogue/product group/product type/status denormalizado.

**Origen**: `record_additional_fields` (bronze) → processor `product-data-management` → mapping `product-data-management-mapping.ts` → target.

**Convenciones** (heredadas de `msa-data-target.entity.ts`):
- `id: bigint` PK (= `record_header.id`)
- `recordNumber: text`
- `recordCreatedAt: timestamp`
- `tenantId: bigint` + ManyToOne a `TenantTargetEntity`
- Jerarquía común: `level`, `isProject`, `parentId`, `parentRecordNumber`, `parentRecordTypeName`

**Grupos de campos** (11 grupos + 2 comunes):

| Grupo | Campos (columnas) | Purpose |
|---|---|---|
| Record header | id, recordNumber, recordCreatedAt, tenantId | Común a todas las entities silver |
| Currency (row-level) | currencyId, currencyName, currencyCode, currencyType | Moneda del item/catálogo |
| ProductItemStatus | productItemStatusId, productItemStatusValue | Estado del product item |
| Catalogue | catalogueId, catalogueNumber, catalogueName, catalogueActiveDate, catalogueExpirationDate, catalogueStatus, catalogueCurrencyId, catalogueTenantId | Catálogo padre |
| OptionMaster | optionMasterId, optionGroupCode, optionGroupNotes, optionMasterStatus, optionMasterTenantId | Master de opciones (categoría · ej. "Armrests") |
| OptionGroupValue | optionGroupValueId, optionGroupValuePosition, optionValue, optionDescription, optionGroupValueStatus, optionMasterIdRef | Valor específico dentro del master (ej. "Adjustable") |
| FinishMaster | finishMasterId, masterFinishName, finishMasterStatus, finishMasterTenantId | Categoría de finish (ej. "Frame Finish") |
| FinishOption | finishOptionId, finishOptionName, finishOptionStatus, finishMasterIdRef | Sub-grupo (ej. "Powder Coat") |
| FinishValue | finishValueId, finishValuePosition, finishValueName, finishValueDescription, finishValueStatus, finishValuePrice, finishValueCurrencyId, finishOptionIdRef | Valor final con precio (ej. "Matte Black", +$0) |
| Section | sectionId, sectionName, sectionCatalogueId | Sección del catálogo (chapter) |
| ProductType | productTypeId, productTypeName | Tipo (Chair, Table, etc) |
| ProductGroup | productGroupId, productGroupCode, productGroupDescription, sectionIdRef, productTypeIdRef, linkedOptionGroup, linkedFinishMaster | Grupo · linked* son `jsonb` arrays |
| ProductItem (grano) | productItemId, productItemCode, productItemDescription, drawingName2D, drawingName3D, productItemPrice, productItemCurrencyId, productGroupIdRef, statusId | Grano de la fila |
| Jerarquía | level, isProject, parentId, parentRecordNumber, parentRecordTypeName | Común a todas las entities silver |

**Reglas de tipado**:
- `string` → `text`
- Precios (`finishValuePrice`, `productItemPrice`) → `numeric(18,2)`
- Posiciones (`optionGroupValuePosition`, `finishValuePosition`) → `int`
- Fechas (`catalogueActiveDate`, `catalogueExpirationDate`) → `timestamp`
- Arrays (`linkedOptionGroup`, `linkedFinishMaster`) → `jsonb`

**Estructura de los jsonb arrays**:
```ts
linkedOptionGroup:  Array<{ optionGroupId?: string; optionGroupPosition?: number }>
linkedFinishMaster: Array<{ masterFinishId?: string; masterFinishPosition?: number }>
```

---

## Leyenda de estados

- ✅ `verified` · alineado 1:1 confirmado por doc 1 + doc 2
- ⚠️ `partial` · semántica cercana, requiere rename o pequeño ajuste
- 🔀 `structural` · estructura fundamentalmente diferente (flat vs normalized, string vs bigint, etc)
- ❌ `gap` · el campo silver no existe en expert-catalog
- 🌀 `overlay` · el campo/entidad de expert-catalog no aparece en silver (decisión intencional)

---

## Tabla comparativa · field-by-field

### Record header (común a todas las silver entities)

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `id` | `bigint` PK | Product.id / Catalog.id · varía (string vs number) | 🔀 structural | expert-catalog usa string IDs en la mayoría; Catalog.id: number. Producción: bigint con relación al record_header |
| `recordNumber` | `text` | ❌ | ❌ gap | No hay recordNumber concept en expert-catalog |
| `recordCreatedAt` | `timestamp` | Product/Catalog no lo tienen; QuoteDraft.createdAt sí (ISO string) | ⚠️ partial | Formato diferente (ISO vs Date TypeORM) |
| `tenantId` | `bigint` + ManyToOne Tenant | ❌ | ❌ gap | expert-catalog usa `tenantSlug: string` en QuoteContext localStorage, no en catalog data |

**Hallazgo #1 · Record header pattern ausente en catalog data**: el silver aplica el pattern (id/recordNumber/recordCreatedAt/tenantId) a TODAS las entities. expert-catalog solo aplica timestamps a QuoteDraft y CustomSpaces. Refactor P2 · agregar este pattern a Product/Catalog/etc como base para la migración.

### Currency (row-level)

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `currencyId` | `text` | ❌ | ❌ gap | Silver denormaliza currency del catalogue en cada row · expert-catalog no lo tiene |
| `currencyName` | `text` | ❌ | ❌ gap | idem |
| `currencyCode` | `text` | `SpaceBundle.currency: 'USD'` (types.ts:334) | ⚠️ partial | Solo en overlay Bundle, no en catalog |
| `currencyType` | `text` | ❌ | ❌ gap | No modelado (fiat/crypto?) |

### ProductItemStatus

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `productItemStatusId` | `text` | ❌ | ❌ gap | Silver tiene FK explícita a status table (id) |
| `productItemStatusValue` | `text` | `Product.itemStatus` (types.ts:43) | ✅ verified | 1:1 semantic. Silver es texto legible, expert-catalog enum |

### Catalogue

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `catalogueId` | `text` | `Catalog.id: number` (types.ts:204) | 🔀 structural | Silver es text (UUID/slug?), expert-catalog es number |
| `catalogueNumber` | `text` | ❌ | ❌ gap | ID code separado del name · "SC-2025-SEAT" · no existe |
| `catalogueName` | `text` | `Catalog.name` (types.ts:205) | ✅ verified | 1:1 |
| `catalogueActiveDate` | `timestamp` | ❌ | ❌ gap | No modelado. `Catalog.lastSync: string` no cubre esto |
| `catalogueExpirationDate` | `timestamp` | ❌ | ❌ gap | No modelado |
| `catalogueStatus` | `text` | `Catalog.status` (types.ts:212) | ⚠️ partial | Enums diferentes · expert-catalog `'Active'/'Update Avail.'/'Archived'` vs silver es text libre |
| `catalogueCurrencyId` | `text` | ❌ | ❌ gap | FK a currency table · no existe |
| `catalogueTenantId` | `text` | ❌ | ❌ gap | Multi-tenant per catalog · no modelado |

**Hallazgo #2 · Catalogue layer con multi-tenant + dates + currency**: doc 2 confirma que Catalogue tiene su propio tenantId (catálogos custom per-tenant), su propio currencyId (Steelcase 2025 USD Seating vs 2025 EUR Seating), y date range (active/expiration). expert-catalog cubre solo name/status. **P1 refactor**.

### OptionMaster (categoría de opciones)

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `optionMasterId` | `text` | ❌ | ❌ gap | Silver tiene tabla OptionMaster (ej. { id: "om-armrests", name: "Armrests" }) · expert-catalog no |
| `optionGroupCode` | `text` | (indirecto via `ProductGroup.linkedOptionGroupCodes[]`) | 🔀 structural | Solo aparece como string en el array del ProductGroup, sin entity separada |
| `optionGroupNotes` | `text` | ❌ | ❌ gap | Notas de la categoría · no modelado |
| `optionMasterStatus` | `text` | ❌ | ❌ gap | Status per option master · no modelado |
| `optionMasterTenantId` | `text` | ❌ | ❌ gap | Multi-tenant per master · no modelado |

### OptionGroupValue (valor específico dentro del master)

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `optionGroupValueId` | `text` | `FabricOption.id` (types.ts:59) | ⚠️ partial | Semantic close, expert-catalog usa `FabricOption` |
| `optionGroupValuePosition` | `int` | ❌ | ❌ gap | Display order · no modelado (orden del array literal) |
| `optionValue` | `text` | `FabricOption.name` (types.ts:60) | ✅ verified | 1:1 |
| `optionDescription` | `text` | ❌ | ❌ gap | Description del valor · no existe |
| `optionGroupValueStatus` | `text` | ❌ | ❌ gap | Status per value · no modelado |
| `optionMasterIdRef` | `text` | ❌ | ❌ gap | FK al OptionMaster · no existe (values no están agrupados) |

**Hallazgo #3 · Options normalizado 2 niveles vs flat**: silver tiene `OptionMaster` (Armrests) + `OptionGroupValue` (Adjustable) con FK reverse. expert-catalog aplasta todo en `Product.fabricOptions[]` sin agrupación por master. **P1 refactor cross-cutting** (afecta ProductDetailPanel.QuoteTab + VariantsTab + computeLineItemTotals).

### FinishMaster (categoría de finishes)

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `finishMasterId` | `text` | ❌ | ❌ gap | Silver tiene tabla FinishMaster (ej. { id: "fm-frame", name: "Frame Finish" }) · expert-catalog no |
| `masterFinishName` | `text` | ❌ | ❌ gap | El nombre de la categoría (Frame Finish, Fabric Finish, etc) |
| `finishMasterStatus` | `text` | ❌ | ❌ gap | Status per master · no modelado |
| `finishMasterTenantId` | `text` | ❌ | ❌ gap | Multi-tenant per master |

### FinishOption (sub-grupo)

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `finishOptionId` | `text` | ❌ | ❌ gap | Sub-grupo (ej. { id: "fo-powder-coat", name: "Powder Coat" }) · no existe |
| `finishOptionName` | `text` | ❌ | ❌ gap | Nombre del sub-grupo |
| `finishOptionStatus` | `text` | ❌ | ❌ gap | Status per option · no modelado |
| `finishMasterIdRef` | `text` | ❌ | ❌ gap | FK al FinishMaster · no existe |

### FinishValue (valor final con precio)

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `finishValueId` | `text` | `Finish.id` (types.ts:48) | ⚠️ partial | Semantic close |
| `finishValuePosition` | `int` | ❌ | ❌ gap | Display order · no modelado |
| `finishValueName` | `text` | `Finish.name` (types.ts:49) | ⚠️ partial | Existe pero flat (3 niveles silver → 1 expert-catalog) |
| `finishValueDescription` | `text` | ❌ | ❌ gap | Description del valor · no existe |
| `finishValueStatus` | `text` | ❌ | ❌ gap | Status per value · no modelado |
| `finishValuePrice` | `numeric(18,2)` | `Finish.priceModifier: number` (types.ts:52) | ✅ verified | 1:1 semantic. Silver es decimal(18,2), expert-catalog es JS number |
| `finishValueCurrencyId` | `text` | ❌ | ❌ gap | Currency per finish value · no modelado |
| `finishOptionIdRef` | `text` | ❌ | ❌ gap | FK a FinishOption · no existe |

**Hallazgo #4 · Finishes normalizado 3 niveles vs flat** (severity: MAX): silver tiene 3 tables (`FinishMaster → FinishOption → FinishValue`) con FKs reversas + position + currency per value. expert-catalog aplasta todo en `Product.finishes[]` (1 nivel). **P1 refactor de mayor impacto** · afecta 15+ archivos.

### Section

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `sectionId` | `text` | `Section.id` (types.ts:244) | ✅ verified | 1:1 |
| `sectionName` | `text` | `Section.name` (types.ts:245) | ✅ verified | 1:1 |
| `sectionCatalogueId` | `text` | ❌ | ❌ gap | FK explícita del Section al Catalogue · en expert-catalog Section es global |

**Hallazgo #5 · Section pertenece a un Catalogue**: silver modela `sectionCatalogueId` como FK explícita · una Section vive dentro de UN Catalogue específico. expert-catalog tiene Sections como global (mismas Sections para todos los Catalogs). Refactor: agregar catalogueId a Section, y seed data por catalogue.

### ProductType

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `productTypeId` | `text` | `ProductType.id` (types.ts:251) | ✅ verified | 1:1 |
| `productTypeName` | `text` | `ProductType.name` (types.ts:252) | ✅ verified | 1:1 |

### ProductGroup

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `productGroupId` | `text` | `ProductGroup.id` (types.ts:261) | ✅ verified | 1:1 |
| `productGroupCode` | `text` | `ProductGroup.code` (types.ts:262) | ✅ verified | 1:1 (CH15, TB04, AL13 style) |
| `productGroupDescription` | `text` | `ProductGroup.description` (types.ts:264) | ✅ verified | 1:1 |
| `sectionIdRef` | `text` | `ProductGroup.sectionId` (types.ts:267) | ✅ verified | 1:1 FK. Silver usa "IdRef" suffix, expert-catalog no. Rename opcional |
| `productTypeIdRef` | `text` | `ProductGroup.productTypeId` (types.ts:268) | ✅ verified | 1:1 FK |
| `linkedOptionGroup` | `jsonb` `Array<{ optionGroupId?, optionGroupPosition? }>` | `ProductGroup.linkedOptionGroupCodes: string[]` (types.ts:269) | 🔀 structural | Silver es jsonb de objetos con ID + position; expert-catalog es array de strings. **Refactor P1** |
| `linkedFinishMaster` | `jsonb` `Array<{ masterFinishId?, masterFinishPosition? }>` | `ProductGroup.linkedFinishMasterCodes: string[]` (types.ts:270) | 🔀 structural | Idem |

**Hallazgo #6 · linked* con position embebida**: silver tiene el ORDEN embedido en cada elemento del jsonb array (`optionGroupPosition`, `masterFinishPosition`). expert-catalog solo tiene arrays sin position. Refactor P1 · agregar position al type + seed data.

**Hallazgo #7 · Referencias jsonb vs strings**: silver referencia por `optionGroupId` (FK al OptionMaster.id), expert-catalog referencia por `linkedOptionGroupCodes: string[]` (nombres literales "Armrests"). Refactor cuando se creen las tables OptionMaster y FinishMaster.

### ProductItem (grano de la fila)

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `productItemId` | `text` | `Product.id: string` (types.ts:84) · `ProductStub.id` (productGroups.ts) | ✅ verified | 1:1 |
| `productItemCode` | `text` | `ProductStub.productItemCode` (productGroups.ts:295) · `Product.productItemCode?` (types.ts:139) | ✅ verified | Existe en 2 lugares |
| `productItemDescription` | `text` | `ProductStub.name` + `Product.description` | ⚠️ partial | Silver 1 campo, expert-catalog split entre name (short) + description (long) |
| `drawingName2D` | `text` | `Product.symbols[]` (partial) | 🔀 structural | Silver es text simple (1 URL/nombre). expert-catalog es array de folders (`SymbolFolder`) con { name, files } sin distinguir 2D/3D |
| `drawingName3D` | `text` | `Product.symbols[]` (partial) | 🔀 structural | idem |
| `productItemPrice` | `numeric(18,2)` | `Product.price: number` (types.ts:112) · `ProductStub.priceEstimateMin/Max` | ⚠️ partial | Silver es decimal(18,2); expert-catalog es JS number. ProductStub tiene rango vs silver 1 valor |
| `productItemCurrencyId` | `text` | ❌ | ❌ gap | Currency per productItem · no modelado en expert-catalog |
| `productGroupIdRef` | `text` | `Product.productGroupId?` (types.ts:141) | ⚠️ partial | expert-catalog lo tiene opcional (backwards compat con seeds sin él). Silver es required |
| `statusId` | `text` | `Product.itemStatus` (types.ts:99) | ⚠️ partial | Silver FK a status table; expert-catalog enum inline |

**Hallazgo #8 · Drawings 2D/3D separados en silver**: silver tiene 2 campos discretos `drawingName2D` y `drawingName3D` (probablemente URLs a assets). expert-catalog los agrupa en `symbols: SymbolFolder[]` sin distinguir. Refactor P2 · agregar `dimension: '2D' | '3D'` a SymbolFolder + campos discretos para el primary drawing 2D/3D.

**Hallazgo #9 · Currency per productItem**: silver permite currency diferente por productItem (`productItemCurrencyId`). Escenario: un Steelcase item se vende en USD, otro en EUR. Expert-catalog asume USD global. Refactor cuando se agregue Catalogue con currency.

### Jerarquía (común a todas las silver entities)

| Silver field | Type | expert-catalog · location | Estado | Nota |
|---|---|---|---|---|
| `level` | `int` NOT NULL default 0 | ❌ | ❌ gap | Silver soporta árboles con nivel de profundidad · expert-catalog no |
| `isProject` | `boolean` NOT NULL default false | ❌ | ❌ gap | Discriminator project vs catalog data · no modelado |
| `parentId` | `bigint` | ❌ | ❌ gap | FK al parent record · no existe |
| `parentRecordNumber` | `text` | ❌ | ❌ gap | Human-readable parent ref |
| `parentRecordTypeName` | `text` | ❌ | ❌ gap | Ej. "Catalogue", "Section" · discriminator del type padre |

**Hallazgo #10 · Jerarquía universal (level/isProject/parent*)**: silver aplica pattern de árbol a TODAS las entities. Permite modelar árbol jerárquico: Catalogue → Section → ProductGroup → ProductItem donde cada nivel tiene un parent. expert-catalog usa FKs directas (sectionId, productTypeId) sin este pattern universal. **Overlay concept** · producción puede derivar level/parent automáticamente en el mapping, no requiere refactor UI.

---

## Elementos overlay del expert-catalog (fuera del silver schema)

Confirmados con doc 2 · siguen siendo capa auxiliar. Producción debe modelarlos como tablas separadas fuera de `product_data_management`:

| Entidad expert-catalog | Location | Tabla producción sugerida |
|---|---|---|
| `SpaceType` (11 tipologías) | types.ts:281 | `space_types` (con FK a tenant si se quiere per-tenant) |
| `SpaceTypeSetting` (15 seed + custom) | types.ts:301 | `space_type_settings` (FK a `space_types` + `product_groups` en items[]) |
| `SpaceBundle` | types.ts:324 | `space_bundles` con items jsonb + estimatedCostMin/Max + currencyId |
| Custom Spaces per-tenant | useCustomSpaces.ts | `space_type_settings.isCustom + tenantId` (mismo model, discriminator) |
| `QuoteDraft` + `QuoteLineItem` | QuoteContext.tsx | `quote_drafts` + `quote_line_items` (downstream, no catálogo) |
| `BuyerInfo` (tenant + user) | tenantData.ts + userProfile.ts | Ya modelado en `TenantTargetEntity` (silver) + user table |
| `Manufacturer.contacts[]` | types.ts:191 | `manufacturer_contacts` |
| `Manufacturer.brandResources[]` | types.ts:190 | `brand_resources` |
| `Product.documents[]` | types.ts:132 | `product_documents` (o merger con `drawingName2D/3D` de silver) |
| `Product.tags[]` | types.ts:120 | `product_tags` (junction table) |
| `Product.dealerRating` | types.ts:114 | `dealer_ratings` (downstream) |
| `Product.leadTime` | types.ts:115 | `dealer_lead_times` (downstream, dealer-specific) |
| `Product.itemStatus: 'discrepancy'` | types.ts:43 | En silver es 'discontinued' o custom · el 'discrepancy' es UI-only (out of sync flag) |
| `Colorway` (hex swatch) | types.ts:8 | En silver, cada FinishValue puede tener un swatch color. Colorway es semantic subset |
| `MaterialTier` | types.ts:76 | Semantic close a un OptionMaster llamado "MaterialTier" con OptionGroupValues (Standard/Premium/Special-order) |
| `VolumeTier` | types.ts:67 | `volume_tiers` per productItem (pricing tiered) · no en silver, downstream |

---

## Roadmap de adaptación priorizado

### P0 · Renames semánticos low-risk (~1-2 días)

- [ ] `ProductGroup.linkedOptionGroupCodes` → `linkedOptionGroup` (dropear "Codes" suffix)
- [ ] `ProductGroup.linkedFinishMasterCodes` → `linkedFinishMaster`
- [ ] Documentar `Category` (types.ts:196) como alias legacy · `Section` es canónico
- [ ] Alinear `Catalog.status` enum con silver text (opciones libres vs closed enum)
- [ ] `Product.itemStatus: 'discrepancy'` → mover a UI-only flag (no en silver)

**Files touched**: `types.ts`, `manufacturers.ts`.
**Riesgo**: bajo.

### P1 · Catalogue layer + Currency multi-level (~5-7 días)

Nueva entidad `Catalogue` separada de `Manufacturer`.

- [ ] `interface Catalogue { id, catalogueNumber, name, activeDate, expirationDate, status, currencyId, tenantId }`
- [ ] Currency entity: `interface Currency { id, code, name, type }`
- [ ] Migrar seed · convertir cada `Manufacturer` en 1 `Manufacturer` + N `Catalogue`s (mock)
- [ ] `Catalog` (mock reactivo) consume Catalogue
- [ ] `SpaceBundle.currency` derivable del Catalogue del ProductGroup

**Files touched**: `types.ts`, `manufacturers.ts`, `catalogs.ts`, `ShowroomCatalogsBar.tsx`, `ProductDetailPanel.tsx` (Currency display).
**Riesgo**: medio.

### P1 · Options normalizado 2 niveles (~5-7 días)

- [ ] `interface OptionMaster { id, optionGroupCode, name, notes, status, tenantId }`
- [ ] `interface OptionGroupValue { id, optionMasterId, position, value, description, status }`
- [ ] Seed data · migrar `Product.fabricOptions[]` (~50 items) a `OptionMaster[]` + `OptionGroupValue[]`
- [ ] `ProductGroup.linkedOptionGroup: { optionMasterId, position }[]` reemplaza `linkedOptionGroupCodes: string[]`
- [ ] UI VariantsTab: agrupar values por master
- [ ] UI QuoteTab: selector grouped
- [ ] `computeLineItemTotals` sumar priceModifiers desde optionValues

**Files touched**: `types.ts`, `productVariants.ts`, `ProductDetailPanel.tsx`, `EditQuoteItemPanel.tsx`, `helpers.ts`.
**Riesgo**: alto · cambia shape de `QuoteLineItem.fabricId/finishId/materialTierId`.

### P1 · Finishes normalizado 3 niveles (~7-10 días · el más grande)

- [ ] `interface FinishMaster { id, masterFinishName, status, tenantId }`
- [ ] `interface FinishOption { id, finishMasterId, name, status }`
- [ ] `interface FinishValue { id, finishOptionId, position, name, description, status, price, currencyId, swatch? }`
- [ ] Seed data · migrar `Product.finishes[]` (~50-100 items) al modelo 3-niveles
- [ ] `ProductGroup.linkedFinishMaster: { masterFinishId, position }[]`
- [ ] Product resuelve availableFinishValues via linkedFinishMaster + linked options
- [ ] UI VariantsTab: dropdown 2-level (master → option → value)
- [ ] UI QuoteTab: selector jerárquico + priceModifier calculado desde FinishValue
- [ ] Colorway como caso especial de FinishValue?

**Files touched**: `types.ts`, `productVariants.ts`, `productGroups.ts`, `ProductDetailPanel.tsx`, `EditQuoteItemPanel.tsx`, `helpers.ts`, `QuoteContext.tsx` (finishId type change).
**Riesgo**: muy alto.

### P2 · Multi-tenant per-entity (~3-5 días)

- [ ] Agregar `tenantId?: string` a Catalog, OptionMaster, FinishMaster
- [ ] Filter data por tenant en las queries de UI (Showroom sidebar)
- [ ] Seed data: marcar seed defaults como `tenantId: null` (global)

**Files touched**: `types.ts`, seed files, `useCatalogs`, `ShowroomPage.tsx` (filter).
**Riesgo**: medio.

### P2 · Status per-entity (~2-3 días)

- [ ] Agregar `status?: string` a Catalogue, OptionMaster, OptionGroupValue, FinishMaster, FinishOption, FinishValue
- [ ] UI: filtrar por status = 'active' en dropdowns (excluir discontinued)
- [ ] Mapping legacy: `Product.itemStatus` → `productItem.statusId + productItem.productItemStatusValue`

**Files touched**: `types.ts`, seed files, filter logic.
**Riesgo**: bajo.

### P2 · Record header pattern (~3-5 días)

- [ ] Agregar `id: number` (bigint en producción), `recordNumber: string`, `recordCreatedAt: string`, `tenantId?: number` a las entities catalog
- [ ] Mapping bronze→silver debe generar estos en el processor
- [ ] Front prototype no necesita rehacerse · el pattern es del silver layer

**Files touched**: solo `docs/` (documentation) + backend migration.
**Riesgo**: bajo (front) / alto (backend).

### P2 · Drawings 2D/3D discriminados (~1-2 días)

- [ ] Agregar `dimension: '2D' | '3D' | 'other'` a `SymbolFolder`
- [ ] Agregar `drawingName2D?: string` y `drawingName3D?: string` a Product (primary drawing por dimensión)
- [ ] Seed data: reclasificar (AutoCAD/DWG = 2D, Revit/SketchUp/3DS Max = 3D)
- [ ] UI ResourcesTab: agrupar por dimensión

**Files touched**: `types.ts`, `manufacturers.ts`, `ProductDetailPanel.tsx` ResourcesTab.
**Riesgo**: bajo.

### P3 · Jerarquía universal (level/isProject/parent*) (~documentation only)

- [ ] Documentar en `docs/silver-schema-mapping.md` que level/parentId son derivados en el processor bronze→silver
- [ ] Front prototype no requiere cambio (la jerarquía se computa del sectionId/productGroupId FK)

**Files touched**: docs.
**Riesgo**: cero.

### P3 · Overlay documentado (docs only)

- [ ] Extender `docs/data-inventory.md` con seccion "Auxiliary tables recommended for production"
- [ ] Listar 15+ entidades overlay con motivación y target table name
- [ ] Diagrama FK entre silver schema y overlay tables

**Files touched**: docs.
**Riesgo**: cero.

---

## Correspondencia file:line ↔ Silver field (referencia rápida)

| Silver field | expert-catalog file:line |
|---|---|
| catalogueName | `types.ts:205` (Catalog.name) |
| catalogueStatus | `types.ts:212` (Catalog.status) |
| sectionName | `types.ts:245` (Section.name) |
| sectionCatalogueId | ❌ no existe |
| productTypeName | `types.ts:252` (ProductType.name) |
| productGroupCode | `types.ts:262` (ProductGroup.code) |
| productGroupDescription | `types.ts:264` (ProductGroup.description) |
| sectionIdRef | `types.ts:267` (ProductGroup.sectionId) |
| productTypeIdRef | `types.ts:268` (ProductGroup.productTypeId) |
| linkedOptionGroup (jsonb) | `types.ts:269` (linkedOptionGroupCodes: string[]) |
| linkedFinishMaster (jsonb) | `types.ts:270` (linkedFinishMasterCodes: string[]) |
| productItemCode | `productGroups.ts:295` (ProductStub) · `types.ts:139` (Product) |
| productItemDescription | `types.ts:85` (Product.description) + `ProductStub.name` |
| productItemPrice | `types.ts:112` (Product.price) · `productGroups.ts:298` (ProductStub.priceEstimateMin) |
| productItemCurrencyId | ❌ no existe |
| productGroupIdRef | `types.ts:141` (Product.productGroupId?) |
| drawingName2D | `types.ts:133` (Product.symbols[] · sin dimensión) |
| drawingName3D | `types.ts:133` (Product.symbols[] · sin dimensión) |
| statusId / productItemStatusValue | `types.ts:43` (ItemStatus enum) + `types.ts:99` (Product.itemStatus) |
| optionMasterId | ❌ no existe (solo códigos en linkedOptionGroupCodes) |
| optionGroupCode | (indirect) `types.ts:269` array de codes |
| optionGroupValueId | `types.ts:59` (FabricOption.id) |
| optionValue | `types.ts:60` (FabricOption.name) |
| optionMasterIdRef | ❌ no existe |
| finishMasterId | ❌ no existe |
| masterFinishName | ❌ no existe |
| finishOptionId | ❌ no existe |
| finishOptionName | ❌ no existe |
| finishValueId | `types.ts:48` (Finish.id) |
| finishValueName | `types.ts:49` (Finish.name) |
| finishValuePrice | `types.ts:52` (Finish.priceModifier) |
| finishValueCurrencyId | ❌ no existe |
| finishOptionIdRef | ❌ no existe |
| currencyCode | `types.ts:334` (SpaceBundle.currency · overlay only) |
| level / isProject / parentId | ❌ no existen (silver derivables en processor) |

---

## Referencias

- Data inventory · [docs/data-inventory.md](./data-inventory.md)
- Silver schema Notion doc 1 (Plain-Language) · pegado 2026-07-06
- Silver schema Notion doc 2 (Technical/TypeORM entity) · PDF pegado 2026-07-06
- Alignment histórico Fase 3.1 · [docs/silver-schema-alignment.md](./silver-schema-alignment.md) (superseded)

---

## Change log

| Fecha | Cambio |
|---|---|
| 2026-07-06 | Versión inicial (solo doc 1 plain-language) |
| 2026-07-06 | **Versión final** con validaciones del doc 2 técnico (PDF con TypeORM entity). Todos los `[inferred]` resueltos a `verified` o `gap`. 10 hallazgos con severity. Roadmap detallado P0-P3 con time estimate. |
