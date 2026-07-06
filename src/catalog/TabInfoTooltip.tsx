// Fase 6 · TabInfoTooltip (2026-07-06)
// Wrapper alrededor de cada tab button del catalog sub-nav que muestra un
// popover rich al hover. Explica: qué se ve en el tab, origen de la data,
// estructura visual y features. Delay 300ms para no ser molesto.
//
// Usage:
//   <TabInfoTooltip content={{ title, whatYouSee, dataSource, structure, features }}>
//     <button>MRL</button>
//   </TabInfoTooltip>

import type { ReactNode } from 'react'
import { Info, Database, LayoutGrid, ListChecks } from 'lucide-react'

export interface TabInfo {
    title: string
    whatYouSee: string
    dataSource: string
    structure: string
    features: string[]
}

interface Props {
    content: TabInfo
    children: ReactNode
}

export default function TabInfoTooltip({ content, children }: Props) {
    return (
        <div className="group relative">
            {children}
            {/* Popover · aparece below el tab · delay 300ms + fade */}
            <div
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-[60] mt-2 w-80 -translate-x-1/2 opacity-0 invisible translate-y-1 transition-all duration-200 delay-300 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"
            >
                {/* Arrow pointing up */}
                <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-border bg-card" />

                <div className="relative rounded-xl border border-border bg-card p-3.5 shadow-2xl">
                    {/* Header · title + icon */}
                    <div className="flex items-baseline gap-2 mb-2 pb-2 border-b border-border">
                        <span className="text-sm font-bold text-foreground">{content.title}</span>
                    </div>

                    {/* What you'll see */}
                    <div className="mb-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Info className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">What you'll see</span>
                        </div>
                        <p className="text-xs text-foreground leading-snug">{content.whatYouSee}</p>
                    </div>

                    {/* Data source */}
                    <div className="mb-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Database className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data source</span>
                        </div>
                        <p className="text-xs text-foreground leading-snug">{content.dataSource}</p>
                    </div>

                    {/* Visual structure */}
                    <div className="mb-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <LayoutGrid className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Visual structure</span>
                        </div>
                        <p className="text-xs text-foreground leading-snug">{content.structure}</p>
                    </div>

                    {/* Features */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <ListChecks className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Features ({content.features.length})</span>
                        </div>
                        <ul className="space-y-0.5">
                            {content.features.map((f, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground leading-snug">
                                    <span className="mt-1 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════
   Contenido de cada tab · exportado para consumir desde CatalogPage.
   ═══════════════════════════════════════════════════════════════════════ */

export const TAB_INFO_MRL: TabInfo = {
    title: 'MRL · Manufacturer Reference Library',
    whatYouSee:
        'Vista jerárquica clásica del catálogo por marca. Navegación Manufacturer → Category → Product con detalle rico de cada item.',
    dataSource:
        'Data portada de `catalog-test` original · manufacturers.ts (Allermuir, Allsteel, AIS + Camira, HBF, Luum, Mayer para materiales). Incluye specs técnicas, performance, docs PDF y contactos por marca.',
    structure:
        'Library page → Brand page (hero + resources + contactos) → Category grid → Product detail modal con tabs Overview, Specs, Performance, Cleaning y Documents.',
    features: [
        'Navegación jerárquica por manufacturer',
        'Brand pages con contactos de sales y A&D specialist',
        'Product detail con specs, performance, cleaning notes',
        'Documentos PDF (guarantees, brochures, certificates)',
        'Symbol folders (AutoCAD, Revit, SketchUp)',
        'Ganging, stacking y compliance BIFMA',
    ],
}

export const TAB_INFO_DEALER_QUOTE: TabInfo = {
    title: 'Dealer / Quote · Manage Catalogs',
    whatYouSee:
        'Panel de administración de los catálogos importados por el dealer. Sync management, preferencias de compra y estado de cada catalog.',
    dataSource:
        'catalogs.ts (mock reactivo con status Active / Update Available / Out of Sync). Preferences per tenant persistidas en localStorage.',
    structure:
        'Grid de catalog cards con status badge, botón Sync y botón Disconnect. Modal Manage Catalogs con 2 tabs · Catalogs + Preferences.',
    features: [
        'Import de catálogos manufactureros',
        'Sync management con delta reporting (added/removed)',
        'Preferences per tenant · brand priorities, delivery zones',
        'Status tracking · Active / Update Avail. / Out of Sync',
        'Disconnect catalogs con confirmación',
        'Ephemeral (reset al montar la page · demo mode)',
    ],
}

export const TAB_INFO_FIGMA: TabInfo = {
    title: 'Figma · Product Catalog (design original)',
    whatYouSee:
        'Vista alternativa del catálogo alineada con el diseño Figma original. Grid de productos con filter sidebar y sort dropdown.',
    dataSource:
        'shop/data/products.ts (12 productos dealer curados). Complementa la data rich de MRL con volumen pricing y variantes de dealer.',
    structure:
        'Sidebar izquierdo con filters (Category, Brand, Features, Price) + main grid 8 items/página + sort dropdown top. Product cards con SKU, colorways, tags y detail modal.',
    features: [
        'Filter sidebar por Category / Brand / Features / Price',
        'Sort · Most Relevant, Top Rated, Price ↑↓, Lead Time, In Stock, Newest',
        'History-first sort · previously quoted products up top',
        'Product cards con SKU visible, colorways, tags',
        '"Save X%" badge cuando listPrice > price',
        'Detail modal con multi-line quote builder',
    ],
}

export const TAB_INFO_PRODUCT_CATALOG: TabInfo = {
    title: 'Product Catalog · Showroom unificado',
    whatYouSee:
        'Storefront principal que combina Products, Materials y Spaces en un solo tab con toggle sidebar. Fotos reales, Space Types y custom bundles.',
    dataSource:
        'unifiedProducts.ts (browse rich + dealer unificado) + SPACE_TYPES + SPACE_TYPE_SETTINGS + PRODUCT_STUBS + custom spaces del tenant (localStorage).',
    structure:
        'Sidebar con toggle 3-way Products/Materials/Spaces + filtros específicos + main grid. En Spaces mode: grid de 11 SpaceTypes → detail con settings F1-F4 + bundle products grid.',
    features: [
        'Toggle 3-way Products / Materials / Spaces',
        'Filtros específicos por taxonomy (Category, Brand, Cost, Space Profile)',
        'Search + Sort per taxonomy',
        'Bulk actions · compare, favorites, request quote',
        'Space Types con bundles pre-armados (F1, WC1, etc)',
        'Create/Edit/Duplicate/Delete Custom Spaces',
        'Add all N items to Selection en un click',
        'Rendering isométrico con hotspots numerados',
        'Quick Actions · Upload Quote/PO, Manage Catalogs',
    ],
}

export const TAB_INFO_MY_SELECTION: TabInfo = {
    title: 'My Selection · Quote drafts',
    whatYouSee:
        'Todas las selecciones (drafts) del tenant activo. Line items con variants, buyer info auto-filled, submit flow. Badge muestra unidades totales.',
    dataSource:
        'QuoteContext · multi-draft per tenant persistido en localStorage key `expert-hub-quotes-{tenantSlug}`. Buyer info derivada de user + tenant profile.',
    structure:
        '2-col layout · sidebar drafts list left, detail right con Buyer info + Line items + Totals. Toggle "Flat list / By Space" cuando hay bundle-added items.',
    features: [
        'Multi-draft · N quotes paralelas per tenant',
        'Auto-filled buyer info (user + tenant)',
        'Line items con variants · colorway, finish, fabric, material tier',
        'Toggle Flat list / By Space Setting (F1, WC1, etc)',
        'Grouping por Space con subtotal + collapse/expand',
        'Reference number Q-YYYY-NNN-TENANT',
        'Submit workflow con confirmation screen',
        '"Previously selected" badge cross-drafts',
        'Persist localStorage · sobrevive refresh',
    ],
}
