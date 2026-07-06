# Data Inventory · Product Catalog + My Selection

Última actualización · 2026-07-06 · Fase de diagnóstico (auditoría para alineación con silver schema Notion).

Este documento es la referencia canónica de la estructura de datos actual del proyecto `expert-catalog`. Sirve como fuente única para el equipo de BE/DBA al momento de conectar el prototype con producción, y como input al `docs/silver-schema-gap-analysis.md`.

---

## 1 · Executive summary

### Hallazgos top 7

1. **Data model bien establecido** — 16+ interfaces TypeScript exportadas cubren Product / Manufacturer / Catalog / SpaceType / Quote. Nomenclatura camelCase consistente. File organization limpia (`src/catalog/types.ts` como source of truth).

2. **Persistencia 100% localStorage, per-tenant** — no hay backend. 3 keys principales · `expert-hub-quotes-{tenantSlug}`, `expert-hub-custom-spaces-{tenantSlug}`, `expert-hub-quotes-view-mode`. Ideal para prototype; migración a DB requiere re-materializar el shape.

3. **Overlay Spaces fuera del silver schema** — SpaceType/SpaceTypeSetting/SpaceBundle son capa nuestra de "space planning" (no aparece en Notion doc 1). Es **decisión intencional**, no gap · debe documentarse en producción como tabla auxiliar (`space_type_settings` con FK a `product_groups`).

4. **Options y Finishes flat inline** — `Product.finishes[]` y `Product.fabricOptions[]` viven directamente en el Product. Notion los tiene normalizados en 2-3 niveles (`optionGroupCode → optionValue`; `masterFinishName → finishOptionName → finishValueName`). Es el gap con mayor impacto de refactor.

5. **Catalogue layer casi ausente** — `Catalog` cubre solo name/status. Faltan `catalogueNumber`, `activeDate`, `expirationDate`, `currency`. `Manufacturer` sirve como proxy débil.

6. **Cross-context bien delimitado** — solo 3 puentes entre Catalog y Quote: `addBundle` (SpaceTypeSetting → QuoteLineItem), `inferProductGroupCode` (Product → ProductGroup para badge), y merge de custom spaces al grid. Zero acoplamiento no documentado.

7. **Reference number determinístico** — `Q-YYYY-NNN-{TENANT}` generado en `createDraft` (QuoteContext.tsx:153-157). El count `NNN` reinicia por tenant.

### Prioridades sugeridas

- **P0 (semantic renames, low-risk)** · `Category` → `Section` (parcialmente hecho), `Product` → `ProductItem`, `linkedOptionGroupCodes` → `linkedOptionGroup`.
- **P1 (normalización)** · `Product.finishes[]` → tablas separadas `master_finish`/`finish_option`/`finish_value` con FKs.
- **P2 (Catalogue layer)** · agregar `Catalogue` como entidad separada de `Manufacturer` con dates + currency + status.
- **P3 (documentar overlay)** · Space Types como tabla auxiliar en la migration doc.

---

## 2 · Overview del data model

### 2.1 · Product data flow

```
Manufacturer (Allermuir/Allsteel/AIS/etc)
     │
     └── categories[] (Chairs/Sofas/Tables/Storage)
              │
              └── products[]  ─────► Product (rich)
                                          │
                                          ├── colorways[]        (Colorway · name/code/hex)
                                          ├── finishes[]         (Finish · id/name/swatch/priceModifier)
                                          ├── fabricOptions[]    (FabricOption · standard|special)
                                          ├── materialTiers[]    (MaterialTier · Standard|Premium|Special)
                                          ├── volumePricing[]    (VolumeTier · minQty/maxQty/pricePerUnit)
                                          ├── specs             (Record<string, string>)
                                          ├── performance       (Record<string, string>)
                                          ├── documents[]       (CatalogDocument · PDF list)
                                          ├── symbols[]         (SymbolFolder · AutoCAD/Revit/etc)
                                          ├── itemStatus        ('active'|'discontinued'|'discrepancy')
                                          └── productGroupCode? (link opcional a ProductGroup)

Catalog (independiente · connected/synced state)
     └── status: 'Active'/'Update Avail.'/'Archived'
```

### 2.2 · Spaces overlay data flow

```
SpaceType (Focus Room/Work Cafe/Huddle/etc · 11 tipologías)
     │
     └── settings[]  ─────► SpaceTypeSetting (F1/F2/WC1/etc · 15 seed + custom)
                                    │
                                    ├── description
                                    ├── notes[]
                                    ├── isCustom, createdAt, updatedAt
                                    └── bundle  ─────► SpaceBundle
                                                            │
                                                            ├── items[] · { productGroupCode, itemId, qty, label }
                                                            │       │
                                                            │       └── itemId resolves via findProductStub()
                                                            │                       │
                                                            │                       └── ProductStub (mini shape)
                                                            │
                                                            ├── estimatedCostMin
                                                            ├── estimatedCostMax
                                                            └── currency: 'USD'

ProductGroup (CH15/TB04/AL13/etc · 22 grupos)
     │
     ├── code (visible)
     ├── name / description
     ├── sectionId (FK → Section)
     ├── productTypeId (FK → ProductType)
     ├── linkedOptionGroupCodes[]   (referencias a "Armrests", "Base", etc)
     ├── linkedFinishMasterCodes[]  (referencias a "Frame", "Fabric", etc)
     └── itemIds[]                  (FK → ProductStub[]; 1-a-N variantes)
```

### 2.3 · Quote data flow

```
QuoteDraft (per-tenant, multi-draft)
     │
     ├── id / name / referenceNumber ('Q-YYYY-NNN-TENANT')
     ├── source: 'manual' | 'ingest'
     ├── sourceDocRef? (ingest doc ID)
     ├── status: 'draft' | 'in-progress-ingest' | 'submitted'
     ├── createdAt / updatedAt
     ├── buyerInfo  ─────► BuyerInfo
     │                          ├── user: UserCompanyProfile (email/fullName/title/phone/initials)
     │                          └── tenant: TenantMetadata (id/name/industry/legalName/billingAddress/taxId)
     │
     └── items[]   ─────► QuoteLineItem
                                ├── id (auto-generated)
                                ├── productId + productName + productBrand + productImage
                                ├── qty + unitPrice + totalPrice + leadTimeDays
                                ├── colorway* (code/name/hex)
                                ├── finish* (id/name)
                                ├── fabric* (id/name/isPremium)
                                ├── materialTier* (id/name)
                                ├── addedAt (ISO)
                                ├── sourceDocRef? (Phase 5 ingest)
                                └── setting* (settingCode/settingName/spaceTypeId) ← bundle-added marker
```

### 2.4 · Cross-context edges

| From | Bridge | To | Purpose |
|---|---|---|---|
| SpaceTypeSetting | `addBundle()` | QuoteLineItem[] | Add all items del bundle a la selection · setting metadata embedded |
| Product | `inferProductGroupCode()` | ProductGroup | Badge "Used in N settings" en cards + section en detail |
| ProductGroup | `settingsUsingProductGroup()` | SpaceTypeSetting[] | Lookup inverso · qué settings usan este group |
| Custom SpaceTypeSetting | `useCustomSpaces.allSettings` | Grid + detail | Merge de custom localStorage con seed |
| Product | `Product.productGroupCode?` | ProductGroup | Link opcional (backwards compat con seeds sin productGroupCode) |

### 2.5 · Tipos ↔ archivos seed cross-ref

| Interface | Definido en | Seed en |
|---|---|---|
| `Product` | `src/catalog/types.ts:83` | `src/catalog/data/manufacturers.ts` + `src/catalog/showroom/data/unifiedProducts.ts` |
| `Manufacturer` | `types.ts:177` | `manufacturers.ts` (3 brands seed) |
| `Catalog` | `types.ts:202` | `src/catalog/data/catalogs.ts` (3 catalogs seed) |
| `Section` / `ProductType` / `ProductGroup` | `types.ts:241,249,260` | `src/catalog/data/productGroups.ts` |
| `ProductStub` | `productGroups.ts:293` (local interface) | `productGroups.ts` PRODUCT_STUBS[] |
| `SpaceType` | `types.ts:281` | `src/catalog/data/spaceTypes.ts` SPACE_TYPES[] (11 tipos) |
| `SpaceTypeSetting` | `types.ts:301` | `spaceTypes.ts` SPACE_TYPE_SETTINGS[] (15 seed) + `useCustomSpaces` localStorage |
| `SpaceBundle` | `types.ts:324` | nested dentro de SpaceTypeSetting |
| `QuoteLineItem` | `src/quote/QuoteContext.tsx:22` | Runtime · desde addItems/addBundle |
| `QuoteDraft` | `QuoteContext.tsx:54` | Runtime · desde createDraft |
| `BuyerInfo` | `QuoteContext.tsx:52` | Auto-fill desde `src/quote/tenantData.ts` + `src/quote/userProfile.ts` |

---

## 3 · Product Catalog · sub-modes Products / Materials

### 3.1 · Types consumidos

#### Product (`src/catalog/types.ts:83-152`)

30+ campos, la mayoría opcionales:

**Identidad**:
- `id: string` (required)
- `name: string`
- `description: string`
- `brand?: string`
- `category?: string`

**Media**:
- `images: string[]` (URLs, primer elemento es hero)
- `galleries?: string[]` (secundarias)

**Pricing**:
- `price?: number` (dealer price)
- `listPrice?: number` (list price antes de discount)
- `volumePricing?: VolumeTier[]`

**SKUs** (Phase 2 Fix #6):
- `manufacturerSku?: string`
- `internalSku?: string`
- `itemStatus?: 'active' | 'discontinued' | 'discrepancy'`

**Metadata comercial**:
- `dealerRating?: number` (1-5)
- `leadTime?: string` ("In Stock" | "2-3 weeks" | etc)
- `tags?: string[]`
- `popular?: boolean`
- `collection?: string` (Phase 4)

**Variants**:
- `colorways: Colorway[]`
- `finishes?: Finish[]`
- `fabricOptions?: FabricOption[]`
- `materialTiers?: MaterialTier[]`
- `material?: string`
- `upholstery?: string`

**Dimensions**:
- `dimensions?: { width?, depth?, height?, weight? }` (string/string/string/string)

**Rich content** (rendered en ProductDetailPanel):
- `standardFeatures?: string[]`
- `optionalFeatures?: string[]`
- `specs?: Record<string, string>` (COMPOSITION/GUARANTEE/etc)
- `performance?: Record<string, string>` (FLAMMABILITY/ABRASION/etc)
- `cleaning?: string`
- `documents?: CatalogDocument[]` ({ name, type: 'pdf' })
- `symbols?: SymbolFolder[]` ({ name: 'AutoCAD (DWG)', files: 12 })

**Fase 1 refactor (silver schema alignment)**:
- `productGroupCode?: string` (link a ProductGroup.code)
- `productItemCode?: string` (Notion productItemCode)
- `productGroupId?: string`
- `spaceProfile?: Array<'CCO' | 'GW' | 'CI'>`

**Materials flag**:
- `isMaterial?: boolean` (true → Materials mode, false/undefined → Products)

#### Colorway (`types.ts:8-12`)
```ts
{ name: string; code: string; hex: string }
```

#### Finish (`types.ts:47-56`)
```ts
{
  id: string
  name: string
  swatch: string       // hex del swatch
  priceModifier: number
  leadTimeAdjust: number
}
```

#### FabricOption (`types.ts:58-65`)
```ts
{
  id: string
  name: string
  type: 'standard' | 'special'    // premium = special
  priceModifier: number
  leadTimeAdjust: number
}
```

#### MaterialTier (`types.ts:76-81`)
```ts
{
  id: string
  name: string          // "Standard" | "Premium" | "Special-order"
  priceModifier: number
  leadTimeAdjust: number
}
```

#### VolumeTier (`types.ts:67-74`)
```ts
{ minQty: number; maxQty: number; pricePerUnit: number }
```

#### Manufacturer (`types.ts:177-193`)
17 campos: id, name, description, logo, heroImage, bgColor, textColor, accentColor, type ('products'|'materials'|'both'), binderCount, filterOptions, brandResources[], contacts[], categories[]

#### Catalog (`types.ts:202-213`)
```ts
{
  id: number
  name: string
  version: string
  items: number
  lastSync: string
  cover: string
  status: 'Active' | 'Update Avail.' | 'Archived'
  owner: string
  image: string
}
```

#### ItemStatus (`types.ts:43`)
```ts
type ItemStatus = 'active' | 'discontinued' | 'discrepancy'
```

#### ProductSortKey (`types.ts:156-164`)
```ts
type ProductSortKey =
  | 'relevant' | 'history-first' | 'top-rated'
  | 'price-asc' | 'price-desc' | 'lead-time'
  | 'in-stock' | 'newest'
```

### 3.2 · Seed data

#### `src/catalog/data/manufacturers.ts` (38.6 KB)

- Exporta `MANUFACTURERS: Manufacturer[]` (3 brands: Allermuir, Allsteel, AIS)
- Cada brand tiene `type: 'products' | 'materials' | 'both'`
- Cada categoría anida `products: Product[]` con rich data (imágenes de Unsplash, specs, docs, symbols, colorways, features)

#### `src/catalog/showroom/data/unifiedProducts.ts`

- `UNIFIED_PRODUCTS: Product[]` (flatten de MANUFACTURERS.categories.products enriquecido con price/rating/leadTime/tags determinísticos)
- `UNIFIED_INDEX: Record<productId, ProductContext>` donde `ProductContext = { product, manufacturer, category }`
- `UNIFIED_BRANDS: string[]`
- `UNIFIED_CATEGORIES: string[]`
- `UNIFIED_FEATURES: string[]`
- `UNIFIED_PRICE_RANGES: { label, min, max }[]` (4 buckets: <$300, $300-700, $700-1200, >$1200)
- Helpers · `getProductContext(id)`, `getManufacturerByName(name)`

#### `src/catalog/data/catalogs.ts`

- 3 seed catalogs (uno por brand) con status Active/Update Avail./Archived
- External store pattern (no React Context) con `useCatalogs()` hook + `setCatalogs()` mutator
- Reactive · las mutaciones (sync/disconnect) actualizan el store global

### 3.3 · UI rendering

#### ProductCatalogCard (`src/catalog/shop/ProductCatalogCard.tsx`)

Campos visibles:
- `product.images[0]` (thumbnail, lazy load, aspect 4/3)
- Checkbox `selected`
- Nombre (clickable → onOpen)
- Brand (secondary line)
- Internal SKU (monospace, muted · Phase 2 Fix #6)
- Price + listPrice (con strikethrough + "Save X%" badge si aplica)
- Colorway swatches (hex circles, primeros 5)
- Tags (badges)
- ItemStatus badge (Discontinued | Out of sync · solo si !== 'active')
- "Previously selected" badge (from quotedHistory · Phase 4 Fix #13b)
- "Used in N settings" badge (Fase 3 · via inferProductGroupCode)
- Favorite heart (toggle)
- "Add to Selection" primary CTA

#### Filter sidebar (ShowroomPage.tsx:527-820)

- **Search** input · busca en `name`, `brand`, `internalSku`, `manufacturerSku`, `description`, `category`, `material`
- **Sort dropdown** · 8 opciones (relevant/history-first/top-rated/price-asc/price-desc/lead-time/in-stock/newest)
- **FilterSection · Category** · checkboxes derivados de `taxoProducts.map(p => p.category)`
- **FilterSection · Brand** · defaultOpen · checkboxes de brands únicos
- **FilterSection · Item Status** · 3 fixed (active/discontinued/out-of-sync) · solo en Products mode (hidden en Materials)
- **FilterSection · Collection** · solo en Products mode · mock per brand + `deriveCollection()` fallback
- **FilterSection · Features / Tags** · checkboxes desde `taxoProducts.flatMap(p => p.tags)`
- **FilterSection · Price Range** · UNIFIED_PRICE_RANGES (4 buckets)
- **FilterSection · Color** · swatches desde `colorways[].hex` únicos
- **Favorites toggle** · button "Favorites only" con badge count
- **Bulk Actions bar** (BulkActionsBar) · conditional cuando `selected.size > 0`

### 3.4 · Filter/sort state (ShowroomPage.tsx:95-199)

```ts
// Products/Materials
const [taxonomy, setTaxonomy] = useState<'products' | 'materials' | 'spaces'>('products')
const [search, setSearch] = useState('')
const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
const [selectedItemStatuses, setSelectedItemStatuses] = useState<Set<ItemStatus>>(new Set())
const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set())
const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set())
const [selectedPrices, setSelectedPrices] = useState<Set<string>>(new Set())
const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set())
const [sort, setSort] = useState<ProductSortKey>('relevant')
const [page, setPage] = useState(1)             // PAGE_SIZE = 8
const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
const [selected, setSelected] = useState<Set<string>>(new Set())     // bulk multi-select
const [favorites, setFavorites] = useState<Set<string>>(new Set())
```

### 3.5 · Materials mode (delta vs Products)

- Dataset: `UNIFIED_PRODUCTS.filter(p => p.isMaterial)` (ShowroomPage.tsx:186)
- Filters hidden: Item Status, Collection (líneas 135-136)
- Tags siempre incluyen 'Textile' fallback (unifiedProducts.ts:33)
- Materials incluye brands acústicos: Camira, HBF, Luum, Mayer Fabrics

---

## 4 · Product Catalog · sub-mode Spaces

### 4.1 · Types

#### SpaceType (`types.ts:281-291`)
```ts
{
  id: string                          // "sp-focus-room"
  name: string                        // "Focus Room"
  code: string                        // "focus-room"
  icon?: string                       // emoji "🎯"
  imageUrl: string                    // "/images/spaces/focus-room.jpg"
  description: string
  spaceProfile: Array<'CCO' | 'GW' | 'CI'>  // Contact Center / General Workspace / Client Interact
}
```

#### SpaceTypeSetting (`types.ts:301-319`)
```ts
{
  id: string                          // "sts-focus-room-f1" o "custom-{timestamp}"
  code: string                        // "F1", "WC1", "F-CUSTOM-1"
  name: string
  spaceTypeId: string                 // FK → SpaceType.id
  imageUrl?: string
  description: string
  notes?: string[]
  bundle: SpaceBundle
  isCustom?: boolean                  // Fase 5
  createdAt?: string                  // ISO · solo en custom
  updatedAt?: string                  // ISO · solo en custom
}
```

#### SpaceBundle (`types.ts:324-336`)
```ts
{
  id: string
  settingId: string                   // FK → SpaceTypeSetting.id
  items: Array<{
    productGroupCode: string          // "CH15", "TB04"
    itemId: string                    // Product.id o ProductStub.id
    qty: number
    label?: string                    // hotspot label opcional
  }>
  estimatedCostMin: number
  estimatedCostMax: number
  currency: 'USD'
}
```

#### ProductGroup (`types.ts:260-273`)
```ts
{
  id: string
  code: string                              // "CH15", "TB04"
  name: string                              // "Stool, Casual"
  description: string
  sectionId: string                         // FK → Section.id
  productTypeId: string                     // FK → ProductType.id
  linkedOptionGroupCodes?: string[]         // ["Armrests", "Base"]
  linkedFinishMasterCodes?: string[]        // ["Frame", "Fabric"]
  itemIds: string[]                         // FK → ProductStub.id[]
}
```

#### Section (`types.ts:243-246`)
```ts
{ id: string; name: string; slug: string; order: number }
```

Seed: 6 secciones (Ancillary, Casegoods, Seating, Storage, Tables, Workstations).

#### ProductType (`types.ts:250-252`)
```ts
{ id: string; name: string }
```

Seed: 8 tipos (Chair, Table, Lamp, Storage, Panel, Casegood, Screen, Accessory).

#### ProductStub (`productGroups.ts:293-303`)
```ts
{
  id: string
  productGroupCode: string          // "CH15"
  productItemCode: string           // "CH15.1"
  name: string                      // "Enea Lotus Sled Stool"
  manufacturerHint?: string         // "Steelcase Coalesse"
  priceEstimateMin: number
  priceEstimateMax: number
  dimensions?: string               // '26.25" (counter) / 30" (bar) · 18.25"W × 18"D'
  notes?: string[]
  imageUrl?: string
  isStub: true                      // discriminator
}
```

### 4.2 · Seed data (`src/catalog/data/spaceTypes.ts`)

- `SPACE_TYPES: SpaceType[]` · 11 tipologías (Focus Room, Work Cafe, Huddle, Meeting Room, Front Porch, Reception, Cafeteria, Training Room, Phone Booth, Wellness Room, Other)
- `SPACE_TYPE_SETTINGS: SpaceTypeSetting[]` · 15 settings pre-armados
- Helpers: `findSpaceTypeByCode`, `settingsForSpaceType`, `findSettingByCode`, `settingsUsingProductGroup`, `findSpaceTypeById`
- Fase 4 helpers: `spaceTypeMinCost`, `spaceTypeMaxCost`, `spaceTypeSettingsCount`, `getBrandsInSpaceType`, `getAllBrandsInSpaces`, `spaceTypeMatchesSearch`

### 4.3 · SpaceTypesPage grid

Fields renderizados por card:
- `type.imageUrl` (thumbnail aspect-video)
- `type.icon` (emoji sobre-impuesto bottom-left)
- `type.spaceProfile` (badges top-right sobre img)
- `type.name` (title)
- `type.description` (clamped 3 lines)
- `settingsForSpaceType(type.id).length` ("N settings")
- `spaceTypeMinCost(type)` ("From $X")
- Badge "N custom" top-left cuando el parent tiene custom (Fase 5)

Filter/sort state (Fase 4):
```ts
const [spacesSearch, setSpacesSearch] = useState('')
const [spacesSelectedProfiles, setSpacesSelectedProfiles] = useState<Set<string>>(new Set())
const [spacesSelectedCostBuckets, setSpacesSelectedCostBuckets] = useState<Set<string>>(new Set())
const [spacesSelectedBrands, setSpacesSelectedBrands] = useState<Set<string>>(new Set())
const [spacesSort, setSpacesSort] = useState<SpacesSortKey>('alpha')
```

Cost buckets: `<$2000` / `$2000-5000` / `$5000-10000` / `$10000+`.
Sort options: alpha / cost-asc / cost-desc / settings-count.

### 4.4 · SpaceTypeDetailPage

Per setting renderiza:
- **SpaceBundleCard**:
  - Left: SpaceRendering (foto real del SpaceType + hotspots numerados overlay)
  - Right: Config numerada · code + name + description + items[] (badge circular numerado, code underline dotted, name, manufacturer hint, qty)
  - Estimated Cost prominent
  - Notes con Info icon
  - "Add all N items to Selection" button

- **Bundle products grid** (mini cards 2/3/4 col responsive):
  - ProductIcon con foto real del ProductGroup (fallback icon Lucide)
  - `stub.productItemCode` + `stub.manufacturerHint`
  - `stub.name`
  - Precio mid (average de min/max)
  - Badge "+N variants" cuando hay múltiples ProductStubs con mismo productGroupCode
  - Variant expander inline (Fase 3)

- **Toolbar sobre custom cards** (Fase 5): Custom badge + Edit/Duplicate/Delete inline

### 4.5 · Custom Spaces flow

#### CreateEditSpaceModal (`src/catalog/spaces/CreateEditSpaceModal.tsx`)

Wizard 2 steps.

**Step 1 · Basic info**:
- Parent SpaceType picker (grid 5-col con thumbnails)
- `code: string` (required, max 20 chars)
- `name: string` (required)
- `description: string` (textarea)
- `notesText: string` (textarea multi-line, split \n → notes[])

Defaults derivados por parent (Fase 5.1):
- code: `{initials}-CUSTOM` (Focus Room → 'FR-CUSTOM')
- name: `${parentName} · Custom`
- description: `Custom ${parentName.toLowerCase()} configuration curated by the dealer for this project.`
- notes: 2 líneas default ('Rendering is for reference only', 'Products can be swapped at quote time')

Flags `codeTouched/nameTouched/descTouched/notesTouched` para saber si re-populate al cambiar parent.

**Step 2 · Product picker**:
- Search input
- Brand chips filter (multi-select checkboxes)
- Grid left · UNIFIED_PRODUCTS filtrados (isMaterial=false), slice 40 visibles
- Panel right · draftItems[] con badge numerado + qty stepper (+/-) + trash
- Footer: totalUnits + totalEstimate + estimated cost preview

Output `CreateCustomSpaceInput` (`useCustomSpaces.ts:19-37`):
```ts
{
  code: string
  name: string
  spaceTypeId: string
  description: string
  notes?: string[]
  items: Array<{
    productGroupCode: string
    itemId: string           // Product.id real
    qty: number
    label?: string
    productName?: string
    productBrand?: string
    productImageUrl?: string
    estimatedPrice?: number
  }>
}
```

#### useCustomSpaces hook (`src/catalog/spaces/useCustomSpaces.ts`)

- Persistence: `localStorage['expert-hub-custom-spaces-{tenantSlug}']`
- API:
  - `customSettings: SpaceTypeSetting[]`
  - `allSettings: SpaceTypeSetting[]` (seed + custom mergeados)
  - `createCustom(input)`
  - `updateCustom(id, input)` (preserva id + createdAt)
  - `duplicateCustom(id)` (clona con code + '-COPY' y name + ' (Copy)')
  - `deleteCustom(id)`
  - `isCustomSettingId(id)` · discriminator
  - `findSetting(id)` · lookup en custom + seed

- Cost auto-computed: `estimatedCostMin = 90% del totalEstimate`, `estimatedCostMax = 110%`.

---

## 5 · My Selection · Quotes

### 5.1 · Types (`src/quote/QuoteContext.tsx`)

#### QuoteLineItem (`QuoteContext.tsx:22-49`)

**Required**:
- `id: string`
- `productId: string`
- `productName: string`
- `productImage: string`
- `qty: number`
- `unitPrice: number`
- `totalPrice: number`
- `leadTimeDays: number`
- `addedAt: string` (ISO)

**Optional variants**:
- `productBrand?: string`
- `colorwayCode?: string`
- `colorwayName?: string`
- `colorwayHex?: string`
- `finishId?: string`
- `finishName?: string`
- `fabricId?: string`
- `fabricName?: string`
- `fabricIsPremium?: boolean`
- `materialTierId?: string`
- `materialTierName?: string`

**Origin markers**:
- `sourceDocRef?: string` (Phase 5 · doc-ingest)
- `settingCode?: string` (Fase 3 · bundle-add: "F1", "WC1")
- `settingName?: string` (Fase 3)
- `spaceTypeId?: string` (Fase 3 · para icon del header en By Space view)

#### BuyerInfo (`QuoteContext.tsx:52-55`)
```ts
{
  user: UserCompanyProfile
  tenant: TenantMetadata
}
```

#### QuoteDraftStatus (`QuoteContext.tsx:57`)
```ts
type QuoteDraftStatus = 'draft' | 'in-progress-ingest' | 'submitted'
```

#### QuoteDraft (`QuoteContext.tsx:59-71`)
```ts
{
  id: string                            // "draft-{random}"
  name: string
  source: 'manual' | 'ingest'
  sourceDocRef?: string
  items: QuoteLineItem[]
  buyerInfo: BuyerInfo
  status: QuoteDraftStatus
  createdAt: string
  updatedAt: string
  referenceNumber?: string              // "Q-2026-001-SPECIALT"
}
```

#### LastAddedSummary (`QuoteContext.tsx:79-87`)
Fired post-add · consumed by MiniCartDrawer.

#### EditingItemState (`QuoteContext.tsx:92-95`)
```ts
{ draftId: string; item: QuoteLineItem }
```
Cuando set, App.tsx renderea ProductDetailPanel en modo "Update item".

#### QuotedHistoryEntry (`QuoteContext.tsx:99-107`)
```ts
{
  productId: string
  occurrences: number       // total lines cross-drafts
  totalUnits: number        // sum qty
  lastQuotedAt: string      // max updatedAt
}
```

### 5.2 · useQuote() API (14 métodos)

**Reads** (State):
| Field | Type | Description |
|---|---|---|
| `drafts` | `QuoteDraft[]` | Todos los drafts del tenant activo (sorted by updatedAt desc) |
| `activeDrafts` | `QuoteDraft[]` | `drafts.filter(d => d.status !== 'submitted')` |
| `submittedDrafts` | `QuoteDraft[]` | `drafts.filter(d => d.status === 'submitted')` |
| `activeDraftId` | `string \| null` | Most recently updated non-submitted draft |
| `activeDraft` | `QuoteDraft \| null` | Resolved from activeDraftId |
| `buyerInfo` | `BuyerInfo` | Memoized · fresh en cada draft nuevo |
| `lastAdded` | `LastAddedSummary \| null` | Clears 20s post-fire o al cambiar tenant |
| `editingItem` | `EditingItemState \| null` | Drives edit panel |
| `quotedHistory` | `Map<string, QuotedHistoryEntry>` | Memoized cross-drafts |

**Writes** (Methods):

| Method | Signature | Location |
|---|---|---|
| `setActiveDraft` | `(draftId: string) => void` | QuoteContext.tsx:253 |
| `createDraft` | `(opts?: { source?, sourceDocRef?, name? }) => QuoteDraft` | 257 |
| `deleteDraft` | `(draftId: string) => void` | 284 |
| `addItems` | `(items: Omit<QuoteLineItem,'id'\|'addedAt'>[], draftId?) => string` | 296 |
| `addBundle` | `(setting: SpaceTypeSetting, draftId?) => string` | 361 |
| `updateItem` | `(draftId, itemId, patch: Partial<QuoteLineItem>) => void` | 391 |
| `removeItem` | `(draftId, itemId) => void` | 407 |
| `clearDraftItems` | `(draftId) => void` | 421 |
| `submitDraft` | `(draftId) => string` (returns referenceNumber) | 433 |
| `markInProgressIngest` | `(draftId) => void` | 452 |
| `renameDraft` | `(draftId, name) => void` | 463 |
| `startEditingItem` | `(draftId, item) => void` | 385 |
| `stopEditingItem` | `() => void` | 389 |
| `clearLastAdded` | `() => void` | 354 |

### 5.3 · Persistencia

| Key | Contenido | Producer | Consumer |
|---|---|---|---|
| `expert-hub-quotes-{tenantSlug}` | `QuoteDraft[]` (full JSON) | QuoteContext (mount save + every mutation) | QuoteContext (mount load) |
| `expert-hub-custom-spaces-{tenantSlug}` | `SpaceTypeSetting[]` (isCustom=true) | useCustomSpaces | useCustomSpaces + Showroom + SpaceTypeDetailPage |
| `expert-hub-quotes-view-mode` | `'flat' \| 'byspace'` | QuotesPage DraftDetail | idem (persist across refresh) |

Multi-tenant: nested `Record<tenantSlug, QuoteDraft[]>` in memory; solo se serializa el slug activo.

### 5.4 · UI screens

#### MiniCartDrawer (`src/quote/MiniCartDrawer.tsx`)

Drawer slide-in cuando `lastAdded !== null` o `manuallyOpened === true`. Auto-dismiss 20s, pausa con hover.

Renderiza:
- Header: `lastAdded.itemCount` (badge new), `activeDraft.name`, `activeDraft.buyerInfo.tenant.name` (badge)
- Items (slice 4): thumbnail (con fallback initials si productImage vacío), name, colorwayHex + colorwayName, fabricIsPremium chip, **settingCode pill** (Fase 3), qty stepper, edit pencil, remove trash
- Footer: totalInCart (sum qty), totalPriceInCart, allItems.length
- FAB (collapsed): totalUnits badge + pulse recientemente-agregado

#### QuotesPage sidebar

Cada DraftListItem muestra:
- referenceNumber (monospace)
- name
- itemCount (line count)
- unitCount (sum qty)
- total price
- Badge "submitted" si aplica
- Badge sparkle si `source === 'ingest'`
- Delete button (hover-shown)

#### QuotesPage DraftDetail

- **Buyer info card**: user.fullName + user.title, user.email, user.phone, tenant.legalName, tenant.industry, tenant.taxId, tenant.billingAddress (full)
- **Line items** (flat mode default):
  - Thumbnail (64px con fallback initials)
  - productBrand + productName + "Previously selected" badge (si aplica)
  - colorwayHex + colorwayName + finishName + fabricName + fabricIsPremium badge + materialTierName
  - "Ships in {formatLeadTime(leadTimeDays)}"
  - qty input + `@ ${unitPrice}` + totalPrice
  - Edit/Remove buttons (si !isSubmitted)
- **By Space grouped mode** (visible si hasBundleItems):
  - Group headers: spaceType.icon + settingCode pill + settingName + itemCount + unitCount + groupSubtotal
  - Individual selections group para items sin settingCode
  - Collapse/expand state per group (`collapsedGroups: Set<string>`)
- **Totals**: totalUnits, maxLead, total (highlighted). Submit CTA o "Submitted · reference {refNumber}" text.

#### Toggle Flat list / By Space

- Visible solo si `draft.items.some(it => it.settingCode)` (hasBundleItems)
- Persist en `localStorage['expert-hub-quotes-view-mode']`
- Groups computados por `groupItemsBySpace(items)`: Map por settingCode → array, con `__individual__` group al final para items sin settingCode

#### Submit confirmation

`SubmittedConfirmation` component: reference number, tenant name, "we'll be in touch within 24 hours", View submitted / Back to Catalog CTAs.

### 5.5 · Buyer info sources

#### `src/quote/userProfile.ts` · getUserCompanyProfile

- Reads `AuthContext.user?.email`
- Lookup table `USER_PROFILES` con 4 usuarios demo (emails específicos)
- Fallback si no matchea: email como fullName, title 'Buyer', phone '—'
- Fields output: `{ email, fullName, title, phone, initials }`

#### `src/quote/tenantData.ts` · getTenantMetadata

- Reads `TenantContext.currentTenant` (slug string)
- Lookup table con 5 tenants demo (DEALER 1 = special-t, Meridian Office, Strata, Apex Interiors, ClearSpace Design)
- Fields output: `{ id, name, industry, legalName, billingAddress: {line1, city, state, zip}, taxId, billingContactEmail, badgeColor }`

### 5.6 · Reference number generation

`QuoteContext.tsx:153-157`:

```ts
function generateReferenceNumber(tenantSlug: string, draftCount: number): string {
  const seq = (draftCount + 1).toString().padStart(3, '0')
  const tenantPart = tenantSlug.toUpperCase().replace(/-/g, '').slice(0, 8)
  return `Q-2026-${seq}-${tenantPart}`
}
```

Ejemplos:
- `special-t` + count=0 → `Q-2026-001-SPECIALT`
- `meridian-office` + count=5 → `Q-2026-006-MERIDIAN`

Generado at `createDraft` time · preservado on submit. Re-generado si el draft se re-hidrata sin referenceNumber (backwards compat).

---

## 6 · Modales secundarios · 7 flows I/O

### 6.1 · ProductDetailPanel (`src/catalog/browse/ProductDetailPanel.tsx`)

5 tabs · h-[88vh] max-w-6xl modal (Headless UI Dialog).

**Input**: `Product`, `Manufacturer`, `Category`, `EditingItemState` (edit mode pre-fill), queue mode {current, total}.

**QuoteTab** (default):
- Multi-line quote builder · N líneas con: qty, colorwayCode, finishId, fabricId, materialTierId
- QuoteLineEditor sub-component per línea
- `computeLineItemTotals()` calcula precio unit + total con modifiers de finishes/fabrics/materialTiers
- Output → `addItems(QuoteLineItem[])` o `updateItem(...)` según mode

**OverviewTab**:
- description, tags, standardFeatures, optionalFeatures
- StrataRecommendsSection (complementary/betterPrice/fasterDelivery buckets)
- **UsedInSettingsSection** (Fase 3) · via `inferProductGroupCode()` + `settingsUsingProductGroup()` · chips por setting con icon + code

**VariantsTab**:
- finishes[], fabricOptions[] (standard/premium separados), materialTiers[]
- Display-only · el selector real vive en QuoteTab

**SpecsTab**:
- specs {} (Record) + performance {} + dimensions + material/upholstery
- Cleaning notes

**ResourcesTab**:
- documents[] (PDF list)
- brandResources[] links
- contacts[] (name/title/email/phone)
- symbols[] (AutoCAD/Revit/etc con file count)

**Output**:
- Add mode: `addItems(lines)` → nuevo/agregado en active draft
- Edit mode: `updateItem(draftId, itemId, patch)` → mutación in-place
- Compare picker → CompareModal
- Bulk RFQ queue → cycle through selected products con onAfterAdd callback

### 6.2 · ManageCatalogs (`src/catalog/manage/ManageCatalogs.tsx`)

3 tabs · full-page section (not modal).

**Catalogs tab**:
- `CatalogLibrary` renderiza list de connected catalogs
- Actions per row · Sync (mutation via `setCatalogs`), Disconnect

**Preferences tab**:
- `ClientPolicyManager` · buying preferences per tenant
- Persist: `localStorage` per-tenant key (via savePreferences helper)

**Smart Quote tab**:
- `SmartQuoteHub` con gen-ui provider

**Data source**: `useCatalogs()` (reactive external store), tenant prefs localStorage.

### 6.3 · IngestQuoteModal (`src/quote/IngestQuoteModal.tsx`)

4-step wizard.

**Step 1 · Upload**:
- Fields: `docType: 'quote' | 'po' | 'ack'`, `onSelectSample(docId)`, drop zone (mock)
- Sample docs list (MOCK_INGEST_DOCS)

**Step 2 · Processing**:
- 5 sequential phases (reading → extracting → matching → identifying → suggesting)
- Progress bar animado

**Step 3 · Review**:
- Extracted `ReviewLine[]` con match status: matched | discrepancy | no-match | special-order
- Actions per row: accept | substitute | skip
- Bulk actions: accept all, substitute all, skip special

**Step 4 · Confirm**:
- Summary: items accepted, substituted, skipped, source doc ref
- Confirm → creates `QuoteDraft` con `source='ingest'`, `sourceDocRef=doc.id` + agrega lineItems aceptados

**Output** (via `useQuote()`):
- `createDraft({ source: 'ingest', sourceDocRef, name })`
- `addItems(acceptedLines, draftId)`
- `onComplete(draftId)` callback

### 6.4 · CreateEditSpaceModal

Ver Sección 4.5 arriba (detallado).

### 6.5 · CompareModal (`src/catalog/shop/CompareModal.tsx`)

Side-by-side table hasta 4 products.

**Rows** por category:
- Identity: image + name + "Add to Selection" per column
- Basic: brand, MFR SKU, Internal SKU, tags, dealer rating
- Variants & Finish: colorways (5 swatches), material, upholstery
- Dimensions: width/depth/height/weight
- Pricing & Availability: lead time, price

**Fields shown**: todos los Product fields relevantes. Missing → "—" placeholder.

**Output**: `addItems(product, qty=1)` con default variants (usa primer colorway/finish/fabric/materialTier).

### 6.6 · CatalogImportModal (`src/catalog/manage/CatalogImportModal.tsx`)

3 tabs · Add/Sync/Preferences.

**Add tab** (4 steps):
1. Source: URL / File / ERP + input
2. Tenant scope: Current / All / Specific (multi-select)
3. Processing: 5 stages con progress
4. Complete: editable AI-suggested name + summary stats

**Sync tab**:
- List of connected catalogs
- Inline row actions: Sync (triggers `simulateSyncDelta` → mutates via `setCatalogs`), Disconnect (confirm → remove)
- Toast feedback

**Preferences tab**:
- `PreferencesPanel` con rules count badge
- Reset / Save preferences footer actions

**State fields**: activeTab, sourceType, url, selectedErpCatalog, tenantScope, selectedTenants[], step, processStage, progress.

**Output**:
- Catalogs mutations (global reactive store) reflejadas en ShowroomCatalogsBar + product card status badges
- Preferences localStorage per tenant

### 6.7 · SpaceTypeDetailPage actions

**Custom-only actions** (inline toolbar sobre card cuando `isCustom(setting.id) === true`):
- **Edit** (pencil) · `onEditCustom(setting)` → abre CreateEditSpaceModal en edit mode
- **Duplicate** (copy) · `onDuplicateCustom(id)` → clona setting
- **Delete** (trash) · inline confirm "Delete? Yes · No" → `onDeleteCustom(id)`

**Always-available**:
- **Add all N items to Selection** (SpaceBundleCard footer) · `addBundle(setting)` → adds all bundle items como line items con qty preservada + setting metadata embedded

**Bundle products grid** (mini cards):
- ProductIcon con foto real
- `stub.productItemCode` + `stub.manufacturerHint` + `stub.name` + priceMid
- Variant expander (Fase 3) · si hay múltiples ProductStubs con mismo productGroupCode → chip "+N variants" abre lista inline

---

## 7 · Cross-context data links

### 7.1 · addBundle · SpaceTypeSetting → QuoteLineItem[]

`QuoteContext.tsx:361-383`.

**Input**: `SpaceTypeSetting` (seed o custom, resolved via `useCustomSpaces.findSetting`).

**Resolution**:
- Para cada `bundleItem` en `setting.bundle.items[]`:
  - Resolve `stub = findProductStub(bundleItem.itemId)`
  - Si stub no encontrado · silent skip (defensive)
  - Compute `avgPrice = round((stub.priceEstimateMin + stub.priceEstimateMax) / 2)`
  - Push line: `{ productId, productName, productBrand, productImage, qty, unitPrice, totalPrice, leadTimeDays: 30, settingCode, settingName, spaceTypeId }`

**Delegation**: `addItems(lineInputs, draftId)` · returns draftId string.

**Embedded metadata** (Fase 3):
- `settingCode`, `settingName`, `spaceTypeId` en cada line item → drive By Space grouping en QuotesPage/MiniCartDrawer.

### 7.2 · inferProductGroupCode · Product → ProductGroup

`productGroups.ts` (helper).

Heurística orderada:
1. Si `product.productGroupCode` set → return directamente
2. NAME_OVERRIDES dict lookup (Axyl → CH15, Bastille → CH06, Kite Sofa → CH08, Hive Ottoman → CH09, Acuity → CH01, Calibrate → CH03, etc)
3. Regex sobre `category + name + description + specs.APPLICATION`
4. Fallback genérico "chair|sofa|seating" → CH03 · "table" → TB01

Consumer:
- `ProductCatalogCard` · badge "Used in N settings" (via `settingsUsingProductGroup(code).length`)
- `ProductDetailPanel` · sección UsedInSettingsSection en OverviewTab

### 7.3 · settingsUsingProductGroup · lookup inverso

`spaceTypes.ts:334`:

```ts
export function settingsUsingProductGroup(productGroupCode: string): SpaceTypeSetting[] {
  return SPACE_TYPE_SETTINGS.filter(s =>
    s.bundle.items.some(i => i.productGroupCode === productGroupCode)
  )
}
```

Nota: solo busca en seed (`SPACE_TYPE_SETTINGS`), no en custom. En producción debería considerar allSettings.

### 7.4 · Custom Spaces merge

`useCustomSpaces.ts` expone `allSettings`:

```ts
const allSettings = [...SPACE_TYPE_SETTINGS, ...customSettings]
```

Consumer:
- `ShowroomPage` · pasa `customSettings.filter(cs => cs.spaceTypeId === selectedSpaceType.id)` a `SpaceTypeDetailPage`
- Grid principal (SpaceTypesPage) recibe `customCountByParent` para badge

### 7.5 · Product.productGroupCode (opcional link)

Backwards-compat · seeds antiguos (Allermuir/Allsteel/AIS) no tienen este campo. Solo se popula en migración o via inferProductGroupCode al vuelo.

---

## 8 · Diccionario de tipos raw

Referencia canónica · cada interface exportada con su definición completa.

### 8.1 · Catalog types (`src/catalog/types.ts`)

```ts
// types.ts:8-12
export interface Colorway {
  name: string
  code: string
  hex: string
}

// types.ts:14-17
export interface CatalogDocument {
  name: string
  type: 'pdf'
}

// types.ts:19-22
export interface BrandResource {
  name: string
  href?: string
}

// types.ts:24-29
export interface Contact {
  name: string
  title: string
  email?: string
  phone?: string
}

// types.ts:31-34
export interface SymbolFolder {
  name: string
  files?: number
}

// types.ts:43
export type ItemStatus = 'active' | 'discontinued' | 'discrepancy'

// types.ts:47-56
export interface Finish {
  id: string
  name: string
  swatch: string
  priceModifier: number
  leadTimeAdjust: number
}

// types.ts:58-65
export interface FabricOption {
  id: string
  name: string
  type: 'standard' | 'special'
  priceModifier: number
  leadTimeAdjust: number
}

// types.ts:67-74
export interface VolumeTier {
  minQty: number
  maxQty: number
  pricePerUnit: number
}

// types.ts:76-81
export interface MaterialTier {
  id: string
  name: string
  priceModifier: number
  leadTimeAdjust: number
}

// types.ts:83-152 · SEE Section 3.1 for full field list

// types.ts:156-164
export type ProductSortKey =
  | 'relevant' | 'history-first' | 'top-rated'
  | 'price-asc' | 'price-desc' | 'lead-time'
  | 'in-stock' | 'newest'

// types.ts:177-193
export interface Manufacturer {
  id: string
  name: string
  description?: string
  logo?: string
  heroImage?: string
  bgColor?: string
  textColor?: string
  accentColor?: string
  type?: 'products' | 'materials' | 'both'
  binderCount?: number
  filterOptions?: string[]
  brandResources?: BrandResource[]
  contacts?: Contact[]
  categories: Category[]
}

// types.ts:196-199
export interface Category {
  name: string
  products: Product[]
}

// types.ts:202-213
export interface Catalog {
  id: number
  name: string
  version: string
  items: number
  lastSync: string
  cover: string
  status: 'Active' | 'Update Avail.' | 'Archived'
  owner: string
  image: string
}

// types.ts:243-246
export interface Section {
  id: string
  name: string
  slug: string
  order: number
}

// types.ts:250-252
export interface ProductType {
  id: string
  name: string
}

// types.ts:260-273
export interface ProductGroup {
  id: string
  code: string
  name: string
  description: string
  sectionId: string
  productTypeId: string
  linkedOptionGroupCodes?: string[]
  linkedFinishMasterCodes?: string[]
  itemIds: string[]
}

// types.ts:281-291
export interface SpaceType {
  id: string
  name: string
  code: string
  icon?: string
  imageUrl: string
  description: string
  spaceProfile: Array<'CCO' | 'GW' | 'CI'>
}

// types.ts:301-319
export interface SpaceTypeSetting {
  id: string
  code: string
  name: string
  spaceTypeId: string
  imageUrl?: string
  description: string
  notes?: string[]
  bundle: SpaceBundle
  isCustom?: boolean
  createdAt?: string
  updatedAt?: string
}

// types.ts:324-336
export interface SpaceBundle {
  id: string
  settingId: string
  items: Array<{
    productGroupCode: string
    itemId: string
    qty: number
    label?: string
  }>
  estimatedCostMin: number
  estimatedCostMax: number
  currency: 'USD'
}
```

### 8.2 · ProductStub (`src/catalog/data/productGroups.ts:293`)

```ts
export interface ProductStub {
  id: string
  productGroupCode: string
  productItemCode: string
  name: string
  manufacturerHint?: string
  priceEstimateMin: number
  priceEstimateMax: number
  dimensions?: string
  notes?: string[]
  imageUrl?: string
  isStub: true
}
```

### 8.3 · Quote types (`src/quote/QuoteContext.tsx`)

```ts
// QuoteContext.tsx:22-49
export interface QuoteLineItem {
  id: string
  productId: string
  productName: string
  productBrand?: string
  productImage: string
  qty: number
  colorwayCode?: string
  colorwayName?: string
  colorwayHex?: string
  finishId?: string
  finishName?: string
  fabricId?: string
  fabricName?: string
  fabricIsPremium?: boolean
  materialTierId?: string
  materialTierName?: string
  unitPrice: number
  totalPrice: number
  leadTimeDays: number
  addedAt: string
  sourceDocRef?: string
  settingCode?: string
  settingName?: string
  spaceTypeId?: string
}

// QuoteContext.tsx:52-55
export interface BuyerInfo {
  user: UserCompanyProfile
  tenant: TenantMetadata
}

// QuoteContext.tsx:57
export type QuoteDraftStatus = 'draft' | 'in-progress-ingest' | 'submitted'

// QuoteContext.tsx:59-71
export interface QuoteDraft {
  id: string
  name: string
  source: 'manual' | 'ingest'
  sourceDocRef?: string
  items: QuoteLineItem[]
  buyerInfo: BuyerInfo
  status: QuoteDraftStatus
  createdAt: string
  updatedAt: string
  referenceNumber?: string
}

// QuoteContext.tsx:79-87
export interface LastAddedSummary {
  draftId: string
  draftName: string
  tenantName: string
  itemCount: number
  addedItems: QuoteLineItem[]
  addedAt: string
}

// QuoteContext.tsx:92-95
export interface EditingItemState {
  draftId: string
  item: QuoteLineItem
}

// QuoteContext.tsx:99-107
export interface QuotedHistoryEntry {
  productId: string
  occurrences: number
  totalUnits: number
  lastQuotedAt: string
}
```

### 8.4 · Tenant + User types

```ts
// src/quote/userProfile.ts
export interface UserCompanyProfile {
  email: string
  fullName: string
  title: string
  phone: string
  initials: string
}

// src/quote/tenantData.ts
export interface TenantMetadata {
  id: string                    // slug: 'special-t', 'meridian-office', etc
  name: string                  // display: 'DEALER 1', 'Meridian Office'
  industry: string
  legalName: string
  billingAddress: {
    line1: string
    city: string
    state: string
    zip: string
  }
  taxId: string
  billingContactEmail: string
  badgeColor: string            // Tailwind class
}
```

### 8.5 · Custom Spaces types (`src/catalog/spaces/useCustomSpaces.ts`)

```ts
// useCustomSpaces.ts:19-37
export interface CreateCustomSpaceInput {
  code: string
  name: string
  spaceTypeId: string
  description: string
  notes?: string[]
  items: Array<{
    productGroupCode: string
    itemId: string
    qty: number
    label?: string
    productName?: string
    productBrand?: string
    productImageUrl?: string
    estimatedPrice?: number
  }>
}
```

### 8.6 · Spaces filter types (`src/catalog/spaces/SpaceTypesPage.tsx`)

```ts
// SpaceTypesPage.tsx:10
export type SpacesSortKey = 'alpha' | 'cost-asc' | 'cost-desc' | 'settings-count'

// SpaceTypesPage.tsx:20-25
export interface SpacesFilters {
  search: string
  profiles: Set<'CCO' | 'GW' | 'CI'>
  costBuckets: Set<string>
  brands: Set<string>
}
```

---

## Apéndice · Files/directories cross-reference

```
src/catalog/
├── types.ts                     ← source of truth (16 interfaces + enums)
├── CatalogPage.tsx              ← 5-tab sub-nav orchestrator
├── data/
│   ├── manufacturers.ts         ← 3 brands seed (Allermuir/Allsteel/AIS)
│   ├── productGroups.ts         ← 22 groups + PRODUCT_STUBS + helpers
│   ├── spaceTypes.ts            ← 11 types + 15 settings + filter helpers
│   ├── catalogs.ts              ← 3 catalogs mock reactivo
│   └── productVariants.ts       ← helpers para getProductVariants()
├── showroom/
│   ├── ShowroomPage.tsx         ← main orchestrator sub-mode products/materials/spaces
│   ├── data/unifiedProducts.ts  ← flat + enriched dataset
│   └── ShowroomCatalogsBar.tsx  ← reactive catalog status bar
├── shop/
│   ├── ProductCatalogPage.tsx   ← Figma mode
│   ├── ProductCatalogCard.tsx   ← card renderer
│   ├── CompareModal.tsx
│   ├── BulkActionsBar.tsx
│   └── RequestQuoteModal.tsx
├── browse/
│   ├── LibraryPage.tsx          ← MRL mode
│   ├── ManufacturerPage.tsx
│   ├── CategoryPage.tsx
│   ├── ProductDetailPage.tsx    ← full-page detail
│   ├── ProductDetailPanel.tsx   ← modal 5-tab (Quote/Overview/Variants/Specs/Resources)
│   ├── ComparePickerModal.tsx
│   └── catalogSku.ts            ← resolveInternalSku/resolveManufacturerSku helpers
├── manage/
│   ├── ManageCatalogs.tsx       ← Dealer / Quote mode
│   └── CatalogImportModal.tsx
└── spaces/
    ├── SpaceTypesPage.tsx       ← grid de 11 types + filters
    ├── SpaceTypeDetailPage.tsx  ← settings + bundle cards + CRUD
    ├── SpaceBundleCard.tsx      ← 2-col rendering + config numerada
    ├── SpaceRendering.tsx       ← img + hotspots overlay
    ├── ProductIcon.tsx          ← img + fallback icon Lucide
    ├── CreateEditSpaceModal.tsx ← wizard 2 steps
    └── useCustomSpaces.ts       ← hook + localStorage store

src/quote/
├── QuoteContext.tsx             ← multi-draft per-tenant store (14 métodos)
├── QuotesPage.tsx               ← My Selection detail + Flat/By Space toggle
├── MiniCartDrawer.tsx           ← drawer slide-in + FAB
├── IngestQuoteModal.tsx         ← 4-step upload wizard
├── EditQuoteItemPanel.tsx       ← edit item panel
├── helpers.ts                   ← computeLineItemTotals + formatLeadTime
├── tenantData.ts                ← getTenantMetadata (5 tenants demo)
└── userProfile.ts               ← getUserCompanyProfile (4 users demo)

public/images/
├── spaces/                      ← 11 fotos por SpaceType (JPG, ~55-100 KB c/u)
└── products/                    ← 22 fotos por ProductGroup (JPG, ~15-120 KB c/u)
```

Total code footprint (aprox): `types.ts` 336 líneas · `manufacturers.ts` 38.6 KB · `productGroups.ts` 29.3 KB · `ShowroomPage.tsx` 54 KB · `QuoteContext.tsx` ~500 líneas · `ProductDetailPanel.tsx` 1106 líneas · `CreateEditSpaceModal.tsx` 551 líneas.
