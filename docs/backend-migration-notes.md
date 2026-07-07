# Backend Migration Notes · expert-catalog → silver schema production

Última actualización · 2026-07-07 · P2.3 + P3.1 + P3.2 (docs-only closing phases)

Este documento cubre los aspectos del silver schema que **NO se materializan en el front prototype** porque son responsabilidad del backend (bronze→silver processor). El equipo BE los usa como checklist al conectar `product_data_management` a producción.

Complementa:
- `docs/data-inventory.md` · inventario de tipos front
- `docs/silver-schema-gap-analysis.md` · tabla campo-por-campo vs silver

---

## 1 · Record header pattern (fase P2.3 · backend responsibility)

Silver schema aplica a **todas** las entities el pattern del `msa-data-target.entity.ts`:

```typescript
@PrimaryColumn({ name: 'id', type: 'bigint' })
public id!: number;

@Column({ name: 'recordNumber', type: 'text', nullable: true })
public recordNumber!: string | null;

@Column({ name: 'recordCreatedAt', type: 'timestamp', nullable: true })
public recordCreatedAt!: Date | null;

@Column({ name: 'tenantId', type: 'bigint', nullable: true })
public tenantId!: number | null;

@ManyToOne(() => TenantTargetEntity)
@JoinColumn({ name: 'tenantId' })
public tenant?: TenantTargetEntity;
```

### Estado en el prototype front

- `id` · strings (UUID-style · "cat-allsteel-2026", "om-armrests"), no bigint. Producción convierte al insertar.
- `recordNumber` · **no modelado**. En producción lo genera el bronze processor a partir de `record_header.id`.
- `recordCreatedAt` · solo en `QuoteDraft` (ISO string), `CustomSpaces` (ISO), y `Catalogue.activeDate` (proxy). Producción popula `timestamp` desde el bronze.
- `tenantId` · modelado como `string?` (slug) en Catalogue/OptionMaster/FinishMaster/QuoteDraft. Producción convierte a `bigint` FK.

### Recomendación al equipo BE

- **NO agregar `id: bigint`, `recordNumber`, `recordCreatedAt` como campos front**. El prototype existe para validar UI/UX, no para materializar el header silver.
- Al hacer sync bronze→silver, el processor debe generar estos campos automáticamente. El front nunca los ve.
- `TenantTargetEntity` (silver) es la fuente canónica de tenants. Producción reemplaza el `TenantContext` slug-based del front con un lookup FK.

### Traducción slug → bigint (mapeo demo)

| Front slug | Producción tenant name | tenantId (ejemplo) |
|---|---|---|
| `special-t` | Special-T Furniture LLC (DEALER 1) | `1001` |
| `meridian-office` | Meridian Office | `1002` |
| `strata` | Strata (own) | `1003` |
| `apex-interiors` | Apex Interiors | `1004` |
| `clearspace-design` | ClearSpace Design | `1005` |

Producción debe crear estos tenants en `TenantTargetEntity` con IDs bigint y actualizar el localStorage/session del front al conectarse.

---

## 2 · Jerarquía universal (fase P3.1 · derivable en processor)

Silver aplica a **todas** las entities el pattern de árbol:

```typescript
@Column({ name: 'level', type: 'int', nullable: false, default: 0 })
public level!: number;

@Column({ name: 'isProject', type: 'boolean', nullable: false, default: false })
public isProject!: boolean;

@Column({ name: 'parentId', type: 'bigint', nullable: true })
public parentId!: number | null;

@Column({ name: 'parentRecordNumber', type: 'text', nullable: true })
public parentRecordNumber!: string | null;

@Column({ name: 'parentRecordTypeName', type: 'text', nullable: true })
public parentRecordTypeName!: string | null;
```

### Estado en el prototype front

**No modelado**. El prototype usa FKs directas (`sectionId`, `productGroupId`, `catalogueId`, `finishMasterId`, `optionMasterId`) que ya capturan la jerarquía natural del catálogo:

```
Catalogue
  ↓ (Section.catalogueId sería la FK · pendiente en front, silver ya lo tiene)
Section
  ↓ (ProductGroup.sectionId)
ProductGroup
  ↓ (ProductStub.productGroupCode → ProductGroup.code · lookup indirecto)
ProductItem
```

### Recomendación al equipo BE

- El processor **deriva** `level`, `parentId`, `parentRecordNumber`, `parentRecordTypeName` de las FKs existentes:
  - Section → `parentRecordTypeName = 'Catalogue'`, `parentId = catalogueId`, `level = 1`
  - ProductGroup → `parentRecordTypeName = 'Section'`, `parentId = sectionId`, `level = 2`
  - ProductItem → `parentRecordTypeName = 'ProductGroup'`, `parentId = productGroupIdRef`, `level = 3`
  - OptionValue → `parentRecordTypeName = 'OptionMaster'`, `parentId = optionMasterIdRef`, `level = 1` (dentro del sub-tree Options)
  - FinishOption → `parentRecordTypeName = 'FinishMaster'`, `parentId = finishMasterIdRef`, `level = 1`
  - FinishValue → `parentRecordTypeName = 'FinishOption'`, `parentId = finishOptionIdRef`, `level = 2`

- `isProject` marca si la entity pertenece a un proyecto específico (custom por cliente) vs al catálogo estándar. En front esto matchea con `tenantId !== undefined` en overlay Catalogues/OptionMasters/FinishMasters.

### No refactor front necesario

El prototype no necesita modelar estos campos. Los queries de silver seguirán usando FKs directas · `level/parent*` son metadata redundante que facilita queries recursivos en Postgres (WITH RECURSIVE, ltree).

---

## 3 · Overlay tables recommended for production (fase P3.2)

Elementos que existen en el prototype pero **NO en el silver schema** por diseño. Estos deben materializarse como tablas auxiliares en producción, **fuera** de `product_data_management`.

### 3.1 · Space planning layer

Capa de "space planning" · agrupa productos por escenario de uso · totalmente propietaria de Strata.

| Entity | Prototype file | Producción table sugerida | Rationale |
|---|---|---|---|
| `SpaceType` | `types.ts:281` · `spaceTypes.ts` | `space_types` | Focus Room, Work Cafe, Cafeteria, etc · 11 tipologías |
| `SpaceTypeSetting` | `types.ts:301` · `spaceTypes.ts` | `space_type_settings` | F1, WC1, etc · 15 seed + custom per tenant |
| `SpaceBundle` | `types.ts:324` (nested) | Inline `jsonb` en `space_type_settings.bundle` | Array de `{ productGroupCode, itemId, qty, label }` |
| Custom Spaces | `useCustomSpaces.ts` · localStorage | `space_type_settings.tenantId + isCustom` | Discriminator + FK a tenant |
| Rendering hotspots | `SpaceRendering.tsx` · UI-only | (no persist) | Derivable de bundle.items.length |

**FK design**: `space_type_settings.bundle → product_groups.code` (o `product_groups.id` bigint). Bundle items no referencian ProductItem específico porque son "recetas" · el instanciamiento al ProductItem exacto ocurre al agregar al quote.

### 3.2 · Quote / cart system

Downstream del catálogo · totalmente cross-cutting.

| Entity | Prototype file | Producción table sugerida |
|---|---|---|
| `QuoteDraft` | `QuoteContext.tsx:59` · localStorage | `quote_drafts` |
| `QuoteLineItem` | `QuoteContext.tsx:22` · nested | `quote_line_items` |
| `BuyerInfo` | `QuoteContext.tsx:52` | inline en `quote_drafts` (user_id FK + tenant_id FK snapshots) |
| `LastAddedSummary` | `QuoteContext.tsx:79` · in-memory | (no persist · ephemeral UI state) |
| `EditingItemState` | `QuoteContext.tsx:92` · in-memory | (no persist) |
| `QuotedHistoryEntry` | `QuoteContext.tsx:99` · derived | Query materializada · `SELECT product_id, COUNT(*), SUM(qty), MAX(updated_at) FROM quote_line_items GROUP BY product_id` |

**Reference number** · `Q-YYYY-NNN-{TENANT}` generation debe migrarse del front (in-memory counter) a un backend sequence per-tenant.

### 3.3 · Manufacturer metadata (downstream data)

Data del manufacturer que **no** vive en el silver Catalogue.

| Entity | Prototype file | Producción table sugerida |
|---|---|---|
| `Manufacturer` | `types.ts:177` · `manufacturers.ts` | `manufacturers` (raíz) |
| `Manufacturer.brandResources[]` | `types.ts:190` | `brand_resources` |
| `Manufacturer.contacts[]` | `types.ts:191` · sales + A&D specialists | `manufacturer_contacts` |
| `Manufacturer.categories[]` | `types.ts:193` · nested | Foreign keys via `product_groups.section_id → sections.id` |

### 3.4 · Product-level extras

Data del `Product`/`ProductItem` que va más allá del silver `ProductItem`:

| Field | Prototype location | Producción handling |
|---|---|---|
| `Product.documents[]` (PDFs) | `types.ts:132` | `product_documents` (FK product_item_id) |
| `Product.symbols[]` (CAD folders) | `types.ts:133` + `dimension` (P2.4) | `product_symbols` (FK product_item_id, dimension enum) |
| `Product.dealerRating` | `types.ts:114` | `dealer_ratings` (junction · product × tenant × rating) |
| `Product.leadTime` | `types.ts:115` | `dealer_lead_times` (dealer-specific · overrides silver defaults) |
| `Product.tags[]` | `types.ts:120` | `product_tags` (junction) |
| `Product.popular` | `types.ts:118` | Derived · `SELECT COUNT * FROM quote_line_items WHERE product_id=X` |
| `Product.itemStatus: 'discrepancy'` | `types.ts:43` | UI-only flag (sync state) · derived del `catalogueStatus` |
| `Colorway.hex` | `types.ts:8` | En silver, `FinishValue.swatch` cubre esta necesidad. Colorway es semantic sub-set |
| `VolumeTier` | `types.ts:67` | `volume_tiers` (FK product_item_id) · pricing tier |

### 3.5 · Tenant + user metadata

Front prototype vs silver:

| Entity front | Silver equivalent | Notes |
|---|---|---|
| `TenantMetadata` (`tenantData.ts`) · slug + name + industry + billingAddress + taxId | `TenantTargetEntity` (silver base) | Producción reemplaza el string slug del prototype con FK bigint |
| `UserCompanyProfile` (`userProfile.ts`) · fullName + title + email + phone | `user` table (Supabase auth) + user_profiles table | Prototype lookup mock · producción resuelve de auth session |

---

## 4 · Migration checklist para el equipo BE

Al conectar producción, seguir este orden para minimizar churn:

1. **Setup del silver schema** · crear `product_data_management` con TypeORM entity provista en el PDF de Diego (2026-07-06).
2. **Bronze processor** · construir el mapping `product-data-management-mapping.ts` desde `record_additional_fields`.
3. **Auxiliary tables** · crear las tablas overlay listadas en §3 · seguir el pattern `catalog_layer + tenant_layer + quote_layer + downstream_layer`.
4. **Seed data** · migrar los mocks del front (`manufacturers.ts`, `catalogues.ts`, `productGroups.ts`, `spaceTypes.ts`, `options.ts`, `finishes.ts`) a inserts SQL/TypeORM. Ver `docs/data-inventory.md` para inventario completo.
5. **Front adapter** · reemplazar los helpers hardcoded (`findCatalogueById`, `findOptionMasterById`, etc) con calls a un backend API que consume el silver + overlay tables.
6. **QuoteContext refactor** · migrar el localStorage a un backend sync via API + persist local para offline (opcional).
7. **Tenant lookup** · convertir el slug-based TenantContext a bigint FK resolution.

Cada paso puede validarse contra el prototype · el data model del prototype es compatible con silver hasta el shape final. Los renames semánticos (P0.1) están hechos, los aliases legacy pueden eliminarse en cleanup post-migration.

---

## 5 · Historial de decisiones

| Fecha | Decisión | Rationale |
|---|---|---|
| 2026-07-06 | NO agregar status a Section/ProductType/ProductGroup | Silver schema no lo define · P2.2 se enfocó solo en entities donde silver sí lo define |
| 2026-07-06 | Overlay Spaces documentado como intencional | SpaceType/Setting/Bundle NO están en silver por diseño · overlay planning layer propietaria |
| 2026-07-06 | Legacy aliases preservados (linkedOptionGroupCodes, linkedFinishMasterCodes) | Cleanup.2 post-implementación · elimina cuando toda la codebase use nombres silver |
| 2026-07-07 | Record header (id bigint + recordNumber + recordCreatedAt) NO se materializa en front | Backend responsibility · processor genera automáticamente |
| 2026-07-07 | Jerarquía universal (level/isProject/parent*) NO se materializa en front | Backend derivable desde FKs existentes · metadata redundante para queries recursivos |

---

## Referencias

- Silver schema Notion doc 1 (Plain-Language) · pegado 2026-07-06
- Silver schema Notion doc 2 (Technical TypeORM) · PDF pegado 2026-07-06
- `docs/data-inventory.md` · inventario completo del front
- `docs/silver-schema-gap-analysis.md` · gap analysis field-by-field
- `docs/adaptation-progress.md` · tracker de fases del roadmap adaptation
