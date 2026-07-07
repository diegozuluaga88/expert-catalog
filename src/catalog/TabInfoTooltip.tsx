// Fase 6.2 · TabInfoTooltip (2026-07-07 refactor)
// English-only content + tab role chip (Reference vs Current version).
// Reference tabs (MRL, Dealer/Quote, Figma) are legacy sections kept for
// context on how the current catalog was built. The Product Catalog tab
// is the consolidated Current version that inherits UI + features from
// the reference tabs. My Selection is the live workspace.

import type { ReactNode } from 'react'
import { Info, Check } from 'lucide-react'

/** Fase 6.2 · tab role marker · differentiates reference vs current-version tabs.
 *  Diego ask (2026-07-07) · My Selection también es Current Version (misma
 *  arquitectura consolidada que Product Catalog) · role 'live' retirado. */
export type TabRole = 'reference' | 'current'

export interface TabInfo {
    title: string
    /** Chip that qualifies the tab's role in the catalog architecture. */
    role: TabRole
    whatYouSee: string
    dataSource: string
    structure: string
    features: string[]
}

type Align = 'start' | 'center' | 'end'

interface TooltipProps {
    content: TabInfo
    align?: Align
}

/** Style + label for the role chip. */
function chipStyle(role: TabRole): { label: string; className: string; tooltip: string } {
    switch (role) {
        case 'reference':
            return {
                label: 'Reference',
                className: 'bg-muted text-muted-foreground border-border',
                tooltip: 'Legacy section preserved to show how the current catalog was built.',
            }
        case 'current':
            return {
                label: 'Current version',
                className: 'bg-primary/90 text-primary-foreground border-primary',
                tooltip: 'Consolidated tab that inherits UI + features from the reference tabs.',
            }
    }
}

/** Icon-only trigger · a small Info button that unfolds the popover on hover.
 *  Diego ask · previously the whole tab triggered the tooltip and popovers
 *  appeared while navigating. Now explicit · click/hover on the (i) icon. */
export function TabInfoTrigger({ content, align = 'center' }: TooltipProps) {
    const positionClass =
        align === 'start' ? 'left-0'
        : align === 'end' ? 'right-0'
        : 'left-1/2 -translate-x-1/2'
    const arrowClass =
        align === 'start' ? 'left-2'
        : align === 'end' ? 'right-2'
        : 'left-1/2 -translate-x-1/2'

    const chip = chipStyle(content.role)

    return (
        <span className="group/tt relative inline-flex items-center">
            {/* Trigger · discreet (i) icon */}
            <button
                type="button"
                tabIndex={-1}
                aria-label={`About ${content.title}`}
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
                onClick={e => e.stopPropagation()}
            >
                <Info className="h-3 w-3" strokeWidth={2} />
            </button>

            {/* Popover */}
            <div
                role="tooltip"
                className={`pointer-events-none absolute top-full ${positionClass} z-[70] mt-2 w-[340px] opacity-0 invisible translate-y-1 transition-all duration-150 delay-200 group-hover/tt:pointer-events-auto group-hover/tt:opacity-100 group-hover/tt:visible group-hover/tt:translate-y-0`}
            >
                {/* Arrow */}
                <div className={`absolute -top-1.5 ${arrowClass} h-3 w-3 rotate-45 border-l border-t border-border bg-card`} />

                <div className="relative rounded-xl border border-border bg-card shadow-xl">
                    {/* Header · title + role chip */}
                    <div className="border-b border-border px-3.5 py-2.5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-bold text-foreground leading-tight">{content.title}</h4>
                            <span
                                className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${chip.className}`}
                                title={chip.tooltip}
                            >
                                {chip.label}
                            </span>
                        </div>
                    </div>

                    <div className="px-3.5 py-3 space-y-3">
                        {/* Purpose */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Purpose
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed">{content.whatYouSee}</p>
                        </div>

                        {/* Data source */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Data source
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed">{content.dataSource}</p>
                        </div>

                        {/* Layout */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Layout
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed">{content.structure}</p>
                        </div>

                        {/* Features · list with accessible bullets */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                Features
                            </div>
                            <ul role="list" className="space-y-1">
                                {content.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground leading-relaxed">
                                        <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" strokeWidth={2.5} aria-hidden="true" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </span>
    )
}

/** Legacy wrapper · preserves the previous children-based API. */
export default function TabInfoTooltip({ content, children }: { content: TabInfo; children: ReactNode }) {
    return <>{children}<TabInfoTrigger content={content} /></>
}

/* ═══════════════════════════════════════════════════════════════════════
   Per-tab content · English-only, curated for Diego's review flow.
   ═══════════════════════════════════════════════════════════════════════ */

export const TAB_INFO_MRL: TabInfo = {
    title: 'MRL · Manufacturer Reference Library',
    role: 'reference',
    whatYouSee:
        'Classic hierarchical view: brand → category → product with rich detail and documentation.',
    dataSource:
        'manufacturers.ts · Allermuir, Allsteel, AIS + acoustics Camira, HBF, Luum, Mayer.',
    structure:
        'Library → Brand page (hero + contacts) → Category grid → 5-tab detail modal.',
    features: [
        'Brand pages with sales & A&D contacts',
        'Product detail with specs and performance',
        'PDF documents (guarantees, brochures, certs)',
        'Symbol folders (AutoCAD, Revit, SketchUp)',
    ],
}

export const TAB_INFO_DEALER_QUOTE: TabInfo = {
    title: 'Dealer / Quote · Manage Catalogs',
    role: 'reference',
    whatYouSee:
        'Admin panel for the dealer to manage imported catalogs and buying preferences.',
    dataSource:
        'catalogs.ts (reactive mock) + Preferences per tenant in localStorage.',
    structure:
        'Catalog card grid + 2-tab modal · Catalogs and Preferences.',
    features: [
        'Sync management with delta reporting',
        'Preferences · brand priorities, delivery zones',
        'Status · Active / Update Avail. / Out of Sync',
        'Import and disconnect with confirmation',
    ],
}

export const TAB_INFO_FIGMA: TabInfo = {
    title: 'Figma · Product Catalog (original design)',
    role: 'reference',
    whatYouSee:
        'View aligned with the original Figma design · grid with filter sidebar.',
    dataSource:
        'shop/data/products.ts · 12 curated dealer products.',
    structure:
        'Sidebar filters + main grid (8 items per page) + sort dropdown.',
    features: [
        'Filter sidebar · Category, Brand, Features, Price',
        'Sort · 7 options including History-First',
        'Product cards with visible SKU and colorways',
        'Multi-line quote builder in the detail modal',
    ],
}

export const TAB_INFO_PRODUCT_CATALOG: TabInfo = {
    title: 'Product Catalog · Unified Showroom',
    role: 'current',
    whatYouSee:
        'The consolidated storefront. Combines the browse patterns from MRL + Figma + Dealer tabs and adds Spaces.',
    dataSource:
        'unifiedProducts + SPACE_TYPES + PRODUCT_STUBS + custom spaces (localStorage) + finishes/options (silver-aligned).',
    structure:
        'Sidebar with 3-way toggle (Products / Materials / Spaces) + facet filters + main grid. Spaces mode → bundle detail.',
    features: [
        'Reunites UI + features from all reference tabs',
        '3-way toggle · Products / Materials / Spaces',
        'Space Types with pre-configured bundles',
        'Custom Spaces · full CRUD per dealer',
        'Silver-aligned configurable options + finishes',
        'Multi-tenant scoped custom catalogs',
        'Add all N items to Selection in one click',
    ],
}

export const TAB_INFO_MY_SELECTION: TabInfo = {
    title: 'My Selection · Draft submissions',
    role: 'current',
    whatYouSee:
        'The active tenant\'s selections · multi-line items, auto-filled buyer info, submit flow. Neutral about downstream intent (Quote / PO / RFQ) — the dealer decides after submission.',
    dataSource:
        'QuoteContext · multi-draft per tenant in `expert-hub-quotes-{slug}` localStorage.',
    structure:
        '2-col · drafts list + detail with Buyer info + Line items + Totals.',
    features: [
        'Multi-draft · N parallel selections per tenant',
        'Auto-filled buyer info (user + tenant)',
        'Toggle Flat list / By Space Setting',
        'Reference number Q-YYYY-NNN-TENANT',
        'localStorage persistence · survives refresh',
    ],
}
