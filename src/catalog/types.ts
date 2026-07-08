// Etapa 3 — Data layer unificado del Catálogo.
// Browse types: portados verbatim de `catalog-test/src/types/catalog.ts`.
// Admin types: derivados de `INITIAL_CATALOGS` del CatalogLibrary removido de expert-hub
// (`_catalog_ref/expert-hub-removed/components/catalogs/CatalogLibrary.tsx`).

/* ───────────────────────── Browse (catalog-test) ───────────────────────── */

export interface Colorway {
  name: string
  code: string
  hex: string
}

export interface CatalogDocument {
  name: string
  type: 'pdf'
}

export interface BrandResource {
  name: string
  href?: string
}

export interface Contact {
  name: string
  title: string
  email?: string
  phone?: string
}

/**
 * SymbolFolder · carpeta de assets CAD/3D del producto (AutoCAD, Revit, etc).
 *
 * Fase P2.4 · agregado `dimension` para alinear con silver schema que discrimina
 * `drawingName2D` vs `drawingName3D` como campos separados. En expert-catalog
 * mantenemos `symbols[]` como container multi-format pero cada elemento ahora
 * declara su dimensión para poder agrupar/filtrar en la UI ResourcesTab.
 */
export interface SymbolFolder {
  name: string
  files?: number
  /** Fase P2.4 · dimensión del asset. Default 'other' si no especificado
   *  (backward compat con seeds antiguos). */
  dimension?: '2D' | '3D' | 'other'
}

/**
 * Phase 2 Fix #6b — estado del item consistente cross-módulo
 * Stakeholder de producto pidió que el estado sea SIEMPRE visible en card + detail panel.
 *  - 'active' · default · sin badge (no clutter)
 *  - 'discontinued' · gris muted · ya no se vende
 *  - 'discrepancy' · amber · catálogo desincronizado · cuando catalog status === 'Update Avail.'
 */
export type ItemStatus = 'active' | 'discontinued' | 'discrepancy'

/* ── Phase 2 Fix #9 — Product variants para B2B (finishes, fabric, volume, material tiers) ── */

export interface Finish {
  id: string
  name: string
  /** hex color para el swatch */
  swatch: string
  /** Cargo adicional sobre el precio base (USD · puede ser 0) */
  priceModifier: number
  /** Días extra de lead time (puede ser 0) */
  leadTimeAdjust: number
}

export interface FabricOption {
  id: string
  name: string
  /** 'standard' = incluido sin cargo · 'special' = COM/COL · cargo + lead extra */
  type: 'standard' | 'special'
  priceModifier: number
  leadTimeAdjust: number
}

export interface VolumeTier {
  /** Cantidad mínima para entrar a este tier · ordenados ascending */
  minQty: number
  /** Cantidad máxima inclusive (undefined = sin tope superior) */
  maxQty?: number
  /** Precio por unidad ABSOLUTO en este tier (no modifier) */
  pricePerUnit: number
}

export interface MaterialTier {
  id: string
  name: 'Standard' | 'Premium' | 'Special-order'
  priceModifier: number
  leadTimeAdjust: number
}

export interface Product {
  id: string
  name: string
  description: string
  images: string[]
  galleries?: string[]
  colorways: Colorway[]
  standardFeatures?: string[]
  optionalFeatures?: string[]
  specs: Record<string, string>
  performance: Record<string, string>
  cleaning: string
  documents: CatalogDocument[]
  symbols?: SymbolFolder[]

  // Etapa 8 — campos dealer opcionales para la vista "Product Catalog" (Figma).
  // No rompen el Browse (todos opcionales).
  brand?: string
  price?: number
  listPrice?: number
  dealerRating?: number
  leadTime?: string
  /** Etiquetas de marketing: Quick Ship, Commercial Use, Best Seller, New, Modular… */
  tags?: string[]
  /** "Often selected for similar projects" */
  popular?: boolean
  /** Categoría para el filtro del Product Catalog (Sofas, Chairs, Tables…) */
  category?: string
  /** Variants & Finish (Compare) */
  material?: string
  upholstery?: string
  /** Dimensions (Compare) */
  dimensions?: { width: string; depth: string; height: string; weight: string }
  /** Showroom (Etapa 9): true si viene de un fabricante de materiales (textiles/acoustics). */
  isMaterial?: boolean

  /* ── Phase 2 Fix #6 — SKU identifiers (Stakeholder consistency) ─────────
     Stakeholder pidió 2 SKUs distintos · MFR es el del fabricante (Allsteel,
     AIS), Internal es el del tenant/Strata. Ambos searchable (Fix #7).
     Opcionales · si no están, se genera vía skuForProduct() helper. */
  manufacturerSku?: string
  internalSku?: string

  /* ── Phase 2 Fix #6b — Item status (siempre visible cross-módulo) ──────
     Default 'active' si no está set. Productos con itemStatus
     'discontinued' o 'discrepancy' deben mostrar badge visible. */
  itemStatus?: ItemStatus

  /* ── Phase 4 — Collection field para el filter sidebar (Fix #7) ────────
     Mock collections per brand · usado por el Collection filter. */
  collection?: string

  /* ── Phase 2 Fix #9 — B2B variants (opcionales) ────────────────────────
     Todos opcionales · si no están, el AddToQuoteModal solo muestra qty +
     colorway. Si están, agregan selectors al modal + impactan price + lead
     time vía computeLineItemTotals. */
  finishes?: Finish[]
  fabricOptions?: FabricOption[]
  volumePricing?: VolumeTier[]
  materialTiers?: MaterialTier[]

  /* ── Fase 1 refactor · alineación con silver schema de Notion (2026-07-06) ──
     Codes Steelcase-style visibles en UI · el catálogo real de manufacturero
     estructura los productos por ProductGroup (CH15) → ProductItem (CH15.1).
     Todos opcionales · productos existentes sin estos campos siguen rendering. */
  productGroupCode?: string    // "CH15" (código del ProductGroup padre)
  productItemCode?: string     // "CH15.1" (código del ProductItem específico)
  productGroupId?: string      // referencia a ProductGroup.id
  spaceProfile?: Array<'CCO' | 'GW' | 'CI'>  // Contact Center / General Workspace / Client Interact
  /** Fase P1.2 · Currency per productItem · alineado con silver `productItemCurrencyId`.
   *  Undefined → resolvable via Catalogue del ProductGroup, o fallback USD. */
  currencyId?: string
  /** Fase P2.4 · Nombre/URL del drawing primario 2D · alineado con silver `drawingName2D`.
   *  En producción es un asset URL/path; aquí puede ser el nombre del archivo o
   *  la carpeta 2D principal. Complementa `symbols[]` (que agrupa todos los formatos). */
  drawingName2D?: string
  /** Fase P2.4 · Nombre/URL del drawing primario 3D · alineado con silver `drawingName3D`. */
  drawingName3D?: string
}

/* ───────────────────────── Product Catalog (Figma, Etapa 8) ───────────────────────── */

export type ProductSortKey =
  | 'relevant'
  | 'history-first'
  | 'top-rated'
  | 'price-asc'
  | 'price-desc'
  | 'lead-time'
  | 'in-stock'
  | 'newest'

/** Formatos del modal Generate Report. */
export type ReportFormat = 'csv' | 'excel' | 'json' | 'pdf'

/**
 * Category · UI navigation container que agrupa `Product[]` bajo una Brand.
 *
 * **NO es un alias de `Section`.** Aunque en la migración a silver-schema
 * Category y Section apuntan al mismo concepto de negocio ("capítulo del
 * catálogo"), aquí son shapes distintos:
 *
 * - `Section { id, name, slug, order }` · silver-canonical, plano, referenciable.
 * - `Category { id, name, icon?, subtitle?, products: Product[] }` · convenience
 *   type de UI con `products[]` nested para el patrón browse (Brand → Category →
 *   Product) del MRL y el sub-mode Figma.
 *
 * En el processor bronze→silver, `Category.products[]` se aplana a filas
 * de `Product` referenciando `Section.id`. Esta interface se conserva **porque
 * el nested `products[]` es el shape natural para el navigation state del UI**
 * (ver `MRL/CategoryPage`, `browse/ProductDetailPanel`). No se remueve ni se
 * fusiona con Section.
 *
 * Rev Cleanup.2b (2026-07-08) · el JSDoc anterior decía "@deprecated · alias
 * legacy de Section". Era incorrecto · Category tiene un `products[]` nested
 * que Section no soporta, y renombrarlo rompería 19 usos que dependen de esa
 * forma. Se retira la marca @deprecated.
 */
export interface Category {
  id: string
  name: string
  icon?: string
  subtitle?: string
  products: Product[]
}

export interface Manufacturer {
  id: string
  name: string
  description: string
  logo?: string
  heroImage?: string
  bgColor: string
  textColor: string
  accentColor?: string
  type: 'products' | 'materials' | 'both'
  binderCount?: number
  binderLabel?: string
  filterOptions?: string[]
  brandResources?: BrandResource[]
  contacts?: Contact[]
  categories: Category[]
}

export type LibraryTab = 'products' | 'materials'
export type ViewMode = 'shelf' | 'grid'

/* ───────────────────────── Manage / admin (CatalogLibrary) ───────────────────────── */

/**
 * Fase P0.1 · en silver schema `catalogueStatus` es `text` libre (no closed enum).
 * expert-catalog mantiene el union como validator del UI mock. En producción
 * el valor será string libre proveniente del bronze/silver processor.
 *
 * Mapping tentativo:
 * - 'Active' → 'Active' (matches silver)
 * - 'Update Avail.' → UI-only (no en silver · flag derivado del sync state)
 * - 'Archived' → 'Discontinued' o similar (silver semantic)
 */
export type CatalogStatus = 'Active' | 'Update Avail.' | 'Archived'

/**
 * Fase P1.1 · Currency · alineado con silver schema (grupo Currency row-level).
 * En producción es una tabla separada de currencies · aquí es un diccionario
 * mock referenced por catalogueCurrencyId / productItemCurrencyId /
 * finishValueCurrencyId.
 *
 * Mapea a las columnas silver: currencyId, currencyName, currencyCode, currencyType.
 */
export interface Currency {
  id: string           // "USD", "EUR" · usado como ID interno + FK
  code: string         // "USD", "EUR" · ISO 4217
  name: string         // "US Dollar", "Euro"
  type: string         // "fiat" · en silver es text libre (podría ser crypto, etc)
}

/**
 * Fase P1.1 · Catalogue · nueva entidad separada de `Manufacturer` alineada
 * con el silver schema (grupo Catalogue). Cada Catalogue es un "product book"
 * de un manufacturer para un período específico con una moneda y estado.
 *
 * Un Manufacturer puede publicar N Catalogues (Steelcase 2024 Seating,
 * Steelcase 2025 Seating, Steelcase 2025 EUR, etc). Cada Section pertenece
 * a UN Catalogue específico (via `Section.catalogueId?`, futuro).
 *
 * Mapea a las columnas silver: catalogueId, catalogueNumber, catalogueName,
 * catalogueActiveDate, catalogueExpirationDate, catalogueStatus,
 * catalogueCurrencyId, catalogueTenantId.
 *
 * @see Catalog (UI mock reactivo) · sub-tipo compatible que agrega
 * `catalogueId?` opcional para linkear al Catalogue.
 */
export interface Catalogue {
  id: string
  /** ID code humano · "SC-2025-SEAT", "AL-2026-COL". Aparece en silver como `catalogueNumber`. */
  catalogueNumber: string
  name: string
  /** ISO date · en silver es `timestamp`. */
  activeDate: string
  /** ISO date · en silver es `timestamp`. */
  expirationDate: string
  /** En silver es `text` libre. Aquí en mock usamos union para tipar el UI. */
  status: 'Active' | 'Draft' | 'Discontinued' | 'Archived'
  /** FK → Currency.id · en silver `catalogueCurrencyId`. */
  currencyId: string
  /** FK → Tenant.id · en silver `catalogueTenantId`. Multi-tenant support (custom catalogues
   *  per dealer). `null` o `undefined` = catalogue global (seed). */
  tenantId?: string
  /** Link al Manufacturer que publica este catalogue · útil para browse UI.
   *  En silver esto sería derivable via sectionCatalogueId → productGroupIdRef → items[] → manufacturer. */
  manufacturerId?: string
}

/**
 * Catalog (mock reactivo UI) · representa el estado de sync de un catálogo
 * importado por el dealer. Distinto (semánticamente) del `Catalogue` del
 * silver schema:
 *
 * - `Catalog` = record del catálogo IMPORTADO por el dealer, con sync
 *   status, lastSync, cover image, owner (dealer/manufacturer del import),
 *   ID numérico interno del mock.
 * - `Catalogue` = record del CATÁLOGO PUBLICADO por el manufacturer con
 *   catalogueNumber, dates, currency, tenantId. Silver schema.
 *
 * Fase P1.1 · `Catalog.catalogueId` opcional para linkear a un `Catalogue`
 * cuando el import viene con un catalogueNumber conocido. Backward compat.
 */
export interface Catalog {
  id: number
  name: string
  version: string
  items: number
  lastSync: string
  /** Tailwind bg-utility usada como color de respaldo de la portada (data del mock original). */
  cover: string
  status: CatalogStatus
  owner: string
  image: string
  /** Fase P1.1 · link opcional al Catalogue del silver schema · permite resolver
   *  catalogueNumber, activeDate, expirationDate, currencyId sin duplicar campos
   *  en el mock del import. */
  catalogueId?: string
}

/** Modo del módulo de Catálogo en expert-hub. */
export type CatalogMode = 'browse' | 'manage'

/* ═══════════════════════════════════════════════════════════════════════════
   Fase 1 refactor · alineación con silver schema de Notion (Product Data
   Management) + concepto de Space Type Setting inspirado en los PDFs de
   Steelcase Playbook y MillerKnoll Catalog Q3 2023.

   Jerarquía del silver schema:
   Catalogue → Section → ProductGroup (con Options + Finishes linked) →
   ProductItem

   Overlay adicional (fuera del silver schema · nuestro):
   SpaceType → SpaceTypeSetting → SpaceBundle (items[] + cost range)

   Fase 3.1 · agrupación 1-a-N ProductGroup → ProductItem verificada:
   ProductGroup.itemIds[] soporta N ProductStubs. Ejemplo seed:
     CH15 "Stool Casual" agrupa CH15.1 Enea Lotus, CH15.2 Enea Altzo, CH15.3 Shortcut
     TB04 "Round Meeting" agrupa TB04, TB04.2 Lagunitas, TB04.3 media:scape
     AL13 "Floor Lamp" agrupa AL13 Captain Flint, AL13.2 Elka
   Ver docs/silver-schema-alignment.md para la tabla de mapping completa.

   Ver plan · C:\Users\User\.claude\plans\cuddly-greeting-meadow.md
   ═══════════════════════════════════════════════════════════════════════════ */

/** Section · un "capítulo" del catálogo (Ancillary / Casegoods / Seating / etc). */
export interface Section {
  id: string
  name: string
  slug: string
  order: number
}

/** ProductType · label simple que clasifica ProductGroups ("Chair", "Table", "Lamp"). */
export interface ProductType {
  id: string
  name: string
}

/**
 * ProductGroup · nivel intermedio entre Section y ProductItem.
 * Ejemplo · "CH15 Stool Casual" que contiene CH15.1 Enea Lotus, CH15.2 Enea
 * Altzo, CH15.3 Shortcut X-Base. Todos los items del grupo comparten las
 * mismas opciones (linkedOptionGroup) y finishes (linkedFinishMaster).
 */
export interface ProductGroup {
  id: string
  code: string                          // "CH15", "TB05", "AL02"
  name: string                          // "Stool, Casual"
  description?: string
  sectionId: string                     // ref → Section.id
  productTypeId: string                 // ref → ProductType.id
  /** Codes de OptionGroup linked (ej. ["Armrests", "Base"]).
   *  **Seed input format** · forma human-friendly de escribir el seed en TS.
   *  Los consumers runtime NO deben leer este field directamente para lógica
   *  de negocio · usar `linkedOptionGroupRefs` (P1.3.a) que expone el shape
   *  jsonb silver, o `resolveLegacyLinkedOptionGroup(names)` para convertir
   *  on-the-fly. */
  linkedOptionGroup?: string[]
  /** Fase P1.3.a · runtime shape jsonb-style alineada 1:1 con silver
   *  `linkedOptionGroup: Array<{ optionGroupId, optionGroupPosition }>`.
   *  Cada elemento referencia un OptionMaster.id + su display order.
   *  Es la fuente de verdad que consumers de UI deberían leer. */
  linkedOptionGroupRefs?: Array<{ optionMasterId: string; optionGroupPosition: number }>
  /** Codes de FinishMaster linked (ej. ["Frame", "Fabric"]).
   *  **Seed input format** · forma human-friendly de escribir el seed en TS.
   *  Consumers runtime deberían leer `linkedFinishMasterRefs` (P1.4) o llamar
   *  `resolveLegacyLinkedFinishMaster(names)` para obtener refs. */
  linkedFinishMaster?: string[]
  /** Fase P1.4 · runtime shape jsonb-style alineada 1:1 con silver
   *  `linkedFinishMaster: Array<{ masterFinishId, masterFinishPosition }>`.
   *  Fuente de verdad silver para consumers de UI. */
  linkedFinishMasterRefs?: Array<{ masterFinishId: string; masterFinishPosition: number }>
  /** IDs de Product.id que pertenecen a este grupo. */
  itemIds: string[]
}

/**
 * Fase P1.3.a · OptionMaster · categoría de opciones configurables.
 * Ejemplo: "Armrests", "Base", "Casters".
 *
 * Alineado con silver schema grupo `OptionMaster`:
 *   optionMasterId, optionGroupCode, optionGroupNotes, optionMasterStatus,
 *   optionMasterTenantId.
 *
 * Un OptionMaster contiene N `OptionGroupValue` (los valores concretos que el
 * usuario puede elegir). Un `ProductGroup` referencia N OptionMasters via
 * `linkedOptionGroupRefs`.
 */
export interface OptionMaster {
  id: string
  /** Code humano · en silver `optionGroupCode`. Ej. "Armrests", "Base". */
  optionGroupCode: string
  /** Nombre display · derivable del code o campo explícito. */
  name: string
  /** Notas del master · silver `optionGroupNotes`. */
  notes?: string
  /** En silver `text` libre. Aquí unión conservadora. */
  status: 'Active' | 'Draft' | 'Discontinued'
  /** FK opcional al tenant · silver `optionMasterTenantId`. Null = global. */
  tenantId?: string
}

/**
 * Fase P1.3.a · OptionGroupValue · valor concreto dentro de un OptionMaster.
 * Ejemplo: dentro de "Armrests" → "None", "Fixed", "Adjustable".
 *
 * Alineado con silver schema grupo `OptionGroupValue`:
 *   optionGroupValueId, optionGroupValuePosition, optionValue, optionDescription,
 *   optionGroupValueStatus, optionMasterIdRef.
 */
export interface OptionGroupValue {
  id: string
  /** FK → OptionMaster.id · silver `optionMasterIdRef`. */
  optionMasterId: string
  /** Display order · silver `optionGroupValuePosition` (int). */
  position: number
  /** Nombre del valor · silver `optionValue`. Ej. "Adjustable". */
  value: string
  /** Descripción larga · silver `optionDescription`. */
  description?: string
  /** En silver `text` libre. */
  status: 'Active' | 'Draft' | 'Discontinued'
}

/**
 * Fase P1.4.a · FinishMaster · nivel superior de la jerarquía Finishes.
 * Ejemplo: "Frame Finish", "Fabric Finish", "Shell Finish".
 *
 * Alineado con silver schema grupo `FinishMaster`:
 *   finishMasterId, masterFinishName, finishMasterStatus, finishMasterTenantId.
 *
 * Jerarquía: FinishMaster → N FinishOptions → N FinishValues.
 * Un ProductGroup referencia N FinishMasters via `linkedFinishMasterRefs`.
 */
export interface FinishMaster {
  id: string
  /** Nombre display · silver `masterFinishName`. Ej. "Frame Finish". */
  masterFinishName: string
  /** En silver `text` libre. Aquí unión conservadora. */
  status: 'Active' | 'Draft' | 'Discontinued'
  /** FK opcional al tenant · silver `finishMasterTenantId`. Null = global. */
  tenantId?: string
}

/**
 * Fase P1.4.a · FinishOption · nivel intermedio de la jerarquía Finishes.
 * Ejemplo: dentro de "Frame Finish" → "Powder Coat", "Chrome", "Wood".
 *
 * Alineado con silver schema grupo `FinishOption`:
 *   finishOptionId, finishOptionName, finishOptionStatus, finishMasterIdRef.
 */
export interface FinishOption {
  id: string
  /** FK → FinishMaster.id · silver `finishMasterIdRef`. */
  finishMasterId: string
  /** Nombre · silver `finishOptionName`. Ej. "Powder Coat". */
  finishOptionName: string
  /** En silver `text` libre. */
  status: 'Active' | 'Draft' | 'Discontinued'
}

/**
 * Fase P1.4.a · FinishValue · nivel final con precio.
 * Ejemplo: dentro de "Powder Coat" → "Matte Black" (+$0), "Polished" (+$45).
 *
 * Alineado con silver schema grupo `FinishValue`:
 *   finishValueId, finishValuePosition, finishValueName, finishValueDescription,
 *   finishValueStatus, finishValuePrice (numeric 18,2), finishValueCurrencyId,
 *   finishOptionIdRef.
 *
 * Silver Finishes SÍ modifican precio (a diferencia de Options que son
 * semantic-only). El `price` es el modifier sobre el `productItemPrice`.
 */
export interface FinishValue {
  id: string
  /** FK → FinishOption.id · silver `finishOptionIdRef`. */
  finishOptionId: string
  /** Display order · silver `finishValuePosition` (int). */
  position: number
  /** Nombre · silver `finishValueName`. Ej. "Matte Black". */
  finishValueName: string
  /** Descripción larga · silver `finishValueDescription`. */
  description?: string
  /** En silver `text` libre. */
  status: 'Active' | 'Draft' | 'Discontinued'
  /** Price modifier (delta sobre productItemPrice) · silver `finishValuePrice`
   *  (numeric 18,2). Puede ser 0 (included). */
  price: number
  /** FK opcional a Currency · silver `finishValueCurrencyId`. Undefined
   *  → derivable del Catalogue o USD default. */
  currencyId?: string
  /** Hex color del swatch · UI-only (silver no lo modela, pero necesario para
   *  colorway/finish display en el prototype). */
  swatch?: string
}

/**
 * SpaceType · tipología de espacio (Focus Room, Work Cafe, Huddle, Meeting Room, etc).
 * Los PDFs de Steelcase organizan el catálogo también por Space Type para
 * mostrar "para qué escenario sirve este producto".
 */
export interface SpaceType {
  id: string
  name: string                          // "Focus Room", "Work Cafe"
  code: string                          // "focus-room", "work-cafe"
  icon?: string                         // emoji o slug de icono (fallback si imageUrl falla)
  /** Fase 3.1 · foto real del espacio · path relativo servido por Vite/Vercel
   *  desde /public/images/spaces/{code}.jpg */
  imageUrl: string
  description: string
  /** Space Profiles de Steelcase · Contact Center / General Workspace / Client Interact */
  spaceProfile: Array<'CCO' | 'GW' | 'CI'>
}

/**
 * SpaceTypeSetting · configuración específica dentro de un SpaceType.
 * Ejemplo · dentro de "Focus Room" hay F1 (individual work), F2 (mid focus),
 * F3 (dual focus). Cada setting tiene un bundle de productos pre-armado con
 * estimated cost range · esto es lo que sale en los PDFs con el número al lado
 * ("F1 · $1,500-$1,800").
 */
export interface SpaceTypeSetting {
  id: string
  code: string                          // "F1", "WC1", "H1", "SM1"
  name: string                          // "Focus Room · Individual work"
  spaceTypeId: string                   // ref → SpaceType.id
  imageUrl?: string                     // render del setting
  description: string
  /** Notas del PDF ("The rendering is for example only", etc). */
  notes?: string[]
  bundle: SpaceBundle
  /** Fase 5 · true si el setting fue creado por el dealer (no viene del seed).
   *  Se persiste en localStorage per-tenant y se mezcla con los seed en el grid.
   *  Los custom soportan edit/duplicate/delete inline. */
  isCustom?: boolean
  /** Fase 5 · timestamps para custom settings (edit history) */
  createdAt?: string
  updatedAt?: string
}

/**
 * SpaceBundle · lista de items de un setting con estimated cost range.
 * En los PDFs esto aparece como "F1 · CH01 + TB15 + CH17 + AL13 · $1,500-$1,800".
 */
export interface SpaceBundle {
  id: string
  settingId: string
  items: Array<{
    productGroupCode: string            // "CH01" (código del grupo)
    itemId: string                      // ref → Product.id específico
    qty: number
    /** Label opcional visible en el rendering ("1", "2", "3", etc). */
    label?: string
  }>
  estimatedCostMin: number
  estimatedCostMax: number
  /** Fase P1.2 · Currency del bundle · alineado con silver. Undefined → USD default.
   *  En producción esto puede derivarse del Catalogue del setting o del
   *  productItemCurrencyId del ProductItem primario del bundle.
   *
   *  Rev Cleanup.2b (2026-07-08) · el field legacy `currency: 'USD'` (P1.2
   *  deprecated) fue removido · el único reader (`SpaceBundleCard.tsx`) ya
   *  lo consumía vía el fallback `currencyId ?? currency` y el único writer
   *  (factory `makeBundle`) fue migrado a setear `currencyId`. */
  currencyId?: string
}

