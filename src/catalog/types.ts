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

export interface SymbolFolder {
  name: string
  files?: number
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
 * Category · legacy alias del concepto **Section** del silver schema.
 *
 * En el silver schema de producción, una Section tiene shape:
 * `{ sectionId, sectionName, sectionCatalogueId }` (ver `Section` interface abajo).
 *
 * expert-catalog usa `Category` en el sub-mode Figma (`ProductCatalogPage`) y en
 * el navigation state del MRL para agrupar Products bajo una Brand. En producción
 * este concepto colapsa con Section · el `products: Product[]` nested aquí es
 * conveniencia de UI, no del schema.
 *
 * @deprecated Fase P0.1 · en la migración a producción, este concepto se
 * consolida bajo `Section`. Los usages actuales de `Category` en UI (browse
 * navigation, filtros del Product Catalog) permanecen como conveniencia local.
 * NO se remueve la interfaz porque el nested `products[]` es útil para el UI
 * pattern actual, pero semánticamente equivale a Section.
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
 * mismas opciones (linkedOptionGroupCodes) y finishes (linkedFinishMasterCodes).
 */
export interface ProductGroup {
  id: string
  code: string                          // "CH15", "TB05", "AL02"
  name: string                          // "Stool, Casual"
  description?: string
  sectionId: string                     // ref → Section.id
  productTypeId: string                 // ref → ProductType.id
  /** Codes de OptionGroup linked (ej. ["Armrests", "Base"]). Mapea a `linkedOptionGroup jsonb`
   *  del silver schema · en producción cada elemento será `{ optionGroupId, optionGroupPosition }`.
   *  Fase P0.1 · nombre alineado con silver. */
  linkedOptionGroup?: string[]
  /** @deprecated Fase P0.1 · usa `linkedOptionGroup` en su lugar. Alias legacy para
   *  código no migrado aún; será removido en Cleanup.1. */
  linkedOptionGroupCodes?: string[]
  /** Codes de FinishMaster linked (ej. ["Frame", "Fabric"]). Mapea a `linkedFinishMaster jsonb`
   *  del silver schema · en producción cada elemento será `{ masterFinishId, masterFinishPosition }`.
   *  Fase P0.1 · nombre alineado con silver. */
  linkedFinishMaster?: string[]
  /** @deprecated Fase P0.1 · usa `linkedFinishMaster` en su lugar. Alias legacy para
   *  código no migrado aún; será removido en Cleanup.1. */
  linkedFinishMasterCodes?: string[]
  /** IDs de Product.id que pertenecen a este grupo. */
  itemIds: string[]
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
  estimatedCostMin: number              // USD
  estimatedCostMax: number              // USD
  currency: 'USD'
}

