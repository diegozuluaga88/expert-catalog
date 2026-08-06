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

// F64.5 · chipStyle function removida · el chip Reference/Current Version
// del header del popover fue eliminado (user ask). TabRole type se mantiene
// exportado en TabInfo por retrocompat pero no se usa para render.

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

    // F64.5 · chipStyle(content.role) removido · el chip Reference/Current
    // Version fue eliminado del header (user ask · noise visual innecesario).

    return (
        <span className="group/tt relative inline-flex items-center">
            {/* F64.1 · Trigger cambia de <button> a <span> · antes era button
                nested dentro del tab button (HTML inválido · hover behavior
                undefined en browsers · Chrome no fireaba tooltip). Span con
                role="img" preserva semantics + hover funciona ok. */}
            <span
                role="img"
                aria-label={`About ${content.title}`}
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground group-hover/tt:text-foreground group-hover/tt:bg-foreground/10 transition-colors cursor-help"
            >
                <Info className="h-3 w-3" strokeWidth={2} />
            </span>

            {/* Popover · F64.1 delay reducido de 200ms → 80ms para feedback
                más ágil. Tooltip visible on hover del wrapping span.
                F64.2 · z-[9999] (era z-[70]) · el tab pill container tenía
                overflow-x-auto que clippeaba + otros elementos con z-[80]
                lo tapaban. Combined con md:overflow-visible en el pill
                container (CatalogPageV2) queda garantizado que se ve arriba.
                F64.3 · width bump w-[340] → w-[380] + max-w-[calc(100vw-2rem)]
                para safety cuando el tooltip llega al edge del viewport. */}
            <div
                role="tooltip"
                className={`pointer-events-none absolute top-full ${positionClass} z-[9999] mt-2 w-[380px] max-w-[calc(100vw-2rem)] opacity-0 invisible translate-y-1 transition-all duration-150 delay-[80ms] group-hover/tt:pointer-events-auto group-hover/tt:opacity-100 group-hover/tt:visible group-hover/tt:translate-y-0`}
            >
                {/* Arrow */}
                <div className={`absolute -top-1.5 ${arrowClass} h-3 w-3 rotate-45 border-l border-t border-border bg-card`} />

                <div className="relative rounded-xl border border-border bg-card shadow-xl">
                    {/* Header · title only.
                        F64.5 · chip "Reference / Current version" eliminado (user
                        ask) · era noise visual + confusion (post-F64 los tabs se
                        distinguen por nombre + banner introductory, no necesitan
                        chip categorization). El type TabRole queda como field
                        legacy en la interface pero no se renderea. */}
                    <div className="border-b border-border px-3.5 py-2.5">
                        <h4 className="text-sm font-bold text-foreground leading-tight">{content.title}</h4>
                    </div>

                    <div className="px-3.5 py-3 space-y-3">
                        {/* Purpose */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Purpose
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed whitespace-normal break-words">{content.whatYouSee}</p>
                        </div>

                        {/* Data source */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Data source
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed whitespace-normal break-words">{content.dataSource}</p>
                        </div>

                        {/* Layout */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Layout
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed whitespace-normal break-words">{content.structure}</p>
                        </div>

                        {/* Features · list with accessible bullets.
                            F64.4 · fixes:
                            - min-w-0 + break-words en <span> · el flex parent
                              (li con flex + gap) hacía que el span no shrinkeara
                              respetando el container · text salía por la derecha
                              cortando palabras completas ("year-ol" cut).
                            - Check icon color · text-primary (lime) sobre bg-card
                              blanco tiene contrast malo (Diego a11y rule) ·
                              cambio a text-foreground/70 · legible + neutral. */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                Features
                            </div>
                            <ul role="list" className="space-y-1">
                                {content.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground leading-relaxed">
                                        <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-foreground/70" strokeWidth={2.5} aria-hidden="true" />
                                        <span className="min-w-0 whitespace-normal break-words">{f}</span>
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
    title: 'Library · MRL legacy scope',
    role: 'reference',
    whatYouSee:
        'The MRL you know · modernized. Discovery + sample request + your saved Binders. Aligns to the PRD literal (no specification, no quoting, no pricing).',
    dataSource:
        'MANUFACTURERS registry · same brand binders as MRL classic + your tenant-scoped Binders (formerly Favorites · renamed F63).',
    structure:
        'Sidebar with Binders + Filters + My Setup shortcut · Grid or Shelf view toggle · Brand card → Binder page → Product detail.',
    features: [
        'Grid + Shelf view · bookshelf metaphor preserved (F61)',
        'Binders section (F63) · your saved product groupings per tenant',
        'My Setup panel · dealer terms + preferences (F58b · consolidated)',
        'Sample requests · finishes only guard (per PRD Section 01)',
        'Inspiration panel (F58a) · reference installations with tagged products',
        'Modernized card design · hero image + hover overlays (F62)',
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
    title: 'Products · Strata Preview',
    role: 'current',
    whatYouSee:
        'Superset preview · what MRL could do with Strata capabilities. Adds spec-building, pricing rules, dealer terms, admin config and quote drafts on top of the discovery flow.',
    dataSource:
        'unifiedProducts + SPACE_TYPES (Inspiration · F58a) + custom Binders + dealer relationships + tenant preferences (localStorage per tenant).',
    structure:
        '3-way toggle (Products / Materials / Inspiration) + Grid or Shelf view + density selector · sidebar with Binders + Filters · My Setup 4-tab modal for admin.',
    features: [
        'Grid + Shelf view (F61) · click binder = drill-in filter',
        'Brand profile slide-over · quick look without leaving flow (F59+F60)',
        'Category multi-select from brand profile · Apply filter (F60)',
        'My Setup modal (F58b) · Add · Catalogs · Manufacturers · Preferences',
        'Dealer edit notes + add manufacturer relationships (F58c)',
        'Inspiration mode (F58a) · photos with clickable product tags',
        'Sample requests + tracking pipeline (finishes only)',
        'Tenant preferences · approved brands · compliance · sustainability',
    ],
}

export const TAB_INFO_MY_PROJECTS: TabInfo = {
    title: 'My Projects · Project Builder',
    role: 'current',
    whatYouSee:
        'Project canvas · organize products into rooms and zones for a specific job. RFP-response vehicle per Laura · one shareable link per project. Aligns to PRD P2 (Project Tool · confirmed drag-drop).',
    dataSource:
        'useProjects hook · per-tenant projects in localStorage · products dragged from Library or Products tabs.',
    structure:
        'Project list + canvas view · rooms as containers · zones as sub-groups · products as draggable cards from binders.',
    features: [
        'Drag-and-drop from binders (F51 sprint B) · "easy enough for 80-year-old"',
        'Multi-project per tenant · switch context anytime',
        'Rooms + zones structure · organize by physical space',
        'Add-to-project modal from any product card',
        'localStorage persistence · survives refresh',
        'Future · hub with contacts + docs + timeline (PRD FLAG 3 · needs Jeff validation)',
    ],
}

export const TAB_INFO_MY_SELECTION: TabInfo = {
    title: 'My Selection · Draft submissions',
    role: 'current',
    whatYouSee:
        'Active tenant\'s draft selections · multi-line items, auto-filled buyer info, submit flow. Part of the Strata superset (Products tab flow) · NOT in scope for Library. Neutral about downstream intent (Quote / PO / RFQ) — the dealer decides after submission.',
    dataSource:
        'QuoteContext · multi-draft per tenant in `expert-hub-quotes-{slug}` localStorage.',
    structure:
        '2-col · drafts list + detail with Buyer info + Line items + Totals · Reference number Q-YYYY-NNN-TENANT.',
    features: [
        'Multi-draft · N parallel selections per tenant',
        'Auto-filled buyer info (user + tenant)',
        'Toggle Flat list / By Space Setting grouping',
        'Reference number Q-YYYY-NNN-TENANT auto-generated',
        'localStorage persistence · survives refresh',
    ],
}
