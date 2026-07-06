# Silver Schema Gap Analysis · expert-catalog vs Notion

Última actualización · 2026-07-06 · Diagnóstico basado en Notion doc 1 (Plain-Language Schema Guide).

**Source**: [Product+ Options — Plain-Language Schema Guide (for the Product Team)](https://app.notion.com/p/agenticdream/Product-Options-Plain-Language-Schema-Guide-for-the-Product-Team-389acc211ff1814a8a8bca3946f58f15)

**Pendiente**: doc 2 técnico (silver schema completo, TypeORM entities). Los items marcados `[inferred]` esperan validación cuando Diego pegue el contenido del doc 2.

---

## Ejecutivo

El proyecto `expert-catalog` está **alineado ~55% con el silver schema** (13 campos verificados 1:1 o cercanos), tiene **6 gaps críticos** (campos Notion no modelados) y **1 divergencia estructural mayor** (Options/Finishes flat inline vs Notion normalizado 2-3 niveles).

Los **renames semánticos low-risk** (Category → Section, Product → ProductItem) son ejecutables sin refactor de UI. Los **gaps de Catalogue layer** (catalogueNumber, dates, currency) requieren nueva entidad separada de Manufacturer. La **normalización de Options/Finishes** es el ítem con mayor impacto (P1, refactor cross-cutting).

**Overlay Spaces** (SpaceType/SpaceTypeSetting/SpaceBundle) queda **fuera del silver schema** por diseño · es capa de "space planning" propia del expert-catalog, no del catálogo manufacturero. Debe documentarse como tabla auxiliar (`space_type_settings`) en la migración a producción.

---

## Leyenda de estados

- ✅ `verified: doc1` · alineado 1:1 según el doc plain-language
- ⚠️ `partial` · semántica cercana, requiere rename o pequeño ajuste
- 🔀 `structural` · estructura fundamentalmente diferente (flat vs normalized)
- ❌ `gap` · el campo Notion no existe en expert-catalog
- 🌀 `overlay` · el campo/entidad de expert-catalog no aparece en Notion (decisión intencional)
- ❓ `inferred` · deducido del doc 1 sin validación del doc 2

---

## Tabla comparativa · field-by-field

### Catalogue level

| Notion field | expert-catalog · location | Estado | Nota |
|---|---|---|---|
| `catalogueName` | `Catalog.name` (types.ts:203) | ✅ verified | 1:1 |
| `catalogueNumber` | ❌ | ❌ gap | No hay ID/código separado del name. `Catalog.id: number` es interno, no matchea "SC-2025-SEAT" |
| `catalogueActiveDate` | ❌ | ❌ gap | No modelado. `Catalog.lastSync: string` no cubre esto |
| `catalogueExpirationDate` | ❌ | ❌ gap | No modelado |
| `catalogueStatus` | `Catalog.status` (types.ts:211) | ⚠️ partial | Enums diferentes · expert-catalog `'Active' \| 'Update Avail.' \| 'Archived'` vs Notion "Active/Retired" |
| `currencyCode` | `SpaceBundle.currency: 'USD'` (types.ts:334) | ❌ gap | Existe solo en overlay Bundle. Debe estar a nivel Catalogue (Notion location: junto a currency & status) |

**Hallazgo #1 · Catalogue layer**: expert-catalog usa `Manufacturer` como proxy débil del Catalogue de Notion. Los conceptos son diferentes: un Manufacturer puede publicar N Catalogues (Steelcase 2024 Seating, Steelcase 2025 Seating). La entidad `Catalog` existe pero cubre solo name/status. Producción debe agregar `Catalogue` como entidad separada con FKs a Manufacturer.

### Section level

| Notion field | expert-catalog · location | Estado | Nota |
|---|---|---|---|
| `sectionName` | `Section.name` (types.ts:243) | ✅ verified | 1:1 |
| Section.slug | ❓ inferred | ⚠️ partial | expert-catalog agrega `slug` y `order` (`Section.slug`, `.order`) · no está en doc 1 pero es útil |
| Section.order | ❓ inferred | ⚠️ partial | idem |

**Hallazgo #2 · Section rename**: expert-catalog aún usa `Category` en algunos lugares (`Product.category: string`, `selectedCategories` state). La migración `Category → Section` está parcialmente hecha (seed usa Section IDs pero Product mantiene category legacy). Rename semántico low-risk.

### Product Type level

| Notion field | expert-catalog · location | Estado | Nota |
|---|---|---|---|
| `productTypeName` | `ProductType.name` (types.ts:250) | ✅ verified | 1:1 |

### Product Group level

| Notion field | expert-catalog · location | Estado | Nota |
|---|---|---|---|
| `productGroupCode` | `ProductGroup.code` (types.ts:262) | ✅ verified | 1:1 (CH15, TB04, AL13 style) |
| `productGroupDescription` | `ProductGroup.description` (types.ts:264) | ✅ verified | 1:1 |
| `productGroupName` | `ProductGroup.name` (types.ts:263) | ⚠️ partial | expert-catalog splitea code+name · Notion parece tener solo code+description. Rename opcional |
| `linkedOptionGroup` | `ProductGroup.linkedOptionGroupCodes[]` (types.ts:265) | ⚠️ partial | Rename semántico pending (drop 'Codes' suffix). Type match: array de strings |
| `linkedFinishMaster` | `ProductGroup.linkedFinishMasterCodes[]` (types.ts:266) | ⚠️ partial | Idem rename |
| ProductGroup.sectionId FK | `ProductGroup.sectionId` (types.ts:267) | ❓ inferred | Notion doc 1 dice "one group belongs to one section" · sugiere FK. expert-catalog lo tiene |
| ProductGroup.productTypeId FK | `ProductGroup.productTypeId` (types.ts:268) | ❓ inferred | Idem |
| ProductGroup.itemIds[] | `ProductGroup.itemIds[]` (types.ts:269) | ❓ inferred | Notion doc 1 dice "one Product Group holds many Product Items" · sugiere relación 1-a-N. expert-catalog lo modela como array de FKs (potencialmente debería ser reverse: ProductItem.productGroupId FK) |

**Hallazgo #3 · Rename linkedOptionGroup / linkedFinishMaster**: expert-catalog tiene `linkedOptionGroupCodes` y `linkedFinishMasterCodes`. Notion usa `linkedOptionGroup` y `linkedFinishMaster`. Es rename cosmético · el shape es idéntico (string arrays de referencias a nombres de option groups / finish masters).

**Hallazgo #4 · Reverse relation ProductItem.productGroupId**: Notion doc 1 parece sugerir "one Product Group holds many Product Items" implementado como FK en ProductItem (ProductItem.productGroupId → ProductGroup.id). expert-catalog lo tiene como array en el group (`ProductGroup.itemIds[]`). Ambos approaches funcionan pero la FK en el child es más DB-friendly.

### Product Item level

| Notion field | expert-catalog · location | Estado | Nota |
|---|---|---|---|
| `productItemCode` | `ProductStub.productItemCode` (productGroups.ts:295) · también `Product.productItemCode?` (types.ts:139) | ✅ verified | Existe en 2 lugares · en ProductStub required, en Product opcional (backwards compat) |
| `productItemDescription` | `ProductStub.name` + `Product.description` | ⚠️ partial | Split entre `name` (short) y `description` (long). Notion parece tener 1 solo campo. Refactor opcional |
| `productItemPrice` | `Product.price: number` (types.ts:112) · `ProductStub.priceEstimateMin/Max` | ⚠️ partial | Notion tiene 1 price base ($420). expert-catalog tiene: Product.price (dealer price actual) + ProductStub.priceEstimateMin/Max (range). Divergencia: Notion 1 valor vs expert-catalog range |
| `drawingName2D` | `Product.symbols[]` (partial) | 🔀 structural | expert-catalog tiene `symbols: SymbolFolder[]` con `name: 'AutoCAD (DWG)'/'Revit'/'SketchUp'/'3DS Max'` y `files: N`. No distingue 2D vs 3D explícito. Notion es 1 campo string, expert-catalog es array de folders |
| `drawingName3D` | `Product.symbols[]` (partial) | 🔀 structural | Idem |
| `statusId` | `Product.itemStatus` (types.ts:43) | ⚠️ partial | expert-catalog enum: 'active'/'discontinued'/'discrepancy' vs Notion FK a status table |
| `productItemStatusValue` | `Product.itemStatus` (idem) | ✅ verified | 1:1 semantic con statusId · Notion parece tener 2 campos (statusId FK + productItemStatusValue string legible), expert-catalog fusiona en 1 enum |

**Hallazgo #5 · Price single value vs range**: Notion `productItemPrice = 420` (número scalar). expert-catalog Product.price es scalar también, PERO ProductStub tiene `priceEstimateMin/Max` (range para estimación de bundles). Producción: alinear Product a scalar exacto; conservar range solo en ProductStub como "estimate" no autoritativo.

**Hallazgo #6 · Drawings 2D/3D**: Notion tiene 2 campos separados (`drawingName2D`, `drawingName3D`). expert-catalog agrupa todos los formatos en `symbols[]` sin distinguir dimensión. Refactor: agregar `dimension: '2D' | '3D'` al `SymbolFolder` o splittear en 2 arrays.

### Options level (2 niveles Notion)

**Notion structure**:
```
Options (option group)
├── optionGroupCode: "Armrests"
└── option values[]
    ├── optionValue: "Adjustable"
    ├── optionDescription: "..."
    └── optionGroupValuePosition: 3
```

| Notion field | expert-catalog · location | Estado | Nota |
|---|---|---|---|
| `optionGroupCode` | (indirect via `Product.fabricOptions[]`) | 🔀 structural | expert-catalog no tiene concept de "option group" separado · `fabricOptions[]` es flat en Product |
| `optionValue` | `FabricOption.name` (types.ts:60) | ⚠️ partial | Semantic close · 1 valor por row |
| `optionDescription` | ❌ | ❌ gap | No hay description en FabricOption |
| `optionGroupValuePosition` | ❌ | ❌ gap | No hay display order en FabricOption[] · orden es del array literal |

**Hallazgo #7 · Options structural gap**: expert-catalog no modela `optionGroupCode → optionValues[]`. Los `Product.fabricOptions[]` mezclan "Armrests: Adjustable" y "Base: Swivel" como items planos sin agrupación por option group. Producción debe:
- Crear `OptionGroup { id, code, name }` (ej. { code: "Armrests" })
- Crear `OptionValue { id, optionGroupId, value, description, position }` (ej. { optionGroupId: "Armrests", value: "Adjustable", position: 3 })
- Product referencia `optionValueIds[]` en vez de flat FabricOption[]

### Finishes level (3 niveles Notion)

**Notion structure**:
```
Finish master (category)
├── masterFinishName: "Frame Finish"
└── Finish option (sub-group)
    ├── finishOptionName: "Powder Coat"
    └── Finish value (actual)
        ├── finishValueName: "Matte Black"
        └── finishValuePrice: 0 (or 45 for "Polished")
```

| Notion field | expert-catalog · location | Estado | Nota |
|---|---|---|---|
| `masterFinishName` | ❌ | ❌ gap | Nivel superior de finishes (Frame Finish/Fabric Finish/etc) no modelado |
| `finishOptionName` | ❌ | ❌ gap | Sub-nivel (Powder Coat/Paint/etc) no modelado |
| `finishValueName` | `Finish.name` (types.ts:49) | ⚠️ partial | Existe pero flat · sin herencia del master + option |
| `finishValuePrice` | `Finish.priceModifier` (types.ts:52) | ✅ verified | 1:1 |
| Finish.swatch | ❓ inferred | 🌀 overlay | expert-catalog tiene `Finish.swatch: string` (hex). Notion doc 1 no menciona swatch color · útil para UI pero puede no estar en el silver schema |
| Finish.leadTimeAdjust | ❓ inferred | 🌀 overlay | expert-catalog agrega lead time adjust por finish · útil para B2B, puede ser gap en Notion o inferido |

**Hallazgo #8 · Finishes structural gap** (severity: HIGH): expert-catalog aplasta 3 niveles de Notion en 1 flat array `Product.finishes[]`. Un `Finish` de expert-catalog corresponde solo al `finishValueName` de Notion. Producción debe:
- Crear `MasterFinish { id, name }` (ej. { name: "Frame Finish" })
- Crear `FinishOption { id, masterFinishId, name }` (ej. { masterFinishId: "Frame Finish", name: "Powder Coat" })
- Crear `FinishValue { id, finishOptionId, name, price, swatch? }` (ej. { finishOptionId: "Powder Coat", name: "Matte Black", price: 0 })
- Product referencia `availableFinishValueIds[]` filtrado por linked masters

Este es el refactor de mayor impacto · cross-cutting sobre ProductDetailPanel QuoteTab, VariantsTab, computeLineItemTotals helpers.

---

## Elementos overlay del expert-catalog (fuera del silver schema)

Los siguientes elementos existen en expert-catalog **por diseño** y NO tienen contraparte en Notion doc 1. En producción deben modelarse como tablas auxiliares fuera del schema del catálogo manufacturero:

| Entidad expert-catalog | Location | Justificación |
|---|---|---|
| `SpaceType` (11 tipologías) | types.ts:281 + spaceTypes.ts | Capa de "space planning" propia · agrupa productos por escenario de uso (Focus Room, Work Cafe) |
| `SpaceTypeSetting` (15 seed + custom) | types.ts:301 + spaceTypes.ts | Configuraciones concretas por SpaceType · F1, WC1, etc |
| `SpaceBundle` | types.ts:324 | Lista de productos + estimated cost por Setting |
| Custom Spaces per-tenant | useCustomSpaces.ts + localStorage | Space Settings creados por el dealer · persist per-tenant |
| `QuoteDraft` + `QuoteLineItem` | QuoteContext.tsx | Cart/quote system · downstream del catálogo |
| `BuyerInfo` (tenant + user metadata) | tenantData.ts + userProfile.ts | Auto-fill del quote · no es catálogo manufacturero |
| `Manufacturer.contacts[]` | types.ts:191 | Sales + A&D specialists · útil para dealer UI, no necesariamente en Notion catalog schema |
| `Manufacturer.brandResources[]` | types.ts:190 | Website + PDFs de la marca |
| `Product.documents[]` | types.ts:132 | PDFs específicos del producto (guarantees, brochures) |
| `Product.tags[]` | types.ts:120 | Features arbitrarias · útil para búsqueda |
| `Product.dealerRating` | types.ts:114 | Rating por dealer · downstream data, no del catálogo maker |
| `Product.leadTime` | types.ts:115 | Dealer-specific · Notion tiene finishValuePrice pero no lead time |
| `Product.itemStatus: 'discrepancy'` | types.ts:43 | Enum extra beyond Notion active/retired · útil para sync management |
| `Colorway` (hex swatch) | types.ts:8 | UI color rendering · Notion Finishes puede tener swatch pero doc 1 no lo menciona explícitamente |

**Recomendación**: documentar en la migration doc que estos elementos viven en tablas auxiliares:
- `space_type_settings` (con FK a `product_groups`)
- `quote_drafts` + `quote_line_items`
- `tenant_metadata`
- `user_profiles`
- `manufacturer_contacts`
- `product_documents`
- `product_tags`
- `dealer_ratings`
- Etc.

---

## Roadmap de adaptación (recomendaciones priorizadas)

### P0 · Renames semánticos low-risk (~1-2 días)

Sin refactor de UI. Solo find+replace + type aliases.

- [ ] `Category` (types.ts:196 + usages) → conservar como legacy alias · `Section` es el nombre canónico
- [ ] `ProductGroup.linkedOptionGroupCodes` → `linkedOptionGroup`
- [ ] `ProductGroup.linkedFinishMasterCodes` → `linkedFinishMaster`
- [ ] Documentar que `Product` es equivalente a `ProductItem` (rename opcional en fase 2)
- [ ] Alinear `Catalog.status` enums con Notion ('Active' | 'Retired')

**Files touched**: `types.ts`, `manufacturers.ts` (rename catalog.status values si aplica).
**Riesgo**: bajo · aliases mantienen backward compat.

### P1 · Catalogue layer (~3-5 días)

Nueva entidad `Catalogue` separada de `Manufacturer`.

- [ ] Crear `interface Catalogue { id, manufacturerId, catalogueNumber, name, activeDate, expirationDate, status, currency }`
- [ ] Migrar seed · convertir cada `Manufacturer` seed en 1 `Manufacturer` + 1 `Catalogue`
- [ ] Actualizar `Catalog` (el mock reactivo) para consumir Catalogue
- [ ] Currency: mover de `SpaceBundle.currency` a `Catalogue.currency` (Bundle derivable)

**Files touched**: `types.ts`, `manufacturers.ts`, `catalogs.ts`, `ShowroomCatalogsBar.tsx` (badge status), `ProductDetailPanel.tsx` (Currency display).
**Riesgo**: medio · nueva capa afecta joins.

### P1 · Currency ascendente (~1 día)

- [ ] Remover `currency` de `SpaceBundle` (queda derivable de Catalogue)
- [ ] Agregar `currency: string` a `Catalogue`
- [ ] Todos los precios display resuelven currency desde el Catalogue del ProductGroup

**Files touched**: `types.ts` (SpaceBundle + Catalogue), `spaceTypes.ts` (drop currency del bundle), UI display (ProductDetailPanel, SpaceBundleCard).

### P1 · Options normalizado (~5-7 días)

Refactor cross-cutting.

- [ ] Crear `OptionGroup { id, code, name }` + `OptionValue { id, optionGroupId, value, description, position }`
- [ ] Seed data · migrar `Product.fabricOptions[]` a `optionValueIds[]` referencias
- [ ] UI `VariantsTab` agrupar values por optionGroup
- [ ] UI `QuoteTab` linear picker → grouped picker
- [ ] `computeLineItemTotals` sumar priceModifiers desde optionValues

**Files touched**: `types.ts`, `productVariants.ts`, `ProductDetailPanel.tsx` (Quote + Variants tabs), `helpers.ts`.
**Riesgo**: alto · cambia el shape del Product y de QuoteLineItem.finishId/fabricId/materialTierId.

### P1 · Finishes normalizado 3 niveles (~7-10 días)

**El más grande de todos**. Refactor cross-cutting.

- [ ] Crear `MasterFinish { id, name }` + `FinishOption { id, masterFinishId, name }` + `FinishValue { id, finishOptionId, name, price, swatch? }`
- [ ] Seed data · migrar `Product.finishes[]` (~50-100 finishes actuales) al modelo 3-niveles
- [ ] `ProductGroup.linkedFinishMaster` referencia a MasterFinish.id · define qué masters aplican
- [ ] Product resuelve availableFinishValues via linkedFinishMaster + linked options
- [ ] UI VariantsTab: dropdown 2-level (master → option → value)
- [ ] UI QuoteTab: selector jerárquico

**Files touched**: `types.ts`, `productVariants.ts`, `productGroups.ts` (seeds nuevas), `ProductDetailPanel.tsx`, `EditQuoteItemPanel.tsx`, `helpers.ts`.
**Riesgo**: muy alto · afecta ~15 archivos y cambia shape de QuoteLineItem.finishId a finishValueId con jerarquía.

### P2 · Drawings 2D/3D discriminados (~1-2 días)

- [ ] Extender `SymbolFolder` con `dimension: '2D' | '3D' | 'other'`
- [ ] Seed data: reclasificar (AutoCAD/DWG = 2D, Revit/SketchUp/3DS Max = 3D)
- [ ] UI ResourcesTab: agrupar por dimensión

**Files touched**: `types.ts`, `manufacturers.ts`, `ProductDetailPanel.tsx` ResourcesTab.
**Riesgo**: bajo.

### P3 · Overlay documentado en migration doc

Sin código · solo documentación.

- [ ] Sección "Auxiliary tables" en `docs/silver-schema-alignment.md` (o merge con este file)
- [ ] Listar 15+ entidades overlay con motivación
- [ ] Diagrama FK entre silver schema y overlay tables
- [ ] Recomendar naming convention para las auxiliary tables

### P4 · Cuando llegue el doc 2 (silver schema técnico)

- [ ] Validar todos los items marcados `[inferred]` en esta tabla
- [ ] Extender la tabla con field types específicos (string, number, date, jsonb)
- [ ] Documentar FK constraints (ON DELETE CASCADE vs SET NULL)
- [ ] Ajustar los renames si el silver schema usa nombres distintos al plain-language doc
- [ ] Confirmar el status enum (Active/Retired vs Draft/Active/Archived/Discontinued)

---

## Anexo · Correspondencia file:line ↔ Notion field

Para navegación rápida.

| Notion field | expert-catalog file:line |
|---|---|
| catalogueName | `src/catalog/types.ts:203` (Catalog.name) |
| catalogueStatus | `src/catalog/types.ts:211` (Catalog.status) |
| sectionName | `src/catalog/types.ts:243` (Section.name) |
| productTypeName | `src/catalog/types.ts:250` (ProductType.name) |
| productGroupCode | `src/catalog/types.ts:262` (ProductGroup.code) |
| productGroupDescription | `src/catalog/types.ts:264` (ProductGroup.description) |
| linkedOptionGroup | `src/catalog/types.ts:265` (ProductGroup.linkedOptionGroupCodes) |
| linkedFinishMaster | `src/catalog/types.ts:266` (ProductGroup.linkedFinishMasterCodes) |
| productItemCode | `src/catalog/data/productGroups.ts:295` (ProductStub) · `src/catalog/types.ts:139` (Product) |
| productItemDescription | `src/catalog/types.ts:85` (Product.description) |
| productItemPrice | `src/catalog/types.ts:112` (Product.price) · `productGroups.ts:298` (ProductStub.priceEstimateMin) |
| drawingName2D | `src/catalog/types.ts:133` (Product.symbols) |
| drawingName3D | `src/catalog/types.ts:133` (Product.symbols) |
| statusId / productItemStatusValue | `src/catalog/types.ts:43` (ItemStatus enum) · `types.ts:99` (Product.itemStatus) |
| optionGroupCode | `src/catalog/types.ts:127` (Product.fabricOptions · flat) |
| optionValue | `src/catalog/types.ts:60` (FabricOption.name) |
| masterFinishName | ❌ no existe |
| finishOptionName | ❌ no existe |
| finishValueName | `src/catalog/types.ts:49` (Finish.name) |
| finishValuePrice | `src/catalog/types.ts:52` (Finish.priceModifier) |
| currencyCode | `src/catalog/types.ts:334` (SpaceBundle.currency · overlay only) |

---

## Referencias

- Data inventory completo · [docs/data-inventory.md](./data-inventory.md)
- Silver schema Notion doc 1 (Plain-Language) · pegado en el chat de la sesión 2026-07-06
- Silver schema Notion doc 2 (Technical) · **pendiente** de que Diego pegue el contenido en el chat o adjunte el PDF
- Alignment histórico Fase 3.1 · [docs/silver-schema-alignment.md](./silver-schema-alignment.md) (será superseded)

---

## Change log

| Fecha | Cambio |
|---|---|
| 2026-07-06 | Versión inicial. Basada solo en doc 1 plain-language. Marcados `[inferred]` los campos que requieren validación del doc 2 técnico. |
