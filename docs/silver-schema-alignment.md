# Silver Schema Alignment · expert-catalog

Última actualización · 2026-07-06 · Fase 3.1

## Contexto

Strata usa un **silver schema** documentado en Notion (workspace *Product Data Management*) que define la jerarquía formal del catálogo B2B en producción. Este documento verifica la alineación entre ese schema y los tipos actuales del proyecto `expert-catalog`, identifica gaps, y da ejemplos concretos de la agrupación 1-a-N entre `ProductGroup` y `ProductItem`.

## Jerarquía comparada

| Nivel | Silver schema (Notion) | expert-catalog | Archivo |
|---|---|---|---|
| 1 | `Catalogue` | `Manufacturer` (parcial) | `src/catalog/types.ts` |
| 2 | `Section` | `Section` | `src/catalog/types.ts:234` |
| 3 | `ProductType` | `ProductType` | `src/catalog/types.ts:242` |
| 4 | `ProductGroup` | `ProductGroup` | `src/catalog/types.ts:253` |
| 5 | `ProductItem` | `ProductStub` | `src/catalog/data/productGroups.ts:286` |
| 5a | `Options + Finishes` | `Product.finishes[]` / `fabricOptions[]` | `src/catalog/types.ts:83` |

## Tabla de mapping detallado

| Silver | expert-catalog | Estado | Notas |
|---|---|---|---|
| `Catalogue.catalogueNumber` | `Manufacturer.slug` (proxy) | ⚠️ Gap | Producción debe modelar Catalogue con `catalogueNumber`, `activeDate`, `expirationDate`, `status`, `currency` |
| `Section.name` | `Section.name` | ✅ 1:1 | 6 secciones seed (Ancillary, Casegoods, Seating, Storage, Tables, Workstations) |
| `ProductType.name` | `ProductType.name` | ✅ 1:1 | 8 tipos seed (Chair, Table, Lamp, Storage, Panel, Casegood, Screen, Accessory) |
| `ProductGroup.productGroupCode` | `ProductGroup.code` | ✅ 1:1 | 22 grupos seed con codes Steelcase-style (CH01-CH19, TB01-TB25, AL02-AL13) |
| `ProductGroup.linkedOptionGroup` (jsonb) | `ProductGroup.linkedOptionGroupCodes[]` | ✅ 1:1 | Ej. CH01 · `['Armrests', 'Base', 'Casters']` |
| `ProductGroup.linkedFinishMaster` (jsonb) | `ProductGroup.linkedFinishMasterCodes[]` | ✅ 1:1 | Ej. CH01 · `['Fabric', 'Frame']` |
| `ProductItem.productItemCode` | `ProductStub.productItemCode` | ✅ 1:1 | Codes tipo `CH15.1`, `TB04.2`, `AL13.2` |
| `ProductItem.name` | `ProductStub.name` | ✅ 1:1 | |
| `ProductItem.manufacturer` | `ProductStub.manufacturerHint` | ✅ 1:1 | Field renombrable pre-prod |
| `ProductItem.priceEstimate` (min/max) | `ProductStub.priceEstimateMin/Max` | ✅ 1:1 | |
| `OptionGroup + OptionValue` | `Product.fabricOptions[]` (en catálogo rich) | ✅ Preexistente | Rename semántico pendiente |
| `FinishMaster + FinishOption + FinishValue` | `Product.finishes[]` (con `priceModifier`) | ✅ Preexistente | |
| **Space Type Setting** | `SpaceTypeSetting` | ⚠️ Overlay | Fuera del silver · capa de "space planning" propia |
| **SpaceBundle** | `SpaceBundle` | ⚠️ Overlay | Fuera del silver · idem |

## Agrupación 1-a-N · ejemplo verificado (Fase 3.1)

La relación **`ProductGroup` → N `ProductItem`** está soportada por `ProductGroup.itemIds: string[]`. El seed de Fase 3.1 expande 3 grupos representativos para demostrarlo:

### CH15 · Stool, Casual (3 variantes)

| ItemCode | Nombre | Manufacturer | Precio (est.) | Dimensiones |
|---|---|---|---|---|
| `CH15.1` | Enea Lotus Sled Stool | Steelcase Coalesse | $450 – $620 | Seat 26.25" (counter) / 30" (bar) |
| `CH15.2` | Enea Altzo Counter Stool | Coalesse | $520 – $720 | Seat 26.25" · 19"W × 19"D |
| `CH15.3` | Shortcut X-Base Bar Stool | Steelcase | $380 – $540 | Seat 30" (bar) · 17.5" × 17.5" |

Todas comparten `linkedOptionGroup: ['Base', 'Shell']` y `linkedFinishMaster: ['Fabric', 'Frame']`.

### TB04 · Table, Meeting, Laminate, Round Top (3 variantes)

| ItemCode | Nombre | Manufacturer | Precio (est.) | Dimensiones |
|---|---|---|---|---|
| `TB04` | Montara Round Meeting Table | seed original | $XXX – $XXX | 42" Dia |
| `TB04.2` | Lagunitas Round Meeting Table | Coalesse | $1,400 – $1,900 | 42" Dia · 29"H |
| `TB04.3` | media:scape Round Table (Non-Powered) | Steelcase | $1,800 – $2,400 | 48" Dia · 29"H |

### AL13 · Light, Floor Lamp (2 variantes)

| ItemCode | Nombre | Manufacturer | Precio (est.) | Dimensiones |
|---|---|---|---|---|
| `AL13` | Captain Flint LED Floor Lamp | Flos (Steelcase) | $900 – $1,200 | 14.7"W × 60.5"H × 8.3"D |
| `AL13.2` | Elka Floor Lamp | MillerKnoll (Muuto) | $620 – $850 | 10"Dia × 51.5"H |

## Cómo se ve en la UI

En **Product Catalog → Spaces → Focus Room** (o cualquier SpaceType detail), en el grid **"Bundle products"** al pie de cada setting, las mini cards cuyos productos pertenecen a un grupo con múltiples ProductItems muestran un badge `+N variants` en la esquina superior derecha del thumbnail. Click en el badge → expand inline con la lista de variantes hermanas + precio estimado.

El comportamiento del botón **"Add all N items to Selection"** no cambia · usa el `bi.itemId` default del bundle (silver schema · el bundle referencia un ProductItem específico, no un ProductGroup). La UI solo *visualiza* las alternativas · el swap de default queda para producción cuando exista el flujo de "choose variant".

## Gaps documentados para producción

### 1. Catalogue layer

Ausente en el modelo actual. `Manufacturer` sirve como proxy débil. Producción debe agregar:

```typescript
interface Catalogue {
  id: string
  manufacturerId: string  // FK
  catalogueNumber: string  // "SC-2023-Q3"
  activeDate: string       // ISO
  expirationDate: string
  status: 'draft' | 'active' | 'archived'
  currency: 'USD' | 'EUR' | 'CAD'
}
```

### 2. Space Type / SpaceBundle

Estos viven en una **capa de "space planning"** fuera del silver schema del catálogo. Producción debe agregar tabla `space_type_settings` (Postgres) o colección `spaceTypeSettings` (MongoDB) con:
- FK/refs a `ProductGroups` (no a items específicos · el bundle es del grupo, luego se materializa un item al momento del quote)
- `imageUrl`, `hotspots[]` (posiciones), `notes[]`
- `estimatedCostMin/Max`, `currency`

### 3. Options y Finishes normalizados

Los `Product.finishes[]` y `fabricOptions[]` actuales son flat inline. Producción debe normalizarlos como tablas separadas (`OptionGroup`, `OptionValue`, `FinishMaster`, `FinishOption`, `FinishValue`) con FKs · tal cual el silver schema. El shape ya matches semánticamente, solo falta el rename + normalización.

## Ejemplo de flujo en producción

Cuando el backend Strata materialice el silver schema, un query típico sería:

```sql
-- Bundle F1 · items con sus variantes disponibles
SELECT
  spb.setting_id,
  spb.qty,
  pg.product_group_code,
  pg.name AS group_name,
  pi.product_item_code,
  pi.name AS item_name,
  pi.price_estimate_min,
  pi.price_estimate_max
FROM space_type_settings sts
JOIN space_bundle_items spb ON spb.setting_id = sts.id
JOIN product_groups pg ON pg.id = spb.product_group_id
JOIN product_items pi ON pi.product_group_id = pg.id
WHERE sts.code = 'F1'
ORDER BY spb.sequence, pi.product_item_code;
```

Y devuelve N filas por bundle item · una por variante del ProductGroup.

## Referencias

- Plan del refactor · `~/.claude/plans/cuddly-greeting-meadow.md`
- Types · `src/catalog/types.ts` (comment header con jerarquía · líneas 218-235)
- Seed · `src/catalog/data/productGroups.ts` (PRODUCT_GROUPS + PRODUCT_STUBS)
- Overlay layer · `src/catalog/data/spaceTypes.ts` (SPACE_TYPES + SPACE_TYPE_SETTINGS)
