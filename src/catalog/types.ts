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
}

/* ───────────────────────── Product Catalog (Figma, Etapa 8) ───────────────────────── */

export type ProductSortKey =
  | 'relevant'
  | 'top-rated'
  | 'price-asc'
  | 'price-desc'
  | 'lead-time'
  | 'in-stock'
  | 'newest'

/** Formatos del modal Generate Report. */
export type ReportFormat = 'csv' | 'excel' | 'json' | 'pdf'

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
